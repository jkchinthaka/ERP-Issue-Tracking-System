import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { KnowledgeBase } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { optionalObjectIdField, optionalText, objectIdField, requiredText, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const knowledgeBaseSchema = z.object({
  title: requiredText("Title", 160),
  erpModuleId: objectIdField("ERP module"),
  issueType: requiredText("Issue type", 140),
  problem: requiredText("Problem", 3000),
  solution: requiredText("Solution", 5000),
  visibility: optionalText(80),
  departmentId: optionalObjectIdField("Department"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user, "update_status")) throw new ApiError("You do not have permission to access this page.", 403);
    await connectToDatabase();
    const body = validateInput(knowledgeBaseSchema, await request.json());
    const saved = await KnowledgeBase.create({
      title: body.title,
      erpModuleId: body.erpModuleId,
      issueType: body.issueType,
      problem: body.problem,
      solution: body.solution,
      visibility: body.visibility || "Staff",
      departmentId: body.departmentId,
      createdBy: user.id,
    });
    await createAuditLog({ entityType: "KnowledgeBase", entityId: String(saved._id), action: "Knowledge base article created", performedBy: user.id, request, newValue: saved });
    return ok({ article: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
