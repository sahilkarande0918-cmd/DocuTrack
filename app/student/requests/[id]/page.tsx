import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, TriangleAlert, FileCheck2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { STATUS_LABEL } from "@/lib/workflow";
import { fmtDateTime } from "@/lib/format";
import { Card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { RequestTimeline } from "@/components/request-timeline";
import { ActivityLog } from "@/components/activity-log";
import { FileAttachment } from "@/components/file-attachment";
import { CorrectionForm } from "./correction-form";

export default async function StudentRequestDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await requireStudent();
  const { id } = await params;
  const { created } = await searchParams;

  const req = await prisma.documentRequest.findFirst({
    where: { id, studentId: session.id },
    include: {
      documentType: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: true } },
    },
  });
  if (!req) notFound();

  const supporting = req.files.filter((f) => f.category === "SUPPORTING");
  const completed = req.files.filter((f) => f.category === "COMPLETED");
  const isReady = req.status === "READY" || req.status === "COMPLETED";

  return (
    <div className="space-y-5">
      <Link href="/student/requests" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to requests
      </Link>

      {created && (
        <div className="flex items-start gap-2 rounded-lg border border-ok/30 bg-ok-soft px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">Request submitted</p>
            <p className="text-sm text-ink-2">
              Your request ID is <code className="font-medium tnum text-ink">{req.requestNumber}</code>. You'll be
              notified as it progresses.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{req.documentType.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            Request ID <code className="tnum text-ink-2">{req.requestNumber}</code>
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">Progress</h2>
            <RequestTimeline status={req.status} submittedAt={req.submittedAt} events={req.events} />
          </Card>

          {req.status === "CORRECTION_REQUIRED" && (
            <Card className="border-warn/30 p-5">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-4 text-warn" aria-hidden />
                <h2 className="text-sm font-semibold text-ink">Correction required</h2>
              </div>
              {req.currentRemarks && <p className="mt-2 text-sm text-ink-2">{req.currentRemarks}</p>}
              <div className="mt-4">
                <CorrectionForm requestId={req.id} />
              </div>
            </Card>
          )}

          {req.status === "REJECTED" && (
            <Card className="border-danger/30 bg-danger-soft/40 p-5">
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-danger" aria-hidden />
                <h2 className="text-sm font-semibold text-ink">Request not approved</h2>
              </div>
              {req.rejectionReason && <p className="mt-2 text-sm text-ink-2">{req.rejectionReason}</p>}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Supporting documents</h2>
            {supporting.length > 0 ? (
              <div className="space-y-2">
                {supporting.map((f) => (
                  <FileAttachment key={f.id} file={f} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No supporting documents attached.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink">Activity</h2>
            <ActivityLog
              events={req.events.map((e) => ({
                id: e.id,
                eventType: e.eventType,
                remarks: e.remarks,
                createdAt: e.createdAt,
                actorName: e.actor?.fullName ?? null,
              }))}
            />
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {isReady && completed.length > 0 && (
            <Card className="border-ok/40 bg-ok-soft/40 p-5">
              <div className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-ok" aria-hidden />
                <h2 className="text-sm font-semibold text-ink">Your {req.documentType.name} is ready</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">Download your official document below.</p>
              <div className="mt-3 space-y-2">
                {completed.map((f) => (
                  <a
                    key={f.id}
                    href={`/api/files/${f.id}`}
                    target="_blank"
                    rel="noopener"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover"
                  >
                    <Download className="size-4" aria-hidden /> Download Document
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Details</h2>
            <dl className="space-y-3 text-sm">
              <Detail label="Status" value={STATUS_LABEL[req.status]} />
              <Detail label="Purpose" value={req.purpose} />
              <Detail label="Academic year" value={req.academicYear} />
              <Detail label="Submitted" value={fmtDateTime(req.submittedAt)} />
              <Detail label="Last updated" value={fmtDateTime(req.updatedAt)} />
              {req.currentRemarks && req.status !== "CORRECTION_REQUIRED" && (
                <Detail label="Remarks" value={req.currentRemarks} />
              )}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-ink-2">{value}</dd>
    </div>
  );
}
