import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { RequestQueue } from "@/components/faculty/queue";

export const metadata: Metadata = { title: "Pending review" };

export default async function PendingPage() {
  await requireStaff();
  return (
    <RequestQueue
      title="Pending review"
      description="New submissions and re-submitted corrections waiting to be reviewed."
      statuses={["SUBMITTED", "CORRECTION_SUBMITTED"]}
      order="asc"
      empty={{ icon: CheckCircle2, title: "Nothing to review", description: "No requests are waiting for a first review." }}
    />
  );
}
