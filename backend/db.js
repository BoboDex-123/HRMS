// PostgreSQL connection pool + schema bootstrap.
// Replaces the previous DynamoDB (OnboardingSubmissions / LeaveRequests) storage.
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/hrms';

// Managed Postgres (Supabase, Render, etc.) requires SSL; local Postgres does not.
// Enable SSL automatically for non-local hosts, or force it with DATABASE_SSL=true.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
const useSsl = process.env.DATABASE_SSL === 'true' || (!isLocal && process.env.DATABASE_SSL !== 'false');

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// Create tables on startup if they don't exist. No migration tool needed at this scale;
// every column maps 1:1 to a field the app already reads/writes.
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id              UUID PRIMARY KEY,
      username        TEXT UNIQUE NOT NULL,
      email           TEXT,
      password_hash   TEXT NOT NULL,
      role            TEXT NOT NULL DEFAULT 'admin',
      is_active       BOOLEAN NOT NULL DEFAULT TRUE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id              UUID PRIMARY KEY,
      username        TEXT UNIQUE NOT NULL,
      email           TEXT NOT NULL,
      password_hash   TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id                 UUID PRIMARY KEY,
      first_name         TEXT,
      last_name          TEXT,
      email              TEXT,
      phone              TEXT,
      dob                TEXT,
      address            TEXT,
      pan_number         TEXT,
      school_name        TEXT,
      college_name       TEXT,
      university_name    TEXT,
      has_post_graduation BOOLEAN DEFAULT FALSE,
      documents          JSONB NOT NULL DEFAULT '{}'::jsonb,
      status             TEXT NOT NULL DEFAULT 'Pending',
      submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_at         TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id              UUID PRIMARY KEY,
      employee_email  TEXT NOT NULL,
      employee_name   TEXT,
      leave_type      TEXT,
      from_date       TEXT,
      to_date         TEXT,
      reason          TEXT,
      status          TEXT NOT NULL DEFAULT 'Pending',
      submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log('✅ Database schema ready');
  await seedAdmins();
}

// Bootstrap admin accounts from env on first run only. Once the `admins` table has rows,
// the DB is the source of truth and env credentials are no longer consulted for login.
async function seedAdmins() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admins');
  if (rows[0].n > 0) return;

  const seeds = [
    {
      username: process.env.SUPER_ADMIN_USERNAME,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: 'superadmin',
    },
    {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
    },
  ];

  let seeded = 0;
  for (const s of seeds) {
    if (!s.username || !s.password) continue;
    const hash = await bcrypt.hash(s.password, 10);
    await pool.query(
      `INSERT INTO admins (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      [uuidv4(), s.username, hash, s.role]
    );
    seeded += 1;
  }
  if (seeded > 0) {
    console.log(`✅ Seeded ${seeded} admin account(s) from env (one-time bootstrap)`);
  }
}

module.exports = { pool, initDb };
