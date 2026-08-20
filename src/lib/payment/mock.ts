import type { PaymentCheckoutRequest, PaymentCheckoutResult, PaymentGatewayAdapter } from "./types";

/**
 * MockPaymentProvider (PGW-001) — dev & E2E.
 * Tidak membuat transaksi nyata; mengembalikan URL redirect palsu yang
 * mencerminkan payload, agar UI/widget bisa diuji tanpa kredensial gateway.
 */
export class MockPaymentProvider implements PaymentGatewayAdapter {
  readonly provider = "mock" as const;

  async createCheckout(req: PaymentCheckoutRequest): Promise<PaymentCheckoutResult> {
    const params = new URLSearchParams({
      order_id: req.orderId,
      amount: String(req.amount),
      currency: req.currency,
    });
    if (req.customer?.email) params.set("email", req.customer.email);
    if (req.itemName) params.set("item", req.itemName);

    return {
      provider: this.provider,
      transactionId: `MOCK-${req.orderId}`,
      redirectUrl: `https://checkout.mock.local/pay?${params.toString()}`,
      live: false,
    };
  }
}
