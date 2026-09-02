import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { PageHeader, Card } from "@/components/primitives";
import { RoleSelect } from "../admin-controls";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsers() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { fullName: "asc" }] });

  return (
    <div className="space-y-5">
      <PageHeader title="Users" description="Manage accounts and role-based access." />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-faint">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{u.fullName}</div>
                    {u.studentId && <div className="text-xs text-faint tnum">{u.studentId}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-2">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{u.department ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={u.id} role={u.role} disabled={u.id === admin.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-faint">You can't change your own role.</p>
    </div>
  );
}
