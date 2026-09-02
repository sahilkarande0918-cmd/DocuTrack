import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { AuthFrame } from "@/components/auth-frame";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");

  return (
    <AuthFrame>
      <ResetForm />
    </AuthFrame>
  );
}
