import { Check, X, TriangleAlert } from "lucide-react";
import type { RequestStatus } from "@prisma/client";
import { TIMELINE_STAGES, timelineIndex } from "@/lib/workflow";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type StageEvent = { newStatus: RequestStatus | null; createdAt: Date | string };

export function RequestTimeline({
  status,
  submittedAt,
  events,
}: {
  status: RequestStatus;
  submittedAt: Date | string;
  events: StageEvent[];
}) {
  const current = timelineIndex(status);
  const rejected = status === "REJECTED";

  function stampFor(stageStatus: RequestStatus): string | null {
    if (stageStatus === "SUBMITTED") return fmtDateTime(submittedAt);
    const ev = [...events].reverse().find((e) => e.newStatus === stageStatus);
    return ev ? fmtDateTime(ev.createdAt) : null;
  }

  return (
    <ol className="relative">
      {TIMELINE_STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current && !rejected;
        const isReviewRejected = rejected && i === 1;
        const cancelled = rejected && i > 1;
        const stamp = done || active || isReviewRejected ? stampFor(stage.status) : null;
        const last = i === TIMELINE_STAGES.length - 1;

        return (
          <li key={stage.status} className="flex gap-3 pb-5 last:pb-0">
            {/* node + connector */}
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  "z-10 flex size-6 items-center justify-center rounded-full ring-4 ring-surface",
                  done && "bg-ok text-white",
                  active && "bg-accent text-white",
                  isReviewRejected && "bg-danger text-white",
                  !done && !active && !isReviewRejected && "border border-border-strong bg-surface",
                  cancelled && "opacity-50",
                )}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden />
                ) : isReviewRejected ? (
                  <X className="size-3.5" aria-hidden />
                ) : active ? (
                  <span className="size-2 rounded-full bg-white" aria-hidden />
                ) : (
                  <span className="size-2 rounded-full bg-border-strong" aria-hidden />
                )}
              </span>
              {!last && (
                <span
                  className={cn("w-px flex-1", done ? "bg-ok/40" : "bg-border")}
                  style={{ minHeight: 24 }}
                  aria-hidden
                />
              )}
            </div>

            {/* label */}
            <div className={cn("pt-0.5", cancelled && "opacity-50")}>
              <div
                className={cn(
                  "text-sm font-medium",
                  done && "text-ink",
                  active && "text-accent",
                  isReviewRejected && "text-danger",
                  !done && !active && !isReviewRejected && "text-muted",
                )}
              >
                {isReviewRejected ? "Rejected" : stage.label}
              </div>
              {stamp && <div className="mt-0.5 text-xs text-faint tnum">{stamp}</div>}
              {active && stage.status === "UNDER_REVIEW" && status === "CORRECTION_REQUIRED" && (
                <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warn">
                  <TriangleAlert className="size-3.5" aria-hidden /> Correction required
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
