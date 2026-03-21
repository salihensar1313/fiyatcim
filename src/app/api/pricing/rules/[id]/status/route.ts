import { z } from "zod";
import { setPricingRuleStatusAction } from "@/lib/pricing/actions";
import { jsonError, jsonOk } from "../../../_helpers";

export const runtime = "nodejs";

const schema = z.object({
  is_active: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Geçersiz durum");

  const result = await setPricingRuleStatusAction(params.id, parsed.data.is_active);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
