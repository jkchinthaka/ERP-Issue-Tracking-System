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
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@nelna.o6tqdh4.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
JWT_SECRET="your-secure-secret"
APP_URL="https://your-app-url"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-email-password"
```

Do not set `BACKUP_DATABASE_URL` on the hosted app. Render or Cloudflare `localhost` is not the company server.

SMTP is optional for local testing. If SMTP values are empty, issues are still saved and email failures are logged in `emailLogs`.

## Company Server Backup Worker Environment

On the company server where local MongoDB is reachable, copy `.env.example` to `.env` and set:

```env
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@nelna.o6tqdh4.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
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

## Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment

This is a full-stack Node.js Next.js app, not a static Cloudflare Pages site. For the Cloudflare Pages 404 explanation and the correct production hosting options, see [DEPLOYMENT.md](DEPLOYMENT.md).

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
