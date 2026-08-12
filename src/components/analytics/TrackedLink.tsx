"use client";

import type { MouseEvent, ReactNode } from "react";
import NextLink from "next/link";
import { track, type EventName } from "@/lib/analytics";

interface TrackedLinkProps {
  event: EventName;
  params?: Record<string, unknown>;
  /** Pakai next/link (client navigation) untuk link internal. */
  internal?: boolean;
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  ariaLabel?: string;
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Link yang men-track event klik (ANA-003) — satu titik untuk `click_whatsapp`,
 * `click_phone`, `click_email`, `click_map`, `view_room`, dst.
 */
export function TrackedLink({
  event,
  params,
  internal,
  href,
  className,
  target,
  rel,
  ariaLabel,
  children,
  onClick,
}: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    track(event, params);
    onClick?.(e);
  };

  if (internal) {
    return (
      <NextLink
        href={href}
        className={className}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
        onClick={handleClick}
      >
        {children}
      </NextLink>
    );
  }
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
