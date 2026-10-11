globalThis.AbortSignal = { timeout: () => undefined };
globalThis.URLSearchParams = class { constructor(data) { this.data = data; } };
let refreshes = 0;
let databaseCalls = 0;
let deferred = null;
globalThis.fetch = async (url) => {
 if (url.includes('securetoken')) {
  refreshes++;
  if (deferred) await deferred.promise;
  return { ok: true, json: async () => ({ id_token: 'fresh-token', refresh_token: 'fresh-refresh', expires_in: 3600 }) };
 }
 databaseCalls++;
 return { ok: true, json: async () => ({ version: 1 }) };
};
function assert(value, message) { if (!value) throw new Error(message); }
import('../js/sidepanel/social/api.js').then(async api => {
 api.setSocialSession({ userId: 'testUID001', idToken: 'expired', refreshToken: 'refresh', expiresIn: -1 });
 await Promise.all([api.readSocial('config'), api.readSocial('config')]);
 assert(refreshes === 1 && databaseCalls === 2, 'Concurrent calls share token refresh');
 api.setSocialSession({ userId: 'testUID001', idToken: 'expired', refreshToken: 'refresh', expiresIn: -1 });
 let release;
 deferred = { promise: new Promise(resolve => { release = resolve; }) };
 const pending = api.readSocial('config').then(() => false, () => true);
 await Promise.resolve(); api.clearSocialSession(); release();
 assert(await pending, 'Refresh rejected after logout');
 assert(databaseCalls === 2 && !api.socialUid(), 'Logged-out refresh does not restore identity or send database request');
 print('PASS: shared refresh job and logout while token refresh is in flight');
}).catch(error => { print(String(error)); print(error.stack || ''); quit(1); });
