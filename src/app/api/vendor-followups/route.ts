import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Issue, VendorFollowup } from "@/lib/models";
import { canAccessIssue, hasPermission, visibleIssueFilter } from "@/lib/permissions";
import { issuePopulate } from "@/lib/queries";
import { getPendingDays } from "@/lib/sla";
import { serialize, toId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { objectIdField, optionalDateField, optionalText, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createVendorFollowupSchema = z.object({
  issueId: objectIdField("Issue"),
  vendorId: objectIdField("Vendor"),
  vendorStatus: optionalText(80),
  sentDate: optionalDateField("Sent date"),
  lastFollowupDate: optionalDateField("Last follow-up date"),
  nextFollowupDate: optionalDateField("Next follow-up date"),
  vendorResponse: optionalText(3000),
  internalNote: optionalText(3000),
});

const updateVendorFollowupSchema = z.object({
  followupId: objectIdField("Follow-up"),
  vendorStatus: optionalText(80),
  vendorResponse: optionalText(3000),
  internalNote: optionalText(3000),
  nextFollowupDate: optionalDateField("Next follow-up date"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const issueIds = await Issue.find(visibleIssueFilter(user)).select("_id").lean();
    const followups = await VendorFollowup.find({ issueId: { $in: issueIds.map((issue) => issue._id) } })
      .sort({ updatedAt: -1 })
      .populate({ path: "issueId", populate: issuePopulate })
      .populate({ path: "vendorId", select: "vendorName contactPerson email phone" })
      .lean();
    return ok({ followups: serialize(followups) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, "manage_vendor_followup");
    await connectToDatabase();
    const body = validateInput(createVendorFollowupSchema, await request.json());
    const { issueId, vendorId } = body;
    const issue = await Issue.findById(issueId).lean();
    if (!issue || !canAccessIssue(user, issue)) throw new ApiError("You do not have permission to access this page.", 403);
    const now = new Date();
    const saved = await VendorFollowup.create({
      issueId,
      vendorId,
      vendorStatus: body.vendorStatus || "Sent to Vendor",
      sentDate: body.sentDate ?? now,
      lastFollowupDate: body.lastFollowupDate ?? now,
      nextFollowupDate: body.nextFollowupDate,
      vendorResponse: body.vendorResponse ?? "",
      internalNote: body.internalNote ?? "",
      pendingDays: getPendingDays(now),
      createdBy: user.id,
    });
    await Issue.findByIdAndUpdate(issueId, { $set: { vendorRequired: true, vendorId, status: "Pending Vendor" } });
    await createAuditLog({ entityType: "VendorFollowup", entityId: toId(saved._id), action: "Vendor follow-up created", performedBy: user.id, request, newValue: saved });
    return ok({ followup: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const body = validateInput(updateVendorFollowupSchema, await request.json());
    const followupId = body.followupId;
    const current = await VendorFollowup.findById(followupId).lean();
    if (!current) throw new ApiError("Vendor follow-up not found.", 404);
    const issue = await Issue.findById(current.issueId).lean();
    if (!issue || !canAccessIssue(user, issue)) throw new ApiError("You do not have permission to access this page.", 403);
    if (!hasPermission(user, "manage_vendor_followup") && !hasPermission(user, "add_vendor_note")) {
      throw new ApiError("You do not have permission to access this page.", 403);
    }
    const updates = {
      vendorStatus: body.vendorStatus || current.vendorStatus,
      vendorResponse: body.vendorResponse || current.vendorResponse,
      internalNote: hasPermission(user, "manage_vendor_followup") ? body.internalNote || current.internalNote : current.internalNote,
      lastFollowupDate: new Date(),
      nextFollowupDate: body.nextFollowupDate ?? current.nextFollowupDate,
      pendingDays: getPendingDays(current.sentDate as Date),
    };
    const updated = await VendorFollowup.findByIdAndUpdate(followupId, { $set: updates }, { returnDocument: "after" }).populate({ path: "vendorId", select: "vendorName contactPerson email" }).lean();
    await createAuditLog({ entityType: "VendorFollowup", entityId: followupId, action: "Vendor status changed", oldValue: current, newValue: updates, performedBy: user.id, request });
    return ok({ followup: serialize(updated) });
  } catch (error) {
    return fail(error);
  }
}
