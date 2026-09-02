import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { studentDomains } from "@/lib/domain";
import { AuthFrame } from "@/components/auth-frame";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");

  return (
    <AuthFrame>
      <SignupForm domainHint={studentDomains()[0]} />
    </AuthFrame>
  );
}
