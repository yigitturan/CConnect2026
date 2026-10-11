import { firebaseConfig } from '../firebase.js';
let session = null;
let refreshJob = null;
let generation = 0;

export function setSocialSession(auth) {
  generation++;
  refreshJob = null;
  session = auth.userId && auth.idToken && auth.refreshToken ? {
    uid: auth.userId, token: auth.idToken, refresh: auth.refreshToken,
    expiresAt: Date.now() + Number(auth.expiresIn || 3600) * 1000
  } : null;
}
export function clearSocialSession() { generation++; session = null; refreshJob = null; }
export function socialUid() { return session?.uid || ''; }
export function sessionVersion() { return generation; }
export function assertSession(version) {
  if (!session || version !== generation) throw new Error('Your session has changed. Please try again.');
}
async function token() {
  if (!session) throw new Error('Please sign in again to use friends.');
  if (session.expiresAt > Date.now() + 60000) return session.token;
  if (!refreshJob) {
    const current = session;
    refreshJob = (async () => {
      const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: current.refresh }),
        signal: AbortSignal.timeout(15000)
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Your session expired. Please sign in again.');
      if (session !== current) throw new Error('Your session has changed.');
      current.token = data.id_token; current.refresh = data.refresh_token;
      current.expiresAt = Date.now() + Number(data.expires_in) * 1000;
      return current.token;
    })();
    const job = refreshJob;
    job.finally(() => { if (refreshJob === job) refreshJob = null; }).catch(() => {});
  }
  return refreshJob;
}
export async function socialRequest(path, method = 'GET', body) {
  const version = generation;
  const idToken = await token();
  assertSession(version);
  const response = await fetch(`${firebaseConfig.databaseURL}/social${path ? `/${path}` : ""}.json?auth=${encodeURIComponent(idToken)}`, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000)
  });
  assertSession(version);
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? 'This action is not available. Please refresh your friends list or sign in again.'
    : 'Could not connect. Please try again.');
  return data;
}
export const readSocial = path => socialRequest(path);
export const patchSocial = updates => socialRequest('', 'PATCH', updates);
