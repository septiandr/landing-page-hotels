import type { ReactNode } from "react";

type Row = Record<string, unknown>;

export function MoneyCell({ value, currency = "IDR" }: { value: unknown; currency?: string }) {
  if (value == null || value === "") return <span className="text-ink-soft">-</span>;
  const n = Number(value);
  if (Number.isNaN(n)) return <span>{String(value)}</span>;
  return (
    <span>
      {new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n)}
    </span>
  );
}

export function StarsCell({ value }: { value: unknown }) {
  const n = Number(value);
  if (Number.isNaN(n)) return <span>-</span>;
  return <span>{"★".repeat(Math.max(0, Math.min(5, n)))}</span>;
}

export function ImageCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-ink-soft">-</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={String(value)} alt="" className="h-10 w-16 rounded-md object-cover" loading="lazy" />
  );
}

export function cellRenderer(render?: (row: Row) => ReactNode) {
  return render;
}
