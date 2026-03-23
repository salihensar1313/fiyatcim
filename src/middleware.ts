import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyAdminToken, DEMO_ADMIN_COOKIE } from "@/lib/demo-auth";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ═══════════════════════════════════════════
// WAF: Suspicious pattern detection
// ═══════════════════════════════════════════
const BLOCKED_PATTERNS = [
  /\.\.(\/|\\)/,                         // Path traversal
  /<script/i,                            // XSS attempt
  /union\s+(all\s+)?select/i,            // SQL injection
  /\b(eval|exec|system|passthru)\s*\(/i, // Code injection
  /\/etc\/(passwd|shadow|hosts)/i,        // System file access
  /\/\.(env|git|svn|htaccess)/i,         // Sensitive files
  /wp-(admin|login|content|includes)/i,  // WordPress scan
  /phpmyadmin|phpinfo/i,                 // PHP admin probes
  /\/(cgi-bin|wp-json|xmlrpc)/i,         // Common attack targets
];

const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /nuclei/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /semrush/i,    // Aggressive crawlers
];

// Simple IP rate limiter for API routes
const apiHits = new Map<string, { count: number; resetAt: number }>();
const API_RATE_WINDOW = 60_000; // 1 minute
const API_RATE_MAX = 60; // 60 requests per minute per IP for API routes

function isApiRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = apiHits.get(ip);

  // Lazy cleanup
  if (apiHits.size > 10000) {
    apiHits.forEach((v, k) => {
      if (now > v.resetAt) apiHits.delete(k);
    });
  }

  if (!entry || now > entry.resetAt) {
    apiHits.set(ip, { count: 1, resetAt: now + API_RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > API_RATE_MAX;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api/");

  // ═══════════════════════════════════════════
  // WAF: Block suspicious requests
  // ═══════════════════════════════════════════
  const fullUrl = request.nextUrl.pathname + request.nextUrl.search;
  const userAgent = request.headers.get("user-agent") || "";

  // Block malicious URL patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Block known attack tools
  for (const pattern of BLOCKED_USER_AGENTS) {
    if (pattern.test(userAgent)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ═══════════════════════════════════════════
  // API Global Rate Limiting
  // ═══════════════════════════════════════════
  if (isApiRoute) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isApiRateLimited(ip)) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen biraz bekleyin." },
        { status: 429 }
      );
    }
  }

  // ═══════════════════════════════════════════
  // DEMO MODE
  // ═══════════════════════════════════════════
  if (IS_DEMO) {
    if (isAdminRoute) {
      const token = request.cookies.get(DEMO_ADMIN_COOKIE)?.value;

      if (!token) {
        return redirectToLogin(request);
      }

      const isValid = await verifyAdminToken(token);
      if (!isValid) {
        const response = redirectToLogin(request);
        response.cookies.set(DEMO_ADMIN_COOKIE, "", {
          httpOnly: true,
          path: "/",
          maxAge: 0,
        });
        return response;
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // ═══════════════════════════════════════════
  // PRODUCTION MODE (Supabase)
  // ═══════════════════════════════════════════
  const response = await updateSession(request);

  return response;
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
    "/api/:path*",
    // WAF: catch common attack paths
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
