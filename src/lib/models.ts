import mongoose, { Schema } from "mongoose";

const objectId = Schema.Types.ObjectId;

const timestamps = {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
};

const roleSchema = new Schema(
  {
    roleName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    permissions: [{ type: String, required: true }],
  },
  { ...timestamps, collection: "roles" },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    departmentId: { type: objectId, ref: "Department" },
    roleId: { type: objectId, ref: "Role", required: true },
    vendorId: { type: objectId, ref: "Vendor" },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { ...timestamps, collection: "users" },
);

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    departmentHeadId: { type: objectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  { ...timestamps, collection: "departments" },
);

const erpModuleSchema = new Schema(
  {
    moduleName: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { ...timestamps, collection: "erpModules" },
);

const vendorSchema = new Schema(
  {
    vendorName: { type: String, required: true, unique: true, trim: true },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { ...timestamps, collection: "vendors" },
);

const issueSchema = new Schema(
  {
    issueId: { type: String, required: true, unique: true, index: true },
    requestType: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    departmentId: { type: objectId, ref: "Department", required: true, index: true },
    erpModuleId: { type: objectId, ref: "ErpModule", required: true, index: true },
    issueType: { type: String, default: "" },
    businessImpact: { type: String, required: true },
    priority: { type: String, required: true, index: true },
    status: { type: String, default: "New", index: true },
    reportedBy: { type: objectId, ref: "User", required: true, index: true },
    assignedTo: { type: objectId, ref: "User", index: true },
    vendorRequired: { type: Boolean, default: false, index: true },
    vendorId: { type: objectId, ref: "Vendor", index: true },
    ackDueAt: { type: Date },
    slaDueAt: { type: Date, index: true },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    reopenedAt: { type: Date },
    erpScreen: { type: String, default: "" },
    documentNumber: { type: String, default: "" },
    neededBeforeDate: { type: Date },
    contactNumber: { type: String, default: "" },
    rootCause: { type: String, default: "" },
    preventiveAction: { type: String, default: "" },
    solutionNote: { type: String, default: "" },
    isRepeated: { type: Boolean, default: false, index: true },
    recurrenceKey: { type: String, default: "" },
    managementRemark: { type: String, default: "" },
    satisfactionScore: { type: Number },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { ...timestamps, collection: "issues" },
);

issueSchema.index({ title: "text", description: "text", issueId: "text" });

const issueCommentSchema = new Schema(
  {
    issueId: { type: objectId, ref: "Issue", required: true, index: true },
    comment: { type: String, required: true, trim: true },
    commentType: { type: String, default: "Public" },
    isInternal: { type: Boolean, default: false },
    createdBy: { type: objectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, collection: "issueComments" },
);

const attachmentSchema = new Schema(
  {
    issueId: { type: objectId, ref: "Issue", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: objectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false }, collection: "attachments" },
);

const vendorFollowupSchema = new Schema(
  {
    issueId: { type: objectId, ref: "Issue", required: true, index: true },
    vendorId: { type: objectId, ref: "Vendor", required: true, index: true },
    vendorStatus: { type: String, default: "Not Sent", index: true },
    sentDate: { type: Date },
    lastFollowupDate: { type: Date },
    nextFollowupDate: { type: Date },
    vendorResponse: { type: String, default: "" },
    pendingDays: { type: Number, default: 0 },
    attachment: { type: String, default: "" },
    internalNote: { type: String, default: "" },
    createdBy: { type: objectId, ref: "User" },
  },
  { ...timestamps, collection: "vendorFollowups" },
);

const emailLogSchema = new Schema(
  {
    issueId: { type: objectId, ref: "Issue", index: true },
    to: [{ type: String }],
    cc: [{ type: String }],
    subject: { type: String, required: true },
    body: { type: String, default: "" },
    status: { type: String, required: true },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now },
  },
  { collection: "emailLogs" },
);

const auditLogSchema = new Schema(
  {
    logId: { type: String, required: true, unique: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    performedBy: { type: objectId, ref: "User" },
    performedAt: { type: Date, default: Date.now },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { collection: "auditLogs" },
);

const knowledgeBaseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    erpModuleId: { type: objectId, ref: "ErpModule", required: true, index: true },
    issueType: { type: String, required: true, index: true },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    attachment: { type: String, default: "" },
    visibility: { type: String, default: "Staff" },
    departmentId: { type: objectId, ref: "Department" },
    createdBy: { type: objectId, ref: "User", required: true },
  },
  { ...timestamps, collection: "knowledgeBase" },
);

const improvementActionSchema = new Schema(
  {
    actionId: { type: String, required: true, unique: true, index: true },
    sourceIssueId: { type: objectId, ref: "Issue" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    ownerId: { type: objectId, ref: "User" },
    departmentId: { type: objectId, ref: "Department" },
    dueDate: { type: Date },
    status: { type: String, default: "Proposed", index: true },
    priority: { type: String, default: "Medium" },
    expectedBenefit: { type: String, default: "" },
    actualResult: { type: String, default: "" },
    managementRemark: { type: String, default: "" },
  },
  { ...timestamps, collection: "improvementActions" },
);

const slaRuleSchema = new Schema(
  {
    priority: { type: String, required: true, unique: true },
    acknowledgeMinutes: { type: Number, required: true },
    resolveHours: { type: Number, required: true },
    escalationRule: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { ...timestamps, collection: "slaRules" },
);

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: {} },
    description: { type: String, default: "" },
    updatedBy: { type: objectId, ref: "User" },
  },
  { timestamps: { createdAt: false, updatedAt: "updatedAt" }, collection: "settings" },
);

const notificationSchema = new Schema(
  {
    userId: { type: objectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "Info" },
    isRead: { type: Boolean, default: false },
    relatedIssueId: { type: objectId, ref: "Issue" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, collection: "notifications" },
);

export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);
export const ErpModule = mongoose.models.ErpModule || mongoose.model("ErpModule", erpModuleSchema);
export const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
export const Issue = mongoose.models.Issue || mongoose.model("Issue", issueSchema);
export const IssueComment = mongoose.models.IssueComment || mongoose.model("IssueComment", issueCommentSchema);
export const Attachment = mongoose.models.Attachment || mongoose.model("Attachment", attachmentSchema);
export const VendorFollowup = mongoose.models.VendorFollowup || mongoose.model("VendorFollowup", vendorFollowupSchema);
export const EmailLog = mongoose.models.EmailLog || mongoose.model("EmailLog", emailLogSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export const KnowledgeBase = mongoose.models.KnowledgeBase || mongoose.model("KnowledgeBase", knowledgeBaseSchema);
export const ImprovementAction = mongoose.models.ImprovementAction || mongoose.model("ImprovementAction", improvementActionSchema);
export const SlaRule = mongoose.models.SlaRule || mongoose.model("SlaRule", slaRuleSchema);
export const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
