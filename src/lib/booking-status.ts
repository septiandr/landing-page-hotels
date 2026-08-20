import type { BookingStatus } from "@/generated/prisma/client";
import type { BookingStatusAction } from "./validators";

/**
 * Valid transisi status booking on-site (OSB-005).
 * Terminal: CHECKED_OUT / CANCELLED / NO_SHOW — tidak ada aksi lagi.
 */
const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatusAction, BookingStatus>>> = {
  CONFIRMED: {
    CHECK_IN: "CHECKED_IN",
    CANCEL: "CANCELLED",
    NO_SHOW: "NO_SHOW",
  },
  CHECKED_IN: {
    CHECK_OUT: "CHECKED_OUT",
    CANCEL: "CANCELLED",
  },
  CHECKED_OUT: {},
  CANCELLED: {},
  NO_SHOW: {},
};

export function nextStatus(
  from: BookingStatus,
  action: BookingStatusAction,
): BookingStatus | null {
  return TRANSITIONS[from]?.[action] ?? null;
}

/** CANCEL/NO_SHOW membutuhkan alasan. */
export function requiresReason(action: BookingStatusAction): boolean {
  return action === "CANCEL";
}