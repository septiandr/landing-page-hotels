# 07 — SEO, Structured Data & Analytics

> Mapping PRD: §38–44 (SEO, Multi-Language, Analytics, Funnel), §53 (Third-Party), §72 (Phase 2: i18n)

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| SEO-001 | Metadata API (title, description, OG, canonical) | P0 | M |
| SEO-002 | Per-room & per-page metadata | P0 | M |
| SEO-003 | Sitemap & robots.txt | P0 | S |
| SEO-004 | JSON-LD structured data | P0 | M |
| SEO-005 | 404 & redirect management | P1 | S |
| SEO-006 | i18n dasar (ID/EN) — Phase 2 | P2 | L |
| ANA-001 | GTM + GA4 setup | P0 | S |
| ANA-002 | Meta Pixel + TikTok Pixel | P0 | S |
| ANA-003 | Typed event tracking (`track()`) | P0 | M |
| ANA-004 | Conversion funnel reporting | P1 | M |

---

## SEO-001 — Metadata API

**P0 · M · SEO**

**Detail teknis:**
- `lib/seo.ts`:

```ts
export async function getHotelMetadata(): Promise<Metadata> {
  const hotel = await getHotelCached();
  return {
    title: hotel.seo?.metaTitle ?? hotel.name,
    description: hotel.seo?.metaDescription ?? hotel.description,
    alternates: { canonical: hotel.seo?.canonicalUrl ?? siteUrl },
    openGraph: { title: ..., description: ..., images: [{ url: ogImage }], locale: "id_ID" },
    twitter: { card: "summary_large_image" },
  };
}
```

- Dipakai di `generateMetadata()` pada `app/(public)/layout.tsx`.
- Nilai dari CMS (CMS-B-006); fallback ke data hotel.
- Image OG harus path absolut (`NEXT_PUBLIC_SITE_URL`).

**DoD:**
- [ ] View-source halaman → title/description/OG lengkap.

---

## SEO-002 — Per-Room Metadata

**P0 · M · SEO**

- `app/(public)/rooms/[slug]/page.tsx` → `generateMetadata({ params })`:

```ts
const room = await getRoomBySlug(slug);
return {
  title: `${room.name} | ${hotel.name}`,
  description: room.description?.slice(0, 160),
  alternates: { canonical: `${siteUrl}/rooms/${room.slug}` },
  openGraph: { images: [room.photos[0]?.url] },
};
```

- `generateStaticParams` untuk semua room published.

**DoD:**
- [ ] `/rooms/deluxe-king` punya canonical & title unik.

---

## SEO-003 — Sitemap & Robots

**P0 · S · SEO**

- `app/sitemap.ts`: `/`, semua `/rooms/[slug]`, halaman statis (privacy, terms, 404 tidak).
- `app/robots.ts`: allow all, sitemap URL.
- (Opsional) `/rooms/[slug]` juga di `generateSitemaps` jika > 50.000 room.

**DoD:**
- [ ] `{siteUrl}/sitemap.xml` & `robots.txt` valid (test di Google Search Console).

---

## SEO-004 — JSON-LD Structured Data

**P0 · M · SEO**

`lib/seo/json-ld.ts` — builder type-safe:

```ts
export function hotelJsonLd(hotel: Hotel): HotelLd {
  // @type: ["Hotel", "LocalBusiness"]
}
export function roomJsonLd(room: Room): HotelRoomLd { ... }
export function faqJsonLd(faqs: FaqItem[]): FaqPageLd { ... }
export function reviewJsonLd(reviews: Review): { AggregateRating, Review[] } { ... }
```

- Ditaruh via `<script type="application/ld+json" dangerouslySetInnerHTML>` di halaman terkait (sanitize: pastikan semua field di-escape JSON via `JSON.stringify`).
- **Rule PRD §40**: data harus nyata dari content, jangan invent rating palsu. Rating hanya jika table `Review` ada isinya.
- Halaman room: `HotelRoom` + `Offer` + `AggregateRating`.

**DoD:**
- [ ] Validasi lewat validator.schema.org → tanpa error.
- [ ] FAQ halaman utama punya `FAQPage` JSON-LD.

---

## SEO-005 — 404 & Redirects

**P1 · S · SEO**

- `next.config.ts` → `redirects()` untuk URL lama (jika ada).
- `not-found.tsx` (LP-018) tanpa `noindex` masalah — 404 otomatis noindex oleh Google.
- Pastikan `metadata.robots: { index: true }` default.

**DoD:**
- [ ] Redirect lama mengarah ke halaman baru (301).

---

## SEO-006 — i18n ID/EN (Phase 2)

**P2 · L · i18n**

- Pakai `next-intl` (routing `/[locale]` atau middleware dengan `id`/`en`, PRD §38).
- Konten utama (nav, CTA, label booking, error) via `messages/id.json` & `en.json`.
- Content CMS (room description, FAQ, promo) — kolom translasi per locale (schema extend `Translation[]` per entity).
- `hreflang` alternates.
- **Jangan mulai sebelum MVP rilis** (PRD §72 Phase 2).

**DoD:**
- [ ] `example.com/id/` & `example.com/en/` tersedia; `hreflang` benar.

---

## ANA-001 — GTM + GA4

**P0 · S · Analytics**

**Detail teknis:**
- `components/analytics/Scripts.tsx` di root layout:
  - GTM: `next/script` + `dataLayer` push `"js"` & `"config"`.
  - GA4 via GTM (atau `gtag` langsung jika tanpa GTM).
- Hanya load jika env `NEXT_PUBLIC_GTM_ID` ada (jangan load script kosong di dev).

**DoD:**
- [ ] GA4 DebugView menangkap `page_view` di localhost.

---

## ANA-002 — Meta Pixel + TikTok Pixel

**P0 · S · Analytics**

- Sama pola ANA-001: `next/script` load pixel jika env ada.
- Meta Pixel: `fbq('init', ID)` + `fbq('track', 'PageView')`.
- TikTok: `ttq.load(ID)` + `ttq.page()`.
- **Consent**: jika perlu cookie consent (PRD §52), pixel hanya load setelah consent (lihat SEC-004 di doc 08).

**DoD:**
- [ ] Pixel fire di production (test via Meta Events Manager / TikTok Events).

---

## ANA-003 — Typed Event Tracking

**P0 · M · Analytics**

`lib/analytics.ts`:

```ts
export const EVENTS = {
  bookingWidgetView: "booking_widget_view",
  bookingWidgetOpen: "booking_widget_open",
  searchAvailability: "search_availability",
  viewRoom: "view_room",
  selectRoom: "select_room",
  clickBookNow: "click_book_now",
  bookingStarted: "booking_started",
  bookingCompleted: "booking_completed",
  viewPromotion: "view_promotion",
  clickPromotion: "click_promotion",
  viewGallery: "view_gallery",
  clickMap: "click_map",
  clickPhone: "click_phone",
  clickWhatsapp: "click_whatsapp",
  clickEmail: "click_email",
  viewFaq: "view_faq",
} as const;

export function track(event: EventName, params?: Record<string, unknown>) {
  window.dataLayer?.push({ event, ...params });
  // gtag/fbq/ttq forwarding di sini (satu titik)
}
```

- Implementasi lengkap semua event PRD §43 di komponen terkait:
  - `booking_widget_view` → saat widget masuk viewport (IntersectionObserver).
  - `click_whatsapp` → semua CTA WhatsApp (footer, fallback, experience).
  - `booking_started` → sebelum buka deep link engine (BK-008); `booking_completed` dari webhook `reservation/created` (BK-009).
- Type-safe: `params` object keyed per event.

**DoD:**
- [ ] Semua 17 event PRD §43 ter-trigger & tampil di GA4 DebugView.
- [ ] Satu file `track()` — tidak ada dataLayer push tersebar.

---

## ANA-004 — Conversion Funnel Reporting

**P1 · M · Analytics**

**Detail teknis:**
- Konfigurasi **GA4 Funnel Exploration** untuk funnel PRD §44:

```text
page_view → booking_widget_view → search_availability → select_room → booking_started → booking_completed
```

- Setiap event bawa `event_id` konsisten (uuid per booking attempt) supaya funnel akurat satu sesi.
- Dashboard ringkas di admin (opsional): angka search rate & booking start rate dari GA4 Data API (phase 2).

**DoD:**
- [ ] Funnel report di GA4 menampilkan drop-off per step.
- [ ] Metrics PRD §44 (widget conversion rate, booking start rate) terukur.
