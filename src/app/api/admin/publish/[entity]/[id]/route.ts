import { handleApi } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { publishEntity, type PublishableEntity } from "@/lib/publish";

const ALLOWED = new Set<PublishableEntity>([
  "Room",
  "Promotion",
  "GalleryItem",
  "Testimonial",
  "Experience",
]);

type IdCtx = { params: Promise<{ entity: string; id: string }> };

export async function POST(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { entity, id } = await ctx.params;
    if (!ALLOWED.has(entity as PublishableEntity)) {
      throw new ApiError(400, "Entity tidak dikenal");
    }
    return publishEntity(entity as PublishableEntity, id);
  });
}
