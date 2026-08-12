"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";

/**
 * Sticky booking bar mobile (LP-019): muncul setelah scroll > 600px,
 * disembunyikan saat widget #booking sudah terlihat di viewport.
 * BOOK NOW → scroll halus ke widget.
 */
export function MobileBookingBar({
  price,
}: {
  price?: { price: number; currency: string } | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = document.getElementById("booking");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(false);
      },
      { rootMargin: "-40px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        {price ? (
          <p className="text-sm text-muted">
            From{" "}
            <span className="font-semibold text-ink">
              {formatCurrency(price.price, price.currency)}
            </span>
            /malam
          </p>
        ) : (
          <p className="text-sm font-medium text-ink">Book direct &amp; save</p>
        )}
        <button
          type="button"
          onClick={() =>
            document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })
          }
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
