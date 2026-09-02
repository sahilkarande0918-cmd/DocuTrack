import { redirect } from "next/navigation";
import { GraduationCap, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { currentUser } from "@/lib/session";
import { AuthFrame } from "@/components/auth-frame";
import { LinkButton } from "@/components/button";

export default async function EntryPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "STUDENT" ? "/student/dashboard" : "/faculty/dashboard");

  return (
    <AuthFrame>
      <div className="rounded-xl border border-border bg-surface p-7 shadow-[var(--shadow-pop)]">
        <div className="flex items-center gap-2 text-xs font-medium text-accent">
          <ShieldCheck className="size-4" aria-hidden />
          Secure institutional portal
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">DocuTrack</h1>
        <p className="mt-1 text-sm font-medium text-ink-2">College Document Request &amp; Tracking Portal</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Request, track and receive official college documents from one secure portal — without repeated
          visits to the office.
        </p>

        <div className="mt-6 space-y-2.5">
          <LinkButton href="/login?portal=student" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <GraduationCap className="size-4" aria-hidden />
              Student Login
            </span>
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
          <LinkButton href="/login?portal=staff" variant="secondary" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Users className="size-4" aria-hidden />
              Faculty / Staff Login
            </span>
            <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </div>

        <p className="mt-5 border-t border-border pt-4 text-center text-xs text-muted">
          New student?{" "}
          <a href="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </a>{" "}
          with your MITAOE email.
        </p>
      </div>
    </AuthFrame>
  );
}
