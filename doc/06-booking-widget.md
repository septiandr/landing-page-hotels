# 06 — Booking Widget & Cloudbeds Integration

> Mapping PRD: §9 (Booking Widget), §29–32 (Engine Architecture & States), §57–58 (Pricing & Currency), §44 (Conversion Funnel)

Komponen **conversion utama**. Arsitektur memakai **adapter pattern** — **Cloudbeds adalah provider utama (production)**; Mock adapter hanya untuk dev & test E2E tanpa API key. UI tidak pernah tahu provider mana yang aktif.

## Arsitektur Integrasi Cloudbeds (keputusan)

```text
Landing Page (Next.js)
   │
   ├── Discovery (server): getAvailability / getRates  ← Cloudbeds API v1
   │        → widget menampilkan room + rate real-time
   │
   ├── Booking initiation: deep link ke Hosted Booking Engine
   │        → https://hotels.cloudbeds.com/reservation/{PROPERTY_CODE}?checkin=...&promo=...
   │        → payment & confirmation ditangani Cloudbeds (PRD §30)
   │
   └── Webhook (server): reservation/created
            → track `booking_completed` (GA4/pixel) + notifikasi opsional
```

**Alasan:**
- API v1 (`X-Api-Key`) memang dirancang untuk guest-facing booking engine — sederhana, tanpa OAuth flow.
- Payment **tidak** ditangani landing page (PRD §30) — deep link ke engine Cloudbeds yang sudah handle payment, email, dan konfirmasi.
- Webhook `reservation/created` adalah sumber kebenaran untuk event `booking_completed` — lebih reliable daripada mengandalkan redirect balik.

## Prasyarat (dari pihak hotel)

1. Akun Cloudbeds aktif (PMS terisi: rooms, rate plans, inventory).
2. **API key** — dari Cloudbeds Developer/App (untuk API v1).
3. **Property ID** — ID numerik properti di akun Cloudbeds.
4. **Property Code** — kode 6 karakter (`Settings → Booking Engine → Summary`) untuk URL booking engine.
5. Akses ke **webhook** (`postWebhook`, scope `read:reservation`).
6. Test di **sandbox/demo property** dulu sebelum production.

## Ringkasan Task

| ID | Task | Prio | Estimasi |
|---|---|---|---|
| BK-001 | BookingWidget — form + validasi (adults/kids) | P0 | L |
| BK-002 | BookingEngineAdapter interface + Mock adapter | P0 | M |
| BK-003 | CloudbedsAdapter — auth & HTTP client (X-Api-Key) | P0 | M |
| BK-004 | Availability & rates dari Cloudbeds API → normalize | P0 | L |
| BK-005 | API route `/api/availability` (cache + timeout + fallback) | P0 | M |
| BK-006 | Booking state machine (UI states) | P0 | M |
| BK-007 | Error & fallback states (WhatsApp/Call) | P0 | M |
| BK-008 | Booking initiation → deep link Hosted Booking Engine | P0 | M |
| BK-009 | Webhook `reservation/created` → `booking_completed` | P0 | L |
| BK-010 | "From price" dari engine + fallback CMS | P0 | M |
| BK-011 | Promo code via deep link (`promo` param) | P0 | S |
| BK-012 | Currency handling | P1 | S |
| BK-013 | (Opsional) `createReservation` via API — checkout inline | P1 | L |
| BK-014 | Setup & verification checklist Cloudbeds | P0 | S |

---

## BK-001 — BookingWidget Form & Validasi

**P0 · L · Frontend**

`components/booking/BookingWidget.tsx` (client):

**Input (PRD §9, disesuaikan semantic Cloudbeds):**
- Check-in & check-out (date picker — `react-day-picker` atau native `<input type="date">`).
- **Adults** (`adults`) & **Children** (`kids`) — stepper terpisah (Cloudbeds membedakan adults/kids).
- Rooms (jumlah kamar).
- Promo code (opsional).

**Rules validasi (server & client, Zod — `lib/validators/booking.ts`):**
- Check-out **>** check-in (min 1 malam).
- `adults >= 1`; `kids >= 0`; total guests dihitung untuk occupancy check di sisi engine.
- Closed dates / blackout → tampilkan dari response engine (BK-004).

**Detail teknis:**
- Submit → `searchAvailability()` (BK-005) → state machine (BK-006).
- Baca query params saat mount: `?checkin=&checkout=&adults=&kids=&rooms=&code=` (shareable, BK-011).

**DoD:**
- [ ] Validasi inline per field (Zod) dengan pesan bahasa Indonesia.
- [ ] URL dengan params → widget pre-filled (adults/kids terpisah).

---

## BK-002 — BookingEngineAdapter Interface

**P0 · M · Lib**

`lib/booking-engine/`:

```ts
// lib/booking-engine/types.ts
export interface AvailabilityRequest {
  checkIn: string;      // YYYY-MM-DD
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  promoCode?: string;
}

export interface RateOption {
  roomId: string;          // room_id di Cloudbeds
  roomName: string;
  ratePlanId?: string;
  pricePerNight: number;   // harga rata-rata/malam (dari total)
  currency: string;
  totalPrice: number;      // total seluruh malam
  available: boolean;
  taxIncluded: boolean;
  cancellationPolicy?: string;
}

export interface AvailabilityResponse {
  rates: RateOption[];
  engineError?: boolean;   // true = engine down → UI fallback (BK-007)
  errorMessage?: string;
}

export interface BookingInitRequest {
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  roomId?: string;
  ratePlanId?: string;
  promoCode?: string;
}

// lib/booking-engine/index.ts
export interface BookingEngineAdapter {
  provider: "cloudbeds" | "mock";
  checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResponse>;
  getFromPrice(): Promise<{ price: number; currency: string } | null>;
  buildBookingUrl(req: BookingInitRequest): string; // deep link (BK-008)
}

export function getEngine(): BookingEngineAdapter {
  if (process.env.BOOKING_ENGINE_PROVIDER === "cloudbeds") {
    return new CloudbedsAdapter();
  }
  return new MockAdapter(); // dev & E2E tanpa API key
}
```

- **MockAdapter** (`lib/booking-engine/mock.ts`): data deterministik dari `room.priceFrom` DB + delay 600ms — **hanya untuk dev/test**, tidak pernah aktif di production (`BOOKING_ENGINE_PROVIDER=mock` dilarang di prod — lihat REL-001).

**DoD:**
- [ ] `getEngine()` memilih provider dari env; swap tanpa ubah komponen.
- [ ] Mock adapter memenuhi kontrak interface (TypeScript strict).

---

## BK-003 — CloudbedsAdapter: Auth & HTTP Client

**P0 · M · Lib**

`lib/booking-engine/cloudbeds.ts` + `lib/booking-engine/http.ts`:

**Auth (API v1):**
```ts
// lib/booking-engine/cloudbeds.ts
const BASE_URL = process.env.CLOUDBEDS_API_BASE_URL ?? "https://hotels.cloudbeds.com/api/v1.0";

async function cloudbedsFetch<T>(endpoint: string, params: Record<string, string | number>) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("property_id", process.env.CLOUDBEDS_PROPERTY_ID!);

  const res = await fetch(url, {
    headers: { "X-Api-Key": process.env.CLOUDBEDS_API_KEY! },
    signal: AbortSignal.timeout(8_000), // timeout wajib
  });
  const json = await res.json();
  if (!res.ok || json.success === false) throw new CloudbedsApiError(json.code, json.message);
  return json.data;
}
```

**Detail teknis:**
- Fail-fast: validasi env `CLOUDBEDS_API_KEY`, `CLOUDBEDS_PROPERTY_ID`, `CLOUDBEDS_PROPERTY_CODE` saat konstruksi (module `lib/env-server.ts` — server-only).
- Timeout 8 detik (AbortSignal.timeout) — wajib, engine lambat tidak boleh menggantung request.
- **Retry**: 1x retry untuk 5xx/timeout dengan backoff 500ms (hanya untuk GET).
- Error mapping: `{ success: false, code, message }` → `CloudbedsApiError` → konversi ke `AvailabilityResponse.engineError` di layer adapter.
- **Rate limit**: catat batas rate limit akun (verifikasi di dashboard Cloudbeds) — jangan spam `getAvailability`; cache di BK-005.
- Catatan: bentuk field response aktual bisa berbeda antar versi API (v1.0 vs v1.1) — **verifikasi saat implementasi dengan API key live** (BK-014).

**DoD:**
- [ ] Semua request punya timeout + retry 1x + header `X-Api-Key`.
- [ ] Error Cloudbeds → `engineError: true` + message (bukan crash).
- [ ] Env wajib divalidasi server-only (jangan bocor ke client).

---

## BK-004 — Availability & Rates (Cloudbeds API)

**P0 · L · Lib**

`lib/booking-engine/cloudbeds-availability.ts`:

**Panggilan API:**
- `GET {base}/getAvailability` dengan params: `start_date`, `end_date`, `adults`, `children`, (opsional) `room_id`.
- `GET {base}/getRates` untuk rate plan per tanggal (jika getAvailability tidak menyertakan harga).

**Normalisasi ke `RateOption` (di dalam adapter — UI tidak pernah lihat bentuk Cloudbeds):**
- Ambil daftar room + ketersediaan tiap tanggal (`available` count per room per date).
- Harga: gunakan `getRates`/field price → hitung `totalPrice` (sum per malam) → `pricePerNight = totalPrice / nights`.
- `taxIncluded`: default false — verifikasi apakah harga Cloudbeds sudah include tax.
- Room hanya muncul di `rates[]` jika **available di semua malam** dalam rentang (bukan sebagian) — filter di adapter.
- Mapping `room_id` Cloudbeds ↔ slug room CMS (BK-013/room detail prefill).

**Detail teknis:**
- `nights = getNights(checkIn, checkOut)` (FOUND-007).
- Pertahankan mapping `roomId → { slug, name }` di `lib/booking-engine/room-map.ts` (sinkronisasi manual/CMS field `rateLink` — PRD §34 Rooms).

**DoD:**
- [ ] Room dengan 1 malam unavailable → tidak muncul di hasil.
- [ ] `RateOption` berisi harga total & per malam yang konsisten.
- [ ] Test dengan data live (BK-014) vs snapshot.

---

## BK-005 — Availability API Route

**P0 · M · API**

`app/api/availability/route.ts` — `GET` (query params).

**Detail teknis:**
- Validate request (`bookingRequestSchema`): `checkin`, `checkout`, `adults`, `kids`, `rooms`, `code?` → 400 jika invalid.
- Panggil `getEngine().checkAvailability()`.
- **Cache**: response di-cache server-side 60 detik (`unstable_cache` → di Next 16 `cacheLife` + `cacheTag`, key = hash params) — harga & availability tidak berubah per detik, dan mencegah kena rate limit Cloudbeds.
- **Fallback**: jika engine error/timeout → response `{ error: "ENGINE_UNAVAILABLE" }` (bukan 500) → UI masuk state fallback (BK-007).
- Response Zod-validated sebelum dikirim.

**DoD:**
- [ ] `GET /api/availability?checkin=...&checkout=...&adults=2&kids=0&rooms=1` return rates atau `ENGINE_UNAVAILABLE`.
- [ ] Request duplikat dalam 60 detik → cache hit (log di server).

---

## BK-006 — Booking State Machine

**P0 · M · Frontend**

`lib/booking-states.ts` + di widget:

```ts
type BookingState =
  | "idle"
  | "validating"
  | "loading"
  | "available"        // ada rates
  | "no-availability"  // engine OK tapi kosong
  | "error"            // engine down / network (BK-007)
  | "invalid-date"
  | "invalid-guests";
```

- `available` → `AvailabilityResults.tsx`: daftar room + rate; pilih → tombol Book (BK-008).
- `no-availability` → pesan "No rooms available for your selected dates. Try another date." + CTA `CHANGE DATES` (PRD §31).
- `error` → fallback (BK-007).
- Track event transisi (ANA-003: `search_availability`, `select_room`).

**DoD:**
- [ ] Semua 8 state tertest (unit test state transition).

---

## BK-007 — Error & Fallback (WhatsApp/Call)

**P0 · M · Frontend**

- `EngineError.tsx` (PRD §32): "We're temporarily unable to check availability. Please contact our reservation team." + `[WHATSAPP]` + `[CALL US]`.
- WhatsApp message pre-filled dengan konteks: "Halo, saya ingin menanyakan ketersediaan kamar {dates} untuk {adults} dewasa."
- Dipakai juga jika deep link engine gagal (onError di `window.open` fallback).

**DoD:**
- [ ] Matikan network → search → fallback tampil dengan WhatsApp & tel link.

---

## BK-008 — Booking Initiation → Deep Link Booking Engine

**P0 · M · Frontend + Lib**

`lib/booking-engine/deep-link.ts` — builder URL ke **Hosted Booking Engine Cloudbeds**:

```ts
export function buildBookingUrl(req: BookingInitRequest): string {
  const base = `https://hotels.cloudbeds.com/reservation/${process.env.NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE}`;
  const url = new URL(base);
  url.searchParams.set("checkin", req.checkIn);      // YYYY-MM-DD
  url.searchParams.set("checkout", req.checkOut);    // default: +1 hari jika kosong
  url.searchParams.set("adults", String(req.adults));
  url.searchParams.set("kids", String(req.kids));
  if (req.promoCode) url.searchParams.set("promo", req.promoCode);
  if (req.roomId) {
    // ABBR = singkatan 3-huruf room type dari Settings → Accommodation
    url.searchParams.set("room_type", roomAbbrByCloudbedsId[req.roomId]);
    url.searchParams.set("base_rates_only", "1");
  }
  return url.toString();
}
```

**Detail teknis:**
- Param di-parse engine **hanya saat initial load** — buka di tab baru (`window.open`) bukan redirect halaman yang sama.
- Alur: user pilih room/rate → konfirmasi ringkas (tanggal, guests, price) → buka deep link → payment & confirmation di engine Cloudbeds (PRD §30).
- Tracking: `booking_started` **sebelum** `window.open` (ANA-003); `booking_completed` dari webhook (BK-009) — bukan dari redirect.
- Fallback: jika `NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE` kosong → tombol WhatsApp (BK-007).
- Referensi param valid saat implementasi: `checkin`, `checkout`, `adults`, `kids`, `currency`, `promo`, `room_type`, `base_rates_only` (bisa juga bentuk hash `#promo=`/`#room_type=`).

**DoD:**
- [ ] Klik "Book" → tab baru engine dengan check-in/out & guests terisi (test manual di sandbox).
- [ ] `booking_started` ter-track sebelum navigasi.

---

## BK-009 — Webhook `reservation/created` → `booking_completed`

**P0 · L · Backend**

`app/api/webhooks/cloudbeds/route.ts` — menerima POST dari Cloudbeds.

**Subscribe (setup sekali):**
```bash
curl -X POST "https://hotels.cloudbeds.com/api/v1.3/postWebhook?propertyID=12345" \
  -H "Authorization: Bearer <token>" \
  -d "object=reservation&action=created&endpointUrl=https://site.com/api/webhooks/cloudbeds"
```

**Handler:**
- Payload: `{ version, timestamp, event: "reservation/created", propertyID, reservationID, startDate, endDate }`.
- **Balas 2xx secepatnya** (< 2 detik) — Cloudbeds retry 1-menit sampai 5x jika lambat/gagal; jangan proses berat sinkron.
- **Idempotent**: simpan `reservationID` yang sudah diproses (tabel `BookingEvent` atau cache) — event bisa terkirim ulang.
- Proses: track `booking_completed` ke GA4 (Measurement Protocol) / Meta Conversion API / dataLayer server-side, dengan `reservationID` sebagai transaction ID.
- Validasi property: cek `propertyID` == `CLOUDBEDS_PROPERTY_ID`.
- Catatan keamanan: webhook v1 tidak punya signature — jangan expose data sensitif, verifikasi tambahan via `getReservation` jika perlu.

**DoD:**
- [ ] Webhook terdaftar & event masuk saat booking test di sandbox.
- [ ] Event duplikat tidak men-trigger `booking_completed` dua kali.
- [ ] Response < 2 detik (test dengan `curl -w %{time_total}`).

---

## BK-010 — "From Price" dari Engine

**P0 · M · Frontend**

- `lib/booking-engine/from-price.ts`: ambil rate terendah dari `getAvailability`/`getRates` (jendela 30 hari ke depan) → dipakai di RoomCard (LP-006), sticky bar (LP-019), Hero optional.
- **Cache server-side 10 menit** (jangan hit API tiap request — rate limit).
- **Fallback**: engine offline → `room.priceFrom` dari CMS dengan label `starting from` (PRD §57).

**DoD:**
- [ ] Harga card dari engine saat online; fallback CMS saat offline.

---

## BK-011 — Promo Code & Shareable URL

**P0 · S · Frontend**

- Input promo code → diteruskan sebagai `promo` di deep link (BK-008) — **validasi & aplikasi diskon dilakukan engine Cloudbeds** (landing page tidak menghitung diskon sendiri).
- URL builder `lib/booking/url.ts`: `buildAvailabilityUrl({ checkIn, checkOut, adults, kids, rooms, code })` → dipakai Promotion card (LP-010) & Room card.
- Copy promo code button (clipboard).

**DoD:**
- [ ] Promo card → klik → widget terbuka dengan kode + tanggal terisi.
- [ ] Kode terkirim ke engine via `promo` param (verify di sandbox).

---

## BK-012 — Currency

**P1 · S · Lib**

- `lib/currency.ts`: konversi display (IDR/USD/EUR/SGD/AUD) — **harga final selalu dari engine Cloudbeds** (PRD §58).
- Deep link bisa mengirim `currency` param jika hotel mengaktifkan multi-currency di engine.
- `formatCurrency` (FOUND-007) dipakai konsisten — tanpa hardcode `Rp`/`$` di komponen.

**DoD:**
- [ ] Tidak ada hardcode mata uang di komponen.

---

## BK-013 — (Opsional) Checkout Inline via `createReservation`

**P1 · L · Integration**

Jika hotel ingin checkout tanpa pindah halaman (untuk kasus khusus, bukan MVP):

- `POST {base}/createReservation` dengan `property_id`, `start_date`, `end_date`, `room_id`, guest data, `adults`, `children`, `total`.
- **Konsekuensi besar**: payment tetap harus diproses (Cloudbeds payment gateway atau provider sendiri) — ini melanggar prinsip PRD §30 & §51 (jangan simpan payment data di CMS).
- **Rekomendasi: SKIP untuk MVP** — deep link (BK-008) lebih aman & lebih cepat diluncurkan.

**DoD (jika dikerjakan):**
- [ ] Pembayaran diproses oleh payment provider resmi, bukan disimpan di CMS.
- [ ] Konfirmasi booking terkirim oleh Cloudbeds.

---

## BK-014 — Setup & Verification Checklist Cloudbeds

**P0 · S · Setup/QA**

Checklist saat API key & akses sandbox tersedia:

- [ ] Env terisi: `BOOKING_ENGINE_PROVIDER=cloudbeds`, `CLOUDBEDS_API_KEY`, `CLOUDBEDS_PROPERTY_ID`, `NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE`.
- [ ] `getAvailability` dipanggil dari server → data room & harga nyata tercatat.
- [ ] Normalisasi `RateOption` sesuai data live (field name diverifikasi — sesuaikan jika beda versi API).
- [ ] Deep link terbuka di sandbox, tanggal/guests terisi benar, promo code diterima engine.
- [ ] Webhook terdaftar → booking test memunculkan `booking_completed`.
- [ ] Rate limit: cache bekerja, tidak ada request berlebih.
- [ ] Fallback: matikan API key → UI masuk state error (BK-007) tanpa crash.

**DoD:**
- [ ] Semua item checklist hijau sebelum rilis production.
