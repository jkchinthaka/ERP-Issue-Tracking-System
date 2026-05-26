import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Department, ErpModule, KnowledgeBase, Role, SlaRule, User, Vendor } from "@/lib/models";
import {
  BUSINESS_IMPACT_OPTIONS,
  IMPROVEMENT_ACTION_STATUSES,
  ISSUE_STATUSES,
  PERMISSIONS,
  PREVENTIVE_ACTIONS,
  PRIORITIES,
  REQUEST_TYPES,
  ROOT_CAUSE_CATEGORIES,
  VENDOR_STATUSES,
} from "@/lib/constants";
import { serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    await connectToDatabase();
    const [departments, erpModules, vendors, users, roles, slaRules, knowledgeBase] = await Promise.all([
      Department.find({ isActive: true }).sort({ name: 1 }).lean(),
      ErpModule.find({ isActive: true }).sort({ moduleName: 1 }).lean(),
      Vendor.find({ isActive: true }).sort({ vendorName: 1 }).lean(),
      User.find({ isActive: true }).select("-passwordHash").sort({ name: 1 }).populate({ path: "roleId", select: "roleName" }).lean(),
      Role.find({}).sort({ roleName: 1 }).lean(),
      SlaRule.find({ isActive: true }).sort({ resolveHours: 1 }).lean(),
      KnowledgeBase.find({}).sort({ updatedAt: -1 }).populate({ path: "erpModuleId", select: "moduleName" }).limit(50).lean(),
    ]);

    return ok(
      serialize({
        departments,
        erpModules,
        vendors,
        users,
        roles,
        slaRules,
        knowledgeBase,
        constants: {
          requestTypes: REQUEST_TYPES,
          statuses: ISSUE_STATUSES,
          priorities: PRIORITIES,
          businessImpactOptions: BUSINESS_IMPACT_OPTIONS,
          rootCauseCategories: ROOT_CAUSE_CATEGORIES,
          preventiveActions: PREVENTIVE_ACTIONS,
          vendorStatuses: VENDOR_STATUSES,
          improvementActionStatuses: IMPROVEMENT_ACTION_STATUSES,
          permissions: PERMISSIONS,
        },
      }),
    );
  } catch (error) {
    return fail(error);
  }
}
