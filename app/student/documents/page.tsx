import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { fmtDate } from "@/lib/format";
import { PageHeader, Card, EmptyState } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Documents" };

export default async function StudentDocuments() {
  const session = await requireStudent();
  const requests = await prisma.documentRequest.findMany({
    where: { studentId: session.id, status: { in: ["READY", "COMPLETED"] } },
    include: { documentType: true, files: { where: { category: "COMPLETED" }, orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Documents" description="Official documents issued to you." />
      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{r.documentType.name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  <code className="tnum">{r.requestNumber}</code> · Issued {fmtDate(r.updatedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.files.map((f) => (
                  <a
                    key={f.id}
                    href={`/api/files/${f.id}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 text-sm font-medium text-accent-ink hover:bg-accent-hover"
                  >
                    <Download className="size-4" aria-hidden /> Download
                  </a>
                ))}
                <Link href={`/student/requests/${r.id}`} className="text-sm font-medium text-muted hover:text-ink">
                  View
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileDown}
          title="No documents yet"
          description="When a request is completed, your official document will appear here to download."
        />
      )}
    </div>
  );
}
