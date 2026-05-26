import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attachment, Issue, IssueComment, User, VendorFollowup } from "@/lib/models";
import { canAccessIssue, hasPermission } from "@/lib/permissions";
import { findIssueByIdentity, issueIdentityFilter, issuePopulate } from "@/lib/queries";
import { isObjectId, sanitizeText, serialize, toId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { sendLoggedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const { id } = await params;
    const issue = await findIssueByIdentity(id);
    if (!issue || !canAccessIssue(user, issue)) {
      throw new ApiError("You do not have permission to access this page.", 403);
    }

    const commentsFilter: Record<string, unknown> = { issueId: issue._id };
    if (!hasPermission(user, "add_internal_note")) commentsFilter.isInternal = false;

    const [comments, attachments, followups] = await Promise.all([
      IssueComment.find(commentsFilter).sort({ createdAt: 1 }).populate({ path: "createdBy", select: "name roleId" }).lean(),
      Attachment.find({ issueId: issue._id }).sort({ uploadedAt: -1 }).lean(),
      VendorFollowup.find({ issueId: issue._id }).sort({ updatedAt: -1 }).populate({ path: "vendorId", select: "vendorName contactPerson email" }).lean(),
    ]);

    return ok({ issue: serialize(issue), comments: serialize(comments), attachments: serialize(attachments), followups: serialize(followups) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const current = await Issue.findOne(issueIdentityFilter(id)).lean();
    if (!current || !canAccessIssue(user, current)) {
      throw new ApiError("You do not have permission to access this page.", 403);
    }

    const updates: Record<string, unknown> = {};
    const now = new Date();

    if (body.isDeleted === true) {
      if (!hasPermission(user, "soft_delete_issue")) throw new ApiError("You do not have permission to access this page.", 403);
      updates.isDeleted = true;
    }

    if (typeof body.status === "string" && body.status !== current.status) {
      const requestedStatus = sanitizeText(body.status, 80);
      const selfClose = toId(current.reportedBy) === user.id && ["Closed", "Reopened"].includes(requestedStatus);
      if (!hasPermission(user, "update_status") && !selfClose) {
        throw new ApiError("You do not have permission to access this page.", 403);
      }
      updates.status = requestedStatus;
      if (requestedStatus === "Acknowledged") updates.acknowledgedAt = current.acknowledgedAt ?? now;
      if (requestedStatus === "Resolved") updates.resolvedAt = now;
      if (requestedStatus === "Closed") updates.closedAt = now;
      if (requestedStatus === "Reopened") updates.reopenedAt = now;
    }

    if (typeof body.priority === "string" && body.priority !== current.priority) {
      if (!hasPermission(user, "update_status")) throw new ApiError("You do not have permission to access this page.", 403);
      updates.priority = sanitizeText(body.priority, 80);
    }

    if (typeof body.assignedTo === "string") {
      if (!hasPermission(user, "assign_issue")) throw new ApiError("You do not have permission to access this page.", 403);
      updates.assignedTo = isObjectId(body.assignedTo) ? body.assignedTo : undefined;
      if (!updates.status && current.status === "New") updates.status = "Assigned";
    }

    if (typeof body.vendorRequired === "boolean" || typeof body.vendorId === "string") {
      if (!hasPermission(user, "manage_vendor_followup") && !hasPermission(user, "update_status")) {
        throw new ApiError("You do not have permission to access this page.", 403);
      }
      if (typeof body.vendorRequired === "boolean") updates.vendorRequired = body.vendorRequired;
      if (typeof body.vendorId === "string") updates.vendorId = isObjectId(body.vendorId) ? body.vendorId : undefined;
      if (body.vendorRequired === true) updates.status = "Pending Vendor";
    }

    for (const field of ["rootCause", "preventiveAction", "solutionNote"] as const) {
      if (typeof body[field] === "string") {
        if (!hasPermission(user, "update_status")) throw new ApiError("You do not have permission to access this page.", 403);
        updates[field] = sanitizeText(body[field], 2500);
      }
    }

    if (typeof body.isRepeated === "boolean") {
      if (!hasPermission(user, "update_status")) throw new ApiError("You do not have permission to access this page.", 403);
      updates.isRepeated = body.isRepeated;
    }

    if (typeof body.managementRemark === "string") {
      if (!hasPermission(user, "view_management_dashboard")) throw new ApiError("You do not have permission to access this page.", 403);
      updates.managementRemark = sanitizeText(body.managementRemark, 2500);
    }

    if (typeof body.satisfactionScore === "number" && toId(current.reportedBy) === user.id) {
      updates.satisfactionScore = Math.max(1, Math.min(5, Math.round(body.satisfactionScore)));
    }

    if (!Object.keys(updates).length) {
      throw new ApiError("No valid changes were submitted.", 400);
    }

    const updated = await Issue.findOneAndUpdate(issueIdentityFilter(id), { $set: updates }, { returnDocument: "after" }).populate(issuePopulate).lean();

    if (updates.vendorRequired && updates.vendorId) {
      await VendorFollowup.findOneAndUpdate(
        { issueId: current._id, vendorId: updates.vendorId },
        { $setOnInsert: { issueId: current._id, vendorId: updates.vendorId, vendorStatus: "Sent to Vendor", sentDate: now, createdBy: user.id } },
        { upsert: true, returnDocument: "after" },
      );
    }

    await createAuditLog({
      entityType: "Issue",
      entityId: toId(current._id),
      action: updates.isDeleted ? "Issue soft deleted" : updates.status ? "Status changed" : "Issue updated",
      oldValue: current,
      newValue: updates,
      performedBy: user.id,
      request,
    });

    if (updates.status === "Resolved") {
      const reporter = await User.findById(current.reportedBy).lean();
      if (reporter?.email) {
        await sendLoggedEmail({
          issueId: toId(current._id),
          to: [String(reporter.email)],
          subject: `[ERP Issue Resolved] ${current.issueId} - ${current.title}`,
          body: `Issue ${current.issueId} has been marked Resolved. Please confirm and close it if the problem is fixed.`,
        });
      }
    }

    return ok({ issue: serialize(updated) });
  } catch (error) {
    return fail(error);
  }
}
