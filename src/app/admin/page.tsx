import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Dashboard CMS
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Selamat datang, {session.user.name} ({session.user.role})
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Rooms", desc: "Kelola kamar & harga", href: "#" },
          { label: "Promotions", desc: "Promo & jadwal publish", href: "#" },
          { label: "Gallery", desc: "Foto & kategori", href: "#" },
        ].map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border bg-white p-5 transition hover:border-primary-300 hover:shadow-md"
          >
            <h2 className="font-semibold text-ink">{c.label}</h2>
            <p className="mt-1 text-sm text-ink-soft">{c.desc}</p>
            <span className="mt-3 inline-block text-sm font-medium text-primary-700">
              Segera hadir (doc/04) →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
