import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { AuthFrame } from "@/components/auth-frame";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");

  const { portal } = await searchParams;
  const initial = portal === "staff" ? "staff" : "student";

  return (
    <AuthFrame>
      <LoginForm initialPortal={initial} />
    </AuthFrame>
  );
}
