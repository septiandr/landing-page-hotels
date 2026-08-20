# 06 — Validasi CMS (Zod)

> Fitur: skema Zod untuk semua form admin — room, promotion, gallery, testimonial, amenity, user, award, transport — plus helper normalisasi form.
> Kode PRD: CMS-B-*, DATA-002

## File Test

| File | Apa yang diuji |
|---|---|
| `src/lib/validators/validators.test.ts` | Schema hotel/room/promotion/gallery/testimonial/amenity/user + helpers |
| `src/lib/validators/award-transport.test.ts` | Schema award & transport |

## Kasus Uji

### `validators.test.ts`

**Format umum:**
- WhatsApp: menerima `6281...` & `+6281...`, menolak format lokal `0812...` (pesan "Format WhatsApp").
- Email: string non-email ditolak.

**`createRoomSchema`:**
- Valid: field inti diterima, `status` default `DRAFT`, `breakfastIncluded` default `false`, string harga di-coerce ke number.
- Strict: field tak dikenal (`hacked`) ditolak.
- Slug: hanya huruf kecil + angka + strip (spasi/underscore ditolak).
- Wajib: nama wajib ("Wajib diisi"), harga negatif ditolak.
- Update: partial — hanya slug boleh.
- Type inference: `RoomInput` tersedia untuk form & handler.

**`createPromotionSchema`:**
- Valid: title-only diterima, `status` default `DRAFT`, `ctaLabel` default "Book Now".
- Refine: `bookingStart` harus sebelum `bookingEnd` (error di path `bookingEnd`).
- Status: enum invalid (`"ON_FIRE"`) ditolak.

**Entity schemas:**
- Gallery: `image` wajib + `altText` wajib.
- Gallery kategori: enum valid (`SURROUNDINGS` diterima), `misc` ditolak.
- Testimonial: rating 1..5 (6 ditolak).
- Amenity: group default `HOTEL`, objek kosong ditolak.
- User: password minimal 8 karakter; role default `EDITOR`.
- Image: path upload lokal `/uploads/...` diterima.
- Time: `14:00` diterima, `25:00` ditolak.

**Helper normalisasi form:**
- `optionalString`: string kosong → `null`.
- `coerceBool`: string form `"false"` → boolean `false`.

**Regression:**
- `updateRoomSchema.parse({name})` tidak menyisipkan field ber-default (currency/status/breakfastIncluded/sortOrder).
- Foto room tanpa `altText` ditolak (sesuai Prisma required).

### `award-transport.test.ts`

**`createAwardSchema`:**
- Valid hanya dengan `name`.
- Tanpa `name` → ditolak.
- `year` & `sortOrder` di-coerce dari string.
- Tahun di luar rentang (1899, 2101) ditolak.

**`createTransportSchema`:**
- Valid lengkap (title, priceFrom, ctaUrl wa.me).
- Tanpa `title` → ditolak.
- `ctaUrl` bukan URL → ditolak.
- `ctaUrl` opsional.

## Cara Menjalankan

```bash
npx vitest run src/lib/validators
```

## Catatan

- Zod 4: top-level `z.email()`, `z.url()` (bukan `z.string().email()`).
- Skema dipakai ganda: API (`src/app/api/admin/*`) dan form React Hook Form via `standardSchemaResolver`.
- Error field yang di-parse dipakai UI untuk menampilkan pesan validasi per field.
