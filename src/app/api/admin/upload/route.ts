import { randomUUID } from "node:crypto";
import sharp, { type Metadata } from "sharp";
import { handleApi } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ["jpeg", "png", "webp"] as const;

export async function POST(req: Request) {
  return handleApi(async () => {
    await requirePermission("content");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "File wajib dikirim (field: file)");
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(400, "Ukuran file maksimal 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validasi mime dari magic bytes via sharp — jangan percaya header saja.
    let metadata: Metadata;
    try {
      metadata = await sharp(buffer, { failOn: "error" }).metadata();
    } catch {
      throw new ApiError(400, "File bukan gambar yang valid");
    }
    if (!metadata.format || !(SUPPORTED_FORMATS as readonly string[]).includes(metadata.format)) {
      throw new ApiError(400, "Hanya gambar JPEG, PNG, atau WebP yang didukung");
    }

    const id = randomUUID();
    const [lgBuffer, thumbBuffer] = await Promise.all([
      sharp(buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer(),
      sharp(buffer)
        .rotate()
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer(),
    ]);

    const [url, thumbUrl] = await Promise.all([
      storage.save(lgBuffer, `${id}.webp`),
      storage.save(thumbBuffer, `${id}-thumb.webp`),
    ]);

    return {
      url,
      thumbUrl,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      alt: "",
    };
  });
}
