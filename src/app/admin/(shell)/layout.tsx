import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { ToastProvider } from "@/components/admin/toast";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminShellLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-surface">
        <Sidebar role={session.user.role} userName={session.user.name ?? session.user.email ?? ""} />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
