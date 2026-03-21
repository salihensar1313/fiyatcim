import { z } from "zod";
import { setPricingSourceStatusAction } from "@/lib/pricing/actions";
import { jsonError, jsonOk } from "../../../_helpers";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum([
    "active",
    "fallback_candidate",
    "blocked",
    "not_found",
    "invalid_match",
    "manual_review",
    "disabled",
  ]),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Geçersiz durum");

  const result = await setPricingSourceStatusAction(params.id, parsed.data.status);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
