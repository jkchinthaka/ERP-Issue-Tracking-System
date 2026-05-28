# Nelna ERP Support & Improvement System

Internal ERP issue tracking, vendor follow-up, SLA monitoring, department impact reporting, and business process improvement platform for Nelna Farm.

## Features

- Role and permission-based access for Super Admin, IT Support, Manager, Department Head, Department Staff, and Vendor users.
- Staff-friendly ERP issue form with auto priority suggestion, SLA target, issue ID generation, attachment upload, and knowledge base suggestions.
- IT workflow for assignment, status updates, internal notes, public comments, vendor required toggle, root cause, preventive action, and resolution.
- Vendor follow-up module for Bileeta pending tasks, vendor ageing, response tracking, and escalation visibility.
- Management dashboard with department impact, ERP module issues, SLA breaches, repeated issues, root causes, training needs, monthly trend, and ERP Health Score.
- Audit logs, email logs, Excel export, local file upload, and seed data for realistic dashboard testing.

## Requirements

- Node.js 22 LTS with npm 10
- MongoDB Atlas database `nelna` for the hosted production app
- Optional company server MongoDB database `bileeta_db` for the backup mirror worker

## Internal System Warning

This system is intended for internal company use. Do not expose real credentials, company data, or production configuration in a public repository.

Recommended setup:

- Keep the repository private.
- Store production secrets only in Render, Atlas, company password management, or server environment variables.
- Rotate any credential that was ever copied into chat, Git history, screenshots, tickets, or public systems.
- Do not commit `.env`, exported database data, uploaded issue attachments, or production logs.
- Use HTTPS, strong passwords, restricted MongoDB users, and Atlas Network Access rules.

See [SECURITY.md](SECURITY.md) before using this with real company data.

## Install

```bash
npm install
```

## Database Architecture

MongoDB Atlas is the production source of truth. The hosted ERP app on Render or Cloudflare connects only to Atlas through `MAIN_DATABASE_URL` and uses database `nelna`.

The company server MongoDB database `bileeta_db` is only a backup mirror. The hosted app never connects to `BACKUP_DATABASE_URL`, never writes backup data during API requests, and keeps working if the local backup database is offline.

## Hosted App Environment

Set these variables on Render or the Node-compatible hosting environment:

```env
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
JWT_SECRET="your-secure-secret"
NODE_ENV="production"
APP_URL="https://your-app-url"
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS="false"
FILE_STORAGE_DRIVER="local"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-email-password"
SMTP_FROM="Nelna ERP Support <erp-support@example.com>"
```

Do not set `BACKUP_DATABASE_URL` on the hosted app. Render or Cloudflare `localhost` is not the company server.

SMTP is optional for local testing. If SMTP values are empty, issues are still saved and email failures are logged in `emailLogs`.

### Environment Variables

Required for the hosted app:

| Variable | Purpose |
| --- | --- |
| `MAIN_DATABASE_URL` | MongoDB Atlas connection string for source-of-truth database `nelna`. |
| `JWT_SECRET` | Long random secret used to sign login sessions. Required at runtime. |
| `NODE_ENV` | Use `production` on Render. |
| `APP_URL` | Public app URL used in email links. |

Recommended:

| Variable | Purpose |
| --- | --- |
| `DEFAULT_ADMIN_PASSWORD` | Seeded admin password source. |
| `DEMO_USER_PASSWORD` | Seeded non-admin demo user password source. |

Optional:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP notification delivery. Missing SMTP logs email failures but does not block issue creation. |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | Set `true` only for demos to show the login-page demo account list. Default `false`. |
| `FILE_STORAGE_DRIVER` | `local` for development; future external drivers include Cloudinary, S3-compatible storage, Google Drive, or company file server. |

Backup worker only:

| Variable | Purpose |
| --- | --- |
| `BACKUP_DATABASE_URL` | Local company server MongoDB mirror connection string. Do not set on Render. |
| `BACKUP_SYNC_MODE` | Must be `pull`; the worker never writes local backup data back to Atlas. |
| `BACKUP_SYNC_INTERVAL_MINUTES` | Worker loop interval for scheduled incremental sync. |

### Health Check

Use `/api/health` for quick deployment diagnosis. It returns status, app name, timestamp, database connection state, and environment without exposing secrets.

If Render shows `502` or login fails with `500`:

- Visit `/api/health`.
- Check Render logs for startup warnings.
- Confirm `MAIN_DATABASE_URL` and `JWT_SECRET` are set.
- Confirm Atlas Network Access allows Render outbound IPs or a dedicated Render IP.
- Confirm Atlas credentials are valid and the database user can read/write `nelna`.

### File Upload Storage

Uploads are abstracted behind `src/lib/storage.ts`.

- `FILE_STORAGE_DRIVER=local` stores files under `public/uploads/issues` and is suitable for development.
- Local uploads are not recommended for production on Render. Container redeploys can remove uploaded files.
- External storage placeholders are documented for Cloudinary, S3-compatible storage, Google Drive, and a company file server.
- If production starts with `FILE_STORAGE_DRIVER=local`, the app logs a warning.

### SMTP Notifications

Email notifications use `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

- Issue creation succeeds even when SMTP is missing or delivery fails.
- Failed email attempts are saved in `emailLogs` for IT/admin review.
- Admin users with settings permission can send a test email from the Admin page.
- Issue emails include issue ID, priority, department, ERP module, business impact, status, reporter, created date/time, and an app link.

## Company Server Backup Worker Environment

On the company server where local MongoDB is reachable, copy `.env.example` to `.env` and set:

```env
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
BACKUP_DATABASE_URL="mongodb://USERNAME:PASSWORD@localhost:27017/bileeta_db?authSource=bileeta_db"
BACKUP_SYNC_MODE="pull"
BACKUP_SYNC_INTERVAL_MINUTES="5"
```

The worker only pulls from Atlas into local `bileeta_db`. It never writes local backup data back to Atlas.

## Seed Atlas MongoDB

```bash
npm run seed
```

The seed script uses `MAIN_DATABASE_URL` and creates roles, permissions, departments, ERP modules, SLA rules, Bileeta vendor data, users, sample issues, vendor follow-ups, knowledge base articles, improvement actions, audit logs, and email logs in Atlas. Do not run it against production data unless you intentionally want the seed records.

## Backup Mirror Commands

Run these commands on the company server, not on Render or Cloudflare:

```bash
npm run db:backup:full
npm run db:backup:incremental
npm run db:backup:status
```

`db:backup:full` copies all configured collections from Atlas `nelna` to local `bileeta_db` using upserts and preserving `_id` values.

`db:backup:incremental` uses local `syncState.lastSyncAt` and pulls only documents with `updatedAt` newer than the last successful sync. Collections without `updatedAt` are copied fully each run.

`db:backup:status` checks Atlas and local backup connectivity, last sync time, last sync status, collections synced, and failed document counts.

For a continuous worker with PM2:

```bash
pm2 start "npm run db:backup:incremental -- --watch" --name nelna-erp-backup-sync
```

For Windows Task Scheduler, create a task that runs every 5 minutes with:

```text
Program/script: npm
Arguments: run db:backup:incremental
Start in: C:\path\to\ERP-Issue-Tracking-System
```

For Linux cron, run the incremental sync every 5 minutes from the project directory:

```cron
*/5 * * * * cd /opt/nelna-erp-support && npm run db:backup:incremental >> backup-sync.log 2>&1
```

Atlas remains the source of truth. The backup worker only pulls Atlas data into local `bileeta_db` and must never be configured to push local backup data back to Atlas.

## Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment

This is a full-stack Node.js Next.js app, not a static Cloudflare Pages site. For the Cloudflare Pages 404 explanation and the correct production hosting options, see [DEPLOYMENT.md](DEPLOYMENT.md).

Render deployment checklist:

- Use a private repository for real company usage.
- Build Command: `npm install && npm run build`.
- Start Command: `npm run start`.
- Set `MAIN_DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `APP_URL`.
- Do not set `BACKUP_DATABASE_URL` on Render.
- Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` for production.
- Visit `/api/health` after deploy.
- Rotate any credential that may have been exposed before deployment.

### Cloudflare Workers with OpenNext

Deploy this app to Cloudflare Workers with the OpenNext Cloudflare adapter. Do not use `.next` as a Cloudflare Pages output directory; `.next` is not a static deployable folder and can fail asset validation.

Cloudflare Worker configuration lives in `wrangler.jsonc`. The Worker name and `WORKER_SELF_REFERENCE` service binding must both stay:

```text
erp-issue-tracking-system
```

Use:

```bash
npm install
npm run build
npm run deploy
```

For a Cloudflare dashboard/Git deployment, use the Workers/OpenNext path and set the deploy command to `npm run deploy`. The OpenNext build emits the Worker bundle to `.open-next/worker.js` and assets to `.open-next/assets`.

## Default Test Users

Passwords come from `.env`, not source code.

| Role | Email | Password source |
| --- | --- | --- |
| Super Admin | `admin@nelna.local` | `DEFAULT_ADMIN_PASSWORD` |
| IT Support | `pathum@nelna.local` | `DEMO_USER_PASSWORD` |
| Manager | `manager@nelna.local` | `DEMO_USER_PASSWORD` |
| Department Head | `finance.head@nelna.local` | `DEMO_USER_PASSWORD` |
| Department Staff | `stores.staff@nelna.local` | `DEMO_USER_PASSWORD` |
| Vendor | `bileeta.support@bileeta.local` | `DEMO_USER_PASSWORD` |

For a management walk-through, see [DEMO_GUIDE.md](DEMO_GUIDE.md).

## Permission Matrix

| Capability | Super Admin | IT Support | Manager | Department Head | Staff | Vendor |
| --- | --- | --- | --- | --- | --- | --- |
| Submit ERP issue | Yes | Yes | No | Yes | Yes | No |
| View own issues | Yes | Yes | Read all | Yes | Yes | Vendor assigned only |
| View department issues | Yes | Yes | Read all | Own department | No | No |
| View all issues | Yes | Yes | Read-only | No | No | No |
| Assign issue | Yes | Yes | No | No | No | No |
| Update status/priority/root cause | Yes | Yes | No | No | No | No |
| Add comments | Yes | Yes | No | Yes | Yes | Vendor notes only |
| Manage vendor follow-up | Yes | Yes | View only | No | No | Assigned vendor notes |
| View dashboard/reports | Yes | Yes | Yes | Department scope | Own scope | Assigned vendor scope |
| Export reports | Yes | Yes | Yes | Yes | No | No |
| Manage setup/users/settings | Yes | No | No | No | No | No |
| View audit/email logs | Yes | No | No | No | No | No |

Manual permission checklist before production use:

- Staff can only see issues they submitted.
- Department heads can see own department issues but cannot change IT workflow fields.
- Managers can view dashboards/reports and issue detail history, but cannot modify issue details.
- Vendors can only see issues assigned to their vendor account.
- Super Admin can manage all setup data and audit/email logs.

## Production Security Checklist

- Keep this repository private for internal company use.
- Confirm `.env` is ignored and `.env.example` contains placeholders only.
- Rotate leaked database, SMTP, admin, and JWT credentials.
- Use HTTPS and secure session cookies in production.
- Use strong seeded passwords and change demo passwords after presentations.
- Keep `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` outside controlled demo environments.
- Use external upload storage on Render instead of local container storage.
- Review audit logs regularly; normal users have no API route to edit audit logs.

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run seed
npm run db:backup:full
npm run db:backup:incremental
npm run db:backup:status
```

## Security Notes

- `MAIN_DATABASE_URL`, `BACKUP_DATABASE_URL`, SMTP credentials, JWT secret, and passwords are read from environment variables only.
- `.env` is ignored by Git; `.env.example` contains placeholders only.
- Do not expose the local MongoDB backup port publicly unless it is explicitly required and protected by firewall/VPN rules.
- Atlas is the source of truth; local `bileeta_db` is only a backup mirror.
- Passwords are hashed with bcrypt.
- API routes enforce session authentication and permission checks.
- Important records use soft delete.
- Audit logs track issue, comment, vendor, email, user, and admin setup activity.
- Uploaded files are validated by type and size before local storage under `public/uploads/issues`.
- For production, use HTTPS, a long random `JWT_SECRET`, real SMTP credentials, restricted MongoDB users, and an external file store such as S3, Cloudinary, Google Drive, or company storage.
