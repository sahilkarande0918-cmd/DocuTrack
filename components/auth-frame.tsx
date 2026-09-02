import type { ReactNode } from "react";
import { Brandmark } from "@/components/brand";
import { AuthBackdrop } from "@/components/auth-backdrop";

export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-paper">
      <AuthBackdrop />
      <header className="relative z-10 px-5 py-5 sm:px-8">
        <Brandmark />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="relative z-10 px-5 py-5 text-center text-xs text-faint sm:px-8">
        MIT Academy of Engineering, Alandi, Pune · Official document portal
      </footer>
    </div>
  );
}
