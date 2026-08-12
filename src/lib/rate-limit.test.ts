import { afterEach, describe, expect, it, vi } from "vitest";
import { clearFailures, isBlocked, recordFailure } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rate-limit (login failures)", () => {
  it("0 kegagalan → tidak terblokir", () => {
    expect(isBlocked("login:x")).toEqual({ blocked: false, retryAfterSeconds: 0 });
  });

  it("5 kegagalan → terblokir dengan retryAfter > 0", () => {
    for (let i = 0; i < 5; i++) recordFailure("login:k1", 60_000);
    const res = isBlocked("login:k1", 5, 60_000);
    expect(res.blocked).toBe(true);
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
    expect(res.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("4 kegagalan → belum terblokir", () => {
    for (let i = 0; i < 4; i++) recordFailure("login:k2", 60_000);
    expect(isBlocked("login:k2", 5, 60_000).blocked).toBe(false);
  });

  it("setelah window lewat → terblokir di-reset", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) recordFailure("login:k3", 60_000);
    expect(isBlocked("login:k3", 5, 60_000).blocked).toBe(true);

    vi.advanceTimersByTime(61_000);
    expect(isBlocked("login:k3", 5, 60_000)).toEqual({
      blocked: false,
      retryAfterSeconds: 0,
    });
  });

  it("key berbeda tidak saling memengaruhi", () => {
    for (let i = 0; i < 5; i++) recordFailure("login:a", 60_000);
    expect(isBlocked("login:b", 5, 60_000).blocked).toBe(false);
  });

  it("clearFailures mereset blokir", () => {
    for (let i = 0; i < 5; i++) recordFailure("login:k4", 60_000);
    clearFailures("login:k4");
    expect(isBlocked("login:k4", 5, 60_000).blocked).toBe(false);
  });
});
