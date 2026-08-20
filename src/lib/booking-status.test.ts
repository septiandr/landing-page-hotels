import { describe, expect, it } from "vitest";
import { nextStatus, requiresReason } from "./booking-status";

describe("nextStatus (OSB-005)", () => {
  it("CONFIRMED → CHECKED_IN via CHECK_IN", () => {
    expect(nextStatus("CONFIRMED", "CHECK_IN")).toBe("CHECKED_IN");
  });

  it("CONFIRMED → CANCELLED via CANCEL", () => {
    expect(nextStatus("CONFIRMED", "CANCEL")).toBe("CANCELLED");
  });

  it("CONFIRMED → NO_SHOW via NO_SHOW", () => {
    expect(nextStatus("CONFIRMED", "NO_SHOW")).toBe("NO_SHOW");
  });

  it("CHECKED_IN → CHECKED_OUT via CHECK_OUT", () => {
    expect(nextStatus("CHECKED_IN", "CHECK_OUT")).toBe("CHECKED_OUT");
  });

  it("CHECKED_IN → CANCELLED via CANCEL", () => {
    expect(nextStatus("CHECKED_IN", "CANCEL")).toBe("CANCELLED");
  });

  it("CHECKED_IN tidak bisa CHECK_IN ulang", () => {
    expect(nextStatus("CHECKED_IN", "CHECK_IN")).toBeNull();
  });

  it("terminal tidak menerima aksi", () => {
    expect(nextStatus("CHECKED_OUT", "CANCEL")).toBeNull();
    expect(nextStatus("CANCELLED", "CHECK_IN")).toBeNull();
    expect(nextStatus("NO_SHOW", "CHECK_OUT")).toBeNull();
  });
});

describe("requiresReason (OSB-005)", () => {
  it("CANCEL wajib alasan", () => {
    expect(requiresReason("CANCEL")).toBe(true);
  });
  it("aksi lain tanpa alasan", () => {
    expect(requiresReason("CHECK_IN")).toBe(false);
    expect(requiresReason("CHECK_OUT")).toBe(false);
    expect(requiresReason("NO_SHOW")).toBe(false);
  });
});