import type { Metadata } from "next";
import { FileX2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/session";
import { PageHeader, EmptyState } from "@/components/primitives";
import { NewRequestWizard, type DocTypeOption } from "./wizard";

export const metadata: Metadata = { title: "New request" };

export default async function NewRequestPage() {
  await requireStudent();
  const docTypes = await prisma.documentType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const options: DocTypeOption[] = docTypes.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    requirements: (d.requirements as DocTypeOption["requirements"]) ?? { info: [], files: [] },
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="New document request" description="Select a document, provide details and upload the required files." />
      {options.length > 0 ? (
        <NewRequestWizard docTypes={options} />
      ) : (
        <EmptyState
          icon={FileX2}
          title="No document types are available"
          description="An administrator hasn't published any requestable documents yet. Please check back later."
        />
      )}
    </div>
  );
}
