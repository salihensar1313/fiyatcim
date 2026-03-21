import { NextResponse } from "next/server";
import { checkPricingSourceAction } from "@/lib/pricing/actions";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const result = await checkPricingSourceAction(params.id);

  if (result.error) {
    const status = result.error === "Yetkiniz yok" ? 403 : 400;
    return NextResponse.json({ data: null, error: result.error }, { status });
  }

  return NextResponse.json({ data: result.data, error: null });
}
