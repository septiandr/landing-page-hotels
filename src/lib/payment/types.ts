/**
 * Kontrak payment gateway (PGW-002) — adapter pattern, analog booking-engine.
 * UI tidak pernah tahu provider mana yang aktif; semua lewat interface ini.
 *
 * Provider tersedia:
 * - "none"     → fitur mati, widget lanjut ke flow lama (Cloudbeds / WhatsApp)
 * - "mock"     → dev & E2E, redirect ke URL palsu (tanpa transaksi nyata)
 * - "template" → SKELETON integrasi gateway nyata (mis. Midtrans/Xendit/DOKU).
 *                Salin ke file provider baru (mis. `midtrans.ts`) dan isi TODO
 *                yang ditandai. Lihat doc/12-payment-gateway.md.
 */

export type PaymentProviderName = "none" | "mock" | "template";

export interface PaymentCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export interface PaymentCheckoutRequest {
  /** Order id unik (mis. `OB-YYYYMMDD-NNN` / event_id booking). */
  orderId: string;
  /** Total yang harus dibayar, dalam satuan mata uang (bukan minor unit). */
  amount: number;
  currency: string;
  customer?: PaymentCustomer;
  /** Deskripsi item, mis. "Deluxe King Room — 2026-09-01 s/d 2026-09-03". */
  itemName?: string;
  /** Diteruskan ke gateway sebagai metadata transaksi. */
  metadata?: Record<string, string>;
}

export interface PaymentCheckoutResult {
  provider: PaymentProviderName;
  /** ID transaksi di payment gateway (untuk verifikasi webhook nanti). */
  transactionId: string;
  /** Redirect user ke URL ini untuk menyelesaikan pembayaran. */
  redirectUrl: string;
  /** true = gateway nyata; false = mock/dev. */
  live: boolean;
}

export interface PaymentGatewayAdapter {
  provider: PaymentProviderName;
  /**
   * Buat checkout session → URL redirect + transactionId.
   * Reject (PaymentConfigError / PaymentApiError) → caller map ke error API
   * (jangan crash / jangan simpan order tanpa konfirmasi pembayaran).
   */
  createCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult>;
}
