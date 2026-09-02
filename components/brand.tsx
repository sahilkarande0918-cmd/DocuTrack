import { cn } from "@/lib/cn";

/**
 * MITAOE institutional wordmark, recreated as a crisp, theme-aware vector-style
 * mark: heavy "MIT", a thin rule, then "Academy of Engineering".
 * To use the official raster instead, drop `public/mitaoe-logo.png` in and render
 * it here with next/image.
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
  const mitColor = tone === "dark" ? "text-white" : "text-brand";
  const nameColor = tone === "dark" ? "text-sidebar-ink" : "text-brand";
  const ruleColor = tone === "dark" ? "bg-white/30" : "bg-brand/25";
  const subColor = tone === "dark" ? "text-sidebar-muted" : "text-muted";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("text-[22px] font-extrabold leading-none tracking-tight", mitColor)}>MIT</span>
      <span className={cn("h-8 w-px shrink-0", ruleColor)} aria-hidden />
      <div className="min-w-0 leading-tight">
        <div className={cn("text-[13px] font-semibold", nameColor)}>Academy of Engineering</div>
        <div className={cn("truncate text-[11px]", subColor)}>
          {showTagline ? "Autonomous Institute · SPPU, Pune" : "DocuTrack"}
        </div>
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
