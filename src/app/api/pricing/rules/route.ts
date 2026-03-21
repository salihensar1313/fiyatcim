import { z } from "zod";
import { createPricingRuleAction } from "@/lib/pricing/actions";
import { listPricingRules } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../_helpers";

export const runtime = "nodejs";

const querySchema = z.object({
  productId: z.string().uuid().optional(),
  ruleType: z.string().optional(),
  targetId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return jsonError("Geçersiz filtre parametreleri");

  const data = await listPricingRules(serviceSupabase, parsed.data);
  return jsonOk(data, { total: data.length });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createPricingRuleAction(body);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
