import Link from "next/link";
import { Eye } from "lucide-react";

/**
 * Banner sticky yang tampil di landing page saat preview mode aktif
 * (CMS-U-012) — pengingat bahwa konten draft sedang dilihat.
 * `backHref` = path halaman ini tanpa ?preview=1 (default: beranda).
 */
export function PreviewBanner({ backHref = "/" }: { backHref?: string }) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-300 bg-amber-100/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm">
        <p className="flex items-center gap-2 font-medium text-amber-900">
          <Eye size={15} aria-hidden />
          Mode Preview — konten draft sedang ditampilkan
        </p>
        <Link
          href={backHref}
          className="rounded-md bg-amber-900 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-amber-950"
        >
          Keluar preview
        </Link>
      </div>
    </div>
  );
}
