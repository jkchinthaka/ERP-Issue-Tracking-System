<!-- markdownlint-disable MD060 -->

# Smoke Test Checklist

Use this checklist after every deployment, before a management demo, and after any environment/configuration change.

| ID | Check | Steps | Expected Result | Status | Owner | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| SMK-001 | App opens | Open the live URL | Login screen loads without endless spinner | Not Run | QA |  |
| SMK-002 | Health endpoint | Open `/api/health` | JSON response shows app, timestamp, database, environment | Not Run | QA/IT |  |
| SMK-003 | Login admin | Login as Admin | Dashboard loads with Admin role | Not Run | QA |  |
| SMK-004 | Login staff | Login as Department Staff | Staff dashboard loads | Not Run | QA |  |
| SMK-005 | Staff issue creation | Submit a simple issue | Issue ID appears and issue is listed | Not Run | QA |  |
| SMK-006 | IT workflow | Login IT and update new issue to In Progress | Status updates and audit entry exists | Not Run | QA |  |
| SMK-007 | Vendor flow | Mark issue vendor required and open vendor view | Vendor follow-up appears | Not Run | QA |  |
| SMK-008 | Manager dashboard | Login Manager | Dashboard cards and charts load read-only | Not Run | QA/Product |  |
| SMK-009 | Reports export | Export issue report as Manager/IT/Admin | File downloads without 500 | Not Run | QA |  |
| SMK-010 | Audit logs | Open audit logs as Admin | Recent actions appear | Not Run | QA |  |
| SMK-011 | Email logs | Open email logs as Admin | Logs load; SMTP errors do not break issue creation | Not Run | QA |  |
| SMK-012 | Logout | Logout from any role | User returns to login screen | Not Run | QA |  |
| SMK-013 | Mobile sanity | Open app at 390px viewport | Login/dashboard layout has no horizontal scroll | Not Run | QA |  |
| SMK-014 | Security sanity | Call admin API as staff | 403 response | Not Run | QA |  |
| SMK-015 | No visible secrets | Review login/API errors | No env values, DB URI, hashes, stack traces | Not Run | QA/IT |  |

## Pass/Fail Rule

The smoke test passes only if all high-priority checks pass. Any failure in login, health, issue creation, role permission, dashboard, or logout is a release/demo blocker.
