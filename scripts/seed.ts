import "dotenv/config";
import { connectToDatabase } from "../src/lib/db";
import {
  Attachment,
  AuditLog,
  Department,
  EmailLog,
  ErpModule,
  ImprovementAction,
  Issue,
  IssueComment,
  KnowledgeBase,
  Notification,
  Role,
  Setting,
  SlaRule,
  User,
  Vendor,
  VendorFollowup,
} from "../src/lib/models";
import { DEFAULT_DEPARTMENTS, DEFAULT_ERP_MODULES, DEFAULT_IT_RECIPIENTS, ROLE_PERMISSIONS, SLA_RULES } from "../src/lib/constants";
import { calculateSla } from "../src/lib/sla";
import { hashPassword } from "../src/lib/auth";
import { toId } from "../src/lib/utils";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in .env before running the seed script.`);
  return value;
}

async function upsertRole(roleName: string, description: string) {
  return Role.findOneAndUpdate(
    { roleName },
    { $set: { roleName, description, permissions: ROLE_PERMISSIONS[roleName] ?? [] } },
    { upsert: true, returnDocument: "after" },
  );
}

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  roleId: string;
  departmentId?: string;
  vendorId?: string;
  phone?: string;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  const payload = {
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? "",
    departmentId: input.departmentId,
    roleId: input.roleId,
    vendorId: input.vendorId,
    permissions: [],
    isActive: true,
  };
  const passwordHash = await hashPassword(input.password);

  if (existing) return User.findByIdAndUpdate(existing._id, { $set: { ...payload, passwordHash } }, { returnDocument: "after" });
  return User.create({ ...payload, passwordHash });
}

async function main() {
  requireEnv("MAIN_DATABASE_URL");
  const adminPassword = requireEnv("DEFAULT_ADMIN_PASSWORD");
  const demoPassword = requireEnv("DEMO_USER_PASSWORD");
  await connectToDatabase();

  const roles = {
    superAdmin: await upsertRole("Super Admin", "Full system control and configuration."),
    itSupport: await upsertRole("IT Support", "ERP support team member who handles issues and vendor follow-up."),
    manager: await upsertRole("Manager", "Management dashboard, monthly reporting, and business impact review."),
    departmentHead: await upsertRole("Department Head", "Own department issue monitoring and approval."),
    staff: await upsertRole("Department Staff", "Simple issue reporting and own support status tracking."),
    vendor: await upsertRole("Vendor", "Bileeta support portal access for assigned vendor issues."),
  };

  const departments = new Map<string, string>();
  for (const name of DEFAULT_DEPARTMENTS) {
    const department = await Department.findOneAndUpdate({ name }, { $set: { name, isActive: true } }, { upsert: true, returnDocument: "after" });
    departments.set(name, toId(department._id));
  }

  const modules = new Map<string, string>();
  for (const moduleName of DEFAULT_ERP_MODULES) {
    const erpModule = await ErpModule.findOneAndUpdate(
      { moduleName },
      { $set: { moduleName, description: `${moduleName} ERP support area`, isActive: true } },
      { upsert: true, returnDocument: "after" },
    );
    modules.set(moduleName, toId(erpModule._id));
  }

  const vendor = await Vendor.findOneAndUpdate(
    { vendorName: "Bileeta" },
    { $set: { vendorName: "Bileeta", contactPerson: "Bileeta Support", email: "support@bileeta.local", phone: "+94 11 000 0000", isActive: true } },
    { upsert: true, returnDocument: "after" },
  );

  for (const rule of SLA_RULES) {
    await SlaRule.findOneAndUpdate({ priority: rule.priority }, { $set: { ...rule, isActive: true } }, { upsert: true, returnDocument: "after" });
  }

  await Setting.findOneAndUpdate(
    { key: "defaultItRecipients" },
    { $set: { value: DEFAULT_IT_RECIPIENTS, description: "Default ERP issue email recipients" } },
    { upsert: true, returnDocument: "after" },
  );

  const admin = await upsertUser({
    name: process.env.DEFAULT_ADMIN_NAME || "Super Admin",
    email: process.env.DEFAULT_ADMIN_EMAIL || "admin@nelna.local",
    password: adminPassword,
    roleId: toId(roles.superAdmin._id),
    departmentId: departments.get("IT"),
  });
  const itUser = await upsertUser({ name: "Mr. Pathum", email: "pathum@nelna.local", password: demoPassword, roleId: toId(roles.itSupport._id), departmentId: departments.get("IT") });
  await upsertUser({ name: "Mr. Sampath", email: "sampath@nelna.local", password: demoPassword, roleId: toId(roles.itSupport._id), departmentId: departments.get("IT") });
  await upsertUser({ name: "Mr. Rusith", email: "rusith@nelna.local", password: demoPassword, roleId: toId(roles.itSupport._id), departmentId: departments.get("IT") });
  await upsertUser({ name: "Mr. Chinthaka", email: "chinthaka@nelna.local", password: demoPassword, roleId: toId(roles.itSupport._id), departmentId: departments.get("IT") });
  const manager = await upsertUser({ name: "Management User", email: "manager@nelna.local", password: demoPassword, roleId: toId(roles.manager._id), departmentId: departments.get("Management") });
  const financeHead = await upsertUser({ name: "Finance Department Head", email: "finance.head@nelna.local", password: demoPassword, roleId: toId(roles.departmentHead._id), departmentId: departments.get("Finance") });
  const storesStaff = await upsertUser({ name: "Stores Staff", email: "stores.staff@nelna.local", password: demoPassword, roleId: toId(roles.staff._id), departmentId: departments.get("Stores"), phone: "+94 77 100 2000" });
  const financeStaff = await upsertUser({ name: "Finance Staff", email: "finance.staff@nelna.local", password: demoPassword, roleId: toId(roles.staff._id), departmentId: departments.get("Finance") });
  await upsertUser({ name: "Bileeta Support", email: "bileeta.support@bileeta.local", password: demoPassword, roleId: toId(roles.vendor._id), vendorId: toId(vendor._id) });
  await Department.findByIdAndUpdate(departments.get("Finance"), { $set: { departmentHeadId: financeHead?._id } });

  await Issue.deleteMany({ issueId: /^ERP-/ });
  await IssueComment.deleteMany({});
  await Attachment.deleteMany({});
  await VendorFollowup.deleteMany({});
  await KnowledgeBase.deleteMany({});
  await ImprovementAction.deleteMany({});
  await Notification.deleteMany({});
  await EmailLog.deleteMany({ body: "Seeded email log for dashboard testing." });
  await AuditLog.deleteMany({ entityType: "System", entityId: "seed" });

  const year = new Date().getFullYear();
  const sampleIssues = [
    {
      issueId: `ERP-${year}-0001`, requestType: "ERP Problem / Error", title: "Stock balance report not matching", description: "Stores users see a mismatch between stock balance and batch ledger after GRN posting.", departmentId: departments.get("Stores"), erpModuleId: modules.get("Inventory"), businessImpact: "Customer / supplier / payment / production work is affected", priority: "High" as const, status: "Pending Vendor", reportedBy: storesStaff?._id, assignedTo: itUser?._id, vendorRequired: true, vendorId: vendor._id, rootCause: "Report Logic Issue", preventiveAction: "Vendor fix", isRepeated: true, daysAgo: 8,
    },
    {
      issueId: `ERP-${year}-0002`, requestType: "New Report Request", title: "Monthly payment pending report required", description: "Finance needs a report to identify supplier payment pending ageing by due date.", departmentId: departments.get("Finance"), erpModuleId: modules.get("Finance"), businessImpact: "My work is delayed", priority: "Medium" as const, status: "Resolved", reportedBy: financeStaff?._id, assignedTo: itUser?._id, rootCause: "Process Gap", preventiveAction: "Report correction", solutionNote: "Draft report created and shared for finance review.", daysAgo: 5,
    },
    {
      issueId: `ERP-${year}-0003`, requestType: "Workflow / Approval Delay", title: "Purchase order approval not showing", description: "Department head cannot see pending purchase order approval task in workflow inbox.", departmentId: departments.get("Other"), erpModuleId: modules.get("Approvals"), businessImpact: "I cannot complete today's work", priority: "High" as const, status: "In Progress", reportedBy: financeHead?._id, assignedTo: itUser?._id, rootCause: "Approval Flow Issue", preventiveAction: "ERP configuration change", daysAgo: 2,
    },
    {
      issueId: `ERP-${year}-0004`, requestType: "Training / How-to Support", title: "Need help to cancel incorrect GRN", description: "User needs guidance to cancel a wrong GRN and enter it again correctly.", departmentId: departments.get("Stores"), erpModuleId: modules.get("Inventory"), businessImpact: "I can continue work", priority: "Low" as const, status: "Closed", reportedBy: storesStaff?._id, assignedTo: itUser?._id, rootCause: "User Training Needed", preventiveAction: "User training", solutionNote: "User guided and GRN cancellation steps documented.", daysAgo: 12,
    },
    {
      issueId: `ERP-${year}-0005`, requestType: "Existing Report Correction", title: "Invoice print tax total incorrect", description: "Invoice print format shows tax total twice for one sales order type.", departmentId: departments.get("Sales"), erpModuleId: modules.get("Sales"), businessImpact: "Customer / supplier / payment / production work is affected", priority: "High" as const, status: "Reopened", reportedBy: financeStaff?._id, assignedTo: itUser?._id, vendorRequired: true, vendorId: vendor._id, rootCause: "Vendor Configuration Issue", preventiveAction: "Vendor fix", isRepeated: true, daysAgo: 15,
    },
  ];

  const savedIssues = [];
  for (const sample of sampleIssues) {
    const createdAt = new Date(Date.now() - sample.daysAgo * 86400000);
    const sla = calculateSla(sample.priority, createdAt);
    const saved = await Issue.create({
      ...sample,
      issueType: sample.requestType,
      ackDueAt: sla.ackDueAt,
      slaDueAt: sla.slaDueAt,
      acknowledgedAt: sample.status !== "New" ? new Date(createdAt.getTime() + 45 * 60000) : undefined,
      resolvedAt: ["Resolved", "Closed"].includes(sample.status) ? new Date(createdAt.getTime() + 2 * 86400000) : undefined,
      closedAt: sample.status === "Closed" ? new Date(createdAt.getTime() + 3 * 86400000) : undefined,
      reopenedAt: sample.status === "Reopened" ? new Date(createdAt.getTime() + 5 * 86400000) : undefined,
      recurrenceKey: `${sample.title.toLowerCase()}-${sample.erpModuleId}`,
      createdAt,
      updatedAt: new Date(),
    });
    savedIssues.push(saved);
  }

  for (const issue of savedIssues) {
    await IssueComment.create({ issueId: issue._id, comment: "Issue received and logged in the central ERP support system.", commentType: "Public", isInternal: false, createdBy: itUser?._id });
  }

  await VendorFollowup.create({ issueId: savedIssues[0]._id, vendorId: vendor._id, vendorStatus: "Waiting for Fix", sentDate: new Date(Date.now() - 7 * 86400000), lastFollowupDate: new Date(Date.now() - 2 * 86400000), nextFollowupDate: new Date(Date.now() + 86400000), vendorResponse: "Bileeta is checking stock ledger aggregation logic.", pendingDays: 7, createdBy: itUser?._id });
  await VendorFollowup.create({ issueId: savedIssues[4]._id, vendorId: vendor._id, vendorStatus: "Vendor Acknowledged", sentDate: new Date(Date.now() - 4 * 86400000), lastFollowupDate: new Date(Date.now() - 86400000), vendorResponse: "Patch is planned for validation.", pendingDays: 4, createdBy: itUser?._id });

  await KnowledgeBase.create({ title: "How to cancel an incorrect GRN", erpModuleId: modules.get("Inventory"), issueType: "Training / How-to Support", problem: "A GRN was entered with wrong quantity or wrong supplier document number.", solution: "Open Inventory > GRN > Search document > Cancel. Add reason, confirm approval if required, and re-enter the GRN with correct details.", visibility: "Staff", createdBy: itUser?._id });
  await KnowledgeBase.create({ title: "Approval not visible in workflow inbox", erpModuleId: modules.get("Approvals"), issueType: "Workflow / Approval Delay", problem: "Approval task is not shown to the expected department head.", solution: "Check approval delegation, user role, department mapping, and pending workflow status before escalating to IT.", visibility: "Staff", createdBy: itUser?._id });

  await ImprovementAction.create({ actionId: `ACT-${year}-0001`, sourceIssueId: savedIssues[0]._id, title: "Fix Stock Balance Report", description: "Review repeated stock balance mismatch and get vendor confirmation on report logic.", ownerId: itUser?._id, departmentId: departments.get("Stores"), dueDate: new Date(Date.now() + 14 * 86400000), status: "In Progress", priority: "High", expectedBenefit: "Reduce repeated inventory support requests and manual Excel checking.", managementRemark: "Track in monthly ERP health report." });
  await ImprovementAction.create({ actionId: `ACT-${year}-0002`, sourceIssueId: savedIssues[3]._id, title: "Train Stores users on GRN correction process", description: "Run short user training session and publish SOP link in knowledge base.", ownerId: financeHead?._id, departmentId: departments.get("Stores"), dueDate: new Date(Date.now() + 10 * 86400000), status: "Proposed", priority: "Medium", expectedBenefit: "Reduce user training support calls and repeated GRN mistakes." });

  await EmailLog.create({ issueId: savedIssues[0]._id, to: DEFAULT_IT_RECIPIENTS.map((person) => person.email), cc: [String(manager?.email)], subject: `[ERP Issue] High - Stores - Stock balance report not matching - ${savedIssues[0].issueId}`, body: "Seeded email log for dashboard testing.", status: "Sent", sentAt: new Date(Date.now() - 7 * 86400000) });
  await AuditLog.create({ logId: `AUD-${year}-SEED-0001`, entityType: "System", entityId: "seed", action: "Seed data loaded", newValue: { users: 8, issues: savedIssues.length }, performedBy: admin?._id, performedAt: new Date() });

  await Setting.findOneAndUpdate({ key: `issueCounter.${year}` }, { $set: { value: { sequence: 5 }, description: `Issue ID counter for ${year}` } }, { upsert: true, returnDocument: "after" });
  await Setting.findOneAndUpdate({ key: `improvementActionCounter.${year}` }, { $set: { value: { sequence: 2 }, description: `Improvement action counter for ${year}` } }, { upsert: true, returnDocument: "after" });

  console.log("Seed completed for Nelna ERP Support & Improvement System.");
  console.table([
    { role: "Super Admin", email: process.env.DEFAULT_ADMIN_EMAIL || "admin@nelna.local", password: "from DEFAULT_ADMIN_PASSWORD" },
    { role: "IT Support", email: "pathum@nelna.local", password: "from DEMO_USER_PASSWORD" },
    { role: "Manager", email: "manager@nelna.local", password: "from DEMO_USER_PASSWORD" },
    { role: "Department Head", email: "finance.head@nelna.local", password: "from DEMO_USER_PASSWORD" },
    { role: "Department Staff", email: "stores.staff@nelna.local", password: "from DEMO_USER_PASSWORD" },
    { role: "Vendor", email: "bileeta.support@bileeta.local", password: "from DEMO_USER_PASSWORD" },
  ]);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
