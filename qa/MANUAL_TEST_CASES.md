<!-- markdownlint-disable MD060 -->

# Manual Test Cases

Use this template for execution:

| Test Case ID | Module | Scenario | Preconditions | Steps | Test Data | Expected Result | Actual Result | Status | Priority | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | Authentication | Valid login | Seeded active user exists | Open app, enter valid email/password, click Sign in | Admin/IT/Staff credentials | User lands on dashboard with correct name/role |  | Not Run | High |  |
| AUTH-002 | Authentication | Invalid login | Login page open | Enter valid email and wrong password | `admin@nelna.local` + wrong password | 401-style friendly error; no dashboard access |  | Not Run | High |  |
| AUTH-003 | Authentication | Empty email/password | Login page open | Clear email and password, submit | Blank values | Browser/app blocks submit or shows required message |  | Not Run | Medium |  |
| AUTH-004 | Authentication | Wrong password attempts | Login page open | Try wrong password repeatedly | Wrong password 8+ times | Attempts are rate-limited with friendly message |  | Not Run | High |  |
| AUTH-005 | Authentication | Malformed email | Login page open | Enter malformed email and password | `bad-email` | Validation error; no 500 |  | Not Run | Medium |  |
| AUTH-006 | Authentication | Disabled user cannot login | Disabled test user exists | Login as disabled user | Disabled user credentials | Login blocked with invalid credentials/session message |  | Not Run | High | Needs disabled fixture |
| AUTH-007 | Authentication | Session expiry | Logged in session | Expire/delete cookie, refresh page | Browser devtools/cookie clear | User returns to login; friendly session expired message where applicable |  | Not Run | High |  |
| AUTH-008 | Authentication | Logout | User logged in | Click Logout | Any role | Session cleared and login screen appears |  | Not Run | High |  |
| AUTH-009 | Authentication | Browser refresh after login | User logged in | Refresh browser | Any role | Session persists and dashboard reloads |  | Not Run | Medium |  |
| AUTH-010 | Authentication | Direct access without login | No session | Open app in private window | None | Login page appears; protected APIs reject access |  | Not Run | High |  |
| RBAC-001 | Role-Based Access | Super Admin access | Admin logged in | Open Dashboard, Admin Setup, Audit & Email Logs | Admin user | Admin can manage setup and see logs |  | Not Run | High |  |
| RBAC-002 | Role-Based Access | IT Support access | IT logged in | Open issue workflow and vendor follow-up | IT user | IT can view all issues, assign, update status, create follow-up |  | Not Run | High |  |
| RBAC-003 | Role-Based Access | Manager read-only access | Manager logged in | Open issue detail and try workflow update | Manager user | Manager can view reports/dashboard but update is hidden or blocked |  | Not Run | High |  |
| RBAC-004 | Role-Based Access | Staff own issue access | Staff logged in | Open My Issues | Staff user | Only staff-created issues are listed |  | Not Run | High |  |
| RBAC-005 | Role-Based Access | Department Head department-only access | Department head logged in | Open issue list | Department head user | Only own department issues plus own issues are visible |  | Not Run | High |  |
| RBAC-006 | Role-Based Access | Vendor assigned issue-only access | Vendor logged in | Open vendor follow-up/issues | Vendor user | Only issues assigned to vendor are visible |  | Not Run | High |  |
| RBAC-007 | Role-Based Access | Unauthorized page access | Non-admin logged in | Try Admin Setup/Audit navigation | Staff/Vendor | Restricted nav is hidden or API blocks access |  | Not Run | High |  |
| RBAC-008 | Role-Based Access | Unauthorized API access | Staff logged in | Call `/api/audit-logs` directly | Staff cookie | 403 response; no data returned |  | Not Run | High |  |
| ISSUE-001 | Issue Submission | Submit required fields | Staff logged in; reference data exists | Open Report ERP Issue, fill required fields, submit | Valid request type, department, module, impact, title, description | Issue created with generated ID |  | Not Run | High |  |
| ISSUE-002 | Issue Submission | Submit optional fields | Staff logged in | Fill required + ERP screen, document number, needed date, contact | Optional values | Issue saved with optional details |  | Not Run | Medium |  |
| ISSUE-003 | Issue Submission | Submit screenshot | Staff logged in | Attach valid PNG/JPG and submit | Valid image under 5 MB | Attachment saved/logged; issue still created |  | Not Run | Medium |  |
| ISSUE-004 | Issue Submission | Submit without optional fields | Staff logged in | Fill only required fields | Required data only | Issue is created successfully |  | Not Run | High |  |
| ISSUE-005 | Issue Submission | Critical business impact | Staff logged in | Select blocked/critical impact and submit | Critical impact option | Priority auto-calculates as Critical |  | Not Run | High |  |
| ISSUE-006 | Issue Submission | Required field validation | Staff logged in | Leave title/description blank and submit | Missing required fields | Clear validation; no issue created |  | Not Run | High |  |
| ISSUE-007 | Issue Submission | Duplicate submission prevention | Staff logged in | Double-click submit rapidly | Same issue data | Only one issue or safe duplicate handling; no crash |  | Not Run | Medium |  |
| ISSUE-008 | Issue Submission | Invalid file upload | Staff logged in | Attach `.exe` or `.js` | Malicious file | Upload rejected; issue can still be submitted without attachment |  | Not Run | High |  |
| ISSUE-009 | Issue Submission | Large file upload | Staff logged in | Attach file over 5 MB | Large PDF/image | File rejected with friendly message |  | Not Run | Medium |  |
| ISSUE-010 | Issue Submission | Mobile issue submission | Staff logged in on 360px | Submit issue from mobile viewport | Mobile browser | Form is usable; no hidden submit button |  | Not Run | High |  |
| WF-001 | Issue Workflow | New status | Staff submits issue | Open issue list/detail | New issue | Issue starts as New |  | Not Run | High |  |
| WF-002 | Issue Workflow | Acknowledged | IT logged in | Set status to Acknowledged | Existing issue | Status changes and audit log exists |  | Not Run | High |  |
| WF-003 | Issue Workflow | Assigned | IT logged in | Assign owner | IT user | Owner saved, status assigned if previously New |  | Not Run | High |  |
| WF-004 | Issue Workflow | In Progress | IT logged in | Set status In Progress | Existing issue | Status saved and dashboard count updates |  | Not Run | High |  |
| WF-005 | Issue Workflow | Pending User | IT logged in | Set status Pending User | Existing issue | Status saved; staff can see update |  | Not Run | Medium |  |
| WF-006 | Issue Workflow | Pending Vendor | IT logged in | Mark vendor required, choose vendor | Vendor record | Status changes to Pending Vendor and follow-up record exists |  | Not Run | High |  |
| WF-007 | Issue Workflow | Waiting for Approval | IT logged in | Set status Waiting for Approval | Existing issue | Status saved; audit log created |  | Not Run | Medium |  |
| WF-008 | Issue Workflow | Fix Provided | IT logged in | Set status Fix Provided | Existing issue | Status saved |  | Not Run | Medium |  |
| WF-009 | Issue Workflow | Testing | IT logged in | Set status Testing | Existing issue | Status saved |  | Not Run | Medium |  |
| WF-010 | Issue Workflow | Resolved | IT logged in | Set status Resolved | Existing issue | Resolved timestamp set; email log created/sent or failed |  | Not Run | High |  |
| WF-011 | Issue Workflow | Closed | Reporter logged in | Close resolved issue | Reporter issue | Closed timestamp set; audit log created |  | Not Run | High |  |
| WF-012 | Issue Workflow | Reopened | Reporter logged in | Reopen resolved/closed issue | Reporter issue | Reopened timestamp set; audit log created |  | Not Run | High |  |
| WF-013 | Issue Workflow | Cancelled | IT/Admin logged in | Set status Cancelled | Existing issue | Status saved; no data deleted |  | Not Run | Medium |  |
| COM-001 | Comments | Add public comment | User with add comment permission | Add public comment | Normal text | Comment appears to permitted viewers |  | Not Run | Medium |  |
| COM-002 | Comments | Add internal note as IT | IT logged in | Add internal note | Internal note text | Internal note visible to IT/Admin only |  | Not Run | High |  |
| COM-003 | Comments | Staff cannot see internal note | Staff logged in | Open issue with internal note | Staff user | Internal note hidden |  | Not Run | High |  |
| COM-004 | Comments | Empty comment rejected | User logged in | Submit blank comment | Empty string | Validation error; no comment saved |  | Not Run | Medium |  |
| COM-005 | Comments | XSS in comment escaped | User logged in | Add `<script>alert(1)</script>` | XSS payload | Script is sanitized/escaped and not executed |  | Not Run | High |  |
| VEND-001 | Vendor Follow-up | Mark issue vendor required | IT logged in | Select vendor required and vendor | Bileeta vendor | Vendor follow-up is created |  | Not Run | High |  |
| VEND-002 | Vendor Follow-up | Add vendor response | Vendor logged in | Update response text | Vendor text | Response saved and visible to IT |  | Not Run | High |  |
| VEND-003 | Vendor Follow-up | Update vendor status | IT/Vendor logged in | Change vendor status | Waiting/Fix Provided | Status saved and audit log created |  | Not Run | Medium |  |
| VEND-004 | Vendor Follow-up | Vendor pending ageing | Vendor issue exists | Review pending days | Existing pending issue | Pending days display and increase over time |  | Not Run | Medium |  |
| VEND-005 | Vendor Follow-up | Vendor cannot close issue | Vendor logged in | Try close issue/status API | Vendor cookie | Close/update workflow blocked |  | Not Run | High |  |
| VEND-006 | Vendor Follow-up | Vendor cannot see unrelated issues | Vendor logged in | Open issue list/API | Vendor account | Non-vendor issues are absent |  | Not Run | High |  |
| DASH-001 | Dashboard | Staff dashboard | Staff logged in | Open dashboard | Staff user | Own-scope metrics load |  | Not Run | Medium |  |
| DASH-002 | Dashboard | IT dashboard | IT logged in | Open dashboard | IT user | All issue workflow metrics load |  | Not Run | High |  |
| DASH-003 | Dashboard | Manager dashboard | Manager logged in | Open dashboard | Manager user | Management cards/charts load read-only |  | Not Run | High |  |
| DASH-004 | Dashboard | Department dashboard | Department Head logged in | Open dashboard | Dept head | Department-scope data loads |  | Not Run | Medium |  |
| DASH-005 | Dashboard | Vendor dashboard | Vendor logged in | Open dashboard/vendor view | Vendor user | Vendor-assigned metrics only |  | Not Run | High |  |
| DASH-006 | Dashboard | Empty states | Empty test dataset | Open dashboard | No issues | Friendly empty states, no chart warnings |  | Not Run | Medium |  |
| DASH-007 | Dashboard | Loading states | Slow network simulation | Load app/dashboard | Throttled network | Branded loading and skeletons appear; no endless spinner |  | Not Run | High |  |
| DASH-008 | Dashboard | API failure states | Dashboard API mocked failed | Load dashboard | 500/502 | Friendly dashboard error and Retry/Refresh path |  | Not Run | High |  |
| DASH-009 | Dashboard | Charts show correct labels | Dashboard data exists | Inspect charts | Real data | Business labels render clearly |  | Not Run | Medium |  |
| AUD-001 | Audit Logs | Issue created | Staff submits issue | Open audit as admin | Issue created | `Issue created` audit log exists |  | Not Run | High |  |
| AUD-002 | Audit Logs | Status changed | IT changes status | Open audit | Status change | `Status changed` or specific status audit exists |  | Not Run | High |  |
| AUD-003 | Audit Logs | Assignment changed | IT assigns issue | Open audit | Assignment | `Assignment changed` audit exists |  | Not Run | High |  |
| AUD-004 | Audit Logs | Priority changed | IT changes priority | Open audit | Priority | `Priority changed` audit exists |  | Not Run | High |  |
| AUD-005 | Audit Logs | Comment added | User comments | Open audit | Comment | `Comment added` audit exists |  | Not Run | Medium |  |
| AUD-006 | Audit Logs | Attachment added | Staff uploads file | Open audit | Valid file | `Attachment added` audit exists |  | Not Run | Medium |  |
| AUD-007 | Audit Logs | Vendor status changed | Vendor/IT changes vendor status | Open audit | Vendor status | `Vendor status changed` audit exists |  | Not Run | High |  |
| AUD-008 | Audit Logs | Issue closed | Reporter closes issue | Open audit | Closed issue | `Issue closed` audit exists |  | Not Run | High |  |
| AUD-009 | Audit Logs | Issue reopened | Reporter reopens issue | Open audit | Reopened issue | `Issue reopened` audit exists |  | Not Run | High |  |
| AUD-010 | Audit Logs | Role changed | Admin changes/creates role | Open audit | Role setup | `User role change` audit exists |  | Not Run | High |  |
| REP-001 | Reports/Export | Export issue report | User with export permission | Open Reports, export Excel | Manager/IT/Admin | Excel downloads and opens |  | Not Run | High |  |
| REP-002 | Reports/Export | Export with filters | Issues filtered | Export report | Filtered dataset | Export respects visible/scoped issue data |  | Not Run | Medium |  |
| REP-003 | Reports/Export | Empty export | Empty visible dataset | Export report | No issues | File generated with headers, no crash |  | Not Run | Low |  |
| REP-004 | Reports/Export | Manager read-only export | Manager logged in | Export report | Manager user | Export works; no edit controls exposed |  | Not Run | Medium |  |
| REP-005 | Reports/Export | Unauthorized export blocked | Staff/Vendor logged in | Call reports API | Staff/Vendor cookie | 403 response |  | Not Run | High |  |
| EMAIL-001 | Email Logs | Successful email log | SMTP configured | Submit issue | SMTP account | Email log status Sent |  | Not Run | Medium | Needs SMTP |
| EMAIL-002 | Email Logs | Failed email log | SMTP missing/bad | Submit issue | Missing SMTP | Issue saved; email log status Failed |  | Not Run | High |  |
| EMAIL-003 | Email Logs | Missing SMTP does not break issue creation | SMTP blank | Submit issue | Staff issue | 201 created with emailStatus failed |  | Not Run | High |  |
| KB-001 | Knowledge Base | View article | User logged in | Open Knowledge Base | Existing article | Article title/solution visible |  | Not Run | Medium |  |
| KB-002 | Knowledge Base | Search article | User logged in | Search/filter by request/module if available | Keyword | Relevant solution appears |  | Not Run | Low | Current UI may be browse-only |
| KB-003 | Knowledge Base | Create article as IT/Admin | IT/Admin logged in | Create article | Title/module/problem/solution | Article saved and visible |  | Not Run | Medium |  |
| KB-004 | Knowledge Base | Staff cannot create article | Staff logged in | Open Knowledge Base | Staff user | Create form hidden/API blocked |  | Not Run | High |  |
| IMP-001 | Improvement Actions | Create action from repeated issue | IT/Admin logged in | Create action linked to issue | Repeated issue | Action saved with action ID |  | Not Run | Medium |  |
| IMP-002 | Improvement Actions | Update action status | Authorized user | Change action status | In Progress/Completed | Status saved |  | Not Run | Medium | Verify API support |
| IMP-003 | Improvement Actions | Manager view action board | Manager logged in | Open Improvement Actions | Manager user | Board visible read-only |  | Not Run | Medium |  |
| IMP-004 | Improvement Actions | Staff cannot modify action board | Staff logged in | Try create/update action | Staff user | Create/edit blocked |  | Not Run | High |  |
