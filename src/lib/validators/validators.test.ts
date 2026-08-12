import { describe, expect, it } from "vitest";
import {
  createAmenitySchema,
  createGalleryItemSchema,
  createHotelSchema,
  createPromotionSchema,
  createRoomSchema,
  createTestimonialSchema,
  createUserSchema,
  updateRoomSchema,
  type RoomInput,
} from "./index";

describe("common formats", () => {
  it("whatsapp: menerima 62xxx & +62xxx, menolak format lokal", () => {
    const ok = createHotelSchema.safeParse({ name: "Hotel", whatsapp: "6281234567890" });
    expect(ok.success).toBe(true);
    const okPlus = createHotelSchema.safeParse({ name: "Hotel", whatsapp: "+6281234567890" });
    expect(okPlus.success).toBe(true);
    const bad = createHotelSchema.safeParse({ name: "Hotel", whatsapp: "081234567890" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues[0].message).toContain("Format WhatsApp");
    }
  });

  it("email: menolak string bukan email", () => {
    const res = createUserSchema.safeParse({
      name: "Admin",
      email: "bukan-email",
      password: "rahasia123",
    });
    expect(res.success).toBe(false);
  });
});

describe("createRoomSchema", () => {
  it("valid: semua field inti diterima, status default DRAFT", () => {
    const res = createRoomSchema.safeParse({
      slug: "deluxe-king-room",
      name: "Deluxe King Room",
      priceFrom: "850000",
      photos: [{ url: "https://images.example.com/a.jpg", altText: "Kamar" }],
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.status).toBe("DRAFT");
      expect(res.data.breakfastIncluded).toBe(false);
      expect(res.data.priceFrom).toBe(850000);
    }
  });

  it("strict: menolak field tak dikenal", () => {
    const res = createRoomSchema.safeParse({
      slug: "x",
      name: "X",
      hacked: true, // field tak dikenal — harus ditolak strict()
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      // Zod v4 melaporkan field tak dikenal via properti `keys` di root
      expect(JSON.stringify(res.error.issues[0])).toContain("hacked");
    }
  });

  it("slug: hanya huruf kecil + angka + strip", () => {
    expect(createRoomSchema.safeParse({ slug: "Deluxe Room", name: "X" }).success).toBe(false);
    expect(createRoomSchema.safeParse({ slug: "deluxe_room", name: "X" }).success).toBe(false);
    expect(createRoomSchema.safeParse({ slug: "deluxe-room-2", name: "X" }).success).toBe(true);
  });

  it("required: nama wajib, harga tidak boleh negatif", () => {
    const missing = createRoomSchema.safeParse({ slug: "a" });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.issues.some((i) => i.message === "Wajib diisi")).toBe(true);
    }
    const neg = createRoomSchema.safeParse({ slug: "a", name: "X", priceFrom: -5 });
    expect(neg.success).toBe(false);
  });

  it("update: partial — hanya slug boleh", () => {
    const res = updateRoomSchema.safeParse({ slug: "family-room" });
    expect(res.success).toBe(true);
  });

  it("type inference: RoomInput tersedia (digunakan form & handler)", () => {
    const input: RoomInput = createRoomSchema.parse({ slug: "x", name: "X" });
    expect(input.name).toBe("X");
  });
});

describe("createPromotionSchema", () => {
  it("valid: input inti diterima", () => {
    const res = createPromotionSchema.safeParse({ title: "Stay 3 Nights" });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.status).toBe("DRAFT");
      expect(res.data.ctaLabel).toBe("Book Now");
    }
  });

  it("refine: bookingStart harus sebelum bookingEnd", () => {
    const res = createPromotionSchema.safeParse({
      title: "Promo",
      bookingStart: new Date("2026-09-10"),
      bookingEnd: new Date("2026-09-01"),
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].path).toEqual(["bookingEnd"]);
    }
  });

  it("status: enum invalid ditolak", () => {
    const res = createPromotionSchema.safeParse({ title: "Promo", status: "ON_FIRE" });
    expect(res.success).toBe(false);
  });
});

describe("entity schemas", () => {
  it("gallery: image wajib + altText wajib", () => {
    expect(
      createGalleryItemSchema.safeParse({ image: "https://x.test/a.jpg", altText: "Foto" }).success,
    ).toBe(true);
    expect(createGalleryItemSchema.safeParse({ altText: "Foto" }).success).toBe(false);
  });

  it("gallery: category enum (SURROUNDINGS valid, 'misc' ditolak)", () => {
    expect(
      createGalleryItemSchema.safeParse({
        image: "https://x.test/a.jpg",
        altText: "Foto",
        category: "SURROUNDINGS",
      }).success,
    ).toBe(true);
    expect(
      createGalleryItemSchema.safeParse({ image: "https://x.test/a.jpg", altText: "Foto", category: "misc" }).success,
    ).toBe(false);
  });

  it("testimonial: rating 1..5", () => {
    expect(createTestimonialSchema.safeParse({ guestName: "A", review: "Bagus", rating: 6 }).success).toBe(false);
    expect(createTestimonialSchema.safeParse({ guestName: "A", review: "Bagus", rating: 5 }).success).toBe(true);
  });

  it("amenity: group default HOTEL, nama wajib", () => {
    const res = createAmenitySchema.safeParse({ name: "Pool" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.group).toBe("HOTEL");
    expect(createAmenitySchema.safeParse({}).success).toBe(false);
  });

  it("user: password minimal 8 karakter", () => {
    const res = createUserSchema.safeParse({
      name: "Admin",
      email: "admin@example.com",
      password: "1234567",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain("minimal 8");
    }
  });

  it("user: role default EDITOR", () => {
    const res = createUserSchema.safeParse({
      name: "Editor",
      email: "editor@example.com",
      password: "rahasia123",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.role).toBe("EDITOR");
  });

  it("image: path lokal upload diterima (imageUrlOrPath)", () => {
    const res = createGalleryItemSchema.safeParse({
      image: "/uploads/foto-hotel.jpg",
      altText: "Foto",
    });
    expect(res.success).toBe(true);
  });

  it("time: format HH:MM diverifikasi (hotel checkInTime)", () => {
    expect(createHotelSchema.safeParse({ name: "H", whatsapp: "6281234567890", checkInTime: "14:00" }).success).toBe(true);
    expect(createHotelSchema.safeParse({ name: "H", whatsapp: "6281234567890", checkInTime: "25:00" }).success).toBe(false);
  });
});

describe("form-normalization helpers", () => {
  it("optionalString: string kosong dinormalisasi jadi null", () => {
    const res = createRoomSchema.safeParse({ slug: "x", name: "X", description: "" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.description).toBeNull();
  });

  it("coerceBool: string \"false\" dari form jadi false", () => {
    const res = createRoomSchema.safeParse({ slug: "x", name: "X", breakfastIncluded: "false" });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.breakfastIncluded).toBe(false);
  });
});

describe("update schema tidak me-reset field ber-default (regression)", () => {
  it("updateRoomSchema.parse({name}) tidak menyisipkan currency/status/sortOrder", () => {
    const parsed = updateRoomSchema.parse({ name: "Nama Baru" });
    expect(parsed).not.toHaveProperty("currency");
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("breakfastIncluded");
    expect(parsed).not.toHaveProperty("sortOrder");
  });

  it("room photo tanpa altText ditolak (altText wajib di Prisma)", () => {
    const res = createRoomSchema.safeParse({
      slug: "x",
      name: "X",
      photos: [{ url: "https://images.example.com/a.jpg" }],
    });
    expect(res.success).toBe(false);
  });
});
