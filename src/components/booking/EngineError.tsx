"use client";

import { AlertTriangle, MessageCircle, Phone } from "lucide-react";
import { EVENTS, track } from "@/lib/analytics";

/**
 * Fallback saat engine tidak tersedia (BK-007, PRD §32):
 * "We're temporarily unable to check availability..." + [WHATSAPP] + [CALL US].
 * WhatsApp message pre-filled dengan konteks pencarian.
 */
export interface EngineErrorProps {
  whatsapp?: string | null;
  phone?: string | null;
  context?: {
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    kids?: number;
  };
}

function waMessage(context?: EngineErrorProps["context"]): string {
  const parts = ["Halo, saya ingin menanyakan ketersediaan kamar."];
  if (context?.checkIn) {
    parts.push(
      `Tanggal: ${context.checkIn}${context.checkOut ? ` s/d ${context.checkOut}` : ""}`,
    );
  }
  if (context?.adults) {
    parts.push(`${context.adults} dewasa${context.kids ? `, ${context.kids} anak` : ""}.`);
  }
  return parts.join(" ");
}

export function EngineError({ whatsapp, phone, context }: EngineErrorProps) {
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp.replace(/^\+/, "")}?text=${encodeURIComponent(waMessage(context))}`
    : null;
  const telHref = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
      <AlertTriangle className="mx-auto h-6 w-6 text-amber-600" aria-hidden />
      <p className="mt-2 font-medium text-amber-900">
        Saat ini kami tidak dapat memeriksa ketersediaan kamar.
      </p>
      <p className="mt-1 text-sm text-amber-800">
        Silakan hubungi tim reservasi kami — kami siap membantu Anda.
      </p>
      {(waHref || telHref) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(EVENTS.clickWhatsapp, { context: "engine_fallback" })}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={17} aria-hidden /> WhatsApp
            </a>
          )}
          {telHref && (
            <a
              href={telHref}
              onClick={() => track(EVENTS.clickPhone, { context: "engine_fallback" })}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-amber-300 px-5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              <Phone size={17} aria-hidden /> Call Us
            </a>
          )}
        </div>
      )}
    </div>
  );
}
