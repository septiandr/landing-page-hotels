# 11 — Format & Utils

> Fitur: fungsi utilitas umum — perhitungan malam, format mata uang/tanggal, parser rentang tanggal URL, dan merger className (clsx + tailwind-merge).

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/format.test.ts` | `getNights`, `formatCurrency`, `formatDate`, `parseDateRange` |
| `src/lib/utils.test.ts` | `cn` (clsx + tailwind-merge) |

## Kasus Uji

### `format.test.ts`
- `getNights`: rentang valid → 3 malam; tanggal sama → 0; check-out sebelum check-in → negatif (−3); string non-tanggal → 0.
- `formatCurrency`: IDR → "Rp" + separator ribuan, tanpa desimal; USD → "$108.00"; tanpa mata uang → default IDR.
- `formatDate`: "2026-08-12" → "12 Agt 2026" (locale id); input invalid → `""`.
- `parseDateRange`: param checkin/checkout valid → range 2 malam; checkout ≤ checkin → `null`; param hilang → `null`.

### `utils.test.ts` (`cn`)
- Menggabungkan class sederhana → "a b".
- Mengabaikan nilai falsy (`false`, `undefined`, `null`).
- Konflik tailwind diselesaikan (yang terakhir menang): `px-2` + `px-4` → `px-4`.

## Cara Menjalankan

```bash
npx vitest run src/lib/format.test.ts src/lib/utils.test.ts
```

## Catatan

- `cn` dipakai di hampir semua komponen UI (`src/components/ui/*`, admin & landing).
- `parseDateRange` dipakai widget untuk pre-fill dari URL shareable (fitur 01).
