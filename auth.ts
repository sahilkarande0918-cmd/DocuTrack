import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { portalOf } from "@/lib/roles";
import { isInstituteEmail } from "@/lib/domain";

const credsSchema = z.object({
  // Staff may use any email/username; students are checked for the institute
  // domain below, so only a non-empty identifier is required here.
  email: z.string().min(1),
  password: z.string().min(1),
  portal: z.enum(["student", "staff"]),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, portal: {} },
      async authorize(raw) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, portal } = parsed.data;
        const normalized = email.trim().toLowerCase();

        // Students must use an institute email — enforced server-side.
        if (portal === "student" && !isInstituteEmail(normalized)) return null;

        const user = await prisma.user.findUnique({ where: { email: normalized } });
        if (!user) return null;

        // The account's role must match the portal it signed in through.
        if (portalOf(user.role) !== portal) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          studentId: user.studentId,
        };
      },
    }),
  ],
});
