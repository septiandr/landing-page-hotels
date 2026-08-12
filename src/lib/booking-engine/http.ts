import { CloudbedsApiError } from "./errors";

/**
 * HTTP client Cloudbeds API v1 (BK-003).
 * - Header `X-Api-Key` (auth API v1, tanpa OAuth).
 * - Timeout wajib 8 detik (AbortSignal.timeout) — engine lambat tidak boleh
 *   menggantung request.
 * - Retry 1x untuk 5xx/timeout dengan backoff 500ms (GET only).
 */

const TIMEOUT_MS = 8_000;
const RETRY_BACKOFF_MS = 500;

export interface CloudbedsConfig {
  apiKey: string;
  propertyId: string;
  baseUrl: string;
}

export async function cloudbedsFetch<T>(
  config: CloudbedsConfig,
  endpoint: string,
  params: Record<string, string | number>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const url = new URL(`${config.baseUrl}/${endpoint}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
      url.searchParams.set("property_id", config.propertyId);

      const res = await fetch(url, {
        headers: { "X-Api-Key": config.apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });

      const json = (await res.json().catch(() => null)) as
        | { success?: boolean; code?: string | number; message?: string; data?: T }
        | null;

      if (!res.ok || json?.success === false) {
        throw new CloudbedsApiError(
          json?.code ?? res.status,
          json?.message ?? `Cloudbeds API ${res.status}`,
        );
      }
      return json?.data as T;
    } catch (err) {
      lastError = err;
      // Retry hanya untuk 5xx / timeout / network — bukan error aplikasi.
      const retryable =
        err instanceof CloudbedsApiError
          ? typeof err.code === "number" && err.code >= 500
          : true;
      if (attempt === 0 && retryable) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
        continue;
      }
      if (err instanceof CloudbedsApiError) throw err;
      throw new CloudbedsApiError("NETWORK", "Gagal terhubung ke booking engine");
    }
  }
  throw lastError;
}
