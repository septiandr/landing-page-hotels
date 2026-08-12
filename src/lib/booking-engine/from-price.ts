import { getEngine } from "./index";
import { cached } from "./cache";

/**
 * "From price" dari engine (BK-010) — cache server 10 menit (jangan hit API
 * per request — rate limit). Engine offline → kembalikan null → caller pakai
 * `room.priceFrom` CMS dengan label "starting from".
 */
export async function getFromPriceFromEngine(): Promise<{
  price: number;
  currency: string;
} | null> {
  return cached("booking:from-price", 10 * 60_000, async () => {
    try {
      return await getEngine().getFromPrice();
    } catch {
      return null;
    }
  });
}
