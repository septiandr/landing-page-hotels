import Link from "next/link";
import { Globe } from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { MobileMenu } from "./mobile-menu";

const navLinkClasses =
  "text-sm font-medium text-ink-soft transition-colors hover:text-ink " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded";

export function Header({ hotelName }: { hotelName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="#top"
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent-500" />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            {hotelName}
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={navLinkClasses}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Multi-language (Phase 2)"
            className="hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:inline-flex"
          >
            <Globe size={16} aria-hidden />
            ID
          </button>
          <a
            href="#booking"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-4 text-sm font-medium text-white transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Book Now
          </a>
          <MobileMenu hotelName={hotelName} />
        </div>
      </div>
    </header>
  );
}
