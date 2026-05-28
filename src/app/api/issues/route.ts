import { NextRequest } from "next/server";
import { fail, ok, parseSearch } from "@/lib/api";
import { ApiError, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Attachment, Department, ErpModule, Issue, User } from "@/lib/models";
import { issuePopulate } from "@/lib/queries";
import { visibleIssueFilter } from "@/lib/permissions";
import { calculateSla, priorityFromImpact } from "@/lib/sla";
import { isObjectId, sanitizeText, serialize, toId } from "@/lib/utils";
import { generateIssueId } from "@/lib/issue-id";
import { saveIssueAttachment } from "@/lib/files";
import { createAuditLog } from "@/lib/audit";
import { sendIssueEmail } from "@/lib/email";
import { cleanText, objectIdField, optionalDateField, requiredText, validateInput, z } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createIssueSchema = z.object({
  requestType: requiredText("Request type", 120),
  departmentId: objectIdField("Department"),
  erpModuleId: objectIdField("ERP module"),
  title: requiredText("Issue title", 160),
  description: requiredText("Description", 3000),
  businessImpact: requiredText("Business impact", 220),
  erpScreen: cleanText(160),
  documentNumber: cleanText(160),
  neededBeforeDate: optionalDateField("Needed before date"),
  contactNumber: cleanText(60),
});

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

    const input = validateInput(createIssueSchema, data);

    const createdAt = new Date();
    const priority = priorityFromImpact(input.businessImpact);
    const sla = calculateSla(priority, createdAt);
    const issueId = await generateIssueId();
    const defaultAssignee = await User.findOne({ isActive: true }).populate({ path: "roleId", match: { roleName: "IT Support" } }).lean();

    const issue = await Issue.create({
      issueId,
      requestType: input.requestType,
      title: input.title,
      description: input.description,
      departmentId: input.departmentId,
      erpModuleId: input.erpModuleId,
      issueType: input.requestType,
      businessImpact: input.businessImpact,
      priority,
      status: "New",
      reportedBy: user.id,
      assignedTo: defaultAssignee?.roleId ? toId(defaultAssignee._id) : undefined,
      ackDueAt: sla.ackDueAt,
      slaDueAt: sla.slaDueAt,
      erpScreen: input.erpScreen,
      documentNumber: input.documentNumber,
      neededBeforeDate: input.neededBeforeDate,
      contactNumber: input.contactNumber,
      recurrenceKey: `${input.title.toLowerCase()}-${input.erpModuleId}`,
      createdAt,
    });

    let attachmentError = "";
    let attachmentLink = "";
    if (attachmentFile) {
      try {
        const attachment = await saveIssueAttachment(attachmentFile, issueId);
        attachmentLink = attachment.fileUrl;
        await Attachment.create({ ...attachment, issueId: issue._id, uploadedBy: user.id });
        await createAuditLog({ entityType: "Issue", entityId: toId(issue._id), action: "Attachment added", performedBy: user.id, request, newValue: attachment });
      } catch (error) {
        attachmentError = error instanceof Error ? error.message : "Attachment upload failed. You can submit the issue without attachment.";
      }
    }

    const [department, erpModule, reporter] = await Promise.all([
      Department.findById(input.departmentId).lean(),
      ErpModule.findById(input.erpModuleId).lean(),
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
