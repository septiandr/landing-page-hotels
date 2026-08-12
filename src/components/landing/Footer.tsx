import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { NAV_LINKS } from "./nav-links";

// Ikon brand di-render inline (lucide tidak lagi menyediakan brand icons).
type BrandIconProps = { className?: string };
const SOCIAL_ICONS: Record<string, (props: BrandIconProps) => ReactNode> = {
  instagram: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6h1.3V4.8c-.6-.1-1.4-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4v2.4H7.8v3h2.4v7h3.3z" />
    </svg>
  ),
  twitter: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.5 3h3l-6.6 7.6L21.8 21h-6.1l-4.8-6.3L5.4 21h-3l7.1-8.1L2.5 3h6.2l4.3 5.7L17.5 3zm-1 16h1.7L7.9 4.7H6.1L16.5 19z" />
    </svg>
  ),
  youtube: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.5 3.2-5.5 3.2z" />
    </svg>
  ),
};


/**
 * LP-017 — Footer (PRD §28).
 * Semua kontak klikable: tel:, mailto:, wa.me. Tahun dinamis.
 */
export function Footer({
  hotelName,
  address,
  phone,
  email,
  whatsapp,
  socialLinks,
}: {
  hotelName: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  socialLinks?: Record<string, string> | null;
}) {
  const year = new Date().getFullYear();
  const waNumber = whatsapp?.replace(/^\+/, "");

  return (
    <footer className="bg-primary-950 text-primary-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="#top" className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent-500" />
              <span className="font-display text-lg font-semibold text-white">{hotelName}</span>
            </Link>
            {address && (
              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-primary-200/80">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0 text-accent-400" />
                {address}
              </p>
            )}
            {socialLinks && (
              <div className="mt-5 flex gap-2">
                {Object.entries(socialLinks).map(([key, url]) => {
                  const Icon = SOCIAL_ICONS[key];
                  if (!Icon) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={key}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-primary-100 transition hover:bg-accent-500 hover:text-primary-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kontak */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 transition hover:text-accent-400"
                  >
                    <Phone size={15} aria-hidden className="text-accent-400" /> {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 transition hover:text-accent-400"
                  >
                    <Mail size={15} aria-hidden className="text-accent-400" /> {email}
                  </a>
                </li>
              )}
              {waNumber && (
                <li>
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition hover:text-accent-400"
                  >
                    <MessageCircle size={15} aria-hidden className="text-accent-400" /> WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-accent-400">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#faq" className="transition hover:text-accent-400">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { href: "/terms", label: "Terms of Service" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/cancellation-policy", label: "Cancellation Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-accent-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-primary-200/60 sm:flex-row">
          <p>
            © {year} {hotelName}. All rights reserved.
          </p>
          <p>Book direct for the best available rate.</p>
        </div>
      </div>
    </footer>
  );
}
