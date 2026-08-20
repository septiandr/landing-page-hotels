# 07 — Auth, Password & Rate-Limit

> Fitur: keamanan autentikasi CMS — hashing password (bcryptjs) dan rate-limit kegagalan login.
> Kode PRD: CMS-B-002, CMS-B-012

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/password.test.ts` | `hashPassword` & `verifyPassword` (bcryptjs) |
| `src/lib/rate-limit.test.ts` | Rate limiter kegagalan login (window 60 detik) |

## Kasus Uji

### `password.test.ts`
- Hash tidak mengandung plaintext password.
- `verifyPassword` → `true` untuk password yang cocok.
- `verifyPassword` → `false` untuk password salah.
- Hash unik per password (salt) — dua hash password sama berbeda.

### `rate-limit.test.ts`
- 0 kegagalan → tidak terblokir (`retryAfter` 0).
- 5 kegagalan → terblokir dengan `retryAfterSeconds` 0..60.
- 4 kegagalan → belum terblokir (batas threshold).
- Setelah window 60 detik lewat (fake timers) → blokir di-reset.
- Key berbeda tidak saling memengaruhi (isolasi per key).
- `clearFailures` → key di-unblock.

## Cara Menjalankan

```bash
npx vitest run src/lib/password.test.ts src/lib/rate-limit.test.ts
```

## Catatan

- Rate-limit melindungi endpoint login (`LOGIN_FAILED` di audit log saat gagal).
- Ini bagian dari hardening `CMS-B-012` / SEC (lihat `doc/08-performance-security.md`).
