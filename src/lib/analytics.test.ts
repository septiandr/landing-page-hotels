import { describe, expect, it } from "vitest";
import { createEventId, EVENTS } from "./analytics";

describe("EVENTS (ANA-003)", () => {
  it("terdefinisi 16+ event funnel PRD §43", () => {
    const names = Object.values(EVENTS);
    expect(names.length).toBeGreaterThanOrEqual(16);
    expect(names).toContain("booking_widget_view");
    expect(names).toContain("search_availability");
    expect(names).toContain("select_room");
    expect(names).toContain("booking_started");
    expect(names).toContain("booking_completed");
    expect(names).toContain("click_book_now");
    expect(names).toContain("click_whatsapp");
    expect(names).toContain("click_phone");
    expect(names).toContain("click_email");
    expect(names).toContain("click_map");
    expect(names).toContain("view_room");
    expect(names).toContain("view_promotion");
    expect(names).toContain("click_promotion");
    expect(names).toContain("view_gallery");
    expect(names).toContain("view_faq");
  });

  it("semua nama unik", () => {
    const names = Object.values(EVENTS);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("createEventId (ANA-004)", () => {
  it("menghasilkan id unik berulang", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createEventId()));
    expect(ids.size).toBe(50);
  });
});
