# Deployment Notes

## Why the Cloudflare Pages URL Shows 404

The URL `https://59472e53.erp-issue-tracking-system.pages.dev/` is a Cloudflare Pages URL. This application is not a static site. It uses:

- Next.js API routes
- MongoDB through Mongoose
- JWT session cookies
- Nodemailer SMTP
- Local file uploads for the MVP

Cloudflare Pages static hosting cannot run this Node.js server code or connect to a local MongoDB URL such as `localhost:27017`. If Pages is pointed at `.next` or an empty/wrong output folder, the root URL returns `404`, which is the error shown in Chrome.

## Immediate Local URL

Use the local running app:

```bash
http://localhost:3000
```

If port 3000 is busy, this project may already be running. On Windows, check and stop it with:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
taskkill /PID <PID> /F
npm run dev -- -p 3000
```

## Recommended Production Hosting

Deploy this MVP to a Node.js-compatible host such as:

- Company VPS or internal server
- Render Node service
- Azure App Service
- AWS EC2 / Lightsail
- Docker on a company server

Set these environment variables in the production host. Atlas is the source of truth for the hosted app:

```env
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@nelna.o6tqdh4.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
JWT_SECRET="long-random-production-secret"
APP_URL="https://your-app-url"
DEFAULT_ADMIN_EMAIL="admin@nelna.local"
DEFAULT_ADMIN_PASSWORD="strong-admin-password"
DEMO_USER_PASSWORD="strong-demo-password"
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="erp-support@nelna.com"
SMTP_PASS="smtp-password-or-app-password"
```

Important: `localhost` inside a cloud server means that same cloud server. The hosted app must not use `BACKUP_DATABASE_URL` or depend on the company server MongoDB backup mirror.

## Render Deployment

This repository includes `render.yaml` for a Node web service.

If an existing Render service still shows `yarn` as the build command, update the service settings or redeploy from the blueprint so it uses the npm commands below.

Use:

```bash
npm ci --include=dev
npm run build
npm run start
```

Run the seed command once after environment variables and MongoDB are ready:

```bash
npm run seed
```

The seed command writes to Atlas through `MAIN_DATABASE_URL`.

### Render Outbound IP Allowlist

Render network requests from this service to public services can come from either of these shared outbound ranges:

```text
74.220.49.0/24
74.220.57.0/24
```

Allowlist both ranges on any external service that restricts inbound connections from the deployed app. For MongoDB Atlas, open **Network Access**, choose **Add IP Address**, add each CIDR range above, and save. Do not use these ranges to make the hosted app connect to the local backup database; the backup sync runs separately on the company server.

These ranges are shared with other Render services in the same region. If the database or security policy requires a unique static outbound IP, configure a Render Dedicated IP and allowlist that dedicated address instead.

## Company Server Backup Mirror

Run the backup worker only on the company server where local MongoDB is reachable as `localhost`. Set:

```env
MAIN_DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@nelna.o6tqdh4.mongodb.net/nelna?retryWrites=true&w=majority&appName=Nelna"
BACKUP_DATABASE_URL="mongodb://USERNAME:PASSWORD@localhost:27017/bileeta_db?authSource=bileeta_db"
BACKUP_SYNC_MODE="pull"
BACKUP_SYNC_INTERVAL_MINUTES="5"
```

Commands:

```bash
npm run db:backup:full
npm run db:backup:incremental
npm run db:backup:status
```

Use Windows Task Scheduler, PM2, or cron to run `npm run db:backup:incremental` every 5 minutes. The worker pulls Atlas data into local `bileeta_db`, preserves `_id`, uses upserts, and never writes local backup data back to Atlas.

## Docker Deployment

This repository includes a production `Dockerfile` using Next.js standalone output.

Build and run:

```bash
docker build -t nelna-erp-support .
docker run -p 3000:3000 --env-file .env nelna-erp-support
```

## If Cloudflare Must Be Used

Use Cloudflare only for DNS or as a reverse proxy in front of a Node-hosted app.

Cloudflare Pages can host a separate static frontend, but the backend APIs must still run somewhere Node-compatible. To run everything on Cloudflare Workers, the backend must be redesigned to use Workers-compatible services instead of direct Mongoose TCP MongoDB, SMTP, and local file writes.
