import { listSourceSites } from "@/lib/pricing/queries";
import { getPricingAdminContext, jsonError, jsonOk } from "../_helpers";

export const runtime = "nodejs";

export async function GET() {
  const { serviceSupabase, isAdmin } = await getPricingAdminContext();
  if (!isAdmin || !serviceSupabase) return jsonError("Yetkiniz yok", 403);

  const data = await listSourceSites(serviceSupabase);
  return jsonOk(data, { total: data.length });
}
