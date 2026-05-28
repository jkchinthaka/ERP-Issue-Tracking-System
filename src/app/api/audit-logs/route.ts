import { NextRequest } from "next/server";
import { fail, ok, parseSearch } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/lib/models";
import { isObjectId, sanitizeText, serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, "view_audit_log");
    await connectToDatabase();
    const search = parseSearch(request);
    const filter: Record<string, unknown> = {};
    const performedAt: Record<string, Date> = {};
    const action = sanitizeText(search.get("action"), 120);
    const entityId = sanitizeText(search.get("entityId"), 120);
    const userId = sanitizeText(search.get("userId"), 80);
    const from = sanitizeText(search.get("from"), 40);
    const to = sanitizeText(search.get("to"), 40);

    if (action) filter.action = action;
    if (entityId) filter.entityId = entityId;
    if (isObjectId(userId)) filter.performedBy = userId;
    if (from && !Number.isNaN(new Date(from).getTime())) performedAt.$gte = new Date(from);
    if (to && !Number.isNaN(new Date(to).getTime())) performedAt.$lte = new Date(`${to}T23:59:59.999Z`);
    if (Object.keys(performedAt).length) filter.performedAt = performedAt;

    const logs = await AuditLog.find(filter).sort({ performedAt: -1 }).limit(300).populate({ path: "performedBy", select: "name email" }).lean();
    return ok({ logs: serialize(logs) });
  } catch (error) {
    return fail(error);
  }
}
