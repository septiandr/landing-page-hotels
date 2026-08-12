"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useToast } from "./toast";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  /** Tinggi preview. */
  aspect?: string;
  disabled?: boolean;
}

export function ImageUploader({ value, onChange, aspect = "aspect-video", disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { toast } = useToast();

  async function upload(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const body = (await res.json()) as { data?: { url: string }; error?: { message?: string } };
      if (!res.ok) throw new Error(body.error?.message ?? "Upload gagal");
      onChange(body.data!.url);
      toast("success", "Gambar terupload");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload gambar"
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragging ? "border-primary-500 bg-primary-50" : "border-border bg-surface"
        } ${value ? "" : "cursor-pointer"} ${aspect}`}
      >
        {value ? (
          <>
            <Image src={value} alt="Preview" fill className="object-cover" sizes="400px" />
            {!disabled ? (
              <button
                type="button"
                aria-label="Hapus gambar"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-ink/70 p-1.5 text-white hover:bg-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </>
        ) : (
          <div className="flex h-full min-h-28 flex-col items-center justify-center gap-1.5 text-ink-soft">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span className="text-xs">{uploading ? "Memproses…" : "Klik / seret gambar (maks 5MB)"}</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
