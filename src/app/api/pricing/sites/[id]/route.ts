import { updateSourceSiteAction } from "@/lib/pricing/actions";
import { jsonError, jsonOk } from "../../_helpers";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const result = await updateSourceSiteAction(params.id, body);
  if (result.error) return jsonError(result.error, result.error === "Yetkiniz yok" ? 403 : 400);
  return jsonOk(result.data);
}
