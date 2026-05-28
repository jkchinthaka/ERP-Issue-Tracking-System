import { OPEN_STATUSES } from "./constants";
import { getErpHealthScore, getPendingDays, isSlaBreached } from "./sla";
import { minutesBetween, toId } from "./utils";

type AnyIssue = Record<string, unknown>;

function groupByName(issues: AnyIssue[], key: string, fallback = "Not set") {
  const grouped = new Map<string, number>();
  for (const issue of issues) {
    const raw = issue[key];
    let label = fallback;
    if (typeof raw === "string") label = raw;
    if (raw && typeof raw === "object") {
      const objectValue = raw as Record<string, unknown>;
      label = String(objectValue.name ?? objectValue.moduleName ?? objectValue.vendorName ?? objectValue.roleName ?? fallback);
    }
    grouped.set(label, (grouped.get(label) ?? 0) + 1);
  }
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}

function averageMinutes(values: Array<number | null>) {
  const usable = values.filter((value): value is number => typeof value === "number");
  if (!usable.length) return 0;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function topGroupLabel(values: Array<{ name: string; value: number }>, fallback = "No issues") {
  const top = [...values].sort((left, right) => right.value - left.value)[0];
  return top && top.value > 0 ? `${top.name} (${top.value})` : fallback;
}

export function buildDashboard(issues: AnyIssue[], userId?: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = now.toISOString().slice(0, 10);
  const openIssues = issues.filter((issue) => OPEN_STATUSES.includes(String(issue.status)));
  const slaBreached = issues.filter((issue) => isSlaBreached(issue));
  const pendingVendor = issues.filter((issue) => issue.status === "Pending Vendor" || issue.vendorRequired);
  const resolvedToday = issues.filter((issue) => issue.resolvedAt && String(issue.resolvedAt).startsWith(today));
  const monthIssues = issues.filter((issue) => new Date(String(issue.createdAt)).getTime() >= startOfMonth.getTime());
  const assignedToMe = userId ? issues.filter((issue) => toId(issue.assignedTo) === userId) : [];
  const criticalIssues = openIssues.filter((issue) => issue.priority === "Critical");
  const repeatedIssues = issues.filter((issue) => issue.isRepeated);
  const trainingNeeds = issues.filter(
    (issue) => issue.rootCause === "User Training Needed" || issue.requestType === "Training / How-to Support",
  );
  const reopened = issues.filter((issue) => issue.status === "Reopened" || issue.reopenedAt);
  const averageAck = averageMinutes(issues.map((issue) => minutesBetween(issue.createdAt as string, issue.acknowledgedAt as string)));
  const averageResolution = averageMinutes(issues.map((issue) => minutesBetween(issue.createdAt as string, issue.resolvedAt as string)));
  const health = getErpHealthScore(monthIssues);
  const byDepartment = groupByName(issues, "departmentId", "Department");
  const byModule = groupByName(issues, "erpModuleId", "ERP Module");

  return {
    cards: {
      totalThisMonth: monthIssues.length,
      openIssues: openIssues.length,
      newIssues: issues.filter((issue) => issue.status === "New").length,
      criticalIssues: criticalIssues.length,
      assignedToMe: assignedToMe.length,
      pendingVendor: pendingVendor.length,
      pendingUser: issues.filter((issue) => issue.status === "Pending User").length,
      slaBreached: slaBreached.length,
      resolvedToday: resolvedToday.length,
      reopenedIssues: reopened.length,
      repeatedIssues: repeatedIssues.length,
      averageAckMinutes: averageAck,
      averageResolutionMinutes: averageResolution,
      topAffectedDepartment: topGroupLabel(byDepartment),
      topErpModule: topGroupLabel(byModule),
      trainingNeeds: trainingNeeds.length,
      erpHealthScore: health.score,
      erpHealthLabel: health.label,
    },
    charts: {
      byDepartment,
      byModule,
      byStatus: groupByName(issues, "status", "Status"),
      byPriority: groupByName(issues, "priority", "Priority"),
      rootCause: groupByName(issues, "rootCause", "Unknown"),
      trainingNeeds: groupByName(trainingNeeds, "departmentId", "Department"),
      vendorAgeing: pendingVendor.map((issue) => ({
        name: String(issue.issueId),
        value: getPendingDays(issue.updatedAt as string | Date),
      })),
      monthlyTrend: buildMonthlyTrend(issues),
      departmentImpact: buildDepartmentImpact(issues),
    },
  };
}

function buildMonthlyTrend(issues: AnyIssue[]) {
  const grouped = new Map<string, number>();
  for (const issue of issues) {
    const date = new Date(String(issue.createdAt));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }
  return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => ({ name, value }));
}

function buildDepartmentImpact(issues: AnyIssue[]) {
  const weights: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 4,
    Critical: 6,
  };
  const grouped = new Map<string, number>();
  for (const issue of issues) {
    const department = issue.departmentId as Record<string, unknown> | undefined;
    const name = String(department?.name ?? "Department");
    grouped.set(name, (grouped.get(name) ?? 0) + (weights[String(issue.priority)] ?? 1));
  }
  return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
}
