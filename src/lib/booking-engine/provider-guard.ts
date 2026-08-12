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
    throw new EngineConfigError(
      "Provider booking engine \"mock\" dilarang di production — set BOOKING_ENGINE_PROVIDER=cloudbeds",
    );
  }
}
