import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import type { RequestStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type RequestRowData = {
  id: string;
  requestNumber: string;
  documentName: string;
  submittedAt: Date | string;
  status: RequestStatus;
  /** Secondary line — student name (faculty view) or purpose (student view). */
  subline?: string;
};

export function RequestRow({ req, basePath }: { req: RequestRowData; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${req.id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted ring-1 ring-inset ring-border">
        <FileText className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{req.documentName}</span>
          <code className="hidden shrink-0 text-xs text-faint tnum sm:inline">{req.requestNumber}</code>
        </div>
        <div className="truncate text-xs text-muted">
          {req.subline ? `${req.subline} · ` : ""}Submitted {fmtDate(req.submittedAt)}
        </div>
      </div>
      <StatusBadge status={req.status} className="hidden sm:inline-flex" />
      <ChevronRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function RequestList({
  requests,
  basePath,
  className,
}: {
  requests: RequestRowData[];
  basePath: string;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {requests.map((r) => (
        <RequestRow key={r.id} req={r} basePath={basePath} />
      ))}
    </div>
  );
}
