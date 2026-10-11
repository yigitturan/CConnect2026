globalThis.AbortSignal = { timeout: () => undefined };
globalThis.URLSearchParams = class { constructor(data) { this.data = data; } };
let records = {}, failNetwork = false, revoked = false, refreshes = 0;
globalThis.chrome = { storage: { local: {
 setAccessLevel: async () => {},
 get: async key => ({ [key]: records[key] }),
 set: async data => { Object.assign(records, data); },
 remove: async key => { delete records[key]; }
} } };
globalThis.fetch = async () => {
 refreshes++;
 if (failNetwork) throw new Error('offline');
 return { ok: !revoked, json: async () => revoked ? { error: { message: 'TOKEN_EXPIRED' } } :
 { id_token: 'renewed', refresh_token: 'rotated', expires_in: 3600 } };
};
function assert(value, message) { if (!value) throw new Error(message); }
import('../js/sidepanel/session.js').then(async api => {
 const auth = { userId: 'user1', nickname: 'Yigit', idToken: 'initial', refreshToken: 'refresh', expiresIn: 3600 };
 await api.rememberSession(auth);
 api.clearSocialSession();
 let saved = await api.restoreSession();
 assert(saved.nickname === 'Yigit' && api.socialUid() === 'user1', 'Panel reopening restores identity');
 assert(await api.token() === 'initial' && refreshes === 0, 'Valid session requires no network sign-in');
 await api.rememberSession({ ...auth, expiresIn: -1 });
 api.clearSocialSession(); await api.restoreSession();
 assert(await api.token() === 'renewed', 'Expired token is silently refreshed');
 assert(records['cconnect.auth.session'].refreshToken === 'rotated', 'Rotated refresh token is saved');
 await api.rememberSession({ ...auth, expiresIn: -1 });
 failNetwork = true;
 await api.token().catch(() => {});
 assert(records['cconnect.auth.session'], 'Network failure retains saved login');
 failNetwork = false; revoked = true;
 await api.token().catch(() => {});
 assert(!records['cconnect.auth.session'] && !api.socialUid(), 'Revoked session is removed');
 revoked = false;
 await api.rememberSession(auth);
 await api.forgetSession(); api.clearSocialSession();
 assert(await api.restoreSession() === null, 'Explicit sign out stays signed out');
 const pending = api.rememberSession(auth); const logout = api.forgetSession();
 await Promise.all([pending, logout]);
 assert(!records['cconnect.auth.session'] && !api.socialUid(), 'Logout wins over an in-flight save');
 print('PASS: persistent login, reopen, silent refresh, offline recovery, revocation and explicit logout');
}).catch(error => { print(String(error)); print(error.stack || ''); quit(1); });
