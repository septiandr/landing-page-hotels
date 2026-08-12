import Link from "next/link";
import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STAT_CARDS = [
  { key: "rooms", label: "Rooms Published", icon: "🛏️", href: "/admin/rooms" },
  { key: "promotions", label: "Promosi Aktif", icon: "🏷️", href: "/admin/promotions" },
  { key: "gallery", label: "Foto Gallery", icon: "🖼️", href: "/admin/gallery" },
  { key: "testimonials", label: "Testimoni Published", icon: "⭐", href: "/admin/testimonials" },
] as const;

export default async function DashboardPage() {
  const now = new Date();
  const [rooms, promotions, gallery, testimonials, experiences, faqs] = await Promise.all([
    db.room.count({ where: { status: "PUBLISHED" } }),
    db.promotion.count({ where: { status: { in: ["ACTIVE", "SCHEDULED"] } } }),
    db.galleryItem.count({ where: { status: "PUBLISHED" } }),
    db.testimonial.count({ where: { status: "PUBLISHED" } }),
    db.experience.count({ where: { status: "PUBLISHED" } }),
    db.faqItem.count(),
  ]);

  const stats = { rooms, promotions, gallery, testimonials };

  const expiring = await db.promotion.findMany({
    where: {
      status: { in: ["ACTIVE", "SCHEDULED"] },
      bookingEnd: { lte: addDays(now, 3), gte: now },
    },
    orderBy: { bookingEnd: "asc" },
    take: 5,
    select: { id: true, title: true, discountLabel: true, bookingEnd: true, status: true },
  });

  const draftSummary = [
    { label: "Rooms", draft: await db.room.count({ where: { status: "DRAFT" } }), total: rooms },
    { label: "Promotions", draft: await db.promotion.count({ where: { status: "DRAFT" } }), total: promotions },
    { label: "Gallery", draft: await db.galleryItem.count({ where: { status: "DRAFT" } }), total: gallery },
    { label: "Testimonials", draft: await db.testimonial.count({ where: { status: "DRAFT" } }), total: testimonials },
    { label: "Experiences", draft: await db.experience.count({ where: { status: "DRAFT" } }), total: experiences },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Ringkasan konten hotel — target update kurang dari 5 menit (PRD §61).
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <Link key={card.key} href={card.href}>
            <Card className="p-5 transition hover:border-primary-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-soft">{card.label}</p>
                <span className="text-lg" aria-hidden>
                  {card.icon}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {stats[card.key]}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Promotions segera berakhir */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Promosi segera berakhir</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Deadline booking dalam 3 hari ke depan</p>
          {expiring.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">Tidak ada promosi yang mendekati deadline.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {expiring.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-ink-soft">
                      {p.discountLabel ?? "Promo"} · berakhir {p.bookingEnd ? new Date(p.bookingEnd).toLocaleDateString("id-ID") : "-"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/promotions/${p.id}`}
                    className="ml-4 shrink-0 text-sm font-medium text-primary-700 hover:underline"
                  >
                    Edit →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Status summary */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Status konten</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Draft vs published per module</p>
          <ul className="mt-4 space-y-3">
            {draftSummary.map((row) => (
              <li key={row.label} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-ink-soft">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: row.total === 0 ? "0%" : `${Math.max(6, ((row.total - row.draft) / row.total) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs text-ink-soft">
                  {row.total - row.draft} pub · {row.draft} draft
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold text-ink">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { label: "+ Tambah Room", href: "/admin/rooms/new" },
            { label: "Upload Gallery", href: "/admin/gallery" },
            { label: "+ Promosi Baru", href: "/admin/promotions/new" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-800"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </Card>

      <p className="text-xs text-ink-soft">FAQ: {faqs} item terdaftar.</p>
    </div>
  );
}
