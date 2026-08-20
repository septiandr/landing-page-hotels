# 12 — Payment Gateway Integration (Template)

> **Tujuan**: menyiapkan infrastruktur integrasi payment gateway sebagai **template** — tinggal pilih provider, salin kerangka, isi API, dan aktifkan lewat env. Tanpa konfigurasi, fitur mati dan "Book Now" tetap ke flow lama (Cloudbeds → WhatsApp).
> Kode: **PGW-001** (provider factory) · **PGW-002** (checkout API + adapter) · **PGW-003** (provider guard production)

## Alur Saat Ini → Target

| Kondisi | Perilaku "Book Now" |
|---|---|
| `PAYMENT_PROVIDER=none` (default) | **Flow lama**: deep link Cloudbeds → fallback WhatsApp (BK-007) |
| `PAYMENT_PROVIDER=mock` (dev/E2E) | POST `/api/checkout` → redirect ke URL palsu `checkout.mock.local` |
| `PAYMENT_PROVIDER=template` | POST `/api/checkout` → memanggil API gateway (isi TODO) → redirect ke halaman bayar |
| Provider nyata (midtrans/xendit/doku) | Salin `template.ts` → implementasi nyata → redirect ke checkout gateway |

## Arsitektur (Adapter Pattern — mirip booking-engine)

```text
BookingWidget (client)
   │  "Book Now"
   ▼
POST /api/checkout  ← server-only, API key gateway tidak bocor ke client
   ▼
getPaymentProvider()  (src/lib/payment/index.ts — baca PAYMENT_PROVIDER)
   ├── null            → 400 "Pembayaran belum dikonfigurasi" (widget fallback ke Cloudbeds/WhatsApp)
   ├── MockPaymentProvider      (src/lib/payment/mock.ts — dev & E2E)
   ├── TemplatePaymentProvider  (src/lib/payment/template.ts — SKELETON gateway)
   └── <provider-anda>          (mis. midtrans.ts / xendit.ts — TODO: buat & daftarkan)
   ▼
{ redirectUrl, transactionId, live }  → widget redirect → user bayar
   ▼
webhook /api/webhooks/payment  (BELUM ada — langkah berikutnya, lihat §5)
```

### File

| File | Fungsi |
|---|---|
| `src/lib/payment/types.ts` | Interface `PaymentGatewayAdapter` + `PaymentCheckoutRequest/Result` |
| `src/lib/payment/errors.ts` | `PaymentConfigError` (env kurang) & `PaymentApiError` (gateway menolak) |
| `src/lib/payment/provider-guard.ts` | `assertPaymentProviderAllowed` — mock dilarang di production (PGW-003) |
| `src/lib/payment/mock.ts` | Provider mock — redirect URL palsu, `live:false` |
| `src/lib/payment/template.ts` | **SKELETON** — template integrasi gateway nyata (TODO terstruktur) |
| `src/lib/payment/index.ts` | `getPaymentProvider()` (factory) + `isPaymentEnabled()` (server) |
| `src/app/api/checkout/route.ts` | POST — buat checkout session, return `{ data: { redirectUrl, transactionId, live } }` |
| `src/lib/payment/payment.test.ts` | Unit test: guard, mock, template, factory (15 test) |

## Konfigurasi (.env)

```env
# none (default) | mock | template | <provider-anda>
PAYMENT_PROVIDER="none"
# Hanya untuk E2E/CI (webServer Playwright). JANGAN di production rill.
ALLOW_MOCK_PAYMENT="false"

# Khusus provider template:
PAYMENT_TEMPLATE_API_BASE_URL=""
PAYMENT_TEMPLATE_SERVER_KEY=""
```

> ⚠️ `PAYMENT_PROVIDER=mock` di production **di-tolak fail-fast** (PGW-003) — kecuali `ALLOW_MOCK_PAYMENT=true` yang hanya untuk E2E/CI, sama seperti `ALLOW_MOCK_ENGINE`.

## Cara Membuat Provider Nyata (Langkah Template)

1. **Salin kerangka** → buat file baru `src/lib/payment/midtrans.ts` (atau `xendit.ts` / `doku.ts`), ubah:
   - `provider = "template"` → `"midtrans"`
   - `readEnvConfig()` → baca env spesifik provider (mis. `MIDTRANS_SERVER_KEY`, `MIDTRANS_BASE_URL`).
2. **Isi `createCheckout`** — ganti bagian `TODO` di `template.ts` dengan panggilan API gateway:
   - **Midtrans Snap**: `POST https://app.sandbox.midtrans.com/snap/v1/transactions` dengan `server_key` (basic auth) → ambil `redirect_url`.
   - **Xendit Invoice**: `POST https://api.xendit.co/v2/invoices` dengan `X-API-KEY` → ambil `invoice_url`.
   - **DOKU**: `POST {base}/v1/payment` + signature (HMAC) → ambil `payment.url`.
   - Konversi `amount` ke **minor unit** sesuai vendor (biasanya ×100 untuk IDR).
3. **Daftarkan provider** di `src/lib/payment/index.ts`:
   ```ts
   case "midtrans":
     return new MidtransPaymentProvider();
   ```
4. **Atur env** (`PAYMENT_PROVIDER=midtrans` + kredensial sandbox) dan jalankan test + uji manual.
5. **Tambahkan unit test** per provider di `src/lib/payment/` (contoh: `payment.test.ts`).

## Alur Setelah Pembayaran (Langkah Berikutnya — belum diimplementasi)

Template ini **hanya membuat checkout** — belum ada persisten order & verifikasi. Untuk produksi nyata:

1. **Model DB**: tabel `PaymentTransaction` (`id`, `orderId`, `provider`, `transactionId`, `amount`, `currency`, `status: PENDING|PAID|FAILED|EXPIRED`, `payload`).
2. **Webhook/callback**: endpoint `/api/webhooks/payment` yang menerima notifikasi gateway → verifikasi signature (vendor) → update status → catat audit + event `payment_completed` (funnel ANA-003).
3. **Status polling**: fallback jika webhook terlewat (query status gateway saat user kembali).
4. **Integrasi dengan Cloudbeds**: setelah `PAID`, barulah buat reservasi via `createReservation` (OSB-002) — jangan sebelum pembayaran lunas.
5. **Kebijakan pembayaran hotel**: down payment vs lunas, refund/cancel — ditentukan di CMS settings.

## Testing

```bash
npx vitest run src/lib/payment        # 15 test payment
npm test                              # semua unit/component (189 test)
```

Cakupan test saat ini:

| Test | Verifikasi |
|---|---|
| `assertPaymentProviderAllowed` | mock dilarang production, none/template diizinkan, escape hatch ALLOW_MOCK_PAYMENT |
| `MockPaymentProvider` | redirect URL palsu + `live:false` |
| `TemplatePaymentProvider` | config kurang → `PaymentConfigError`; API OK → `{transactionId, redirectUrl}`; gateway 401 → `PaymentApiError`; baca env |
| `getPaymentProvider` | none→null, mock→Mock, template→Template, mock di production→throw, provider tak dikenal→throw |
| `isPaymentEnabled` | none→false, selain none→true |

Uji manual (dev, `PAYMENT_PROVIDER=mock`): Buka `/` → cari ketersediaan → pilih kamar → **Book Now** → harus redirect ke `checkout.mock.local/pay?order_id=...` + event `payment_started` di dataLayer.

## Dokumen Terkait

- `doc/06-booking-widget.md` — booking widget & booking engine (BK-*)
- `doc/10-onsite-booking.md` — booking front desk (OSB-*, createReservation untuk tahap lanjut)
- `doc/11-test-script-per-role.md` — test per role (penambahan kasus payment per role)
- `README.md` §8 Catatan (verifikasi header/keamanan)
