# 05 — Landing Page (Semua Section)

> Mapping PRD: §6–28 (Page Structure & Sections), §67 (Component Architecture), §5 (User Journey)

Semua content diambil dari DB via **server components + Prisma** dengan ISR tag (CMS-B-010). Tidak boleh hardcode content (PRD §67). Setiap section = 1 komponen + 1 query kecil.

**Prinsip layout:** urutan section sesuai PRD §6. Semua section P0 untuk MVP.

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| LP-001 | Landing page shell + data fetching pattern | P0 | M |
| LP-002 | Header (nav, language, CTA, sticky mobile) | P0 | M |
| LP-003 | Hero (image/video, fallback) | P0 | L |
| LP-004 | Booking Benefits | P0 | S |
| LP-005 | Hotel Intro + Highlights | P0 | S |
| LP-006 | Rooms (list + card + detail) | P0 | L |
| LP-007 | Amenities | P0 | S |
| LP-008 | Gallery (grid + filter + lightbox) | P0 | L |
| LP-009 | Experiences | P1 | S |
| LP-010 | Promotions + countdown | P0 | M |
| LP-011 | Reviews & Testimonials | P0 | M |
| LP-012 | Awards | P2 | S |
| LP-013 | Location (maps + fallback) | P0 | M |
| LP-014 | Nearby Attractions + Transportation | P0 | M |
| LP-015 | FAQ (accordion) | P0 | S |
| LP-016 | Final CTA | P0 | S |
| LP-017 | Footer | P0 | M |
| LP-018 | Error pages (404/500) | P0 | S |
| LP-019 | Mobile sticky booking bar | P0 | S |

---

## LP-001 — Landing Page Shell & Data Fetching Pattern

**P0 · M · Frontend**

**Detail teknis:**
- `app/(public)/page.tsx` → async server component, query semua data sekaligus (minim round-trip):

```ts
const [hotel, rooms, amenities, gallery, promos, testimonials, attractions, faqs, reviews] =
  await Promise.all([...]);
```

- Setiap query pakai `unstable_cache` / `fetch` dengan tag sesuai entity → ISR.

**DoD:**
- [ ] Satu request page load untuk content (query DB efisien, tanpa N+1).

---

## LP-002 — Header

**P0 · M · Frontend**

`components/landing/Header.tsx` — client component (interactive menu).

- Desktop: `[LOGO] [Nav: Rooms · Amenities · Gallery · Offers · Location] [EN|ID] [BOOK NOW]` (PRD §7).
- Mobile: hamburger → drawer menu.
- **Sticky CTA** di mobile: bar bawah "From $100 · [BOOK NOW]" (LP-019) — nav bisa non-sticky di mobile.
- Nav anchor scroll (`scroll-behavior: smooth` + `scroll-margin-top` untuk offset header).
- Logo dari CMS (`hotel.logo`), fallback teks nama hotel.
- Language selector: placeholder untuk Phase 2 (tampil `ID`/`EN`, non-fungsi, atau hidden via CMS flag).

**DoD:**
- [ ] Menu anchor scroll tepat (offset benar setelah scroll).
- [ ] Aksesibel: hamburger toggle punya aria-expanded, menu keyboard navigable.

---

## LP-003 — Hero

**P0 · L · Frontend**

`components/landing/Hero.tsx`:

- Media dari CMS: image utama (prioritas LCP — `priority` di `next/image`) ATAU video (LP-003b).
- Content: headline, subheadline, CTA "CHECK AVAILABILITY" (scroll ke booking widget) dari CMS.
- **Fallback image** jika video gagal (PRD §32).
- Mobile: gambar spesifik mobile jika di-CMS (resolusi lebih kecil).
- Overlay gradasi untuk text contrast (a11y WCAG).
- **Reduced motion**: jika `prefers-reduced-motion`, jangan autoplay video (PERF-003).

**Detail teknis video:**
- `<video autoPlay muted loop playsInline poster={posterImage}>` + `<source src={mp4}>`.
- Poster image di-set sebagai fallback visible sebelum video load.
- Autoplay tanpa audio (muted) — jangan tampilkan kontrol.

**DoD:**
- [ ] Hero tampil mobile & desktop (PRD §69 Hero).
- [ ] Video gagal → poster image tampil (test dengan URL invalid).

---

## LP-004 — Direct Booking Benefits

**P0 · S · Frontend**

`components/landing/Benefits.tsx`:

- List benefit dari CMS (icon + title + description): Best Available Rate, Free Breakfast, Welcome Drink, Flexible Cancellation, Early Check-in, Exclusive Offers (PRD §10).
- Tambahan card "You Save" **hanya jika** ada sumber harga valid dari booking engine (BK-010) — jangan tampilkan harga statis palsu (PRD §10).

**DoD:**
- [ ] Benefit bisa diedit CMS; tampil grid 2-3 kolom responsif.

---

## LP-005 — Hotel Intro + Highlights

**P0 · S · Frontend**

`components/landing/HotelIntro.tsx` & `Highlights.tsx`:

- Intro: `hotel.story` + CTA "DISCOVER OUR HOTEL" (anchor ke rooms).
- Highlights: grid stat: `32 Rooms`, `5 min to City Center`, `24/7 Reception`, `Free WiFi`, `Swimming Pool`, `Restaurant`, `Airport Transfer` — dari CMS (icon lucide + title + desc).
- Highlight bisa di-drive dari data nyata (jumlah room dari count DB, amenities dari CMS).

**DoD:**
- [ ] Stat rooms otomatis dari count room published di DB.

---

## LP-006 — Rooms (List + Card + Detail)

**P0 · L · Frontend**

- `components/landing/RoomList.tsx` — grid room cards (published only).
- `components/landing/RoomCard.tsx` — dari template PRD §13: image, name, `32 m² · 2 Guests · 1 King Bed`, amenities chips, `From $100 / night` (dari engine jika ada, fallback `priceFrom` CMS dengan label "starting from"), CTA `[VIEW ROOM]` `[CHECK AVAILABILITY]`.
- Room Detail: **halaman** `/rooms/[slug]` (lebih baik untuk SEO daripada modal, PRD §14 mengizinkan keduanya):
  - Gallery (reuse lightbox), description, facilities, size, occupancy, bed, view, policies (check-in/out, cancellation), rate CTA.
  - Link: booking widget dengan `room` & `dates` pre-filled via query params (shareable).

**Detail teknis:**
- `generateStaticParams` untuk `/rooms/[slug]` (static + ISR), fallback `'blocking'`.
- Metadata per room dari CMS (SEO-002).

**DoD:**
- [ ] `/rooms/deluxe-king` bisa di-index Google & dibuka dari card.
- [ ] Card menampilkan harga dari engine saat tersedia, fallback CMS.

---

## LP-007 — Amenities

**P0 · S · Frontend**

`components/landing/Amenities.tsx`:

- Group per kategori: **Hotel Facilities** (pool, restaurant, spa, gym, parking, wifi, meeting room) & **Room Facilities** (AC, TV, refrigerator, safe, hairdryer, coffee machine) — PRD §15.
- Tampilkan icon + name + (opsional) description.
- Collapsible di mobile kalau panjang.

**DoD:**
- [ ] Grouping sesuai CMS; grid responsif.

---

## LP-008 — Gallery

**P0 · L · Frontend**

`components/landing/Gallery.tsx` (client):

- Filter chips: `ALL ROOMS FACILITIES DINING EXTERIOR SURROUNDINGS` (PRD §16).
- Grid masonry/bento, `next/image` lazy (non-critical).
- Lightbox: klik → fullscreen, swipe (touch), tombol prev/next, close (Esc), zoom optional.
- Alt text wajib; caption opsional.
- Aksesibel: lightbox pakai `role="dialog"` + `aria-modal` + focus trap (PERF/a11y section).

**DoD:**
- [ ] Filter bekerja; lightbox bisa keyboard (Esc, arrow) & swipe di mobile.

---

## LP-009 — Experiences

**P1 · S · Frontend**

`components/landing/Experiences.tsx`:

- Cards: image, title, description, duration, price, CTA (link WhatsApp dengan pre-filled message / engine).
- CTA WhatsApp: `https://wa.me/{number}?text={encoded}` — "I'm interested in {experience}".

**DoD:**
- [ ] CTA experience membuka WhatsApp dengan pesan konteks.

---

## LP-010 — Promotions

**P0 · M · Frontend**

`components/landing/Promotions.tsx`:

- List promotion **ACTIVE** (status kalkulasi waktu, DATA-003) — sort by `sortOrder`.
- Card: image, title, description, discountLabel, promo code (copy chip), terms (expandable).
- CTA: `BOOK NOW` → booking widget dengan promo code pre-filled.
- **Countdown** (`PromotionCountdown.tsx`): hanya jika `showCountdown && bookingEnd` ada (PRD §19 — deadline nyata). Client component, interval 1 detik, format `2d 04h 12m 33s`.

**DoD:**
- [ ] Countdown sinkron dengan `bookingEnd`; promo expired otomatis hilang.

---

## LP-011 — Reviews & Testimonials

**P0 · M · Frontend**

`components/landing/Reviews.tsx`:

- Rating summary: `★★★★★ 4.8 / 5 · 1,284 Reviews` dari table `Review` (source: Google/TripAdvisor/Booking/Agoda dengan logo source).
- Testimonial carousel (auto + manual, pause on hover, keyboard navigable — aksesibel): nama, negara, rating, review, date, source.
- Source selalu ditampilkan jelas (PRD §21).

**DoD:**
- [ ] Carousel berhenti saat hover/focus (a11y) & bisa navigasi keyboard.

---

## LP-012 — Awards

**P2 · S · Frontend**

`components/landing/Awards.tsx` — list award dari CMS (nama, logo/ikon, tahun). Non-critical, boleh hidden di MVP.

**DoD:**
- [ ] Award tampil jika ada data; section tidak render jika kosong.

---

## LP-013 — Location

**P0 · M · Frontend**

`components/landing/Location.tsx` (client):

- Google Maps embed iframe (no API key) dari `lat/lng` hotel.
- **Fallback** (PRD §32): jika iframe gagal → tampilkan alamat lengkap + link "Open in Google Maps" (`https://maps.google.com/?q=lat,lng`).
- Konten: alamat, distance ke airport/station/city center (dari attractions CMS atau field manual), tombol Directions.

**Detail teknis:**
- iframe `loading="lazy"`, `title` atribut untuk a11y.
- Deteksi gagal: `onLoad` tidak pernah fire dalam timeout → swap ke fallback.

**DoD:**
- [ ] Maps offline/blokir → fallback alamat + link tetap usable.

---

## LP-014 — Nearby Attractions + Transportation

**P0 · M · Frontend**

`components/landing/Attractions.tsx`:

- List: image, nama, `10 min`, distance — dari CMS (name, travelTimeMin, distanceKm).
- `Transportation.tsx`: info airport transfer (harga/CTA WhatsApp), taxi, ride-hailing (Gojek/Grab), train, bus, parking, car rental (PRD §25) — dari CMS text blocks sederhana.

**DoD:**
- [ ] Attraction tampil dengan travel time; section transport render hanya jika ada konten.

---

## LP-015 — FAQ

**P0 · S · Frontend**

`components/landing/Faq.tsx` (client):

- Accordion per kategori (Booking/Hotel/Facilities/Family), expand/collapse.
- Aksesibel: tombol dengan `aria-expanded`, `aria-controls`, panel `role="region"`.
- Data dari CMS (PRD §26). JSON-LD FAQ (SEO-004).

**DoD:**
- [ ] Accordion keyboard navigable; hanya satu panel open (accordion mode).

---

## LP-016 — Final CTA

**P0 · S · Frontend**

`components/landing/FinalCta.tsx`:

- "Ready for Your Next Stay?" + CTA `CHECK AVAILABILITY` → scroll ke widget (PRD §27).
- Background visual (gambar gallery terakhir / warna brand).
- Track `click_book_now` event (ANA-003).

**DoD:**
- [ ] CTA scroll ke widget & event ter-track.

---

## LP-017 — Footer

**P0 · M · Frontend**

`components/landing/Footer.tsx`:

- Logo, alamat, phone, email, WhatsApp (link wa.me), social media (icon), nav.
- Links: Terms, Privacy, Cancellation Policy (halaman statis atau anchor), Sitemap, Copyright (PRD §28).
- Tahun dinamis (`new Date().getFullYear()`).

**DoD:**
- [ ] Semua kontak klikable dengan `tel:`/`mailto:`/`wa.me`.

---

## LP-018 — Error Pages

**P0 · S · Frontend**

- `app/not-found.tsx` (404): nav "GO HOME · VIEW ROOMS · BOOK NOW" (PRD §64), desain on-brand.
- `app/error.tsx` (500): pesan + tombol retry + kontak.
- Booking error state terpisah di BK-007.

**DoD:**
- [ ] URL random → 404 dengan navigation.

---

## LP-019 — Mobile Sticky Booking Bar

**P0 · S · Frontend**

`components/landing/MobileBookingBar.tsx`:

- Muncul setelah scroll > 600px di mobile: `From $100 [ BOOK NOW ]` (PRD §49).
- BOOK NOW → scroll ke booking widget (atau expand widget compact).
- Hanya di mobile (`md:hidden`), sembunyikan saat widget terlihat di viewport.

**DoD:**
- [ ] Bar muncul saat scroll, tidak menutupi konten (padding-bottom body).
