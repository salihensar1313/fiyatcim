import { NextResponse } from "next/server";

/**
 * POST/DELETE /api/auth/demo-admin
 *
 * GÜVENLIK: Bu endpoint tamamen devre dışı bırakılmıştır.
 * Demo admin cookie üretimi production'da privilege escalation riski
 * oluşturduğu için kaldırılmıştır.
 *
 * Geçmiş: Bu route demo modda herhangi bir userId/email ile admin cookie
 * üretiyordu. İnternete açık ortamda doğrudan yetki yükseltme zinciri
 * oluşturuyordu.
 *
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #1
 */
export async function POST() {
  return NextResponse.json(
    { error: "Demo admin endpoint devre disi birakilmistir." },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Demo admin endpoint devre disi birakilmistir." },
    { status: 403 }
  );
}
