import type { Metadata } from "next";
import { TriangleAlert } from "lucide-react";
import { findValidToken } from "@/lib/reset";
import { AuthFrame } from "@/components/auth-frame";
import { LinkButton } from "@/components/button";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Set new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = await findValidToken(token);

  return (
    <AuthFrame>
      {valid ? (
        <SetPasswordForm token={token} />
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-pop)] sm:p-7">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-warn-soft">
            <TriangleAlert className="size-6 text-warn" aria-hidden />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-ink">Link expired or invalid</h1>
          <p className="mt-1 text-sm text-muted">
            This password reset link is no longer valid. Request a new one to continue.
          </p>
          <LinkButton href="/forgot-password" className="mt-5 w-full">
            Request a new link
          </LinkButton>
        </div>
      )}
    </AuthFrame>
  );
}
