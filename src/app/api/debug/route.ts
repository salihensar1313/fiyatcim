import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKeyLen: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    hasResendKey: !!process.env.RESEND_API_KEY,
    hasCronSecret: !!process.env.CRON_SECRET,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE,
    nodeEnv: process.env.NODE_ENV,
  });
}
