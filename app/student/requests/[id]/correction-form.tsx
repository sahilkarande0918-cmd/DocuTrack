"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Check, Loader2, AlertCircle } from "lucide-react";
import { submitCorrection, type ActionResult } from "@/lib/actions/request-actions";
import { ACCEPTED_HINT, ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/validation";
import { Button } from "@/components/button";
import { fmtBytes } from "@/lib/format";

export function CorrectionForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(submitCorrection, {});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      setFiles([]);
      router.refresh();
    }
  }, [state.ok, router]);

  function add(list: FileList | null) {
    setLocalError(null);
    if (!list) return;
    for (const f of Array.from(list)) {
      if (!ACCEPTED_TYPES.includes(f.type)) return setLocalError(`${f.name}: unsupported type.`);
      if (f.size > MAX_FILE_BYTES) return setLocalError(`${f.name} is larger than 5 MB.`);
    }
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function submit() {
    if (files.length === 0) return setLocalError("Attach at least one corrected file.");
    const fd = new FormData();
    fd.set("requestId", requestId);
    files.forEach((f) => fd.append("file:correction", f));
    formAction(fd);
  }

  return (
    <div className="space-y-3">
      {(localError || state.error) && (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {localError ?? state.error}
        </div>
      )}

      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2">
          <Check className="size-4 text-ok" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{f.name}</span>
          <span className="text-xs text-muted">{fmtBytes(f.size)}</span>
          <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="rounded p-1 text-muted hover:text-danger" aria-label="Remove">
            <X className="size-4" />
          </button>
        </div>
      ))}

      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-2/40 px-3 py-3 text-sm text-muted hover:border-accent hover:text-accent"
      >
        <Upload className="size-4" aria-hidden /> Add corrected file · {ACCEPTED_HINT}
      </button>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_TYPES.join(",")} className="hidden" onChange={(e) => add(e.target.files)} />

      <Button onClick={submit} disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
        {pending ? "Submitting…" : "Submit corrected documents"}
      </Button>
    </div>
  );
}
