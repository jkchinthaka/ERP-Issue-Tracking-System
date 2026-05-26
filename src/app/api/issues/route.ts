import { NextRequest } from "next/server";
import { fail, ok, parseSearch } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attachment, Department, ErpModule, Issue, User, Vendor } from "@/lib/models";
import { issuePopulate } from "@/lib/queries";
import { visibleIssueFilter } from "@/lib/permissions";
import { calculateSla, priorityFromImpact } from "@/lib/sla";
import { isObjectId, sanitizeText, serialize, toId } from "@/lib/utils";
import { generateIssueId } from "@/lib/issue-id";
import { saveIssueAttachment } from "@/lib/files";
import { createAuditLog } from "@/lib/audit";
import { sendIssueEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const search = parseSearch(request);
    const filter: Record<string, unknown> = { ...visibleIssueFilter(user) };

    for (const key of ["departmentId", "erpModuleId", "priority", "status", "requestType", "assignedTo", "vendorRequired"]) {
      const value = search.get(key);
      if (!value) continue;
      if (key.endsWith("Id") || key === "assignedTo") {
        if (isObjectId(value)) filter[key] = value;
      } else if (key === "vendorRequired") {
        filter[key] = value === "true";
      } else {
        filter[key] = value;
      }
    }

    const query = sanitizeText(search.get("q"), 120);
    if (query) {
      filter.$and = [{ $or: [{ issueId: new RegExp(query, "i") }, { title: new RegExp(query, "i") }, { description: new RegExp(query, "i") }] }];
    }

    const issues = await Issue.find(filter).sort({ createdAt: -1 }).limit(300).populate(issuePopulate).lean();
    return ok({ issues: serialize(issues) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, "create_issue");
    await connectToDatabase();

    const contentType = request.headers.get("content-type") ?? "";
    let data: Record<string, unknown> = {};
    let attachmentFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
      const maybeFile = formData.get("attachment");
      attachmentFile = maybeFile instanceof File && maybeFile.size > 0 ? maybeFile : null;
    } else {
      data = await request.json();
    }

    const requestType = sanitizeText(data.requestType, 120);
    const departmentId = sanitizeText(data.departmentId, 80);
    const erpModuleId = sanitizeText(data.erpModuleId, 80);
    const title = sanitizeText(data.title, 160);
    const description = sanitizeText(data.description, 3000);
    const businessImpact = sanitizeText(data.businessImpact, 220);

    if (!requestType || !departmentId || !erpModuleId || !title || !description || !businessImpact) {
      throw new ApiError("Please fill all required fields.", 400);
    }

    if (!isObjectId(departmentId) || !isObjectId(erpModuleId)) {
      throw new ApiError("Invalid department or ERP module selected.", 400);
    }

    const createdAt = new Date();
    const priority = priorityFromImpact(businessImpact);
    const sla = calculateSla(priority, createdAt);
    const issueId = await generateIssueId();
    const defaultAssignee = await User.findOne({ isActive: true }).populate({ path: "roleId", match: { roleName: "IT Support" } }).lean();

    const issue = await Issue.create({
      issueId,
      requestType,
      title,
      description,
      departmentId,
      erpModuleId,
      issueType: requestType,
      businessImpact,
      priority,
      status: "New",
      reportedBy: user.id,
      assignedTo: defaultAssignee?.roleId ? toId(defaultAssignee._id) : undefined,
      ackDueAt: sla.ackDueAt,
      slaDueAt: sla.slaDueAt,
      erpScreen: sanitizeText(data.erpScreen, 160),
      documentNumber: sanitizeText(data.documentNumber, 160),
      neededBeforeDate: sanitizeText(data.neededBeforeDate, 60) ? new Date(String(data.neededBeforeDate)) : undefined,
      contactNumber: sanitizeText(data.contactNumber, 60),
      recurrenceKey: `${title.toLowerCase()}-${erpModuleId}`,
      createdAt,
    });

    let attachmentError = "";
    let attachmentLink = "";
    if (attachmentFile) {
      try {
        const attachment = await saveIssueAttachment(attachmentFile, issueId);
        attachmentLink = attachment.fileUrl;
        await Attachment.create({ ...attachment, issueId: issue._id, uploadedBy: user.id });
        await createAuditLog({ entityType: "Issue", entityId: toId(issue._id), action: "Attachment uploaded", performedBy: user.id, request, newValue: attachment });
      } catch (error) {
        attachmentError = error instanceof Error ? error.message : "Attachment upload failed. You can submit the issue without attachment.";
      }
    }

    const [department, erpModule, reporter] = await Promise.all([
      Department.findById(departmentId).lean(),
      ErpModule.findById(erpModuleId).lean(),
      User.findById(user.id).lean(),
    ]);

    const extraTo: string[] = [];
    if (priority === "Critical") {
      const managers = await User.find({ isActive: true }).populate({ path: "roleId", match: { roleName: "Manager" } }).lean();
      extraTo.push(...managers.filter((manager) => manager.roleId).map((manager) => String(manager.email)));
    }

    const emailResult = await sendIssueEmail({
      issue: { ...issue.toObject(), attachmentLink },
      departmentName: String(department?.name ?? "Department"),
      moduleName: String(erpModule?.moduleName ?? "ERP Module"),
      reportedByName: String(reporter?.name ?? user.name),
      reportedByEmail: String(reporter?.email ?? user.email),
      extraTo,
    });

    await createAuditLog({
      entityType: "Issue",
      entityId: toId(issue._id),
      action: "Issue created",
      performedBy: user.id,
      request,
      newValue: { issueId, priority, status: "New", emailStatus: emailResult.ok ? "Sent" : "Failed" },
    });

    const populated = await Issue.findById(issue._id).populate(issuePopulate).lean();
    return ok(
      {
        issue: serialize(populated),
        emailStatus: emailResult.ok ? "sent" : "failed",
        message: emailResult.ok ? "Issue submitted successfully." : "Your issue was saved, but email notification failed. IT can still see your issue.",
        attachmentError,
      },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
