import Link from "next/link";
import { FilePlus2, Files, CircleDot, TriangleAlert, FileDown, ArrowRight } from "lucide-react";
import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { greeting } from "@/lib/format";
import { isOpen } from "@/lib/workflow";
import { Card, MetricCard, PageHeader, SectionTitle, EmptyState } from "@/components/primitives";
import { RequestList, type RequestRowData } from "@/components/request-row";
import { LinkButton } from "@/components/button";

export default async function StudentDashboard() {
  const session = await requireStudent();
  const [profile, requests] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id } }),
    prisma.documentRequest.findMany({
      where: { studentId: session.id },
      include: { documentType: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const stats = {
    active: requests.filter((r) => isOpen(r.status)).length,
    review: requests.filter((r) => r.status === "UNDER_REVIEW").length,
    action: requests.filter((r) => r.status === "CORRECTION_REQUIRED").length,
    ready: requests.filter((r) => r.status === "READY").length,
  };

  const actionRequired = requests.filter((r) => r.status === "CORRECTION_REQUIRED");
  const recent: RequestRowData[] = requests.slice(0, 6).map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    documentName: r.documentType.name,
    submittedAt: r.submittedAt,
    status: r.status,
    subline: r.purpose,
  }));

  const firstName = (session.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description={
          profile
            ? `${profile.studentId ?? ""} · ${profile.department ?? ""} · ${profile.year ?? ""}`
            : "Student"
        }
        actions={
          <LinkButton href="/student/new-request">
            <FilePlus2 className="size-4" aria-hidden />
            Request a Document
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Active Requests" value={stats.active} icon={Files} />
        <MetricCard label="Under Review" value={stats.review} icon={CircleDot} tone="info" />
        <MetricCard label="Action Required" value={stats.action} icon={TriangleAlert} tone="warn" />
        <MetricCard label="Ready to Download" value={stats.ready} icon={FileDown} tone="ok" />
      </div>

      {actionRequired.length > 0 && (
        <Card className="border-warn/30 bg-warn-soft/40">
          <div className="flex items-start gap-3 p-4">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-ink">Action required</h2>
              <ul className="mt-2 space-y-2">
                {actionRequired.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ink-2">
                      <span className="font-medium text-ink">{r.documentType.name}</span> needs a corrected document.
                    </span>
                    <LinkButton href={`/student/requests/${r.id}`} size="sm" variant="secondary">
                      Review <ArrowRight className="size-3.5" aria-hidden />
                    </LinkButton>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div>
        <SectionTitle aside={<Link href="/student/requests" className="text-sm font-medium text-accent hover:underline">View all</Link>}>
          Recent requests
        </SectionTitle>
        <Card className="mt-3 overflow-hidden">
          {recent.length > 0 ? (
            <RequestList requests={recent} basePath="/student/requests" />
          ) : (
            <EmptyState
              icon={Files}
              title="You haven't submitted a document request yet"
              description="Start by requesting a bonafide certificate, transcript or any official document you need."
              action={
                <LinkButton href="/student/new-request">
                  <FilePlus2 className="size-4" aria-hidden />
                  Request a Document
                </LinkButton>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
