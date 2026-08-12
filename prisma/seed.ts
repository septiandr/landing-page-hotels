import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  ContentStatus,
  PromotionStatus,
  Role,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Placeholder images (unsplash) — diganti foto asli hotel saat content ready.
const IMG = {
  pool: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  lobby: "https://images.unsplash.com/photo-1601918774946-25832a4f0df6?auto=format&fit=crop&w=1200&q=80",
  room1: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  room2: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
  family: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
  suite: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80",
  exterior: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  spa: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
  dining: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  bath: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
  malioboro: "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=800&q=80",
  temple: "https://images.unsplash.com/photo-1603046891744-1f76eb10a3e2?auto=format&fit=crop&w=800&q=80",
};

const daysFromNow = (days: number, hour = 10): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  // Pengaman: seed bersifat destruktif (delete semua data) — dilarang di production.
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    throw new Error(
      "Seed dilarang di production. Set ALLOW_PROD_SEED=true hanya jika benar-benar yakin.",
    );
  }

  console.log("🌱 Seeding database...");

  // ---------- Reset (idempotent) ----------
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.seoMeta.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.roomPhoto.deleteMany();
  await prisma.roomAmenity.deleteMany();
  await prisma.room.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.review.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.attraction.deleteMany();
  await prisma.faqItem.deleteMany();

  // ---------- Users (CMS) ----------
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await prisma.user.createMany({
    data: [
      { name: "Admin Hotel", email: "admin@example.com", passwordHash, role: Role.ADMIN },
      { name: "Marketing Staff", email: "editor@example.com", passwordHash, role: Role.EDITOR },
    ],
  });
  console.log("  ✔ users (admin@example.com / editor@example.com, pass: changeme123)");

  // ---------- Hotel + SEO ----------
  const hotel = await prisma.hotel.create({
    data: {
      name: "Taman Sari Heritage Hotel",
      logo: IMG.lobby,
      tagline: "A peaceful escape surrounded by comfort, culture and unforgettable experiences.",
      description:
        "Hotel heritage di jantung Yogyakarta yang memadukan kenyamanan modern dengan pengalaman lokal yang autentik.",
      story:
        "Lebih dari sekadar tempat menginap. Terletak di pusat kota Yogyakarta, hotel kami memadukan kenyamanan modern dengan pengalaman lokal yang otentik — arsitektur Jawa klasik, keramahan khas Yogyakarta, dan fasilitas masa kini.",
      address: "Jl. Malioboro No. 123, Yogyakarta 55213",
      phone: "+62 274 555 123",
      email: "stay@tamansariheritage.id",
      whatsapp: "6281234567890",
      socialLinks: { instagram: "https://instagram.com/tamansariheritage", facebook: "https://facebook.com/tamansariheritage" },
      lat: -7.7916,
      lng: 110.3666,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      currency: "IDR",
      seo: {
        create: {
          metaTitle: "Taman Sari Heritage Hotel | Hotel Bersejarah di Yogyakarta",
          metaDescription:
            "Hotel heritage di pusat Yogyakarta — 5 menit dari Malioboro. Book langsung dan dapatkan Best Available Rate, free breakfast, dan benefit eksklusif.",
          ogTitle: "Taman Sari Heritage Hotel — Book Direct & Get More",
          ogDescription: "Best Available Rate, free breakfast, welcome drink, dan flexible cancellation saat booking langsung.",
          ogImage: IMG.exterior,
          canonicalUrl: "https://tamansariheritage.id/",
        },
      },
    },
  });
  console.log("  ✔ hotel + seo");

  // ---------- Rooms ----------
  const roomAmenityNames = ["Free WiFi", "Air Conditioning", "Smart TV", "Safe", "Coffee Machine"];

  const rooms = [
    {
      slug: "deluxe-king-room",
      name: "Deluxe King Room",
      description:
        "Kamar nyaman dengan king bed, pemandangan kota Yogyakarta, dan fasilitas lengkap untuk istirahat maksimal.",
      sizeM2: 32,
      maxOccupancy: 2,
      bedType: "King",
      bedCount: 1,
      view: "City View",
      priceFrom: 850000,
      breakfastIncluded: true,
      status: ContentStatus.PUBLISHED,
      sortOrder: 1,
      photos: [
        { url: IMG.room1, altText: "Deluxe King Room dengan king bed", sortOrder: 1 },
        { url: IMG.bath, altText: "Bathroom Deluxe King Room", sortOrder: 2 },
      ],
    },
    {
      slug: "deluxe-twin-room",
      name: "Deluxe Twin Room",
      description: "Dua twin bed yang nyaman — cocok untuk perjalanan bersama teman atau rekan kerja.",
      sizeM2: 32,
      maxOccupancy: 2,
      bedType: "Twin",
      bedCount: 2,
      view: "City View",
      priceFrom: 850000,
      breakfastIncluded: true,
      status: ContentStatus.PUBLISHED,
      sortOrder: 2,
      photos: [{ url: IMG.room2, altText: "Deluxe Twin Room dengan dua twin bed", sortOrder: 1 }],
    },
    {
      slug: "family-room",
      name: "Family Room",
      description: "Kamar luas untuk keluarga — king bed + twin bed, pemandangan kolam renang.",
      sizeM2: 48,
      maxOccupancy: 4,
      bedType: "King + Twin",
      bedCount: 2,
      view: "Pool View",
      priceFrom: 1350000,
      breakfastIncluded: true,
      status: ContentStatus.PUBLISHED,
      sortOrder: 3,
      photos: [{ url: IMG.family, altText: "Family Room yang luas", sortOrder: 1 }],
    },
    {
      slug: "heritage-suite",
      name: "Heritage Suite",
      description: "Suite eksklusif dengan sentuhan arsitektur Jawa, taman pribadi, dan layanan butler.",
      sizeM2: 60,
      maxOccupancy: 3,
      bedType: "King",
      bedCount: 1,
      view: "Garden View",
      priceFrom: 1850000,
      breakfastIncluded: true,
      status: ContentStatus.DRAFT,
      sortOrder: 4,
      photos: [{ url: IMG.suite, altText: "Heritage Suite dengan nuansa Jawa", sortOrder: 1 }],
    },
  ] as const;

  for (const room of rooms) {
    await prisma.room.create({
      data: {
        slug: room.slug,
        name: room.name,
        description: room.description,
        sizeM2: room.sizeM2,
        maxOccupancy: room.maxOccupancy,
        bedType: room.bedType,
        bedCount: room.bedCount,
        view: room.view,
        priceFrom: room.priceFrom,
        breakfastIncluded: room.breakfastIncluded,
        status: room.status,
        sortOrder: room.sortOrder,
        photos: { create: [...room.photos] },
        amenities: {
          create: roomAmenityNames.map((name) => ({ name, icon: "Wifi" })),
        },
      },
    });
  }
  console.log("  ✔ 4 rooms");

  // ---------- Amenities ----------
  await prisma.amenity.createMany({
    data: [
      { name: "Swimming Pool", icon: "Waves", group: "HOTEL", sortOrder: 1 },
      { name: "Restaurant", icon: "UtensilsCrossed", group: "HOTEL", sortOrder: 2 },
      { name: "Spa", icon: "Flower2", group: "HOTEL", sortOrder: 3 },
      { name: "Gym", icon: "Dumbbell", group: "HOTEL", sortOrder: 4 },
      { name: "Parking", icon: "Car", group: "HOTEL", sortOrder: 5 },
      { name: "Free WiFi", icon: "Wifi", group: "HOTEL", sortOrder: 6 },
      { name: "Meeting Room", icon: "Presentation", group: "HOTEL", sortOrder: 7 },
      { name: "Airport Transfer", icon: "Plane", group: "HOTEL", sortOrder: 8 },
      { name: "Air Conditioning", icon: "Snowflake", group: "ROOM", sortOrder: 1 },
      { name: "Smart TV", icon: "Tv", group: "ROOM", sortOrder: 2 },
      { name: "Refrigerator", icon: "Refrigerator", group: "ROOM", sortOrder: 3 },
      { name: "Safe", icon: "Shield", group: "ROOM", sortOrder: 4 },
      { name: "Hair Dryer", icon: "Wind", group: "ROOM", sortOrder: 5 },
      { name: "Coffee Machine", icon: "Coffee", group: "ROOM", sortOrder: 6 },
    ],
  });
  console.log("  ✔ amenities");

  // ---------- Gallery ----------
  await prisma.galleryItem.createMany({
    data: [
      { image: IMG.pool, altText: "Kolam renang hotel", category: "FACILITIES", status: ContentStatus.PUBLISHED, sortOrder: 1 },
      { image: IMG.room1, altText: "Deluxe King Room", category: "ROOMS", status: ContentStatus.PUBLISHED, sortOrder: 2 },
      { image: IMG.dining, altText: "Restoran hotel", category: "DINING", status: ContentStatus.PUBLISHED, sortOrder: 3 },
      { image: IMG.exterior, altText: "Eksterior hotel", category: "EXTERIOR", status: ContentStatus.PUBLISHED, sortOrder: 4 },
      { image: IMG.lobby, altText: "Lobi hotel", category: "EXTERIOR", status: ContentStatus.PUBLISHED, sortOrder: 5 },
      { image: IMG.spa, altText: "Area spa", category: "FACILITIES", status: ContentStatus.PUBLISHED, sortOrder: 6 },
      { image: IMG.malioboro, altText: "Malioboro Yogyakarta", category: "SURROUNDINGS", status: ContentStatus.PUBLISHED, sortOrder: 7 },
    ],
  });
  console.log("  ✔ gallery");

  // ---------- Promotions ----------
  await prisma.promotion.createMany({
    data: [
      {
        title: "Stay 3 Nights, Get 1 Night Free",
        description: "Book 3 malam dan dapatkan 1 malam gratis. Berlaku untuk semua tipe kamar.",
        image: IMG.pool,
        discountLabel: "3+1",
        promoCode: "STAY3FREE",
        bookingStart: daysFromNow(-5),
        bookingEnd: daysFromNow(30),
        terms: "Berlaku untuk booking langsung di website. Tidak dapat digabung dengan promo lain.",
        status: PromotionStatus.ACTIVE,
        showCountdown: true,
        sortOrder: 1,
      },
      {
        title: "15% Off Weekend Stay",
        description: "Hemat 15% untuk menginap akhir pekan (Jumat–Minggu).",
        image: IMG.room1,
        discountLabel: "15% OFF",
        promoCode: "WEEKEND15",
        bookingStart: daysFromNow(7),
        bookingEnd: daysFromNow(45),
        terms: "Minimum 2 malam. Berlaku Jumat–Minggu.",
        status: PromotionStatus.SCHEDULED,
        showCountdown: false,
        sortOrder: 2,
      },
      {
        title: "Honeymoon Package",
        description: "Paket honeymoon: welcome drink, dekorasi kamar, dan late check-out.",
        image: IMG.suite,
        discountLabel: "Special",
        status: PromotionStatus.DRAFT,
        showCountdown: false,
        sortOrder: 3,
      },
    ],
  });
  console.log("  ✔ promotions");

  // ---------- Testimonials & Reviews ----------
  await prisma.testimonial.createMany({
    data: [
      {
        guestName: "Sarah Wijaya",
        country: "Indonesia",
        rating: 5,
        review: "Hotel yang indah, lokasinya dekat Malioboro. Booking langsung sangat mudah dan dapat harga terbaik!",
        source: "Google",
        status: ContentStatus.PUBLISHED,
        publishedAt: daysFromNow(-10),
      },
      {
        guestName: "David Chen",
        country: "Singapore",
        rating: 5,
        review: "Beautiful heritage hotel with excellent breakfast. The direct booking rate was better than any OTA.",
        source: "Booking.com",
        status: ContentStatus.PUBLISHED,
        publishedAt: daysFromNow(-20),
      },
      {
        guestName: "Anita Pratama",
        country: "Indonesia",
        rating: 4,
        review: "Kamar nyaman dan bersih, kolam renangnya bagus. Recommended untuk staycation keluarga.",
        source: "TripAdvisor",
        status: ContentStatus.PUBLISHED,
        publishedAt: daysFromNow(-32),
      },
      {
        guestName: "Michael Taylor",
        country: "Australia",
        rating: 5,
        review: "Draft testimonial — pengalaman honeymoon kami luar biasa!",
        source: "Google",
        status: ContentStatus.DRAFT,
      },
    ],
  });

  await prisma.review.createMany({
    data: [
      { source: "Google", rating: 4.8, count: 1284, url: "https://maps.google.com" },
      { source: "Booking.com", rating: 9.1, count: 876, url: "https://booking.com" },
      { source: "TripAdvisor", rating: 4.5, count: 372, url: "https://tripadvisor.com" },
    ],
  });
  console.log("  ✔ testimonials + reviews");

  // ---------- Experiences ----------
  await prisma.experience.createMany({
    data: [
      {
        title: "Sunset Dinner at Rooftop",
        description: "Makan malam romantis dengan pemandangan sunset Yogyakarta.",
        image: IMG.dining,
        duration: "2 hours",
        priceFrom: 450000,
        status: ContentStatus.PUBLISHED,
        sortOrder: 1,
      },
      {
        title: "Traditional Cooking Class",
        description: "Belajar memasak hidangan khas Yogyakarta bersama chef lokal.",
        image: IMG.dining,
        duration: "3 hours",
        priceFrom: 350000,
        status: ContentStatus.PUBLISHED,
        sortOrder: 2,
      },
      {
        title: "Spa & Wellness Day",
        description: "Paket relaksasi lengkap: massage, facial, dan akses spa pool.",
        image: IMG.spa,
        duration: "Full day",
        priceFrom: 550000,
        status: ContentStatus.PUBLISHED,
        sortOrder: 3,
      },
    ],
  });
  console.log("  ✔ experiences");

  // ---------- Direct Booking Benefits ----------
  await prisma.benefit.createMany({
    data: [
      { icon: "BadgePercent", title: "Best Available Rate", description: "Harga terbaik langsung dari hotel, tanpa komisi OTA.", sortOrder: 1 },
      { icon: "Coffee", title: "Free Breakfast", description: "Sarapan gratis untuk setiap booking langsung.", sortOrder: 2 },
      { icon: "Wine", title: "Welcome Drink", description: "Minuman sambutan khas Yogyakarta saat check-in.", sortOrder: 3 },
      { icon: "CalendarCheck2", title: "Flexible Cancellation", description: "Ubah atau batalkan reservasi lebih fleksibel.", sortOrder: 4 },
      { icon: "Clock3", title: "Early Check-in", description: "Early check-in & late check-out sesuai ketersediaan.", sortOrder: 5 },
      { icon: "Gift", title: "Exclusive Offers", description: "Akses promo khusus yang hanya ada di website resmi.", sortOrder: 6 },
    ],
  });
  console.log("  ✔ benefits");

  // ---------- Attractions ----------
  await prisma.attraction.createMany({
    data: [
      { name: "Malioboro", description: "Jalan legendaris pusat oleh-oleh dan kuliner Yogyakarta.", category: "Shopping", distanceKm: 0.5, travelTimeMin: 10, image: IMG.malioboro, sortOrder: 1 },
      { name: "Keraton Yogyakarta", description: "Istana Kesultanan Yogyakarta dengan museum budaya Jawa.", category: "Cultural", distanceKm: 1.2, travelTimeMin: 15, sortOrder: 2 },
      { name: "Candi Prambanan", description: "Kompleks candi Hindu terbesar di Indonesia.", category: "Cultural", distanceKm: 17, travelTimeMin: 40, image: IMG.temple, sortOrder: 3 },
      { name: "Bandara Yogyakarta International", description: "Bandara utama Yogyakarta (YIA).", category: "Transport", distanceKm: 40, travelTimeMin: 60, sortOrder: 4 },
    ],
  });
  console.log("  ✔ attractions");

  // ---------- FAQ ----------
  await prisma.faqItem.createMany({
    data: [
      { question: "Bagaimana cara memesan kamar?", answer: "Gunakan widget booking di halaman utama, pilih tanggal dan jumlah tamu, lalu klik Check Availability. Anda juga bisa hubungi kami via WhatsApp.", category: "BOOKING", sortOrder: 1 },
      { question: "Bisakah saya membatalkan atau mengubah reservasi?", answer: "Ya, tergantung kebijakan pembatalan rate yang dipilih. Booking langsung umumnya mendapat kebijakan pembatalan fleksibel.", category: "BOOKING", sortOrder: 2 },
      { question: "Apakah sarapan sudah termasuk?", answer: "Sebagian besar rate sudah termasuk sarapan. Cek detail rate saat booking.", category: "HOTEL", sortOrder: 3 },
      { question: "Jam check-in dan check-out?", answer: "Check-in mulai pukul 14.00 dan check-out maksimal pukul 12.00.", category: "HOTEL", sortOrder: 4 },
      { question: "Apakah tersedia parkir?", answer: "Ya, tersedia area parkir gratis untuk tamu hotel.", category: "FACILITIES", sortOrder: 5 },
      { question: "Apakah WiFi gratis?", answer: "Ya, WiFi gratis tersedia di seluruh area hotel.", category: "FACILITIES", sortOrder: 6 },
      { question: "Apakah anak-anak diperbolehkan?", answer: "Ya, anak-anak diperbolehkan. Family Room tersedia untuk 4 orang.", category: "FAMILY", sortOrder: 7 },
      { question: "Apakah tersedia extra bed?", answer: "Ya, extra bed tersedia dengan biaya tambahan. Hubungi resepsionis untuk reservasi.", category: "FAMILY", sortOrder: 8 },
    ],
  });
  console.log("  ✔ faq");

  console.log("✅ Seed selesai. Hotel:", hotel.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
