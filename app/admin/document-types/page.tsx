import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/primitives";
import { DocTypeToggle } from "../admin-controls";

export const metadata: Metadata = { title: "Document types" };

type Requirements = { info: string[]; files: { key: string; label: string }[] };

export default async function AdminDocumentTypes() {
  await requireAdmin();
  const docTypes = await prisma.documentType.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { requests: true } } } });

  return (
    <div className="space-y-5">
      <PageHeader title="Document types" description="Documents students can request, and what each requires." />
      <div className="space-y-3">
        {docTypes.map((d) => {
          const reqs = (d.requirements as Requirements) ?? { info: [], files: [] };
          return (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-ink">{d.name}</h2>
                    <span className="text-xs text-faint tnum">{d._count.requests} requests</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{d.description}</p>
                  {reqs.files.length > 0 && (
                    <p className="mt-2 text-xs text-faint">
                      Required files: {reqs.files.map((f) => f.label).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <DocTypeToggle id={d.id} active={d.active} />
                  <span className="text-xs text-faint">{d.active ? "Active" : "Hidden"}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
