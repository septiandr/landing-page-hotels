# 10 — On-Site Booking (Walk-in Front Desk)

> Mapping PRD: §29–32 (Booking Engine), §30 (Booking Process), §36 (Roles), §44 (Conversion Funnel)
> **Fitur baru** — admin front desk membuat booking langsung di tempat untuk tamu walk-in, tercatat di CMS **dan di-sync ke Cloudbeds** via API `createReservation`.

## Konteks & Keputusan

- **Sumber kebenaran**: tabel `Booking` baru di DB CMS (data on-site + status front desk). Cloudbeds adalah PMS tujuan — reservasi dibuat di sana via `createReservation` dan `cloudbedsReservationId` disimpan.
- **Payment**: TIDAK diproses oleh CMS/landing page (PRD §30, §51). Admin menerima pembayaran di tempat; cukup catat **metode** (CASH/CARD/TRANSFER), **tanpa data kartu**.
- **Lifecycle status**: `CONFIRMED → CHECKED_IN → CHECKED_OUT`, plus `CANCELLED` (dan `NO_SHOW` untuk tamu tidak datang).
- **Anti-double-booking**: sebelum create, cek ketersediaan via engine (`checkAvailability`, BK-005); `createReservation` Cloudbeds adalah otoritas final — kalau gagal, **jangan simpan lokal** (return error ke admin).
- **RBAC**: permission baru `onsite_booking` — **khusus ADMIN** (front desk memakai akun admin yang jaga; role `FRONTDESK` terpisah bisa ditambah nanti). VIEWER read-only.
- **Mapping room**: form memilih `Room` (tipe kamar CMS); adapter memetakan `Room.id` → `cloudbeds room_id` via `lib/booking-engine/room-map.ts` (BK-004).

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| OSB-001 | Data model `Booking` + enum `BookingStatus` (Prisma + migration) | P0 | M |
| OSB-002 | `BookingEngineAdapter.createReservation` (Cloudbeds + Mock) | P0 | L |
| OSB-003 | API create walk-in booking (`POST /api/admin/bookings`) + sync Cloudbeds | P0 | L |
| OSB-004 | API list & search booking (`GET /api/admin/bookings`) | P0 | M |
| OSB-005 | API status transitions: check-in / check-out / cancel | P0 | M |
| OSB-006 | RBAC permission `onsite_booking` | P0 | S |
| OSB-007 | Zod validators booking | P0 | S |
| OSB-008 | Admin UI: daftar & pencarian booking | P0 | M |
| OSB-009 | Admin UI: form create walk-in booking | P0 | L |
| OSB-010 | Admin UI: detail + aksi (check-in/out/cancel) | P0 | M |
| OSB-011 | Audit log & analytics event on-site booking | P1 | S |

---

## OSB-001 — Data Model `Booking`

**P0 · M · DB**

Tambahkan di `prisma/schema.prisma`:

```prisma
enum BookingStatus {
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

model Booking {
  id                     String        @id @default(cuid())
  code                   String        @unique // nomor tampil: OB-{yyyyMMdd}-{seq}
  roomTypeId             String
  roomType               Room          @relation(fields: [roomTypeId], references: [id])
  checkIn                DateTime
  checkOut               DateTime
  nights                 Int
  adults                 Int           @default(1)
  kids                   Int           @default(0)
  guestName              String
  guestPhone             String
  guestEmail             String?
  guestIdNumber          String?       // KTP/paspor (opsional)
  pricePerNight          Decimal       @db.Decimal(12, 2)
  totalPrice             Decimal       @db.Decimal(12, 2)
  currency               String        @default("IDR")
  paymentMethod          String?       // CASH | CARD | TRANSFER — tanpa data kartu (PRD §51)
  cloudbedsReservationId String?       @unique // terisi setelah createReservation sukses
  source                 String        @default("ONSITE") // ONSITE | WEBHOOK
  status                 BookingStatus @default(CONFIRMED)
  cancellationReason     String?       @db.Text
  notes                  String?       @db.Text
  createdById            String
  createdBy              User          @relation(fields: [createdById], references: [id])
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  @@index([status, checkIn])
  @@index([guestName])
  @@index([checkIn, checkOut])
}
```

- Relasi di `Room`: tambah `bookings Booking[]`. Di `User`: tambah `bookings Booking[]`.
- `code` di-generate `lib/booking-code.ts`: `OB-${yyyyMMdd}-${padded counter}` (counter dari count booking hari itu + 1; retry saat konflik unique).
- Migration: `npx prisma migrate dev --name onsite_booking`.

**DoD:**
- [x] `Booking` ter-migrasi tanpa error; index di `status+checkIn`, `guestName`, `checkIn+checkOut`.
- [x] `cloudbedsReservationId` unique — tidak ada duplikasi reservasi Cloudbeds.

---

## OSB-002 — Adapter: `createReservation`

**P0 · L · Lib**

Perluas `lib/booking-engine/types.ts` + `index.ts` + implementasi `CloudbedsAdapter` & `MockAdapter`:

```ts
export interface CreateReservationRequest {
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;
  roomId: string;       // cloudbeds room_id (dipetakan dari Room.id via room-map.ts)
  adults: number;
  kids: number;
  guest: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
  };
  total?: number;       // totalPrice
}

export interface CreateReservationResult {
  reservationId: string;
  status: string;       // mis. "confirmed"
}

// di BookingEngineAdapter:
createReservation(req: CreateReservationRequest): Promise<CreateReservationResult>;
```

- **Cloudbeds**: `POST {base}/createReservation` — params `property_id`, `start_date`, `end_date`, `room_id`, guest data, `adults`, `children`, `total`. Pakai `cloudbedsFetch` yang sama (timeout 8s, retry 1x, `X-Api-Key`). Error → `CloudbedsApiError`.
- **Mock**: `{ reservationId: "MOCK-" + randomUUID(), status: "confirmed" }` — hanya dev/test.
- **Catatan verifikasi** (sama seperti BK-014): bentuk field request/response API v1 bisa beda antar versi — **verifikasi dengan API key live saat implementasi** (nama param guest, format `start_date`, dsb.).

**DoD:**
- [x] `createReservation` ada di interface + kedua adapter (TypeScript strict).
- [x] Cloudbeds error → `CloudbedsApiError` (bukan crash), dipetakan ke respon API di OSB-003.

---

## OSB-003 — API Create Walk-in Booking

**P0 · L · API**

`app/api/admin/bookings/route.ts` — `POST`, `requirePermission("onsite_booking")`.

**Alur (transaction):**
1. Validasi body (`createOnsiteBookingSchema`, OSB-007) → 400 bila invalid.
2. **Conflict check**: `engine.checkAvailability({ checkIn, checkOut, adults, kids, rooms: 1 })` → jika room yang dipilih tidak available untuk **semua malam**, return `409 { error: "ROOM_UNAVAILABLE" }`.
3. `engine.createReservation(...)` → dapat `reservationId`. **Gagal → jangan simpan lokal**, return `502 { error: "ENGINE_UNAVAILABLE" }` (admin lihat pesan error + CTA hubungi tim).
4. Simpan `Booking` (status `CONFIRMED`, `cloudbedsReservationId`, `code`, `nights`, `totalPrice`, `createdById` dari session) — `$transaction` dengan `audit()`.
5. Response `{ data: booking }`.

**Detail teknis:**
- `nights = getNights(checkIn, checkOut)`; `totalPrice = pricePerNight * nights`.
- `pricePerNight` default `room.priceFrom` (bisa diedit admin untuk walk-in rate / negosiasi).
- Track event `onsite_booking_created` (OSB-011).

**DoD:**
- [x] Walk-in create → booking tersimpan lokal + tercatat di Cloudbeds (test sandbox).
- [x] Room unavailable di salah satu malam → 409, tidak ada record dibuat.
- [x] Engine down → 502, tidak ada record lokal yang setengah jadi.

---

## OSB-004 — API List & Search Booking

**P0 · M · API**

`GET /api/admin/bookings` — `requirePermission("onsite_booking")`.

**Query params:**
- `?status=` (CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED/NO_SHOW, multi opsional).
- `?date=` (tanggal check-in, filter "booking hari ini") / `?from=&to=` (rentang check-in).
- `?q=` (search nama tamu / no. HP / `code`).
- `?page=&limit=` (default 20, max 100).

**Response:** `{ data: { items: Booking[], pagination: { total, page, limit } } }` — `include: { roomType: { select: { name, slug } } }`, urut `checkIn DESC`. VIEWER hanya bisa GET (read-only, lihat OSB-006).

**DoD:**
- [x] Search + filter status + pagination bekerja (test curl / Playwright).
- [x] VIEWER bisa lihat list tapi semua mutation 403.

---

## OSB-005 — API Status Transitions (Check-in / Check-out / Cancel)

**P0 · M · API**

`PATCH /api/admin/bookings/[id]` — `requirePermission("onsite_booking")`.

```ts
type StatusAction = "CHECK_IN" | "CHECK_OUT" | "CANCEL" | "NO_SHOW";
// body: { action, cancellationReason? }
```

**Valid transition guard (`lib/booking-status.ts`):**
| From | CHECK_IN | CHECK_OUT | CANCEL | NO_SHOW |
|---|---|---|---|---|
| CONFIRMED | ✅ | ❌ | ✅ | ✅ |
| CHECKED_IN | ❌ | ✅ | ✅ (tidak masuk) | ❌ |
| CHECKED_OUT / CANCELLED / NO_SHOW | terminal — tanpa aksi |

- **CANCEL/NO_SHOW**: `cancellationReason` wajib untuk CANCEL. Update `status`, simpan alasan, `audit()`.
- **Cancel di Cloudbeds**: endpoint cancel API (mis. `updateReservation`/cancel) **belum tersedia di adapter** — cukup status lokal (didokumentasikan); `cloudbedsReservationId` dipertahankan. Idempoten: booking yang sudah CANCELLED tidak bisa di-cancel ulang.

**DoD:**
- [x] Semua transisi valid berhasil; transisi invalid → `409 { error: "INVALID_TRANSITION" }`.
- [x] CANCEL mencatat alasan di audit log (`previous → next` status).

---

## OSB-006 — RBAC Permission `onsite_booking`

**P0 · S · Auth**

`lib/rbac.ts`:

```ts
export const PERMISSIONS = {
  content:        ["ADMIN", "MARKETING", "EDITOR"],
  promotion:      ["ADMIN", "MARKETING", "EDITOR"],
  publish:        ["ADMIN", "MARKETING"],
  analytics:      ["ADMIN", "MARKETING"],
  settings:       ["ADMIN"],
  users:          ["ADMIN"],
  onsite_booking: ["ADMIN"],          // khusus admin front desk; VIEWER read-only via requirePermissionWithRead
} as const;
```

- Helper `requirePermissionWithRead(action)` untuk GET: VIEWER boleh GET, mutation tolak 403.
- Sidebar admin (CMS-U-001) menampilkan nav "Bookings" sesuai `can(role, "onsite_booking") || role === "VIEWER"`.

**DoD:**
- [x] Hanya ADMIN yang bisa create/check-in/cancel; EDITOR & MARKETING tanpa akses booking; VIEWER hanya baca.
- [x] Test RBAC (extend e2e `cms` scenario).

---

## OSB-007 — Zod Validators Booking

**P0 · S · Lib**

`lib/validators/booking.ts` (extend yang sudah ada untuk widget) atau file baru `onsite-booking.ts`:

```ts
export const createOnsiteBookingSchema = z.strictObject({
  roomTypeId: z.string().min(1, "Pilih tipe kamar"),
  checkIn:    z.dateString(),
  checkOut:   z.dateString(),
  adults:     z.number().int().min(1),
  kids:       z.number().int().min(0).default(0),
  guestName:  z.string().min(1, "Nama tamu wajib diisi"),
  guestPhone: z.string().min(8, "Nomor HP tidak valid"),
  guestEmail: z.email().optional(),
  guestIdNumber: z.string().optional(),
  pricePerNight: z.number().positive(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).optional(),
  notes:      z.string().optional(),
});
export const bookingStatusActionSchema = z.enum(["CHECK_IN", "CHECK_OUT", "CANCEL", "NO_SHOW"]);
```

- Check-out **>** check-in (min 1 malam) — pakai `getNights` validation.
- `.strict()` reject field tak dikenal; pesan error Bahasa Indonesia.

**DoD:**
- [x] Tidak ada `z.any()`; validasi tanggal/guests/phone konsisten di API & form admin.

---

## OSB-008 — Admin UI: Daftar & Pencarian Booking

**P0 · M · UI**

`app/(admin)/admin/bookings/page.tsx` (+ `components/admin/booking-list.tsx`, client):

- Tabel: `code`, tamu (`guestName` + phone), tipe kamar, `checkIn → checkOut`, nights, `totalPrice` (format currency), `StatusBadge` (CONFIRMED/CHECKED_IN/CHECKED_OUT/CANCELLED/NO_SHOW).
- Filter: status chips, date picker "hari ini / rentang", search box (nama/HP/code), pagination.
- CTA tombol `+ New Booking` (ke OSB-009); baris klik → detail (OSB-010).
- Loading skeleton + error inline (CMS-U-013).
- Quick section "Booking hari ini" (status CONFIRMED/CHECKED_IN dengan checkIn hari ini) di dashboard (CMS-U-003) — opsional.

**DoD:**
- [x] Front desk menemukan booking tamu < 5 detik (search nama/HP/code).
- [x] Responsif 375px & 1440px.

---

## OSB-009 — Admin UI: Form Create Walk-in Booking

**P0 · L · UI**

`app/(admin)/admin/bookings/new/page.tsx` — React Hook Form + Zod resolver (OSB-007):

- **Room** (select dari room PUBLISHED + harga `priceFrom`), **check-in/out** (date picker), **adults/kids** stepper, **harga per malam** (editable, default `priceFrom`), **paymentMethod** select, **data tamu** (nama, HP, email opsional, ID opsional), **notes**.
- Preview ringkas: nights + `totalPrice` dihitung live (`getNights`).
- Submit → `POST /api/admin/bookings` → loading → sukses redirect ke detail (OSB-010); `409 ROOM_UNAVAILABLE` → pesan "Kamar tidak tersedia di tanggal tersebut"; `502 ENGINE_UNAVAILABLE` → fallback hubungi tim (BK-007 pattern).
- Field `checkOut` min = `checkIn + 1` (disable tanggal invalid di picker).

**DoD:**
- [x] Flow: pilih room → isi tamu → submit → booking CONFIRMED + tercatat di Cloudbeds (sandbox).
- [x] Total price live-update; error per-field Bahasa Indonesia.

---

## OSB-010 — Admin UI: Detail Booking + Aksi

**P0 · M · UI**

`app/(admin)/admin/bookings/[id]/page.tsx` (+ `components/admin/booking-detail.tsx`, client):

- Ringkasan: semua field booking + `StatusBadge` + `code` (copyable) + metode pembayaran + `cloudbedsReservationId`.
- Aksi sesuai status (guard dari OSB-005, tombol disabled untuk transisi invalid):
  - CONFIRMED → `CHECK IN` (primary), `CANCEL` (danger + ConfirmDialog + wajib alasan), `NO SHOW`.
  - CHECKED_IN → `CHECK OUT` (primary), `CANCEL` (danger, alasan wajib).
  - Terminal → tombol disabled + label "Selesai".
- Optimistic update status badge tanpa reload (CMS-U-009 pattern); audit history aksi terlihat.

**DoD:**
- [x] Check-in → check-out walk-through berhasil; badge update tanpa reload.
- [x] Cancel wajib alasan; confirm dialog sebelum aksi destruktif.

---

## OSB-011 — Audit Log & Analytics Event

**P1 · S · Logging/Analytics**

- `audit()` di semua mutation: `entity: "Booking"`, action `CREATE | UPDATE | CHECK_IN | CHECK_OUT | CANCEL` (extend `lib/audit.ts` action union + `lib/crud` enum bila perlu) — tampil di CMS-U-010.
- Analytics: event typed baru di `lib/analytics.ts` (ANA-003 style) — `onsite_booking_created`, `onsite_booking_cancelled`. Bedakan dari funnel online (`booking_started`/`booking_completed`) — on-site bukan konversi website, jangan masuk GA4 funnel utama (atau masuk sebagai event sekunder terpisah).

**DoD:**
- [x] Aksi check-in/cancel tercatat di audit log (userId + timestamp).
- [x] Event on-site ter-track dengan `event_id` unik, tidak tercampur funnel online.