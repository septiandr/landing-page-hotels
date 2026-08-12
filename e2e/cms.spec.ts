import { expect, test, type Page } from "@playwright/test";

/**
 * TEST-005 — E2E CMS flow (PRD §61: login → edit → publish < 5 menit).
 * Menggunakan user seed admin@example.com / changeme123.
 *
 * Skenario yang saling bergantung (create → preview → publish → audit) dibungkus
 * `test.describe.serial` — Playwright menjamin urutan & me-skip sisa bila satu
 * gagal, supaya tidak cascade error yang membingungkan.
 */

const ROOM_NAME = `E2E Kamar Test ${Date.now()}`;
const ROOM_SLUG = `e2e-room-${Date.now()}`;

let createdRoomId: string | null = null;

async function login(page: Page, email = "admin@example.com", password = "changeme123") {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin$/);
}

test.describe("CMS flow", () => {
  test("login → dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("buat promotion ACTIVE → tampil di section offers", async ({ page }) => {
    await login(page);
    const promoName = `E2E Promo ${Date.now()}`;
    const res = await page.request.post("/api/admin/promotions", {
      data: {
        title: promoName,
        description: "Promo E2E",
        discountLabel: "Diskon 15%",
        promoCode: `E2E${Date.now() % 100000}`,
        status: "ACTIVE",
        showCountdown: true,
        bookingStart: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        bookingEnd: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      },
    });
    expect([200, 201].includes(res.status())).toBe(true);

    await page.goto("/#offers");
    await expect(page.getByText(promoName).first()).toBeVisible();
  });

  test("RBAC: user viewer tidak bisa POST API admin (403)", async ({ page }) => {
    await login(page, "admin@example.com", "changeme123");
    const viewerEmail = `viewer-${Date.now()}@example.com`;
    const created = await page.request.post("/api/admin/users", {
      data: { name: "Viewer E2E", email: viewerEmail, password: "viewer123", role: "VIEWER" },
    });
    expect([200, 201].includes(created.status())).toBe(true);

    const viewerCtx = await page.context().browser()!.newContext();
    const viewerPage = await viewerCtx.newPage();
    await viewerPage.goto("/admin/login");
    await viewerPage.getByLabel("Email").fill(viewerEmail);
    await viewerPage.getByLabel("Password").fill("viewer123");
    await viewerPage.getByRole("button", { name: "Masuk" }).click();
    await viewerPage.waitForURL(/\/admin$/);

    const res = await viewerPage.request.post("/api/admin/rooms", {
      data: { name: "Hack", slug: "hack", status: "PUBLISHED" },
    });
    expect(res.status()).toBe(403);
    await viewerCtx.close();
  });
});

test.describe.serial("Room lifecycle (create → preview → publish → audit)", () => {
  test("buat room draft via API → muncul di list admin", async ({ page }) => {
    await login(page);
    const res = await page.request.post("/api/admin/rooms", {
      data: { name: ROOM_NAME, slug: ROOM_SLUG, status: "DRAFT", priceFrom: 900000, currency: "IDR" },
    });
    // crud-factory create mengembalikan 200
    expect([200, 201].includes(res.status())).toBe(true);
    const body = (await res.json()) as { data?: { id: string } };
    createdRoomId = body.data?.id ?? null;
    expect(createdRoomId).toBeTruthy();

    await page.goto("/admin/rooms");
    await expect(page.getByText(ROOM_NAME)).toBeVisible();
  });

  test("draft tidak tampil publik, tampil via ?preview=1 (session aktif)", async ({ page }) => {
    await login(page);
    // publik: 404 (belum publish)
    const pub = await page.goto(`/rooms/${ROOM_SLUG}`);
    expect(pub?.status()).toBe(404);

    // preview dengan session admin: 200
    const prev = await page.goto(`/rooms/${ROOM_SLUG}?preview=1`);
    expect(prev?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: ROOM_NAME })).toBeVisible();
  });

  test("publish → room muncul di landing (revalidate)", async ({ page }) => {
    await login(page);
    expect(createdRoomId).toBeTruthy();
    const pub = await page.request.patch(`/api/admin/rooms/${createdRoomId}`, {
      data: { status: "PUBLISHED" },
    });
    expect([200, 201].includes(pub.status())).toBe(true);

    await page.goto("/");
    await expect(page.getByText(ROOM_NAME).first()).toBeVisible();
  });

  test("audit log mencatat aksi create room", async ({ page }) => {
    await login(page);
    await page.goto("/admin/audit-log");
    // Ada baris tabel dengan aksi CREATE untuk entity Kamar (dibuat di test pertama)
    const createRow = page
      .locator("tbody tr")
      .filter({ hasText: "CREATE" })
      .filter({ hasText: "Kamar" });
    await expect(createRow.first()).toBeVisible();
  });
});
