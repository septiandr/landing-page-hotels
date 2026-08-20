import type { BookingEngineAdapter } from "./types";
import { MockAdapter } from "./mock";
import { CloudbedsAdapter } from "./cloudbeds";
import { assertProviderAllowed } from "./provider-guard";

export { assertProviderAllowed } from "./provider-guard";

/**
 * Factory engine (BK-002) — UI tidak pernah tahu provider mana yang aktif.
 *
 *   BOOKING_ENGINE_PROVIDER=cloudbeds → CloudbedsAdapter (production)
 *   (default) / mock                  → MockAdapter (dev & E2E)
 */
export function getEngine(): BookingEngineAdapter {
  const provider = process.env.BOOKING_ENGINE_PROVIDER;
  assertProviderAllowed(provider);
  if (provider === "cloudbeds") {
    return new CloudbedsAdapter();
  }
  return new MockAdapter();
}

export type { BookingEngineAdapter } from "./types";
export type {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingInitRequest,
  CreateReservationGuest,
  CreateReservationRequest,
  CreateReservationResult,
  RateOption,
} from "./types";
export { buildBookingUrl } from "./deep-link";
