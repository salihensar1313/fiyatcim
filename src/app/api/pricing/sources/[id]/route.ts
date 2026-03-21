import { updatePricingSourceAction } from "@/lib/pricing/actions";
import { getPricingSourceById, listSourceScrapeLogs } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../../_helpers";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const [source, scrapeLogs] = await Promise.all([
    getPricingSourceById(serviceSupabase, params.id),
    listSourceScrapeLogs(serviceSupabase, params.id),
  ]);

  if (!source) return jsonError("Kaynak bulunamadı", 404);
  return jsonOk({ source, scrapeLogs });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const result = await updatePricingSourceAction(params.id, body);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
