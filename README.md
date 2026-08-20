# 🏨 Hotel Landing Page

Landing page hotel **all-in-one**: website publik (SSR/ISR), **CMS admin** untuk kelola konten tanpa developer, **booking widget** terintegrasi **Cloudbeds**, plus SEO, analytics, dan security hardening — semua dalam satu codebase Next.js.

> Dibangun berdasarkan `PRD.md` (Bahasa Indonesia) dan dipecah menjadi task teknis di folder [`doc/`](doc/README.md) (01–09).

## ✨ Fitur

### 🖥️ Landing Page (publik)
- **Hero** (gambar/video + fallback), **Direct Booking Benefits**, **Hotel Intro & Highlights**
- **Rooms**: grid + card + halaman detail `/rooms/[slug]` (di-index Google, ISR)
- **Amenities** (grouping Hotel/Room), **Gallery** (filter kategori + lightbox keyboard & swipe)
- **Experiences**, **Promotions** (countdown real-time + promo code copy), **Reviews & Testimonials** (carousel aksesibel)
- **Awards**, **Location** (Google Maps embed + fallback alamat), **Attractions & Transportation**
- **FAQ** (accordion), **Final CTA**, **Footer**, **404/500 pages**, **Mobile sticky booking bar**
- Semua konten dari **CMS** — tidak ada hardcode (PRD §67)

### 🛎️ Booking Widget + Cloudbeds
- Widget pencarian (check-in/out, adults/kids, rooms, promo code) dengan **8 state machine** (idle → available / no-availability / error)
- **Adapter pattern**: `CloudbedsAdapter` (production) & `MockAdapter` (dev/E2E) — UI tidak pernah tahu provider aktif
- **Deep link** ke Hosted Booking Engine Cloudbeds (`checkin`, `checkout`, `adults`, `kids`, `promo`, `room_type`) — payment & konfirmasi ditangani Cloudbeds
- **Webhook** `reservation/created` → track `booking_completed` (idempotent, response < 2 detik)
- URL shareable: `?checkin=&checkout=&adults=&kids=&rooms=&code=`
- Fallback error → WhatsApp / Call dengan pesan konteks

### 🔐 CMS Admin (`/admin`)
- **Auth**: Auth.js (NextAuth v5) — Credentials + JWT
- **RBAC**: Admin / Editor / Viewer (permission check per action)
- **CRUD lengkap**: Hotel & SEO settings, Rooms, Amenities, Gallery, Promotions, Testimonials, Experiences, FAQs, Attractions, Awards, Transports — dengan form Zod + React Hook Form, drag-and-drop sort (dnd-kit), upload gambar (sharp → local disk, interface S3-ready)
- **Audit log** setiap aksi, **scheduled publish** (cron → draft/expire otomatis), **preview** (`?preview=1`) sebelum publish
- **On-site booking** (`/admin/bookings`, khusus ADMIN): booking walk-in front desk — daftar & pencarian, create (sync Cloudbeds via `createReservation`), check-in/check-out/cancel/no-show (transisi tervalidasi, audit log + event `onsite_booking_created`/`onsite_booking_cancelled`)

### 📈 SEO & Analytics
- Metadata per halaman + per room, `sitemap.xml`, `robots.txt`
- **JSON-LD**: Hotel, HotelRoom+Offer, FAQPage, AggregateRating (data nyata dari DB — tanpa rating palsu)
- **GTM + GA4 + Meta Pixel + TikTok Pixel** (load hanya jika env diisi, tanpa env → 0 script vendor)
- **17 event typed** via `track()` terpusat (dataLayer + forward gtag/fbq/ttq), funnel `page_view → … → booking_completed`
- **Cookie consent gate**: banner Terima/Tolak — Tolak → 0 request vendor

### 🛡️ Performance, A11y & Security
- **CSP** conditional per vendor aktif, HSTS, X-Frame-Options DENY, nosniff, Referrer/Permissions-Policy
- Cache policy: homepage & rooms `s-maxage=60, SWR=300`; `/api/*` `no-store`
- **axe-core 0 violations** (landing, room, admin), kontras WCAG, focus trap, reduced-motion
- **Lighthouse ~88** mobile (Speed Index 2.8s, responsive images 100)
- **XSS-safe**: konten CMS dirender sebagai teks (diuji), input tervalidasi Zod

### 🧪 Testing
- **28 file / 155 unit & component tests** (Vitest + Testing Library)
- **14 skenario E2E Playwright** (production build): landing desktop + mobile + CMS lifecycle + RBAC

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 16** (App Router, SSR/ISR, React 19, TypeScript) |
| Styling | **Tailwind CSS v4** + design tokens + lucide-react icons |
| Database | **PostgreSQL + Prisma 7** (`prisma.config.ts` + driver adapter `@prisma/adapter-pg`) |
| Auth | **Auth.js v5** (NextAuth) — Credentials + JWT, RBAC |
| Validasi | **Zod 4** (satu source of truth API ↔ form) |
| Form admin | **React Hook Form** + Zod resolver + **@dnd-kit** (drag sort) |
| Booking engine | **Cloudbeds API v1** (adapter pattern + mock untuk dev) |
| Analytics | GTM / GA4 / Meta Pixel / TikTok (conditional, consent-gated) |
| Upload | API route + **sharp** (local disk, interface S3-ready) |
| Test | **Vitest** + Testing Library + **Playwright** |
| Deploy | **Vercel** (cron via `vercel.json`) + GitHub Actions CI |

## 📁 Struktur Proyek

```text
├── src/
│   ├── app/
│   │   ├── (public)/            # Landing page: / , /rooms/[slug], /privacy, /terms
│   │   ├── admin/               # CMS: /admin/login, /admin/(shell)/{entity}
│   │   ├── api/                 # /api/admin/* (CRUD+RBAC), /api/availability,
│   │   │                        #   /api/upload, /api/webhooks/cloudbeds, /api/cron/publish
│   │   ├── sitemap.ts           # sitemap.xml
│   │   └── robots.ts
│   ├── components/
│   │   ├── ui/                  # primitives (Button, Input, Modal, …)
│   │   ├── landing/             # 19 section landing page
│   │   ├── booking/             # BookingWidget, AvailabilityResults, sticky CTA
│   │   ├── admin/               # crud-factory, table, uploader, form
│   │   └── analytics/           # Scripts, CookieConsent, ConsentGate
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── auth.ts / rbac.ts / audit.ts
│   │   ├── booking-engine/      # adapter interface + cloudbeds + mock + provider-guard
│   │   ├── booking/             # state machine, URL builder
│   │   ├── seo/                 # metadata + JSON-LD builders
│   │   ├── analytics.ts         # track() typed events
│   │   ├── consent.ts           # cookie consent store
│   │   └── validators/          # Zod schemas
│   ├── proxy.ts                 # Next 16: auth guard /admin/*
│   └── generated/prisma/        # Prisma client (gitignored, via postinstall)
├── prisma/
│   ├── schema.prisma            # 19 model: Hotel, Room, Promotion, User, AuditLog, …
│   ├── seed.ts                  # data demo + admin/editor users
│   └── migrations/
├── e2e/                         # Playwright: landing, landing-mobile, cms
├── doc/                         # task teknis 01–09 + QA & release checklist
└── playwright.config.ts
```

## 🚀 Cara Menjalankan (Tutorial Run)

### 1. Prasyarat

- **Node.js ≥ 20**
- **PostgreSQL** lokal (atau [Neon](https://neon.tech) / Supabase gratis)

### 2. Install dependency

```bash
npm install
```

> `postinstall` otomatis menjalankan `prisma generate` (menghasilkan client ke `src/generated/prisma`).

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Minimal yang wajib diisi:

```env
# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hotel_landing?schema=public"

# Auth CMS — generate dengan: openssl rand -base64 32
AUTH_SECRET="random-string-32-bytes"

# URL publik (dipakai sitemap/OG)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Booking engine: mock (dev) | cloudbeds (production)
BOOKING_ENGINE_PROVIDER="mock"
```

Env opsional (isi saat sudah punya akun): `CLOUDBEDS_API_KEY`, `CLOUDBEDS_PROPERTY_ID`, `NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `NEXT_PUBLIC_WHATSAPP_NUMBER` — lihat `.env.example`.

> ⚠️ **`ALLOW_MOCK_ENGINE="true"`** hanya untuk E2E/CI. Di production rill tanpa flag ini, provider `mock` ditolak **fail-fast** (provider-guard, REL-001).

### 4. Setup database & seed

```bash
npm run db:migrate    # prisma migrate dev (buat schema + migration)
npm run db:seed       # isi data demo + user admin
```

**Login CMS default** (dari seed):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `changeme123` |
| Editor | `editor@example.com` | `changeme123` |

> Password bisa diubah di `prisma/seed.ts` (var `changeme123`) sebelum seed.

### 5. Jalankan dev server

```bash
npm run dev
```

Buka:
- 🌐 Landing page: **http://localhost:3000**
- 🔐 CMS admin: **http://localhost:3000/admin** (login dengan akun di atas)
- 🔎 API: `http://localhost:3000/api/availability?checkin=2026-09-01&checkout=2026-09-03&adults=2&kids=0&rooms=1`

### 6. Verifikasi akses sesuai role (RBAC)

Matriks permission ada di `src/lib/rbac.ts` dan menu admin difilter per role (`sidebar.tsx`). Login di `/admin` sesuai role-nya lalu cek perilaku di bawah:

| Role | Akun | Menu yang muncul | Kemampuan | Tidak bisa |
|---|---|---|---|---|
| **Admin** | `admin@example.com` | Semua menu (Dashboard, Bookings, konten, Hotel/SEO Settings, Users, Audit Log) | Full access: CRUD semua entitas, **Publish**, manage **Users**, on-site **Bookings** | — |
| **Editor** | `editor@example.com` | Dashboard + semua menu konten & Promotions | CRUD konten & promo (simpan draft) | **Publish**, Settings, Users, Audit Log |
| **Marketing** *(buat manual)* | via **Admin → Users** | = Editor + **Audit Log** | CRUD konten + **Publish** + lihat analytics | Settings, Users, on-site Booking |
| **Viewer** *(buat manual)* | via **Admin → Users** | Hanya **Dashboard** + **Bookings** (read-only) | Lihat halaman booking & dashboard | Semua aksi tulis → **403** (JSON), tanpa akses menu CMS |

**Langkah uji cepat per role:**
1. Login **Admin** → pastikan semua menu muncul, coba publish sebuah room (mengubah `status`), buat user `Viewer` di `/admin/users`.
2. Logout → login **Editor** → menu Settings/Users/Audit Log hilang; coba publish → ditolak 403 (`requirePermission("publish")` di `src/lib/publish.ts`).
3. Logout → login **Viewer** → hanya Dashboard & Bookings read-only; akses langsung `/admin/rooms` → redirect/403.

> Buat user **Marketing/Viewer** via menu **Admin → Users**, atau tambahkan di `prisma/seed.ts`.

## 📜 Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Production build |
| `npm run start` | Jalankan production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Unit & component tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | E2E Playwright (build + start otomatis) |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production) |
| `npm run db:seed` | Seed database |

## 🧪 Testing

```bash
npm test              # 155 unit/component tests
npm run test:e2e      # 14 E2E scenarios (butuh DB + .env, otomatis set ALLOW_MOCK_ENGINE)
```

Coverage E2E:
- **landing**: semua section render, booking flow mock → rate, tracking `booking_started`, URL shareable, room JSON-LD
- **mobile**: drawer menu (keyboard), sticky bar, tanpa horizontal overflow
- **CMS**: login, room lifecycle (create → draft 404 + preview → publish → landing), promotion ACTIVE, audit log, RBAC viewer 403

## ☁️ Deployment (Vercel)

1. Push ke GitHub → import di [Vercel](https://vercel.com/new).
2. Isi **semua env** (terutama `DATABASE_URL`, `AUTH_SECRET`, `BOOKING_ENGINE_PROVIDER=cloudbeds` + kredensial Cloudbeds).
3. Jalankan migration di deploy: `npm run db:deploy`.
4. Cron publish otomatis via `vercel.json` (`/api/cron/publish` harian) — amankan dengan `CRON_SECRET`.
5. CI (GitHub Actions) otomatis: lint → typecheck → test → build + **job E2E dengan Postgres service**.

Checklist lengkap & hardening sebelum rilis: [`doc/release-checklist.md`](doc/release-checklist.md). Acceptance criteria PRD: [`doc/qa-acceptance.md`](doc/qa-acceptance.md).

## 📚 Dokumentasi

- [PRD.md](PRD.md) — Product Requirements Document
- [doc/README.md](doc/README.md) — indeks & keputusan arsitektur (decision log)
- `doc/01`–`09` — task teknis per milestone (foundation, data model, CMS backend/UI, landing, booking, SEO, perf/security, testing)
- [doc/qa-acceptance.md](doc/qa-acceptance.md) — mapping PRD §69 → implementasi → verifikasi
- [doc/release-checklist.md](doc/release-checklist.md) — checklist deploy & release
