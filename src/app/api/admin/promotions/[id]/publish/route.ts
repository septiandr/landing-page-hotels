import { handleApi } from "@/lib/handle-api";
import { publishEntity } from "@/lib/publish";

type IdCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { id } = await ctx.params;
    return publishEntity("Promotion", id);
  });
}
