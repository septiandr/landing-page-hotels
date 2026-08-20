import { cloudbedsFetch, type CloudbedsConfig } from "./http";
import type { CreateReservationRequest, CreateReservationResult } from "./types";

/**
 * createReservation di Cloudbeds API (OSB-002).
 *
 * Catatan verifikasi (sama seperti BK-014): bentuk field request/response API
 * v1 bisa berbeda antar versi. Param guest & format tanggal di bawah mengikuti
 * dokumentasi umum API v1 — sesuaikan saat diuji dengan API key live.
 */

interface CloudbedsReservationResponse {
  reservation_id?: string | number;
  reservationID?: string | number;
  status?: string;
  [key: string]: unknown;
}

/** Split "John Doe" → firstName/lastName (nama tamu dari 1 field di CMS). */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  const firstName = parts[0] ?? full;
  const lastName = parts.slice(1).join(" ") || "-";
  return { firstName, lastName };
}

export async function createCloudbedsReservation(
  config: CloudbedsConfig,
  req: CreateReservationRequest,
): Promise<CreateReservationResult> {
  const { firstName, lastName } = splitName(req.guest.firstName);

  const data = await cloudbedsFetch<CloudbedsReservationResponse>(
    config,
    "createReservation",
    {
      start_date: req.checkIn,
      end_date: req.checkOut,
      room_id: req.roomId,
      adults: req.adults,
      children: req.kids,
      guest_first_name: firstName,
      guest_last_name: lastName,
      guest_email: req.guest.email ?? "",
      guest_phone: req.guest.phone,
      total: req.total ?? 0,
    },
  );

  const reservationId = String(data?.reservation_id ?? data?.reservationID ?? "");
  if (!reservationId) {
    throw new Error("createReservation Cloudbeds tidak mengembalikan reservation_id");
  }
  return {
    reservationId,
    status: String(data?.status ?? "confirmed"),
  };
}