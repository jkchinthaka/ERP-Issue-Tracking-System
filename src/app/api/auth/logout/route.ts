import { NextRequest, NextResponse } from "next/server";
import { requireAuth, SESSION_COOKIE } from "@/lib/auth";
import { fail } from "@/lib/api";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await createAuditLog({ entityType: "User", entityId: user.id, action: "User logout", performedBy: user.id, request });
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    return response;
  } catch (error) {
    return fail(error);
  }
}
