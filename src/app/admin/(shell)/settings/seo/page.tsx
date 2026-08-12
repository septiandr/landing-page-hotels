import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { SeoForm } from "@/components/admin/seo-form";

export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
  const hotel = await db.hotel.findFirst({ include: { seo: true } });
  const seo = (hotel?.seo ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">SEO Settings</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Meta tag untuk halaman utama — title maks 60, description maks 160
        </p>
      </div>
      {hotel ? (
        <SeoForm initial={seo} siteUrl={env.NEXT_PUBLIC_SITE_URL} />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Data hotel belum ada — jalankan seed.
        </p>
      )}
    </div>
  );
}
