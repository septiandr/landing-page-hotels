# 03 — CMS Backend (Auth, RBAC, API, Audit Log, Upload)

> Mapping PRD: §33–37 (CMS), §51 (Security), §61 (Operational), §64 (Error Pages)

Semua API di bawah route `/api/admin/*` dan **wajib dilindungi** oleh auth + RBAC. Content API publik (dibaca landing page) ada di task LP-* (server components langsung query DB, bukan API terpisah).

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| CMS-B-001 | Auth setup (Auth.js v5, Credentials, JWT) | P0 | M |
| CMS-B-002 | RBAC guard + permission helper | P0 | M |
| CMS-B-003 | CRUD Rooms API | P0 | M |
| CMS-B-004 | CRUD Gallery & Amenities API | P0 | M |
| CMS-B-005 | CRUD Promotion, Testimonial, Experience, Attraction, FAQ API | P0 | L |
| CMS-B-006 | Hotel profile & SEO API | P0 | S |
| CMS-B-007 | Audit log wrapper | P0 | M |
| CMS-B-008 | Upload image API (resize + optimize) | P0 | M |
| CMS-B-009 | Publishing workflow (draft/publish/schedule) | P0 | M |
| CMS-B-010 | Cache invalidation (revalidate) | P0 | S |
| CMS-B-011 | User management API (admin only) | P1 | M |
| CMS-B-012 | Rate limiting & security headers | P1 | M |

---

## CMS-B-001 — Auth Setup

**P0 · M · Auth**

**Detail teknis:**
- Auth.js v5 (`next-auth@beta`) dengan **Credentials provider** (email + password).
- `lib/auth.ts`:

```ts
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({ ... })],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) { /* embed role + id ke token */ },
    session({ session, token }) { session.user.role = token.role; }
  }
});
```

- `app/api/auth/[...nextauth]/route.ts` → export `handlers`.
- `middleware.ts` → protect `/(admin)` route group, redirect ke `/admin/login` kalau tidak ada session.
- `lib/password.ts` → `hashPassword` (bcryptjs, cost 10+) & `verifyPassword`.
- Login gagal → error message generik (jangan bocorkan user ada/tidak).

**DoD:**
- [ ] Login/logout jalan; session JWT berisi `role`.
- [ ] `/admin/*` tidak bisa diakses tanpa login (redirect).
- [ ] Password ter-hash, tidak pernah di-log.

---

## CMS-B-002 — RBAC Guard

**P0 · M · Auth**

**Detail teknis:**
- `lib/rbac.ts` — permission matrix dari PRD §36:

```ts
export const PERMISSIONS = {
  content:  ["ADMIN", "MARKETING", "EDITOR"],
  promotion:["ADMIN", "MARKETING", "EDITOR"],
  publish:  ["ADMIN", "MARKETING"],
  analytics:["ADMIN", "MARKETING"],
  settings: ["ADMIN"],
  users:    ["ADMIN"],
} as const;
```

- `requirePermission(action)` helper untuk dipakai di setiap route handler:

```ts
// lib/require.ts
export async function requirePermission(action: Permission) {
  const session = await auth();
  if (!session) throw new ApiError(401, "Unauthorized");
  if (!PERMISSIONS[action].includes(session.user.role))
    throw new ApiError(403, "Forbidden");
  return session;
}
```

- VIEWER: read-only — semua mutation endpoint tolak akses.
- `ApiError` → dikonversi ke `NextResponse.json` di wrapper `handleApi` (try/catch seragam).

**DoD:**
- [ ] Setiap handler CMS dimulai dengan `requirePermission(...)`.
- [ ] VIEWER mendapat 403 di semua mutation.

---

## CMS-B-003 — CRUD Rooms API

**P0 · M · API**

Route: `app/api/admin/rooms/route.ts` (GET list, POST) + `app/api/admin/rooms/[id]/route.ts` (GET, PATCH, DELETE).

**Detail teknis:**
- GET list: pagination (`?page=&limit=`), search nama, filter status.
- POST/PATCH: validasi `createRoomSchema/updateRoomSchema` (DATA-005) → upsert.
- Slug auto-generate dari nama; `z.string().regex(/^[a-z0-9-]+$/)` — konflik slug → tambah suffix.
- Photos & amenities dikirim sebagai array relasi (nested create/update) — tangani via transaction (`$transaction`).
- Semua mutation → `audit()` (CMS-B-007) + `revalidateContent("rooms")`.
- DELETE: soft-delete atau hard-delete? **Hard-delete** untuk MVP, tapi pastikan cascade (DATA-002).

**DoD:**
- [ ] CRUD lengkap + response Zod-validated.
- [ ] Test manual via curl / Postman: create room dengan 3 photos & 2 amenities.

---

## CMS-B-004 — CRUD Gallery & Amenities API

**P0 · M · API**

`/api/admin/gallery` & `/api/admin/amenities` (+ `[id]`).

**Detail teknis:**
- Gallery: filter kategori (`?category=`), reorder via `sortOrder` (drag-drop di UI → PATCH batch `{ items: [{id, sortOrder}] }`).
- Amenities: CRUD + grouping HOTEL/ROOM.
- Image path disimpan relatif (`/uploads/...`), bukan URL absolut — agar gampang dipindah ke CDN nanti.

**DoD:**
- [ ] Reorder batch endpoint bekerja.
- [ ] Validasi kategori gallery sesuai enum PRD §16.

---

## CMS-B-005 — CRUD Promotion, Testimonial, Experience, Attraction, FAQ

**P0 · L · API**

Lima module CRUD dengan pola identik: `/api/admin/{module}` + `[id]`.

**Detail teknis:**
- Buat **factory helper** untuk mengurangi duplikasi (pola CRUD seragam):

```ts
// lib/crud-factory.ts
export function createCrudHandlers<T>(opts: {
  model: PrismaModel;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
  permission: Permission;
  entityName: string;
  cacheTag: string;
  include?: PrismaInclude;
}) { /* return { list, create, update, remove } */ }
```

- Promotion: endpoint tambahan `POST /api/admin/promotions/:id/publish` & `unpublish` (CMS-B-009).
- FAQ: sort order drag-drop.
- Response selalu `{ data }` (sukses) atau `{ error: { message, fields } }` (400/403/404/500) — format error konsisten dipakai client.

**DoD:**
- [ ] 5 module CRUD selesai dengan factory (hampir tanpa duplikasi).
- [ ] Format error konsisten di semua module.

---

## CMS-B-006 — Hotel Profile & SEO API

**P0 · S · API**

`/api/admin/hotel` (GET, PATCH) & `/api/admin/hotel/seo` (GET, PATCH).

**Detail teknis:**
- Hotel = singleton: selalu ada 1 record (seed). PATCH partial.
- SEO meta: validasi `seoSchema` — batasi panjang title (60 char) & description (160 char) dengan pesan error.
- Perubahan hotel → `revalidatePath("/", "layout")` (semua halaman publik).

**DoD:**
- [ ] Edit profil + SEO tersimpan dan halaman publik ikut berubah (dengan revalidate).

---

## CMS-B-007 — Audit Log

**P0 · M · Logging**

**Detail teknis:**
- `lib/audit.ts`:

```ts
export async function audit(ctx: {
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "LOGIN";
  entity: string; entityId?: string;
  previous?: unknown; next?: unknown;
}) { /* insert AuditLog + userId dari session */ }
```

- Untuk UPDATE: simpan **diff** — `previous` dan `next` JSON hanya field yang berubah (bandingkan record lama vs baru) — sehingga UI bisa tampilkan "From $120 → To $110" (PRD §37).
- Dipanggil di semua mutation (via factory CMS-B-005 + endpoint khusus).
- `LOGIN` & `LOGIN_FAILED` dicatat juga (security).

**DoD:**
- [ ] Update harga room → audit log berisi before/after.
- [ ] Halaman viewer audit (CMS-U-010) bisa membaca data ini.

---

## CMS-B-008 — Upload Image API

**P0 · M · Upload**

`POST /api/admin/upload` (multipart) — require `content` permission.

**Detail teknis:**
- Validasi: tipe `image/jpeg|webp|png`, max size 5MB, mime dicek dari buffer (jangan percaya header saja — cek magic bytes).
- Pakai `sharp` untuk: generate 3 ukuran (`original`, `lg` 1600w, `thumb` 400w) + konversi ke WebP/AVIF.
- Simpan di `public/uploads/` (MVP) via interface `StorageProvider` (`lib/storage.ts`) agar bisa ganti ke S3 nanti.
- Response: `{ data: { url, thumbUrl, width, height, alt } }`.
- Nama file: `crypto.randomUUID()` — jangan pakai nama user (path traversal & collision).

**DoD:**
- [ ] Upload PNG → tersimpan sebagai WebP (ukuran turun signifikan).
- [ ] File non-image / >5MB ditolak dengan pesan jelas.

---

## CMS-B-009 — Publishing Workflow

**P0 · M · Workflow**

**Detail teknis:**
- `lib/publish.ts`:

```ts
export async function publish(entity: "Room" | "Promotion" | "GalleryItem" | ..., id: string)
export async function unpublish(entity, id)
export async function schedulePublish(entity, id, at: Date) // simpan di field scheduledAt (tambah kolom jika perlu)
```

- Status: `DRAFT → PUBLISHED → ARCHIVED` (PRD §35).
- **Scheduled publish** via Vercel Cron (`vercel.json` → cron harian) yang menjalankan `lib/cron.ts`: publish yang `scheduledAt <= now`, expire promotion yang lewat `bookingEnd`.
- Semua transisi → audit log + revalidate.

**DoD:**
- [ ] Promotion `SCHEDULED` otomatis `ACTIVE` saat cron jalan.
- [ ] Promotion lewat `bookingEnd` otomatis `EXPIRED` & hilang dari landing page.

---

## CMS-B-010 — Cache Invalidation

**P0 · S · Caching**

**Detail teknis:**
- Semua halaman publik memakai `fetch` dengan `next: { tags }` atau `revalidatePath` di server action/handler.
- Tag per entity: `rooms`, `promotions`, `gallery`, `hotel`, `faq`, `reviews`.
- `lib/revalidate.ts`:

```ts
export function revalidateContent(tags: string[]) {
  tags.forEach((t) => revalidateTag(t));
}
```

- Dipanggil otomatis dari factory CRUD (CMS-B-005) & publish (CMS-B-009).

**DoD:**
- [ ] Publish promo → landing page tampil tanpa redeploy (ISR refresh < 1 menit).

---

## CMS-B-011 — User Management API

**P1 · M · API**

`/api/admin/users` (ADMIN only).

**Detail teknis:**
- CRUD user: name, email, role, isActive.
- Reset password: admin set password baru (hash ulang) — user ganti sendiri di phase 2.
- Nonaktifkan user → session lama langsung invalid (cek `isActive` di callback jwt/session).

**DoD:**
- [ ] Admin bisa buat user Marketing & Editor.
- [ ] User nonaktif tidak bisa akses admin.

---

## CMS-B-012 — Rate Limiting & Security

**P1 · M · Security**

**Detail teknis:**
- Login endpoint: rate limit 5 percobaan / 15 menit per IP/email (in-memory Map cukup untuk MVP single-instance; upgrade ke Upstash Redis jika multi-instance).
- Upload: limit per user (mis. 100 request / jam).
- Security headers via `next.config.ts` (lihat SEC-001 di doc 08).
- CSRF: Auth.js credentials sudah protected; pastikan semua mutation hanya menerima JSON dengan `Content-Type: application/json` (dan Origin check untuk safety).

**DoD:**
- [ ] 6x login gagal → 429 dengan pesan "terlalu banyak percobaan".
- [ ] Header security terpasang (test via curl/securityheaders.com).
