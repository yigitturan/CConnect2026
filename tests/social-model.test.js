// Run with JavaScriptCore (jsc). These are local model/API tests, not Firebase Rules emulator tests.
globalThis.console = { warn() {}, log() {} };
globalThis.AbortSignal = { timeout: () => undefined };
globalThis.TextEncoder = class { encode(value) { return Uint8Array.from([...value].map(c => c.charCodeAt(0))); } };
function testDigest(data) {
 let hash = 2166136261;
 for (const byte of data) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
 return Uint8Array.from({ length: 32 }, (_, index) => ((hash >>> ((index % 4) * 8)) + index * 7) & 255).buffer;
}
globalThis.crypto = { subtle: { digest: async (_, data) => testDigest(data) } };
let store = { social: { profiles: {}, accounts: {} } };
const writes = [];
function get(path) { return path.reduce((value, key) => value?.[key], store) ?? null; }
function put(path, value) {
 let parent = store;
 for (const key of path.slice(0, -1)) parent = parent[key] ||= {};
 if (value === null) delete parent[path[path.length - 1]]; else parent[path[path.length - 1]] = value;
}
globalThis.fetch = async (url, options = {}) => {
 const path = url.match(/\/social(.*?)\.json/)[1].split('/').filter(Boolean);
 if (path[0] === 'config') throw new Error('Initialization must not depend on manual config.');
 const full = ['social', ...path]; const method = options.method || 'GET';
 let value;
 if (method === 'GET') value = get(full);
 else {
  writes.push({ path: full, method });
  value = options.body ? JSON.parse(options.body) : null;
  if (method === 'PATCH') for (const [key, data] of Object.entries(value)) put([...full, ...key.split('/')], data);
  else put(full, value);
 }
 return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(value)) };
};
function assert(value, message) { if (!value) throw new Error(message); }
async function fails(fn, message) { let rejected = false; try { await fn(); } catch (_) { rejected = true; } assert(rejected, message); }
Promise.all([import('../js/sidepanel/social/api.js'), import('../js/sidepanel/social/model.js'), import('../js/sidepanel/state.js')]).then(async ([api, model, state]) => {
 const alice = 'aliceUID001', bob = 'bobUID00002';
 function login(uid, nickname) { api.setSocialSession({ userId: uid, idToken: 'test', refreshToken: 'test', expiresIn: 3600 }); state.appState.currentUser = nickname; }
 login(alice, 'Same name'); const aliceCode = await model.registerSocialProfile();
 login(bob, 'Same name'); const bobCode = await model.registerSocialProfile();
 login(alice, 'Same name');
 assert(model.parseFriendCode(`cc-${bobCode.toLowerCase()}`) === bobCode, 'Shared code parsed');
 await fails(() => model.sendFriendRequest(aliceCode), 'Reject self requests');
 await fails(() => model.sendFriendRequest('../invalid'), 'Reject path injection');
 await fails(() => model.sendFriendRequest('ZZZZ9999'), 'Reject unknown users');
 await model.sendFriendRequest(`CC-${bobCode}`);
 assert(get(['social','accounts',bob,'requests',alice]).from === alice, 'Request delivered to recipient');
 await fails(() => model.sendFriendRequest(bobCode), 'Reject duplicate request');
 login(bob, 'Same name'); await model.acceptFriendRequest(alice);
 assert(get(['social','accounts',alice,'friends',bob]) === true && get(['social','accounts',bob,'friends',alice]) === true, 'Mutual friendship');
 assert(!get(['social','accounts',bob,'requests',alice]), 'Accepted request removed atomically');
 login(alice, 'Same name'); await model.sendRoomInvitation(bob, 'video', 'VID001');
 login(bob, 'Same name'); const invite = await model.validInvitation(alice);
 assert(invite.type === 'video' && invite.code === 'VID001', 'Correct room in invitation');
 await model.dismissInvitation(alice); assert(!get(['social','accounts',bob,'invitations',alice]), 'Invitation dismissed');
 login(alice, 'Same name'); await model.sendRoomInvitation(bob, 'chat', 'CHAT01');
 login(bob, 'Same name'); await model.blockUser(alice);
 assert(!get(['social','accounts',alice,'friends',bob]) && !get(['social','accounts',bob,'friends',alice]), 'Blocking removes both friends');
 await fails(() => model.validInvitation(alice), 'Blocking invalidates old invitations');
 login(alice, 'Same name'); await fails(() => model.sendFriendRequest(bobCode), 'Peer block prevents request');
 await fails(() => model.sendRoomInvitation(bob, 'chat', 'CHAT01'), 'Peer block prevents invitations');
 login(bob, 'Same name'); await model.unblockUser(alice);
 assert(!get(['social','accounts',bob,'friends',alice]), 'Unblocking does not restore friendship');
 await model.sendFriendRequest(aliceCode);
 login(alice, 'Same name'); await model.declineFriendRequest(bob);
 assert(!get(['social','accounts',alice,'requests',bob]), 'Request declined');
 await model.sendFriendRequest(bobCode); login(bob, 'Same name'); await model.acceptFriendRequest(alice);
 login(alice, 'Same name'); await model.sendRoomInvitation(bob, 'chat', 'CHAT01');
 put(['social','accounts',bob,'invitations',alice,'expiresAt'], Date.now() - 1);
 login(bob, 'Same name'); await fails(() => model.validInvitation(alice), 'Expired invite rejected');
 await model.removeFriend(alice);
 await fails(() => model.sendRoomInvitation(alice, 'video', 'VID001'), 'Nonfriend invitation rejected');
 login(alice, 'Renamed user');
 assert(await model.registerSocialProfile() === aliceCode, 'Code stays stable across sign-ins and nickname updates');
 assert(aliceCode.length === 8 && bobCode.length === 8 && aliceCode !== bobCode, 'Short independent codes');
 const aliceBytes = new TextEncoder().encode(`cconnect-friend-code:${alice}:0`);
 crypto.subtle.digest = async (_, data) => {
  const input = Array.from(data, byte => String.fromCharCode(byte)).join('');
  return testDigest(input === 'cconnect-friend-code:charlieUID:0' ? aliceBytes : data);
 };
 login('charlieUID', 'Charlie'); const charlieCode = await model.registerSocialProfile();
 assert(charlieCode !== aliceCode && get(['social','codes',aliceCode]) === alice, 'Collision retries without replacing existing owner');
 const version = api.sessionVersion(); api.clearSocialSession();
 await fails(() => model.readAccount(), 'Signed-out requests rejected');
 await fails(async () => api.assertSession(version), 'Old async session invalidated');
 print('PASS: initialization without config, profiles, short-code collisions, duplicate nicknames, request/accept/decline, mutual removal, block/unblock, video/chat invites, expiry, logout');
}).catch(error => { print(String(error)); print(error.stack || ''); quit(1); });
