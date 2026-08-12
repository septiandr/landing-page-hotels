/**
 * Typed API client — wrapper fetch seragam untuk client & server.
 * Kontrak response: { data } untuk sukses, { error: { message, fields } } untuk gagal.
 */

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Fetch + parse JSON + error handling seragam.
 * - Sukses (2xx): return `data`.
 * - Gagal (>=400): throw `ApiError` dengan pesan dari server.
 * - Opsional: redirect ke /admin/login saat 401 (untuk klien admin).
 */
export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = (await res.json().catch(() => null)) as
    | { data?: T; error?: { message?: string; fields?: Record<string, string[]> } }
    | null;

  if (!res.ok) {
    const message = payload?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, payload?.error?.fields);
  }

  return payload?.data ?? (payload as T);
}
