import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/primitives";
import { NotificationList } from "@/components/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function StudentNotifications() {
  const session = await requireStudent();
  const items = await prisma.notification.findMany({
    where: { recipientId: session.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Updates on your document requests." />
      {items.length > 0 ? (
        <NotificationList items={items} basePath="/student" />
      ) : (
        <EmptyState icon={BellOff} title="You're all caught up" description="You have no notifications right now." />
      )}
    </div>
  );
}
