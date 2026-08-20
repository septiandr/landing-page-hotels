import { afterEach, describe, expect, it, vi } from "vitest";
import { assertPaymentProviderAllowed } from "./provider-guard";
import { PaymentConfigError, PaymentApiError } from "./errors";
import { MockPaymentProvider } from "./mock";
import { TemplatePaymentProvider } from "./template";
import { getPaymentProvider, isPaymentEnabled } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("assertPaymentProviderAllowed (PGW-003)", () => {
  it("mock dilarang di production", () => {
    expect(() => assertPaymentProviderAllowed("mock", "production")).toThrow(
      PaymentConfigError,
    );
  });

  it("none/kosong TIDAK ditolak (fitur mati sah di production)", () => {
    expect(() => assertPaymentProviderAllowed(undefined, "production")).not.toThrow();
    expect(() => assertPaymentProviderAllowed("none", "production")).not.toThrow();
  });

  it("provider nyata (template) diizinkan di production", () => {
    expect(() => assertPaymentProviderAllowed("template", "production")).not.toThrow();
  });

  it("mock diizinkan di dev/test", () => {
    expect(() => assertPaymentProviderAllowed("mock", "development")).not.toThrow();
    expect(() => assertPaymentProviderAllowed("mock", "test")).not.toThrow();
  });

  it("ALLOW_MOCK_PAYMENT=true = escape hatch eksplisit di production", () => {
    vi.stubEnv("ALLOW_MOCK_PAYMENT", "true");
    expect(() => assertPaymentProviderAllowed("mock", "production")).not.toThrow();
  });
});

describe("MockPaymentProvider", () => {
  it("membuat redirect URL palsu yang mencerminkan payload", async () => {
    const p = new MockPaymentProvider();
    const result = await p.createCheckout({
      orderId: "OB-20260901-001",
      amount: 1_000_000,
      currency: "IDR",
      itemName: "Deluxe King Room",
    });

    expect(result.provider).toBe("mock");
    expect(result.live).toBe(false);
    expect(result.transactionId).toBe("MOCK-OB-20260901-001");
    expect(result.redirectUrl).toContain("checkout.mock.local/pay");
    expect(result.redirectUrl).toContain("order_id=OB-20260901-001");
    expect(result.redirectUrl).toContain("amount=1000000");
    expect(result.redirectUrl).toContain("currency=IDR");
  });
});

describe("TemplatePaymentProvider (PGW-002)", () => {
  it("throw PaymentConfigError jika konfigurasi belum di-set", async () => {
    const p = new TemplatePaymentProvider(); // tanpa config, env kosong
    await expect(
      p.createCheckout({ orderId: "x", amount: 1, currency: "IDR" }),
    ).rejects.toThrow(PaymentConfigError);
  });

  it("memanggil API gateway dan mengembalikan redirectUrl + transactionId (live)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "pay_123",
        payment_url: "https://gateway.example/checkout/123",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const p = new TemplatePaymentProvider({
      baseUrl: "https://api.gateway.example",
      serverKey: "sk_test_abc",
    });
    const result = await p.createCheckout({
      orderId: "OB-20260901-001",
      amount: 500_000,
      currency: "IDR",
      customer: { email: "tamu@example.com" },
    });

    expect(result.provider).toBe("template");
    expect(result.live).toBe(true);
    expect(result.transactionId).toBe("pay_123");
    expect(result.redirectUrl).toBe("https://gateway.example/checkout/123");

    // pastikan request ke gateway benar: POST + body payload
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.gateway.example/v1/checkout");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as { external_id: string; amount: number };
    expect(body.external_id).toBe("OB-20260901-001");
    expect(body.amount).toBe(500_000);
  });

  it("throw PaymentApiError saat gateway menolak (non-OK)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "invalid credentials" }),
      }),
    );

    const p = new TemplatePaymentProvider({
      baseUrl: "https://api.gateway.example",
      serverKey: "sk_bad",
    });
    await expect(
      p.createCheckout({ orderId: "x", amount: 1, currency: "IDR" }),
    ).rejects.toThrow(PaymentApiError);
  });

  it("membaca konfigurasi dari env saat config tidak di-inject", async () => {
    vi.stubEnv("PAYMENT_TEMPLATE_API_BASE_URL", "https://api.gateway.example");
    vi.stubEnv("PAYMENT_TEMPLATE_SERVER_KEY", "sk_env");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "env_1", redirect_url: "https://x/pay" }),
      }),
    );

    const p = new TemplatePaymentProvider();
    const result = await p.createCheckout({ orderId: "x", amount: 1, currency: "IDR" });
    expect(result.transactionId).toBe("env_1");
    expect(result.live).toBe(true);
  });
});

describe("getPaymentProvider / isPaymentEnabled (PGW-001)", () => {
  it("none / kosong → null (fitur mati)", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "none");
    expect(getPaymentProvider()).toBeNull();
    expect(isPaymentEnabled()).toBe(false);
  });

  it("mock → MockPaymentProvider di dev", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("NODE_ENV", "test");
    const p = getPaymentProvider();
    expect(p).not.toBeNull();
    expect(p?.provider).toBe("mock");
    expect(isPaymentEnabled()).toBe(true);
  });

  it("template → TemplatePaymentProvider", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "template");
    const p = getPaymentProvider();
    expect(p?.provider).toBe("template");
  });

  it("mock di production (tanpa escape hatch) → throw", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getPaymentProvider()).toThrow(PaymentConfigError);
  });

  it("provider tak dikenal → throw PaymentConfigError", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "midtrans"); // belum diimplementasi
    expect(() => getPaymentProvider()).toThrow(PaymentConfigError);
  });
});