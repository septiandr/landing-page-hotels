import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "./api-error";

/**
 * Wrapper seragam untuk semua route handler CMS.
 * Sukses → 200 { data }
 * Error  → { error: { message, fields? } } dengan status yang sesuai.
 */
export async function handleApi<T>(fn: () => Promise<T>): Promise<Response> {
  try {
    const data = await fn();
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof ApiError) {
      const body: { error: { message: string; fields?: Record<string, string[]> } } = {
        error: { message: err.message },
      };
      if (err.fields) body.error.fields = err.fields;
      return NextResponse.json(body, { status: err.status });
    }
    console.error("[api] unexpected error:", err);
    return NextResponse.json(
      { error: { message: "Terjadi kesalahan internal" } },
      { status: 500 },
    );
  }
}

/** Baca body JSON — tolak selain application/json (CMS-B-012). */
export async function readJson(req: Request): Promise<unknown> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "Content-Type harus application/json");
  }
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Body JSON tidak valid");
  }
}

/** Flatten error Zod ke { field: [pesan, ...] } — format `fields` API. */
export function parseZodError(err: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "form";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}
