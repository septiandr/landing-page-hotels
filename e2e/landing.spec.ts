import { expect, test } from "@playwright/test";

/**
 * TEST-004 — E2E landing page flow (PRD §69) — desktop.
 * Berjalan dengan BOOKING_ENGINE_PROVIDER=mock (data deterministik dari DB).
 * Skenario mobile ada di e2e/landing-mobile.spec.ts.
 */

const HOTEL = "Taman Sari Heritage Hotel";
// Scoped ke form widget — halaman juga punya tombol "Check Availability" di FinalCta.
const searchBtn = (page: import("@playwright/test").Page) =>
  page.locator("#bk-widget-form").getByRole("button", { name: "Check Availability" });

function toDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const in7 = toDateInput(new Date(Date.now() + 7 * 86400000));
const in9 = toDateInput(new Date(Date.now() + 9 * 86400000));

test.describe("Landing page", () => {
  test("hero & semua section utama render", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: HOTEL })).toBeVisible();
    for (const id of ["rooms", "amenities", "gallery", "offers", "location", "faq", "reviews"]) {
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });

  test("booking: isi tanggal & guests → Search → rate kamar muncul (mock)", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Check-in").fill(in7);
    await page.getByLabel("Check-out").fill(in9);
    await searchBtn(page).click();

    // MockAdapter delay 600ms → rate card muncul DI WIDGET (bukan heading RoomList)
    await expect(
      page.locator("#booking").getByRole("button", { name: /Deluxe King Room/ }),
    ).toBeVisible();
  });

  test("pilih kamar → Book → booking_started ter-tracking di dataLayer", async ({ page }) => {
    // Tanpa GTM env, window.dataLayer belum ada → track() no-op. Inisialisasi
    // seperti yang akan dilakukan GTM container (dataLayer sudah ada).
    await page.addInitScript(() => {
      (window as { dataLayer?: unknown[] }).dataLayer = [];
    });
    await page.goto("/");
    await page.getByLabel("Check-in").fill(in7);
    await page.getByLabel("Check-out").fill(in9);
    await searchBtn(page).click();

    // scope ke widget — halaman juga punya tombol gallery "Lihat foto: Deluxe King Room"
    await page.locator("#booking").getByRole("button", { name: /Deluxe King Room/ }).click();
    const bookBtn = page.getByRole("button", { name: /Book Now/ });
    await expect(bookBtn).toBeVisible();

    // mock: buildBookingUrl tanpa property code → fallback WhatsApp (window.open)
    await page.evaluate(() => {
      window.open = () => null;
    });
    await bookBtn.click();

    const events = await page.evaluate(
      () => (window as { dataLayer?: { event?: string }[] }).dataLayer ?? [],
    );
    expect(events.some((e) => e.event === "booking_started")).toBe(true);
    expect(events.some((e) => e.event === "search_availability")).toBe(true);
  });

  test("URL shareable pre-fill widget (BK-011)", async ({ page }) => {
    await page.goto(`/?checkin=${in7}&checkout=${in9}&adults=3&kids=1&rooms=2`);
    await expect(page.getByLabel("Check-in")).toHaveValue(in7);
    await expect(page.getByLabel("Check-out")).toHaveValue(in9);
  });

  test("room detail: metadata & JSON-LD HotelRoom", async ({ page }) => {
    const res = await page.goto("/rooms/deluxe-king-room");
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/Deluxe King Room/);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toContain('"HotelRoom"');
    expect(jsonLd).toContain('"Offer"');
  });
});
