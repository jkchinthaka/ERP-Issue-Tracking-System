import { IMPACT_TO_PRIORITY, OPEN_STATUSES, SLA_RULES, type Priority } from "./constants";
import { addHours } from "./utils";

export function priorityFromImpact(impact: string): Priority {
  return IMPACT_TO_PRIORITY[impact] || "Medium";
}

export function calculateSla(priority: Priority, createdAt = new Date()) {
  const rule = SLA_RULES.find((item) => item.priority === priority) ?? SLA_RULES[2];

  return {
    ackDueAt: addHours(createdAt, rule.acknowledgeMinutes / 60),
    slaDueAt: addHours(createdAt, rule.resolveHours),
    rule,
  };
}

export function isSlaBreached(issue: { status?: string; slaDueAt?: string | Date | null }) {
  if (!issue.slaDueAt || !issue.status || !OPEN_STATUSES.includes(issue.status)) {
    return false;
  }

  return new Date(issue.slaDueAt).getTime() < Date.now();
}

export function getPendingDays(date?: string | Date | null) {
  if (!date) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

export function getErpHealthScore(issues: Array<Record<string, unknown>>) {
  const penalties = issues.reduce((total, issue) => {
    let penalty = 0;
    if (issue.priority === "Critical") penalty += 5;
    if (isSlaBreached(issue as { status?: string; slaDueAt?: string | Date | null })) penalty += 3;
    if (issue.status === "Pending Vendor" && getPendingDays(issue.updatedAt as string | Date) > 7) penalty += 4;
    if (issue.isRepeated) penalty += 2;
    if (issue.status === "Reopened" || issue.reopenedAt) penalty += 2;
    if (issue.rootCause === "User Training Needed" || issue.requestType === "Training / How-to Support") penalty += 1;
    return total + penalty;
  }, 0);

  const score = Math.max(0, Math.min(100, 100 - penalties));

  if (score >= 90) return { score, label: "Healthy" };
  if (score >= 75) return { score, label: "Good" };
  if (score >= 60) return { score, label: "Needs Improvement" };
  return { score, label: "Critical Attention Needed" };
}
