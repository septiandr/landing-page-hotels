import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Amenities } from "./Amenities";
import type { Amenity } from "@/generated/prisma/client";

const amenities = [
  { id: "a1", name: "Swimming Pool", icon: "Waves", description: null, group: "HOTEL", sortOrder: 1, image: null },
  { id: "a2", name: "Restaurant", icon: "UtensilsCrossed", description: "Menu lokal & internasional", group: "HOTEL", sortOrder: 2, image: null },
  { id: "a3", name: "Air Conditioning", icon: "Snowflake", description: null, group: "ROOM", sortOrder: 1, image: null },
] as unknown as Amenity[];

describe("Amenities", () => {
  it("menampilkan kedua group dengan labelnya", () => {
    render(<Amenities amenities={amenities} />);
    expect(screen.getByRole("heading", { name: "Hotel Facilities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Room Facilities" })).toBeInTheDocument();
  });

  it("menampilkan item di group yang benar", () => {
    render(<Amenities amenities={amenities} />);
    expect(screen.getByText("Swimming Pool")).toBeInTheDocument();
    expect(screen.getByText("Air Conditioning")).toBeInTheDocument();
    expect(screen.getByText("Menu lokal & internasional")).toBeInTheDocument();
  });

  it("mengembalikan null jika tidak ada data", () => {
    const { container } = render(<Amenities amenities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
