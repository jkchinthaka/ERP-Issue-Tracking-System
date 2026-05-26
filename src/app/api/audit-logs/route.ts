import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/lib/models";
import { serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, "view_audit_log");
    await connectToDatabase();
    const logs = await AuditLog.find({}).sort({ performedAt: -1 }).limit(200).populate({ path: "performedBy", select: "name email" }).lean();
    return ok({ logs: serialize(logs) });
  } catch (error) {
    return fail(error);
  }
}
