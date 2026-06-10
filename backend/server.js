require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const { pool, initDb } = require('./db');
const storage = require('./storage');
const {
  createToken,
  requireAdminAuth,
  requireSuperAdmin,
  requireEmployeeAuth,
} = require('./middleware/auth');

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Add it to backend/.env before starting.');
  process.exit(1);
}

const app = express();

// API base URL used to build absolute file-download links.
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// CORS configuration - restrict to specific origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Rate limiting for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down' }
});

app.use(generalLimiter);

// Multer: keep uploads in memory, then hand the buffer to local storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 15
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

// Convert a submissions row (snake_case DB) into the camelCase shape the frontend expects,
// plus a flat `files` array of { key, field } for the document viewer.
function rowToSubmission(row) {
  const documents = row.documents || {};
  const files = [];
  for (const field in documents) {
    const keys = documents[field];
    if (Array.isArray(keys)) {
      keys.forEach((key) => files.push({ key, field }));
    }
  }
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    dob: row.dob,
    address: row.address,
    panNumber: row.pan_number,
    schoolName: row.school_name,
    collegeName: row.college_name,
    universityName: row.university_name,
    hasPostGraduation: row.has_post_graduation,
    status: row.status,
    submittedAt: row.submitted_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    files,
  };
}

// === Health check ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Admin Login (DB-backed `admins` table; seeded once from env) ===
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input format' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = rows[0];
    if (!admin || !admin.is_active || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = createToken(admin.username, admin.role, { id: admin.id });
    return res.json({ success: true, token, role: admin.role });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// === Admin: change own password ===
app.post('/api/admin/change-password', requireAdminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user.id]);
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [hash, admin.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Admin change-password error:', err);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

// === Employee Login (local `employees` table, replaces Cognito) ===
app.post('/api/employee/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT * FROM employees WHERE username = $1',
      [username]
    );
    const employee = rows[0];
    if (!employee || !(await bcrypt.compare(password, employee.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (employee.must_change_password) {
      // Mirror Cognito's NEW_PASSWORD_REQUIRED challenge with a one-shot change token.
      const changeToken = createToken(employee.username, 'employee');
      return res.json({ mustChangePassword: true, changeToken });
    }

    return res.json({
      token: createToken(employee.username, 'employee'),
      email: employee.email,
      username: employee.username,
    });
  } catch (err) {
    console.error('Employee login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// === Employee: complete first-login password change ===
app.post('/api/employee/change-password', requireEmployeeAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const { rows } = await pool.query(
      `UPDATE employees SET password_hash = $1, must_change_password = FALSE
       WHERE username = $2 RETURNING email, username`,
      [hash, req.user.username]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Employee not found' });

    return res.json({
      token: createToken(rows[0].username, 'employee'),
      email: rows[0].email,
      username: rows[0].username,
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// === Submit Onboarding Form ===
app.post('/submit', upload.any(), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dob, panNumber,
            schoolName, collegeName, universityName, hasPostGraduation } = req.body;
    // Frontend sends `permanentAddress`; accept `address` too for compatibility.
    const address = req.body.permanentAddress || req.body.address || null;

    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const submissionId = uuidv4();
    const documents = {};

    // Save each uploaded file locally; store relative keys in the documents map.
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fieldName = file.fieldname;
        const safeName = path.basename(file.originalname).replace(/[^\w.\-]/g, '_');
        const fileKey = `submissions/${submissionId}/${fieldName}/${Date.now()}-${safeName}`;
        await storage.saveFile(fileKey, file.buffer, file.mimetype);
        if (!documents[fieldName]) documents[fieldName] = [];
        documents[fieldName].push(fileKey);
      }
    }

    await pool.query(
      `INSERT INTO submissions
        (id, first_name, last_name, email, phone, dob, address, pan_number,
         school_name, college_name, university_name, has_post_graduation,
         documents, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'Pending')`,
      [
        submissionId, firstName, lastName, email, phone, dob || null, address,
        panNumber || null, schoolName || null, collegeName || null,
        universityName || null, hasPostGraduation === 'true',
        JSON.stringify(documents),
      ]
    );

    res.json({ success: true, submissionId });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to submit onboarding form' });
  }
});

// === Get Submissions (Protected) ===
app.get('/api/submissions', requireAdminAuth, async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const sql = includeDeleted
      ? 'SELECT * FROM submissions ORDER BY submitted_at DESC'
      : 'SELECT * FROM submissions WHERE is_deleted = FALSE ORDER BY submitted_at DESC';
    const { rows } = await pool.query(sql);
    const submissions = rows.map(rowToSubmission);

    // Attach a signed download URL to each file server-side (one batch call), so the admin
    // dashboard doesn't have to make a separate request per document.
    const allKeys = submissions.flatMap((s) => s.files.map((f) => f.key));
    if (allKeys.length > 0) {
      try {
        const urlMap = await storage.getSignedUrls(allKeys, API_BASE_URL);
        for (const s of submissions) {
          for (const f of s.files) f.url = urlMap[f.key] || null;
        }
      } catch (err) {
        console.error('Signed URL batch error:', err);
        // Non-fatal: return submissions without URLs rather than failing the whole list.
      }
    }

    res.json(submissions);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// === Soft-Delete Submission (Protected) ===
app.post('/api/submissions/delete', requireAdminAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing submission id' });
  try {
    await pool.query(
      'UPDATE submissions SET is_deleted = TRUE, deleted_at = now() WHERE id = $1',
      [id]
    );
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// === Restore Submission (Protected - Super Admin) ===
app.post('/api/submissions/restore', requireAdminAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing submission id' });
  try {
    await pool.query(
      'UPDATE submissions SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1',
      [id]
    );
    res.json({ success: true, message: 'Submission restored successfully' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: 'Failed to restore submission' });
  }
});

// === Signed file URL (Protected) — replaces /api/s3-url ===
// Kept the same path so the admin frontend works unchanged. Returns either a local
// /api/file link or a provider signed URL (e.g. Supabase), transparently.
app.get('/api/s3-url', requireAdminAuth, async (req, res) => {
  const { key } = req.query;
  if (!storage.isSafeKey(key)) {
    return res.status(400).json({ error: 'Missing or invalid file key' });
  }
  try {
    res.json({ url: await storage.getSignedUrl(key, API_BASE_URL) });
  } catch (err) {
    console.error('Signed URL error:', err);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// === Download a file via signed token (local storage provider only) ===
// When using a cloud provider, signed URLs point directly at the provider and this is unused.
app.get('/api/file', (req, res) => {
  if (!storage.servesLocalFiles) {
    return res.status(404).json({ error: 'Not found' });
  }
  const key = storage.verifySignedToken(req.query.token);
  if (!key) return res.status(403).json({ error: 'Invalid or expired link' });
  const filePath = storage.absolutePath(key);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath, path.basename(key));
});

// === Update Submission Status (Protected) ===
app.post('/api/update-status', requireAdminAuth, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// === Submit Leave Request (employee) ===
// Identity comes from the JWT, never from the request body — otherwise anyone
// could file leave requests on behalf of any employee.
app.post('/api/leave-request', requireEmployeeAuth, async (req, res) => {
  try {
    const { employeeName, leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validLeaveTypes = ['Sick', 'Casual', 'Vacation'];
    if (!validLeaveTypes.includes(leaveType)) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (to < from) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const { rows } = await pool.query(
      'SELECT email FROM employees WHERE username = $1',
      [req.user.username]
    );
    if (!rows[0]) {
      return res.status(401).json({ error: 'Employee account not found' });
    }

    const leaveId = uuidv4();
    await pool.query(
      `INSERT INTO leave_requests
        (id, employee_email, employee_name, leave_type, from_date, to_date, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending')`,
      [leaveId, rows[0].email, employeeName || null, leaveType, fromDate, toDate, reason || '']
    );
    res.json({ success: true, leaveId });
  } catch (err) {
    console.error('Leave request error:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// === List Leave Requests (Protected) — NEW: admin leave tab had no data source ===
app.get('/api/leave-requests', requireAdminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leave_requests ORDER BY submitted_at DESC');
    res.json(rows.map((r) => ({
      id: r.id,
      name: r.employee_name,
      email: r.employee_email,
      leaveType: r.leave_type,
      from: r.from_date,
      to: r.to_date,
      reason: r.reason,
      status: r.status,
      submittedAt: r.submitted_at,
    })));
  } catch (err) {
    console.error('Leave fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// === Approve/Reject Leave Request (Protected) — NEW ===
app.post('/api/leave-status', requireAdminAuth, async (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });
  const validStatuses = ['Pending', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  try {
    await pool.query('UPDATE leave_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Leave status error:', err);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// === Employee: view own leave requests ===
app.get('/api/employee/leave-requests', requireEmployeeAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT lr.* FROM leave_requests lr
       JOIN employees e ON e.email = lr.employee_email
       WHERE e.username = $1
       ORDER BY lr.submitted_at DESC`,
      [req.user.username]
    );
    res.json(rows.map((r) => ({
      id: r.id,
      leaveType: r.leave_type,
      from: r.from_date,
      to: r.to_date,
      reason: r.reason,
      status: r.status,
      submittedAt: r.submitted_at,
    })));
  } catch (err) {
    console.error('Employee leave fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Admin routes (create employee)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', requireAdminAuth, adminRoutes);

// Admin management routes (super admin only)
const adminsRoutes = require('./routes/admins');
app.use('/api/admins', requireSuperAdmin, adminsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
