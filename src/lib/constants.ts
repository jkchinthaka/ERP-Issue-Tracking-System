export const PERMISSIONS = [
  "create_issue",
  "view_own_issue",
  "view_department_issue",
  "view_all_issues",
  "assign_issue",
  "update_status",
  "add_comment",
  "add_internal_note",
  "add_vendor_note",
  "manage_vendor_followup",
  "manage_users",
  "manage_departments",
  "manage_erp_modules",
  "manage_settings",
  "view_dashboard",
  "view_management_dashboard",
  "export_reports",
  "approve_change_request",
  "manage_sla",
  "view_audit_log",
  "soft_delete_issue",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  "Super Admin": [...PERMISSIONS],
  "IT Support": [
    "create_issue",
    "view_own_issue",
    "view_department_issue",
    "view_all_issues",
    "assign_issue",
    "update_status",
    "add_comment",
    "add_internal_note",
    "add_vendor_note",
    "manage_vendor_followup",
    "view_dashboard",
    "export_reports",
  ],
  Manager: [
    "view_all_issues",
    "view_dashboard",
    "view_management_dashboard",
    "export_reports",
  ],
  "Department Head": [
    "create_issue",
    "view_own_issue",
    "view_department_issue",
    "add_comment",
    "view_dashboard",
    "approve_change_request",
    "export_reports",
  ],
  "Department Staff": [
    "create_issue",
    "view_own_issue",
    "add_comment",
    "view_dashboard",
  ],
  Vendor: ["add_comment", "add_vendor_note", "view_dashboard"],
};

export const REQUEST_TYPES = [
  "ERP Problem / Error",
  "New Report Request",
  "Existing Report Correction",
  "User Access Request",
  "Permission Issue",
  "Data Correction Request",
  "Workflow / Approval Delay",
  "Print Format Issue",
  "System Slow / Performance Issue",
  "Vendor Pending Follow-up",
  "Training / How-to Support",
  "Manual Work / Process Improvement Request",
  "New ERP Feature Request",
  "Other",
] as const;

export const ISSUE_STATUSES = [
  "New",
  "Acknowledged",
  "Assigned",
  "In Progress",
  "Pending User",
  "Pending Vendor",
  "Waiting for Approval",
  "Fix Provided",
  "Testing",
  "Resolved",
  "Closed",
  "Reopened",
  "Cancelled",
] as const;

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const BUSINESS_IMPACT_OPTIONS = [
  "I can continue work",
  "My work is delayed",
  "I cannot complete today's work",
  "Customer / supplier / payment / production work is affected",
  "Whole department operation is blocked",
] as const;

export const IMPACT_TO_PRIORITY: Record<string, Priority> = {
  "I can continue work": "Low",
  "My work is delayed": "Medium",
  "I cannot complete today's work": "High",
  "Customer / supplier / payment / production work is affected": "High",
  "Whole department operation is blocked": "Critical",
};

export const ROOT_CAUSE_CATEGORIES = [
  "ERP Bug",
  "User Training Needed",
  "Permission Issue",
  "Data Entry Mistake",
  "Report Logic Issue",
  "Network / Connectivity Issue",
  "Vendor Configuration Issue",
  "Process Gap",
  "Approval Flow Issue",
  "Master Data Issue",
  "Unknown",
] as const;

export const PREVENTIVE_ACTIONS = [
  "User training",
  "ERP configuration change",
  "Vendor fix",
  "Report correction",
  "Process change",
  "Permission review",
  "Data cleaning",
  "SOP update",
  "No further action",
] as const;

export const VENDOR_STATUSES = [
  "Not Sent",
  "Sent to Vendor",
  "Vendor Acknowledged",
  "Waiting for Fix",
  "Fix Provided",
  "Testing",
  "Completed",
  "Escalated",
] as const;

export const IMPROVEMENT_ACTION_STATUSES = [
  "Proposed",
  "Approved",
  "In Progress",
  "Completed",
  "On Hold",
  "Cancelled",
] as const;

export const DEFAULT_DEPARTMENTS = [
  "IT",
  "Finance",
  "Sales",
  "Stores",
  "Production",
  "HR",
  "Transport",
  "Management",
  "Farm Operations",
  "Other",
];

export const DEFAULT_ERP_MODULES = [
  "Inventory",
  "Sales",
  "Finance",
  "Purchase",
  "HR",
  "Production",
  "Reports",
  "Approvals",
  "User Management",
  "Other",
];

export const DEFAULT_IT_RECIPIENTS = [
  { name: "Mr. Pathum", email: "pathum@nelna.local" },
  { name: "Mr. Sampath", email: "sampath@nelna.local" },
  { name: "Mr. Rusith", email: "rusith@nelna.local" },
  { name: "Mr. Chinthaka", email: "chinthaka@nelna.local" },
];

export const SLA_RULES = [
  {
    priority: "Critical" as const,
    acknowledgeMinutes: 15,
    resolveHours: 8,
    escalationRule:
      "Notify IT lead after 15 minutes, manager after 2 hours, and keep issue visible as a business blocker.",
  },
  {
    priority: "High" as const,
    acknowledgeMinutes: 60,
    resolveHours: 24,
    escalationRule:
      "Notify department head if pending more than 1 working day.",
  },
  {
    priority: "Medium" as const,
    acknowledgeMinutes: 240,
    resolveHours: 72,
    escalationRule:
      "Review in daily IT support queue and include in daily summary.",
  },
  {
    priority: "Low" as const,
    acknowledgeMinutes: 480,
    resolveHours: 120,
    escalationRule:
      "Track in weekly support queue and include in improvement review.",
  },
];

export const OPEN_STATUSES = [
  "New",
  "Acknowledged",
  "Assigned",
  "In Progress",
  "Pending User",
  "Pending Vendor",
  "Waiting for Approval",
  "Fix Provided",
  "Testing",
  "Reopened",
];

export const CLOSED_STATUSES = ["Resolved", "Closed", "Cancelled"];
