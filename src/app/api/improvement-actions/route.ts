import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ImprovementAction } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { generateActionId } from "@/lib/issue-id";
import { serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { optionalDateField, optionalObjectIdField, optionalText, requiredText, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const improvementActionSchema = z.object({
  sourceIssueId: optionalObjectIdField("Source issue"),
  title: requiredText("Improvement title", 180),
  description: optionalText(3000),
  ownerId: optionalObjectIdField("Owner"),
  departmentId: optionalObjectIdField("Department"),
  dueDate: optionalDateField("Due date"),
  status: optionalText(80),
  priority: optionalText(80),
  expectedBenefit: optionalText(2000),
  actualResult: optionalText(2000),
  managementRemark: optionalText(2000),
});

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
    if (!hasPermission(user, "update_status") && !hasPermission(user, "manage_settings")) throw new ApiError("You do not have permission to access this page.", 403);
    await connectToDatabase();
    const body = validateInput(improvementActionSchema, await request.json());
    const saved = await ImprovementAction.create({
      actionId: await generateActionId(),
      sourceIssueId: body.sourceIssueId,
      title: body.title,
      description: body.description ?? "",
      ownerId: body.ownerId,
      departmentId: body.departmentId,
      dueDate: body.dueDate,
      status: body.status || "Proposed",
      priority: body.priority || "Medium",
      expectedBenefit: body.expectedBenefit ?? "",
      actualResult: body.actualResult ?? "",
      managementRemark: body.managementRemark ?? "",
    });
    await createAuditLog({ entityType: "ImprovementAction", entityId: String(saved._id), action: "Improvement action created", performedBy: user.id, request, newValue: saved });
    return ok({ action: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
