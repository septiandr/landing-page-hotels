# 01 — Foundation & Setup

> Mapping PRD: §66 (Arsitektur), §67 (Frontend Architecture), §45 (Performance), §74 (Non-Functional)

Semua task di sini adalah fondasi. **Jangan mulai task lain sebelum FOUND-001 selesai.**

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| FOUND-001 | Scaffold Next.js + TS + Tailwind + tooling | P0 | S |
| FOUND-002 | Struktur folder & konvensi | P0 | S |
| FOUND-003 | PostgreSQL + Prisma setup | P0 | S |
| FOUND-004 | Environment config & `.env.example` | P0 | S |
| FOUND-005 | Design tokens & global styles | P0 | M |
| FOUND-006 | Root layout, fonts, base components | P0 | S |
| FOUND-007 | Utils: date, currency, string, formatter | P0 | M |
| FOUND-008 | Typed API client & fetch wrapper | P0 | M |
| FOUND-009 | Vitest + React Testing Library setup | P0 | S |
| FOUND-010 | CI pipeline (lint + typecheck + test) | P1 | S |
| FOUND-011 | Storybook (opsional, P2) | P2 | M |

---

## FOUND-001 — Scaffold Project

**P0 · S · Setup**

```bash
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*"
```

**Detail teknis:**
- Next.js 15, App Router, `src/` directory.
- Pastikan TypeScript `strict: true` di `tsconfig.json`.
- Tambahkan Prettier + `eslint-config-prettier`.
- Tambahkan `lucide-react` (ikon) dan `clsx` + `tailwind-merge` (util class).

**DoD:**
- [ ] `npm run dev` jalan di `localhost:3000` tanpa error.
- [ ] `npm run lint` dan `npx tsc --noEmit` bersih.
- [ ] Versi package di-pin (package-lock.json ter-commit).

---

## FOUND-002 — Struktur Folder & Konvensi

**P0 · S · Setup**

Buat struktur berikut (lihat `doc/README.md` untuk tree lengkap):

```text
src/
├── app/ (public)/ (admin)/ api/
├── components/ ui/ landing/ booking/ admin/
├── lib/ db.ts auth.ts rbac.ts audit.ts seo.ts analytics.ts
├── types/
└── middleware.ts
```

**Detail teknis:**
- Component public vs admin dipisah lewat route group `(public)` dan `(admin)`.
- Component primitives (Button, Input, Modal) di `components/ui/` — pakai **shadcn/ui-style** (Radix + cva) atau primitives buatan sendiri; konsisten, jangan campur.
- Helper di `lib/` tidak boleh punya JSX.
- Semua data API harus melalui Zod schema (lihat DATA-005) — tidak ada `any` di batas API.

**DoD:**
- [ ] Folder struktur terbuat dan terpakai oleh file pertama yang dibuat.
- [ ] Konvensi penamaan tertulis di `CONTRIBUTING.md` (opsional tapi disarankan).

---

## FOUND-003 — PostgreSQL + Prisma

**P0 · S · DB**

```bash
npm i prisma @prisma/client
npx prisma init
```

**Detail teknis:**
- `schema.prisma` di `src/prisma/` (ikuti detail di `02-data-model.md`).
- `lib/db.ts` — PrismaClient singleton (hindari hot-reload membuat banyak koneksi):

```ts
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**DoD:**
- [ ] Koneksi DB berhasil (`npx prisma migrate dev` tanpa error).
- [ ] PrismaClient singleton ter-export dari `lib/db.ts`.

---

## FOUND-004 — Environment Config

**P0 · S · Config**

Buat `.env.example` (dan `.env` lokal) berisi:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_TRUST_HOST="true"          # untuk deploy
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Booking engine (Cloudbeds — lihat doc/06)
BOOKING_ENGINE_PROVIDER="mock"  # mock (dev/test) | cloudbeds (production)
CLOUDBEDS_API_KEY=""
CLOUDBEDS_PROPERTY_ID=""
CLOUDBEDS_API_BASE_URL="https://hotels.cloudbeds.com/api/v1.0"
NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE=""  # kode 6-char dari Settings → Booking Engine

# Analytics
NEXT_PUBLIC_GTM_ID=""
NEXT_PUBLIC_GA4_ID=""
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_PUBLIC_TIKTOK_PIXEL_ID=""

# WhatsApp (format: 62xxxxxxxxxx)
NEXT_PUBLIC_WHATSAPP_NUMBER=""
```

**Detail teknis:**
- Semua akses env di kode lewat satu module `lib/env.ts` yang memvalidasi dengan Zod (fail fast di build kalau env wajib kosong).
- Pemisahan env `NEXT_PUBLIC_` (client) vs server-only.

**DoD:**
- [ ] `.env.example` lengkap & ter-commit; `.env` ter-gitignore.
- [ ] `lib/env.ts` memvalidasi semua env dengan pesan error jelas.

---

## FOUND-005 — Design Tokens & Global Styles

**P0 · M · Styling**

**Detail teknis:**
- Definisi brand colors (Tailwind v4 `@theme` atau `tailwind.config`): `primary`, `accent`, `surface`, `ink` — bisa diubah per-hotel nanti, jadi pisahkan dari hardcode.
- Typography scale: heading (display/h1–h6) + body, pakai `next/font` (mis. `Inter` atau `Plus Jakarta Sans` — pilih yang cocok brand).
- Spacing scale, radius, shadow — ikuti Tailwind default atau override terpusat.
- Utility: `cn()` (clsx + tailwind-merge) di `lib/utils.ts`.

**DoD:**
- [ ] Token warna/tipografi terpusat, tidak ada hex color random di component.
- [ ] Halaman demo (home kosong) terlihat rapi di mobile & desktop.

---

## FOUND-006 — Root Layout & Base Components

**P0 · S · Frontend**

**Detail teknis:**
- `app/layout.tsx`: font via `next/font`, metadata dasar, `<html lang="id">`.
- `components/ui/`: Button (variants: primary/secondary/outline/ghost), Input, Select, Textarea, Modal/Dialog, Skeleton, Badge, Spinner — semua dengan aksesibilitas dasar (label, focus ring, aria).
- Error boundary global + `not-found.tsx` awal.

**DoD:**
- [ ] Base components dipakai di minimal satu tempat & memiliki story/usage contoh.
- [ ] Semua interactive element punya focus state & label.

---

## FOUND-007 — Utils: Date, Currency, Formatter

**P0 · M · Lib**

`lib/format.ts` (pakai `date-fns` — jangan re-invent):

- `formatDate(date, locale)` — format `12 Aug 2026`.
- `formatCurrency(amount, currency)` — `IDR` → `Rp 1.200.000`, `USD` → `$108`.
- `getNights(checkIn, checkOut)` — selisih malam (validasi check-out > check-in).
- `parseDateRange()` — parsing dari query param URL (untuk shareable availability link).
- `pluralize(n, singular)`.

**DoD:**
- [ ] Unit test untuk `getNights` (inkl. kasus check-out <= check-in), `formatCurrency`, `formatDate`.

---

## FOUND-008 — Typed API Client & Fetch Wrapper

**P0 · M · Lib**

`lib/api.ts` — wrapper `fetch` untuk client & server:

- Base URL otomatis (`/api/...` relatif di client, absolute di server).
- Parsing JSON + error handling seragam: throw `ApiError` dengan `status` & message.
- `revalidate` & `tags` parameter untuk server fetch (ISR).

**Detail teknis:**
- Semua response API divalidasi Zod sebelum dikonsumsi (lihat DATA-005).
- Di admin: auto-redirect ke `/admin/login` jika response `401`.

**DoD:**
- [ ] `ApiError` di-throw untuk status >= 400 dengan pesan dari server.
- [ ] Digunakan di minimal satu endpoint nyata (availability atau CMS).

---

## FOUND-009 — Testing Setup

**P0 · S · Test**

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Detail teknis:**
- `vitest.config.ts` dengan environment `jsdom`, alias `@/`.
- File test: `*.test.ts(x)` di sebelah source (`src/lib/format.test.ts`).
- Script `"test": "vitest run"` di `package.json`.

**DoD:**
- [ ] Satu test contoh jalan (`npm test`).
- [ ] Setup jest-dom matchers berfungsi (mis. `toBeInTheDocument`).

---

## FOUND-010 — CI Pipeline

**P1 · S · DevOps**

**Detail teknis:**
- GitHub Actions workflow `.github/workflows/ci.yml`:
  - Trigger: push & PR ke `main`.
  - Jobs: `lint` → `typecheck` → `test` → `build` (urutan, build terakhir).
  - Caching `~/.npm` & `node_modules`.
- Deploy preview ke Vercel otomatis (integrasi Vercel Git).

**DoD:**
- [ ] CI hijau di PR pertama yang menyentuh kode.
- [ ] Build production (`npm run build`) lolos di CI.

---

## FOUND-011 — Storybook (Opsional)

**P2 · M · Tooling**

**Detail teknis:**
- Storybook + addon-a11y.
- Story untuk semua `components/ui/*`.

**DoD:**
- [ ] Storybook bisa dijalankan `npm run storybook`.
- [ ] Semua primitives punya minimal 1 story.
