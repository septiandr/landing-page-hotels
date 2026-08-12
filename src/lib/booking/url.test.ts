import { describe, expect, it } from "vitest";
import { buildAvailabilityUrl } from "./url";

describe("buildAvailabilityUrl", () => {
  it("menghasilkan /#booking tanpa param", () => {
    expect(buildAvailabilityUrl()).toBe("/#booking");
  });

  it("menyertakan tanggal, tamu, dan kode promo", () => {
    const url = buildAvailabilityUrl({
      checkIn: "2026-09-01",
      checkOut: "2026-09-03",
      adults: 2,
      kids: 1,
      rooms: 1,
      code: "STAY3FREE",
    });
    expect(url).toContain("checkin=2026-09-01");
    expect(url).toContain("checkout=2026-09-03");
    expect(url).toContain("adults=2");
    expect(url).toContain("kids=1");
    expect(url).toContain("rooms=1");
    expect(url).toContain("code=STAY3FREE");
    expect(url).toContain("#booking");
  });

  it("menyertakan slug room", () => {
    expect(buildAvailabilityUrl({ room: "deluxe-king-room" })).toContain(
      "room=deluxe-king-room",
    );
  });
});
