import type { RequestStatus, EventType } from "@prisma/client";

export const EVENT_LABEL: Record<EventType, string> = {
  SUBMITTED: "Request submitted",
  DOCS_RECEIVED: "Documents received",
  STATUS_CHANGE: "Moved to review",
  CORRECTION_REQUESTED: "Correction requested",
  CORRECTION_SUBMITTED: "Correction submitted",
  APPROVED: "Request approved",
  REJECTED: "Request rejected",
  PROCESSING: "Processing started",
  DOCUMENT_UPLOADED: "Final document uploaded",
  READY: "Ready for download",
  COMPLETED: "Downloaded & completed",
  REMARK: "Remark added",
};

/** Human labels for each status. */
export const STATUS_LABEL: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTION_REQUIRED: "Correction Required",
  CORRECTION_SUBMITTED: "Correction Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PROCESSING: "Processing",
  READY: "Ready for Download",
  COMPLETED: "Completed",
};

export type StatusTone = "neutral" | "info" | "warn" | "ok" | "danger";

/** Semantic colour + icon glyph so status never relies on colour alone. */
export const STATUS_TONE: Record<RequestStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "info",
  CORRECTION_REQUIRED: "warn",
  CORRECTION_SUBMITTED: "info",
  APPROVED: "ok",
  REJECTED: "danger",
  PROCESSING: "info",
  READY: "ok",
  COMPLETED: "ok",
};

/**
 * Allowed status transitions. The single source of truth — enforced in every
 * server action. Any status change outside this map is rejected.
 */
export const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["CORRECTION_REQUIRED", "APPROVED", "REJECTED"],
  CORRECTION_REQUIRED: ["CORRECTION_SUBMITTED"],
  CORRECTION_SUBMITTED: ["UNDER_REVIEW"],
  APPROVED: ["PROCESSING"],
  PROCESSING: ["READY"],
  READY: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses where the student must act. */
export function needsStudentAction(status: RequestStatus): boolean {
  return status === "CORRECTION_REQUIRED";
}

/** Statuses that are open (not terminal). */
export function isOpen(status: RequestStatus): boolean {
  return status !== "COMPLETED" && status !== "REJECTED";
}

/** Ordered lifecycle stages shown in the tracking timeline. */
export const TIMELINE_STAGES: { status: RequestStatus; label: string }[] = [
  { status: "SUBMITTED", label: "Submitted" },
  { status: "UNDER_REVIEW", label: "Under Review" },
  { status: "APPROVED", label: "Approved" },
  { status: "PROCESSING", label: "Processing" },
  { status: "READY", label: "Ready for Download" },
];

/** Weight for ordering; used to decide which timeline stages are complete. */
const STAGE_ORDER: RequestStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "PROCESSING",
  "READY",
  "COMPLETED",
];

export function stageIndex(status: RequestStatus): number {
  const i = STAGE_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

/**
 * Which timeline stage (index into TIMELINE_STAGES) the request sits at.
 * Stages before it are complete; correction/rejection map onto the review stage.
 * COMPLETED returns TIMELINE_STAGES.length (every stage done).
 */
export function timelineIndex(status: RequestStatus): number {
  switch (status) {
    case "SUBMITTED":
      return 0;
    case "UNDER_REVIEW":
    case "CORRECTION_REQUIRED":
    case "CORRECTION_SUBMITTED":
    case "REJECTED":
      return 1;
    case "APPROVED":
      return 2;
    case "PROCESSING":
      return 3;
    case "READY":
      return 4;
    case "COMPLETED":
      return TIMELINE_STAGES.length;
    default:
      return 0;
  }
}
