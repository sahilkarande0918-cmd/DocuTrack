import Link from "next/link";
import type { RequestStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { fmtDate, relativeTime } from "@/lib/format";

export type TableRow = {
  id: string;
  requestNumber: string;
  studentName: string;
  studentId: string | null;
  documentName: string;
  submittedAt: Date | string;
  updatedAt: Date | string;
  status: RequestStatus;
};

export function RequestTable({ rows }: { rows: TableRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-faint">
            <th className="px-4 py-2.5 font-medium">Request ID</th>
            <th className="px-4 py-2.5 font-medium">Student</th>
            <th className="px-4 py-2.5 font-medium">Document</th>
            <th className="px-4 py-2.5 font-medium">Submitted</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Updated</th>
            <th className="px-4 py-2.5 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="group transition-colors hover:bg-surface-2">
              <td className="px-4 py-3">
                <Link href={`/faculty/requests/${r.id}`} className="font-medium tnum text-ink hover:text-accent">
                  {r.requestNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="text-ink-2">{r.studentName}</div>
                {r.studentId && <div className="text-xs text-faint tnum">{r.studentId}</div>}
              </td>
              <td className="px-4 py-3 text-ink-2">{r.documentName}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(r.submittedAt)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{relativeTime(r.updatedAt)}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/faculty/requests/${r.id}`} className="text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
