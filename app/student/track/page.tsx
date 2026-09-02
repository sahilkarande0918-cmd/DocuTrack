import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowRight, SearchX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";
import { PageHeader, Card } from "@/components/primitives";
import { StatusBadge } from "@/components/status-badge";
import { RequestTimeline } from "@/components/request-timeline";

export const metadata: Metadata = { title: "Track request" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireStudent();
  const { q } = await searchParams;
  const query = q?.trim();

  const req = query
    ? await prisma.documentRequest.findFirst({
        where: { studentId: session.id, requestNumber: { equals: query, mode: "insensitive" } },
        include: { documentType: true, events: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Track a request" description="Enter a request ID to see its current status and progress." />

      <Card className="p-4">
        <form method="get" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              name="q"
              defaultValue={query}
              placeholder="e.g. DT-2026-00001"
              className="h-10 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            />
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover">
            Track
          </button>
        </form>
      </Card>

      {query && !req && (
        <Card className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <SearchX className="size-6 text-muted" aria-hidden />
          <p className="text-sm font-medium text-ink">No request found for “{query}”</p>
          <p className="text-sm text-muted">Check the request ID — it looks like DT-2026-00001.</p>
        </Card>
      )}

      {req && (
        <Card className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">{req.documentType.name}</h2>
              <p className="text-sm text-muted">
                <code className="tnum">{req.requestNumber}</code> · Updated {fmtDateTime(req.updatedAt)}
              </p>
            </div>
            <StatusBadge status={req.status} />
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <RequestTimeline status={req.status} submittedAt={req.submittedAt} events={req.events} />
          </div>
          <Link
            href={`/student/requests/${req.id}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Open full request <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      )}
    </div>
  );
}
