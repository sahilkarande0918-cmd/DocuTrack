import { PrismaClient, type Role, type RequestStatus, type EventType, type NotificationType, type FileCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password123";

function samplePdf(label: string): Uint8Array<ArrayBuffer> {
  // A minimal valid-ish PDF byte stream — enough to download and open as a sample.
  return new TextEncoder().encode(
    `%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n% DocuTrack sample document: ${label}\n%%EOF\n`,
  );
}

async function main() {
  console.log("Seeding DocuTrack…");

  // Clear (order matters for FKs)
  await prisma.notification.deleteMany();
  await prisma.requestEvent.deleteMany();
  await prisma.requestFile.deleteMany();
  await prisma.documentRequest.deleteMany();
  await prisma.documentType.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const mkUser = (
    email: string,
    fullName: string,
    role: Role,
    extra: { studentId?: string; department?: string; year?: string } = {},
  ) => prisma.user.create({ data: { email, fullName, role, passwordHash: hash, ...extra } });

  // --- Users ---
  const [rahul, sneha, aditya] = await Promise.all([
    mkUser("rahul.patil@mitaoe.ac.in", "Rahul Patil", "STUDENT", {
      studentId: "2025BTECS012", department: "Computer Engineering", year: "Third Year",
    }),
    mkUser("sneha.kulkarni@mitaoe.ac.in", "Sneha Kulkarni", "STUDENT", {
      studentId: "2024BTECIT045", department: "Information Technology", year: "Final Year",
    }),
    mkUser("aditya.deshmukh@mitaoe.ac.in", "Aditya Deshmukh", "STUDENT", {
      studentId: "2026BTECME103", department: "Mechanical Engineering", year: "Second Year",
    }),
  ]);

  const [office, approver] = await Promise.all([
    mkUser("office@mitaoe.ac.in", "Meena Joshi", "OFFICE_STAFF", { department: "Examination Office" }),
    mkUser("hod.comp@mitaoe.ac.in", "Dr. S. R. Kulkarni", "APPROVER", { department: "Computer Engineering" }),
    mkUser("prof@mitaoe.ac.in", "Prof. A. B. Pawar", "FACULTY", { department: "Computer Engineering" }),
    mkUser("admin@mitaoe.ac.in", "System Administrator", "ADMIN", { department: "IT Services" }),
  ]);

  // --- Document types ---
  const docTypeData = [
    {
      slug: "bonafide", name: "Bonafide Certificate",
      description: "Proof that you are a bona fide student of the institute.",
      requirements: { info: ["Department", "Year"], files: [
        { key: "college_id", label: "College ID card" },
        { key: "fee_receipt", label: "Latest fee receipt" },
      ]},
    },
    {
      slug: "character", name: "Character Certificate",
      description: "Certificate of conduct issued on completion or transfer.",
      requirements: { info: [], files: [{ key: "college_id", label: "College ID card" }] },
    },
    {
      slug: "transcript", name: "Official Transcript",
      description: "Consolidated academic record across all semesters.",
      requirements: { info: ["Number of copies"], files: [
        { key: "college_id", label: "College ID card" },
        { key: "marksheets", label: "All semester marksheets" },
      ]},
    },
    {
      slug: "leaving", name: "Leaving Certificate",
      description: "Issued when you leave or graduate from the institute.",
      requirements: { info: [], files: [
        { key: "college_id", label: "College ID card" },
        { key: "no_dues", label: "No-dues certificate" },
      ]},
    },
    {
      slug: "internship", name: "Internship Letter",
      description: "Official letter confirming enrolment for an internship.",
      requirements: { info: ["Company name", "Duration"], files: [
        { key: "college_id", label: "College ID card" },
      ]},
    },
  ];
  const docTypes: Record<string, string> = {};
  for (const d of docTypeData) {
    const created = await prisma.documentType.create({ data: { ...d, active: true } });
    docTypes[d.slug] = created.id;
  }

  // --- Request factory ---
  let counter = 0;
  const year = new Date().getFullYear();
  function nextNumber() {
    counter += 1;
    return `DT-${year}-${String(counter).padStart(5, "0")}`;
  }
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

  async function seedRequest(opts: {
    student: { id: string; fullName: string };
    docSlug: string;
    status: RequestStatus;
    submittedDaysAgo: number;
    purpose: string;
    academicYear: string;
    assignedTo?: { id: string };
    approvedBy?: { id: string };
    remark?: string;
    rejectionReason?: string;
    events: { type: EventType; prev?: RequestStatus; next?: RequestStatus; remarks?: string; actorId?: string; daysAgo: number }[];
    supporting: string[]; // labels
    completed?: string; // label of final doc
    notify: { title: string; message: string; type: NotificationType; daysAgo: number; read?: boolean }[];
  }) {
    const docTypeId = docTypes[opts.docSlug];
    const req = await prisma.documentRequest.create({
      data: {
        requestNumber: nextNumber(),
        studentId: opts.student.id,
        documentTypeId: docTypeId,
        purpose: opts.purpose,
        academicYear: opts.academicYear,
        status: opts.status,
        submittedAt: daysAgo(opts.submittedDaysAgo),
        assignedToId: opts.assignedTo?.id,
        approvedById: opts.approvedBy?.id,
        approvedAt: opts.approvedBy ? daysAgo(Math.max(0, opts.submittedDaysAgo - 2)) : undefined,
        completedAt: opts.status === "COMPLETED" ? daysAgo(1) : undefined,
        currentRemarks: opts.remark,
        rejectionReason: opts.rejectionReason,
      },
    });

    for (const [i, f] of opts.supporting.entries()) {
      const data = samplePdf(f);
      await prisma.requestFile.create({
        data: {
          requestId: req.id, uploadedById: opts.student.id, fileName: `${f.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          contentType: "application/pdf", size: data.length, category: "SUPPORTING" as FileCategory,
          requirementKey: `file_${i}`, data,
        },
      });
    }
    if (opts.completed) {
      const data = samplePdf(opts.completed);
      await prisma.requestFile.create({
        data: {
          requestId: req.id, uploadedById: (opts.assignedTo ?? office).id, fileName: `${opts.completed.replace(/\s+/g, "-").toLowerCase()}.pdf`,
          contentType: "application/pdf", size: data.length, category: "COMPLETED" as FileCategory,
          requirementKey: "final", data,
        },
      });
    }
    for (const e of opts.events) {
      await prisma.requestEvent.create({
        data: {
          requestId: req.id, actorId: e.actorId ?? opts.student.id, eventType: e.type,
          previousStatus: e.prev, newStatus: e.next, remarks: e.remarks, createdAt: daysAgo(e.daysAgo),
        },
      });
    }
    for (const n of opts.notify) {
      await prisma.notification.create({
        data: {
          recipientId: opts.student.id, requestId: req.id, title: n.title, message: n.message,
          type: n.type, read: n.read ?? false, createdAt: daysAgo(n.daysAgo),
        },
      });
    }
    return req;
  }

  // 1. Submitted, awaiting review
  await seedRequest({
    student: rahul, docSlug: "bonafide", status: "SUBMITTED", submittedDaysAgo: 0,
    purpose: "Required for a bank education-loan application.", academicYear: "2025-26",
    supporting: ["College ID card", "Latest fee receipt"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 0 },
      { type: "DOCS_RECEIVED", daysAgo: 0 },
    ],
    notify: [{ title: "Request submitted", message: "Your Bonafide Certificate request has been received.", type: "INFO", daysAgo: 0 }],
  });

  // 2. Under review
  await seedRequest({
    student: sneha, docSlug: "transcript", status: "UNDER_REVIEW", submittedDaysAgo: 2,
    purpose: "For a Master's application abroad.", academicYear: "2025-26", assignedTo: office,
    supporting: ["College ID card", "All semester marksheets"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 2 },
      { type: "DOCS_RECEIVED", daysAgo: 2 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 1 },
    ],
    notify: [{ title: "Under review", message: "Your Official Transcript request is now under review.", type: "INFO", daysAgo: 1 }],
  });

  // 3. Correction required (action for student)
  await seedRequest({
    student: rahul, docSlug: "transcript", status: "CORRECTION_REQUIRED", submittedDaysAgo: 4,
    purpose: "For a scholarship application.", academicYear: "2025-26", assignedTo: office,
    remark: "Please upload a clearer copy of your college ID — the current scan is unreadable.",
    supporting: ["College ID card", "All semester marksheets"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 4 },
      { type: "DOCS_RECEIVED", daysAgo: 4 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 3 },
      { type: "CORRECTION_REQUESTED", prev: "UNDER_REVIEW", next: "CORRECTION_REQUIRED", actorId: office.id, daysAgo: 2, remarks: "Please upload a clearer copy of your college ID." },
    ],
    notify: [{ title: "Correction required", message: "Please upload a clearer copy of your college ID.", type: "ACTION", daysAgo: 2 }],
  });

  // 4. Approved → processing
  await seedRequest({
    student: sneha, docSlug: "bonafide", status: "PROCESSING", submittedDaysAgo: 6,
    purpose: "For a passport application.", academicYear: "2025-26", assignedTo: office, approvedBy: approver,
    supporting: ["College ID card", "Latest fee receipt"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 6 },
      { type: "DOCS_RECEIVED", daysAgo: 6 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 5 },
      { type: "APPROVED", prev: "UNDER_REVIEW", next: "APPROVED", actorId: approver.id, daysAgo: 4 },
      { type: "PROCESSING", prev: "APPROVED", next: "PROCESSING", actorId: office.id, daysAgo: 3 },
    ],
    notify: [
      { title: "Approved", message: "Your Bonafide Certificate has been approved.", type: "SUCCESS", daysAgo: 4, read: true },
      { title: "Processing", message: "Your Bonafide Certificate is being prepared.", type: "INFO", daysAgo: 3 },
    ],
  });

  // 5. Ready for download
  await seedRequest({
    student: rahul, docSlug: "internship", status: "READY", submittedDaysAgo: 8,
    purpose: "Internship at Infosys, Pune.", academicYear: "2025-26", assignedTo: office, approvedBy: approver,
    supporting: ["College ID card"], completed: "Internship Letter - Rahul Patil",
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 8 },
      { type: "DOCS_RECEIVED", daysAgo: 8 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 7 },
      { type: "APPROVED", prev: "UNDER_REVIEW", next: "APPROVED", actorId: approver.id, daysAgo: 6 },
      { type: "PROCESSING", prev: "APPROVED", next: "PROCESSING", actorId: office.id, daysAgo: 5 },
      { type: "DOCUMENT_UPLOADED", actorId: office.id, daysAgo: 2 },
      { type: "READY", prev: "PROCESSING", next: "READY", actorId: office.id, daysAgo: 2 },
    ],
    notify: [{ title: "Ready to download", message: "Your Internship Letter is ready to download.", type: "SUCCESS", daysAgo: 2 }],
  });

  // 6. Completed
  await seedRequest({
    student: aditya, docSlug: "bonafide", status: "COMPLETED", submittedDaysAgo: 20,
    purpose: "For a railway concession pass.", academicYear: "2025-26", assignedTo: office, approvedBy: approver,
    supporting: ["College ID card", "Latest fee receipt"], completed: "Bonafide Certificate - Aditya Deshmukh",
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 20 },
      { type: "DOCS_RECEIVED", daysAgo: 20 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 19 },
      { type: "APPROVED", prev: "UNDER_REVIEW", next: "APPROVED", actorId: approver.id, daysAgo: 18 },
      { type: "PROCESSING", prev: "APPROVED", next: "PROCESSING", actorId: office.id, daysAgo: 17 },
      { type: "READY", prev: "PROCESSING", next: "READY", actorId: office.id, daysAgo: 16 },
      { type: "COMPLETED", prev: "READY", next: "COMPLETED", actorId: aditya.id, daysAgo: 15 },
    ],
    notify: [{ title: "Completed", message: "Your Bonafide Certificate has been downloaded.", type: "SUCCESS", daysAgo: 15, read: true }],
  });

  // 7. Rejected
  await seedRequest({
    student: aditya, docSlug: "leaving", status: "REJECTED", submittedDaysAgo: 10,
    purpose: "Transferring to another college.", academicYear: "2025-26", assignedTo: office, approvedBy: approver,
    rejectionReason: "No-dues certificate is missing. Please clear library dues and re-apply.",
    supporting: ["College ID card", "No-dues certificate"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 10 },
      { type: "DOCS_RECEIVED", daysAgo: 10 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 9 },
      { type: "REJECTED", prev: "UNDER_REVIEW", next: "REJECTED", actorId: approver.id, daysAgo: 8, remarks: "No-dues certificate is missing." },
    ],
    notify: [{ title: "Request not approved", message: "No-dues certificate is missing. Please clear dues and re-apply.", type: "WARNING", daysAgo: 8 }],
  });

  // 8. Correction submitted, back in queue
  await seedRequest({
    student: sneha, docSlug: "character", status: "CORRECTION_SUBMITTED", submittedDaysAgo: 5,
    purpose: "For a job application.", academicYear: "2025-26", assignedTo: office,
    supporting: ["College ID card"],
    events: [
      { type: "SUBMITTED", next: "SUBMITTED", daysAgo: 5 },
      { type: "DOCS_RECEIVED", daysAgo: 5 },
      { type: "STATUS_CHANGE", prev: "SUBMITTED", next: "UNDER_REVIEW", actorId: office.id, daysAgo: 4 },
      { type: "CORRECTION_REQUESTED", prev: "UNDER_REVIEW", next: "CORRECTION_REQUIRED", actorId: office.id, daysAgo: 3, remarks: "ID photo unclear." },
      { type: "CORRECTION_SUBMITTED", prev: "CORRECTION_REQUIRED", next: "CORRECTION_SUBMITTED", daysAgo: 1 },
    ],
    notify: [{ title: "Correction submitted", message: "Your corrected documents were received and will be reviewed.", type: "INFO", daysAgo: 1 }],
  });

  console.log(`Seeded ${counter} requests, ${docTypeData.length} document types, and demo users.`);
  console.log(`All demo accounts use the password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
