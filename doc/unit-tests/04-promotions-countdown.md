# 04 — Promotions & Countdown

> Fitur: status promosi (DRAFT/ACTIVE/SCHEDULED/EXPIRED, auto-expire & auto-activate), format countdown, dan komponen countdown live.
> Kode PRD: LP-010 · TEST-003

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/promotions.test.ts` | `getPromotionStatus`, `isPromotionVisible`, `getActivePromotions` |
| `src/lib/countdown.test.ts` | `formatCountdown` — format "2d 04h 12m 33s" |
| `src/components/landing/promotion-countdown.test.tsx` | Component `PromotionCountdown` — render timer live & callback expired |

## Kasus Uji

### `promotions.test.ts`
- `ACTIVE` dalam periode → tetap `ACTIVE`.
- `bookingEnd` lewat → auto-expire jadi `EXPIRED`.
- `SCHEDULED` dengan `bookingStart` lewat → auto-activate jadi `ACTIVE`.
- `SCHEDULED` dengan `bookingStart` masih depan → tetap `SCHEDULED`.
- `DRAFT` tetap `DRAFT` walau dalam periode.
- `ACTIVE` tanpa tanggal → tetap `ACTIVE`.
- `isPromotionVisible`: DRAFT tidak terlihat, ACTIVE terlihat.
- `getActivePromotions` (DB di-mock): hanya promo yang terlihat saat ini yang dikembalikan (auto-expired & belum mulai dikecualikan).

### `countdown.test.ts`
- Format lengkap dengan hari: `"2d 04h 12m 33s"`.
- Tanpa hari jika < 24 jam: `"04h 05m 06s"`.
- Padding nol: 61.000 ms → `"00h 01m 01s"`.
- Nol/negatif → `"0h 00m 00s"`.

### `promotion-countdown.test.tsx`
- Fake timers (2026-08-12): timer berakhir 2026-08-14 → menampilkan `2d` dan `12h`.
- Saat expired (timers maju melewati akhir) → `onExpired` dipanggil & elemen timer dihapus dari DOM.

## Cara Menjalankan

```bash
npx vitest run src/lib/promotions.test.ts src/lib/countdown.test.ts
npx vitest run src/components/landing/promotion-countdown.test.tsx
```

## Catatan

- Auto-expire/auto-activate dipakai oleh cron `/api/cron/publish` (scheduled publish).
- Hydration-safe: `PromotionCountdown` menghitung `Date.now()` hanya di `useEffect` (client) — tidak ada mismatch server/client (fix hydration).
