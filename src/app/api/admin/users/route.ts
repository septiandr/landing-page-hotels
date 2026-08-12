import { db } from "@/lib/db";
import { createUserSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";

/** Seleksi aman — passwordHash tidak pernah dikirim ke client (DATA-004). */
const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(req: Request) {
  return handleApi(async () => {
    await requirePermission("users");
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const q = url.searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const { user } = await requirePermission("users");
    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) throw new ApiError(409, "Email sudah terdaftar", { email: ["Email sudah terdaftar"] });

    const passwordHash = await hashPassword(parsed.data.password);
    const created = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
      },
      select: SAFE_SELECT,
    });

    await audit({
      action: "CREATE",
      entity: "User",
      entityId: created.id,
      next: { name: created.name, email: created.email, role: created.role },
      userId: user.id,
    });
    return created;
  });
}
