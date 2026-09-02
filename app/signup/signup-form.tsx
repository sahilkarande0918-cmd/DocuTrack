"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { signupAction, type FormState } from "@/lib/actions/auth-actions";
import { DEPARTMENTS, YEARS } from "@/lib/validation";
import { TextField, SelectField } from "@/components/form-field";
import { Button } from "@/components/button";

export function SignupForm({ domainHint }: { domainHint: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signupAction, {});

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-pop)] sm:p-7">
      <h1 className="text-lg font-semibold tracking-tight text-ink">Create your student account</h1>
      <p className="mt-1 text-sm text-muted">Registration is open to MITAOE students only.</p>

      {state.error && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <form action={action} className="mt-4 space-y-4">
        <TextField label="Full name" name="fullName" placeholder="Rahul Patil" error={state.fieldErrors?.fullName} required />
        <TextField
          label="Institute email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder={`you@${domainHint}`}
          hint={`Must be an @${domainHint} address.`}
          error={state.fieldErrors?.email}
          required
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Student ID" name="studentId" placeholder="2025BTECS001" error={state.fieldErrors?.studentId} required />
          <SelectField label="Year" name="year" options={YEARS} error={state.fieldErrors?.year} defaultValue={YEARS[0]} />
        </div>
        <SelectField label="Department" name="department" options={DEPARTMENTS} error={state.fieldErrors?.department} defaultValue={DEPARTMENTS[0]} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={state.fieldErrors?.password}
          required
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Already registered?{" "}
        <a href="/login?portal=student" className="font-medium text-accent hover:underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
