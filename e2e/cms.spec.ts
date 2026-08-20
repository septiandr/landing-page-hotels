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

test.describe.serial("On-site booking (OSB): create → check-in → check-out", () => {
  let bookingId: string | null = null;
  let bookingCode: string | null = null;
  const guestName = `Tamu E2E ${Date.now()}`;

  test("create walk-in booking via API (mock engine)", async ({ page }) => {
    await login(page);
    // Ambil room published pertama (seed selalu punya room published).
    const roomsRes = await page.request.get("/api/admin/rooms?status=PUBLISHED");
    expect(roomsRes.status()).toBe(200);
    const roomsBody = (await roomsRes.json()) as {
      data?: { items?: { id: string; name: string }[] };
    };
    const room = roomsBody.data?.items?.[0];
    expect(room?.id).toBeTruthy();

    const today = new Date();
    const checkIn = today.toISOString().slice(0, 10);
    const checkOut = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);

    const res = await page.request.post("/api/admin/bookings", {
      data: {
        roomTypeId: room!.id,
        checkIn,
        checkOut,
        adults: 2,
        kids: 0,
        guestName,
        guestPhone: "081234567890",
        pricePerNight: 500000,
        paymentMethod: "CASH",
      },
    });
    expect([200, 201].includes(res.status())).toBe(true);
    const body = (await res.json()) as {
      data?: { id: string; code: string; status: string; cloudbedsReservationId: string | null };
    };
    bookingId = body.data?.id ?? null;
    bookingCode = body.data?.code ?? null;
    expect(bookingId).toBeTruthy();
    expect(body.data?.status).toBe("CONFIRMED");
    // Mock engine selalu mengembalikan reservation id.
    expect(body.data?.cloudbedsReservationId).toBeTruthy();
  });

  test("booking tampil di list & detail admin", async ({ page }) => {
    await login(page);
    expect(bookingId).toBeTruthy();
    await page.goto("/admin/bookings");
    await expect(page.getByText(guestName).first()).toBeVisible();

    await page.goto(`/admin/bookings/${bookingId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("CONFIRMED").first()).toBeVisible();
  });

  test("check-in → status CHECKED_IN", async ({ page }) => {
    await login(page);
    expect(bookingId).toBeTruthy();
    const res = await page.request.patch(`/api/admin/bookings/${bookingId}`, {
      data: { action: "CHECK_IN" },
    });
    expect([200, 201].includes(res.status())).toBe(true);
    const body = (await res.json()) as { data?: { status: string } };
    expect(body.data?.status).toBe("CHECKED_IN");
  });

  test("check-out → status CHECKED_OUT; transisi invalid ditolak", async ({ page }) => {
    await login(page);
    expect(bookingId).toBeTruthy();
    const res = await page.request.patch(`/api/admin/bookings/${bookingId}`, {
      data: { action: "CHECK_OUT" },
    });
    expect([200, 201].includes(res.status())).toBe(true);
    const body = (await res.json()) as { data?: { status: string } };
    expect(body.data?.status).toBe("CHECKED_OUT");

    // Terminal: tidak bisa check-in ulang → 409 INVALID_TRANSITION.
    const invalid = await page.request.patch(`/api/admin/bookings/${bookingId}`, {
      data: { action: "CHECK_IN" },
    });
    expect(invalid.status()).toBe(409);
  });

  test("cancel wajib alasan → error; dengan alasan → CANCELLED", async ({ page }) => {
    await login(page);
    const roomsRes = await page.request.get("/api/admin/rooms?status=PUBLISHED");
    const roomsBody = (await roomsRes.json()) as { data?: { items?: { id: string }[] } };
    const roomId = roomsBody.data?.items?.[0]?.id;
    expect(roomId).toBeTruthy();

    const today = new Date();
    const checkIn = today.toISOString().slice(0, 10);
    const checkOut = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10);
    const created = await page.request.post("/api/admin/bookings", {
      data: {
        roomTypeId: roomId,
        checkIn,
        checkOut,
        adults: 2,
        guestName: `Cancel E2E ${Date.now()}`,
        guestPhone: "081298765432",
        pricePerNight: 450000,
      },
    });
    expect([200, 201].includes(created.status())).toBe(true);
    const createdBody = (await created.json()) as { data?: { id: string } };
    const cancelBookingId = createdBody.data?.id;
    expect(cancelBookingId).toBeTruthy();

    const noReason = await page.request.patch(`/api/admin/bookings/${cancelBookingId}`, {
      data: { action: "CANCEL" },
    });
    expect(noReason.status()).toBe(400);

    const withReason = await page.request.patch(`/api/admin/bookings/${cancelBookingId}`, {
      data: { action: "CANCEL", cancellationReason: "Tamu batal karena jadwal berubah" },
    });
    expect([200, 201].includes(withReason.status())).toBe(true);
    const body = (await withReason.json()) as { data?: { status: string } };
    expect(body.data?.status).toBe("CANCELLED");
  });

  test("audit log mencatat aksi booking", async ({ page }) => {
    await login(page);
    expect(bookingCode).toBeTruthy();
    await page.goto("/admin/audit-log");
    const row = page
      .locator("tbody tr")
      .filter({ hasText: "Booking" })
      .filter({ hasText: "CHECK_OUT" });
    await expect(row.first()).toBeVisible();
  });
});
