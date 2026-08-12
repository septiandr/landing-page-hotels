import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Gallery } from "./Gallery";
import type { GalleryItem } from "@/generated/prisma/client";

const items = [
  { id: "g1", image: "https://example.com/room.jpg", altText: "Kamar deluxe", caption: null, category: "ROOMS", status: "PUBLISHED", sortOrder: 1, thumb: null, createdAt: new Date() },
  { id: "g2", image: "https://example.com/pool.jpg", altText: "Kolam renang", caption: "Kolam utama", category: "FACILITIES", status: "PUBLISHED", sortOrder: 2, thumb: null, createdAt: new Date() },
  { id: "g3", image: "https://example.com/dining.jpg", altText: "Restoran", caption: null, category: "DINING", status: "PUBLISHED", sortOrder: 3, thumb: null, createdAt: new Date() },
  { id: "g4", image: "https://example.com/ext.jpg", altText: "Eksterior hotel", caption: null, category: "EXTERIOR", status: "PUBLISHED", sortOrder: 4, thumb: null, createdAt: new Date() },
] as unknown as GalleryItem[];

describe("Gallery", () => {
  it("menampilkan semua foto + semua chip kategori", () => {
    render(<Gallery items={items} />);
    expect(screen.getByRole("button", { name: "Lihat foto: Kamar deluxe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat foto: Kolam renang" })).toBeInTheDocument();
    for (const cat of ["ALL", "ROOMS", "FACILITIES", "DINING", "EXTERIOR"]) {
      expect(screen.getByRole("button", { name: cat })).toBeInTheDocument();
    }
  });

  it("memfilter grid saat kategori diklik", async () => {
    const user = userEvent.setup();
    render(<Gallery items={items} />);
    await user.click(screen.getByRole("button", { name: "DINING" }));
    expect(screen.getByRole("button", { name: "Lihat foto: Restoran" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat foto: Kamar deluxe" })).not.toBeInTheDocument();
  });

  it("membuka lightbox saat foto diklik dan menutup dengan Escape", async () => {
    const user = userEvent.setup();
    render(<Gallery items={items} />);
    await user.click(screen.getByRole("button", { name: "Lihat foto: Kolam renang" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Kolam utama")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
