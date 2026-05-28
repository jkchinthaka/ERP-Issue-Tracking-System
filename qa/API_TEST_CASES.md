<!-- markdownlint-disable MD060 -->

# API Test Cases

The API suite is automated in [postman/collection.json](postman/collection.json) and can be run with Newman.

## Execution

```bash
npm run test:api
```

For real QA execution, copy [postman/environment.example.json](postman/environment.example.json), fill the credential variables in a private environment file, and run:

```bash
npx newman run qa/postman/collection.json -e qa/postman/environment.example.json
```

## Authentication Model

The application uses an HTTP-only cookie named `nelna_erp_session`. The Newman collection captures the cookie from `Set-Cookie` after login and stores it in `authToken` for subsequent requests. `authToken` is a session-cookie value, not a bearer token.

## API Test Matrix

| API Test ID | Endpoint | Method | Scenario | Auth | Expected Status | Assertions | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| API-001 | `/api/health` | GET | Health check | None | 200 | JSON has `status`, `app`, `timestamp`, `database`, `environment`; no secrets | High |
| API-002 | `/api/auth/me` | GET | Unauthenticated session check | None | 200 | Returns `{ user: null }`; no noisy 401 | High |
| API-003 | `/api/auth/login` | POST | Valid admin login | None | 200 | Cookie set; no password hash in body | High |
| API-004 | `/api/auth/login` | POST | Valid IT login | None | 200 | Cookie set; role accessible after `/me` | High |
| API-005 | `/api/auth/login` | POST | Valid staff login | None | 200 | Cookie set; role accessible after `/me` | High |
| API-006 | `/api/auth/login` | POST | Valid manager login | None | 200 | Cookie set; role accessible after `/me` | High |
| API-007 | `/api/auth/login` | POST | Valid vendor login | None | 200 | Cookie set; role accessible after `/me` | High |
| API-008 | `/api/auth/login` | POST | Invalid password | None | 401 | Generic invalid message; no stack | High |
| API-009 | `/api/auth/login` | POST | Missing fields | None | 400 | Validation message; no 500 | Medium |
| API-010 | `/api/auth/login` | POST | Malformed email | None | 400 | Validation message; no login | Medium |
| API-011 | `/api/auth/login` | POST | NoSQL injection payload | None | 400/401 | Login rejected | Critical |
| API-012 | `/api/auth/me` | GET | Authenticated current user | Cookie | 200 | User object has role/permissions; no password hash | High |
| API-013 | `/api/auth/logout` | POST | Logout clears session | Cookie | 200 | Cookie cleared; `/me` returns null | High |
| API-014 | `/api/reference` | GET | Admin reference data | Admin cookie | 200 | Departments/modules/constants exist; user data sanitized | High |
| API-015 | `/api/reference` | GET | Staff reference data minimization | Staff cookie | 200 | Restricted user/role data not exposed | High |
| API-016 | `/api/dashboard` | GET | Dashboard data loads | Cookie | 200 | Cards/charts present; response under 3000 ms | High |
| API-017 | `/api/issues` | GET | Issue list loads | Cookie | 200 | Array/pagination fields present; scoped to role | High |
| API-018 | `/api/issues` | POST | Create issue valid | Staff cookie | 201 | Issue object and issueId returned | High |
| API-019 | `/api/issues` | POST | Create issue missing required fields | Staff cookie | 400 | Validation error; no issue created | High |
| API-020 | `/api/issues` | POST | Create issue with oversized/invalid upload | Staff cookie | 400/201 with attachment error | Upload rejected safely; issue behavior documented | Medium |
| API-021 | `/api/issues/:id` | GET | Get own issue | Staff cookie | 200 | Correct issue returned; no internal data leak | High |
| API-022 | `/api/issues/:id` | GET | Invalid/missing issue | Cookie | 403/404 | No stack trace | Medium |
| API-023 | `/api/issues/:id` | PATCH | IT updates status | IT cookie | 200 | Status saved and audit logged | High |
| API-024 | `/api/issues/:id` | PATCH | Staff update blocked | Staff cookie | 403 | Issue unchanged | High |
| API-025 | `/api/issues/:id` | PATCH | Manager update blocked | Manager cookie | 403 | Issue unchanged | Critical |
| API-026 | `/api/issues/:id/comments` | POST | Public comment | Allowed cookie | 201 | Comment saved | Medium |
| API-027 | `/api/issues/:id/comments` | POST | Empty comment rejected | Allowed cookie | 400 | Validation message | Medium |
| API-028 | `/api/issues/:id/comments` | POST | Internal note blocked for staff | Staff cookie | 403 | No note saved | High |
| API-029 | `/api/vendor-followups` | GET | IT/vendor follow-up list | Cookie | 200 | Scoped records returned | High |
| API-030 | `/api/vendor-followups` | POST | IT creates follow-up | IT cookie | 201 | Follow-up created | High |
| API-031 | `/api/vendor-followups` | PATCH | Vendor response | Vendor cookie | 200 | Response/status saved only for assigned vendor | High |
| API-032 | `/api/vendor-followups` | PATCH | Staff blocked | Staff cookie | 403 | No update | High |
| API-033 | `/api/audit-logs` | GET | Admin audit view | Admin cookie | 200 | Audit records and filters work | High |
| API-034 | `/api/audit-logs` | GET | Staff audit blocked | Staff cookie | 403 | No records returned | High |
| API-035 | `/api/email-logs` | GET | Admin email logs | Admin cookie | 200 | Logs visible; no SMTP password | Medium |
| API-036 | `/api/email-logs` | GET | Staff email logs blocked | Staff cookie | 403 | No records returned | High |
| API-037 | `/api/reports/issues` | GET | Authorized report export | Manager/IT/Admin cookie | 200 | Spreadsheet/content returned | Medium |
| API-038 | `/api/reports/issues` | GET | Unauthorized report blocked | Staff/Vendor cookie | 403 | No report returned | High |
| API-039 | `/api/admin/email-test` | POST | Admin SMTP test | Admin cookie | 200/500 handled | Email log created; no secret leak | Medium |
| API-040 | `/api/admin/email-test` | POST | Non-admin SMTP test blocked | Staff cookie | 403 | No email sent | High |

## Response-Time Targets

| Endpoint Type | Target |
| --- | --- |
| Health check | Under 1000 ms after warm start |
| Auth/login | Under 3000 ms |
| Dashboard | Under 5000 ms on cold data-heavy dataset, under 3000 ms warm |
| Issue create | Under 5000 ms without upload, under 8000 ms with upload |
| Lists/logs | Under 3000 ms for typical demo dataset |

## Sensitive Data Assertions

All API responses should be scanned for these forbidden keys or values:

- `passwordHash`
- `JWT_SECRET`
- `MONGODB_URI`
- `DATABASE_URL`
- `MAIN_DATABASE_URL`
- `BACKUP_DATABASE_URL`
- `SMTP_PASS`
- raw bcrypt hash strings

## Newman Notes

The committed environment file is intentionally safe and contains blank credentials. When credentials are blank, credential-dependent tests are marked as setup checks/skips inside the collection. For strict QA runs, fill all role credentials in a private Postman/Newman environment before execution.
