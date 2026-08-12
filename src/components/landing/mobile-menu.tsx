"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Menu, X } from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { cn } from "@/lib/utils";

export function MobileMenu({ hotelName }: { hotelName: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Kunci scroll body saat drawer terbuka.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus ke tombol close saat drawer terbuka; Escape menutup drawer.
  useEffect(() => {
    if (!open) return;
    const closeBtn = panelRef.current?.querySelector<HTMLButtonElement>("[data-drawer-close]");
    closeBtn?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Menu size={22} aria-hidden />
      </button>

      {open && (
        <div
          id="mobile-nav-drawer"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={close}
            className="absolute inset-0 bg-black/50"
          />

          {/* Drawer */}
          <div
            ref={panelRef}
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="font-display text-lg font-semibold">{hotelName}</span>
              <button
                type="button"
                data-drawer-close
                onClick={close}
                aria-label="Tutup menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <X size={22} aria-hidden />
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-base font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-auto space-y-3 border-t border-border p-4">
              <a
                href="#booking"
                onClick={close}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-primary-700 text-sm font-medium text-white transition-colors hover:bg-primary-800"
              >
                Book Now
              </a>
              <button
                type="button"
                title="Multi-language (Phase 2)"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-ink-soft"
              >
                <Globe size={16} aria-hidden /> ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
