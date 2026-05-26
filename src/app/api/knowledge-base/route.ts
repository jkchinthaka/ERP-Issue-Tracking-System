import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { KnowledgeBase } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { isObjectId, sanitizeText, serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user, "update_status")) throw new ApiError("You do not have permission to access this page.", 403);
    await connectToDatabase();
    const body = await request.json();
    if (!isObjectId(String(body.erpModuleId))) throw new ApiError("Please select a valid ERP module.", 400);
    const saved = await KnowledgeBase.create({
      title: sanitizeText(body.title, 160),
      erpModuleId: body.erpModuleId,
      issueType: sanitizeText(body.issueType, 140),
      problem: sanitizeText(body.problem, 3000),
      solution: sanitizeText(body.solution, 5000),
      visibility: sanitizeText(body.visibility, 80) || "Staff",
      departmentId: isObjectId(String(body.departmentId)) ? body.departmentId : undefined,
      createdBy: user.id,
    });
    await createAuditLog({ entityType: "KnowledgeBase", entityId: String(saved._id), action: "Knowledge base article created", performedBy: user.id, request, newValue: saved });
    return ok({ article: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
