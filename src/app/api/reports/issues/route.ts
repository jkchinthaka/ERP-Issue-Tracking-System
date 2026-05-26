import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { fail } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Issue } from "@/lib/models";
import { visibleIssueFilter } from "@/lib/permissions";
import { issuePopulate } from "@/lib/queries";
import { serialize } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request, "export_reports");
    await connectToDatabase();
    const issues = serialize(await Issue.find(visibleIssueFilter(user)).sort({ createdAt: -1 }).populate(issuePopulate).lean()) as Array<Record<string, unknown>>;
    const rows = issues.map((issue) => ({
      "Issue ID": issue.issueId,
      Title: issue.title,
      Department: (issue.departmentId as Record<string, unknown>)?.name,
      "ERP Module": (issue.erpModuleId as Record<string, unknown>)?.moduleName,
      "Request Type": issue.requestType,
      Priority: issue.priority,
      Status: issue.status,
      "Business Impact": issue.businessImpact,
      "Reported By": (issue.reportedBy as Record<string, unknown>)?.name,
      "Assigned To": (issue.assignedTo as Record<string, unknown>)?.name,
      "Vendor Required": issue.vendorRequired ? "Yes" : "No",
      "SLA Due": issue.slaDueAt,
      Created: issue.createdAt,
      Resolved: issue.resolvedAt,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "ERP Issues");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="nelna-erp-issues-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
