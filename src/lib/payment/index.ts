import type { PaymentGatewayAdapter } from "./types";
import { MockPaymentProvider } from "./mock";
import { TemplatePaymentProvider } from "./template";
import { assertPaymentProviderAllowed } from "./provider-guard";
import { PaymentConfigError } from "./errors";

export { assertPaymentProviderAllowed } from "./provider-guard";

/**
 * Factory payment (PGW-002) — UI tidak pernah tahu provider mana yang aktif.
 *
 *   PAYMENT_PROVIDER=none / kosong → null (fitur mati; widget pakai flow lama)
 *   PAYMENT_PROVIDER=mock          → MockPaymentProvider (dev & E2E)
 *   PAYMENT_PROVIDER=template      → TemplatePaymentProvider (skeleton gateway)
 *
 * Provider lain (midtrans/xendit/doku, dsb.) → tambahkan case + file provider
 * (lihat doc/12-payment-gateway.md).
 */
export function getPaymentProvider(): PaymentGatewayAdapter | null {
  const provider = process.env.PAYMENT_PROVIDER;
  if (!provider || provider === "none") return null;

  assertPaymentProviderAllowed(provider);

  switch (provider) {
    case "mock":
      return new MockPaymentProvider();
    case "template":
      return new TemplatePaymentProvider();
    default:
      throw new PaymentConfigError(`Provider payment tidak dikenal: "${provider}"`);
  }
}

/**
 * Server-only: apakah payment gateway aktif? Dipakai server component untuk
 * meneruskan `paymentEnabled` ke widget (client). Provider "none"/kosong → false.
 */
export function isPaymentEnabled(): boolean {
  const provider = process.env.PAYMENT_PROVIDER;
  return !!provider && provider !== "none";
}

export type { PaymentGatewayAdapter } from "./types";
export type {
  PaymentCheckoutRequest,
  PaymentCheckoutResult,
  PaymentCustomer,
  PaymentProviderName,
} from "./types";
