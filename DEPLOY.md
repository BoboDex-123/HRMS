# Deploying HRMS (Supabase + Render + Vercel)

Do these **in order** — each step produces values the next one needs.

```
Supabase (DB + file storage)  →  Render (backend API)  →  Vercel (frontend)  →  wire CORS
```

---

## 1. Supabase — database + document storage

1. Create a project at <https://supabase.com> (save the database password you choose).
2. **Connection string** → Project Settings → **Database** → *Connection string* → choose
   **Session pooler** (port **5432**, *not* 6543). It looks like:
   ```
   postgresql://postgres.<ref>:<password>@aws-<region>.pooler.supabase.com:5432/postgres
   ```
   This is your `DATABASE_URL`. Tables are created automatically on first backend boot.
3. **Storage bucket** → Storage → *New bucket* → name it `onboarding-documents`,
   and make it **Private** (uncheck "public"). Signed URLs handle access.
4. **API keys** → Project Settings → **API**:
   - *Project URL* → `SUPABASE_URL` (e.g. `https://<ref>.supabase.co`)
   - *service_role* secret → `SUPABASE_SERVICE_KEY` (server-side only — never put in the frontend)

---

## 2. Render — backend API

1. Push this repo to GitHub (the backend lives in `backend/`).
2. Render → **New** → **Web Service** → connect the repo.
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Health Check Path:** `/health`
   - (Or use **New → Blueprint**, which reads `backend/render.yaml`.)
3. Set **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | the Supabase Session-pooler string from step 1.2 |
   | `JWT_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` | your real super-admin login (seeded once on first boot) |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | your real admin login (seeded once on first boot) |
   | `STORAGE_PROVIDER` | `supabase` |
   | `SUPABASE_URL` | from step 1.4 |
   | `SUPABASE_SERVICE_KEY` | from step 1.4 |
   | `SUPABASE_BUCKET` | `onboarding-documents` |
   | `API_BASE_URL` | your Render URL once known, e.g. `https://hrms-backend.onrender.com` |
   | `ALLOWED_ORIGINS` | leave blank for now; set in step 4 |

4. Deploy. When live, open `https://<your-render-url>/health` → should return `{"status":"ok",...}`.
   - ⚠️ Free tier **sleeps after ~15 min idle** → first request after that waits ~30–50s.
     Upgrade to the $7 tier to remove the cold start.

---

## 3. Vercel — frontend

1. Vercel → **Add New Project** → import the repo. It auto-detects Create React App
   (`vercel.json` is included). Root directory = repo root.
2. **Environment Variable:**

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | your Render backend base URL — **without** `/api`, e.g. `https://hrms-backend.onrender.com` |

   > The app appends `/api/...` and `/submit` itself, so do **not** include `/api`.
   > CRA bakes env vars at **build time** — if you change this later, redeploy.
3. Deploy. Note the URL (e.g. `https://your-app.vercel.app`).

---

## 4. Wire CORS + finish

1. Back in **Render**, set:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app` (comma-separate extra domains)
   - `API_BASE_URL` = your Render URL (if not already)
   Save → Render redeploys.
2. Visit the Vercel URL → **Admin Login** with your `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD`.
3. Create employee logins, test an onboarding submission + document download, approve a leave request.

---

## Gotchas (already handled in code, but worth knowing)

- **SSL to Supabase** — `db.js` enables SSL automatically for non-local `DATABASE_URL`
  (override with `DATABASE_SSL=true|false`). Local Postgres stays SSL-off.
- **Admin bootstrap is one-time** — the env admin/super-admin are seeded only when the `admins`
  table is empty. Use strong passwords on first deploy; afterwards manage admins in the
  *Manage Admins* tab (env values are ignored for login from then on).
- **`REACT_APP_API_URL` must not include `/api`.**
- **Supabase bucket must be Private** — access is via short-lived signed URLs.
- **Uploads need `STORAGE_PROVIDER=supabase` in production** — the default `local` writes to
  Render's ephemeral disk, which is wiped on restart/redeploy.
