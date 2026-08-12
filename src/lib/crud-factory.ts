import { z } from "zod";
import { ApiError } from "./api-error";
import { parseZodError, readJson } from "./handle-api";
import { requirePermission } from "./require";
import { audit, diffObjects } from "./audit";
import { revalidateContent, type ContentTag } from "./revalidate";
import type { Permission } from "./rbac";

/** Bentuk minimal model delegate Prisma yang dipakai factory. */
export interface CrudModel {
  count(args: Record<string, unknown>): Promise<number>;
  findMany(args: Record<string, unknown>): Promise<Row[]>;
  findUnique(args: Record<string, unknown>): Promise<Row | null>;
  create(args: Record<string, unknown>): Promise<Row>;
  update(args: Record<string, unknown>): Promise<Row>;
  delete(args: Record<string, unknown>): Promise<Row>;
}

export type Row = { id: string } & Record<string, unknown>;

/** Cast model delegate Prisma → CrudModel (delegasi generik Prisma). */
export function toCrudModel(model: unknown): CrudModel {
  return model as CrudModel;
}

export interface CrudConfig {
  /** Nama entity untuk audit (mis. "Promotion"). */
  entity: string;
  /** Label jamak untuk pesan error (mis. "Promosi"). */
  entityLabel: string;
  permission: Permission;
  cacheTags: ContentTag[];
  createSchema: z.ZodType;
  updateSchema: z.ZodType;
  /** Field yang bisa dicari lewat ?q=. */
  searchFields?: string[];
  orderBy?: Record<string, unknown>;
  /** Map query param → field where (mis. { status: "status" }). */
  filterMap?: Record<string, string>;
  beforeCreate?: (
    input: Record<string, unknown>,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (
    id: string,
    input: Record<string, unknown>,
    current: Row,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

/**
 * Factory CRUD (CMS-B-005) — pola seragam untuk module tanpa relasi nested.
 * Response: { data } / { error: { message, fields } } via handleApi.
 */
export function createCrudApi(model: CrudModel, cfg: CrudConfig) {
  return {
    async list(req: Request) {
      await requirePermission(cfg.permission);
      const url = new URL(req.url);
      const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
      const q = url.searchParams.get("q")?.trim();

      const where: Record<string, unknown> = {};
      if (cfg.filterMap) {
        for (const [param, field] of Object.entries(cfg.filterMap)) {
          const value = url.searchParams.get(param);
          if (value) where[field] = value;
        }
      }
      if (q && cfg.searchFields?.length) {
        where.OR = cfg.searchFields.map((field) => ({
          [field]: { contains: q, mode: "insensitive" },
        }));
      }

      const [total, items] = await Promise.all([
        model.count({ where }),
        model.findMany({
          where,
          orderBy: cfg.orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    },

    async create(req: Request) {
      const { user } = await requirePermission(cfg.permission);
      const body = (await readJson(req)) as Record<string, unknown>;
      const input = cfg.beforeCreate ? await cfg.beforeCreate(body) : body;

      const parsed = cfg.createSchema.safeParse(input);
      if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));
      const dataValue = parsed.data as Record<string, unknown>;

      const data = await model.create({ data: dataValue });
      await audit({
        action: "CREATE",
        entity: cfg.entity,
        entityId: data.id,
        next: dataValue,
        userId: user.id,
      });
      revalidateContent(cfg.cacheTags);
      return data;
    },

    async getById(id: string) {
      await requirePermission(cfg.permission);
      const data = await model.findUnique({ where: { id } });
      if (!data) throw new ApiError(404, `${cfg.entityLabel} tidak ditemukan`);
      return data;
    },

    async update(id: string, req: Request) {
      const { user } = await requirePermission(cfg.permission);
      const current = await model.findUnique({ where: { id } });
      if (!current) throw new ApiError(404, `${cfg.entityLabel} tidak ditemukan`);

      const body = (await readJson(req)) as Record<string, unknown>;
      const input = cfg.beforeUpdate ? await cfg.beforeUpdate(id, body, current) : body;

      const parsed = cfg.updateSchema.safeParse(input);
      if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));
      const dataValue = parsed.data as Record<string, unknown>;

      const data = await model.update({ where: { id }, data: dataValue });

      const diff = diffObjects(current, dataValue);
      if (diff) {
        await audit({
          action: "UPDATE",
          entity: cfg.entity,        entityId: id,
        previous: diff.previous,
        next: diff.next,
        userId: user.id,
      });
      }
      revalidateContent(cfg.cacheTags);
      return data;
    },

    async remove(id: string) {
      const { user } = await requirePermission(cfg.permission);
      const current = await model.findUnique({ where: { id } });
      if (!current) throw new ApiError(404, `${cfg.entityLabel} tidak ditemukan`);

      await model.delete({ where: { id } });
      await audit({
        action: "DELETE",
        entity: cfg.entity,
        entityId: id,
        previous: current,
        userId: user.id,
      });
      revalidateContent(cfg.cacheTags);
      return { success: true };
    },
  };
}
