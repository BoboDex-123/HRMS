// Storage facade — selects the active provider from STORAGE_PROVIDER (default: 'local').
// The rest of the app imports `require('./storage')` and never cares which backend is used:
//   - isSafeKey(key)
//   - async saveFile(key, buffer, mimetype) -> key
//   - async getSignedUrl(key, apiBaseUrl) -> url
// Local-only extras (used by the /api/file download route): servesLocalFiles, absolutePath, verifySignedToken.
const local = require('./local');

function selectProvider() {
  const name = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (name === 'supabase') {
    // Lazy-require so the @supabase/supabase-js dependency is only needed when actually used.
    return require('./supabase');
  }
  return local;
}

const provider = selectProvider();
console.log(`📦 Storage provider: ${provider.name}`);

module.exports = provider;
