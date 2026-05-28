<!-- markdownlint-disable MD060 -->

# UAT Demo Checklist

Use this before presenting to management or business users.

## Demo Setup

| ID | Check | Expected Result | Status | Notes |
| --- | --- | --- | --- | --- |
| UAT-SET-001 | Latest commit deployed | Live app reflects latest release | Not Run |  |
| UAT-SET-002 | App warmed | Login page and dashboard load quickly | Not Run |  |
| UAT-SET-003 | Seed/demo users available | Admin, IT, Manager, Staff, Vendor can login | Not Run |  |
| UAT-SET-004 | Demo data prepared | Existing issues show realistic ERP modules, departments, priorities, vendor pending items | Not Run |  |
| UAT-SET-005 | No confidential real data | Demo data is safe to present | Not Run |  |
| UAT-SET-006 | SMTP behavior known | Sent/failed behavior understood before demo | Not Run |  |
| UAT-SET-007 | Backup/storage caveats known | External storage/backup notes ready if asked | Not Run |  |

## Demo Story Flow

| ID | Demo Flow | Steps | Expected Talking Point | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UAT-DEMO-001 | Staff reports issue | Login as staff, submit issue | Staff have simple structured issue intake | Not Run |  |
| UAT-DEMO-002 | Issue ID generated | Show success issue ID | Every request is traceable | Not Run |  |
| UAT-DEMO-003 | IT sees issue | Login as IT and open issue | IT support has a command center | Not Run |  |
| UAT-DEMO-004 | IT updates workflow | Assign, prioritize, set status | Ownership and progress are visible | Not Run |  |
| UAT-DEMO-005 | Vendor escalation | Mark vendor required/create follow-up | External vendor pending items are tracked | Not Run |  |
| UAT-DEMO-006 | Vendor response | Login as vendor and add response | Vendor communication is captured in one place | Not Run |  |
| UAT-DEMO-007 | Manager dashboard | Login manager and review cards/charts | Management sees ERP health and bottlenecks | Not Run |  |
| UAT-DEMO-008 | Reports export | Export issues report | Data can be shared for meetings | Not Run |  |
| UAT-DEMO-009 | Audit trail | Admin opens audit logs | Accountability is built in | Not Run |  |
| UAT-DEMO-010 | Email log | Admin opens email logs | Notification success/failure is traceable | Not Run |  |
| UAT-DEMO-011 | Security posture | Show manager read-only and staff scope | Access is role-controlled | Not Run |  |
| UAT-DEMO-012 | Health check | Open `/api/health` | Deployment/database readiness can be monitored | Not Run |  |

## Business Acceptance Questions

| ID | Question | Owner Response | Decision |
| --- | --- | --- | --- |
| UAT-Q-001 | Does the issue form capture enough information for IT support? |  |  |
| UAT-Q-002 | Are priority and SLA indicators meaningful for management? |  |  |
| UAT-Q-003 | Are dashboard cards/charts aligned with management reporting needs? |  |  |
| UAT-Q-004 | Are role restrictions acceptable for Staff, Department Head, Manager, and Vendor? |  |  |
| UAT-Q-005 | Are vendor follow-up statuses clear enough? |  |  |
| UAT-Q-006 | Are exports sufficient for meetings and monthly reviews? |  |  |
| UAT-Q-007 | What workflow approvals are needed before production? |  |  |

## Demo Exit Criteria

- Demo story completes without manual database changes.
- No unexpected 500/502 errors during the presentation.
- Manager dashboard loads in the first attempt after warming.
- Role-permission demo shows clear business safety.
- Open action list is documented for production readiness.
