import Link from "next/link";
import { cn } from "@/lib/cn";

export type FilterTab = { key: string; label: string; href: string; count?: number };

export function FilterTabs({ tabs, active }: { tabs: FilterTab[]; active: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-ink text-paper" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className={cn("rounded-full px-1.5 text-xs tnum", isActive ? "bg-white/20" : "bg-surface-2 text-faint")}>
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
