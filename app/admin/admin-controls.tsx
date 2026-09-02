"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { updateUserRole, toggleDocumentType } from "@/lib/actions/admin-actions";
import { ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/cn";

const ROLES: Role[] = ["STUDENT", "FACULTY", "APPROVER", "OFFICE_STAFF", "ADMIN"];

export function RoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex items-center gap-1.5">
      <select
        defaultValue={role}
        disabled={disabled || pending}
        onChange={(e) => start(() => updateUserRole(userId, e.target.value))}
        className="h-8 rounded-md border border-border-strong bg-surface px-2 text-sm text-ink disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="size-3.5 animate-spin text-muted" aria-hidden />}
    </span>
  );
}

export function DocTypeToggle({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => toggleDocumentType(id, !active))}
      disabled={pending}
      role="switch"
      aria-checked={active}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        active ? "bg-accent" : "bg-border-strong",
      )}
    >
      <span className={cn("inline-block size-4 translate-x-0.5 rounded-full bg-white transition-transform", active && "translate-x-4")} />
    </button>
  );
}
