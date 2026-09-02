"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  BadgeCheck,
  XCircle,
  TriangleAlert,
  Cog,
  Upload,
  MessageSquarePlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { RequestStatus } from "@prisma/client";
import {
  startReview,
  startProcessing,
  requestCorrection,
  approveRequest,
  rejectRequest,
  uploadFinalDocument,
  addRemark,
  type ActionResult,
} from "@/lib/actions/request-actions";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { buttonClass } from "@/components/button";
import { ACCEPTED_HINT, ACCEPTED_TYPES } from "@/lib/validation";

export function RequestActions({
  requestId,
  status,
  canApprove,
  canProcess,
}: {
  requestId: string;
  status: RequestStatus;
  canApprove: boolean;
  canProcess: boolean;
}) {
  const terminal = status === "COMPLETED" || status === "REJECTED";
  const showReview = status === "SUBMITTED" || status === "CORRECTION_SUBMITTED";
  const inReview = status === "UNDER_REVIEW";
  const showProcess = status === "APPROVED";
  const showUpload = status === "PROCESSING";

  return (
    <div className="flex flex-wrap gap-2">
      {showReview && canProcess && (
        <form action={startReview.bind(null, requestId)}>
          <SubmitButton icon={ClipboardCheck}>Start review</SubmitButton>
        </form>
      )}

      {inReview && canApprove && (
        <ActionModal
          requestId={requestId}
          action={approveRequest}
          title="Approve request"
          submitLabel="Approve"
          trigger={{ label: "Approve", icon: BadgeCheck, className: buttonClass("primary") }}
        >
          <Textarea name="remarks" label="Remarks (optional)" placeholder="Any note for the student…" required={false} />
        </ActionModal>
      )}

      {inReview && canApprove && (
        <ActionModal
          requestId={requestId}
          action={rejectRequest}
          title="Reject request"
          submitLabel="Reject request"
          submitVariant="danger"
          trigger={{ label: "Reject", icon: XCircle, className: buttonClass("secondary") }}
        >
          <Textarea name="reason" label="Reason for rejection" placeholder="Explain why this request can't be fulfilled." required />
        </ActionModal>
      )}

      {inReview && canProcess && (
        <ActionModal
          requestId={requestId}
          action={requestCorrection}
          title="Request a correction"
          submitLabel="Send correction request"
          trigger={{ label: "Request correction", icon: TriangleAlert, className: buttonClass("secondary") }}
        >
          <Textarea name="reason" label="What needs correcting?" placeholder="e.g. Please upload a clearer copy of your college ID." required />
        </ActionModal>
      )}

      {showProcess && canProcess && (
        <form action={startProcessing.bind(null, requestId)}>
          <SubmitButton icon={Cog}>Start processing</SubmitButton>
        </form>
      )}

      {showUpload && canProcess && (
        <ActionModal
          requestId={requestId}
          action={uploadFinalDocument}
          title="Upload final document"
          submitLabel="Upload & mark ready"
          trigger={{ label: "Upload final document", icon: Upload, className: buttonClass("primary") }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-2">Completed document</label>
            <input
              type="file"
              name="file"
              accept={ACCEPTED_TYPES.join(",")}
              required
              className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:bg-border"
            />
            <p className="mt-1 text-xs text-faint">{ACCEPTED_HINT}</p>
          </div>
        </ActionModal>
      )}

      {!terminal && canProcess && (
        <ActionModal
          requestId={requestId}
          action={addRemark}
          title="Add a remark"
          submitLabel="Add remark"
          trigger={{ label: "Add remark", icon: MessageSquarePlus, className: buttonClass("ghost") }}
        >
          <Textarea name="remark" label="Remark" placeholder="Add an internal note visible to the student." required />
        </ActionModal>
      )}

      {terminal && (
        <p className="text-sm text-muted">
          This request is {status === "COMPLETED" ? "completed" : "closed"}. No further action is required.
        </p>
      )}
    </div>
  );
}

function ActionModal({
  requestId,
  action,
  title,
  submitLabel,
  submitVariant = "primary",
  trigger,
  children,
}: {
  requestId: string;
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  title: string;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
  trigger: { label: string; icon: React.ComponentType<{ className?: string }>; className: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {});
  const router = useRouter();
  const Icon = trigger.icon;

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <>
      <button onClick={() => setOpen(true)} className={trigger.className}>
        <Icon className="size-4" aria-hidden />
        {trigger.label}
      </button>
      <Modal open={open} onClose={() => !pending && setOpen(false)} title={title}>
        {state.error && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.error}
          </div>
        )}
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="requestId" value={requestId} />
          {children}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")} disabled={pending}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass(submitVariant, "sm")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {submitLabel}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Textarea({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <textarea
        name={name}
        rows={3}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      />
    </label>
  );
}
