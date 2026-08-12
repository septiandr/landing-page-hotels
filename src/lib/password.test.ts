import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifyPassword benar untuk hash yang cocok", async () => {
    const hash = await hashPassword("changeme123");
    expect(hash).not.toContain("changeme123"); // tidak pernah plaintext
    expect(await verifyPassword("changeme123", hash)).toBe(true);
  });

  it("verifyPassword false untuk password salah", async () => {
    const hash = await hashPassword("changeme123");
    expect(await verifyPassword("salah", hash)).toBe(false);
  });

  it("hash unik per password (salt)", async () => {
    const a = await hashPassword("changeme123");
    const b = await hashPassword("changeme123");
    expect(a).not.toBe(b);
  });
});
