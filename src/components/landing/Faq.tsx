"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  BOOKING: "Booking",
  HOTEL: "Hotel",
  FACILITIES: "Facilities",
  FAMILY: "Family",
};

/**
 * LP-015 — FAQ accordion (PRD §26).
 * Satu panel terbuka (accordion mode), aksesibel: tombol aria-expanded +
 * aria-controls, panel role="region". JSON-LD FAQPage dirender di server
 * (page.tsx, SEO-004).
 */
export function Faq({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (items.length === 0) return null;

  const categories = Array.from(new Set(items.map((f) => f.category)));

  return (
    <section id="faq" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          FAQ
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Frequently Asked Questions
        </h2>

        <div className="mt-12 space-y-10">
          {categories.map((category) => {
            const categoryItems = items.filter((f) => f.category === category);
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
                  {categoryItems.map((item) => {
                    const open = openId === item.id;
                    const panelId = `faq-panel-${item.id}`;
                    return (
                      <div key={item.id}>
                        <h4>
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={panelId}
                            onClick={() => setOpenId(open ? null : item.id)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:text-base"
                          >
                            {item.question}
                            <ChevronDown
                              size={18}
                              aria-hidden
                              className={cn(
                                "shrink-0 text-muted transition-transform duration-200",
                                open && "rotate-180 text-primary-700",
                              )}
                            />
                          </button>
                        </h4>
                        <div
                          id={panelId}
                          role="region"
                          hidden={!open}
                          className="px-5 pb-5"
                        >
                          <p className="text-sm leading-relaxed text-muted">{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
