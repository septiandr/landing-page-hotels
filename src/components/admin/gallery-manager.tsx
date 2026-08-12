"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { GALLERY_CATEGORIES } from "@/lib/validators";
import { apiDelete, apiFetch, apiPatch, apiPost } from "./api";
import { Button, EmptyState, Input, Select, Skeleton, StatusBadge } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";

interface GalleryRow {
  id: string;
  image: string;
  altText: string;
  caption: string | null;
  category: string;
  status: string;
  sortOrder: number;
}

function SortableItem({
  item,
  onLocalUpdate,
  onSave,
  onDelete,
}: {
  item: GalleryRow;
  onLocalUpdate: (patch: Partial<GalleryRow>) => void;
  onSave: (patch: Partial<GalleryRow>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // Input dikontrol langsung oleh state parent (onLocalUpdate) — tanpa local state,
  // jadi edit-inline & drag reorder tidak pernah kehilangan sinkronisasi.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-border bg-white p-3 shadow-sm transition ${
        isDragging ? "z-10 scale-105 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Seret untuk mengurutkan"
        className="absolute left-1.5 top-1.5 z-10 cursor-grab rounded-md bg-ink/60 p-1 text-white opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Hapus foto"
        onClick={onDelete}
        className="absolute right-1.5 top-1.5 z-10 rounded-md bg-ink/60 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
        <Image src={item.image} alt={item.altText} fill className="object-cover" sizes="300px" />
      </div>

      <div className="mt-2.5 space-y-2">
        <Input
          value={item.altText}
          onChange={(e) => onLocalUpdate({ altText: e.target.value })}
          onBlur={() => onSave({ altText: item.altText })}
          placeholder="Alt text"
          aria-label="Alt text"
          className="text-xs"
        />
        <Input
          value={item.caption ?? ""}
          onChange={(e) => onLocalUpdate({ caption: e.target.value })}
          onBlur={() => onSave({ caption: item.caption ?? "" })}
          placeholder="Caption (opsional)"
          aria-label="Caption"
          className="text-xs"
        />
        <div className="flex items-center justify-between gap-2">
          <Select
            value={item.category}
            onChange={(e) => {
              onLocalUpdate({ category: e.target.value });
              onSave({ category: e.target.value });
            }}
            aria-label="Kategori"
            className="w-32 py-1 text-xs"
          >
            {GALLERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </div>
  );
}

export function GalleryManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<GalleryRow | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: GalleryRow[] }>(
        "/api/admin/gallery?page=1&limit=100",
      );
      setItems([...data.items].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat galeri");
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: GalleryRow[] }>("/api/admin/gallery?page=1&limit=100")
      .then((data) => {
        if (cancelled) return;
        setItems([...data.items].sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat galeri");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(items, oldIndex, newIndex);
      setItems(next);
      setSaving(true);
      apiPatch("/api/admin/gallery/reorder", {
        items: next.map((i, idx) => ({ id: i.id, sortOrder: idx + 1 })),
      })
        .then(() => toast("success", "Urutan galeri tersimpan"))
        .catch((err) => toast("error", err instanceof Error ? err.message : "Gagal menyimpan urutan"))
        .finally(() => setSaving(false));
    },
    [items, toast],
  );

  function onDragEnd(e: DragEndEvent) {
    if (e.over && e.active.id !== e.over.id) {
      reorder(String(e.active.id), String(e.over.id));
    }
  }

  function onLocalUpdate(id: string, patch: Partial<GalleryRow>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function onSave(id: string, patch: Partial<GalleryRow>) {
    void apiPatch(`/api/admin/gallery/${id}`, patch).catch(() => {
      toast("error", "Gagal menyimpan perubahan");
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const body = (await res.json()) as {
          data?: { url: string };
          error?: { message?: string };
        };
        if (!res.ok) throw new Error(body.error?.message ?? "Upload gagal");
        await apiPost("/api/admin/gallery", {
          image: body.data!.url,
          altText: file.name,
          category: "ALL",
          status: "PUBLISHED",
        });
      }
      toast("success", `${files.length} foto ditambahkan`);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await apiDelete(`/api/admin/gallery/${deleting.id}`);
      toast("success", "Foto dihapus");
      setDeleting(null);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  const itemsId = useMemo(() => items.map((i) => i.id), [items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Gallery</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {items.length} foto · seret untuk mengurutkan, klik untuk edit
          </p>
        </div>
        <div className="relative">
          <input
            id="gallery-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
          <Button onClick={() => document.getElementById("gallery-upload")?.click()} loading={uploading}>
            {uploading ? null : <Plus className="h-4 w-4" />} Upload Foto
          </Button>
        </div>
      </div>

      {saving ? (
        <p className="flex items-center gap-2 text-xs text-ink-soft">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan urutan…
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Galeri kosong" description="Upload foto pertama untuk menampilkan di landing page." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={itemsId} strategy={rectSortingStrategy}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onLocalUpdate={(patch) => onLocalUpdate(item.id, patch)}
                  onSave={(patch) => onSave(item.id, patch)}
                  onDelete={() => setDeleting(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus foto ini?"
        description="Foto akan dihapus dari galeri."
        loading={false}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
