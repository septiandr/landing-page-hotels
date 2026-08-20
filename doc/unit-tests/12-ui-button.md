# 12 — UI Primitives (Button)

> Fitur: komponen dasar `Button` — render, interaksi klik, state disabled, dan variant styling.

## File Test

| File | Apa yang diuji |
|---|---|
| `src/components/ui/button.test.tsx` | Component `Button` |

## Kasus Uji

- Render dengan label.
- Klik → `onClick` dipanggil sekali.
- Disabled → `onClick` **tidak** dipanggil (negative case).
- Variant `outline` → menerapkan class `border-border`.

## Cara Menjalankan

```bash
npx vitest run src/components/ui/button.test.tsx
```

## Catatan

- `Button` dipakai di seluruh admin & landing; base dari `src/components/admin/ui.tsx`.
- Pola yang sama (render, interaksi, disabled, variant) sebaiknya direplikasi ke primitive lain (Input, Select, Modal) saat ditambah.
