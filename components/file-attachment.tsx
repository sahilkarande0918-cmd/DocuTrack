import { FileText, Download } from "lucide-react";
import { fmtBytes } from "@/lib/format";

export type FileRow = { id: string; fileName: string; size: number };

export function FileAttachment({ file }: { file: FileRow }) {
  return (
    <a
      href={`/api/files/${file.id}`}
      target="_blank"
      rel="noopener"
      className="group flex items-center gap-3 rounded-md border border-border px-3 py-2 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <FileText className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.fileName}</span>
      <span className="shrink-0 text-xs text-faint">{fmtBytes(file.size)}</span>
      <Download className="size-4 shrink-0 text-faint group-hover:text-accent" aria-hidden />
    </a>
  );
}
