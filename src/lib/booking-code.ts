import { db } from "./db";

/**
 * Generator nomor booking on-site (OSB-001): `OB-{yyyyMMdd}-{seq}`.
 * `seq` dihitung dari jumlah booking hari itu + 1; retry saat konflik unique
 * (dua request bersamaan bisa dapat seq sama).
 */

function dateStamp(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}${m}${day}`;
}

export async function generateBookingCode(d = new Date()): Promise<string> {
  const prefix = `OB-${dateStamp(d)}-`;

  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  const count = await db.booking.count({
    where: { createdAt: { gte: start, lte: end } },
  });

  let code = `${prefix}${String(count + 1).padStart(3, "0")}`;
  // Retry dengan seq berikutnya jika bentrok (unique constraint).
  for (let i = 1; i <= 20; i++) {
    const exists = await db.booking.findUnique({ where: { code } });
    if (!exists) return code;
    code = `${prefix}${String(count + 1 + i).padStart(3, "0")}`;
  }
  throw new Error("Gagal generate nomor booking unik");
}