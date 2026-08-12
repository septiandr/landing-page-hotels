import { db } from "@/lib/db";
import { requirePermission } from "@/lib/require";
import { handleApi } from "@/lib/handle-api";

/**
 * GET /api/admin/audit?entity=&action=&page=&limit=
 * List audit log (PRD §37) — hanya ADMIN & MARKETING (permission analytics).
 * Response: { data: { items, pagination } }.
 */
export async function GET(req: Request) {
  return handleApi(async () => {
    await requirePermission("analytics");
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));

    const where: Record<string, string> = {};
    const entity = url.searchParams.get("entity");
    const action = url.searchParams.get("action");
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [total, items, entities] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.findMany({
        distinct: ["entity"],
        select: { entity: true },
      }),
    ]);

    return {
      items,
      entities: entities.map((e) => e.entity),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });
}
