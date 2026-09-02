"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type Option = { value: string; label: string };

export function RequestFilters({
  q,
  status,
  docType,
  sort,
  statusOptions,
  docTypeOptions,
}: {
  q: string;
  status: string;
  docType: string;
  sort: string;
  statusOptions: Option[];
  docTypeOptions: Option[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) {
      const val = String(v).trim();
      if (val) params.set(k, val);
    }
    router.push(`/faculty/requests${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <div className="relative min-w-52 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search ID, student or purpose"
          className="h-9 w-full rounded-md border border-border-strong bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        />
      </div>
      <Select name="status" defaultValue={status} options={statusOptions} onChange={() => formRef.current && submit(formRef.current)} />
      <Select name="docType" defaultValue={docType} options={docTypeOptions} onChange={() => formRef.current && submit(formRef.current)} />
      <Select
        name="sort"
        defaultValue={sort}
        options={[
          { value: "newest", label: "Newest first" },
          { value: "oldest", label: "Oldest first" },
          { value: "updated", label: "Recently updated" },
        ]}
        onChange={() => formRef.current && submit(formRef.current)}
      />
    </form>
  );
}

function Select({
  name,
  defaultValue,
  options,
  onChange,
}: {
  name: string;
  defaultValue: string;
  options: Option[];
  onChange: () => void;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
      className="h-9 rounded-md border border-border-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
