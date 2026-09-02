import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { facultyNav } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/roles";
import { initials } from "@/lib/format";
import { AppShell } from "@/components/app-shell";

export default async function FacultyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  const [unread, pending, corrections, approvals] = await Promise.all([
    prisma.notification.count({ where: { recipientId: user.id, read: false } }),
    prisma.documentRequest.count({ where: { status: { in: ["SUBMITTED", "CORRECTION_SUBMITTED"] } } }),
    prisma.documentRequest.count({ where: { status: "CORRECTION_REQUIRED" } }),
    prisma.documentRequest.count({ where: { status: "UNDER_REVIEW" } }),
  ]);

  return (
    <AppShell
      sections={facultyNav(user.role)}
      user={{
        name: user.name ?? "Staff",
        email: user.email ?? "",
        roleLabel: ROLE_LABEL[user.role],
        initials: initials(user.name ?? "F"),
      }}
      badges={{ unread, pending, corrections, approvals }}
    >
      {children}
    </AppShell>
  );
}
