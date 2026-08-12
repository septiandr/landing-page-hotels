import { describe, expect, it } from "vitest";
import { convertCurrency, isCurrency } from "./currency";

describe("currency display (BK-012)", () => {
  it("konversi IDR → USD", () => {
    expect(convertCurrency(1_620_000, "IDR", "USD")).toBe(100);
  });

  it("same currency → tidak berubah", () => {
    expect(convertCurrency(500_000, "IDR", "IDR")).toBe(500_000);
  });

  it("USD → IDR", () => {
    expect(convertCurrency(100, "USD", "IDR")).toBe(1_620_000);
  });

  it("isCurrency validasi kode", () => {
    expect(isCurrency("IDR")).toBe(true);
    expect(isCurrency("JPY")).toBe(false);
  });
});
