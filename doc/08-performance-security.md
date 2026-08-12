# 08 — Performance, Accessibility & Security

> Mapping PRD: §45–52 (Performance, Images, Video, Responsive, A11y, Security, Privacy), §63 (Image Requirements), §65 (Caching)

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| PERF-001 | Image pipeline (next/image + sharp + WebP/AVIF) | P0 | M |
| PERF-002 | Lazy loading & priority strategy | P0 | S |
| PERF-003 | Video optimization (poster, mobile fallback, reduced motion) | P0 | M |
| PERF-004 | Core Web Vitals budget & monitoring | P0 | M |
| PERF-005 | Responsive QA (mobile/tablet/desktop) | P0 | M |
| PERF-006 | Caching & CDN strategy | P1 | M |
| A11Y-001 | Accessibility audit & fixes (WCAG 2.1 AA) | P0 | L |
| SEC-001 | Security headers & CSP | P0 | M |
| SEC-002 | Input validation & XSS protection | P0 | M |
| SEC-003 | Auth & session hardening | P0 | S |
| SEC-004 | Privacy pages & cookie consent | P1 | M |

---

## PERF-001 — Image Pipeline

**P0 · M · Perf**

**Detail teknis:**
- Semua gambar publik lewat `next/image` (otomatis WebP/AVIF + resize + lazy).
- `next.config.ts`: `images.domains` termasuk uploads lokal & CDN.
- Hero: `sizes` di-set benar (100vw), `priority` — ini LCP.
- Room/gallery: ukuran via `sizes` prop; format modern otomatis.
- Upload CMS sudah menghasilkan versi optimized (CMS-B-008) — pastikan dipakai (`thumb` untuk grid, `lg` untuk lightbox).
- Alt text dari CMS wajib untuk semua (SEO + a11y).

**DoD:**
- [ ] Lighthouse: semua image punya dimensi eksplisit & format modern.

---

## PERF-002 — Lazy Loading Strategy

**P0 · S · Perf**

- Hero image: `priority` (preload, bukan lazy).
- Semua gambar below-fold: lazy default `next/image`.
- Video hero: `preload="none"` atau poster-first (lihat PERF-003).
- Komponen non-critical (lightbox, carousel, maps): `next/dynamic` + `dynamic(() => import(...), { ssr: false })` hanya yang butuh window.

**DoD:**
- [ ] Total JS initial < target (cek bundle analyzer / Lighthouse transfer size).

---

## PERF-003 — Video Optimization

**P0 · M · Perf**

`components/landing/HeroVideo.tsx`:

- Poster image wajib (dipakai sebelum video load & sebagai fallback).
- `autoPlay muted loop playsInline` — `muted` wajib untuk autoplay mobile.
- `preload="metadata"` (jangan download full video di awal).
- **Mobile fallback**: jika `window.innerWidth < 768`, tampilkan image statis (bandwidth, PRD §47).
- `prefers-reduced-motion: reduce` → jangan autoplay, tampilkan poster statis.
- Compressed: file .mp4 (H.264) max ~5MB, dan/atau .webm — disimpan di `public/uploads` atau CDN.

**DoD:**
- [ ] Mobile tidak download video (test di network tab).
- [ ] Reduced motion diaktifkan → poster, bukan video.

---

## PERF-004 — Core Web Vitals Budget

**P0 · M · Perf**

**Detail teknis:**
- Target PRD §45: `LCP < 2.5s`, `INP < 200ms`, `CLS < 0.1` (mobile 4G throttling).
- Verifikasi: Lighthouse CI (github action pada setiap PR) + PageSpeed Insights manual.
- Fix priority: LCP (hero), CLS (reserve space untuk semua media: `aspect-ratio` box), INP (jaga event handlers ringan, hindari jank).
- **Reserve aspect ratio** untuk semua gambar & video box — CLS terbesar biasanya dari media.

**DoD:**
- [ ] Lighthouse mobile ≥ 90 Performance di staging.

---

## PERF-005 — Responsive QA

**P0 · M · QA**

- QA di breakpoints: 375px, 768px, 1024px, 1440px (PRD §48).
- Prioritas mobile-first: pastikan CTA booking mudah diakses mobile (sticky bar LP-019).
- Test: tidak ada horizontal scroll, font scale benar, touch target ≥ 44px.

**DoD:**
- [ ] Checklist QA responsif terisi untuk semua section LP-*.

---

## PERF-006 — Caching & CDN

**P1 · M · Infra**

- Vercel (CDN edge) + ISR dengan tags (CMS-B-010) — content hotel di-cache, availability real-time (PRD §65).
- Cache-Control: halaman publik `s-maxage=60, stale-while-revalidate=300`.
- API availability: `Cache-Control: no-store` (real-time).
- Statik (fonts, logo, images) immutable.

**DoD:**
- [ ] `curl -I` halaman publik menampilkan cache headers benar.

---

## A11Y-001 — Accessibility Audit (WCAG 2.1 AA)

**P0 · L · A11y**

**Detail teknis — checklist wajib (PRD §50):**
- Keyboard: seluruh halaman bisa dinavigasi tab; focus trap pada modal & lightbox & drawer menu.
- Focus state visible (focus ring konsisten, `:focus-visible`).
- Screen reader: landmark (`header/nav/main/footer`), heading order (h1 tunggal per halaman), aria-label pada ikon-only buttons, `alt` di semua gambar.
- Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI) — cek dengan axe.
- Form: label terhubung (`htmlFor`/`id`), error message dengan `aria-describedby` & `role="alert"`.
- Carousel & accordion: `aria-live` yang benar, kontrol pause/play.
- Reduced motion (PERF-003).
- Audit tooling: `@axe-core/react` di dev + addon-a11y Storybook + Lighthouse a11y di CI.

**DoD:**
- [ ] axe-core scan = 0 critical/serious issue di landing & admin.

---

## SEC-001 — Security Headers & CSP

**P0 · M · Security**

**Detail teknis:**
- `next.config.ts` → `headers()`:

```ts
{
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://*.cloudbeds.com",
    "frame-src https://maps.google.com https://www.google.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://www.google-analytics.com https://*.cloudbeds.com",
  ],
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
}
```

- Tambahkan domain vendor sesuai yang diaktifkan (jangan blanket).
- HTTPS wajib (Vercel otomatis) + test `securityheaders.com`.

**DoD:**
- [ ] Header terpasang di production; tidak ada fitur rusak akibat CSP (test pixel & maps).

---

## SEC-002 — Input Validation & XSS

**P0 · M · Security**

- Semua input → Zod (DATA-005) sebelum masuk DB — sudah ada, jangan lewat.
- Output: React meng-escape otomatis — jangan pakai `dangerouslySetInnerHTML` kecuali untuk JSON-LD (SEO-004, `JSON.stringify`-sanitized) dan deskripsi CMS yang di-render sebagai plain text.
- Jika nanti butuh rich text dari CMS: pakai sanitizer (`sanitize-html`) + whitelist tag; **plain text lebih aman untuk MVP**.
- Upload: validasi mime & magic bytes (CMS-B-008).

**DoD:**
- [ ] Tes XSS: `<script>` di field CMS → tampil sebagai teks, tidak execute.

---

## SEC-003 — Auth & Session Hardening

**P0 · S · Security**

- `AUTH_SECRET` kuat (openssl rand) & hanya di server.
- JWT expiry pendek (1 hari, refresh via re-login — atau `maxAge` sesuai kebutuhan staff).
- Brute force: rate limit login (CMS-B-012).
- Session cookie: `httpOnly`, `sameSite: "lax"`, `secure` di production.
- Logout membatalkan session (revoke via secret rotation atau jwks).
- Tidak pernah expose `passwordHash` (select exclude di Prisma queries admin).

**DoD:**
- [ ] Setelah logout, akses `/admin` ditolak.

---

## SEC-004 — Privacy Pages & Cookie Consent

**P1 · M · Privacy**

- Halaman statis: `/privacy-policy`, `/terms`, `/cancellation-policy`, `/booking-terms` (PRD §52) — konten dari CMS `Page` sederhana (atau markdown static dulu).
- **Cookie consent banner** jika pixel aktif di region yang butuh consent:
  - `components/analytics/CookieConsent.tsx` — banner "Kami menggunakan cookie..." dengan Accept/Reject (storage `localStorage`).
  - Jika reject → jangan load GTM/pixel (komponen `Scripts.tsx` mengecek consent state sebelum render `next/script`).

**DoD:**
- [ ] Reject consent → network tab tidak ada request ke google-analytics/facebook.
