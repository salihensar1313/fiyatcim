import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, DEMO_ADMIN_COOKIE, DEMO_COOKIE_MAX_AGE } from "@/lib/demo-auth";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * POST /api/auth/demo-admin
 * Sets an httpOnly, signed admin cookie for demo mode.
 * Body: { userId: string, email: string }
 */
export async function POST(request: NextRequest) {
  if (!IS_DEMO) {
    return NextResponse.json({ error: "Not in demo mode" }, { status: 403 });
  }

  try {
    const { userId, email } = await request.json();

    if (!userId || !email || typeof userId !== "string" || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const token = await createAdminToken(userId, email);

    const response = NextResponse.json({ success: true });
    response.cookies.set(DEMO_ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: DEMO_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

/**
 * DELETE /api/auth/demo-admin
 * Clears the admin cookie on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(DEMO_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // expire immediately
  });
  return response;
}
