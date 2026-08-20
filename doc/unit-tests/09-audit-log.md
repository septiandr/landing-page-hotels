# 09 — Audit Log

> Fitur: pencatatan perubahan data CMS — diff nilai sebelum → sesudah untuk aksi UPDATE.
> Kode PRD: PRD §37, CMS-B-003

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/audit.test.ts` | `diffObjects` — menghasilkan diff hanya untuk field yang berubah |

## Kasus Uji

- Hanya field yang berubah yang dikembalikan (`{ previous, next }`), field tidak berubah dikecualikan.
- Objek identik → `null` (tidak ada perubahan).
- Field baru (null → nilai) ikut di-diff.

## Cara Menjalankan

```bash
npx vitest run src/lib/audit.test.ts
```

## Catatan

- Dipakai di `src/components/admin/audit-log/page.tsx` (render diff) dan backend `src/lib/audit.ts`.
- Halaman audit log hanya untuk ADMIN & MARKETING (`analytics` — lihat `doc/11-test-script-per-role.md`).
