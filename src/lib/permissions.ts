import type { FilterQuery } from "mongoose";
import type { Permission } from "./constants";
import { toId } from "./utils";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  departmentId: string;
  departmentName: string;
  vendorId: string;
  permissions: Permission[];
};

export function hasPermission(user: AuthenticatedUser, permission: Permission) {
  return user.permissions.includes(permission);
}

export function canAccessIssue(user: AuthenticatedUser, issue: Record<string, unknown>) {
  if (hasPermission(user, "view_all_issues")) {
    return true;
  }

  if (user.roleName === "Vendor" && user.vendorId && toId(issue.vendorId) === user.vendorId) {
    return true;
  }

  if (hasPermission(user, "view_department_issue") && user.departmentId && toId(issue.departmentId) === user.departmentId) {
    return true;
  }

  if (hasPermission(user, "view_own_issue") && toId(issue.reportedBy) === user.id) {
    return true;
  }

  return false;
}

export function visibleIssueFilter(user: AuthenticatedUser): FilterQuery<unknown> {
  if (hasPermission(user, "view_all_issues")) {
    return { isDeleted: false };
  }

  if (user.roleName === "Vendor" && user.vendorId) {
    return { isDeleted: false, vendorId: user.vendorId };
  }

  const clauses: Array<Record<string, string | boolean>> = [{ isDeleted: false, reportedBy: user.id }];

  if (hasPermission(user, "view_department_issue") && user.departmentId) {
    clauses.push({ isDeleted: false, departmentId: user.departmentId });
  }

  return { $or: clauses };
}
