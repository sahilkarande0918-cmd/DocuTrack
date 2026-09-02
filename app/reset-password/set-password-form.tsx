"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { completePasswordReset, type FormState } from "@/lib/actions/auth-actions";
import { TextField } from "@/components/form-field";
import { Button, LinkButton } from "@/components/button";

export function SetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(completePasswordReset, {});

  if (state.ok) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-pop)] sm:p-7">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-ok-soft">
          <CheckCircle2 className="size-6 text-ok" aria-hidden />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">Password updated</h1>
        <p className="mt-1 text-sm text-muted">You can now sign in with your new password.</p>
        <LinkButton href="/login" className="mt-5 w-full">
          Back to sign in
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-pop)] sm:p-7">
      <h1 className="text-lg font-semibold tracking-tight text-ink">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted">Enter a new password for your account.</p>

      {state.error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="token" value={token} />
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={state.fieldErrors?.password}
          required
        />
        <TextField
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter new password"
          error={state.fieldErrors?.confirm}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
