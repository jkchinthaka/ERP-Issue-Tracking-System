import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { buildDashboard } from "@/lib/dashboard";
import { connectToDatabase } from "@/lib/db";
import { Issue } from "@/lib/models";
import { visibleIssueFilter } from "@/lib/permissions";
import { issuePopulate } from "@/lib/queries";
import { serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, "view_dashboard");
    await connectToDatabase();
    const issues = await Issue.find(visibleIssueFilter(user)).populate(issuePopulate).sort({ createdAt: -1 }).lean();
    return ok({ dashboard: serialize(buildDashboard(serialize(issues), user.id)) });
  } catch (error) {
    return fail(error);
  }
}
