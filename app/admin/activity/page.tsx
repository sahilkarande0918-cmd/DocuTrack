import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EVENT_LABEL } from "@/lib/workflow";
import { fmtDateTime } from "@/lib/format";
import { PageHeader, Card } from "@/components/primitives";

export const metadata: Metadata = { title: "Activity log" };

export default async function AdminActivity() {
  await requireAdmin();
  const events = await prisma.requestEvent.findMany({
    include: { request: { include: { documentType: true } }, actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Activity log" description="A full, timestamped audit trail of every action." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-faint">
                <th className="px-4 py-2.5 font-medium">When</th>
                <th className="px-4 py-2.5 font-medium">Request</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted tnum">{fmtDateTime(e.createdAt)}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/faculty/requests/${e.requestId}`} className="font-medium tnum text-ink hover:text-accent">
                      {e.request.requestNumber}
                    </Link>
                    <span className="ml-1 text-faint">{e.request.documentType.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{EVENT_LABEL[e.eventType]}</td>
                  <td className="px-4 py-2.5 text-muted">{e.actor?.fullName ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
