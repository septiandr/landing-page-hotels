import { describe, expect, it } from "vitest";
import { createAwardSchema } from "./award";
import { createTransportSchema } from "./transport";

describe("createAwardSchema", () => {
  it("valid tanpa optional", () => {
    const result = createAwardSchema.safeParse({ name: "Travelers' Choice" });
    expect(result.success).toBe(true);
  });

  it("tolak tanpa name", () => {
    const result = createAwardSchema.safeParse({ issuer: "TripAdvisor", year: 2025 });
    expect(result.success).toBe(false);
  });

  it("coerce year & sortOrder dari string", () => {
    const result = createAwardSchema.safeParse({ name: "A", year: "2025", sortOrder: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year).toBe(2025);
      expect(result.data.sortOrder).toBe(3);
    }
  });

  it("tolak tahun di luar rentang", () => {
    expect(createAwardSchema.safeParse({ name: "A", year: 1899 }).success).toBe(false);
    expect(createAwardSchema.safeParse({ name: "A", year: 2101 }).success).toBe(false);
  });
});

describe("createTransportSchema", () => {
  it("valid lengkap", () => {
    const result = createTransportSchema.safeParse({
      title: "Airport Transfer",
      priceFrom: 150000,
      ctaUrl: "https://wa.me/6281234567890?text=Halo",
    });
    expect(result.success).toBe(true);
  });

  it("tolak tanpa title", () => {
    expect(createTransportSchema.safeParse({ icon: "Plane" }).success).toBe(false);
  });

  it("tolak ctaUrl bukan URL", () => {
    const result = createTransportSchema.safeParse({
      title: "X",
      ctaUrl: "wa.me/6281",
    });
    expect(result.success).toBe(false);
  });

  it("ctaUrl opsional", () => {
    const result = createTransportSchema.safeParse({ title: "Taxi" });
    expect(result.success).toBe(true);
  });
});
