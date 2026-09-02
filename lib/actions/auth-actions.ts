"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { isInstituteEmail, domainHint } from "@/lib/domain";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
};

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  portal: z.enum(["student", "staff"]),
});

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    portal: formData.get("portal"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { email, password, portal } = parsed.data;

  if (portal === "student" && !isInstituteEmail(email)) {
    return { error: `Please use your MITAOE institute email address (${domainHint()}).` };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      portal,
      redirectTo: portal === "student" ? "/student/dashboard" : "/faculty/dashboard",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password for this portal." };
    }
    throw err; // re-throw NEXT_REDIRECT
  }
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
    year: formData.get("year"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  // Institute-domain rule enforced server-side, not only in the form.
  if (!isInstituteEmail(data.email)) {
    return { fieldErrors: { email: `Please use your MITAOE institute email address (${domainHint()}).` } };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: "STUDENT",
      studentId: data.studentId,
      department: data.department,
      year: data.year,
    },
  });

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      portal: "student",
      redirectTo: "/student/dashboard",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
