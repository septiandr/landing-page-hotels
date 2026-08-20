import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProvider } from "@/lib/payment";
import { PaymentApiError, PaymentConfigError } from "@/lib/payment/errors";

/**
 * PGW-002 — Buat checkout payment dari widget "Book Now".
 *
 * Server-side (API key gateway tidak pernah bocor ke client). Response:
 *   { data: { provider, transactionId, redirectUrl, live } }
 * Client redirect ke `redirectUrl`. Error mapping:
 *   400 → payload invalid / payment tidak dikonfigurasi
 *   502 → error dari gateway (PaymentApiError)
 *   503 → konfigurasi payment tidak lengkap (PaymentConfigError)
 *
 * Catatan template: setelah gateway nyata dipasang, verifikasi transaksi
 * dilakukan lewat webhook/callback (lihat doc/12-payment-gateway.md) —
 * endpoint ini HANYA membuat checkout session, TIDAK menandai order lunas.
 */

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  orderId: z.string().min(1).max(64),
  amount: z.number().positive(),
  currency: z.string().min(3).max(5).default("IDR"),
  itemName: z.string().max(200).optional(),
  customer: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().max(200).optional(),
      phone: z.string().max(30).optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(req: Request) {
  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "Pembayaran belum dikonfigurasi (PAYMENT_PROVIDER=none)" },
      { status: 400 },
    );
  }

  let payload: z.infer<typeof checkoutSchema>;
  try {
    const body = (await req.json().catch(() => null)) as unknown;
    payload = checkoutSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  try {
    const result = await provider.createCheckout(payload);
    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof PaymentApiError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Gagal membuat pembayaran" }, { status: 500 });
  }
}
