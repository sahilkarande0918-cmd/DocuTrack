import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { RequestQueue } from "@/components/faculty/queue";

export const metadata: Metadata = { title: "Corrections" };

export default async function CorrectionsPage() {
  await requireStaff();
  return (
    <RequestQueue
      title="Corrections"
      description="Requests where a correction has been asked of the student."
      statuses={["CORRECTION_REQUIRED"]}
      order="desc"
      empty={{ icon: CheckCircle2, title: "No outstanding corrections", description: "No requests are waiting on a student correction." }}
    />
  );
}
