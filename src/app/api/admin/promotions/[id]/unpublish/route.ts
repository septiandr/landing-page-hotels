import { handleApi } from "@/lib/handle-api";
import { unpublishEntity } from "@/lib/publish";

type IdCtx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { id } = await ctx.params;
    return unpublishEntity("Promotion", id);
  });
}
