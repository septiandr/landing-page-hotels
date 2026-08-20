# 11 — Test Script per Role (RBAC)

> **Tujuan**: panduan menjalankan & memverifikasi fitur sesuai **role pengguna** (Guest/Public, Admin, Marketing, Editor, Viewer). Setiap role punya ruang lingkup menu, aksi, dan API yang berbeda — dokumen ini memecah test apa saja yang harus dijalankan per role, lengkap dengan langkah manual + test otomatis yang sudah ada.
>
> Mapping: `src/lib/rbac.ts` (matriks permission), `src/components/admin/sidebar.tsx` (filter menu per role), `src/lib/require.ts` (guard API 401/403).

---

## Ringkasan

| Role | Akun (seed) | Menu yang muncul | Kemampuan | Tidak bisa |
|---|---|---|---|---|
| **Guest / Public** | (tanpa login) | Landing page + booking widget | Lihat konten publik, cari ketersediaan, booking ke Cloudbeds | Akses `/admin/*` (redirect ke login) |
| **Admin** | `admin@example.com` / `changeme123` | Semua menu | CRUD semua entitas, publish, settings, users, audit log, on-site booking | — |
| **Marketing** *(buat manual)* | via Admin → Users | = Editor + **Audit Log** | CRUD konten + **publish** + analytics | Settings, Users, Bookings (on-site) |
| **Editor** | `editor@example.com` / `changeme123` | Dashboard + konten + promotions | CRUD konten & promo (draft) | **Publish**, Settings, Users, Audit Log |
| **Viewer** *(buat manual)* | via Admin → Users | Dashboard + Bookings (read-only) | Lihat booking & dashboard | Semua aksi tulis → 403, tanpa menu CMS |

---

## Prasyarat Test

1. **Setup lokal** (lihat `README.md` §1–4):
   ```bash
   npm install
   cp .env.example .env        # isi DATABASE_URL, AUTH_SECRET, BOOKING_ENGINE_PROVIDER=mock
   npm run db:migrate
   npm run db:seed             # membuat admin@example.com + editor@example.com
   ```
2. **Buat user Marketing & Viewer** (khusus admin): login `/admin` → menu **Users** → *Tambah user* dengan role masing-masing. *(Atau tambahkan di `prisma/seed.ts` lalu `npm run db:seed`.)*
3. **Jalankan app**: `npm run dev` → landing di `http://localhost:3000`, admin di `http://localhost:3000/admin`.
4. **Siapkan aset test**: 1 gambar kecil (< 5 MB) untuk uji upload, dan kalender (tanggal check-in/check-out valid, check-out > check-in).

---

## Matriks Permission (sumber: `src/lib/rbac.ts`)

| Permission | ADMIN | MARKETING | EDITOR | VIEWER |
|---|:---:|:---:|:---:|:---:|
| `content` (CRUD room, gallery, testimoni, experience, attraction, award, transport, FAQ, amenity) | ✅ | ✅ | ✅ | — |
| `promotion` (CRUD promo + schedule) | ✅ | ✅ | ✅ | — |
| `publish` (publish/unpublish) | ✅ | ✅ | — | — |
| `analytics` (audit log) | ✅ | ✅ | — | — |
| `settings` (Hotel & SEO) | ✅ | — | — | — |
| `users` (manage user) | ✅ | — | — | — |
| `onsite_booking` (on-site booking + aksi) | ✅ | — | — | read-only |

> VIEWER punya pengecualian: hanya halaman **Bookings** (read-only, via `requirePermissionWithRead`), Dashboard, dan tidak punya akses ke halaman CMS lain.

---

## 1. Role: Guest / Public (tanpa login)

> Otomatis: `e2e/landing.spec.ts` (5 test), `e2e/landing-mobile.spec.ts` (2 test), komponen landing (`src/components/landing/*.test.tsx`).

### 1.1. Landing page render (E2E + manual)

- [ ] Buka `/` → hero, section utama (rooms, amenities, gallery, experiences, promotions, reviews, awards, location, attractions, FAQ, footer) semua render.
- [ ] `/rooms/deluxe-king` (atau slug room published) → detail room tampil + metadata & JSON-LD.
- [ ] Mobile viewport (iPhone 14): drawer menu terbuka/tertutup via keyboard, sticky booking bar muncul saat scroll, tidak ada horizontal overflow.

### 1.2. Booking widget (E2E + manual)

- [ ] Isi tanggal (valid) + guests + rooms → **Search** → daftar kamar + harga muncul (mock engine).
- [ ] Tanggal invalid (check-out ≤ check-in / masa lalu) → pesan error inline.
- [ ] No availability → state "tidak tersedia" muncul.
- [ ] URL shareable: buka `/?checkin=2026-09-01&checkout=2026-09-03&adults=2&kids=0&rooms=1` → widget ter-pre-fill.
- [ ] Klik *Book* → deep link ke booking engine (mock) + event `booking_started` masuk dataLayer.
- [ ] Consent cookie: banner muncul; pilih **Tolak** → 0 request vendor (GTM/GA4/Meta/TikTok tidak load).

### 1.3. Akses terlarang

- [ ] Buka `/admin`, `/admin/rooms`, `/admin/bookings` → redirect ke `/admin/login`.
- [ ] Panggil `/api/admin/*` tanpa session → **401** (JSON).
- [ ] `/api/availability` tanpa params → **400**/error validasi (bukan 500).

---

## 2. Role: Admin (`admin@example.com`)

> Otomatis: seluruh `e2e/cms.spec.ts` (13 test) berjalan dengan akun admin; unit test `src/lib/**` & komponen admin.

### 2.1. Login & sesi

- [ ] Login dengan kredensial benar → redirect ke Dashboard.
- [ ] Password salah → pesan error `LOGIN_FAILED` dicatat di audit log.
- [ ] Logout → kembali ke `/admin/login`, akses `/admin` di-blokir.

### 2.2. Dashboard

- [ ] Heading dashboard tampil, statistik (jika ada) render tanpa error.

### 2.3. CRUD konten — tiap entitas (manual + API)

Ulangi skenario berikut untuk **masing-masing** entitas berikut:

| Menu | API path | Kolom/aksi khusus |
|---|---|---|
| Rooms | `/api/admin/rooms` | upload foto (1..n), drag sort, harga, status |
| Gallery | `/api/admin/gallery` | upload gambar, reorder (drag), kategori |
| Promotions | `/api/admin/promotions` | schedule, promo code, countdown |
| Testimonials | `/api/admin/testimonials` | rating 1–5, sumber |
| Experiences | `/api/admin/experiences` | image, harga, CTA |
| Attractions | `/api/admin/attractions` | image, koordinat, jarak |
| Awards | `/api/admin/awards` | logo, tahun |
| Transports | `/api/admin/transports` | ikon, harga, CTA |
| FAQs | `/api/admin/faqs` | kategori, urutan |
| Amenities | `/api/admin/amenities` | group (Hotel/Room), ikon |

Per entitas:

- [ ] **Create**: buka menu → *Tambah* → isi form (termasuk upload gambar) → simpan → muncul di daftar.
- [ ] **Edit**: ubah field → simpan → nilai baru tampil (audit log mencatat diff).
- [ ] **Hapus**: hapus item → hilang dari daftar + audit log mencatat DELETE.
- [ ] **Cari/Filter**: search + filter status/kategori bekerja.
- [ ] **Validasi**: submit form kosong / salah format → error field muncul (Zod), tidak tersimpan.
- [ ] **Drag-sort** (jika ada): ubah urutan → urutan baru tercermin di landing page.
- [ ] **XSS**: masukkan `<script>alert(1)</script>` di field teks → dirender sebagai teks (tidak dieksekusi).

### 2.4. Upload gambar

- [ ] Upload gambar valid (< 5 MB) → preview muncul, URL tersimpan.
- [ ] Upload file > 5 MB / tipe salah → error ditolak.
- [ ] Hapus gambar → field kembali kosong (placeholder, bukan `src=""`).

### 2.5. Publish / Unpublish (workflow PRD §61)

- [ ] Buat konten `DRAFT` → tidak tampil di publik, tampil dengan `?preview=1` (session aktif).
- [ ] Publish → konten muncul di landing page (revalidate cache).
- [ ] Unpublish → konten hilang dari landing page.
- [ ] **Scheduled publish**: set jadwal → cron `/api/cron/publish` (atau trigger manual) → status berubah otomatis.
- [ ] Promosi **ACTIVE** + `showCountdown` → countdown tampil di section offers (E2E sudah menguji ini).

### 2.6. Settings

- [ ] **Hotel Profile**: ubah nama, alamat, kontak, logo → tersimpan + tampil di landing/footer.
- [ ] **SEO Settings**: ubah title/description/OG image → metadata & sitemap ikut berubah.
- [ ] Role tanpa permission `settings` (Editor/Marketing) → akses menu/tombol tidak muncul.

### 2.7. Manajemen Users

- [ ] Buat user **Marketing**, **Editor**, **Viewer** dengan role berbeda → bisa login.
- [ ] Ubah role / reset password / nonaktifkan user → berlaku saat login berikutnya.
- [ ] Hanya ADMIN yang melihat menu **Users** & bisa memanggil `/api/admin/users` (`users`).

### 2.8. Audit Log

- [ ] `/admin/audit-log` menampilkan aksi CREATE/UPDATE/DELETE/PUBLISH/LOGIN/booking.
- [ ] Filter entity & aksi bekerja; detail diff (nilai sebelum → sesudah) tampil.
- [ ] Hanya ADMIN & MARKETING yang bisa membuka halaman ini (`analytics`).

### 2.9. On-Site Booking (walk-in front desk) — E2E otomatis + manual

- [ ] **Create**: buat booking walk-in (room, check-in/out, tamu, metode bayar) → status `CONFIRMED`, kode `OB-YYYYMMDD-NNN` dibuat, `cloudbedsReservationId` terisi (mock).
- [ ] **Anti double-booking**: tanggal sudah penuh → ditolak (engine checkAvailability).
- [ ] **List & search**: `/admin/bookings` menampilkan booking; pencarian nama/kode bekerja.
- [ ] **Detail**: `/admin/bookings/:id` → info lengkap + riwayat status.
- [ ] **Transisi status** (validasi `src/lib/booking-status.ts`):
  - [ ] `CONFIRMED` → **Check-in** → `CHECKED_IN`
  - [ ] `CHECKED_IN` → **Check-out** → `CHECKED_OUT` (terminal)
  - [ ] `CONFIRMED` → **Cancel** (wajib alasan) → `CANCELLED`
  - [ ] `CONFIRMED` → **No-show** → `NO_SHOW`
  - [ ] Transisi invalid (mis. check-in ulang setelah check-out) → **409 INVALID_TRANSITION**
  - [ ] Cancel tanpa alasan → **400**
- [ ] Setiap aksi tercatat di **audit log** + event analytics `onsite_booking_*`.
- [ ] UI: role selain ADMIN tidak melihat tombol aksi / menu Bookings (kecuali VIEWER read-only).

### 2.10. API negatif (RBAC enforcement)

- [ ] Sebagai admin, semua `/api/admin/*` yang berhak → **200/201**.
- [ ] Manipulasi session/role di request → tidak mengubah permission (guard baca dari session JWT).

---

## 3. Role: Marketing (buat manual)

> Tidak ada E2E khusus — kombinasi dari admin flow + pembatasan menu. Pastikan user dibuat via Admin → Users.

### 3.1. Akses yang boleh

- [ ] Login → menu: Dashboard, semua konten (Rooms…Amenities), Promotions, **Audit Log**.
- [ ] CRUD konten & promotions (sama dengan checklist 2.3).
- [ ] **Publish/Unpublish** konten & promo (`publish`).
- [ ] Melihat **Audit Log** (`analytics`).

### 3.2. Akses yang dilarang (harus diblokir)

- [ ] Menu **Users**, **Hotel/SEO Settings**, **Bookings** (on-site) **tidak muncul** di sidebar.
- [ ] Buka langsung `/admin/users` → **403** (atau redirect).
- [ ] Buka langsung `/admin/settings/hotel`, `/admin/settings/seo` → **403**.
- [ ] Buka langsung `/admin/bookings` → **403**.
- [ ] API: `POST/PATCH/DELETE /api/admin/users/*`, `/api/admin/settings/*`, `/api/admin/bookings/*` → **403** (JSON).
- [ ] Tidak bisa create on-site booking / aksi booking.

### 3.3. Promosi & analytics

- [ ] Buat promo dengan schedule → publish → countdown muncul di landing.
- [ ] Audit log menampilkan aksi marketing (create/publish).

---

## 4. Role: Editor (`editor@example.com`)

> Otomatis: sebagian dipakai di `e2e/cms.spec.ts` (login + flow); sebagian besar perlu uji manual karena E2E memakai akun admin.

### 4.1. Akses yang boleh

- [ ] Login → menu: Dashboard + semua konten + Promotions.
- [ ] CRUD konten & promotions (**tanpa publish**) — simpan sebagai `DRAFT`/`ACTIVE` sesuai permission.

### 4.2. Akses yang dilarang (harus diblokir)

- [ ] Menu **Audit Log**, **Users**, **Settings** tidak muncul di sidebar.
- [ ] Buka langsung `/admin/audit-log` → **403**.
- [ ] Buka langsung `/admin/users` → **403**.
- [ ] Buka langsung `/admin/settings/*` → **403**.
- [ ] API: `POST/PATCH/DELETE /api/admin/users/*`, `/api/admin/audit/*`, `/api/admin/settings/*` → **403**.

### 4.3. Publish dilarang

- [ ] UI: tombol/aksi **Publish** tidak tersedia untuk Editor.
- [ ] API: `PATCH /api/admin/rooms/:id` dengan `status: "PUBLISHED"` → **403** (karena `publish`).
- [ ] Promosi: set `status: "PUBLISHED"` → **403**; set `ACTIVE` (bukan publish) → diizinkan.

### 4.4. Kualitas konten

- [ ] Simpan draft → muncul di daftar admin dengan status DRAFT, tidak tampil di publik.
- [ ] Preview draft via `?preview=1` → tampil (dengan session editor).
- [ ] Edit & hapus konten milik bersama → audit log mencatat user editor.

---

## 5. Role: Viewer (buat manual)

> Otomatis: sebagian diuji di `e2e/cms.spec.ts` → "RBAC: user viewer tidak bisa POST API admin (403)".

### 5.1. Akses yang boleh

- [ ] Login → menu: **Dashboard** + **Bookings**.
- [ ] Melihat daftar booking & detail booking (read-only) — tombol Create/Check-in/Check-out/Cancel **tidak ada** / disabled.
- [ ] Buka halaman publik landing page tanpa hambatan.

### 5.2. Akses yang dilarang (harus diblokir)

- [ ] Sidebar **tidak menampilkan** menu konten, promotions, settings, users, audit-log.
- [ ] Buka langsung `/admin/rooms`, `/admin/gallery`, `/admin/promotions`, `/admin/settings/*`, `/admin/users`, `/admin/audit-log` → **403**/redirect.
- [ ] **Semua API tulis** → **403** (E2E menguji `POST /api/admin/rooms` → 403):
  - [ ] `POST/PATCH/DELETE /api/admin/rooms/*`
  - [ ] `POST/PATCH/DELETE /api/admin/bookings/*` (create & aksi transisi)
  - [ ] `POST /api/admin/upload` → **403**
  - [ ] `POST/PATCH /api/admin/users/*` → **403**
- [ ] `GET` API data CMS (rooms, dsb.) → **403** (bukan 200) karena viewer tidak punya permission `content`.

### 5.3. Read-only booking

- [ ] `GET /api/admin/bookings` & `/api/admin/bookings/:id` → **200** (read diperbolehkan via `requirePermissionWithRead`).
- [ ] `PATCH /api/admin/bookings/:id` (`CHECK_IN`) → **403** (mutation dilarang).

---

## 6. Test Otomatis yang Relevan per Role

### Unit & Component (Vitest) — `npm test` (29 file / 174 test)

| Area | File | Menguji untuk role |
|---|---|---|
| Validasi Zod | `src/lib/validators/*.test.ts` | Semua form admin (Admin/Marketing/Editor) |
| Transisi status booking | `src/lib/booking-status.test.ts` | Admin (on-site booking) |
| Audit diff | `src/lib/audit.test.ts` | Admin/Marketing (audit log) |
| Promosi & countdown | `src/lib/promotions.test.ts`, `src/lib/countdown.test.ts` | Admin/Marketing/Editor |
| Rate limit | `src/lib/rate-limit.test.ts` | Keamanan semua API admin |
| XSS | `src/lib/xss.test.tsx` | Keamanan konten semua role |
| Password & slug | `src/lib/password.test.ts`, `src/lib/slugify.test.ts` | Admin (users) & SEO |
| Booking state machine | `src/lib/booking-states.test.ts`, `src/lib/booking/url.test.ts` | Guest (widget) |
| Engine adapter | `src/lib/booking-engine/*.test.ts` | Guest (availability) & Admin (on-site) |
| Komponen landing | `src/components/landing/*.test.tsx` | Guest |
| Komponen UI & consent | `src/components/ui/button.test.tsx`, `src/components/analytics/consent.test.tsx` | Guest & semua admin |

### E2E (Playwright) — `npm run test:e2e` (20 test)

| Spec | Skenario | Role yang diuji |
|---|---|---|
| `e2e/landing.spec.ts` | hero, booking widget, URL shareable, room detail | Guest |
| `e2e/landing-mobile.spec.ts` | drawer, sticky bar, no overflow | Guest (mobile) |
| `e2e/cms.spec.ts` | login → dashboard, create promo ACTIVE, room lifecycle (draft→preview→publish→audit), **RBAC viewer 403**, on-site booking lifecycle (create→check-in→check-out→cancel, transisi invalid, audit) | Admin + Viewer |

---

## 7. Cara Menjalankan

### Jalankan semua test

```bash
npm test            # unit + component (174 test, ~7 detik)
npm run test:e2e    # E2E Playwright (butuh DB + .env; build prod + start otomatis)
```

### Jalankan subset spesifik

```bash
npx vitest run src/lib/validators          # hanya validators
npx vitest run src/lib/booking-status.test.ts
npx vitest run src/components/landing
npx playwright test e2e/landing.spec.ts    # E2E landing saja
npx playwright test e2e/cms.spec.ts         # E2E CMS saja
npx playwright test --grep "RBAC"          # test ber-label RBAC
```

### Jalankan test manual per role

1. `npm run dev` lalu buka `http://localhost:3000/admin`.
2. Login bergantian sesuai role (lihat tabel Ringkasan di atas).
3. Ikuti checklist per role (bagian 1–5) dan centang setiap item.
4. Untuk Marketing/Viewer, buat dulu user via Admin → Users (atau seed).

---

## 8. Catatan & Kiat

- **E2E memakai `ALLOW_MOCK_ENGINE=true`** hanya di CI — jangan pernah set di production rill (provider-guard `REL-001`).
- **Reset data test**: sebelum menjalankan ulang E2E, pastikan DB di-seed ulang (`npm run db:seed`) agar akun & room published tersedia.
- **Verifikasi header keamanan**: `curl -I http://localhost:3000` → CSP/HSTS (production) aktif (SEC-001).
- **Saat menemukan bug**: tulis repro langkah demi langkah + role yang dipakai, lalu tambahkan ke checklist — ini menjaga cakupan RBAC tetap teruji tiap rilis.
- **Dokumen terkait**: `doc/09-testing-release.md` (strategi test), `doc/qa-acceptance.md` (acceptance criteria PRD), `README.md` §6 (verifikasi akses per role).
