import { PaymentApiError, PaymentConfigError } from "./errors";
import type { PaymentCheckoutRequest, PaymentCheckoutResult, PaymentGatewayAdapter } from "./types";

/**
 * TEMPLATE provider (PGW-002) — kerangka integrasi payment gateway nyata.
 *
 * Cara pakai:
 *  1. Salin file ini menjadi provider gateway Anda (mis. `midtrans.ts` /
 *     `xendit.ts` / `doku.ts`) dan ubah `provider` + `readEnvConfig`.
 *  2. Isi bagian bertanda `TODO` dengan panggilan API gateway sesungguhnya.
 *  3. Daftarkan di `src/lib/payment/index.ts` (tambah case + env provider).
 *  4. Atur env (lihat .env.example & doc/12-payment-gateway.md) dan verifikasi
 *     dengan `PAYMENT_PROVIDER=template` + test.
 *
 * Kontrak yang WAJIB dipenuhi implementer:
 *  - Kembalikan `redirectUrl` tempat user menyelesaikan pembayaran.
 *  - Kembalikan `transactionId` unik untuk verifikasi webhook/callback.
 *  - Throw `PaymentApiError` saat gateway menolak; `PaymentConfigError` saat
 *    env belum di-set. JANGAN pernah simpan order lokal sebelum pembayaran
 *    dikonfirmasi (lihat webhook verification di doc).
 */

export interface TemplatePaymentConfig {
  /** Base URL API gateway (sandbox/development dulu). */
  baseUrl: string;
  /** Kredensial server (API key / server key). HANYA di server, jangan NEXT_PUBLIC_*. */
  serverKey: string;
}

function readEnvConfig(): TemplatePaymentConfig | null {
  const baseUrl = process.env.PAYMENT_TEMPLATE_API_BASE_URL;
  const serverKey = process.env.PAYMENT_TEMPLATE_SERVER_KEY;
  if (!baseUrl || !serverKey) return null;
  return { baseUrl, serverKey };
}

export class TemplatePaymentProvider implements PaymentGatewayAdapter {
  readonly provider = "template" as const;
  private config: TemplatePaymentConfig | null;

  /** `config` opsional → injeksi untuk test; default baca dari env. */
  constructor(config?: TemplatePaymentConfig) {
    this.config = config ?? readEnvConfig();
  }

  async createCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult> {
    if (!this.config) {
      throw new PaymentConfigError(
        "PAYMENT_TEMPLATE_API_BASE_URL / PAYMENT_TEMPLATE_SERVER_KEY belum di-set — lengkapi .env atau ganti provider",
      );
    }

    // =====================================================================
    // TODO — GANTI dengan panggilan API gateway sesungguhnya.
    // Contoh alur umum (Midtrans Snap / Xendit / DOKU / Tripay):
    //   1. POST ke endpoint `checkout`/`create-invoice` gateway.
    //   2. Header auth sesuai vendor (Basic token, X-API-KEY, dsb.).
    //   3. Body: external_id, amount (major unit — konversi ke minor sesuai
    //      vendor), currency, description, customer, item_details, metadata.
    //   4. Response: ambil `payment_url`/`redirect_url` + `id`/`transaction_id`.
    // =====================================================================
    const res = await fetch(`${this.config.baseUrl}/v1/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: sesuaikan skema auth vendor Anda. Contoh Basic token:
        // Authorization: `Basic ${Buffer.from(this.config.serverKey).toString("base64")}`,
        Authorization: `Bearer ${this.config.serverKey}`,
      },
      body: JSON.stringify({
        external_id: req.orderId,
        amount: req.amount,
        currency: req.currency,
        description: req.itemName,
        customer: req.customer,
        metadata: req.metadata ?? {},
      }),
      // Timeout wajib — gateway lambat tidak boleh menggantung request.
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | {
          transactionId?: string;
          id?: string;
          redirect_url?: string;
          payment_url?: string;
          checkout_url?: string;
          message?: string;
        }
      | null;

    if (!res.ok) {
      throw new PaymentApiError(res.status, json?.message ?? `Payment API ${res.status}`);
    }

    return {
      provider: this.provider,
      transactionId: String(json?.transactionId ?? json?.id ?? req.orderId),
      redirectUrl:
        json?.redirect_url ?? json?.payment_url ?? json?.checkout_url ?? "",
      live: true,
    };
  }
}
