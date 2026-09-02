import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Create a single-use reset token and return the raw value (only stored hashed). */
export async function createResetToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return raw;
}

/** Return the token row if the raw token is valid, unused and unexpired. */
export async function findValidToken(raw: string) {
  if (!raw) return null;
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!token || token.usedAt || token.expiresAt < new Date()) return null;
  return token;
}
