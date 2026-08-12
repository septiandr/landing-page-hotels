import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomCard, type RoomWithRelations } from "./RoomCard";

const room = {
  id: "r1",
  slug: "deluxe-king-room",
  name: "Deluxe King Room",
  description: "Kamar nyaman dengan king bed.",
  sizeM2: 32,
  maxOccupancy: 2,
  bedType: "King",
  bedCount: 1,
  view: "City View",
  priceFrom: 850000,
  currency: "IDR",
  breakfastIncluded: true,
  status: "PUBLISHED",
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  photos: [
    { id: "p1", roomId: "r1", url: "https://example.com/a.jpg", altText: "Foto kamar", sortOrder: 1 },
  ],
  amenities: [
    { id: "a1", roomId: "r1", name: "Free WiFi", icon: "Wifi" },
    { id: "a2", roomId: "r1", name: "AC", icon: null },
  ],
} as unknown as RoomWithRelations;

describe("RoomCard", () => {
  it("menampilkan nama, ukuran, dan harga", () => {
    render(<RoomCard room={room} />);
    expect(screen.getByRole("heading", { name: "Deluxe King Room" })).toBeInTheDocument();
    expect(screen.getByText("32 m²")).toBeInTheDocument();
    expect(screen.getByText(/850\.000/)).toBeInTheDocument();
  });

  it("menampilkan amenity chips dan CTA dengan link benar", () => {
    render(<RoomCard room={room} />);
    expect(screen.getByText("Free WiFi")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Room" })).toHaveAttribute(
      "href",
      "/rooms/deluxe-king-room",
    );
    const availabilityHref = screen.getByRole("link", { name: "Check Availability" }).getAttribute("href");
    expect(availabilityHref).toMatch(/room=deluxe-king-room/);
  });
});
