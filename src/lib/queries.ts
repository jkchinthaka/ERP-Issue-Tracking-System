import { Issue } from "./models";
import { isObjectId } from "./utils";

export const issuePopulate = [
  { path: "departmentId", select: "name" },
  { path: "erpModuleId", select: "moduleName" },
  { path: "reportedBy", select: "name email" },
  { path: "assignedTo", select: "name email" },
  { path: "vendorId", select: "vendorName contactPerson email" },
];

export function issueIdentityFilter(id: string) {
  return isObjectId(id) ? { _id: id, isDeleted: false } : { issueId: id, isDeleted: false };
}

export async function findIssueByIdentity(id: string) {
  return Issue.findOne(issueIdentityFilter(id)).populate(issuePopulate).lean();
}
