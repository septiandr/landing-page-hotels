/** SEC-004 — Persistensi keputusan consent (client-only). */

export const CONSENT_KEY = "analytics-consent";

export type ConsentState = "accepted" | "rejected" | "unknown";

/** Baca consent dari localStorage — aman dipanggil saat SSR (return "unknown"). */
export function getConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "accepted" || value === "rejected") return value;
  } catch {
    // localStorage tidak tersedia (private mode / disabled) → default unknown.
  }
  return "unknown";
}

export function setConsent(state: Exclude<ConsentState, "unknown">): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, state);
  } catch {
    // no-op — konsisten dengan getConsent.
  }
}
