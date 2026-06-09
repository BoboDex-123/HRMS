# Employee Onboarding System (HRMS)

A full-stack HR onboarding tool: an **admin portal** for reviewing onboarding submissions
and approving leave, and an **employee portal** for new hires to submit onboarding
documents and request leave.

> **Stack note:** This project was migrated off AWS (Cognito / S3 / DynamoDB / Amplify) to a
> single self-hosted stack — **PostgreSQL + local file storage + JWT auth** — so it runs
> entirely on your machine and deploys to one Postgres + one Node host without AWS account setup.
> See the migration notes at the bottom.

## Features

- **Admin Portal** (`/admin-login`)
  - Review onboarding submissions, view/download uploaded documents, approve/reject.
  - Approve/reject employee leave requests.
  - Create employee login accounts (issues a temporary password).
  - Change your own password.
  - **Super-admin**: soft-delete/restore submissions, and **manage admin accounts**
    (create admins/super-admins, deactivate/reactivate) via the *Manage Admins* tab.
- **Employee Portal** (`/employee-login`)
  - First-login forced password change.
  - Dashboard, leave application.
- **Public onboarding form** (`/employee/onboarding`) — multi-step form with document upload.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 (CRA), MUI, Formik/Yup, Framer Motion |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (`pg`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) — admins and employees both in DB tables |
| File storage | Pluggable: local filesystem (dev) or Supabase Storage (prod) via `STORAGE_PROVIDER` |

## Prerequisites

- Node.js ≥ 18
- PostgreSQL (local install or hosted, e.g. Supabase Session-mode pooler for prod)

## Getting Started

### 1. Database

```bash
createdb hrms                 # local Postgres
```

The backend auto-creates all tables (`employees`, `submissions`, `leave_requests`) on startup —
no migration step needed.

### 2. Backend

```bash
cd backend
cp .env.example .env          # then edit values (see below)
npm install
npm start                     # → http://localhost:5000
```

Minimum `.env` values:

```ini
DATABASE_URL=postgresql://localhost:5432/hrms
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
# Seed the first admins ONCE (table empty); afterwards manage admins in-app.
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD=change_me_too
STORAGE_PROVIDER=local            # 'supabase' for durable cloud uploads (see .env.example)
PORT=5000
API_BASE_URL=http://localhost:5000
ALLOWED_ORIGINS=http://localhost:3000
```

> **Admin accounts** are stored in the `admins` table. On first startup (empty table) they're
> seeded from the env vars above; after that the DB is the source of truth and admins are
> created/managed in the *Manage Admins* tab (super-admin only).

### 3. Frontend

```bash
# from repo root
cp .env.example .env          # REACT_APP_API_URL=http://localhost:5000
npm install
npm start                     # → http://localhost:3000
```

## Usage flow

1. Log in to the **admin portal** with the credentials from `backend/.env`.
2. Go to **Create Employee Login** → enter a username + email → note the temporary password shown.
3. Log out, open the **employee portal**, log in with that username + temp password → set a new password.
4. A new hire fills the public **onboarding form**; it appears under **Employee Approvals**.
5. Employees submit leave from the portal; it appears under **Leave Approvals**.

## API summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | none | Admin/super-admin login → JWT |
| POST | `/api/employee/login` | none | Employee login → JWT (or change-password challenge) |
| POST | `/api/employee/change-password` | employee | Set new password on first login |
| POST | `/submit` | none | Submit onboarding form + documents |
| GET | `/api/submissions` | admin | List submissions (`?includeDeleted=true` for super-admin) |
| POST | `/api/update-status` | admin | Approve/reject a submission |
| POST | `/api/submissions/delete` `/restore` | admin | Soft-delete / restore |
| GET | `/api/s3-url?key=` | admin | Get a signed download link for a document |
| GET | `/api/file?token=` | signed | Download a document |
| POST | `/api/leave-request` | none | Submit a leave request |
| GET | `/api/leave-requests` | admin | List leave requests |
| POST | `/api/leave-status` | admin | Approve/reject a leave request |
| POST | `/api/admin/create-employee` | admin | Create an employee login |
| GET | `/health` | none | Health check |

## Deployment

- **Frontend** → Vercel (`vercel.json` included; `npm run build`).
- **Backend** → Render / Railway / Fly (`backend/render.yaml` included). Set the same env vars there,
  point `DATABASE_URL` at a managed Postgres (e.g. Supabase Session-mode pooler, port 5432),
  and set `ALLOWED_ORIGINS` to your frontend URL.
- **File storage for production:** the default `local` provider writes to the backend's disk,
  which is **not durable** on ephemeral hosts (Render free tier wipes it on restart). For launch,
  set `STORAGE_PROVIDER=supabase` plus `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_BUCKET`
  (create a **private** bucket in your Supabase project). Implemented in `backend/storage/`.

## Migration notes (AWS → self-hosted)

- **DynamoDB → PostgreSQL** (`backend/db.js`): the data was relational and was being read via full
  `scan`; it's now proper SQL tables with indexed queries.
- **S3 → local storage** (`backend/storage.js`): documents are stored on disk and served via
  time-limited signed download links (same flow the admin UI expects).
- **Cognito → JWT** (`backend/middleware/auth.js`): both admins (`admins` table) and employees
  (`employees` table) live in Postgres with bcrypt-hashed passwords. The previous in-memory admin
  session map (lost on restart) and shared env-credential logins are gone — admins are managed in-app.
- Removed: `aws-sdk`, `@aws-sdk/*`, `aws-amplify`, `@aws-amplify/*`, and the `amplify/` provisioning
  flow from the runtime path.
