import { startBatchPricingJobAction } from "@/lib/pricing/actions";
import { jsonError, jsonOk } from "../_helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await startBatchPricingJobAction(body);

  if (result.error) {
    const status = result.error === "Yetkiniz yok" ? 403 : 400;
    return jsonError(result.error, status);
  }

  return jsonOk(result.data, { started: true });
}
