import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-[var(--shadow-card)]", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

const METRIC_TONE = {
  neutral: "text-ink",
  info: "text-info",
  warn: "text-warn",
  ok: "text-ok",
  danger: "text-danger",
} as const;

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: keyof typeof METRIC_TONE;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted">{label}</span>
        {Icon && <Icon className={cn("size-4", METRIC_TONE[tone])} aria-hidden />}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tnum tracking-tight", METRIC_TONE[tone])}>{value}</div>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-2/50 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-surface ring-1 ring-border-strong">
        <Icon className="size-5 text-muted" aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-ink">{children}</h2>
      {aside}
    </div>
  );
}
