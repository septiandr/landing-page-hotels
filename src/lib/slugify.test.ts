import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("mengubah spasi menjadi dash", () => {
    expect(slugify("Deluxe King Room")).toBe("deluxe-king-room");
  });

  it("menghapus karakter khusus", () => {
    expect(slugify("Honeymoon Package!")).toBe("honeymoon-package");
    expect(slugify("Café & Restaurant")).toBe("cafe-restaurant");
  });

  it("menangani banyak spasi", () => {
    expect(slugify("  Multi   Spaces  ")).toBe("multi-spaces");
  });

  it("menghapus underscore", () => {
    expect(slugify("family_room")).toBe("family-room");
  });
});
