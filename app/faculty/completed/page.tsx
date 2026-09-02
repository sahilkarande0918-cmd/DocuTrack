import type { Metadata } from "next";
import { Archive } from "lucide-react";
import { requireStaff } from "@/lib/session";
import { RequestQueue } from "@/components/faculty/queue";

export const metadata: Metadata = { title: "Completed" };

export default async function CompletedPage() {
  await requireStaff();
  return (
    <RequestQueue
      title="Completed & closed"
      description="Requests that are ready, downloaded or rejected."
      statuses={["READY", "COMPLETED", "REJECTED"]}
      order="desc"
      empty={{ icon: Archive, title: "Nothing here yet", description: "Completed and closed requests will appear here." }}
    />
  );
}
