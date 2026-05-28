# Security Policy

## Internal Use Warning

This system is intended for internal company use. Do not expose real credentials, company data, or production configuration in a public repository.

Keep production deployments private, protect environment variables, and avoid storing screenshots, exported reports, uploaded attachments, database dumps, or real customer/vendor details in Git.

## Secret Handling

- Do not commit `.env` files.
- Use `.env.example` for placeholders only.
- Store production secrets in Render environment variables or an approved company secret store.
- Rotate any database, SMTP, JWT, admin, or demo credential that may have been copied into chat, Git history, tickets, screenshots, logs, or public systems.
- Keep `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` outside controlled demo environments.

## Production Controls

- Use HTTPS for all hosted access.
- Use a long random `JWT_SECRET`.
- Use strong seeded passwords and change demo passwords after demos.
- Restrict MongoDB Atlas Network Access and database user permissions.
- Do not set `BACKUP_DATABASE_URL` on Render or any hosted web app.
- Use external file storage for production uploads; local container uploads are not persistent on Render.
- Review audit logs and email failure logs regularly.

## Access Control Expectations

- Staff can see only their own issues.
- Department heads can see their department issues.
- Managers can view dashboards, reports, and issue history but should not modify issue details.
- Vendors can see only issues assigned to their vendor account.
- Super Admin can manage setup, users, settings, audit logs, and email logs.

## Reporting Security Issues

Report security issues to the internal IT owner or system administrator. Include the affected route, role, expected access, actual access, and screenshots/log IDs when available. Do not include real passwords or full connection strings in reports.
