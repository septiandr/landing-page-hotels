import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BookingWidget } from "./BookingWidget";
import type { AvailabilityResponse, RateOption } from "@/lib/booking-engine/types";

// jsdom tidak punya IntersectionObserver — stub yang dipakai widget untuk track view.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

function toDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const in7 = toDateInput(new Date(Date.now() + 7 * 86400000));
const in9 = toDateInput(new Date(Date.now() + 9 * 86400000));

const rates: RateOption[] = [
  {
    roomId: "r1",
    roomName: "Deluxe King Room",
    pricePerNight: 850000,
    currency: "IDR",
    totalPrice: 1700000,
    available: true,
    taxIncluded: false,
  },
];

function mockFetchOk(data: AvailabilityResponse) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data }),
  });
}

describe("TEST-003 — BookingWidget", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = mockFetchOk({ rates });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("open", vi.fn());
    window.history.replaceState({}, "", "/");
  });

  it("render dasar: judul, tanggal, stepper", () => {
    render(<BookingWidget />);
    expect(screen.getByRole("heading", { name: "Book Your Stay" })).toBeInTheDocument();
    expect(screen.getByLabelText("Check-in")).toBeInTheDocument();
    expect(screen.getByLabelText("Check-out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check Availability" })).toBeInTheDocument();
  });

  it("submit kosong → pesan validasi muncul (state invalid)", () => {
    render(<BookingWidget />);
    fireEvent.click(screen.getByRole("button", { name: "Check Availability" }));
    expect(screen.getByText(/Periksa kembali tanggal & jumlah tamu/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pre-fill dari URL shareable (BK-011)", async () => {
    window.history.replaceState({}, "", `/?checkin=${in7}&checkout=${in9}&adults=3&kids=1&rooms=2`);
    render(<BookingWidget />);
    await waitFor(() => {
      expect(screen.getByLabelText("Check-in")).toHaveValue(in7);
    });
    expect(screen.getByLabelText("Check-out")).toHaveValue(in9);
  });

  it("search valid → fetch /api/availability → rate tampil", async () => {
    render(<BookingWidget />);
    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: in7 } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: in9 } });
    fireEvent.click(screen.getByRole("button", { name: "Check Availability" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/availability")),
    );
    expect(String(fetchMock.mock.calls[0][0])).toContain(`checkin=${in7}`);
    expect(String(fetchMock.mock.calls[0][0])).toContain("adults=2");

    await waitFor(() =>
      expect(screen.getByText("Deluxe King Room")).toBeInTheDocument(),
    );
    // Book CTA muncul setelah pilih kamar
    fireEvent.click(screen.getByRole("button", { name: /Deluxe King Room/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Book Now/ })).toBeInTheDocument(),
    );
  });

  it("tidak ada kamar → state no-availability dengan CTA Change Dates", async () => {
    vi.stubGlobal("fetch", mockFetchOk({ rates: [] }));
    render(<BookingWidget />);
    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: in7 } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: in9 } });
    fireEvent.click(screen.getByRole("button", { name: "Check Availability" }));

    await waitFor(() =>
      expect(screen.getByText(/Tidak ada kamar tersedia/)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Change Dates/ })).toBeInTheDocument();
  });

  it("engine error → fallback WhatsApp/Call (BK-007)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => null }));
    render(<BookingWidget whatsapp="6281234567890" phone="+62274555123" />);
    fireEvent.change(screen.getByLabelText("Check-in"), { target: { value: in7 } });
    fireEvent.change(screen.getByLabelText("Check-out"), { target: { value: in9 } });
    fireEvent.click(screen.getByRole("button", { name: "Check Availability" }));

    await waitFor(() =>
      expect(screen.getByText(/Sedang terkendala|kendala|WhatsApp/i)).toBeInTheDocument(),
    );
  });
});
