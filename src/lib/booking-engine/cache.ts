/**
 * Cache in-memory server-side dengan TTL (BK-005).
 *
 * Tujuan: menghindari rate limit Cloudbeds & response identik berulang.
 * Catatan: cache per-instance — pada multi-instance (Vercel) perlu Redis
 * (mis. Upstash) bila traffic tinggi; untuk MVP cukup di sini.
 */
const store = new Map<string, { expiresAt: number; value: unknown }>();

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    console.info(`[cache] hit ${key}`); // DoD BK-005: cache hit tercatat di server
    return hit.value as T;
  }

  const value = await loader();
  store.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}
