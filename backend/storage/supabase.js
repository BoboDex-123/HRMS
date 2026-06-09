// Supabase Storage provider (durable object storage for production).
// Activated by setting STORAGE_PROVIDER=supabase plus SUPABASE_URL, SUPABASE_SERVICE_KEY,
// and (optionally) SUPABASE_BUCKET. Documents are uploaded to a private bucket and served
// via Supabase's own time-limited signed URLs — so the local /api/file route is not used.
const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.SUPABASE_BUCKET || 'onboarding-documents';

let client;
function getClient() {
  if (!client) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set for supabase storage');
    }
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

// Same key-safety contract as the local provider.
function isSafeKey(key) {
  if (typeof key !== 'string' || !key) return false;
  if (key.includes('..') || key.startsWith('/')) return false;
  return true;
}

async function saveFile(key, buffer, mimetype) {
  if (!isSafeKey(key)) throw new Error('Invalid file key');
  const { error } = await getClient().storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: mimetype || 'application/octet-stream', upsert: false });
  if (error) throw error;
  return key;
}

// Returns a Supabase signed URL (valid 1h). `apiBaseUrl` is ignored — the URL points at Supabase.
async function getSignedUrl(key /* , apiBaseUrl */) {
  if (!isSafeKey(key)) throw new Error('Invalid file key');
  const { data, error } = await getClient().storage
    .from(BUCKET)
    .createSignedUrl(key, 3600, { download: true });
  if (error) throw error;
  return data.signedUrl;
}

// Batch-sign many keys in a single Supabase API call. Returns { key: url }.
async function getSignedUrls(keys /* , apiBaseUrl */) {
  if (!keys || keys.length === 0) return {};
  const { data, error } = await getClient().storage
    .from(BUCKET)
    .createSignedUrls(keys, 3600, { download: true });
  if (error) throw error;
  const out = {};
  for (const item of data) {
    if (item.signedUrl && !item.error) out[item.path] = item.signedUrl;
  }
  return out;
}

module.exports = {
  name: 'supabase',
  servesLocalFiles: false,
  isSafeKey,
  saveFile,
  getSignedUrl,
  getSignedUrls,
};

