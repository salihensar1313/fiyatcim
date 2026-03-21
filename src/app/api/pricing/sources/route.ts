import { z } from "zod";
import { createPricingSourceAction } from "@/lib/pricing/actions";
import { listPricingSources } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../_helpers";

export const runtime = "nodejs";

const querySchema = z.object({
  productId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  selectedOnly: z.coerce.boolean().optional(),
  manualReviewRequired: z.coerce.boolean().optional(),
  verificationMethod: z.string().optional(),
  confidenceMin: z.coerce.number().optional(),
  confidenceMax: z.coerce.number().optional(),
});

export async function GET(request: Request) {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return jsonError("Geçersiz filtre parametreleri");

  const data = await listPricingSources(serviceSupabase, parsed.data);
  return jsonOk(data, { total: data.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createPricingSourceAction(body);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
