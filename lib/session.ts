import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff, isAdmin } from "@/lib/roles";

/** Current session user or null. */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/faculty/dashboard");
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/student/dashboard");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user.role)) redirect("/faculty/dashboard");
  return user;
}
