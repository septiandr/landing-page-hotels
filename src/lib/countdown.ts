/**
 * Format sisa waktu countdown (LP-010, PRD §19).
 * Contoh: `2d 04h 12m 33s` — hari hanya muncul jika > 0.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0h 00m 00s";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days > 0 ? `${days}d ` : ""}${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
