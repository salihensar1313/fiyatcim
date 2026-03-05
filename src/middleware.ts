import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function middleware(request: NextRequest) {
  if (IS_DEMO) return NextResponse.next();
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/hesabim/:path*",
    "/odeme/:path*",
  ],
};
