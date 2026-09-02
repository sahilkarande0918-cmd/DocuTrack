"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { resetPasswordAction, type FormState } from "@/lib/actions/auth-actions";
import { TextField } from "@/components/form-field";
import { Button, LinkButton } from "@/components/button";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});

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
      <h1 className="text-lg font-semibold tracking-tight text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter your account email and choose a new password. Works for both student and staff accounts.
      </p>

      {state.error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <form action={action} className="mt-4 space-y-4">
        <TextField
          label="Account email"
          name="email"
          type="text"
          autoComplete="username"
          placeholder="you@mitaoe.ac.in"
          error={state.fieldErrors?.email}
          required
        />
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

      <p className="mt-4 text-center text-sm text-muted">
        Remembered it?{" "}
        <a href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
