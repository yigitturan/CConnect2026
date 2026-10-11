import { firebaseConfig } from './firebase.js';
let session = null;
let refreshJob = null;
let generation = 0;
const STORAGE_KEY = 'cconnect.auth.session';
let writes = Promise.resolve();
function storage() { return globalThis.chrome?.storage?.local; }
function enqueueWrite(action) {
  const job = writes.then(action);
  writes = job.catch(() => {});
  return job;
}
async function persist(current) {
  if (!current?.remembered || !storage()) return;
  await enqueueWrite(async () => {
    if (session !== current) return;
    await storage().set({ [STORAGE_KEY]: { userId: current.uid, nickname: current.nickname,
      idToken: current.token, refreshToken: current.refresh, expiresAt: current.expiresAt } });
  });
}
export async function rememberSession(auth) {
  if (!storage()) throw new Error('Please reload the extension to enable saved sign-in.');
  const version = generation;
  await storage().setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
  if (version !== generation) return;
  setSocialSession(auth);
  session.nickname = auth.nickname || 'User';
  session.remembered = true;
  await persist(session);
}
export async function restoreSession() {
  if (!storage()) return null;
  const version = generation;
  await storage().setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
  const saved = (await storage().get(STORAGE_KEY))[STORAGE_KEY];
  if (version !== generation || !saved) return null;
  if (typeof saved.userId !== 'string' || !saved.userId ||
      typeof saved.idToken !== 'string' || !saved.idToken ||
      typeof saved.refreshToken !== 'string' || !saved.refreshToken ||
      !Number.isFinite(saved.expiresAt)) {
    await forgetSession(); return null;
  }
  setSocialSession(saved);
  session.expiresAt = saved.expiresAt;
  session.nickname = typeof saved.nickname === 'string' ? saved.nickname : 'User';
  session.remembered = true;
  return { userId: session.uid, nickname: session.nickname };
}
export async function forgetSession() {
  clearSocialSession();
  await enqueueWrite(() => storage()?.remove(STORAGE_KEY));
}

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
export async function token() {
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
      if (!response.ok) {
        const error = new Error('Your session expired. Please sign in again.');
        error.code = data.error?.message || 'TOKEN_REFRESH_FAILED';
        if (session === current && ['INVALID_REFRESH_TOKEN', 'TOKEN_EXPIRED', 'USER_DISABLED', 'USER_NOT_FOUND'].includes(error.code)) {
          await forgetSession();
        }
        throw error;
      }
      if (session !== current) throw new Error('Your session has changed.');
      current.token = data.id_token; current.refresh = data.refresh_token;
      current.expiresAt = Date.now() + Number(data.expires_in) * 1000;
      await persist(current);
      if (session !== current) throw new Error('Your session has changed.');
      return current.token;
    })();
    const job = refreshJob;
    job.finally(() => { if (refreshJob === job) refreshJob = null; }).catch(() => {});
  }
  return refreshJob;
}
