import { z } from "zod";
import { coerceBool, emailSchema, requiredString, roleSchema } from "./common";

/**
 * Schema User CMS.
 * Penting: schema menerima `password` plaintext — hash (bcrypt) dibuat
 * server-side sebelum disimpan ke `passwordHash` (DoD DATA-004:
 * password tidak pernah dikirim/tersimpan plaintext).
 */
const userBaseSchema = z.object({
  name: requiredString,
  email: emailSchema,
  password: z.string().min(8, "Password minimal 8 karakter").max(200),
  role: roleSchema,
  isActive: coerceBool,
});

export const createUserSchema = userBaseSchema
  .extend({
    role: roleSchema.default("EDITOR"),
    isActive: coerceBool.default(true),
  })
  .strict();

/** Update user: tanpa `password` = password tidak berubah. */
export const updateUserSchema = userBaseSchema.partial().strict();

export type UserInput = z.infer<typeof createUserSchema>;
export type UserUpdateInput = z.infer<typeof updateUserSchema>;
