import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("menggabungkan class sederhana", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("mengabaikan nilai falsy", () => {
    expect(cn("a", false && "x", undefined, null, "b")).toBe("a b");
  });

  it("menyelesaikan konflik tailwind (yang terakhir menang)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
