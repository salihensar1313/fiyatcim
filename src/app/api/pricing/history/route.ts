import { z } from "zod";
import { listPriceHistory } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../_helpers";

export const runtime = "nodejs";

const querySchema = z.object({
  productId: z.string().uuid().optional(),
  priceType: z.string().optional(),
});

export async function GET(request: Request) {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return jsonError("Geçersiz filtre parametreleri");

  const data = await listPriceHistory(serviceSupabase, parsed.data);
  return jsonOk(data, { total: data.length });
}
