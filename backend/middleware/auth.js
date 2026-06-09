// JWT-based authentication — replaces the previous in-memory session Map
// (which lost all sessions on restart and couldn't scale past one instance)
// and AWS Cognito (employee auth now lives in the local `employees` table).
const jwt = require('jsonwebtoken');

const TOKEN_TTL = '24h';

// Issue a signed token. role is one of: 'admin' | 'superadmin' | 'employee'.
// `extra` can carry additional claims (e.g. { id } for admins).
const createToken = (username, role = 'admin', extra = {}) => {
  return jwt.sign({ username, role, ...extra }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// Pull and verify the Bearer token; returns the decoded payload or null.
const getBearer = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.split(' ')[1]);
};

// Require any admin (admin or superadmin).
const requireAdminAuth = (req, res, next) => {
  const payload = getBearer(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  if (payload.role !== 'admin' && payload.role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.user = payload;
  next();
};

// Require a super admin (used for admin-management endpoints).
const requireSuperAdmin = (req, res, next) => {
  const payload = getBearer(req);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  if (payload.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  req.user = payload;
  next();
};

// Require an authenticated employee (used for employee-only endpoints).
const requireEmployeeAuth = (req, res, next) => {
  const payload = getBearer(req);
  if (!payload || payload.role !== 'employee') {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = payload;
  next();
};

module.exports = {
  createToken,
  verifyToken,
  requireAdminAuth,
  requireSuperAdmin,
  requireEmployeeAuth,
};
