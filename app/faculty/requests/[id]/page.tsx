import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { canApprove, canProcess } from "@/lib/roles";
import { STATUS_LABEL } from "@/lib/workflow";
import { fmtDateTime } from "@/lib/format";
import { Card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { RequestTimeline } from "@/components/request-timeline";
import { ActivityLog } from "@/components/activity-log";
import { FileAttachment } from "@/components/file-attachment";
import { RequestActions } from "@/components/faculty/request-actions";

export default async function FacultyRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;

  const req = await prisma.documentRequest.findUnique({
    where: { id },
    include: {
      documentType: true,
      student: true,
      assignedTo: true,
      approvedBy: true,
      files: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" }, include: { actor: true } },
    },
  });
  if (!req) notFound();

  const supporting = req.files.filter((f) => f.category === "SUPPORTING");
  const completed = req.files.filter((f) => f.category === "COMPLETED");

  return (
    <div className="space-y-5">
      <Link href="/faculty/requests" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back to requests
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{req.documentType.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            <code className="tnum text-ink-2">{req.requestNumber}</code> · {req.student.fullName}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      <Card className="p-4">
        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Actions</div>
        <RequestActions
          requestId={req.id}
          status={req.status}
          canApprove={canApprove(staff.role)}
          canProcess={canProcess(staff.role)}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Student</h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Detail label="Name" value={req.student.fullName} />
              <Detail label="Student ID" value={req.student.studentId ?? "—"} />
              <Detail label="Email" value={req.student.email} />
              <Detail label="Department" value={req.student.department ?? "—"} />
              <Detail label="Year" value={req.student.year ?? "—"} />
              <Detail label="Academic year" value={req.academicYear} />
            </dl>
            <div className="mt-4 border-t border-border pt-4">
              <Detail label="Purpose" value={req.purpose} />
            </div>
          </Card>

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

          {completed.length > 0 && (
            <Card className="border-ok/30 p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileCheck2 className="size-4 text-ok" aria-hidden />
                <h2 className="text-sm font-semibold text-ink">Final document</h2>
              </div>
              <div className="space-y-2">
                {completed.map((f) => (
                  <FileAttachment key={f.id} file={f} />
                ))}
              </div>
            </Card>
          )}

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

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Progress</h2>
            <RequestTimeline status={req.status} submittedAt={req.submittedAt} events={req.events} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Details</h2>
            <dl className="space-y-3 text-sm">
              <Detail label="Status" value={STATUS_LABEL[req.status]} />
              <Detail label="Submitted" value={fmtDateTime(req.submittedAt)} />
              <Detail label="Last updated" value={fmtDateTime(req.updatedAt)} />
              <Detail label="Assigned to" value={req.assignedTo?.fullName ?? "Unassigned"} />
              {req.approvedBy && <Detail label="Approved by" value={req.approvedBy.fullName} />}
              {req.currentRemarks && <Detail label="Latest remark" value={req.currentRemarks} />}
              {req.rejectionReason && <Detail label="Rejection reason" value={req.rejectionReason} />}
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
