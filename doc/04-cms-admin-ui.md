# 04 — CMS Admin UI

> Mapping PRD: §33–37 (CMS), §61 (Operational — target < 5 menit update), §36 (User Roles)

Admin panel di route group `(admin)` di bawah `/admin`. Semua halaman server-rendered, form pakai **React Hook Form + Zod resolver** (schema dari DATA-005).

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| CMS-U-001 | Admin layout + sidebar + shell | P0 | M |
| CMS-U-002 | Login page | P0 | S |
| CMS-U-003 | Dashboard (ringkasan + quick actions) | P1 | M |
| CMS-U-004 | Rooms CRUD page + form + image picker | P0 | L |
| CMS-U-005 | Gallery manager (grid + drag-drop reorder) | P0 | L |
| CMS-U-006 | Promotions CRUD + status chip | P0 | M |
| CMS-U-007 | Testimonials, Experiences, Attractions, FAQ, Amenities CRUD | P0 | L |
| CMS-U-008 | Hotel profile & SEO settings form | P0 | M |
| CMS-U-009 | Publish toolbar (draft/preview/publish) | P0 | M |
| CMS-U-010 | Audit log viewer | P1 | M |
| CMS-U-011 | User management page (admin) | P1 | S |
| CMS-U-012 | Preview mode (lihat landing page dengan draft) | P1 | M |
| CMS-U-013 | Feedback UX (toast, loading, error inline) | P0 | M |

---

## CMS-U-001 — Admin Layout & Shell

**P0 · M · UI**

**Detail teknis:**
- `app/(admin)/layout.tsx`: sidebar (logo, nav: Dashboard, Rooms, Gallery, Promotions, Reviews, Experiences, Attractions, FAQ, Amenities, Hotel Profile, SEO, Users, Audit Log) + topbar (user info, role badge, logout).
- Nav items di-filter oleh RBAC (MARKETING tidak lihat "Users", VIEWER tidak lihat tombol publish).
- Responsive: sidebar jadi drawer di mobile.
- Gunakan `components/admin/` untuk reusable (DataTable, FormField, ImageUploader, StatusBadge, ConfirmDialog).

**DoD:**
- [ ] Nav sesuai role (login sebagai editor vs admin berbeda tampilannya).
- [ ] Layout responsif di 375px & 1440px.

---

## CMS-U-002 — Login Page

**P0 · S · UI**

`app/(admin)/login/page.tsx`:

- Form email + password, validasi client (Zod).
- Submit → `signIn("credentials")` → redirect ke `/admin/dashboard`.
- Error state: "Email atau password salah".
- Loading state pada tombol.
- Branding hotel di sisi kiri (2-col layout desktop).

**DoD:**
- [ ] Login sukses → dashboard; gagal → pesan error.
- [ ] Sudah login → akses `/admin/login` redirect ke dashboard.

---

## CMS-U-003 — Dashboard

**P1 · M · UI**

**Detail teknis:**
- Stat card: total rooms (published), active promotions, gallery items, testimonials.
- Quick actions: "Edit Promotion Aktif", "Tambah Room", "Upload ke Gallery".
- List "Promotion akan segera berakhir" (deadline dalam 3 hari) — nilai urgensi.
- Content status summary: draft vs published per module.

**DoD:**
- [ ] Angka dashboard sesuai data DB (query server, bukan fetch client).

---

## CMS-U-004 — Rooms CRUD Page

**P0 · L · UI**

`/admin/rooms` (list + search + filter status) & `/admin/rooms/new`, `/admin/rooms/[id]`.

**Detail teknis:**
- Form field: name, slug (auto dari name, editable), description (textarea), size, occupancy, bedType, bedCount, view, priceFrom, currency, breakfast toggle, photos (ImageUploader multi), amenities (chips multi-select dari daftar room amenities), status, sortOrder.
- Image picker: upload → crop/urutan drag.
- Save → POST/PATCH → toast sukses/gagal → redirect ke list.
- Confirm dialog untuk delete.

**DoD:**
- [ ] Flow "buat room dengan 3 foto + 2 amenity → publish → lihat di landing page" jalan < 5 menit.

---

## CMS-U-005 — Gallery Manager

**P0 · L · UI**

`/admin/gallery`:

- Grid upload dengan drag-drop (pakai `react-dropzone`).
- Filter kategori per item (ALL/ROOMS/FACILITIES/DINING/EXTERIOR/SURROUNDINGS).
- Reorder via drag (pakai `@dnd-kit/core` + `sortable`) → PATCH batch.
- Edit alt text & caption inline.
- Status publish per item.

**DoD:**
- [ ] Drag item → urutan tersimpan → landing page gallery ikut urutan baru.

---

## CMS-U-006 — Promotions CRUD

**P0 · M · UI**

`/admin/promotions`:

- Card/list dengan StatusBadge (DRAFT/SCHEDULED/ACTIVE/EXPIRED) + countdown jika `showCountdown`.
- Form: title, description, image, discountLabel, promoCode, bookingStart/End, stayStart/End, terms, ctaLabel, showCountdown, status.
- Action: Preview, Publish, Unpublish, Archive (sesuai permission `publish`).
- Warning visual jika promotion tanpa deadline tapi `showCountdown` true (PRD §19 — countdown wajib deadline nyata).

**DoD:**
- [ ] Workflow PRD §61: login → promotions → edit → upload image → set date → preview → publish, semua tanpa developer.

---

## CMS-U-007 — CRUD Module Standar (Testimonials, Experiences, Attractions, FAQ, Amenities)

**P0 · L · UI**

**Detail teknis:**
- Buat **satu generic CRUD page component** (`components/admin/GenericCrud.tsx`) yang dikonfigurasi per module:

```tsx
const config = {
  fields: [
    { name: "guestName", label: "Nama", type: "text", required: true },
    { name: "rating", label: "Rating", type: "number", min: 1, max: 5 },
    { name: "review", label: "Review", type: "textarea" },
  ],
  apiPath: "/api/admin/testimonials",
  columns: [...],
};
```

- Mendukung: text, textarea, number, select (enum), date, datetime, image, checkbox, sortable.
- Reduksi duplikasi besar-besaran — 5 module dari satu komponen.

**DoD:**
- [ ] Testimonials, Experiences, Attractions, FAQ, Amenities semuanya memakai GenericCrud.
- [ ] FAQ punya sort order & kategori; Attractions punya distance & travelTime.

---

## CMS-U-008 — Hotel Profile & SEO

**P0 · M · UI**

`/admin/settings/hotel` & `/admin/settings/seo`:

- Hotel: name, logo upload, tagline, description, story, address, phone, email, whatsapp, socialLinks, lat/lng, checkIn/checkOut time, currency.
- SEO: metaTitle (counter 60), metaDescription (counter 160), ogTitle, ogDescription, ogImage, canonicalUrl.
- Tampilkan Google preview (title + URL + description) live.

**DoD:**
- [ ] Edit SEO → metadata di landing page berubah setelah revalidate.

---

## CMS-U-009 — Publish Toolbar

**P0 · M · UI**

- Komponen sticky di halaman detail entity: [Status badge] [Preview] [Publish / Unpublish].
- Publish → confirm → audit log tercatat.
- Preview → buka landing page dengan draft content (CMS-U-012).

**DoD:**
- [ ] Publish & unpublish langsung dari halaman detail; status badge update tanpa reload (optimistic).

---

## CMS-U-010 — Audit Log Viewer

**P1 · M · UI**

`/admin/audit-log`:

- Tabel: waktu, user, action, entity, ringkasan perubahan.
- Untuk UPDATE: tampilkan diff "From → To" (mis. price `$120` → `$110`), sesuai contoh PRD §37.
- Filter: entity, user, action, date range.
- Pagination.

**DoD:**
- [ ] Diff value ditampilkan untuk perubahan scalar field.

---

## CMS-U-011 — User Management

**P1 · S · UI**

`/admin/users` (ADMIN only):

- Tabel user + role, buat user, edit role, activate/deactivate, reset password.
- Konfirmasi untuk aksi destruktif.

**DoD:**
- [ ] Admin membuat user editor → editor bisa login dengan permission terbatas.

---

## CMS-U-012 — Preview Mode

**P1 · M · UI**

**Detail teknis:**
- Draft content ditampilkan di landing page hanya lewat query param `?preview=1` + session valid.
- Implementasi: halaman publik mengecek `searchParams.preview === "1"` → jika ya & user punya permission `content`, query **tanpa filter status** (tampilkan draft).
- Link preview dari toolbar CMS-U-009 membuka tab baru dengan param tersebut.

**DoD:**
- [ ] Draft room terlihat di preview, tidak terlihat di halaman normal.

---

## CMS-U-013 — Feedback UX

**P0 · M · UI**

**Detail teknis:**
- Toast system (`components/ui/toast.tsx`): sukses/gagal setelah save.
- Error inline di form dari Zod error map (per-field).
- Loading state: skeleton untuk list, spinner pada tombol submit.
- Konfirmasi destructive action.

**DoD:**
- [ ] Semua aksi mutation memberi feedback jelas (sukses/gagal) + tidak ada aksi yang terasa "hang".
