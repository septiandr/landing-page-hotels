/**
 * Rate limiter in-memory (MVP single-instance — upgrade ke Upstash Redis
 * bila multi-instance, lihat CMS-B-012).
 *
 * Dipakai khusus untuk percobaan login gagal: 5 kegagalan / 15 menit per
 * key (IP + email) → endpoint menolak dengan 429.
 */

interface Entry {
  failures: number;
  windowStart: number;
}

const store = new Map<string, Entry>();

export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export function recordFailure(key: string, windowMs: number = LOGIN_WINDOW_MS): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { failures: 1, windowStart: now });
  } else {
    entry.failures += 1;
  }
}

export function clearFailures(key: string): void {
  store.delete(key);
}

export function isBlocked(
  key: string,
  limit: number = LOGIN_LIMIT,
  windowMs: number = LOGIN_WINDOW_MS,
): { blocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return { blocked: false, retryAfterSeconds: 0 };
  if (now - entry.windowStart >= windowMs) {
    store.delete(key);
    return { blocked: false, retryAfterSeconds: 0 };
  }
  if (entry.failures < limit) return { blocked: false, retryAfterSeconds: 0 };
  return {
    blocked: true,
    retryAfterSeconds: Math.ceil((entry.windowStart + windowMs - now) / 1000),
  };
}

// Bersihkan entry kadaluarsa secara berkala agar Map tidak membesar.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart >= LOGIN_WINDOW_MS) store.delete(key);
    }
  }, 60_000).unref?.();
}
