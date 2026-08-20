# 03 — On-Site Booking (Front Desk)

> Fitur: state machine status booking walk-in (CONFIRMED → CHECKED_IN → CHECKED_OUT, plus CANCEL/NO_SHOW) dan syarat alasan.
> Kode PRD: OSB-005, OSB-007 · M5

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/booking-status.test.ts` | `nextStatus` (transisi valid/invalid/terminal) & `requiresReason` |

## Kasus Uji

### `nextStatus`
- `CONFIRMED → CHECKED_IN` via `CHECK_IN` (valid).
- `CONFIRMED → CANCELLED` via `CANCEL`.
- `CONFIRMED → NO_SHOW` via `NO_SHOW`.
- `CHECKED_IN → CHECKED_OUT` via `CHECK_OUT`.
- `CHECKED_IN → CANCELLED` via `CANCEL`.
- `CHECKED_IN` **tidak bisa** `CHECK_IN` ulang → `null` (invalid transition).
- State terminal (`CHECKED_OUT`, `CANCELLED`, `NO_SHOW`) menolak semua aksi → `null`.

### `requiresReason`
- `CANCEL` **wajib** alasan.
- `CHECK_IN`, `CHECK_OUT`, `NO_SHOW` tidak wajib alasan.

## Cara Menjalankan

```bash
npx vitest run src/lib/booking-status.test.ts
```

## Catatan

- Backend (`src/app/api/admin/bookings/[id]/route.ts`) mengembalikan **409 INVALID_TRANSITION** untuk transisi invalid dan **400** untuk CANCEL tanpa alasan — transisi ini murni pure function, diuji tanpa DB.
- E2E `e2e/cms.spec.ts` memverifikasi lifecycle yang sama lewat API.
