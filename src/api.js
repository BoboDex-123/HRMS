// Centralized API client. Every backend call goes through apiFetch so that
// base URL, JSON handling, auth headers, and 401 session-expiry behavior
// live in one place instead of being re-implemented per component.
import config from './config';
import { getEmployeeToken, clearEmployeeSession } from './employeeAuth';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * @param {string} path - API path beginning with '/'
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object|FormData} [options.body] - plain objects are JSON-encoded; FormData passes through
 * @param {'employee'|'admin'|null} [options.auth] - which token to attach
 *   'employee': localStorage token; a 401 clears the session and redirects to login
 *   'admin': sessionStorage token; a 401 throws for the caller to handle (component owns logout state)
 */
export async function apiFetch(path, { method = 'GET', body, auth = null, headers = {} } = {}) {
  const h = { ...headers };
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) h['Content-Type'] = 'application/json';

  if (auth === 'employee') {
    const token = getEmployeeToken();
    if (token) h.Authorization = `Bearer ${token}`;
  } else if (auth === 'admin') {
    const token = sessionStorage.getItem('adminToken');
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${config.API_URL}${path}`, {
    method,
    headers: h,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON response body
  }

  if (res.status === 401 && auth === 'employee') {
    clearEmployeeSession();
    window.location.href = '/employee-login';
    throw new ApiError('Session expired', 401, data);
  }

  if (!res.ok) {
    throw new ApiError(
      (data && (data.error || data.message)) || `Request failed (${res.status})`,
      res.status,
      data
    );
  }

  return data;
}
