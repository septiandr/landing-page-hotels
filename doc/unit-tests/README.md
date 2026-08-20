# Unit & Component Test — Indeks per Fitur

> **Tujuan**: daftar lengkap test unit & component (Vitest + Testing Library) yang dipecah **per fitur**, satu file per fitur. Setiap file berisi file test yang terlibat, daftar kasus uji, cara menjalankan, dan catatan.
>
> Ringkasan repo: **29 file test / 174 test** (`npm test`, ~7 detik). Total unit+component dikelola via Vitest; konfigurasi di `vitest.config.mts` + `vitest.setup.ts`.

## Peta File

| # | Fitur | File test yang terlibat |
|---|---|---|
| 01 | Booking Widget & Search | `components/booking/booking-widget.test.tsx` (6), `lib/booking-states.test.ts` (13), `lib/booking/url.test.ts` (3), `lib/validators/booking.test.ts` (17) |
| 02 | Booking Engine & Deep Link | `lib/booking-engine/deep-link.test.ts` (6), `lib/booking-engine/index.test.ts` (4), `lib/currency.test.ts` (4) |
| 03 | On-Site Booking (Front Desk) | `lib/booking-status.test.ts` (9) |
| 04 | Promotions & Countdown | `lib/promotions.test.ts` (8), `lib/countdown.test.ts` (4), `components/landing/promotion-countdown.test.tsx` (2) |
| 05 | Landing Page Sections | `components/landing/faq.test.tsx` (3), `gallery.test.tsx` (3), `room-card.test.tsx` (2), `amenities.test.tsx` (3) |
| 06 | Validasi CMS (Zod) | `lib/validators/validators.test.ts` (23), `lib/validators/award-transport.test.ts` (8) |
| 07 | Auth, Password & Rate-Limit | `lib/password.test.ts` (3), `lib/rate-limit.test.ts` (6) |
| 08 | XSS & Keamanan Konten | `lib/xss.test.tsx` (2) |
| 09 | Audit Log | `lib/audit.test.ts` (3) |
| 10 | SEO, Analytics & Consent | `lib/seo/json-ld.test.ts` (7), `lib/analytics.test.ts` (3), `components/analytics/consent.test.tsx` (5), `lib/slugify.test.ts` (4), `lib/reviews.test.ts` (4) |
| 11 | Format & Utils | `lib/format.test.ts` (12), `lib/utils.test.ts` (3) |
| 12 | UI Primitives (Button) | `components/ui/button.test.tsx` (4) |
| 13 | Payment Gateway (PGW) | `lib/payment/payment.test.ts` (15) |

> Total: **30 file / 189 test**. Jumlah per file dihitung dari blok `test()/it()` (per 2026-08-20).

## Cara Menjalankan

```bash
npm test                    # semua unit + component test (174 test)
npx vitest run src/lib      # semua test di folder lib
npx vitest run src/components  # semua component test
npx vitest run <path>       # satu file / folder tertentu (lihat tiap doc fitur)
```

## Kode Fitur (dipakai doc tiap fitur)

| Kode | Arti |
|---|---|
| BK-001..012 | Booking widget & booking engine |
| OSB-001..011 | On-site booking (walk-in front desk) |
| SEC-002, SEC-004 | XSS & cookie consent |
| ANA-003, ANA-004 | Funnel events & event ID |
| TEST-003 | Component tests |
| REL-001 | Production hardening (provider guard) |
| PRD §40, §43, §61 | Rating nyata, funnel, workflow CMS |

## Dokumen Terkait

- `doc/09-testing-release.md` — strategi & acceptance criteria
- `doc/11-test-script-per-role.md` — test per role (RBAC)
- `doc/qa-acceptance.md` — mapping acceptance criteria PRD
