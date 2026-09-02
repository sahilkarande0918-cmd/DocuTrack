"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import type { Role } from "@prisma/client";
import { RobotFace } from "@/components/robot-face";
import { isStaff } from "@/lib/roles";
import { cn } from "@/lib/cn";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatWidget({ role, name }: { role: Role; name: string }) {
  const staff = isStaff(role);
  const firstName = name.trim().split(" ")[0] || (staff ? "there" : "there");
  const greeting = staff
    ? `Hi ${firstName}! I'm Emilia. Ask me about any student's request status, where a document is, who's handling it, workload, or institute contacts.`
    : `Hi ${firstName}! I'm Emilia. I can tell you the status of your document requests, how the process works, or who to contact. What do you need?`;
  const placeholder = staff ? "Ask about a student or request…" : "Ask about your documents…";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m.role !== "assistant" || m !== next[0]) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "Sorry, I couldn't answer that." }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn't reach the assistant. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.97 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 flex h-[min(30rem,70vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-pop)]"
          >
            {/* header */}
            <div className="flex items-center gap-2.5 bg-sidebar px-4 py-3 text-white">
              <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
                <RobotFace className="size-6 text-white" eyes="happy" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <MessageCircle className="size-4" aria-hidden />
                  Emilia
                </div>
                <div className="text-[11px] text-white/60">{staff ? "Staff assistant" : "Student assistant"}</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close chat">
                <X className="size-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-paper px-3 py-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <RobotFace className="size-4" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                      m.role === "user"
                        ? "rounded-br-sm bg-accent text-accent-ink"
                        : "rounded-bl-sm bg-surface text-ink ring-1 ring-border",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <RobotFace className="size-4" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface px-3 py-2.5 ring-1 ring-border">
                    <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="border-t border-border bg-surface p-2.5">
              <div className="flex items-end gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={placeholder}
                  className="h-10 flex-1 rounded-full border border-border-strong bg-surface px-4 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-50"
                  aria-label="Send"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
              <p className="mt-1.5 px-1 text-center text-[10px] text-faint">Answers portal questions only · AI can make mistakes.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* floating robot button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Emilia" : "Open Emilia"}
        className="relative flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-pop)] ring-1 ring-black/5 hover:bg-accent-hover"
        animate={reduce || open ? {} : { y: [0, -5, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="size-6" />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <RobotFace className="size-8" eyes="happy" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-ok ring-2 ring-surface" aria-hidden />}
      </motion.button>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="size-1.5 rounded-full bg-faint"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
