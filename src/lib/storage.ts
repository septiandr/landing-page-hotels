import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Abstraksi penyimpanan file (CMS-B-008). MVP: filesystem lokal di
 * public/uploads — ganti ke S3 dengan implementasi StorageProvider lain
 * tanpa mengubah route handler (STORAGE_DRIVER="s3").
 */
export interface StorageProvider {
  /** Simpan buffer, kembalikan URL publik relatif (mis. /uploads/x.webp). */
  save(buffer: Buffer, fileName: string): Promise<string>;
}

class LocalStorageProvider implements StorageProvider {
  private dir = path.join(process.cwd(), "public", "uploads");

  async save(buffer: Buffer, fileName: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(path.join(this.dir, fileName), buffer);
    return `/uploads/${fileName}`;
  }
}

class S3StorageProvider implements StorageProvider {
  // Lebih sedikit parameter dari interface tetap valid secara struktural.
  async save(): Promise<string> {
    throw new Error(
      "S3StorageProvider belum diimplementasikan — atur STORAGE_DRIVER=local (default) atau implementasikan upload ke S3.",
    );
  }
}

export const storage: StorageProvider =
  process.env.STORAGE_DRIVER === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
