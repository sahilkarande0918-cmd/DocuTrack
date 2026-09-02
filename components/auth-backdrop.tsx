"use client";

import { useEffect, useRef } from "react";

/**
 * Very restrained parallax for the entry/login background — two soft tinted
 * fields that drift a few pixels with the pointer. Disabled under
 * prefers-reduced-motion. Decorative only.
 */
export function AuthBackdrop() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        if (a.current) a.current.style.transform = `translate3d(${x * 10}px, ${y * 10}px, 0)`;
        if (b.current) b.current.style.transform = `translate3d(${x * -14}px, ${y * -8}px, 0)`;
      });
    }
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        ref={a}
        className="absolute -left-24 -top-24 size-[420px] rounded-full bg-accent/5 blur-3xl transition-transform duration-300 ease-out"
      />
      <div
        ref={b}
        className="absolute -bottom-32 right-0 size-[380px] rounded-full bg-info/5 blur-3xl transition-transform duration-300 ease-out"
      />
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(91% 0.006 258 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, oklch(91% 0.006 258 / 0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(circle at 50% 40%, black, transparent 78%)",
        }}
      />
    </div>
  );
}
