# 08 — XSS & Keamanan Konten

> Fitur: konten CMS dirender sebagai teks (bukan HTML) — mencegah serangan XSS dari input admin.
> Kode PRD: SEC-002

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/xss.test.tsx` | Render FAQ & testimonial dengan payload script (React escaping) |

## Kasus Uji

- **FAQ**: payload `<script>alert(1)</script>` & `<img onerror=...>` → tampil sebagai teks; DOM **tidak** mengandung `<script>alert` atau `<img src=x` (tidak dieksekusi).
- **Testimonial carousel**: payload script → `textContent` memuat payload, tetapi `innerHTML` tidak mengandung `<script>alert`.

## Cara Menjalankan

```bash
npx vitest run src/lib/xss.test.tsx
```

## Catatan

- Melengkapi fitur SEO (fitur 10): `jsonLdScript` juga meng-escape `</script>` (`\u003c`) supaya konten CMS tidak bisa keluar dari tag `<script>` (JSON-LD).
- Backend memakai Zod `z.string()` + render React (auto-escape) — lihat `doc/08-performance-security.md` SEC-002.
