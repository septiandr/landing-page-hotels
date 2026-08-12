/**
 * Mapping room Cloudbeds ↔ CMS (BK-004 / BK-008).
 *
 * `room_type` di deep link engine memakai ABBR (singkatan 3 huruf dari
 * Settings → Accommodation di Cloudbeds). Isi map ini manual saat setup
 * (BK-014) — sinkron dengan CMS field `rateLink`/slug bila tersedia.
 */

/** cloudbedsRoomId → { slug, abbr } */
export const ROOM_MAP: Record<string, { slug: string; abbr: string }> = {};

/** slug CMS → abbr room_type engine (fallback manual). */
export const SLUG_TO_ABBR: Record<string, string> = {};

export function roomAbbrByCloudbedsId(roomId: string): string | undefined {
  return ROOM_MAP[roomId]?.abbr;
}

export function roomSlugByCloudbedsId(roomId: string): string | undefined {
  return ROOM_MAP[roomId]?.slug;
}
