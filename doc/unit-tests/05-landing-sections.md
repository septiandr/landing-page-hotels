# 05 — Landing Page Sections

> Fitur: komponen section landing page — FAQ accordion, Gallery (filter + lightbox), RoomCard, dan Amenities (grouping).
> Kode PRD: LP-*, A11Y · TEST-003

## File Test

| File | Apa yang diuji |
|---|---|
| `src/components/landing/faq.test.tsx` | `Faq` — accordion aksesibel |
| `src/components/landing/gallery.test.tsx` | `Gallery` — filter kategori + lightbox (Esc) |
| `src/components/landing/room-card.test.tsx` | `RoomCard` — info kamar + CTA |
| `src/components/landing/amenities.test.tsx` | `Amenities` — tampilan per group |

## Kasus Uji

### `faq.test.tsx`
- Merender pertanyaan dengan `aria-expanded="false"`; jawaban tersembunyi.
- Klik → `aria-expanded="true"` & jawaban tampil.
- Klik lagi → panel menutup (single-open accordion).

### `gallery.test.tsx`
- Semua foto + semua chip kategori (ALL, ROOMS, FACILITIES, DINING, EXTERIOR) tampil.
- Klik kategori "DINING" → grid terfilter (foto dining tampil, foto room tersembunyi).
- Klik foto → lightbox (`dialog`) terbuka dengan caption; tekan **Escape** → tertutup.

### `room-card.test.tsx`
- Menampilkan nama, ukuran ("32 m²"), dan harga terformat (850.000).
- Menampilkan amenity chips ("Free WiFi") dan CTA: "View Room" → `/rooms/<slug>`; "Check Availability" → href memuat `room=<slug>`.

### `amenities.test.tsx`
- Kedua group ("Hotel Facilities" & "Room Facilities") tampil dengan labelnya.
- Item & deskripsi tampil di group yang benar.
- Tanpa data → komponen mengembalikan `null` (tidak dirender).

## Cara Menjalankan

```bash
npx vitest run src/components/landing
```

## Catatan

- Semua interaksi diuji dengan aksesibilitas (role, aria-expanded, dialog) — mendukung a11y axe 0 violations.
- `room-card` memakai `TrackedLink` → event `view_room` (fitur 10).
