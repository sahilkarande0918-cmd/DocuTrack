"use client";

import { useActionState, useRef, useState } from "react";
import {
  FileText,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  X,
  Paperclip,
  ListChecks,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createRequest, type ActionResult } from "@/lib/actions/request-actions";
import { ACADEMIC_YEARS, ACCEPTED_HINT, ACCEPTED_TYPES, MAX_FILE_BYTES } from "@/lib/validation";
import { Card } from "@/components/primitives";
import { Button } from "@/components/button";
import { TextArea, SelectField } from "@/components/form-field";
import { fmtBytes } from "@/lib/format";
import { cn } from "@/lib/cn";

export type DocTypeOption = {
  id: string;
  name: string;
  description: string;
  requirements: { info: string[]; files: { key: string; label: string }[] };
};

const STEPS = ["Document", "Requirements", "Details", "Upload", "Review"] as const;

export function NewRequestWizard({ docTypes }: { docTypes: DocTypeOption[] }) {
  const [step, setStep] = useState(0);
  const [docTypeId, setDocTypeId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [academicYear, setAcademicYear] = useState<string>(ACADEMIC_YEARS[1]);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(createRequest, {});

  const doc = docTypes.find((d) => d.id === docTypeId);
  const requiredFiles = doc?.requirements.files ?? [];

  function next() {
    setLocalError(null);
    if (step === 0 && !docTypeId) return setLocalError("Choose a document to continue.");
    if (step === 2 && purpose.trim().length < 5) return setLocalError("Describe the purpose of this request.");
    if (step === 3) {
      const missing = requiredFiles.filter((f) => !files[f.key]);
      if (missing.length > 0) return setLocalError(`Attach: ${missing.map((m) => m.label).join(", ")}.`);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setLocalError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    if (!doc) return;
    const fd = new FormData();
    fd.set("documentTypeId", doc.id);
    fd.set("purpose", purpose);
    fd.set("academicYear", academicYear);
    for (const [key, file] of Object.entries(files)) fd.append(`file:${key}`, file);
    formAction(fd); // redirects to the new request on success
  }

  return (
    <Card className="overflow-hidden">
      <Stepper step={step} />

      <div className="p-5 sm:p-6">
        {(localError || state.error) && (
          <div role="alert" className="mb-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{localError ?? state.error}</span>
          </div>
        )}

        {step === 0 && (
          <fieldset>
            <legend className="text-sm font-medium text-ink">Select the document you need</legend>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {docTypes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDocTypeId(d.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors",
                    docTypeId === d.id
                      ? "border-accent bg-accent-soft ring-1 ring-accent"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
                  )}
                >
                  <span className={cn("mt-0.5 flex size-8 items-center justify-center rounded-md", docTypeId === d.id ? "bg-accent text-white" : "bg-surface-2 text-muted")}>
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{d.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{d.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && doc && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-ink">{doc.name}</h3>
              <p className="mt-1 text-sm text-muted">{doc.description}</p>
            </div>
            <Requirements title="Information you'll provide" icon={ListChecks} items={["Purpose of the request", "Academic year", ...doc.requirements.info]} />
            <Requirements
              title="Supporting files to upload"
              icon={Paperclip}
              items={requiredFiles.length ? requiredFiles.map((f) => f.label) : ["No supporting files required"]}
            />
            <p className="text-xs text-faint">Accepted: {ACCEPTED_HINT}</p>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-lg space-y-4">
            <TextArea
              label="Purpose of request"
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Required for a bank education-loan application."
            />
            <SelectField
              label="Academic year"
              options={ACADEMIC_YEARS}
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {requiredFiles.length === 0 && (
              <p className="text-sm text-muted">This document needs no supporting files. Continue to review.</p>
            )}
            {requiredFiles.map((f) => (
              <FileDrop
                key={f.key}
                label={f.label}
                file={files[f.key]}
                onSelect={(file) => {
                  setLocalError(null);
                  setFiles((prev) => ({ ...prev, [f.key]: file }));
                }}
                onClear={() => setFiles((prev) => {
                  const cp = { ...prev };
                  delete cp[f.key];
                  return cp;
                })}
                onError={setLocalError}
              />
            ))}
          </div>
        )}

        {step === 4 && doc && (
          <div className="space-y-4">
            <ReviewRow label="Document" value={doc.name} />
            <ReviewRow label="Purpose" value={purpose} />
            <ReviewRow label="Academic year" value={academicYear} />
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-faint">Attached files</div>
              <ul className="mt-1.5 space-y-1">
                {Object.entries(files).map(([key, file]) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-ink-2">
                    <Paperclip className="size-3.5 text-muted" aria-hidden />
                    {file.name} <span className="text-faint">({fmtBytes(file.size)})</span>
                  </li>
                ))}
                {Object.keys(files).length === 0 && <li className="text-sm text-faint">None</li>}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-2/50 px-5 py-3">
        <Button variant="ghost" onClick={back} disabled={step === 0 || pending}>
          <ChevronLeft className="size-4" aria-hidden /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={pending}>
            Continue <ChevronRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
            {pending ? "Submitting…" : "Submit Request"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface-2/40 px-4 py-3 text-xs">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-1">
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
              i < step ? "bg-ok text-white" : i === step ? "bg-accent text-white" : "bg-surface-2 text-faint ring-1 ring-border",
            )}
          >
            {i < step ? <Check className="size-3" aria-hidden /> : i + 1}
          </span>
          <span className={cn("whitespace-nowrap font-medium", i === step ? "text-ink" : "text-faint")}>{label}</span>
          {i < STEPS.length - 1 && <ChevronRight className="mx-1 size-3.5 text-faint" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function Requirements({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof ListChecks }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="size-4 text-muted" aria-hidden />
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 pl-6">
        {items.map((it) => (
          <li key={it} className="relative text-sm text-ink-2 before:absolute before:-left-4 before:top-2 before:size-1.5 before:rounded-full before:bg-border-strong">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-3 sm:flex-row sm:gap-4">
      <div className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-faint">{label}</div>
      <div className="text-sm text-ink">{value}</div>
    </div>
  );
}

function FileDrop({
  label,
  file,
  onSelect,
  onClear,
  onError,
}: {
  label: string;
  file?: File;
  onSelect: (f: File) => void;
  onClear: () => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) return onError(`${f.name}: unsupported type. Use PDF, JPG or PNG.`);
    if (f.size > MAX_FILE_BYTES) return onError(`${f.name} is larger than 5 MB.`);
    onSelect(f);
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 text-sm font-medium text-ink-2">{label}</div>
      {file ? (
        <div className="flex items-center gap-2 rounded-md bg-ok-soft px-3 py-2">
          <Check className="size-4 shrink-0 text-ok" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
          <span className="shrink-0 text-xs text-muted">{fmtBytes(file.size)}</span>
          <button onClick={onClear} className="ml-1 rounded p-1 text-muted hover:bg-surface hover:text-danger" aria-label={`Remove ${label}`}>
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-2/50 px-3 py-4 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <Upload className="size-4" aria-hidden />
          Choose file · {ACCEPTED_HINT}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  );
}
