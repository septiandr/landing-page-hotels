import type { ReactNode } from "react";
import type { z } from "zod";

export type CrudFieldType =
  | "text"
  | "slug"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "datetime"
  | "checkbox"
  | "image";

export interface CrudField {
  name: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** Untuk type select — { label, value }. */
  options?: { label: string; value: string }[];
  help?: string;
  placeholder?: string;
  /** Lebar penuh (2 kolom) di grid form. */
  full?: boolean;
  /** Sembunyikan dari form (mis. field read-only). Default: tampil. */
  showInForm?: boolean;
}

export interface CrudColumn {
  key: string;
  label: string;
  /** Render kustom; default = string value. */
  render?: (row: Record<string, unknown>) => ReactNode;
}

export interface CrudFilter {
  param: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface CrudModuleConfig {
  /** Judul halaman list, mis. "Testimonials". */
  title: string;
  /** Label entity untuk pesan/toast, mis. "Testimoni". */
  entityLabel: string;
  /** Base path API, mis. "/api/admin/testimonials". */
  apiPath: string;
  /** Base path halaman admin, mis. "/admin/testimonials". */
  pagePath: string;
  fields: CrudField[];
  columns: CrudColumn[];
  createSchema: z.ZodType;
  updateSchema: z.ZodType;
  /** Field yang dicari lewat ?q= (default: field pertama type text). */
  searchFields?: string[];
  /** Field status → StatusBadge otomatis di kolom list. */
  statusField?: string;
  /** Field urutan (sortOrder) — tampil sebagai input number di form. */
  orderField?: string;
  /** Filter select di atas list (dari query param). */
  filter?: CrudFilter;
}
