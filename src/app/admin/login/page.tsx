import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login — CMS",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4">
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
    </main>
  );
}
