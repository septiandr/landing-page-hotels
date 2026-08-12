"use client";

/**
 * Wrapper fetch untuk API admin — format { data } | { error: { message, fields } }.
 * Semua mutation wajib Content-Type: application/json (CMS-B-012).
 */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string; fields?: Record<string, string[]> };
  };

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      body.error?.message ?? "Terjadi kesalahan, coba lagi",
      body.error?.fields,
    );
  }
  return body.data as T;
}

export const apiGet = <T,>(url: string) => apiFetch<T>(url);
export const apiPost = <T,>(url: string, data: unknown) =>
  apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) });
export const apiPatch = <T,>(url: string, data: unknown) =>
  apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data) });
export const apiDelete = <T,>(url: string) => apiFetch<T>(url, { method: "DELETE" });

/** Parsing error fields API → pesan pertama per field untuk form. */
export function firstFieldError(err: unknown, field: string): string | undefined {
  if (err instanceof ApiClientError && err.fields?.[field]?.length) {
    return err.fields[field][0];
  }
  return undefined;
}
