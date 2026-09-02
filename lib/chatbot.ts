import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/workflow";
import { isStaff } from "@/lib/roles";
import { fmtDate } from "@/lib/format";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

export function chatConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Demo institute contacts the assistant may share.
const CONTACTS = `Examination Office — office@mitaoe.ac.in, phone +91 20 3910 0234 (Mon–Fri, 10:00–17:00)
Student Helpdesk (demo) — +91 20 3910 0100
Department office numbers (demo): Computer Engineering +91 20 3910 0311, Information Technology +91 20 3910 0312, E&TC +91 20 3910 0313, Mechanical +91 20 3910 0314, Civil +91 20 3910 0315`;

const BASE_RULES = `You are "Ask Help", the assistant inside DocuTrack — the MIT Academy of Engineering (MITAOE), Alandi, Pune document request & tracking portal.

STRICT SCOPE: Only answer questions about THIS portal — document requests, their statuses and workflow, how to use the portal, and the institute contacts given in DATA. If the user asks anything personal, general knowledge, coding, or makes small talk, politely decline in ONE short sentence and steer them back to portal help. Do not roleplay or discuss anything unrelated.

STYLE: Be concise, warm and specific. Prefer short sentences and small bullet lists. Keep answers under ~110 words. Use the DATA below as your only source of truth — never invent request numbers, statuses, names, dates or phone numbers that are not in DATA. If the answer isn't in DATA, say you don't have that detail and point them to the Examination Office.`;

function studentSystem(): string {
  return `${BASE_RULES}

AUDIENCE: You are talking to a STUDENT. Only discuss THEIR OWN requests (in DATA) and general portal help. Never reveal other students' information. If they ask how to contact a teacher or the office, give the relevant institute email and department/office phone number from DATA (these are demo numbers).`;
}

function staffSystem(): string {
  return `${BASE_RULES}

AUDIENCE: You are talking to a FACULTY / STAFF member. You may look up ANY student's requests and document statuses from DATA. Help them find where a document is, its current status, who it is assigned to, and workload questions. Answer lookups like "what is the status of <student>'s request" or "where is the <document> for <student>" using DATA.`;
}

/** Compact, current snapshot the model answers from. Scoped by role. */
export async function buildContext(userId: string, role: Role): Promise<string> {
  if (isStaff(role)) {
    const [me, requests, staff] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, role: true } }),
      prisma.documentRequest.findMany({
        include: { documentType: true, student: true, assignedTo: true },
        orderBy: { submittedAt: "desc" },
        take: 60,
      }),
      prisma.user.findMany({ where: { role: { not: "STUDENT" } }, select: { fullName: true, role: true, department: true, email: true } }),
    ]);

    const reqLines = requests
      .map(
        (r) =>
          `- ${r.requestNumber}: ${r.student.fullName} (${r.student.studentId ?? "—"}, ${r.student.department ?? "—"}) — ${r.documentType.name} — status: ${STATUS_LABEL[r.status]} — assigned: ${r.assignedTo?.fullName ?? "Unassigned"} — submitted ${fmtDate(r.submittedAt)}, updated ${fmtDate(r.updatedAt)}${r.currentRemarks ? ` — remark: ${r.currentRemarks}` : ""}`,
      )
      .join("\n");
    const staffLines = staff.map((s) => `- ${s.fullName} — ${s.role} — ${s.department ?? "—"} — ${s.email}`).join("\n");

    return `CURRENT STAFF USER: ${me?.fullName} (${me?.role}).

ALL DOCUMENT REQUESTS:
${reqLines || "None."}

STAFF DIRECTORY:
${staffLines}

CONTACTS:
${CONTACTS}`;
  }

  // Student — only their own data.
  const [me, requests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.documentRequest.findMany({
      where: { studentId: userId },
      include: { documentType: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const reqLines = requests
    .map(
      (r) =>
        `- ${r.requestNumber}: ${r.documentType.name} — status: ${STATUS_LABEL[r.status]} — submitted ${fmtDate(r.submittedAt)}, updated ${fmtDate(r.updatedAt)}${r.currentRemarks ? ` — note: ${r.currentRemarks}` : ""}${r.rejectionReason ? ` — rejection reason: ${r.rejectionReason}` : ""}`,
    )
    .join("\n");

  return `CURRENT STUDENT: ${me?.fullName} (${me?.studentId ?? "—"}, ${me?.department ?? "—"}, ${me?.year ?? "—"}), email ${me?.email}.

YOUR DOCUMENT REQUESTS:
${reqLines || "You have not submitted any requests yet. You can start one from New Request."}

HOW THE PORTAL WORKS: Submit a request with supporting files → office reviews → you may be asked for a correction → approved/rejected → processed → the finished document appears in Documents to download. Track any request under My Requests or Track Request.

CONTACTS:
${CONTACTS}`;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Call Gemini with role-specific instructions + data context. Returns reply text. */
export async function askGemini(role: Role, context: string, history: ChatTurn[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "The assistant isn't configured right now. Please contact the Examination Office at +91 20 3910 0234.";

  const system = `${isStaff(role) ? staffSystem() : studentSystem()}\n\n## DATA\n${context}`;
  const contents = history.slice(-10).map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content.slice(0, 1500) }],
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 500, topP: 0.9 },
        }),
      },
    );
    if (!res.ok) return "Sorry, I couldn't reach the assistant just now. Please try again in a moment.";
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
    return text.trim() || "I'm not sure about that. For anything I can't answer, please contact the Examination Office.";
  } catch {
    return "Sorry, something went wrong reaching the assistant. Please try again.";
  }
}
