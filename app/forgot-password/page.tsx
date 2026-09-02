import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { emailConfigured } from "@/lib/email";
import { AuthFrame } from "@/components/auth-frame";
import { ResetForm } from "./reset-form";
import { EmailRequestForm } from "./email-request-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");

  // With email configured, send a reset link (like other sites). Otherwise fall
  // back to a direct in-page reset so the feature still works.
  return <AuthFrame>{emailConfigured() ? <EmailRequestForm /> : <ResetForm />}</AuthFrame>;
}
