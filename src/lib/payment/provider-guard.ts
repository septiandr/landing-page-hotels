import { PaymentConfigError } from "./errors";

/**
 * Enforce PGW-003: provider payment "mock" TIDAK boleh aktif di production.
 * Fail-fast saat getPaymentProvider() dipanggil (bukan diam-diam memakai data
 * palsu). Dipisah dari index.ts agar testable tanpa chain impor lain.
 *
 * Provider "none"/kosong TIDAK ditolak di sini — itu berarti fitur mati dan
 * sah di production (widget lanjut ke flow Cloudbeds/WhatsApp).
 */
export function assertPaymentProviderAllowed(
  provider: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): void {
  if (nodeEnv === "production" && provider === "mock") {
    // Escape hatch EKSPLISIT untuk E2E/CI (webServer Playwright). JANGAN di-set
    // di environment production rill (lihat REL-001 checklist).
    if (process.env.ALLOW_MOCK_PAYMENT === "true") {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[payment] ALLOW_MOCK_PAYMENT=true terdeteksi — provider mock diizinkan. Ini HANYA untuk E2E/CI, jangan di production rill!",
        );
      }
      return;
    }
    throw new PaymentConfigError(
      'Provider payment "mock" dilarang di production — set PAYMENT_PROVIDER ke gateway nyata (mis. template/midtrans/xendit)',
    );
  }
}
