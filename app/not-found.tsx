import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <FileQuestion className="size-8 text-muted" aria-hidden />
      <h1 className="text-lg font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you're looking for doesn't exist, or you don't have access to it.
      </p>
      <Link href="/" className="mt-2 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:bg-accent-hover">
        Back to DocuTrack
      </Link>
    </div>
  );
}
