import { db } from "@/lib/db";
import { updateUserSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit, diffObjects } from "@/lib/audit";
import { hashPassword } from "@/lib/password";

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type IdCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    await requirePermission("users");
    const { id } = await ctx.params;
    const user = await db.user.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!user) throw new ApiError(404, "User tidak ditemukan");
    return user;
  });
}

export async function PATCH(req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { user: me } = await requirePermission("users");
    const { id } = await ctx.params;

    const current = await db.user.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "User tidak ditemukan");

    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    // Email duplikat → 409 (konsisten dengan POST).
    if (parsed.data.email && parsed.data.email !== current.email) {
      const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
      if (exists) {
        throw new ApiError(409, "Email sudah terdaftar", { email: ["Email sudah terdaftar"] });
      }
    }

    // Tidak boleh menonaktifkan/mengubah role akun sendiri (kunci diri sendiri).
    if (id === me.id) {
      if (parsed.data.isActive === false) {
        throw new ApiError(400, "Tidak bisa menonaktifkan akun sendiri");
      }
      if (parsed.data.role && parsed.data.role !== current.role) {
        throw new ApiError(400, "Tidak bisa mengubah role akun sendiri");
      }
    }

    const { password, ...rest } = parsed.data;
    const updated = await db.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
      select: SAFE_SELECT,
    });

    const diff = diffObjects(current as unknown as Record<string, unknown>, {
      ...rest,
      ...(password ? { password: "***" } : {}),
    });
    if (diff) {
      await audit({
        action: "UPDATE",
        entity: "User",
        entityId: id,
        previous: diff.previous,
        next: diff.next,
        userId: me.id,
      });
    }
    return updated;
  });
}

export async function DELETE(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { user: me } = await requirePermission("users");
    const { id } = await ctx.params;
    if (id === me.id) throw new ApiError(400, "Tidak bisa menghapus akun sendiri");

    const current = await db.user.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "User tidak ditemukan");

    await db.user.delete({ where: { id } });
    await audit({
      action: "DELETE",
      entity: "User",
      entityId: id,
      previous: { name: current.name, email: current.email },
      userId: me.id,
    });
    return { success: true };
  });
}
