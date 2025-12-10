// Simple session-based admin authentication middleware
// For a production app, use JWT tokens instead

const sessions = new Map();

const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const createSession = (username, role = 'admin') => {
  const token = generateToken();
  sessions.set(token, {
    username,
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  return token;
};

const validateSession = (token) => {
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
};

const destroySession = (token) => {
  sessions.delete(token);
};

const getSession = (token) => {
  const session = sessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    return null;
  }
  return session;
};

// Middleware to check admin authentication
const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  if (!validateSession(token)) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  next();
};

module.exports = {
  createSession,
  validateSession,
  destroySession,
  getSession,
  requireAdminAuth
};
