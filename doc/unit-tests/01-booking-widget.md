# 01 — Booking Widget & Search

> Fitur: alur pencarian ketersediaan di landing page — validasi tanggal/tamu, state machine, URL shareable, dan skema request API.
> Kode PRD: BK-001, BK-005, BK-006, BK-007, BK-011 · TEST-003

## File Test

| File | Apa yang diuji |
|---|---|
| `src/components/booking/booking-widget.test.tsx` | Component `BookingWidget` — render, pre-fill URL, search → rate, error/fallback |
| `src/lib/booking-states.test.ts` | State machine widget (8 state) + `validateSearch` |
| `src/lib/booking/url.test.ts` | `buildAvailabilityUrl` — builder URL shareable `#booking` |
| `src/lib/validators/booking.test.ts` | Zod `bookingRequestSchema` (API) & `widgetSearchSchema` (widget) |

## Kasus Uji

### `booking-widget.test.tsx`
- Render dasar: judul "Book Your Stay", input Check-in/Check-out, tombol "Check Availability".
- Submit kosong → pesan "Periksa kembali tanggal & jumlah tamu" muncul, **tidak** memanggil fetch.
- Pre-fill dari URL shareable `?checkin=&checkout=&adults=&kids=&rooms=` (BK-011).
- Search valid → memanggil `/api/availability` (dengan `checkin` & `adults=2`) → rate tampil; pilih kamar → CTA "Book Now".
- Tidak ada kamar → state no-availability + tombol "Change Dates".
- Error engine (response non-OK) → fallback WhatsApp/Call (BK-007).

### `booking-states.test.ts`
- State union tepat **8 state** (idle, validating, loading, available, no-availability, error, invalid-date, invalid-guests).
- Alur sukses: `idle → validating → loading → available`.
- Alur kosong: `loading → no-availability` (tidak ada rate).
- Alur error engine: `loading → error`.
- Validasi gagal: `idle → invalid-date` / `invalid-guests`.
- `RESET` dari state apa pun → `idle`.
- Transisi invalid defensif: `SEARCH_SUCCESS` dari idle tetap idle; `SUBMIT` jalan dari available & error.
- Retry dari error: `error → validating → loading`.
- Recovery: re-search dari no-availability & dari invalid-date/invalid-guests setelah diperbaiki.
- `validateSearch`: input valid → "ok"; checkout ≤ checkin → `invalid-date`; adults 0 → `invalid-guests`.

### `booking/url.test.ts`
- Tanpa opsi → `/#booking`.
- Semua param (checkin, checkout, adults, kids, rooms, promo) + anchor `#booking`.
- Opsi `room` → param `room=<slug>`.

### `validators/booking.test.ts`
- `bookingRequestSchema`: valid (string `adults` di-coerce ke number); checkout sebelum checkin → error di path `checkout`; adults 0 → error; maks 30 malam → ditolak.
- `widgetSearchSchema`: valid; tanggal invalid → pesan Bahasa Indonesia "Check-out harus setelah check-in".
- `getNightsBetween`: 1 Sep → 3 Sep = 2 malam; tanggal terbalik → 0.

## Cara Menjalankan

```bash
npx vitest run src/components/booking/booking-widget.test.tsx
npx vitest run src/lib/booking-states.test.ts src/lib/booking/url.test.ts src/lib/validators/booking.test.ts
```

## Catatan

- Fetch di-mock di component test; state machine murni pure function (mudah di-cover semua transisi).
- `getNightsBetween` dipakai `format.getNights` (lihat fitur 11).
