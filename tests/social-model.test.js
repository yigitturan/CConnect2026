// Run with JavaScriptCore (jsc). These are local model/API tests, not Firebase Rules emulator tests.
globalThis.console = { warn() {}, log() {} };
globalThis.AbortSignal = { timeout: () => undefined };
let store = { social: { config: { version: 1 }, profiles: {}, accounts: {} } };
const writes = [];
function get(path) { return path.reduce((value, key) => value?.[key], store) ?? null; }
function put(path, value) {
 let parent = store;
 for (const key of path.slice(0, -1)) parent = parent[key] ||= {};
 if (value === null) delete parent[path[path.length - 1]]; else parent[path[path.length - 1]] = value;
}
globalThis.fetch = async (url, options = {}) => {
 const path = url.match(/\/social(.*?)\.json/)[1].split('/').filter(Boolean);
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
 login(alice, 'Same name'); await model.registerSocialProfile();
 login(bob, 'Same name'); await model.registerSocialProfile();
 login(alice, 'Same name');
 assert(model.parseFriendCode(`CC-${bob}`) === bob, 'Shared code parsed');
 await fails(() => model.sendFriendRequest(alice), 'Reject self requests');
 await fails(() => model.sendFriendRequest('../invalid'), 'Reject path injection');
 await fails(() => model.sendFriendRequest('unknownUID'), 'Reject unknown users');
 await model.sendFriendRequest(`CC-${bob}`);
 assert(get(['social','accounts',bob,'requests',alice]).from === alice, 'Request delivered to recipient');
 await fails(() => model.sendFriendRequest(bob), 'Reject duplicate request');
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
 login(alice, 'Same name'); await fails(() => model.sendFriendRequest(bob), 'Peer block prevents request');
 await fails(() => model.sendRoomInvitation(bob, 'chat', 'CHAT01'), 'Peer block prevents invitations');
 login(bob, 'Same name'); await model.unblockUser(alice);
 assert(!get(['social','accounts',bob,'friends',alice]), 'Unblocking does not restore friendship');
 await model.sendFriendRequest(alice);
 login(alice, 'Same name'); await model.declineFriendRequest(bob);
 assert(!get(['social','accounts',alice,'requests',bob]), 'Request declined');
 await model.sendFriendRequest(bob); login(bob, 'Same name'); await model.acceptFriendRequest(alice);
 login(alice, 'Same name'); await model.sendRoomInvitation(bob, 'chat', 'CHAT01');
 put(['social','accounts',bob,'invitations',alice,'expiresAt'], Date.now() - 1);
 login(bob, 'Same name'); await fails(() => model.validInvitation(alice), 'Expired invite rejected');
 await model.removeFriend(alice);
 await fails(() => model.sendRoomInvitation(alice, 'video', 'VID001'), 'Nonfriend invitation rejected');
 const version = api.sessionVersion(); api.clearSocialSession();
 await fails(() => model.readAccount(), 'Signed-out requests rejected');
 await fails(async () => api.assertSession(version), 'Old async session invalidated');
 print('PASS: profiles, duplicate nicknames, request/accept/decline, mutual removal, block/unblock, video/chat invites, expiry, logout');
}).catch(error => { print(String(error)); print(error.stack || ''); quit(1); });
