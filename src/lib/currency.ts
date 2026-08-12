/**
 * Currency (BK-012).
 *
 * Harga final SELALU dari booking engine (PRD §58) — modul ini hanya untuk
 * konversi DISPLAY (mis. tampilkan estimasi ≈ dalam mata uang tamu).
 * Nilai tukar statis & approksimasi — jangan dipakai untuk transaksi.
 */
export const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Kurs display terhadap IDR (1 unit mata uang = x IDR) — approksimasi. */
const RATE_TO_IDR: Record<Currency, number> = {
  IDR: 1,
  USD: 16_200,
  EUR: 17_600,
  SGD: 12_100,
  AUD: 10_700,
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** Konversi display `amount` dari `from` ke `to` (hasil dibulatkan). */
export function convertCurrency(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const inIdr = amount * RATE_TO_IDR[from];
  return Math.round(inIdr / RATE_TO_IDR[to]);
}
