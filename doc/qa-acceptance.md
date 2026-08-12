# QA-001 — Acceptance Criteria Mapping (PRD §69)

> Status: ✅ = otomatis teruji · 🔎 = manual/checklist · ⏳ = menunggu data/infra eksternal

## Peta Kriteria → Implementasi → Verifikasi

| PRD §69 | Implementasi | Verifikasi |
|---|---|---|
| **Hero** mobile/desktop, CMS-managed, fallback video | LP-003 (`Hero.tsx`, gambar dari CMS `hotel.logo`/gallery) | ✅ E2E `landing.spec.ts` (hero render) + a11y scan |
| **Booking**: pilih tgl, guest, search, loading/error/no-avail, masuk engine | BK-001..008 (`BookingWidget`, `/api/availability`, state machine) | ✅ Unit `booking-states.test.ts` + Component `booking-widget.test.tsx` (6) + E2E (rate muncul, no-avail, error fallback) |
| **Rooms**: CMS, gallery, occupancy, amenities, CTA | LP-006 (`RoomCard`/`RoomList`), CMS-U-004 | ✅ Component `room-card.test.tsx` + E2E room detail (JSON-LD) |
| **Promotions**: create, schedule, expire otomatis, terms | DATA-003, CMS-B-009 (`lib/promotions.ts`, cron `processScheduledPublishes`) | ✅ Unit `promotions.test.ts` + `countdown.test.ts` + E2E create ACTIVE → tampil; ⏳ expire otomatis via cron (Vercel) |
| **CMS**: login, edit, upload, preview, publish, audit | CMS-B-*, CMS-U-* | ✅ E2E `cms.spec.ts` (login, create room, preview `?preview=1`, publish → landing, audit log, RBAC 403) |
| **Analytics**: page view, CTA, search, start, completion | ANA-003 (`lib/analytics.ts` 17 event) | ✅ Unit `analytics.test.ts` + E2E dataLayer `booking_started`/`search_availability`; ⏳ `booking_completed` via webhook (butuh Cloudbeds) |
| **SEO**: meta, sitemap, robots, canonical, structured data, OG | SEO-001..004 | ✅ Unit `json-ld.test.ts` + E2E JSON-LD + smoke (sitemap/robots/meta) |
| **Perf**: LCP/INP/CLS, images, mobile | PERF-001..004 | ✅ Lighthouse 88 mobile (CLS 0, SI 2.8s) + axe 0 violations; ⏳ staging ≥90 |
| **Security**: headers, CSP, consent | SEC-001..004 | ✅ Unit `consent.test.tsx` (5) + `xss.test.tsx` + smoke header `curl -I` |

## Sign-off

- [x] Unit & component: 28 file / 155 test (Vitest) — `npm test`
- [x] E2E landing (desktop 5 + mobile 2) — `npm run test:e2e`
- [x] E2E CMS 7 skenario (grup room-lifecycle serial) — `npm run test:e2e`
- [x] Total E2E 14/14 hijau (desktop + mobile + CMS)
- [x] Lint 0 error · Typecheck 0 error · Build bersih
- [ ] **Sign-off owner** (tandatangani sebelum rilis)
