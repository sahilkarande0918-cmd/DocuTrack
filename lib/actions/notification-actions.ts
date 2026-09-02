"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  // Only mark the caller's own notification.
  await prisma.notification.updateMany({
    where: { id, recipientId: user.id },
    data: { read: true },
  });
  revalidateFor(user.role);
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { recipientId: user.id, read: false },
    data: { read: true },
  });
  revalidateFor(user.role);
}

function revalidateFor(role: string) {
  if (isStaff(role as never)) {
    revalidatePath("/faculty/notifications");
    revalidatePath("/faculty/dashboard");
  } else {
    revalidatePath("/student/notifications");
    revalidatePath("/student/dashboard");
  }
}
