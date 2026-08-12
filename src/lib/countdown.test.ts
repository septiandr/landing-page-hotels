import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown";

describe("formatCountdown", () => {
  it("format lengkap dengan hari", () => {
    const ms =
      2 * 86_400_000 + 4 * 3_600_000 + 12 * 60_000 + 33_000;
    expect(formatCountdown(ms)).toBe("2d 04h 12m 33s");
  });

  it("tanpa hari jika < 24 jam", () => {
    const ms = 4 * 3_600_000 + 5 * 60_000 + 6_000;
    expect(formatCountdown(ms)).toBe("04h 05m 06s");
  });

  it("padding nol", () => {
    expect(formatCountdown(61_000)).toBe("00h 01m 01s");
  });

  it("nol atau negatif → 0h 00m 00s", () => {
    expect(formatCountdown(0)).toBe("0h 00m 00s");
    expect(formatCountdown(-5000)).toBe("0h 00m 00s");
  });
});
