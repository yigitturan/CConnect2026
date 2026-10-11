import { firebaseConfig } from '../firebase.js';
import { sessionVersion, assertSession, token } from '../session.js';
export { setSocialSession, clearSocialSession, socialUid, sessionVersion, assertSession } from '../session.js';
export async function socialRequest(path, method = 'GET', body) {
  const version = sessionVersion();
  const idToken = await token();
  assertSession(version);
  const response = await fetch(`${firebaseConfig.databaseURL}/social${path ? `/${path}` : ""}.json?auth=${encodeURIComponent(idToken)}`, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  assertSession(version);
  const data = await response.json();
  if (!response.ok) {
    const denied = response.status === 401 || response.status === 403;
    const error = new Error(denied
      ? 'Friends access was denied. Please sign in again; if this continues, access must be enabled.'
      : 'Could not connect. Please try again.');
    error.code = denied ? 'SOCIAL_ACCESS_DENIED' : 'SOCIAL_REQUEST_FAILED';
    // Keep tokens and request URLs out of diagnostic output.
    error.status = response.status;
    throw error;
  }
  return data;
}
export const readSocial = path => socialRequest(path);
export const patchSocial = updates => socialRequest('', 'PATCH', updates);
