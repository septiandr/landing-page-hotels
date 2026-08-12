"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  BedDouble,
  BookOpenText,
  Building2,
  CalendarClock,
  FileText,
  Images,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageSquareQuote,
  Settings,
  Sparkles,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/client";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Permission yang dibutuhkan — null = semua role. */
  permission?: "content" | "promotion" | "publish" | "settings" | "users" | "analytics" | null;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null },
  { href: "/admin/rooms", label: "Rooms", icon: BedDouble, permission: "content" },
  { href: "/admin/gallery", label: "Gallery", icon: Images, permission: "content" },
  { href: "/admin/promotions", label: "Promotions", icon: TicketPercent, permission: "promotion" },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, permission: "content" },
  { href: "/admin/experiences", label: "Experiences", icon: Sparkles, permission: "content" },
  { href: "/admin/attractions", label: "Attractions", icon: MapPin, permission: "content" },
  { href: "/admin/faqs", label: "FAQ", icon: BookOpenText, permission: "content" },
  { href: "/admin/amenities", label: "Amenities", icon: Building2, permission: "content" },
  { href: "/admin/settings/hotel", label: "Hotel Profile", icon: Settings, permission: "settings" },
  { href: "/admin/settings/seo", label: "SEO Settings", icon: FileText, permission: "settings" },
  { href: "/admin/users", label: "Users", icon: Users, permission: "users" },
  { href: "/admin/audit-log", label: "Audit Log", icon: CalendarClock, permission: "analytics" },
];

export function filteredNav(role: Role): NavItem[] {
  // Sumber kebenaran matriks: lib/rbac.ts (VIEWER tidak punya akses CMS).
  return NAV_ITEMS.filter((item) => item.permission == null || can(role, item.permission));
}

export function Sidebar({ role, userName }: { role: Role; userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = filteredNav(role);

  const nav = (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-primary-700 text-white"
                : "text-ink-soft hover:bg-ink/5 hover:text-ink",
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-white lg:flex">
        <SidebarHeader />
        {nav}
        <SidebarFooter role={role} userName={userName} />
      </aside>

      {/* Drawer mobile */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <SidebarHeader compact />
              <button
                aria-label="Tutup menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-ink-soft hover:bg-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter role={role} userName={userName} />
          </aside>
        </div>
      ) : null}

      {/* Topbar mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <SidebarHeader compact />
        <button
          aria-label="Buka menu"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-ink-soft hover:bg-ink/5"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>
    </>
  );
}

function SidebarHeader({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700 text-sm font-bold text-white">
        T
      </div>
      {!compact ? (
        <div>
          <p className="font-display text-sm font-semibold text-ink">Taman Sari CMS</p>
          <p className="text-xs text-ink-soft">Hotel Landing Page</p>
        </div>
      ) : null}
    </div>
  );
}

function SidebarFooter({ role, userName }: { role: Role; userName: string }) {
  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{userName}</p>
          <p className="text-xs text-ink-soft">
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
            {role}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
          aria-label="Keluar"
        >
          <SignOutIcon />
        </button>
      </div>
    </div>
  );
}

function SignOutIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
