import { EngineConfigError } from "./errors";

/**
 * Enforce REL-001: provider "mock" TIDAK boleh aktif di production.
 * Fail-fast saat getEngine() dipanggil (bukan diam-diam pakai data palsu).
 * Dipisah dari index.ts agar testable tanpa memuat chain impor db.
 */
export function assertProviderAllowed(
  provider: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): void {
  if (nodeEnv === "production" && (provider === "mock" || !provider)) {
    // Escape hatch EKSPLISIT untuk E2E/CI (webServer Playwright). JANGAN di-set
    // di environment production rill (lihat REL-001 checklist).
    if (process.env.ALLOW_MOCK_ENGINE === "true") {
      // Visibilitas: flag ter-set di production → tampilkan warning di log
      // supaya misconfig terlihat, bukan diam-diam memakai data palsu.
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[booking-engine] ALLOW_MOCK_ENGINE=true terdeteksi — provider mock diizinkan. Ini HANYA untuk E2E/CI, jangan di production rill!",
        );
      }
      return;
    }
    throw new EngineConfigError(
      "Provider booking engine \"mock\" dilarang di production — set BOOKING_ENGINE_PROVIDER=cloudbeds",
    );
  }
}
