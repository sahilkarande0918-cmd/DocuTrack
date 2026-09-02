import type { LucideIcon } from "lucide-react";
import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/primitives";
import { RequestList, type RequestRowData } from "@/components/request-row";

export async function RequestQueue({
  title,
  description,
  statuses,
  order = "asc",
  empty,
}: {
  title: string;
  description: string;
  statuses: RequestStatus[];
  order?: "asc" | "desc";
  empty: { icon: LucideIcon; title: string; description: string };
}) {
  const orderBy: Prisma.DocumentRequestOrderByWithRelationInput =
    order === "asc" ? { submittedAt: "asc" } : { updatedAt: "desc" };

  const requests = await prisma.documentRequest.findMany({
    where: { status: { in: statuses } },
    include: { documentType: true, student: true },
    orderBy,
    take: 100,
  });

  const rows: RequestRowData[] = requests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    documentName: r.documentType.name,
    submittedAt: r.submittedAt,
    status: r.status,
    subline: r.student.fullName,
  }));

  return (
    <div className="space-y-5">
      <PageHeader title={title} description={description} />
      <Card className="overflow-hidden">
        {rows.length > 0 ? (
          <RequestList requests={rows} basePath="/faculty/requests" />
        ) : (
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
        )}
      </Card>
    </div>
  );
}
