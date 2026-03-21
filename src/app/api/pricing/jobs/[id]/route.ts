import { getPricingJobById } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../../_helpers";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const data = await getPricingJobById(serviceSupabase, params.id);
  if (!data) return jsonError("Job bulunamadi", 404);

  return jsonOk(data);
}
