import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { canApprove } from "@/lib/roles";
import { RequestQueue } from "@/components/faculty/queue";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const staff = await requireStaff();
  if (!canApprove(staff.role)) redirect("/faculty/dashboard");

  return (
    <RequestQueue
      title="Awaiting approval"
      description="Reviewed requests awaiting your approve / reject decision."
      statuses={["UNDER_REVIEW"]}
      order="asc"
      empty={{ icon: CheckCircle2, title: "No requests awaiting approval", description: "There's nothing to approve or reject right now." }}
    />
  );
}
