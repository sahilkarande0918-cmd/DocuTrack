"use client";

import { useActionState, useState } from "react";
import { GraduationCap, Users, Loader2, AlertCircle } from "lucide-react";
import { loginAction, type FormState } from "@/lib/actions/auth-actions";
import { Button } from "@/components/button";
import { cn } from "@/lib/cn";

type Portal = "student" | "staff";

const DEMO: Record<Portal, { label: string; email: string }[]> = {
  student: [{ label: "Student", email: "rahul.patil@mitaoe.ac.in" }],
  staff: [
    { label: "Office Staff", email: "office@mitaoe.ac.in" },
    { label: "Approver", email: "hod.comp@mitaoe.ac.in" },
    { label: "Admin", email: "admin@mitaoe.ac.in" },
  ],
};

export function LoginForm({ initialPortal }: { initialPortal: Portal }) {
  const [portal, setPortal] = useState<Portal>(initialPortal);
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-pop)] sm:p-7">
      {/* Portal tabs */}
      <div
        role="tablist"
        aria-label="Login type"
        className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
      >
        {(["student", "staff"] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={portal === p}
            onClick={() => setPortal(p)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              portal === p ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-muted hover:text-ink",
            )}
          >
            {p === "student" ? <GraduationCap className="size-4" /> : <Users className="size-4" />}
            {p === "student" ? "Student" : "Faculty / Staff"}
          </button>
        ))}
      </div>

      <h1 className="mt-6 text-lg font-semibold tracking-tight text-ink">
        {portal === "student" ? "Student sign in" : "Faculty / staff sign in"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {portal === "student"
          ? "Use your MITAOE institute email address."
          : "Sign in with your staff account."}
      </p>

      {state.error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="portal" value={portal} />
        <Field
          label={portal === "student" ? "Email address" : "Email or username"}
          name="email"
          type={portal === "student" ? "email" : "text"}
          autoComplete="username"
          placeholder={portal === "student" ? "you@mitaoe.ac.in" : "you@example.com"}
          error={state.fieldErrors?.email}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={state.fieldErrors?.password}
          required
        />
        <div className="-mt-1 text-right">
          <a href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
            Forgot password?
          </a>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {portal === "student" && (
        <p className="mt-4 text-center text-sm text-muted">
          New here?{" "}
          <a href="/signup" className="font-medium text-accent hover:underline">
            Create a student account
          </a>
        </p>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <button
          onClick={() => setShowDemo((s) => !s)}
          className="text-xs font-medium text-muted hover:text-ink"
        >
          {showDemo ? "Hide" : "Show"} demo accounts
        </button>
        {showDemo && (
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {DEMO[portal].map((d) => (
              <li key={d.email} className="flex justify-between gap-2">
                <span className="text-ink-2">{d.label}</span>
                <code className="tnum text-faint">{d.email}</code>
              </li>
            ))}
            <li className="pt-1 text-faint">Password for all demo accounts: <code>Password123</code></li>
          </ul>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-2">{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
          error ? "border-danger" : "border-border-strong",
        )}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
