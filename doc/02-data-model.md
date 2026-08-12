# 02 — Data Model (Prisma Schema)

> Mapping PRD: §33–38 (CMS), §68 (CMS Data Architecture), §59 (Booking Policies), §13 (Room Data)

Semua entity CMS. Model ditulis untuk **Prisma + PostgreSQL**. Field bernama `camelCase` mengikuti konvensi Prisma.

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| DATA-001 | Schema: Hotel, Settings, SEO | P0 | M |
| DATA-002 | Schema: Room, Amenity, Gallery | P0 | M |
| DATA-003 | Schema: Promotion, Testimonial, Review, Experience | P0 | M |
| DATA-004 | Schema: Attraction, FAQ, User, Role, AuditLog | P0 | M |
| DATA-005 | Zod validators (source of truth shared) | P0 | M |
| DATA-006 | Seed script (data demo hotel Yogyakarta) | P0 | M |
| DATA-007 | Migrations & generate client | P0 | S |

---

## DATA-001 — Hotel, Settings, SEO

**P0 · M · DB**

```prisma
enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Hotel {
  id            String   @id @default(cuid())
  name          String
  logo          String?                    // path ke file upload
  tagline       String?
  description   String?   @db.Text
  story         String?   @db.Text         // §11 Hotel Introduction
  address       String
  phone         String
  email         String
  whatsapp      String                     // format 62xxx
  socialLinks   Json?                      // { instagram, facebook, tiktok }
  lat           Float?
  lng           Float?
  checkInTime   String   @default("14:00") // §59 policies
  checkOutTime  String   @default("12:00")
  currency      String   @default("IDR")   // §58
  seo           SeoMeta?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model SeoMeta {
  id            String  @id @default(cuid())
  hotelId       String  @unique
  hotel         Hotel   @relation(fields: [hotelId], references: [id])
  metaTitle     String?
  metaDescription String?
  ogTitle       String?
  ogDescription String?
  ogImage       String?
  canonicalUrl  String?
}
```

**DoD:**
- [ ] Model ter-migrasi tanpa error.
- [ ] Validasi format WhatsApp & email di Zod schema.

---

## DATA-002 — Room, Amenity, Gallery

**P0 · M · DB**

```prisma
model Room {
  id            String   @id @default(cuid())
  slug          String   @unique           // untuk /rooms/[slug] §14
  name          String
  description   String?  @db.Text
  sizeM2        Int?                        // §13 room size
  maxOccupancy  Int?
  bedType       String?                     // "King", "Twin", "Queen", ...
  bedCount      Int?     @default(1)
  view          String?
  priceFrom     Decimal  @db.Decimal(12, 2) // fallback display; harga asli dari engine
  currency      String   @default("IDR")
  breakfastIncluded Boolean @default(false)
  status        ContentStatus @default(DRAFT)
  amenities     RoomAmenity[]
  photos        RoomPhoto[]
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model RoomPhoto {
  id       String @id @default(cuid())
  roomId   String
  room     Room   @relation(fields: [roomId], references: [id], onDelete: Cascade)
  url      String
  altText  String
  sortOrder Int   @default(0)
}

model RoomAmenity {
  id      String @id @default(cuid())
  roomId  String
  room    Room   @relation(fields: [roomId], references: [id], onDelete: Cascade)
  name    String
  icon    String? // nama ikon lucide, mis. "Wifi"
}

model Amenity {
  id          String   @id @default(cuid())
  name        String
  icon        String?
  description String?
  image       String?
  group       String   @default("HOTEL") // HOTEL | ROOM — §15 grouping
  sortOrder   Int      @default(0)
}

model GalleryItem {
  id         String   @id @default(cuid())
  image      String
  thumb      String?            // versi optimized
  altText    String
  caption    String?
  category   String   @default("ALL") // ALL|ROOMS|FACILITIES|DINING|EXTERIOR|SURROUNDINGS §16
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
}
```

**DoD:**
- [ ] Cascade delete: hapus Room → photos & amenities ikut terhapus.
- [ ] Slug unik, di-generate dari nama (pakai util `slugify` di FOUND-007).

---

## DATA-003 — Promotion, Testimonial, Review, Experience

**P0 · M · DB**

```prisma
enum PromotionStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  EXPIRED
}

model Promotion {
  id            String   @id @default(cuid())
  title         String
  description   String?  @db.Text
  image         String?
  discountLabel String?  // "15% OFF", "3+1"
  promoCode     String?
  bookingStart  DateTime? // §18 booking period
  bookingEnd    DateTime?
  stayStart     DateTime?
  stayEnd       DateTime?
  terms         String?  @db.Text
  ctaLabel      String?  @default("Book Now")
  status        PromotionStatus @default(DRAFT)
  showCountdown Boolean  @default(false) // §19 urgency — hanya jika deadline nyata
  sortOrder     Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Testimonial {
  id        String  @id @default(cuid())
  guestName String
  country   String?
  rating    Int     @default(5) // 1..5
  review    String  @db.Text
  source    String? // Google | TripAdvisor | Booking.com | Agoda §20
  publishedAt DateTime? @db.Timestamp()
  status    ContentStatus @default(DRAFT)
}

model Review {
  id       String  @id @default(cuid())
  source   String
  rating   Decimal @db.Decimal(3, 2) // aggregate 4.8
  count    Int
  url      String?
  updatedAt DateTime @updatedAt
}

model Experience {
  id          String  @id @default(cuid())
  title       String
  description String? @db.Text
  image       String?
  duration    String? // "2 hours", "Full day"
  priceFrom   Decimal? @db.Decimal(12, 2)
  ctaLabel    String? @default("Book")
  ctaUrl      String? // link ke engine/WhatsApp
  status      ContentStatus @default(DRAFT)
  sortOrder   Int     @default(0)
}
```

**Detail teknis:**
- Promotion status dihitung dari `bookingStart/bookingEnd` vs `now()` saat query (jangan andalkan field status saja — hindari stale). `SCHEDULED` → `ACTIVE` otomatis di query layer.
- Testimonial & Experience pakai `ContentStatus` yang sama.

**DoD:**
- [ ] Query "promotion aktif" memakai logika waktu (helper `lib/promotions.ts`).

---

## DATA-004 — Attraction, FAQ, User, Role, AuditLog

**P0 · M · DB**

```prisma
model Attraction {
  id          String  @id @default(cuid())
  name        String
  description String? @db.Text
  category    String? // "Cultural", "Nature", "Shopping", ...
  distanceKm  Float?
  travelTimeMin Int?
  image       String?
  lat         Float?
  lng         Float?
  sortOrder   Int     @default(0)
}

model FaqItem {
  id        String @id @default(cuid())
  question  String
  answer    String @db.Text
  category  String @default("BOOKING") // BOOKING|HOTEL|FACILITIES|FAMILY §26
  sortOrder Int    @default(0)
}

enum Role {
  ADMIN
  MARKETING
  EDITOR
  VIEWER
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String                 // bcrypt/argon2, JANGAN plaintext
  role         Role     @default(EDITOR) // §36 table roles
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model AuditLog {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  action       String   // CREATE | UPDATE | DELETE | PUBLISH | LOGIN ...
  entity       String   // "Room", "Promotion", ...
  entityId     String?
  previousJson Json?    // snapshot sebelum (untuk "From $120 → $110" §37)
  newJson      Json?
  createdAt    DateTime @default(now())

  @@index([entity, entityId])
}
```

**DoD:**
- [ ] Index pada `AuditLog.entity` + `entityId` (audit log tumbuh cepat).
- [ ] Password tidak pernah dikirim ke client.

---

## DATA-004b — Award, TransportOption (LP-012, PRD §25)

**P0 · M · DB** — ditambahkan setelah doc/05 (LP-012 & section transport penuh di-CMS-kan).

```prisma
model Award {
  id        String  @id @default(cuid())
  name      String              // "Travelers' Choice"
  issuer    String?             // "TripAdvisor"
  year      Int?
  logo      String?
  sortOrder Int     @default(0)
}

model TransportOption {
  id          String   @id @default(cuid())
  title       String             // "Airport Transfer"
  description String?  @db.Text
  icon        String?            // nama ikon lucide: Plane / Car / Train
  priceFrom   Decimal? @db.Decimal(12, 2)
  ctaLabel    String?            // "Book via WhatsApp"
  ctaUrl      String?            // URL penuh (mis. https://wa.me/…)
  sortOrder   Int      @default(0)
}
```

**Detail teknis:**
- `TransportOption.ctaUrl` wajib URL http(s) penuh (wa.me di-paste utuh oleh admin).
- Awards: section landing (LP-012) hanya dirender jika ada data.
- Keduanya memakai pola CRUD generic yang sama (CMS-B-005): validators `award.ts`/`transport.ts`, API `/api/admin/awards|transports`, admin UI via GenericCrud.

**DoD:**
- [ ] Ikon transport tersedia di `icon-map.ts` (Plane, Car, Train, Bus, Bike, Ship).

---

## DATA-005 — Zod Validators (Source of Truth)

**P0 · M · Lib**

Buat `lib/validators/` — satu schema Zod per entity, dipakai di **tiga tempat**:

```text
lib/validators/
├── room.ts        # createRoomSchema, updateRoomSchema
├── promotion.ts
├── gallery.ts
├── testimonial.ts
├── attraction.ts
├── award.ts
├── transport.ts
├── faq.ts
├── experience.ts
├── amenity.ts
├── hotel.ts
├── seo.ts
└── user.ts        # createUserSchema, updateUserSchema
```

**Detail teknis:**
- Setiap schema: `partial()` untuk update, `.strict()` untuk create (reject field tak dikenal).
- Reuse: `z.string().min(1, "Wajib diisi")`, `z.enum([...])` untuk status/category.
- Type inference: `export type RoomInput = z.infer<typeof createRoomSchema>` — dipakai di client form & server handler (satu sumber kebenaran, tidak ada duplikasi).

**DoD:**
- [ ] Tidak ada `z.any()` di schema.
- [ ] Setiap API handler CMS melakukan `schema.parse(body)` — kalau gagal return `400` dengan error list (lihat CMS-B-*).

---

## DATA-006 — Seed Script

**P0 · M · Data**

`prisma/seed.ts` — `npx prisma db seed`:

- 1 Hotel (contoh: hotel Yogyakarta dari PRD §8–§25).
- 4 Rooms (Deluxe King, Twin, Family, Suite) + photos placeholder (pakai URL image dari `images.unsplash.com` — diganti gambar asli hotel).
- 8 Amenities (pool, restaurant, wifi, parking, meeting room, AC, TV, safe).
- 6 Gallery items (kategori berbeda).
- 3 Promotions (1 active, 1 scheduled, 1 draft — untuk test workflow publish).
- 3 Testimonials, 3 Experiences, 4 Attractions, 8 FAQ, 2 Users (admin & editor, password: `changeme123` — diganti saat production).

**Detail teknis:**
- Seed idempotent (delete all + recreate atau `upsert` by unique key).
- Pakai `bcryptjs` untuk hash password seed.

**DoD:**
- [ ] `npx prisma db seed` bisa dijalankan berulang tanpa error.
- [ ] Semua entity terisi data realistis yang dipakai landing page.

---

## DATA-007 — Migrations & Generate

**P0 · S · DB**

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Detail teknis:**
- Commit migration SQL ke repo (`prisma/migrations/`).
- Tambahkan script `"db:migrate": "prisma migrate deploy"` untuk production.
- Di CI/CD: `prisma generate` dijalankan sebelum build.

**DoD:**
- [ ] `src/generated` (Prisma client) tidak di-commit; di-generate via postinstall.
- [ ] Migration awal bisa di-deploy ke DB kosong.
