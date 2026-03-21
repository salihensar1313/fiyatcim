import { z } from "zod";
import { resolvePriceAlertAction } from "@/lib/pricing/actions";
import { jsonError, jsonOk } from "../../../_helpers";

export const runtime = "nodejs";

const schema = z.object({
  resolution_note: z.string().trim().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Geçersiz veri");

  const result = await resolvePriceAlertAction(params.id, parsed.data.resolution_note ?? null);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
