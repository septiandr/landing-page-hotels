"use client";

import { BedDouble, Check } from "lucide-react";
import type { RateOption } from "@/lib/booking-engine/types";
import { formatCurrency } from "@/lib/format";
import { convertCurrency, isCurrency } from "@/lib/currency";

export interface AvailabilityResultsProps {
  rates: RateOption[];
  nights: number;
  /** Mata uang hotel — untuk estimasi tampilan bila beda dari rate. */
  hotelCurrency: string;
  selectedId: string | null;
  onSelect: (roomId: string) => void;
}

export function AvailabilityResults({
  rates,
  nights,
  hotelCurrency,
  selectedId,
  onSelect,
}: AvailabilityResultsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        {rates.length} tipe kamar tersedia · {nights} malam
      </p>

      {rates.map((rate) => {
        const selected = selectedId === rate.roomId;
        const estimate =
          rate.currency !== hotelCurrency &&
          isCurrency(rate.currency) &&
          isCurrency(hotelCurrency)
            ? convertCurrency(rate.totalPrice, rate.currency, hotelCurrency)
            : null;

        return (
          <button
            key={rate.roomId}
            type="button"
            onClick={() => onSelect(rate.roomId)}
            aria-pressed={selected}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selected
                ? "border-primary-600 bg-primary-50 ring-2 ring-primary-600/20"
                : "border-border bg-white hover:border-primary-300"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <BedDouble size={16} aria-hidden className="shrink-0 text-primary-700" />
                  {rate.roomName}
                </p>
                {rate.cancellationPolicy && (
                  <p className="mt-1 text-xs text-ink-soft">{rate.cancellationPolicy}</p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-muted">
                  {formatCurrency(rate.pricePerNight, rate.currency)}
                  <span className="text-xs">/malam</span>
                </p>
                <p className="text-base font-semibold text-ink">
                  Total {formatCurrency(rate.totalPrice, rate.currency)}
                </p>
                {estimate && (
                  <p className="text-xs text-ink-soft">
                    ≈ {formatCurrency(estimate, hotelCurrency)}
                  </p>
                )}
                {!rate.taxIncluded && (
                  <p className="text-xs text-ink-soft">belum termasuk pajak</p>
                )}
              </div>
            </div>

            {selected && (
              <span className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-700">
                <Check size={15} aria-hidden /> Terpilih — lanjutkan di bawah
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
