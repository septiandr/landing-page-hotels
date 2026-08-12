"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface"
    >
      Keluar
    </button>
  );
}
