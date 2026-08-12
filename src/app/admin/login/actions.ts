"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/lib/auth";
import { clearFailures, isBlocked, recordFailure } from "@/lib/rate-limit";

export interface LoginState {
  error?: string;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "local";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  const key = `login:${await clientIp()}:${email}`;
  const check = isBlocked(key);
  if (check.blocked) {
    return {
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${check.retryAfterSeconds} detik.`,
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
    // Tidak tercapai karena signIn sukses melempar redirect — defensif.
    clearFailures(key);
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      recordFailure(key);
      return { error: "Email atau password salah" };
    }
    throw err;
  }
}
