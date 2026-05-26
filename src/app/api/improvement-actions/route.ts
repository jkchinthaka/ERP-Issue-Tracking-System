import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ImprovementAction } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { generateActionId } from "@/lib/issue-id";
import { isObjectId, sanitizeText, serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, "view_dashboard");
    await connectToDatabase();
    const actions = await ImprovementAction.find({}).sort({ dueDate: 1, createdAt: -1 }).populate({ path: "ownerId", select: "name email" }).populate({ path: "departmentId", select: "name" }).populate({ path: "sourceIssueId", select: "issueId title" }).lean();
    return ok({ actions: serialize(actions) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user, "update_status") && !hasPermission(user, "view_management_dashboard")) throw new ApiError("You do not have permission to access this page.", 403);
    await connectToDatabase();
    const body = await request.json();
    const saved = await ImprovementAction.create({
      actionId: await generateActionId(),
      sourceIssueId: isObjectId(String(body.sourceIssueId)) ? body.sourceIssueId : undefined,
      title: sanitizeText(body.title, 180),
      description: sanitizeText(body.description, 3000),
      ownerId: isObjectId(String(body.ownerId)) ? body.ownerId : undefined,
      departmentId: isObjectId(String(body.departmentId)) ? body.departmentId : undefined,
      dueDate: body.dueDate ? new Date(String(body.dueDate)) : undefined,
      status: sanitizeText(body.status, 80) || "Proposed",
      priority: sanitizeText(body.priority, 80) || "Medium",
      expectedBenefit: sanitizeText(body.expectedBenefit, 2000),
      actualResult: sanitizeText(body.actualResult, 2000),
      managementRemark: sanitizeText(body.managementRemark, 2000),
    });
    await createAuditLog({ entityType: "ImprovementAction", entityId: String(saved._id), action: "Improvement action created", performedBy: user.id, request, newValue: saved });
    return ok({ action: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
