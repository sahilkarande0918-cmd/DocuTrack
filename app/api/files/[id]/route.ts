import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/roles";

/**
 * Auth-guarded file delivery — the private-storage / signed-URL equivalent.
 * A student may only fetch files on their own requests; staff may fetch any.
 * Files are never served from a public bucket.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const file = await prisma.requestFile.findUnique({
    where: { id },
    include: { request: true },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });

  const staff = isStaff(session.user.role);
  const ownsRequest = file.request.studentId === session.user.id;
  if (!staff && !ownsRequest) return new NextResponse("Forbidden", { status: 403 });

  // First time a student opens the completed document → close the request.
  if (
    !staff &&
    ownsRequest &&
    file.category === "COMPLETED" &&
    file.request.status === "READY"
  ) {
    await prisma.documentRequest.update({
      where: { id: file.requestId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await prisma.requestEvent.create({
      data: {
        requestId: file.requestId,
        actorId: session.user.id,
        eventType: "COMPLETED",
        previousStatus: "READY",
        newStatus: "COMPLETED",
      },
    });
  }

  const body = new Uint8Array(file.data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Content-Length": String(file.size),
      "Cache-Control": "private, no-store",
    },
  });
}
