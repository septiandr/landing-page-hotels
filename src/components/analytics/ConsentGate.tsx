"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getConsent, setConsent, type ConsentState } from "@/lib/consent";
import { CookieConsent } from "./CookieConsent";

/**
 * SEC-004 — Gerbang consent untuk script analytics.
 * - "unknown" (belum memilih) → tampilkan banner, JANGAN load script apa pun.
 * - "accepted"              → mount children (GTM/GA4/Meta/TikTok).
 * - "rejected"              → jangan render apa pun (DoD: 0 request vendor).
 *
 * Store consent mini via useSyncExternalStore:
 * - Server snapshot = "unknown" (banner tidak pernah di-SSR penuh? tidak —
 *   tetap dirender sebagai unknown → banner, lalu client menyesuaikan).
 * - Client snapshot membaca localStorage; perubahan via updateConsent()
 *   me-notify subscriber sehingga re-render tanpa setState manual.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConsentState {
  return getConsent();
}

function getServerSnapshot(): ConsentState {
  return "unknown";
}

function updateConsent(state: Exclude<ConsentState, "unknown">): void {
  setConsent(state);
  listeners.forEach((l) => l());
}

export function ConsentGate({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (consent === "unknown") {
    return <CookieConsent onDecision={updateConsent} />;
  }

  if (consent === "rejected") return null;

  return <>{children}</>;
}
