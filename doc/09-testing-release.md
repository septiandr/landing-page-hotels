# 09 — Testing, Acceptance Criteria & Release

> Mapping PRD: §69 (Acceptance Criteria), §45–48 (Perf), §70 (Success Metrics), §71–73 (Phases)

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| TEST-001 | Unit test: utils & validators | P0 | M |
| TEST-002 | Unit test: booking state machine & engine adapter | P0 | M |
| TEST-003 | Component test: BookingWidget, RoomCard, Gallery | P0 | L |
| TEST-004 | E2E Playwright: landing page flow | P0 | L |
| TEST-005 | E2E Playwright: CMS flow (login → edit → publish) | P0 | L |
| QA-001 | Acceptance criteria mapping & sign-off | P0 | M |
| REL-001 | Production hardening checklist | P0 | M |
| REL-002 | Deploy & monitoring setup | P1 | M |
| REL-003 | Analytics KPI dashboard setup | P1 | S |

---

## TEST-001 — Unit Test: Utils & Validators

**P0 · M · Test**

`src/lib/**/*.test.ts` (Vitest):

- `format.test.ts`: date, currency (IDR/USD), `getNights` (edge: same date, check-out < check-in → error).
- `validators/*.test.ts`: tiap Zod schema — valid input lulus, invalid ditolak dengan field error benar.
- `booking/url.test.ts`: buildAvailabilityUrl params.
- `promotions.test.ts`: logika status waktu (scheduled→active, expired).

**DoD:**
- [ ] Coverage ≥ 80% untuk lib/format, lib/validators, lib/booking.

---

## TEST-002 — Unit Test: Booking State & Engine Adapter

**P0 · M · Test**

- `lib/booking-states.test.ts`: semua transisi state (idle → loading → available/no-availability/error/invalid-date/invalid-guests).
- `lib/booking-engine/mock.test.ts`: MockAdapter mengikuti kontrak interface (harga, currency, error path).
- `lib/booking-engine/index.test.ts`: `getEngine()` memilih provider sesuai env (mock default).

**DoD:**
- [ ] Mock env var → `getEngine()` return provider benar.

---

## TEST-003 — Component Test (RTL)

**P0 · L · Test**

`src/components/**/*.test.tsx`:

- `BookingWidget`: pre-fill dari URL params, validasi inline muncul (invalid date), submit memanggil fetch `/api/availability`, tampilkan hasil / no-availability / error state.
- `RoomCard`: render price fallback vs engine, CTA link.
- `Gallery`: filter kategori bekerja, lightbox open/close, Esc.
- `PromotionCountdown`: render format benar, expired → 00:00:00.
- `Faq`: accordion toggle + aria-expanded.

**DoD:**
- [ ] Tiap komponen P0 punya minimal 1 test interaksi utama.

---

## TEST-004 — E2E: Landing Page Flow

**P0 · L · E2E**

Playwright (`e2e/landing.spec.ts`) — dengan `BOOKING_ENGINE_PROVIDER=mock`:

1. Open `/` → hero & semua section render.
2. Scroll ke widget → isi tanggal + guests → Search → room rates muncul.
3. Pilih room → klik Book → halaman konfirmasi demo (mock) → `booking_started` event di dataLayer.
4. URL shareable: open `/ ?checkin=...&checkout=...` → widget pre-filled.
5. Mobile viewport (iPhone 14) → sticky bar muncul saat scroll, menu drawer berfungsi.
6. Room detail: `/rooms/deluxe-king` → metadata & JSON-LD ada.

**DoD:**
- [ ] Test hijau di CI (webServer config Playwright menyalakan `npm run dev`/preview).

---

## TEST-005 — E2E: CMS Flow

**P0 · L · E2E**

Playwright (`e2e/cms.spec.ts`):

1. Login (user editor dari seed) → dashboard.
2. Buat room baru + upload gambar → save.
3. Preview room (draft) → tampil di `?preview=1`, tidak tampil di public.
4. Publish → room muncul di landing page (revalidate).
5. Edit promotion → set schedule → publish → countdown tampil.
6. Audit log mencatat aksi (cek `/admin/audit-log`).
7. RBAC: login sebagai viewer → tombol publish tidak ada; POST API langsung → 403.

**DoD:**
- [ ] Workflow PRD §61 (login→edit→publish < 5 menit) terverifikasi otomatis.

---

## QA-001 — Acceptance Criteria Mapping

**P0 · M · QA**

Verifikasi seluruh checklist PRD §69, konversi ke test:

| PRD §69 | Implementasi |
|---|---|
| Hero mobile/desktop, CMS-managed, fallback video | LP-003, PERF-003 |
| Booking: pilih tgl, guest, search, loading/error/no-avail, masuk engine | BK-001..008 |
| Rooms: CMS, gallery, occupancy, amenities, CTA | LP-006, CMS-U-004 |
| Promotions: create, schedule, expire otomatis, terms | DATA-003, CMS-B-009 |
| CMS: login, edit, upload, preview, publish, audit | CMS-B-*, CMS-U-* |
| Analytics: page view, CTA, search, start, completion | ANA-003 |
| SEO: meta, sitemap, robots, canonical, structured data, OG | SEO-001..004 |
| Perf: LCP/INP/CLS, images, mobile | PERF-001..004 |

**DoD:**
- [ ] Tiap baris PRD §69 memiliki test atau checklist manual yang hijau.

---

## REL-001 — Production Hardening Checklist

**P0 · M · Release**

Sebelum rilis:

- [ ] `NODE_ENV=production`, `AUTH_SECRET` di-set di Vercel (bukan repo).
- [ ] Password seed diganti (user default non-aktif di production).
- [ ] Env analytics & booking engine terisi (atau mock dinonaktifkan — `ALLOW_MOCK_ENGINE=false` di production).
- [ ] Security headers live (SEC-001), CSP tidak memblok pixel/maps.
- [ ] Rate limit aktif (CMS-B-012).
- [ ] Error monitoring: **Sentry** (`@sentry/nextjs`) — error client/server ke dashboard, alert untuk API availability gagal.
- [ ] `npm run build` bersih; Lighthouse & axe pass (PERF-004, A11Y-001).
- [ ] E2E suite hijau di CI pada branch main.

**DoD:**
- [ ] Checklist terisi & ditandatangani (owner).

---

## REL-002 — Deploy & Monitoring

**P1 · M · Infra**

- Deploy: **Vercel** (production branch `main`; preview per PR).
- Migrations saat deploy: `prisma migrate deploy` di Vercel Build Command (jangan `db push` di production).
- Cron: `vercel.json` → scheduled job harian untuk publish/expire (CMS-B-009) + sitemap refresh.
- Monitoring: Sentry + Vercel Analytics (Web Vitals) + uptime check (ping `/`).
- Backup DB: daily (provider PostgreSQL — Neon/Supabase free tier punya backup otomatis).

**DoD:**
- [ ] Deploy baru tidak break migration; rollback mudah (git revert + redeploy).

---

## REL-003 — Analytics KPI Setup

**P1 · S · Analytics**

- GA4 property: konversi = `booking_completed`.
- Dashboard GA4: KPI PRD §70 — booking conversion rate, CTA CTR, availability search rate, booking completion rate, bounce rate.
- Baseline dikumpulkan 2 minggu setelah rilis untuk set target awal (PRD §70: target setelah baseline tersedia).

**DoD:**
- [ ] GA4 menampilkan konversi `booking_completed` sebagai primary conversion.
