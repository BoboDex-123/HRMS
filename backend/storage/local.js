// Local filesystem storage provider (default; used for development).
// Files live under backend/uploads/<key> and are served via a short-lived signed link.
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function ensureRoot() {
  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
}

// Reject keys that try to escape the uploads root.
function isSafeKey(key) {
  if (typeof key !== 'string' || !key) return false;
  if (key.includes('..') || key.startsWith('/')) return false;
  return true;
}

// Persist a buffer to uploads/<key>, creating intermediate dirs.
async function saveFile(key, buffer /* , mimetype */) {
  if (!isSafeKey(key)) throw new Error('Invalid file key');
  ensureRoot();
  const dest = path.join(UPLOAD_ROOT, key);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  return key;
}

function absolutePath(key) {
  if (!isSafeKey(key)) throw new Error('Invalid file key');
  return path.join(UPLOAD_ROOT, key);
}

// Build a time-limited signed URL the browser can open directly (no auth header needed).
// The token encodes the key and expires in 1h; the /api/file route validates it.
async function getSignedUrl(key, apiBaseUrl) {
  if (!isSafeKey(key)) throw new Error('Invalid file key');
  const token = jwt.sign({ key }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const base = (apiBaseUrl || '').replace(/\/$/, '');
  return `${base}/api/file?token=${encodeURIComponent(token)}`;
}

// Batch-sign many keys at once. Returns { key: url }. (For local this is just in-process
// JWT signing, so there's no real round-trip — but we keep the async batch contract.)
async function getSignedUrls(keys, apiBaseUrl) {
  const out = {};
  for (const key of keys) {
    out[key] = await getSignedUrl(key, apiBaseUrl);
  }
  return out;
}

// Validate a download token and return its key, or null if invalid/expired.
function verifySignedToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return isSafeKey(payload.key) ? payload.key : null;
  } catch {
    return null;
  }
}

module.exports = {
  name: 'local',
  servesLocalFiles: true,
  UPLOAD_ROOT,
  isSafeKey,
  saveFile,
  getSignedUrl,
  getSignedUrls,
  absolutePath,
  verifySignedToken,
};
