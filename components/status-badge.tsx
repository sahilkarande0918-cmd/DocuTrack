import { Check, CircleDot, TriangleAlert, X, Clock } from "lucide-react";
import type { RequestStatus } from "@prisma/client";
import { STATUS_LABEL, STATUS_TONE, type StatusTone } from "@/lib/workflow";
import { cn } from "@/lib/cn";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-neutral-soft text-ink-2 ring-border-strong",
  info: "bg-info-soft text-info ring-info/20",
  warn: "bg-warn-soft text-warn ring-warn/25",
  ok: "bg-ok-soft text-ok ring-ok/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
};

// A glyph per tone so status never depends on colour alone.
const TONE_ICON: Record<StatusTone, typeof Check> = {
  neutral: Clock,
  info: CircleDot,
  warn: TriangleAlert,
  ok: Check,
  danger: X,
};

export function StatusBadge({ status, className }: { status: RequestStatus; className?: string }) {
  const tone = STATUS_TONE[status];
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
