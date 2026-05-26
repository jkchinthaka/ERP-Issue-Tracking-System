import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { IssueComment } from "@/lib/models";
import { canAccessIssue, hasPermission } from "@/lib/permissions";
import { findIssueByIdentity } from "@/lib/queries";
import { sanitizeText, serialize, toId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request, "add_comment");
    await connectToDatabase();
    const { id } = await params;
    const issue = await findIssueByIdentity(id);
    if (!issue || !canAccessIssue(user, issue)) {
      throw new ApiError("You do not have permission to access this page.", 403);
    }

    const body = await request.json();
    const comment = sanitizeText(body.comment, 3000);
    const isInternal = body.isInternal === true;
    const isVendor = body.commentType === "Vendor";
    if (!comment) throw new ApiError("Please enter a comment.", 400);
    if (isInternal && !hasPermission(user, "add_internal_note")) throw new ApiError("You do not have permission to access this page.", 403);
    if (isVendor && !hasPermission(user, "add_vendor_note")) throw new ApiError("You do not have permission to access this page.", 403);

    const saved = await IssueComment.create({
      issueId: issue._id,
      comment,
      commentType: isVendor ? "Vendor" : isInternal ? "Internal" : "Public",
      isInternal,
      createdBy: user.id,
    });

    await createAuditLog({ entityType: "Issue", entityId: toId(issue._id), action: "Comment added", performedBy: user.id, request, newValue: { commentType: saved.commentType, isInternal } });
    return ok({ comment: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
