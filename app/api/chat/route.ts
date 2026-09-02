import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildContext, askGemini, type ChatTurn } from "@/lib/chatbot";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { messages?: ChatTurn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "No message" }, { status: 400 });
  }

  const context = await buildContext(session.user.id, session.user.role);
  const reply = await askGemini(session.user.role, context, messages);
  return NextResponse.json({ reply });
}
