<!-- markdownlint-disable MD060 -->

# Security Test Cases

| Security Test ID | Area | Risk | Steps | Payload | Expected Result | Severity | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-AUTH-001 | Authentication | Invalid login enumeration | Try valid email with wrong password and unknown email | Wrong password / unknown email | Same generic invalid login response; no account detail leak | High | Keep generic auth errors |
| SEC-AUTH-002 | Authentication | Brute-force login | Submit wrong password repeatedly | 8+ failed attempts | Rate limit message; no 500 | High | Monitor and tune rate limit threshold |
| SEC-AUTH-003 | Authentication | Session expiry bypass | Delete/expire session cookie and call protected API | Missing cookie | Protected APIs return 401/403; UI returns login | High | Keep short session TTL and clear logout |
| SEC-AUTH-004 | Authentication | Token tampering | Modify `nelna_erp_session` value | `nelna_erp_session=abc.def.ghi` | Session rejected; no stack trace | High | Reject invalid JWT and log safely |
| SEC-AUTH-005 | Authentication | Logout does not invalidate UI | Login, logout, use back/refresh | Old browser state | User cannot access protected data after logout | High | Clear cookie and sensitive local state |
| SEC-AUTH-006 | Authentication | Missing JWT secret | Start app without `JWT_SECRET` in safe env | Missing env | Clear startup/API error; no secret exposure | Critical | Enforce required production secret |
| SEC-AUTH-007 | Authentication | Expired JWT | Use expired token | Expired JWT | Session expired message and 401 | High | Keep JWT expiry and re-login flow |
| SEC-AUTHZ-001 | Authorization | Staff accesses admin APIs | Login staff, call `/api/admin/setup` | Staff cookie | 403; no setup data mutation | Critical | Keep permission checks server-side |
| SEC-AUTHZ-002 | Authorization | Vendor accesses all issues | Login vendor, call `/api/issues` | Vendor cookie | Only assigned vendor issues returned | Critical | Use vendor-scoped query filter |
| SEC-AUTHZ-003 | Authorization | Manager modifies issue status | Login manager, PATCH issue status | `{ "status": "Closed" }` | 403; manager remains read-only | High | Keep manager role without workflow permissions |
| SEC-AUTHZ-004 | Authorization | Department head accesses other department | Login dept head, open other dept issue ID/API | Other department issue ID | 403 or not visible | High | Verify `visibleIssueFilter` coverage |
| SEC-AUTHZ-005 | Authorization | Direct URL restricted page access | Manually navigate admin/audit UI | Staff/Vendor role | Restricted UI hidden; API blocked | High | Never rely only on hidden UI |
| SEC-AUTHZ-006 | Authorization | Direct API role bypass | Send privileged payload as low role | `vendorRequired`, `assignedTo`, `managementRemark` | 403; no DB change | Critical | Test every write API by role |
| SEC-IN-001 | Input Validation | XSS in issue title | Submit issue title with script | `<script>alert(1)</script>` | Script removed/escaped; not executed | High | Keep sanitizeText and React escaping |
| SEC-IN-002 | Input Validation | XSS in description | Submit description with image onerror | `<img src=x onerror=alert(1)>` | Displayed safely or stripped; no alert | High | Add CSP in future hardening |
| SEC-IN-003 | Input Validation | Script tag in comments | Add comment with script tag | `<script>fetch('/api/auth/me')</script>` | Sanitized and not executed | High | Keep comment sanitation |
| SEC-IN-004 | Input Validation | NoSQL injection in login | Login with object-style email/password via API | `{ "email": {"$ne":""}, "password": {"$ne":""} }` | 400/401; no login | Critical | Zod validation rejects non-string input |
| SEC-IN-005 | Input Validation | NoSQL injection in filters | Query issue filters with operators | `?status[$ne]=Closed` | Ignored or treated as invalid; no data leak | High | Validate search params where feasible |
| SEC-IN-006 | Input Validation | Oversized payload | Submit very large description/comment | > allowed length | Payload truncated/rejected; no 500 | Medium | Keep max lengths and request limits |
| SEC-IN-007 | Input Validation | Special characters | Submit quotes, unicode, symbols | `"'<>/&%` | Saved safely and rendered correctly | Medium | Continue output encoding |
| SEC-IN-008 | Input Validation | HTML injection | Submit rich HTML in knowledge base | `<h1>Fake login</h1>` | HTML not rendered as trusted markup | High | Avoid dangerouslySetInnerHTML |
| SEC-IN-009 | Input Validation | SQL-like payload | Submit SQL strings in fields | `' OR 1=1 --` | Treated as text; no crash | Medium | Keep structured Mongo queries |
| SEC-FILE-001 | File Upload | Executable upload | Upload `.exe` | `malware.exe` | Rejected by type/extension | High | Keep allowlist only |
| SEC-FILE-002 | File Upload | JavaScript upload | Upload `.js` | `payload.js` | Rejected | High | Keep MIME allowlist |
| SEC-FILE-003 | File Upload | Renamed malicious file | Rename executable to `.png` | Bad MIME/content | Rejected if MIME mismatch; no execution | High | Add server-side content scanning in future |
| SEC-FILE-004 | File Upload | Oversized file | Upload > 5 MB | Large file | Rejected with friendly message | Medium | Keep size cap |
| SEC-FILE-005 | File Upload | Valid file types | Upload png/pdf/docx/xlsx | Valid file | Accepted and logged | Low | Retain allowed type list |
| SEC-FILE-006 | File Upload | Path traversal filename | Upload filename with traversal | `../../secret.pdf` | Stored with sanitized safe filename | High | Continue generated server filename |
| SEC-FILE-007 | File Upload | MIME type mismatch | Spoof content type | `.pdf` with bad content | Rejected or not executable | Medium | Add magic-byte validation in future |
| SEC-DATA-001 | Data Exposure | Password hash leak | Call `/api/reference`, `/api/auth/me`, users endpoints | Authenticated admin/staff | No `passwordHash` in response | Critical | Keep select exclusions |
| SEC-DATA-002 | Data Exposure | JWT secret leak | Check API responses/logs/client bundle | Any role | No `JWT_SECRET` value exposed | Critical | Never log secret values |
| SEC-DATA-003 | Data Exposure | Database URL leak | Trigger DB error and inspect response | Bad env in staging | Generic error; no URI | Critical | Keep fail() generic for unknown errors |
| SEC-DATA-004 | Data Exposure | Audit logs admin only | Staff/vendor call `/api/audit-logs` | Low-role cookie | 403 | High | Keep audit log permission |
| SEC-DATA-005 | Data Exposure | Internal notes protected | Staff opens issue with internal note | Staff cookie | Internal note not returned | High | Filter comments server-side |
| SEC-DATA-006 | Data Exposure | Vendor unrelated company data | Vendor requests issues/reference | Vendor cookie | No unrelated issue detail exposed | Critical | Keep vendor filter and minimize reference data |
| SEC-ENV-001 | Environment | `.env` committed | Inspect Git tracked files | `git ls-files .env` | No `.env` tracked | Critical | Keep `.gitignore` and secret scanning |
| SEC-ENV-002 | Environment | Public repo exposure | Review repository setting | GitHub repo | Private recommended for production | High | Keep internal system warning |
| SEC-ENV-003 | Environment | HTTPS only | Open live app over HTTPS | Live URL | HTTPS and secure cookies in production | High | Keep Render HTTPS enabled |
| SEC-ENV-004 | Environment | Cookie flags | Inspect login response | Set-Cookie | `HttpOnly`, `SameSite=Lax`, `Secure` in production | High | Consider stricter settings if cross-site not needed |
| SEC-ENV-005 | Environment | CORS restriction | Cross-origin API request | External origin | No broad public CORS headers | Medium | Keep same-origin API usage |
| SEC-ENV-006 | Environment | No secrets in logs | Review Render/startup logs | Startup logs | Only present/missing flags, no values | Critical | Continue safe startup logging |
