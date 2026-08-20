# 13 — Payment Gateway (PGW)

> Fitur: integrasi payment gateway — provider factory (none/mock/template), guard production, mock dev, dan skeleton gateway nyata.
> Kode: PGW-001, PGW-002, PGW-003 · lihat `doc/12-payment-gateway.md`

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/payment/payment.test.ts` | `assertPaymentProviderAllowed`, `MockPaymentProvider`, `TemplatePaymentProvider`, `getPaymentProvider`, `isPaymentEnabled` |

## Kasus Uji (15)

### `assertPaymentProviderAllowed` (PGW-003)
- Mock **dilarang** di production (throw `PaymentConfigError`).
- `none`/kosong **tidak** ditolak di production (fitur mati sah).
- Provider nyata (`template`) diizinkan di production.
- Mock diizinkan di dev/test.
- `ALLOW_MOCK_PAYMENT=true` = escape hatch eksplisit di production (untuk E2E/CI).

### `MockPaymentProvider` (PGW-001)
- Membuat redirect URL palsu yang mencerminkan payload (`order_id`, `amount`, `currency`, `email`, `item`).
- `provider: "mock"`, `live: false`, `transactionId: MOCK-<orderId>`.

### `TemplatePaymentProvider` (PGW-002)
- Tanpa konfigurasi → `PaymentConfigError`.
- Dengan config + `fetch` OK → mengembalikan `transactionId` & `redirectUrl` (live: true); POST ke `{baseUrl}/v1/checkout` dengan body payload benar.
- Gateway menolak (non-OK) → `PaymentApiError`.
- Membaca konfigurasi dari env saat config tidak di-inject.

### `getPaymentProvider` / `isPaymentEnabled`
- `none`/kosong → `null` & `isPaymentEnabled() === false`.
- `mock` di dev → `MockPaymentProvider`; `isPaymentEnabled() === true`.
- `template` → `TemplatePaymentProvider`.
- `mock` di production (tanpa escape hatch) → throw.
- Provider tak dikenal (mis. `midtrans` belum diimplementasi) → throw `PaymentConfigError`.

## Cara Menjalankan

```bash
npx vitest run src/lib/payment
```

## Catatan

- Pola sama persis dengan booking-engine (`provider-guard`, factory, mock) — konsisten di seluruh codebase.
- API key gateway hanya ada di server (`/api/checkout`); client hanya menerima `redirectUrl`.
- Setelah gateway nyata dipasang, tambahkan test per provider + webhook verification (lihat `doc/12-payment-gateway.md` §4–5).
