# Doc — Technical Task Breakdown

Dokumen ini menerjemahkan `PRD.md` menjadi task-task teknis yang spesifik ke kode.
Setiap task mencakup: lokasi file, detail implementasi, library yang dipakai, dan **Definition of Done (DoD)**.

## Keputusan Arsitektur (Decision Log)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | Landing page + CMS API dalam satu codebase, SSR/ISR untuk SEO & performa |
| Styling | **Tailwind CSS v4 + design tokens** | Mobile-first, cepat, konsisten |
| Database | **PostgreSQL + Prisma 7** (`prisma.config.ts` + driver adapter `@prisma/adapter-pg`) | Relasional (cocok untuk relasi Hotel→Rooms→Amenities), migration & type safety |
| Auth CMS | **Auth.js (NextAuth v5) — Credentials + JWT** | Session stateless, mudah di RBAC |
| Validasi | **Zod** | Schema shared antara API dan form (satu source of truth) |
| Form admin | **React Hook Form + Zod resolver** | Validasi konsisten |
| Upload gambar | **API route internal + sharp** (local disk) → S3 adapter di phase berikutnya | Simpel untuk MVP, storage-agnostic via interface |
| Booking engine | **Cloudbeds API v1** via adapter (`BookingEngineAdapter`) | Discovery via API (`getAvailability`/`getRates`) + deep link ke Hosted Booking Engine + webhook `reservation/created` untuk tracking; Mock hanya untuk dev |
| Maps | **Google Maps embed (iframe)** + fallback alamat | Tanpa API key, tetap fallback saat gagal |
| Analytics | **GTM + GA4 + Meta/TikTok Pixel** via `next/script` + helper `track()` | Semua event tersentral di satu module |
| Test | **Vitest + React Testing Library + Playwright** | Unit, component, E2E |
| Deploy | **Vercel** + GitHub Actions (CI) | Preview per-PR, ISR cache |

## Struktur Folder

```text
doc/
├── README.md                        # ← file ini (index + arsitektur)
├── 01-foundation-setup.md           # Scaffold project, tooling, struktur folder
├── 02-data-model.md                 # Prisma schema, entity, seed
├── 03-cms-backend.md                # Auth, RBAC, API routes, audit log, upload
├── 04-cms-admin-ui.md               # Admin panel frontend
├── 05-landing-page.md               # Semua section landing page
├── 06-booking-widget.md             # Booking widget + booking engine integration
├── 07-seo-analytics.md              # SEO, structured data, event tracking
├── 08-performance-security.md       # Performance, a11y, security
└── 09-testing-release.md            # Testing, acceptance criteria, release
```

## Target Struktur Codebase (dibuat pada FOUND-002)

```text
src/
├── app/
│   ├── (public)/                    # Landing page (SSR/ISR)
│   │   ├── page.tsx
│   │   ├── rooms/[slug]/page.tsx
│   │   └── not-found.tsx
│   ├── (admin)/                     # CMS admin (protected)
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── ...
│   ├── api/
│   │   ├── admin/                   # CRUD CMS (protected + RBAC)
│   │   ├── availability/route.ts    # Proxy booking engine
│   │   └── upload/route.ts
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                          # primitives (Button, Input, Modal, ...)
│   ├── landing/                     # section landing page
│   ├── booking/                     # BookingWidget, states, sticky CTA
│   └── admin/                       # form, table, uploader, layout
├── lib/
│   ├── db.ts                        # Prisma client singleton
│   ├── auth.ts                      # Auth.js config
│   ├── rbac.ts                      # permission checks
│   ├── audit.ts                     # audit log wrapper
│   ├── booking-engine/              # adapter interface + implementations
│   ├── seo.ts                       # metadata + JSON-LD builder
│   ├── analytics.ts                 # track() typed events
│   └── validators/                  # Zod schemas
├── types/                           # shared types
├── middleware.ts                    # session guard
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## Catatan Versi (Next.js 16 & Prisma 7 — breaking changes yang sudah dipakai)

- **`middleware.ts` → `proxy.ts`** (Next 16). Runtime Node.js, named export `proxy`. Auth guard admin di M3 memakai ini.
- **Async request APIs**: `params`, `searchParams`, `cookies()`, `headers()` HANYA bisa di-await (sync access dihapus).
- **`revalidateTag(tag)`** kini butuh argumen kedua: `revalidateTag(tag, "max")`. Dipakai di CMS-B-010 (M3).
- **Prisma 7**: konfigurasi di `prisma.config.ts` (bukan `package.json`), generator `prisma-client` meng-output ke `src/generated/prisma` (di-gitignore, di-generate ulang via `npm run db:generate`), dan koneksi wajib memakai **driver adapter** (`PrismaPg` dari `@prisma/adapter-pg`).
- **Zod 4**: top-level `z.email()`, `z.url()`, dsb. (bukan `z.string().email()`).
- **`next lint` dihapus** — pakai `eslint .` langsung (`npm run lint`).

## Milestone

| Milestone | Isi | Output |
|---|---|---|
| **M1 — Foundation** | FOUND-001..010, DATA-001..004 | Project jalan, DB + seed, CI hijau |
| **M2 — Landing Page MVP** | LP-*, BK-*, SEO-*, ANA-* (P0) | Landing page lengkap + booking widget + tracking |
| **M3 — CMS MVP** | CMS-B-*, CMS-U-*, DATA-005 | Admin bisa kelola konten + publish tanpa developer |
| **M4 — Polish & Release** | PERF-*, SEC-*, TEST-*, QA-* | Perf budget, security, acceptance criteria terpenuhi |

## Cara Menggunakan Task

1. Setiap task punya ID unik, misal `LP-003`.
2. Format: **Prioritas (P0/P1/P2) · Estimasi (S/M/L) · Area**.
3. Checkbox pada **DoD** adalah syarat task dianggap selesai.
4. Kerjakan per milestone; task P0 di milestone 1-3 harus selesai sebelum rilis MVP.
5. Mapping ke PRD ditulis di header tiap dokumen (`PRD §x`).
