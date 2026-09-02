import type { Metadata } from "next";
import { Files, FilePlus2 } from "lucide-react";
import type { RequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader, Card, EmptyState } from "@/components/primitives";
import { RequestList, type RequestRowData } from "@/components/request-row";
import { FilterTabs, type FilterTab } from "@/components/filter-tabs";
import { LinkButton } from "@/components/button";

export const metadata: Metadata = { title: "My requests" };

const FILTERS: { key: string; label: string; statuses?: RequestStatus[] }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Active", statuses: ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_SUBMITTED", "APPROVED", "PROCESSING"] },
  { key: "action", label: "Action Required", statuses: ["CORRECTION_REQUIRED"] },
  { key: "ready", label: "Ready", statuses: ["READY"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "rejected", label: "Rejected", statuses: ["REJECTED"] },
];

export default async function StudentRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await requireStudent();
  const { filter = "all" } = await searchParams;
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const where: Prisma.DocumentRequestWhereInput = {
    studentId: session.id,
    ...(active.statuses ? { status: { in: active.statuses } } : {}),
  };

  const [requests, counts] = await Promise.all([
    prisma.documentRequest.findMany({
      where,
      include: { documentType: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.documentRequest.groupBy({
      by: ["status"],
      where: { studentId: session.id },
      _count: true,
    }),
  ]);

  const countFor = (statuses?: RequestStatus[]) =>
    statuses
      ? counts.filter((c) => statuses.includes(c.status)).reduce((n, c) => n + c._count, 0)
      : counts.reduce((n, c) => n + c._count, 0);

  const tabs: FilterTab[] = FILTERS.map((f) => ({
    key: f.key,
    label: f.label,
    href: f.key === "all" ? "/student/requests" : `/student/requests?filter=${f.key}`,
    count: countFor(f.statuses),
  }));

  const rows: RequestRowData[] = requests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    documentName: r.documentType.name,
    submittedAt: r.submittedAt,
    status: r.status,
    subline: r.purpose,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="My requests"
        description="Every document request you've submitted."
        actions={
          <LinkButton href="/student/new-request">
            <FilePlus2 className="size-4" aria-hidden />
            New Request
          </LinkButton>
        }
      />
      <FilterTabs tabs={tabs} active={active.key} />
      <Card className="overflow-hidden">
        {rows.length > 0 ? (
          <RequestList requests={rows} basePath="/student/requests" />
        ) : (
          <EmptyState
            icon={Files}
            title={filter === "all" ? "No requests yet" : "Nothing here"}
            description={
              filter === "all"
                ? "You haven't submitted a document request yet."
                : "No requests match this filter."
            }
            action={
              filter === "all" ? (
                <LinkButton href="/student/new-request">
                  <FilePlus2 className="size-4" aria-hidden /> Request a Document
                </LinkButton>
              ) : undefined
            }
          />
        )}
      </Card>
    </div>
  );
}
