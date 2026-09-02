import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/primitives";
import { NotificationList } from "@/components/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function FacultyNotifications() {
  const staff = await requireStaff();
  const items = await prisma.notification.findMany({
    where: { recipientId: staff.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Updates on requests you're handling." />
      {items.length > 0 ? (
        <NotificationList items={items} basePath="/faculty" />
      ) : (
        <EmptyState icon={BellOff} title="You're all caught up" description="You have no notifications right now." />
      )}
    </div>
  );
}
