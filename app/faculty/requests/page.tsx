import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { STATUS_LABEL } from "@/lib/workflow";
import { PageHeader, Card, EmptyState } from "@/components/primitives";
import { RequestFilters, type Option } from "@/components/faculty/filters";
import { RequestTable, type TableRow } from "@/components/faculty/request-table";

export const metadata: Metadata = { title: "All requests" };

const STATUS_VALUES: RequestStatus[] = [
  "SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUIRED", "CORRECTION_SUBMITTED",
  "APPROVED", "PROCESSING", "READY", "COMPLETED", "REJECTED",
];

export default async function FacultyRequests({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; docType?: string; sort?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const docType = sp.docType ?? "";
  const sort = sp.sort ?? "newest";

  const where: Prisma.DocumentRequestWhereInput = {
    ...(status && STATUS_VALUES.includes(status as RequestStatus) ? { status: status as RequestStatus } : {}),
    ...(docType ? { documentTypeId: docType } : {}),
    ...(q
      ? {
          OR: [
            { requestNumber: { contains: q, mode: "insensitive" } },
            { purpose: { contains: q, mode: "insensitive" } },
            { student: { fullName: { contains: q, mode: "insensitive" } } },
            { student: { studentId: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.DocumentRequestOrderByWithRelationInput =
    sort === "oldest" ? { submittedAt: "asc" } : sort === "updated" ? { updatedAt: "desc" } : { submittedAt: "desc" };

  const [requests, docTypes] = await Promise.all([
    prisma.documentRequest.findMany({ where, include: { documentType: true, student: true }, orderBy, take: 100 }),
    prisma.documentType.findMany({ orderBy: { name: "asc" } }),
  ]);

  const statusOptions: Option[] = [
    { value: "", label: "All statuses" },
    ...STATUS_VALUES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  ];
  const docTypeOptions: Option[] = [
    { value: "", label: "All documents" },
    ...docTypes.map((d) => ({ value: d.id, label: d.name })),
  ];

  const rows: TableRow[] = requests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    studentName: r.student.fullName,
    studentId: r.student.studentId,
    documentName: r.documentType.name,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    status: r.status,
  }));

  return (
    <div className="space-y-5">
      <PageHeader title="All requests" description={`${requests.length} request${requests.length === 1 ? "" : "s"} shown.`} />
      <RequestFilters
        q={q}
        status={status}
        docType={docType}
        sort={sort}
        statusOptions={statusOptions}
        docTypeOptions={docTypeOptions}
      />
      <Card className="overflow-hidden">
        {rows.length > 0 ? (
          <RequestTable rows={rows} />
        ) : (
          <EmptyState icon={Inbox} title="No matching requests" description="Try adjusting your search or filters." />
        )}
      </Card>
    </div>
  );
}
