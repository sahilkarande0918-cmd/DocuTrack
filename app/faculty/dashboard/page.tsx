import Link from "next/link";
import { Files, Inbox, TriangleAlert, BadgeCheck, Cog, CheckCircle2, ArrowRight } from "lucide-react";
import type { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { greeting, fmtDateTime } from "@/lib/format";
import { EVENT_LABEL } from "@/lib/workflow";
import { PageHeader, Card, MetricCard, SectionTitle, EmptyState } from "@/components/primitives";
import { RequestList, type RequestRowData } from "@/components/request-row";

export default async function FacultyDashboard() {
  const staff = await requireStaff();

  const grouped = await prisma.documentRequest.groupBy({ by: ["status"], _count: true });
  const count = (s: RequestStatus) => grouped.find((g) => g.status === s)?._count ?? 0;
  const total = grouped.reduce((n, g) => n + g._count, 0);

  const [attention, recentEvents] = await Promise.all([
    prisma.documentRequest.findMany({
      where: { status: { in: ["SUBMITTED", "CORRECTION_SUBMITTED", "UNDER_REVIEW"] } },
      include: { documentType: true, student: true },
      orderBy: { submittedAt: "asc" },
      take: 8,
    }),
    prisma.requestEvent.findMany({
      include: { request: { include: { documentType: true } }, actor: true },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  const attentionRows: RequestRowData[] = attention.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    documentName: r.documentType.name,
    submittedAt: r.submittedAt,
    status: r.status,
    subline: r.student.fullName,
  }));

  const firstName = (staff.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting()}, ${firstName}`} description="Document request workload across the office." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Total" value={total} icon={Files} />
        <MetricCard label="Pending Review" value={count("SUBMITTED") + count("CORRECTION_SUBMITTED")} icon={Inbox} tone="info" />
        <MetricCard label="Needs Correction" value={count("CORRECTION_REQUIRED")} icon={TriangleAlert} tone="warn" />
        <MetricCard label="Awaiting Approval" value={count("UNDER_REVIEW")} icon={BadgeCheck} tone="info" />
        <MetricCard label="Processing" value={count("PROCESSING") + count("APPROVED")} icon={Cog} />
        <MetricCard label="Completed" value={count("COMPLETED") + count("READY")} icon={CheckCircle2} tone="ok" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle aside={<Link href="/faculty/requests" className="text-sm font-medium text-accent hover:underline">All requests</Link>}>
            Requests requiring attention
          </SectionTitle>
          <Card className="mt-3 overflow-hidden">
            {attentionRows.length > 0 ? (
              <RequestList requests={attentionRows} basePath="/faculty/requests" />
            ) : (
              <EmptyState icon={CheckCircle2} title="No requests require your attention" description="Every request is either completed or waiting on a student." />
            )}
          </Card>
        </div>

        <div>
          <SectionTitle>Recent activity</SectionTitle>
          <Card className="mt-3 p-4">
            {recentEvents.length > 0 ? (
              <ul className="space-y-3">
                {recentEvents.map((e) => (
                  <li key={e.id} className="text-sm">
                    <Link href={`/faculty/requests/${e.requestId}`} className="font-medium text-ink hover:text-accent">
                      {e.request.documentType.name}
                    </Link>
                    <span className="text-muted"> — {EVENT_LABEL[e.eventType].toLowerCase()}</span>
                    <div className="text-xs text-faint tnum">{fmtDateTime(e.createdAt)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No activity yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
