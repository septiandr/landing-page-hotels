import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, getNights, parseDateRange } from "./format";

describe("getNights", () => {
  it("menghitung malam dengan benar untuk rentang valid", () => {
    expect(getNights("2026-08-12", "2026-08-15")).toBe(3);
  });

  it("mengembalikan 0 untuk tanggal yang sama", () => {
    expect(getNights("2026-08-12", "2026-08-12")).toBe(0);
  });

  it("mengembalikan negatif jika check-out sebelum check-in", () => {
    expect(getNights("2026-08-15", "2026-08-12")).toBe(-3);
  });

  it("mengembalikan 0 untuk tanggal invalid", () => {
    expect(getNights("bukan-tanggal", "2026-08-12")).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("memformat IDR tanpa desimal", () => {
    const result = formatCurrency(850000, "IDR");
    expect(result).toContain("Rp");
    expect(result).toContain("850.000");
  });

  it("memformat USD dengan desimal", () => {
    expect(formatCurrency(108, "USD")).toBe("$108.00");
  });

  it("default ke IDR", () => {
    expect(formatCurrency(1000)).toContain("Rp");
  });
});

describe("formatDate", () => {
  it("memformat tanggal dengan locale id", () => {
    // date-fns v4 memakai singkatan "Agt" untuk Agustus.
    expect(formatDate("2026-08-12")).toBe("12 Agt 2026");
  });

  it("mengembalikan string kosong untuk tanggal invalid", () => {
    expect(formatDate("invalid")).toBe("");
  });
});

describe("parseDateRange", () => {
  it("mengembalikan rentang valid dari search params", () => {
    const range = parseDateRange({ checkin: "2026-09-01", checkout: "2026-09-03" });
    expect(range).not.toBeNull();
    // parseISO menghasilkan waktu lokal — bandingkan jumlah malam, bukan string UTC.
    expect(getNights(range!.checkIn, range!.checkOut)).toBe(2);
  });

  it("mengembalikan null jika checkout <= checkin", () => {
    expect(parseDateRange({ checkin: "2026-09-03", checkout: "2026-09-01" })).toBeNull();
  });

  it("mengembalikan null jika param hilang", () => {
    expect(parseDateRange({})).toBeNull();
    expect(parseDateRange({ checkin: "2026-09-01" })).toBeNull();
  });
});
