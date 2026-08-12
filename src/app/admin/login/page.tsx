import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login — CMS",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <main className="flex min-h-dvh">
      {/* Branding (desktop) */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-primary-900 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-ink opacity-90" />
        <div className="relative z-10 max-w-md p-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-200">
            Hotel Management
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">
            Kelola konten hotel dalam hitungan menit
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-100">
            Rooms, promosi, galeri, testimoni — semua dari satu panel. Book direct & get more.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-lg shadow-ink/5">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-lg font-bold text-white">
                T
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
                CMS Taman Sari
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Masuk untuk mengelola konten hotel
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
