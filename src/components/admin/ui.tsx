"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from "react";

/* ---------- Layout primitives ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-border bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-label="Memuat"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-ink/10", className)} />;
}

/* ---------- Buttons ---------- */

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-primary-700 text-white shadow-sm hover:bg-primary-800",
        variant === "secondary" && "border border-border bg-white text-ink hover:bg-surface",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-ink-soft hover:bg-ink/5 hover:text-ink",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

/* ---------- Form primitives ---------- */

export function Label({
  htmlFor,
  children,
  hint,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-ink", className)}>
      {children}
      {hint ? <span className="ml-1.5 text-xs font-normal text-ink-soft">{hint}</span> : null}
    </label>
  );
}

const fieldClass =
  "w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25 disabled:bg-surface";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldClass, "min-h-24", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(fieldClass, props.className)} />;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600" role="alert">{message}</p>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">{title}</h2>
      {children}
    </div>
  );
}

/* ---------- Status badge ---------- */

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-ink/10 text-ink-soft",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  EXPIRED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-ink/10 text-ink-soft",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-ink/10 text-ink-soft",
      )}
    >
      {status}
    </span>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-16 text-center">
      <p className="font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
    </div>
  );
}
