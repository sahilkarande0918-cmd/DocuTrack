"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EventType, NotificationType, RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireStaff } from "@/lib/session";
import { canApprove, canProcess, isStaff } from "@/lib/roles";
import { canTransition } from "@/lib/workflow";
import { newRequestSchema, MAX_FILE_BYTES, ACCEPTED_TYPES } from "@/lib/validation";
import { sendEmail, EMAIL_TEMPLATES, appUrl } from "@/lib/email";

export type ActionResult = { error?: string; ok?: boolean };

/* ------------------------------------------------------------------ helpers */

async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DT-${year}-`;
  // Sequential within the year; retried by the unique constraint on collision.
  const count = await prisma.documentRequest.count({
    where: { requestNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

type FileEntry = { key: string | null; file: File };

/** Pull uploaded files out of FormData. Client sends them as `file:<key>`. */
function collectFiles(formData: FormData): FileEntry[] {
  const out: FileEntry[] = [];
  for (const [name, value] of formData.entries()) {
    if (name.startsWith("file:") && value instanceof File && value.size > 0) {
      out.push({ key: name.slice(5) || null, file: value });
    }
  }
  return out;
}

function validateFiles(files: FileEntry[]): string | null {
  if (files.length === 0) return "Attach the required supporting document(s).";
  for (const { file } of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) return `Unsupported file type: ${file.name}. Use PDF, JPG or PNG.`;
    if (file.size > MAX_FILE_BYTES) return `${file.name} is too large. Maximum size is 5 MB.`;
  }
  return null;
}

async function saveFiles(
  requestId: string,
  uploadedById: string,
  files: FileEntry[],
  category: "SUPPORTING" | "COMPLETED",
) {
  for (const { key, file } of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    await prisma.requestFile.create({
      data: {
        requestId,
        uploadedById,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        category,
        requirementKey: key,
        data: buf,
      },
    });
  }
}

async function logEvent(args: {
  requestId: string;
  actorId?: string | null;
  eventType: EventType;
  previousStatus?: RequestStatus;
  newStatus?: RequestStatus;
  remarks?: string | null;
}) {
  await prisma.requestEvent.create({ data: { ...args } });
}

async function notify(args: {
  recipientId: string;
  requestId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  await prisma.notification.create({ data: { ...args } });

  // Also send a real email to the recipient's institute address (no-op if
  // EmailJS isn't configured). Fire-and-forget — never blocks the workflow.
  const template = EMAIL_TEMPLATES.notification();
  if (!template) return;
  const recipient = await prisma.user.findUnique({
    where: { id: args.recipientId },
    select: { email: true, fullName: true, role: true },
  });
  if (!recipient) return;
  const area = isStaff(recipient.role) ? "faculty" : "student";
  await sendEmail(template, {
    to_email: recipient.email,
    to_name: recipient.fullName,
    title: args.title,
    message: args.message,
    link: `${appUrl()}/${area}/requests/${args.requestId}`,
  });
}

function refreshStudent(id: string) {
  revalidatePath("/student/dashboard");
  revalidatePath("/student/requests");
  revalidatePath(`/student/requests/${id}`);
  revalidatePath("/student/notifications");
  revalidatePath("/student/documents");
}

function refreshStaff(id: string) {
  revalidatePath("/faculty/dashboard");
  revalidatePath("/faculty/requests");
  revalidatePath(`/faculty/requests/${id}`);
  revalidatePath("/faculty/corrections");
  revalidatePath("/faculty/approvals");
  revalidatePath("/faculty/completed");
}

/* --------------------------------------------------------------- student: create */

export async function createRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const student = await requireStudent();

  const parsed = newRequestSchema.safeParse({
    documentTypeId: formData.get("documentTypeId"),
    purpose: formData.get("purpose"),
    academicYear: formData.get("academicYear"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please complete the form." };
  }

  const docType = await prisma.documentType.findUnique({ where: { id: parsed.data.documentTypeId } });
  if (!docType || !docType.active) return { error: "That document is not available." };

  const files = collectFiles(formData);
  const fileError = validateFiles(files);
  if (fileError) return { error: fileError };

  const requestNumber = await generateRequestNumber();
  const request = await prisma.documentRequest.create({
    data: {
      requestNumber,
      studentId: student.id,
      documentTypeId: docType.id,
      purpose: parsed.data.purpose,
      academicYear: parsed.data.academicYear,
      status: "SUBMITTED",
    },
  });

  await saveFiles(request.id, student.id, files, "SUPPORTING");
  await logEvent({ requestId: request.id, actorId: student.id, eventType: "SUBMITTED", newStatus: "SUBMITTED" });
  await logEvent({ requestId: request.id, actorId: student.id, eventType: "DOCS_RECEIVED" });
  await notify({
    recipientId: student.id,
    requestId: request.id,
    title: `Request ${requestNumber} submitted`,
    message: `Your ${docType.name} request has been received and is awaiting review.`,
    type: "INFO",
  });

  refreshStudent(request.id);
  redirect(`/student/requests/${request.id}?created=1`);
}

/* ------------------------------------------------------- student: submit correction */

export async function submitCorrection(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const student = await requireStudent();
  const requestId = String(formData.get("requestId") ?? "");

  const request = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: { documentType: true },
  });
  if (!request || request.studentId !== student.id) return { error: "Request not found." };
  if (request.status !== "CORRECTION_REQUIRED") return { error: "This request is not awaiting a correction." };

  const files = collectFiles(formData);
  const fileError = validateFiles(files);
  if (fileError) return { error: fileError };

  await saveFiles(request.id, student.id, files, "SUPPORTING");
  await prisma.documentRequest.update({
    where: { id: request.id },
    data: { status: "CORRECTION_SUBMITTED" },
  });
  await logEvent({
    requestId: request.id,
    actorId: student.id,
    eventType: "CORRECTION_SUBMITTED",
    previousStatus: "CORRECTION_REQUIRED",
    newStatus: "CORRECTION_SUBMITTED",
  });
  if (request.assignedToId) {
    await notify({
      recipientId: request.assignedToId,
      requestId: request.id,
      title: `Correction submitted for ${request.requestNumber}`,
      message: `${student.name} re-submitted documents for the ${request.documentType.name} request.`,
      type: "INFO",
    });
  }

  refreshStudent(request.id);
  refreshStaff(request.id);
  return { ok: true };
}

/* --------------------------------------------------------------- staff: transitions */

async function loadForStaff(requestId: string) {
  return prisma.documentRequest.findUnique({
    where: { id: requestId },
    include: { documentType: true, student: true },
  });
}

/** SUBMITTED or CORRECTION_SUBMITTED → UNDER_REVIEW; claims the request. */
export async function startReview(requestId: string) {
  const staff = await requireStaff();
  const req = await loadForStaff(requestId);
  if (!req) return;
  if (req.status !== "SUBMITTED" && req.status !== "CORRECTION_SUBMITTED") return;

  await prisma.documentRequest.update({
    where: { id: req.id },
    data: { status: "UNDER_REVIEW", assignedToId: req.assignedToId ?? staff.id },
  });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "STATUS_CHANGE",
    previousStatus: req.status,
    newStatus: "UNDER_REVIEW",
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `${req.requestNumber} is under review`,
    message: `Your ${req.documentType.name} request is now being reviewed.`,
    type: "INFO",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
}

export async function requestCorrection(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!canProcess(staff.role)) return { error: "You are not permitted to do that." };
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Describe what the student needs to correct." };

  const req = await loadForStaff(requestId);
  if (!req) return { error: "Request not found." };
  if (!canTransition(req.status, "CORRECTION_REQUIRED"))
    return { error: "A correction can only be requested while under review." };

  await prisma.documentRequest.update({
    where: { id: req.id },
    data: { status: "CORRECTION_REQUIRED", currentRemarks: reason },
  });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "CORRECTION_REQUESTED",
    previousStatus: req.status,
    newStatus: "CORRECTION_REQUIRED",
    remarks: reason,
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `Correction required for ${req.requestNumber}`,
    message: reason,
    type: "ACTION",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
  return { ok: true };
}

export async function approveRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!canApprove(staff.role)) return { error: "Only an authorized approver can approve requests." };
  const requestId = String(formData.get("requestId") ?? "");
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  const req = await loadForStaff(requestId);
  if (!req) return { error: "Request not found." };
  if (!canTransition(req.status, "APPROVED")) return { error: "This request cannot be approved from its current state." };

  await prisma.documentRequest.update({
    where: { id: req.id },
    data: { status: "APPROVED", approvedById: staff.id, approvedAt: new Date(), currentRemarks: remarks },
  });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "APPROVED",
    previousStatus: req.status,
    newStatus: "APPROVED",
    remarks,
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `${req.requestNumber} approved`,
    message: `Your ${req.documentType.name} request has been approved and is being processed.`,
    type: "SUCCESS",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
  return { ok: true };
}

export async function rejectRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!canApprove(staff.role)) return { error: "Only an authorized approver can reject requests." };
  const requestId = String(formData.get("requestId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Give the student a reason for the rejection." };

  const req = await loadForStaff(requestId);
  if (!req) return { error: "Request not found." };
  if (!canTransition(req.status, "REJECTED")) return { error: "This request cannot be rejected from its current state." };

  await prisma.documentRequest.update({
    where: { id: req.id },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "REJECTED",
    previousStatus: req.status,
    newStatus: "REJECTED",
    remarks: reason,
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `${req.requestNumber} was not approved`,
    message: reason,
    type: "WARNING",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
  return { ok: true };
}

export async function startProcessing(requestId: string) {
  const staff = await requireStaff();
  const req = await loadForStaff(requestId);
  if (!req || !canTransition(req.status, "PROCESSING")) return;

  await prisma.documentRequest.update({ where: { id: req.id }, data: { status: "PROCESSING" } });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "PROCESSING",
    previousStatus: req.status,
    newStatus: "PROCESSING",
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `${req.requestNumber} is being processed`,
    message: `Your ${req.documentType.name} is being prepared.`,
    type: "INFO",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
}

export async function uploadFinalDocument(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!canProcess(staff.role)) return { error: "You are not permitted to do that." };
  const requestId = String(formData.get("requestId") ?? "");

  const req = await loadForStaff(requestId);
  if (!req) return { error: "Request not found." };
  if (!canTransition(req.status, "READY")) return { error: "Upload the final document while the request is processing." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the completed document to upload." };
  if (!ACCEPTED_TYPES.includes(file.type)) return { error: "Use a PDF, JPG or PNG for the final document." };
  if (file.size > MAX_FILE_BYTES) return { error: "The document is too large. Maximum size is 5 MB." };

  await saveFiles(req.id, staff.id, [{ key: "final", file }], "COMPLETED");
  await prisma.documentRequest.update({ where: { id: req.id }, data: { status: "READY" } });
  await logEvent({ requestId: req.id, actorId: staff.id, eventType: "DOCUMENT_UPLOADED" });
  await logEvent({
    requestId: req.id,
    actorId: staff.id,
    eventType: "READY",
    previousStatus: "PROCESSING",
    newStatus: "READY",
  });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `Your ${req.documentType.name} is ready`,
    message: `${req.requestNumber} is ready to download.`,
    type: "SUCCESS",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
  return { ok: true };
}

export async function addRemark(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");
  const remark = String(formData.get("remark") ?? "").trim();
  if (remark.length < 2) return { error: "Enter a remark." };

  const req = await loadForStaff(requestId);
  if (!req) return { error: "Request not found." };

  await prisma.documentRequest.update({ where: { id: req.id }, data: { currentRemarks: remark } });
  await logEvent({ requestId: req.id, actorId: staff.id, eventType: "REMARK", remarks: remark });
  await notify({
    recipientId: req.studentId,
    requestId: req.id,
    title: `Note added to ${req.requestNumber}`,
    message: remark,
    type: "INFO",
  });
  refreshStaff(req.id);
  refreshStudent(req.id);
  return { ok: true };
}
