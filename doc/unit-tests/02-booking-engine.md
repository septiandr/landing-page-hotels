# 02 — Booking Engine & Deep Link

> Fitur: integrasi booking engine — guard provider (production vs mock), deep-link ke Cloudbeds Hosted Booking Engine, dan konversi/kode mata uang.
> Kode PRD: BK-002, BK-008, BK-011, BK-012 · REL-001

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/booking-engine/deep-link.test.ts` | `buildDeepLinkUrl` (Cloudbeds) & `buildBookingUrl` (env-gated) |
| `src/lib/booking-engine/index.test.ts` | `assertProviderAllowed` — provider guard (mock dilarang di production) |
| `src/lib/currency.test.ts` | `convertCurrency` & `isCurrency` — konversi IDR↔USD |

## Kasus Uji

### `deep-link.test.ts`
- `buildDeepLinkUrl` → host `hotels.cloudbeds.com`, path `/reservation/<code>`, param `checkin/checkout/adults/kids`.
- Promo code → param `promo`.
- `roomType` → param `room_type` + `base_rates_only=1` (saat ada abbr).
- `rooms > 1` dikirim, `rooms === 1` dihilangkan (default value).
- Tanpa promo/roomType → param opsional tidak muncul.
- `buildBookingUrl` → `null` saat `NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE` kosong (fallback WhatsApp).

### `index.test.ts` (provider guard)
- Provider `mock` di production → throw `EngineConfigError`.
- Provider kosong di production → throw.
- Provider `cloudbeds` di production → **tidak** throw.
- Provider `mock` di dev/test → diizinkan.

### `currency.test.ts`
- Konversi IDR → USD (1.620.000 → 100).
- Mata uang sama → tidak berubah.
- USD → IDR (round-trip).
- `isCurrency`: `IDR` valid, `JPY` invalid.

## Cara Menjalankan

```bash
npx vitest run src/lib/booking-engine src/lib/currency.test.ts
```

## Catatan

- **Jangan set `BOOKING_ENGINE_PROVIDER=mock` di production** tanpa `ALLOW_MOCK_ENGINE=true` — guard `assertProviderAllowed` fail-fast (REL-001).
- Deep-link dipakai oleh CTA "Book Now" di widget & room card.
