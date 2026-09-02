import type { EventType } from "@prisma/client";
import { EVENT_LABEL } from "@/lib/workflow";
import { fmtDateTime } from "@/lib/format";

export type ActivityEvent = {
  id: string;
  eventType: EventType;
  remarks: string | null;
  createdAt: Date | string;
  actorName: string | null;
};

export function ActivityLog({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <p className="text-sm text-muted">No activity recorded yet.</p>;
  return (
    <ul className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-border-strong" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-medium text-ink">{EVENT_LABEL[e.eventType]}</span>
              <span className="text-xs text-faint tnum">{fmtDateTime(e.createdAt)}</span>
            </div>
            {e.remarks && <p className="mt-0.5 text-sm text-muted">{e.remarks}</p>}
            {e.actorName && <p className="mt-0.5 text-xs text-faint">by {e.actorName}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
