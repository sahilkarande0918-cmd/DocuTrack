import type { Role } from "@prisma/client";

export const STAFF_ROLES: Role[] = ["FACULTY", "APPROVER", "OFFICE_STAFF", "ADMIN"];

export function isStaff(role: Role | undefined | null): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isStudent(role: Role | undefined | null): boolean {
  return role === "STUDENT";
}

/** Which portal an account belongs to. Enforced at sign-in and in middleware. */
export function portalOf(role: Role): "student" | "staff" {
  return role === "STUDENT" ? "student" : "staff";
}

/** Can this role approve or reject requests? */
export function canApprove(role: Role): boolean {
  return role === "APPROVER" || role === "ADMIN";
}

/** Can this role review, remark, request corrections, and process? */
export function canProcess(role: Role): boolean {
  return isStaff(role);
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  APPROVER: "Authorized Approver",
  OFFICE_STAFF: "Office Staff",
  ADMIN: "Administrator",
};
