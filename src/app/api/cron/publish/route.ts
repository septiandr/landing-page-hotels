import { processScheduledPublishes } from "@/lib/cron";

export const runtime = "nodejs";
export const maxDuration = 60;

/** GET /api/cron/publish — dipanggil Vercel Cron (vercel.json). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await processScheduledPublishes();
  return Response.json(result);
}
