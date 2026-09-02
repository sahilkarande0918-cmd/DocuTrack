import { cn } from "@/lib/cn";

/**
 * Institutional identity. Uses a neutral typographic monogram — NOT a redrawn
 * or fabricated MITAOE emblem, and not the MIT (Cambridge) logo. To use the
 * official mark, drop `public/mitaoe-logo.png` in and swap the monogram tile.
 */
export function Brandmark({
  tone = "light",
  showTagline = true,
  className,
}: {
  tone?: "light" | "dark";
  showTagline?: boolean;
  className?: string;
}) {
  const nameColor = tone === "dark" ? "text-sidebar-ink" : "text-ink";
  const subColor = tone === "dark" ? "text-sidebar-muted" : "text-muted";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent font-semibold tracking-tight text-accent-ink"
      >
        MA
      </span>
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate text-sm font-semibold", nameColor)}>MIT Academy of Engineering</div>
        {showTagline && <div className={cn("truncate text-xs", subColor)}>Alandi, Pune</div>}
      </div>
    </div>
  );
}

export function ProductMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="text-lg font-semibold tracking-tight text-ink">DocuTrack</span>
      <span className="text-xs text-muted">Document Portal</span>
    </div>
  );
}
