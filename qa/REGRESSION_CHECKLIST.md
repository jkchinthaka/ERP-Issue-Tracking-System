<!-- markdownlint-disable MD060 -->

# Regression Checklist

Run this before production release or when changing authentication, permissions, issue workflow, dashboard, database models, file upload, email, or deployment configuration.

| ID | Area | Regression Check | Status | Evidence Link | Notes |
| --- | --- | --- | --- | --- | --- |
| REG-001 | Build | `npm run build` succeeds | Not Run |  |  |
| REG-002 | Type safety | No TypeScript build errors | Not Run |  |  |
| REG-003 | Auth | Valid login works for all seeded roles | Not Run |  |  |
| REG-004 | Auth | Invalid login and missing login fail safely | Not Run |  |  |
| REG-005 | Auth | Logout clears session | Not Run |  |  |
| REG-006 | Auth | `/api/auth/me` unauthenticated returns `{ user: null }` | Not Run |  |  |
| REG-007 | Permissions | Staff sees only own issues | Not Run |  |  |
| REG-008 | Permissions | Department Head sees only department scope | Not Run |  |  |
| REG-009 | Permissions | Vendor sees only assigned vendor issues | Not Run |  |  |
| REG-010 | Permissions | Manager remains read-only for workflow changes | Not Run |  |  |
| REG-011 | Permissions | Admin setup blocked for non-admin roles | Not Run |  |  |
| REG-012 | Permissions | Audit/email logs blocked for non-admin roles | Not Run |  |  |
| REG-013 | Issue Create | Staff can submit required-field issue | Not Run |  |  |
| REG-014 | Issue Create | Optional fields save correctly | Not Run |  |  |
| REG-015 | Issue Create | Invalid/missing fields rejected | Not Run |  |  |
| REG-016 | File Upload | Valid attachment accepted | Not Run |  |  |
| REG-017 | File Upload | Invalid/oversized attachment rejected | Not Run |  |  |
| REG-018 | Workflow | IT can assign owner | Not Run |  |  |
| REG-019 | Workflow | IT can update priority | Not Run |  |  |
| REG-020 | Workflow | IT can change status across core states | Not Run |  |  |
| REG-021 | Workflow | Reporter can close/reopen allowed own issue states | Not Run |  |  |
| REG-022 | Comments | Public comments save and display | Not Run |  |  |
| REG-023 | Comments | Internal notes hidden from staff/vendor | Not Run |  |  |
| REG-024 | Vendor | Vendor follow-up can be created by IT/Admin | Not Run |  |  |
| REG-025 | Vendor | Vendor can add assigned response | Not Run |  |  |
| REG-026 | Dashboard | Cards show total, open, critical, pending vendor, SLA | Not Run |  |  |
| REG-027 | Dashboard | Charts render with positive dimensions | Not Run |  |  |
| REG-028 | Dashboard | Loading and error states are friendly | Not Run |  |  |
| REG-029 | Reports | Authorized report export works | Not Run |  |  |
| REG-030 | Reports | Unauthorized report export blocked | Not Run |  |  |
| REG-031 | Audit | Issue creation, status change, assignment, close/reopen are logged | Not Run |  |  |
| REG-032 | Email | Missing SMTP does not block issue creation | Not Run |  |  |
| REG-033 | Email | SMTP test endpoint restricted to admin/settings role | Not Run |  |  |
| REG-034 | Security | API responses do not expose secrets/password hashes | Not Run |  |  |
| REG-035 | UI | Desktop dashboard clean at 1366px | Not Run |  |  |
| REG-036 | UI | Mobile login and issue form clean at 390px | Not Run |  |  |
| REG-037 | API | Newman API collection runs against QA environment | Not Run |  |  |
| REG-038 | E2E | Playwright smoke test passes | Not Run |  |  |
| REG-039 | Deployment | Render service starts and binds to provided port | Not Run |  |  |
| REG-040 | Deployment | No secret values in Render logs | Not Run |  |  |

## Release Gate

Release is blocked if any of these fail: login, health, issue creation, role visibility, manager read-only behavior, vendor scoping, dashboard load, report export for authorized roles, audit logging, or secret exposure checks.
