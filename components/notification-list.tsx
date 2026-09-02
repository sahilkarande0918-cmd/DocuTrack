"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bell, TriangleAlert, CheckCircle2, Info, Check } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notification-actions";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date | string;
  requestId: string | null;
};

const ICON: Record<NotificationType, typeof Info> = {
  INFO: Info,
  ACTION: TriangleAlert,
  SUCCESS: CheckCircle2,
  WARNING: TriangleAlert,
};
const TONE: Record<NotificationType, string> = {
  INFO: "text-info",
  ACTION: "text-warn",
  SUCCESS: "text-ok",
  WARNING: "text-danger",
};

export function NotificationList({ items, basePath }: { items: NotificationItem[]; basePath: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function open(n: NotificationItem) {
    if (!n.read) startTransition(() => markNotificationRead(n.id));
    if (n.requestId) router.push(`${basePath}/requests/${n.requestId}`);
  }

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button
            onClick={() => startTransition(() => markAllNotificationsRead())}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <Check className="size-4" aria-hidden /> Mark all as read
          </button>
        </div>
      )}
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {items.map((n) => {
          const Icon = ICON[n.type];
          return (
            <li key={n.id}>
              <button
                onClick={() => open(n)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2",
                  !n.read && "bg-accent-soft/40",
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", TONE[n.type])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />}
                    <span className={cn("truncate text-sm", n.read ? "font-medium text-ink-2" : "font-semibold text-ink")}>
                      {n.title}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.message}</p>
                  <p className="mt-0.5 text-xs text-faint">{relativeTime(n.createdAt)}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
