"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface GalleryProps {
  items: GalleryItem[];
}

export function Gallery({ items }: GalleryProps) {
  const [category, setCategory] = useState("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      if (item.category && item.category !== "ALL") seen.add(item.category);
    }
    return ["ALL", ...seen];
  }, [items]);

  const filtered = useMemo(
    () => (category === "ALL" ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  return (
    <section id="gallery" className="bg-surface-muted py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Gallery
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Experience Our Hotel
        </h2>

        {/* Filter kategori */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter kategori galeri">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                category === cat
                  ? "bg-primary-700 text-white"
                  : "bg-surface text-ink-soft hover:bg-primary-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-muted">Belum ada foto di kategori ini.</p>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((item, index) => (
              <li key={item.id} className={cn("relative aspect-[4/3]", index === 0 && "md:col-span-2 md:row-span-2")}>
                <button
                  type="button"
                  onClick={() => openLightbox(index)}
                  aria-label={`Lihat foto: ${item.altText || item.caption || "gallery"}`}
                  className="group block h-full w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <Image
                    src={item.image}
                    alt={item.altText || item.caption || ""}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <GalleryLightbox
          items={filtered}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function GalleryLightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const item = items[index];
  const total = items.length;

  const prev = useCallback(() => onNavigate((index - 1 + total) % total), [index, total, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % total), [index, total, onNavigate]);

  // Mount-only: kunci scroll + focus tombol close saat terbuka.
  // (Dekat dengan deps stabil supaya navigasi tidak mencuri fokus lagi.)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("[data-lightbox-close]")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  // Keyboard: Escape, panah kiri/kanan, dan focus trap.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        prev();
      } else if (event.key === "ArrowRight") {
        next();
      } else if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [prev, next, onClose]);

  // Swipe dasar untuk mobile.
  const touchX = useRef<number | null>(null);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.altText || item.caption || "Gallery"}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const delta = event.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > 40) {
          if (delta < 0) next();
          else prev();
        }
        touchX.current = null;
      }}
    >
      {/* Backdrop klik = tutup */}
      <button
        type="button"
        aria-label="Tutup galeri"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 h-full w-full cursor-zoom-out bg-transparent"
      />

      <div className="relative z-10 flex max-h-full flex-col items-center">
        <div className="relative max-h-[78vh] w-full">
          <Image
            src={item.image}
            alt={item.altText || item.caption || ""}
            width={1600}
            height={1067}
            sizes="(min-width: 768px) 80vw, 100vw"
            className="mx-auto max-h-[78vh] w-auto object-contain"
          />
        </div>

        {(item.caption || item.altText) && (
          <p className="mt-4 max-w-xl text-center text-sm text-white/85">
            {item.caption || item.altText}
          </p>
        )}
        <p className="mt-1 text-xs text-white/50">
          {index + 1} / {total}
        </p>
      </div>

      {/* Kontrol */}
      <button
        type="button"
        data-lightbox-close
        onClick={onClose}
        aria-label="Tutup galeri"
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X size={22} aria-hidden />
      </button>
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Foto sebelumnya"
            className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Foto berikutnya"
            className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={24} aria-hidden />
          </button>
        </>
      )}
    </div>
  );
}
