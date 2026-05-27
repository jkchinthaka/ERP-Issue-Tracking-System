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
- MongoDB running locally with database `bileeta_db`
- MongoDB user with access to `bileeta_db`

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env` and update the values. The local development `.env` in this workspace already contains the requested MongoDB URL and is ignored by Git.

Required local MongoDB URL:

```env
DATABASE_URL="mongodb://bileeta_user:Bil3eta%40123@localhost:27017/bileeta_db?authSource=bileeta_db"
```

Replica set option:

```env
DATABASE_URL="mongodb://bileeta_user:Bil3eta%40123@localhost:27017/bileeta_db?authSource=bileeta_db&replicaSet=rs0"
```

SMTP is optional for local testing. If SMTP values are empty, issues are still saved and email failures are logged in `emailLogs`.

## Seed MongoDB

```bash
npm run seed
```

The seed script creates roles, permissions, departments, ERP modules, SLA rules, Bileeta vendor data, users, sample issues, vendor follow-ups, knowledge base articles, improvement actions, audit logs, and email logs.

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
```

## Security Notes

- `DATABASE_URL`, SMTP credentials, JWT secret, and passwords are read from environment variables only.
- `.env` is ignored by Git; `.env.example` contains placeholders only.
- Passwords are hashed with bcrypt.
- API routes enforce session authentication and permission checks.
- Important records use soft delete.
- Audit logs track issue, comment, vendor, email, user, and admin setup activity.
- Uploaded files are validated by type and size before local storage under `public/uploads/issues`.
- For production, use HTTPS, a long random `JWT_SECRET`, real SMTP credentials, restricted MongoDB users, and an external file store such as S3, Cloudinary, Google Drive, or company storage.
