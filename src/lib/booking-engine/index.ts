import type { BookingEngineAdapter } from "./types";
import { MockAdapter } from "./mock";
import { CloudbedsAdapter } from "./cloudbeds";

/**
 * Factory engine (BK-002) — UI tidak pernah tahu provider mana yang aktif.
 *
 *   BOOKING_ENGINE_PROVIDER=cloudbeds → CloudbedsAdapter (production)
 *   (default) / mock                  → MockAdapter (dev & E2E)
 *
 * Provider "mock" dilarang di production (REL-001) — verifikasi di deploy.
 */
export function getEngine(): BookingEngineAdapter {
  if (process.env.BOOKING_ENGINE_PROVIDER === "cloudbeds") {
    return new CloudbedsAdapter();
  }
  return new MockAdapter();
}

export type { BookingEngineAdapter } from "./types";
export type {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingInitRequest,
  RateOption,
} from "./types";
export { buildBookingUrl } from "./deep-link";
