import {
  AMENITY_GROUPS,
  CONTENT_STATUSES,
  FAQ_CATEGORIES,
  createAmenitySchema,
  createAttractionSchema,
  createAwardSchema,
  createExperienceSchema,
  createFaqItemSchema,
  createTestimonialSchema,
  createTransportSchema,
  updateAmenitySchema,
  updateAttractionSchema,
  updateAwardSchema,
  updateExperienceSchema,
  updateFaqItemSchema,
  updateTestimonialSchema,
  updateTransportSchema,
} from "@/lib/validators";
import type { CrudModuleConfig } from "./crud-config";
import { ImageCell, MoneyCell, StarsCell } from "./cell-helpers";

const statusOptions = CONTENT_STATUSES.map((s) => ({ label: s, value: s }));

/* ---------- Testimonials ---------- */

export const testimonialConfig: CrudModuleConfig = {
  title: "Testimonials",
  entityLabel: "Testimoni",
  apiPath: "/api/admin/testimonials",
  pagePath: "/admin/testimonials",
  searchFields: ["guestName", "review"],
  statusField: "status",
  filter: { param: "status", label: "Status", options: statusOptions },
  createSchema: createTestimonialSchema,
  updateSchema: updateTestimonialSchema,
  fields: [
    { name: "guestName", label: "Nama Tamu", type: "text", required: true },
    { name: "country", label: "Negara", type: "text" },
    { name: "rating", label: "Rating", type: "number", min: 1, max: 5, help: "1–5" },
    { name: "review", label: "Review", type: "textarea", required: true, full: true },
    {
      name: "source",
      label: "Sumber",
      type: "select",
      options: [
        { label: "Google", value: "Google" },
        { label: "TripAdvisor", value: "TripAdvisor" },
        { label: "Booking.com", value: "Booking.com" },
        { label: "Agoda", value: "Agoda" },
      ],
    },
    { name: "status", label: "Status", type: "select", options: statusOptions },
    { name: "publishedAt", label: "Tanggal Publish", type: "datetime" },
  ],
  columns: [
    { key: "guestName", label: "Nama" },
    { key: "country", label: "Negara" },
    { key: "rating", label: "Rating", render: (r) => <StarsCell value={r.rating} /> },
    { key: "source", label: "Sumber" },
  ],
};

/* ---------- Experiences ---------- */

export const experienceConfig: CrudModuleConfig = {
  title: "Experiences",
  entityLabel: "Pengalaman",
  apiPath: "/api/admin/experiences",
  pagePath: "/admin/experiences",
  searchFields: ["title"],
  statusField: "status",
  filter: { param: "status", label: "Status", options: statusOptions },
  createSchema: createExperienceSchema,
  updateSchema: updateExperienceSchema,
  orderField: "sortOrder",
  fields: [
    { name: "title", label: "Judul", type: "text", required: true },
    { name: "description", label: "Deskripsi", type: "textarea", full: true },
    { name: "image", label: "Gambar", type: "image" },
    { name: "duration", label: "Durasi", type: "text", placeholder: "2 hours / Full day" },
    { name: "priceFrom", label: "Harga Mulai", type: "number", step: 10000 },
    { name: "ctaLabel", label: "Label CTA", type: "text" },
    { name: "ctaUrl", label: "URL CTA", type: "text", placeholder: "https://…" },
    { name: "status", label: "Status", type: "select", options: statusOptions },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "image", label: "Foto", render: (r) => <ImageCell value={r.image} /> },
    { key: "title", label: "Judul" },
    { key: "duration", label: "Durasi" },
    { key: "priceFrom", label: "Harga", render: (r) => <MoneyCell value={r.priceFrom} /> },
  ],
};

/* ---------- Attractions ---------- */

export const attractionConfig: CrudModuleConfig = {
  title: "Attractions",
  entityLabel: "Wisata",
  apiPath: "/api/admin/attractions",
  pagePath: "/admin/attractions",
  searchFields: ["name"],
  createSchema: createAttractionSchema,
  updateSchema: updateAttractionSchema,
  orderField: "sortOrder",
  fields: [
    { name: "name", label: "Nama", type: "text", required: true },
    { name: "description", label: "Deskripsi", type: "textarea", full: true },
    { name: "category", label: "Kategori", type: "text", placeholder: "Cultural / Nature / Shopping…" },
    { name: "distanceKm", label: "Jarak (km)", type: "number", step: 0.1 },
    { name: "travelTimeMin", label: "Waktu Tempuh (menit)", type: "number", min: 0 },
    { name: "image", label: "Gambar", type: "image" },
    { name: "lat", label: "Latitude", type: "number", step: 0.0001 },
    { name: "lng", label: "Longitude", type: "number", step: 0.0001 },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "image", label: "Foto", render: (r) => <ImageCell value={r.image} /> },
    { key: "name", label: "Nama" },
    { key: "category", label: "Kategori" },
    { key: "distanceKm", label: "Jarak", render: (r) => (r.distanceKm != null ? `${Number(r.distanceKm)} km` : "-") },
    { key: "travelTimeMin", label: "Waktu", render: (r) => (r.travelTimeMin != null ? `${Number(r.travelTimeMin)} mnt` : "-") },
  ],
};

/* ---------- FAQ ---------- */

export const faqConfig: CrudModuleConfig = {
  title: "FAQ",
  entityLabel: "FAQ",
  apiPath: "/api/admin/faqs",
  pagePath: "/admin/faqs",
  searchFields: ["question", "answer"],
  filter: {
    param: "category",
    label: "Kategori",
    options: FAQ_CATEGORIES.map((c) => ({ label: c, value: c })),
  },
  createSchema: createFaqItemSchema,
  updateSchema: updateFaqItemSchema,
  orderField: "sortOrder",
  fields: [
    { name: "question", label: "Pertanyaan", type: "text", required: true },
    { name: "answer", label: "Jawaban", type: "textarea", required: true, full: true },
    {
      name: "category",
      label: "Kategori",
      type: "select",
      options: FAQ_CATEGORIES.map((c) => ({ label: c, value: c })),
    },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "question", label: "Pertanyaan" },
    { key: "category", label: "Kategori" },
    { key: "sortOrder", label: "Urutan" },
  ],
};

/* ---------- Awards (LP-012) ---------- */

export const awardConfig: CrudModuleConfig = {
  title: "Awards",
  entityLabel: "Penghargaan",
  apiPath: "/api/admin/awards",
  pagePath: "/admin/awards",
  searchFields: ["name", "issuer"],
  createSchema: createAwardSchema,
  updateSchema: updateAwardSchema,
  orderField: "sortOrder",
  fields: [
    { name: "name", label: "Nama Penghargaan", type: "text", required: true },
    { name: "issuer", label: "Pemberi", type: "text", placeholder: "TripAdvisor / Booking.com…" },
    { name: "year", label: "Tahun", type: "number", min: 1900, max: 2100, step: 1 },
    { name: "logo", label: "Logo", type: "image" },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "logo", label: "Logo", render: (r) => <ImageCell value={r.logo} /> },
    { key: "name", label: "Penghargaan" },
    { key: "issuer", label: "Pemberi" },
    { key: "year", label: "Tahun" },
  ],
};

/* ---------- Transportation (PRD §25) ---------- */

export const transportConfig: CrudModuleConfig = {
  title: "Transportation",
  entityLabel: "Transportasi",
  apiPath: "/api/admin/transports",
  pagePath: "/admin/transports",
  searchFields: ["title"],
  createSchema: createTransportSchema,
  updateSchema: updateTransportSchema,
  orderField: "sortOrder",
  fields: [
    { name: "title", label: "Judul", type: "text", required: true, placeholder: "Airport Transfer" },
    { name: "description", label: "Deskripsi", type: "textarea", full: true },
    { name: "icon", label: "Ikon", type: "text", help: "Nama ikon Lucide, mis. Plane / Car / Train" },
    { name: "priceFrom", label: "Harga Mulai", type: "number", step: 10000 },
    { name: "ctaLabel", label: "Label CTA", type: "text", placeholder: "Book via WhatsApp" },
    { name: "ctaUrl", label: "URL CTA", type: "text", placeholder: "https://wa.me/6281…" },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "title", label: "Judul" },
    { key: "icon", label: "Ikon" },
    { key: "priceFrom", label: "Harga", render: (r) => <MoneyCell value={r.priceFrom} /> },
  ],
};

/* ---------- Amenities ---------- */

export const amenityConfig: CrudModuleConfig = {
  title: "Amenities",
  entityLabel: "Fasilitas",
  apiPath: "/api/admin/amenities",
  pagePath: "/admin/amenities",
  searchFields: ["name"],
  filter: {
    param: "group",
    label: "Group",
    options: AMENITY_GROUPS.map((g) => ({ label: g, value: g })),
  },
  createSchema: createAmenitySchema,
  updateSchema: updateAmenitySchema,
  orderField: "sortOrder",
  fields: [
    { name: "name", label: "Nama", type: "text", required: true },
    { name: "icon", label: "Ikon", type: "text", help: "Nama ikon Lucide, mis. Waves / Wifi" },
    { name: "description", label: "Deskripsi", type: "textarea" },
    { name: "image", label: "Gambar", type: "image" },
    {
      name: "group",
      label: "Group",
      type: "select",
      options: AMENITY_GROUPS.map((g) => ({ label: g, value: g })),
    },
    { name: "sortOrder", label: "Urutan", type: "number", min: 0 },
  ],
  columns: [
    { key: "name", label: "Nama" },
    { key: "icon", label: "Ikon" },
    { key: "group", label: "Group" },
  ],
};

export const CRUD_CONFIGS = {
  testimonials: testimonialConfig,
  experiences: experienceConfig,
  attractions: attractionConfig,
  awards: awardConfig,
  faqs: faqConfig,
  amenities: amenityConfig,
  transports: transportConfig,
} as const;
