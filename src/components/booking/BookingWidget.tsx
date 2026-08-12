"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Loader2, Minus, Plus, Search, TicketPercent } from "lucide-react";
import {
  getNightsBetween,
  widgetSearchSchema,
  type WidgetSearchValues,
} from "@/lib/validators/booking";
import { transition, validateSearch, type BookingState } from "@/lib/booking-states";
import { buildBookingUrl } from "@/lib/booking-engine/deep-link";
import { trackBookingStarted } from "@/lib/tracking";
import type { AvailabilityResponse, RateOption } from "@/lib/booking-engine/types";
import { formatCurrency } from "@/lib/format";
import { EngineError } from "./EngineError";
import { AvailabilityResults } from "./AvailabilityResults";

export interface BookingWidgetProps {
  whatsapp?: string | null;
  phone?: string | null;
  hotelCurrency?: string;
}

function toDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

export function BookingWidget({ whatsapp, phone, hotelCurrency = "IDR" }: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [state, setState] = useState<BookingState>("idle");
  const [rates, setRates] = useState<RateOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const today = useMemo(() => toDateInput(new Date()), []);
  const minCheckOut = checkIn ? addDays(checkIn, 1) : "";
  const nights = getNightsBetween(checkIn, checkOut);

  // Pre-fill dari URL shareable (BK-011): ?checkin=&checkout=&adults=&kids=&rooms=&code=
  // Re-run saat search berubah (mis. klik promo /?code=X#booking dari halaman
  // yang sama — komponen tidak remount pada soft navigation). Hanya menerapkan
  // parameter jika URL benar-benar membawanya. (setState dijadwalkan ke tick
  // berikutnya — setState sinkron dalam effect dilarang react-hooks.)
  const urlSearch = typeof window === "undefined" ? "" : window.location.search;
  useEffect(() => {
    const sp = new URLSearchParams(urlSearch);
    const hasParams =
      sp.get("checkin") ||
      sp.get("checkout") ||
      sp.get("adults") ||
      sp.get("kids") ||
      sp.get("rooms") ||
      sp.get("code");
    if (!hasParams) return;
    const t = window.setTimeout(() => {
      const clamp = (v: string | null, def: number, min: number, max: number) => {
        const n = Number(v);
        if (!v || Number.isNaN(n)) return def;
        return Math.min(max, Math.max(min, n));
      };
      const ci = sp.get("checkin");
      const co = sp.get("checkout");
      if (ci) setCheckIn(ci);
      if (co) setCheckOut(co);
      setAdults(clamp(sp.get("adults"), 2, 1, 30));
      setKids(clamp(sp.get("kids"), 0, 0, 20));
      setRooms(clamp(sp.get("rooms"), 1, 1, 10));
      const code = sp.get("code");
      if (code) setPromoCode(code);
    }, 0);
    return () => window.clearTimeout(t);
  }, [urlSearch]);

  /** User memperbaiki input → keluar dari state invalid (BK-006 UX). */
  function clearInvalidState() {
    setState((s) =>
      s === "invalid-date" || s === "invalid-guests" ? "idle" : s,
    );
  }

  function onCheckInChange(value: string) {
    setCheckIn(value);
    clearInvalidState();
    setFieldErrors((e) => ({ ...e, checkIn: "", checkOut: "" }));
    if (checkOut && value && checkOut <= value) setCheckOut(addDays(value, 1));
  }

  function onCheckOutChange(value: string) {
    setCheckOut(value);
    clearInvalidState();
    setFieldErrors((e) => ({ ...e, checkOut: "" }));
  }

  async function search(values: WidgetSearchValues) {
    setState((s) => transition(s, { type: "SEARCH_START" }));
    try {
      const params = new URLSearchParams({
        checkin: values.checkIn,
        checkout: values.checkOut,
        adults: String(values.adults),
        kids: String(values.kids),
        rooms: String(values.rooms),
      });
      if (values.promoCode) params.set("code", values.promoCode);

      const res = await fetch(`/api/availability?${params.toString()}`);
      const body = (await res.json().catch(() => null)) as
        | { data?: AvailabilityResponse }
        | null;
      const data = body?.data;

      if (!res.ok || !data) {
        setState((s) => transition(s, { type: "ENGINE_ERROR" }));
        return;
      }
      setRates(data.rates);
      setSelectedId(null);
      setState((s) => transition(s, { type: "SEARCH_SUCCESS", hasRates: data.rates.length > 0 }));
    } catch {
      setState((s) => transition(s, { type: "ENGINE_ERROR" }));
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = widgetSearchSchema.safeParse({ checkIn, checkOut, adults, kids, rooms, promoCode });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
      setFieldErrors(errs);
      const verdict = validateSearch({ checkIn, checkOut, adults, kids });
      const evt =
        verdict === "invalid-date"
          ? ({ type: "VALIDATE_DATE_FAIL" } as const)
          : verdict === "invalid-guests"
            ? ({ type: "VALIDATE_GUESTS_FAIL" } as const)
            : ({ type: "SUBMIT" } as const);
      setState((s) => transition(s, evt));
      return;
    }
    setFieldErrors({});
    setState((s) => transition(s, { type: "SUBMIT" }));
    void search(parsed.data);
  }

  function reset() {
    setRates([]);
    setSelectedId(null);
    setState((s) => transition(s, { type: "RESET" }));
  }

  function openWhatsApp(message: string) {
    if (!whatsapp) return;
    window.open(
      `https://wa.me/${whatsapp.replace(/^\+/, "")}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
  }

  function onBook(rate: RateOption) {
    const code = promoCode.trim() || undefined;
    const url = buildBookingUrl({
      checkIn,
      checkOut,
      adults,
      kids,
      rooms,
      roomId: rate.roomId,
      roomType: rate.roomType,
      promoCode: code,
    });
    trackBookingStarted({
      checkIn,
      checkOut,
      adults,
      kids,
      rooms,
      roomName: rate.roomName,
      promoCode: code,
    });

    if (url) {
      window.open(url, "_blank", "noopener");
      return;
    }
    // Fallback: property code belum di-set → booking via WhatsApp (BK-007).
    openWhatsApp(
      `Halo, saya ingin memesan ${rate.roomName} pada ${checkIn} s/d ${checkOut} untuk ${adults} dewasa${kids ? `, ${kids} anak` : ""}.${code ? ` Kode promo: ${code}.` : ""}`,
    );
  }

  const selectedRate = rates.find((r) => r.roomId === selectedId) ?? null;
  const loading = state === "loading" || state === "validating";

  return (
    <section id="booking" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-border bg-white p-6 shadow-lg shadow-primary-900/5 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-ink">Book Your Stay</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Harga terbaik saat booking langsung — bebas komisi OTA.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-checkin" className="mb-1.5 block text-sm font-medium text-ink">
                  Check-in
                </label>
                <input
                  id="bk-checkin"
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => onCheckInChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25"
                />
                {fieldErrors.checkIn && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.checkIn}</p>
                )}
              </div>
              <div>
                <label htmlFor="bk-checkout" className="mb-1.5 block text-sm font-medium text-ink">
                  Check-out
                </label>
                <input
                  id="bk-checkout"
                  type="date"
                  value={checkOut}
                  min={minCheckOut || today}
                  onChange={(e) => onCheckOutChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25"
                />
                {fieldErrors.checkOut && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.checkOut}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stepper label="Adults" value={adults} min={1} max={30} onChange={setAdults} />
              <Stepper label="Children" value={kids} min={0} max={20} onChange={setKids} />
              <Stepper label="Rooms" value={rooms} min={1} max={10} onChange={setRooms} />
            </div>
            {fieldErrors.adults && <p className="text-xs text-red-600">{fieldErrors.adults}</p>}

            <div className="relative">
              <TicketPercent
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft"
                aria-hidden
              />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Promo code (opsional)"
                className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-3.5 text-sm uppercase outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-700 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mencari ketersediaan…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" aria-hidden /> Check Availability
                </>
              )}
            </button>
          </form>

          {/* Hasil pencarian */}
          <div className="mt-6">
            {state === "available" && rates.length > 0 && (
              <>
                <AvailabilityResults
                  rates={rates}
                  nights={nights}
                  hotelCurrency={hotelCurrency}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />

                {selectedRate && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{selectedRate.roomName}</p>
                      <p className="text-xs text-ink-soft">
                        {checkIn} → {checkOut} · {nights} malam ·{" "}
                        {promoCode.trim() ? (
                          <>
                            Kode <span className="font-mono font-semibold">{promoCode.trim()}</span>{" "}
                            akan diterapkan
                          </>
                        ) : (
                          "tanpa promo code"
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBook(selectedRate)}
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-primary-700 px-6 text-sm font-semibold text-white transition hover:bg-primary-800"
                    >
                      Book Now — {formatCurrency(selectedRate.totalPrice, selectedRate.currency)}
                    </button>
                  </div>
                )}
              </>
            )}

            {state === "no-availability" && (
              <div className="rounded-xl border border-border bg-surface-muted p-6 text-center">
                <p className="font-medium text-ink">
                  Tidak ada kamar tersedia pada tanggal tersebut.
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Coba ubah tanggal atau jumlah tamu untuk melihat ketersediaan lain.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden /> Change Dates
                </button>
              </div>
            )}

            {state === "error" && (
              <EngineError
                whatsapp={whatsapp}
                phone={phone}
                context={{ checkIn, checkOut, adults, kids }}
              />
            )}

            {(state === "invalid-date" || state === "invalid-guests") && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                Periksa kembali tanggal & jumlah tamu Anda, lalu coba lagi.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink transition hover:bg-surface disabled:opacity-40";
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Kurangi ${label}`}
          className={btn}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span className="w-7 text-center text-sm font-semibold text-ink">{value}</span>
        <button
          type="button"
          aria-label={`Tambah ${label}`}
          className={btn}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
