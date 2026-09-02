"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { studentNav, facultyNav, type NavSection } from "@/lib/nav";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Brandmark } from "@/components/brand";
import { ChatWidget } from "@/components/chat-widget";
import { cn } from "@/lib/cn";

type ShellUser = { name: string; email: string; roleLabel: string; initials: string };

export function AppShell({
  role,
  user,
  badges,
  children,
}: {
  role: Role;
  user: ShellUser;
  badges: Record<string, number>;
  children: React.ReactNode;
}) {
  const sections: NavSection[] = role === "STUDENT" ? studentNav() : facultyNav(role);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("dt-sidebar-collapsed") === "1");
    } catch {}
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("dt-sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  return (
    <div className="flex min-h-dvh bg-paper">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col bg-sidebar lg:flex transition-[width] duration-200",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <SidebarBody
          sections={sections}
          user={user}
          badges={badges}
          pathname={pathname}
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.15 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar"
              initial={{ x: reduce ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : "-100%" }}
              transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
              <SidebarBody
                sections={sections}
                user={user}
                badges={badges}
                pathname={pathname}
                collapsed={false}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Minimal mobile bar — trigger only, not a nav */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-md text-ink-2 hover:bg-surface-2"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Brandmark showTagline={false} className="min-w-0" />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <ChatWidget role={role} />
    </div>
  );
}

function SidebarBody({
  sections,
  user,
  badges,
  pathname,
  collapsed,
  onToggle,
}: {
  sections: NavSection[];
  user: ShellUser;
  badges: Record<string, number>;
  pathname: string;
  collapsed: boolean;
  onToggle?: () => void;
}) {
  return (
    <>
      <div className={cn("flex items-center gap-2 px-3 pt-4 pb-3", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed ? (
          <Brandmark tone="dark" showTagline={false} />
        ) : (
          <span className="text-base font-extrabold tracking-tight text-white">MIT</span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "hidden size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink lg:flex",
              collapsed && "absolute left-1/2 top-14 -translate-x-1/2",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="mx-3 mb-2 rounded-md bg-sidebar-hover/60 px-3 py-2">
          <div className="text-xs font-medium text-sidebar-ink">DocuTrack</div>
          <div className="text-[11px] text-sidebar-muted">Document Portal</div>
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && !collapsed && (
              <div className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                        collapsed && "justify-center",
                        active
                          ? "bg-sidebar-hover font-medium text-white"
                          : "text-sidebar-ink hover:bg-sidebar-hover/70 hover:text-white",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" aria-hidden />
                      )}
                      <Icon className="size-[18px] shrink-0" aria-hidden />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!!badge && badge > 0 && (
                        <span
                          className={cn(
                            "flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink",
                            collapsed && "absolute -right-0.5 -top-0.5 size-4 min-w-0 px-0",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-sidebar-hover/70 p-2">
        <div className={cn("flex items-center gap-2.5 rounded-md px-2 py-2", collapsed && "justify-center")}>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-hover text-xs font-semibold text-sidebar-ink">
            {user.initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-ink">{user.name}</div>
              <div className="truncate text-xs text-sidebar-muted">{user.roleLabel}</div>
            </div>
          )}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "mt-0.5 flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && "Sign out"}
          </button>
        </form>
      </div>
    </>
  );
}
