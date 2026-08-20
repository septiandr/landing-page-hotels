# 10 — SEO, Analytics & Consent

> Fitur: metadata & JSON-LD (Hotel/Room/FAQ), katalog event funnel, cookie consent gate vendor script, slug, dan agregasi rating review (untuk `aggregateRating`).
> Kode PRD: SEO-001..004, ANA-001..004, SEC-004, PRD §40 & §43

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/seo/json-ld.test.ts` | `jsonLdScript`, `hotelJsonLd`, `roomJsonLd`, `faqJsonLd` |
| `src/lib/analytics.test.ts` | `EVENTS` (funnel) & `createEventId` |
| `src/components/analytics/consent.test.tsx` | `ConsentGate` — banner Terima/Tolak (SEC-004) |
| `src/lib/slugify.test.ts` | `slugify` — pembuatan slug |
| `src/lib/reviews.test.ts` | `computeReviewSummary` & `normalizeRating` — rating nyata |

## Kasus Uji

### `json-ld.test.ts`
- `jsonLdScript` meng-escape `<` (`\u003c`) → konten CMS tidak bisa keluar dari tag `<script>`.
- `hotelJsonLd`: `@type ["Hotel","LocalBusiness"]`, GeoCoordinates, **tanpa** `aggregateRating` jika tabel Review kosong (PRD §40), dan dengan `aggregateRating` hanya jika ada data review (ratingValue 4.7, reviewCount 2160, bestRating 5).
- `roomJsonLd`: `@type HotelRoom` + `Offer` (price/priceCurrency) + `occupancy`; tanpa `Offer` jika `priceFrom` null.
- `faqJsonLd`: `@type FAQPage` dengan `mainEntity` per pertanyaan.

### `analytics.test.ts`
- `EVENTS`: ≥ 16 event funnel terdefinisi + semua event kunci ada (`booking_widget_view`, `search_availability`, `select_room`, `booking_started`, `booking_completed`, `click_book_now`, `click_whatsapp`, `click_phone`, `click_email`, `click_map`, `view_room`, `view_promotion`, `click_promotion`, `view_gallery`, `view_faq`).
- Semua nama event unik (tanpa duplikat).
- `createEventId`: menghasilkan 50 id berbeda (unik).

### `consent.test.tsx`
- Belum ada consent → banner "Persetujuan cookie" tampil, script vendor **tidak** dimuat.
- Consent "accepted" tersimpan → script dimuat tanpa banner.
- Consent "rejected" tersimpan → tidak ada script maupun banner.
- Klik **Terima** → consent tersimpan (`localStorage`) & script dimuat.
- Klik **Tolak** → consent tersimpan & script **tidak** dimuat (**DoD: 0 request vendor**).

### `slugify.test.ts`
- Spasi → dash ("Deluxe King Room" → "deluxe-king-room").
- Karakter khusus & aksen dihapus ("Honeymoon Package!" → "honeymoon-package", "Café & Restaurant" → "cafe-restaurant").
- Banyak/leading/trailing spasi digabung.
- Underscore dihapus ("family_room" → "family-room").

### `reviews.test.ts`
- Rata-rata tertimbang antar sumber skala 5 (4.5×1000 + 5.0×284 → overall 4.6).
- Rating skala 10 (Booking.com 9.1) dinormalisasi ke skala 5 (→ 4.7).
- Input kosong → `{ totalCount: 0, overall: 0 }`.
- `normalizeRating`: rating > 5 dibagi 2; ≤ 5 tetap.

## Cara Menjalankan

```bash
npx vitest run src/lib/seo src/lib/analytics.test.ts src/lib/slugify.test.ts src/lib/reviews.test.ts
npx vitest run src/components/analytics/consent.test.tsx
```

## Catatan

- Rating **tidak pernah dibuat-buat** — hanya tampil dari data review nyata (PRD §40).
- `ConsentGate` adalah syarat "Tolak → 0 request vendor" (SEC-004), diuji end-to-end di komponen.
