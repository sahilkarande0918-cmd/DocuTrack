import {
  LayoutDashboard,
  FilePlus2,
  Files,
  Activity,
  Bell,
  FileDown,
  User,
  Inbox,
  TriangleAlert,
  BadgeCheck,
  Archive,
  Users,
  FileCog,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { canApprove, isAdmin } from "@/lib/roles";

export type NavItem = { href: string; label: string; icon: LucideIcon; badgeKey?: string };
export type NavSection = { label?: string; items: NavItem[] };

export function studentNav(): NavSection[] {
  return [
    {
      items: [
        { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/student/new-request", label: "New Request", icon: FilePlus2 },
        { href: "/student/requests", label: "My Requests", icon: Files },
        { href: "/student/track", label: "Track Request", icon: Activity },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/student/notifications", label: "Notifications", icon: Bell, badgeKey: "unread" },
        { href: "/student/documents", label: "Documents", icon: FileDown },
        { href: "/student/profile", label: "Profile", icon: User },
      ],
    },
  ];
}

export function facultyNav(role: Role): NavSection[] {
  const workflow: NavItem[] = [
    { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/requests", label: "All Requests", icon: Files },
    { href: "/faculty/pending", label: "Pending Review", icon: Inbox, badgeKey: "pending" },
    { href: "/faculty/corrections", label: "Corrections", icon: TriangleAlert, badgeKey: "corrections" },
  ];
  if (canApprove(role)) {
    workflow.push({ href: "/faculty/approvals", label: "Approvals", icon: BadgeCheck, badgeKey: "approvals" });
  }
  workflow.push({ href: "/faculty/completed", label: "Completed", icon: Archive });

  const sections: NavSection[] = [
    { items: workflow },
    {
      label: "Account",
      items: [
        { href: "/faculty/notifications", label: "Notifications", icon: Bell, badgeKey: "unread" },
        { href: "/faculty/profile", label: "Profile", icon: User },
      ],
    },
  ];

  if (isAdmin(role)) {
    sections.push({
      label: "Administration",
      items: [
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/document-types", label: "Document Types", icon: FileCog },
        { href: "/admin/activity", label: "Activity Log", icon: ScrollText },
      ],
    });
  }

  return sections;
}
