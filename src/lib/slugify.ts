/**
 * Ubah string menjadi URL slug aman.
 * Contoh: "Deluxe King Room" -> "deluxe-king-room"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // buang aksen (é -> e)
    .replace(/[^a-z0-9\s_-]/g, "") // buang karakter non alfanumerik (underscore dipertahankan)
    .replace(/[\s_-]+/g, "-") // spasi/underscore -> dash
    .replace(/^-+|-+$/g, ""); // trim dash di ujung
}
