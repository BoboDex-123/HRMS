// Lightweight employee auth state, backed by localStorage.
// Replaces AWS Amplify / Cognito (getCurrentUser, signIn, signOut).
const TOKEN_KEY = 'employeeToken';
const EMAIL_KEY = 'employeeEmail';

export function setEmployeeSession({ token, email }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (email) localStorage.setItem(EMAIL_KEY, email);
}

export function getEmployeeToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getEmployeeEmail() {
  return localStorage.getItem(EMAIL_KEY) || '';
}

export function isEmployeeAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function clearEmployeeSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
