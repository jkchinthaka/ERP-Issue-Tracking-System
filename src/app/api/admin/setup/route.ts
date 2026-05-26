import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { ApiError, hashPassword, requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Department, ErpModule, Role, SlaRule, User, Vendor } from "@/lib/models";
import { hasPermission } from "@/lib/permissions";
import { isObjectId, sanitizeText, serialize } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();
    const body = await request.json();
    const type = sanitizeText(body.type, 80);
    const payload = body.payload ?? {};
    let saved: unknown;

    if (type === "department") {
      if (!hasPermission(user, "manage_departments")) throw new ApiError("You do not have permission to access this page.", 403);
      saved = await Department.create({ name: sanitizeText(payload.name, 120), isActive: true });
    } else if (type === "erpModule") {
      if (!hasPermission(user, "manage_erp_modules")) throw new ApiError("You do not have permission to access this page.", 403);
      saved = await ErpModule.create({ moduleName: sanitizeText(payload.moduleName, 120), description: sanitizeText(payload.description, 500), isActive: true });
    } else if (type === "vendor") {
      if (!hasPermission(user, "manage_settings")) throw new ApiError("You do not have permission to access this page.", 403);
      saved = await Vendor.create({ vendorName: sanitizeText(payload.vendorName, 140), contactPerson: sanitizeText(payload.contactPerson, 140), email: sanitizeText(payload.email, 180), phone: sanitizeText(payload.phone, 80), isActive: true });
    } else if (type === "user") {
      if (!hasPermission(user, "manage_users")) throw new ApiError("You do not have permission to access this page.", 403);
      const roleId = sanitizeText(payload.roleId, 80);
      const password = typeof payload.password === "string" ? payload.password : "";
      if (!isObjectId(roleId) || !password) throw new ApiError("Role and password are required for a new user.", 400);
      saved = await User.create({
        name: sanitizeText(payload.name, 140),
        email: sanitizeText(payload.email, 180).toLowerCase(),
        passwordHash: await hashPassword(password),
        phone: sanitizeText(payload.phone, 80),
        departmentId: isObjectId(String(payload.departmentId)) ? payload.departmentId : undefined,
        roleId,
        vendorId: isObjectId(String(payload.vendorId)) ? payload.vendorId : undefined,
        permissions: [],
        isActive: true,
      });
    } else if (type === "slaRule") {
      if (!hasPermission(user, "manage_sla")) throw new ApiError("You do not have permission to access this page.", 403);
      saved = await SlaRule.findOneAndUpdate(
        { priority: sanitizeText(payload.priority, 80) },
        {
          $set: {
            acknowledgeMinutes: Number(payload.acknowledgeMinutes),
            resolveHours: Number(payload.resolveHours),
            escalationRule: sanitizeText(payload.escalationRule, 1000),
            isActive: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    } else if (type === "role") {
      if (!hasPermission(user, "manage_settings")) throw new ApiError("You do not have permission to access this page.", 403);
      saved = await Role.create({ roleName: sanitizeText(payload.roleName, 120), description: sanitizeText(payload.description, 500), permissions: payload.permissions ?? [] });
    } else {
      throw new ApiError("Unsupported setup record type.", 400);
    }

    await createAuditLog({ entityType: "AdminSetup", entityId: type, action: "Admin setting changed", performedBy: user.id, request, newValue: saved });
    return ok({ saved: serialize(saved) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
