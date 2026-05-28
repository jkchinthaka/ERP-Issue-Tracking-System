<!-- markdownlint-disable MD060 -->

# Role Permission Test Cases

## Role Permission Matrix

| Feature / Permission Area | Super Admin | IT Support | Manager | Department Head | Department Staff | Vendor |
| --- | --- | --- | --- | --- | --- | --- |
| Login | Yes | Yes | Yes | Yes | Yes | Yes |
| View dashboard | Yes | Yes | Yes | Yes | Yes | Yes |
| Create issue | Yes | Yes | No | Yes | Yes | No |
| View all issues | Yes | Yes | Yes | No | No | No |
| View department issues | Yes | Yes | Yes | Yes | No | No |
| View own issues | Yes | Yes | Yes | Yes | Yes | No |
| View vendor-assigned issues | Yes | Yes | Yes | No | No | Yes |
| Assign issue | Yes | Yes | No | No | No | No |
| Update issue status | Yes | Yes | No | No | No | No |
| Change priority | Yes | Yes | No | No | No | No |
| Add public comment | Yes | Yes | No | Yes | Yes | Yes |
| Add internal IT note | Yes | Yes | No | No | No | No |
| Manage vendor follow-ups | Yes | Yes | No | No | No | No |
| Add vendor response/note | No | No | No | No | No | Yes |
| Export reports | Yes | Yes | Yes | Yes | No | No |
| View audit logs | Yes | No | No | No | No | No |
| View email logs | Yes | No | No | No | No | No |
| Manage setup/reference data | Yes | No | No | No | No | No |
| Manage users/roles | Yes | No | No | No | No | No |
| Manage knowledge base | Yes | Yes | No | No | No | No |
| Manage improvement actions | Yes | Yes | No | No | No | No |

## Role-Based Test Cases

| Test Case ID | Role | Scenario | Preconditions | Steps | Expected Result | Actual Result | Status | Severity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RP-ADMIN-001 | Super Admin | Admin can see all navigation areas | Admin logged in | Review sidebar/mobile nav | Dashboard, Issues, Reports, Admin, Audit, Knowledge, Improvements visible as applicable |  | Not Run | High |
| RP-ADMIN-002 | Super Admin | Admin can create reference data | Admin logged in | Use Admin Setup to create department/module/vendor/user/role | Record saved and visible in reference lists |  | Not Run | High |
| RP-ADMIN-003 | Super Admin | Admin can view audit logs | Admin logged in | Open Audit & Email Logs | Audit logs load with filters |  | Not Run | High |
| RP-ADMIN-004 | Super Admin | Admin can view email logs | Admin logged in | Open Email Logs area | Email logs visible and do not expose SMTP password |  | Not Run | High |
| RP-ADMIN-005 | Super Admin | Admin can update any issue | Admin logged in | Open issue detail, update status/priority/assignment | Changes saved and audit log created |  | Not Run | High |
| RP-ADMIN-006 | Super Admin | Admin API returns no password hashes | Admin logged in | Inspect `/api/reference` response | No `passwordHash` field |  | Not Run | Critical |
| RP-IT-001 | IT Support | IT can view all issues | IT logged in | Open Issues list | Issues across departments are visible |  | Not Run | High |
| RP-IT-002 | IT Support | IT can assign issue | IT logged in | Open issue detail, assign to IT user | Assignment saved |  | Not Run | High |
| RP-IT-003 | IT Support | IT can update workflow status | IT logged in | Set status from New to In Progress | Status saved; audit log exists |  | Not Run | High |
| RP-IT-004 | IT Support | IT can add internal note | IT logged in | Add internal note | Note is stored and hidden from staff/vendor |  | Not Run | High |
| RP-IT-005 | IT Support | IT can manage vendor follow-up | IT logged in | Set vendor required and create follow-up | Vendor follow-up visible in vendor view |  | Not Run | High |
| RP-IT-006 | IT Support | IT cannot manage admin setup unless granted | IT logged in | Try setup API/admin page | Hidden/403 |  | Not Run | Medium |
| RP-MGR-001 | Manager | Manager can view management dashboard | Manager logged in | Open dashboard | Management cards/charts visible |  | Not Run | High |
| RP-MGR-002 | Manager | Manager can view all issues read-only | Manager logged in | Open issue list/detail | Issues visible; workflow editing hidden/blocked |  | Not Run | High |
| RP-MGR-003 | Manager | Manager cannot add comment | Manager logged in | Try comment UI/API | Hidden or 403 |  | Not Run | High |
| RP-MGR-004 | Manager | Manager cannot change status | Manager logged in | PATCH issue status via API | 403; issue unchanged |  | Not Run | Critical |
| RP-MGR-005 | Manager | Manager can export reports | Manager logged in | Open Reports, export | Export downloads scoped/all report |  | Not Run | Medium |
| RP-MGR-006 | Manager | Manager cannot access admin setup | Manager logged in | Try admin setup API | 403 |  | Not Run | High |
| RP-HEAD-001 | Department Head | Department head can create issue | Department head logged in | Submit issue | Issue created |  | Not Run | Medium |
| RP-HEAD-002 | Department Head | Department head sees department issues | Department head logged in | Open issue list | Own department issues visible |  | Not Run | High |
| RP-HEAD-003 | Department Head | Department head cannot see other department issues | Department head logged in | Try direct issue ID from other department | 403 or not found-equivalent |  | Not Run | Critical |
| RP-HEAD-004 | Department Head | Department head can add public comments | Department head logged in | Add comment to department issue | Comment saved |  | Not Run | Medium |
| RP-HEAD-005 | Department Head | Department head cannot change workflow | Department head logged in | Try status update | 403 |  | Not Run | High |
| RP-HEAD-006 | Department Head | Department head can export department report | Department head logged in | Export report | Only scoped data exported |  | Not Run | Medium |
| RP-STAFF-001 | Department Staff | Staff can create issue | Staff logged in | Submit valid issue | Issue created and issue ID shown |  | Not Run | High |
| RP-STAFF-002 | Department Staff | Staff sees own issues | Staff logged in | Open issue list | Own issues visible |  | Not Run | High |
| RP-STAFF-003 | Department Staff | Staff cannot see others' issues | Staff logged in | Try direct issue ID not owned by staff | 403 |  | Not Run | Critical |
| RP-STAFF-004 | Department Staff | Staff can add public comment on own issue | Staff logged in | Add comment | Comment saved |  | Not Run | Medium |
| RP-STAFF-005 | Department Staff | Staff cannot add internal note | Staff logged in | Try internal note API | 403 |  | Not Run | High |
| RP-STAFF-006 | Department Staff | Staff cannot assign/update status | Staff logged in | Try PATCH status/assignment | 403 |  | Not Run | High |
| RP-STAFF-007 | Department Staff | Staff can close/reopen allowed own issue state | Staff logged in | Close/reopen resolved own issue if UI supports | Status changes only for allowed reporter actions |  | Not Run | Medium |
| RP-VENDOR-001 | Vendor | Vendor can login | Vendor active | Login with vendor credentials | Vendor dashboard/view loads |  | Not Run | High |
| RP-VENDOR-002 | Vendor | Vendor sees only assigned follow-ups | Vendor logged in | Open vendor view | Assigned vendor items only |  | Not Run | Critical |
| RP-VENDOR-003 | Vendor | Vendor can add vendor note/response | Vendor logged in | Update vendor response | Response saved |  | Not Run | High |
| RP-VENDOR-004 | Vendor | Vendor cannot see internal notes | Vendor logged in | Open issue with internal note | Internal note hidden |  | Not Run | Critical |
| RP-VENDOR-005 | Vendor | Vendor cannot access reports/admin/audit | Vendor logged in | Try API/routes | 403 or hidden navigation |  | Not Run | High |
| RP-VENDOR-006 | Vendor | Vendor cannot update core issue workflow | Vendor logged in | Try PATCH status/priority | 403 |  | Not Run | Critical |

## Negative Permission Rules

- Every hidden UI control must also be blocked by the API.
- A user must never receive `passwordHash`, JWT secret, database URL, SMTP password, or unrelated department/vendor issue content.
- Manager is intentionally read-only for workflow changes.
- Vendor access must always be constrained by `vendorId`.
- Staff access must always be constrained by `reportedBy` unless explicitly granted more permissions.
