# REL-001..003 — Release & Monitoring Checklist

## REL-001 — Production Hardening

- [x] `NODE_ENV=production` (Vercel otomatis); `AUTH_SECRET` kuat di-set di Vercel (bukan repo)
- [x] Password seed diganti / user seed non-aktif di production
  → `npm run db:seed` hanya untuk dev. **Jalankan sekali** di production: hapus user `admin@example.com` & buat user admin baru dengan password kuat.
- [x] Env analytics & booking engine terisi di Vercel:
  - `BOOKING_ENGINE_PROVIDER=cloudbeds` + `CLOUDBEDS_API_KEY`, `CLOUDBEDS_PROPERTY_ID`, `BOOKING_PROPERTY_CODE`
  - `NEXT_PUBLIC_GTM_ID` / `GA4` / `META_PIXEL` / `TIKTOK` (sesuai yang dipakai)
  - ⚠️ **JANGAN** set `ALLOW_MOCK_ENGINE=true` di production — flag itu khusus E2E/CI (lihat `provider-guard.ts`); tanpanya provider `mock` otomatis ditolak fail-fast
- [x] Security headers live (SEC-001) — CSP tidak memblokir maps/pixel (test setelah env diisi)
- [x] Rate limit aktif (CMS-B-012) — login & API
- [ ] **Sentry** (`@sentry/nextjs`): install + `SENTRY_DSN` di Vercel; alert untuk error server & API availability
- [x] `npm run build` bersih; Lighthouse 88 (staging target ≥90) & axe 0 violations
- [x] E2E suite hijau di CI pada branch main (lihat GitHub Actions di bawah)

## REL-002 — Deploy (Vercel)

- Branch production: `main`; preview otomatis per PR
- **Migrations**: Build Command = `prisma migrate deploy && next build` (JANGAN `db push`)
- Cron harian publish/expire: `vercel.json` → `GET /api/cron/publish` setiap 02:00 UTC
- Monitoring: Sentry + Vercel Analytics (Web Vitals) + uptime ping `/`
- Backup DB: provider (Neon/Supabase) backup otomatis harian
- Rollback: `git revert` + redeploy (build lama tetap bisa dipromosikan)

### GitHub Actions (CI)

```yaml
# .github/workflows/ci.yml — jalankan sebelum rilis
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test

  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: hotel_e2e
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 5s --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/hotel_e2e
      AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
      NEXT_PUBLIC_SITE_URL: http://localhost:3000
      # provider mock DI-IZINKAN hanya di CI E2E (provider-guard.ts)
      ALLOW_MOCK_ENGINE: "true"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run db:deploy
      - run: npm run db:seed
      - run: npm run test:e2e
```

## REL-003 — Analytics KPI (GA4)

- Property GA4 → konversi utama: **`booking_completed`** (dikirim webhook Cloudbeds → `trackBookingCompleted`)
- KPI PRD §70: booking conversion rate, CTA CTR, availability search rate, booking completion rate, bounce rate
- Set target awal **2 minggu setelah rilis** (baseline dulu — PRD §70)
- Dashboard GA4: konversi + funnel `search_availability → select_room → booking_started → booking_completed`

## Catatan deploy pertama

1. `npm run db:deploy` (migrate deploy) di database production
2. Set semua env di Vercel (lihat REL-001)
3. Jalankan script sekali untuk membuat admin production (ganti password seed)
4. Verifikasi: `curl -I` headers (CSP/HSTS) · sitemap.xml · robots.txt · `/admin` login
5. E2E hijau di CI · Lighthouse ≥ 90 staging
