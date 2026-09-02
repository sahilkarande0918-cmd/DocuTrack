import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { studentNav } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/roles";
import { initials } from "@/lib/format";
import { AppShell } from "@/components/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  const unread = await prisma.notification.count({
    where: { recipientId: user.id, read: false },
  });

  return (
    <AppShell
      sections={studentNav()}
      user={{
        name: user.name ?? "Student",
        email: user.email ?? "",
        roleLabel: ROLE_LABEL[user.role],
        initials: initials(user.name ?? "S"),
      }}
      badges={{ unread }}
    >
      {children}
    </AppShell>
  );
}
