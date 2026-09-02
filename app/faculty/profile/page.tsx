import type { Metadata } from "next";
import { requireStaff } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/roles";
import { initials, fmtDate } from "@/lib/format";
import { PageHeader, Card } from "@/components/primitives";

export const metadata: Metadata = { title: "Profile" };

export default async function FacultyProfile() {
  const staff = await requireStaff();
  const user = await prisma.user.findUnique({ where: { id: staff.id } });
  if (!user) return null;

  const rows: [string, string][] = [
    ["Full name", user.fullName],
    ["Email", user.email],
    ["Role", ROLE_LABEL[user.role]],
    ["Department", user.department ?? "—"],
    ["Member since", fmtDate(user.createdAt)],
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description="Your staff account details." />
      <Card className="p-5">
        <div className="flex items-center gap-4 border-b border-border pb-5">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {initials(user.fullName)}
          </span>
          <div>
            <div className="text-base font-semibold text-ink">{user.fullName}</div>
            <div className="text-sm text-muted">{ROLE_LABEL[user.role]}</div>
          </div>
        </div>
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-faint">{label}</dt>
              <dd className="mt-0.5 text-sm text-ink-2">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
