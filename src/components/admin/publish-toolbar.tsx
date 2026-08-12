"use client";

import { useState } from "react";
import { Eye, Rocket, RotateCcw } from "lucide-react";
import { apiPost } from "./api";
import { Button, StatusBadge } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";

interface PublishToolbarProps {
  entity: "Room" | "Promotion" | "GalleryItem" | "Testimonial" | "Experience";
  id: string;
  status: string;
  /** Path landing page untuk preview (?preview=1). */
  previewPath?: string;
}

export function PublishToolbar({ entity, id, status, previewPath }: PublishToolbarProps) {
  const { toast } = useToast();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<null | "publish" | "unpublish">(null);

  const published = current === "PUBLISHED" || current === "ACTIVE";

  async function toggle(next: "publish" | "unpublish") {
    setLoading(true);
    try {
      const url = `/api/admin/${next}/${entity}/${id}`;
      const data = await apiPost<{ status: string }>(url, {});
      setCurrent(data.status);
      toast(
        "success",
        next === "publish" ? "Konten berhasil dipublish" : "Konten di-unpublish",
      );
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  }

  const previewHref = previewPath
    ? `${previewPath}${previewPath.includes("?") ? "&" : "?"}preview=1`
    : undefined;

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:rounded-xl lg:border lg:bg-white lg:px-5 lg:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={current} />
          <span className="text-sm text-ink-soft">
            {published ? "Tampil di landing page" : "Tersimpan sebagai draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previewHref ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(previewHref, "_blank", "noopener")}
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
          ) : null}
          {published ? (
            <Button variant="secondary" size="sm" loading={loading} onClick={() => setConfirm("unpublish")}>
              <RotateCcw className="h-4 w-4" /> Unpublish
            </Button>
          ) : (
            <Button size="sm" loading={loading} onClick={() => setConfirm("publish")}>
              <Rocket className="h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "publish" ? "Publish konten ini?" : "Unpublish konten ini?"}
        description={
          confirm === "publish"
            ? "Konten akan langsung tampil di landing page."
            : "Konten kembali menjadi draft dan tidak tampil di landing page."
        }
        confirmLabel={confirm === "publish" ? "Publish" : "Unpublish"}
        loading={loading}
        onConfirm={() => confirm && void toggle(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
