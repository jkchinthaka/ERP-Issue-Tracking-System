import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, hashPassword, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Department, ErpModule, Role, SlaRule, User, Vendor } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { emailField, objectIdField, optionalObjectIdField, optionalText, requiredText, validateInput, z } from "@/lib/validation";
import { PERMISSIONS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const setupSchema = z.object({
  type: requiredText("Setup type", 80),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const departmentSchema = z.object({ name: requiredText("Department name", 120) });
const erpModuleSchema = z.object({ moduleName: requiredText("Module name", 120), description: optionalText(500) });
const vendorSchema = z.object({ vendorName: requiredText("Vendor name", 140), contactPerson: optionalText(140), email: optionalText(180), phone: optionalText(80) });
const userSchema = z.object({
  name: requiredText("Name", 140),
  email: emailField(),
  password: z.preprocess((value) => (typeof value === "string" ? value : ""), z.string().min(8, "Password must be at least 8 characters.").max(256, "Password is too long.")),
  phone: optionalText(80),
  departmentId: optionalObjectIdField("Department"),
  roleId: objectIdField("Role"),
  vendorId: optionalObjectIdField("Vendor"),
});
const slaRuleSchema = z.object({
  priority: requiredText("Priority", 80),
  acknowledgeMinutes: z.coerce.number().positive("Acknowledge minutes must be greater than zero."),
  resolveHours: z.coerce.number().positive("Resolve hours must be greater than zero."),
  escalationRule: optionalText(1000),
});
const roleSchema = z.object({
  roleName: requiredText("Role name", 120),
  description: optionalText(500),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const body = validateInput(setupSchema, await request.json());
    const { type } = body;
    let saved: unknown;
    let auditAction = "Settings changed";

    if (type === "department") {
      if (!hasPermission(user, "manage_departments")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(departmentSchema, body.payload);
      saved = await Department.create({ name: payload.name, isActive: true });
      auditAction = "Department created";
    } else if (type === "erpModule") {
      if (!hasPermission(user, "manage_erp_modules")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(erpModuleSchema, body.payload);
      saved = await ErpModule.create({ moduleName: payload.moduleName, description: payload.description ?? "", isActive: true });
      auditAction = "ERP module created";
    } else if (type === "vendor") {
      if (!hasPermission(user, "manage_settings")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(vendorSchema, body.payload);
      saved = await Vendor.create({ vendorName: payload.vendorName, contactPerson: payload.contactPerson ?? "", email: payload.email ?? "", phone: payload.phone ?? "", isActive: true });
      auditAction = "Settings changed";
    } else if (type === "user") {
      if (!hasPermission(user, "manage_users")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(userSchema, body.payload);
      saved = await User.create({
        name: payload.name,
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        phone: payload.phone ?? "",
        departmentId: payload.departmentId,
        roleId: payload.roleId,
        vendorId: payload.vendorId,
        permissions: [],
        isActive: true,
      });
      auditAction = "User created";
    } else if (type === "slaRule") {
      if (!hasPermission(user, "manage_sla")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(slaRuleSchema, body.payload);
      saved = await SlaRule.findOneAndUpdate(
        { priority: payload.priority },
        {
          $set: {
            acknowledgeMinutes: payload.acknowledgeMinutes,
            resolveHours: payload.resolveHours,
            escalationRule: payload.escalationRule ?? "",
            isActive: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      auditAction = "Settings changed";
    } else if (type === "role") {
      if (!hasPermission(user, "manage_settings")) throw new ApiError("You do not have permission to access this page.", 403);
      const payload = validateInput(roleSchema, body.payload);
      saved = await Role.create({ roleName: payload.roleName, description: payload.description ?? "", permissions: payload.permissions });
      auditAction = "User role change";
    } else {
      throw new ApiError("Unsupported setup record type.", 400);
    }

    await createAuditLog({ entityType: "AdminSetup", entityId: type, action: auditAction, performedBy: user.id, request, newValue: saved });
    return ok({ saved: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
