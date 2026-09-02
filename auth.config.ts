import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { isStaff } from "@/lib/roles";

/**
 * Edge-safe auth config: route protection + token shaping only.
 * No Prisma, no bcrypt — those live in auth.ts (Node runtime).
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real provider added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const loggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const inStudent = path.startsWith("/student");
      const inFaculty = path.startsWith("/faculty");
      const inAdmin = path.startsWith("/admin");
      const protectedArea = inStudent || inFaculty || inAdmin;

      if (!protectedArea) return true;
      if (!loggedIn) return false; // → redirected to /login by NextAuth

      const home = role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard";

      if (inStudent && role !== "STUDENT")
        return NextResponse.redirect(new URL(home, nextUrl));
      if (inFaculty && !isStaff(role))
        return NextResponse.redirect(new URL(home, nextUrl));
      if (inAdmin && role !== "ADMIN")
        return NextResponse.redirect(new URL(home, nextUrl));

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.studentId = (token.studentId as string | null) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
