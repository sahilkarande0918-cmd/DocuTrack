"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

const ROLES: Role[] = ["STUDENT", "FACULTY", "APPROVER", "OFFICE_STAFF", "ADMIN"];

export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!ROLES.includes(role as Role)) return;
  if (userId === admin.id) return; // don't let an admin change their own role
  await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  revalidatePath("/admin/users");
}

export async function toggleDocumentType(id: string, active: boolean) {
  await requireAdmin();
  await prisma.documentType.update({ where: { id }, data: { active } });
  revalidatePath("/admin/document-types");
}
