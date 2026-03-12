import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyAdminToken, DEMO_ADMIN_COOKIE } from "@/lib/demo-auth";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  // ═══════════════════════════════════════════
  // DEMO MODE
  // ═══════════════════════════════════════════
  if (IS_DEMO) {
    if (isAdminRoute) {
      // Check for HMAC-signed httpOnly admin cookie
      const token = request.cookies.get(DEMO_ADMIN_COOKIE)?.value;

      if (!token) {
        return redirectToLogin(request);
      }

      // Verify HMAC signature — forged/tampered cookies will fail
      const isValid = await verifyAdminToken(token);
      if (!isValid) {
        // Invalid/tampered cookie → clear it and redirect
        const response = redirectToLogin(request);
        response.cookies.set(DEMO_ADMIN_COOKIE, "", {
          httpOnly: true,
          path: "/",
          maxAge: 0,
        });
        return response;
      }

      // Valid admin → allow through
      return NextResponse.next();
    }

    // Non-admin routes in demo mode pass through
    return NextResponse.next();
  }

  // ═══════════════════════════════════════════
  // PRODUCTION MODE (Supabase)
  // ═══════════════════════════════════════════
  return await updateSession(request);
}

/** Redirect to /giris with ?redirect= param */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/giris";
  url.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/hesabim/:path*",
    "/odeme/:path*",
  ],
};
