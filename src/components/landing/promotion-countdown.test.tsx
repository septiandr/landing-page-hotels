import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { PromotionCountdown } from "./PromotionCountdown";

describe("TEST-003 — PromotionCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("menampilkan sisa waktu format d/h/m/s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T00:00:00Z"));
    render(<PromotionCountdown endsAt="2026-08-14T12:34:56Z" />);
    expect(screen.getByRole("timer")).toHaveTextContent("2d");
    expect(screen.getByRole("timer")).toHaveTextContent("12h");
  });

  it("saat expired → tidak dirender & onExpired dipanggil", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T00:00:00Z"));
    const onExpired = vi.fn();
    render(<PromotionCountdown endsAt="2026-08-12T00:00:10Z" onExpired={onExpired} />);
    expect(screen.getByRole("timer")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(onExpired).toHaveBeenCalled();
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });
});
