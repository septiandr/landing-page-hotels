import { describe, expect, it } from "vitest";
import { transition, validateSearch, type BookingState } from "./booking-states";

const ALL_STATES: BookingState[] = [
  "idle",
  "validating",
  "loading",
  "available",
  "no-availability",
  "error",
  "invalid-date",
  "invalid-guests",
];

describe("booking state machine (BK-006)", () => {
  it("mendefinisikan 8 state", () => {
    expect(ALL_STATES).toHaveLength(8);
  });

  it("alur sukses: idle → validating → loading → available", () => {
    let s: BookingState = "idle";
    s = transition(s, { type: "SUBMIT" });
    expect(s).toBe("validating");
    s = transition(s, { type: "SEARCH_START" });
    expect(s).toBe("loading");
    s = transition(s, { type: "SEARCH_SUCCESS", hasRates: true });
    expect(s).toBe("available");
  });

  it("alur kosong: loading → no-availability", () => {
    let s: BookingState = "loading";
    s = transition(s, { type: "SEARCH_SUCCESS", hasRates: false });
    expect(s).toBe("no-availability");
  });

  it("alur error engine: loading → error", () => {
    let s: BookingState = "loading";
    s = transition(s, { type: "ENGINE_ERROR" });
    expect(s).toBe("error");
  });

  it("validasi gagal: idle → invalid-date / invalid-guests", () => {
    expect(transition("idle", { type: "VALIDATE_DATE_FAIL" })).toBe("invalid-date");
    expect(transition("idle", { type: "VALIDATE_GUESTS_FAIL" })).toBe("invalid-guests");
  });

  it("reset dari state apa pun → idle", () => {
    for (const state of ALL_STATES) {
      expect(transition(state, { type: "RESET" })).toBe("idle");
    }
  });

  it("transisi tidak valid dipertahankan (defensive)", () => {
    expect(transition("idle", { type: "SEARCH_SUCCESS", hasRates: true })).toBe("idle");
    expect(transition("available", { type: "SUBMIT" })).toBe("validating");
    expect(transition("error", { type: "SUBMIT" })).toBe("validating");
  });

  it("retry: error → validating → loading", () => {
    let s: BookingState = "error";
    s = transition(s, { type: "SUBMIT" });
    expect(s).toBe("validating");
    s = transition(s, { type: "SEARCH_START" });
    expect(s).toBe("loading");
  });

  it("re-search dari no-availability: submit valid → available", () => {
    let s: BookingState = "no-availability";
    s = transition(s, { type: "SUBMIT" });
    expect(s).toBe("validating");
    s = transition(s, { type: "SEARCH_START" });
    expect(s).toBe("loading");
    s = transition(s, { type: "SEARCH_SUCCESS", hasRates: true });
    expect(s).toBe("available");
  });

  it("re-search dari invalid-date / invalid-guests setelah diperbaiki", () => {
    for (const start of ["invalid-date", "invalid-guests"] as const) {
      let s: BookingState = start;
      s = transition(s, { type: "SUBMIT" });
      expect(s).toBe("validating");
      s = transition(s, { type: "SEARCH_START" });
      expect(s).toBe("loading");
      s = transition(s, { type: "SEARCH_SUCCESS", hasRates: false });
      expect(s).toBe("no-availability");
    }
  });
});

describe("validateSearch", () => {
  it("valid", () => {
    expect(
      validateSearch({ checkIn: "2026-09-01", checkOut: "2026-09-03", adults: 2, kids: 1 }),
    ).toBe("ok");
  });

  it("checkout sama/tidak setelah checkin → invalid-date", () => {
    expect(
      validateSearch({ checkIn: "2026-09-01", checkOut: "2026-09-01", adults: 2, kids: 0 }),
    ).toBe("invalid-date");
  });

  it("adults 0 → invalid-guests", () => {
    expect(
      validateSearch({ checkIn: "2026-09-01", checkOut: "2026-09-02", adults: 0, kids: 0 }),
    ).toBe("invalid-guests");
  });
});
