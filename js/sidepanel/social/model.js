import { ensureFriendCode, resolveFriendCode } from './friend-codes.js';
export { parseFriendCode } from './friend-codes.js';
import { appState } from '../state.js';
import { readSocial, socialRequest, patchSocial, socialUid, sessionVersion, assertSession } from './api.js';

function validateUid(value) {
  const uid = String(value || '');
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) throw new Error('Enter a valid friend code.');
  return uid;
}
export async function registerSocialProfile() {
  return ensureFriendCode(appState.currentUser.slice(0, 80));
}
export async function readAccount() { return await readSocial(`accounts/${socialUid()}`) || {}; }
export async function profile(uid) { return await readSocial(`profiles/${validateUid(uid)}`); }
async function allowedPeer(peer, friendsRequired = false) {
  const version = sessionVersion();
  const me = socialUid(); peer = validateUid(peer);
  if (peer === me) throw new Error('You cannot add yourself.');
  const [own, peerBlock, peerFriend] = await Promise.all([
    readAccount(), readSocial(`accounts/${peer}/blocks/${me}`),
    friendsRequired ? readSocial(`accounts/${peer}/friends/${me}`) : Promise.resolve(null)
  ]);
  assertSession(version);
  if (own.blocks?.[peer] || peerBlock) throw new Error('This person is unavailable.');
  if (friendsRequired && (!own.friends?.[peer] || !peerFriend)) throw new Error('Only friends can send room invitations.');
  return { me, peer, own, version };
}
export async function sendFriendRequest(code) {
  const requestVersion = sessionVersion();
  const uid = await resolveFriendCode(code);
  assertSession(requestVersion);
  const { me, peer, own, version } = await allowedPeer(uid);
  if (own.friends?.[peer]) throw new Error('You are already friends.');
  if (own.requests?.[peer]) throw new Error('This person already sent you a request. Accept it below.');
  const [target, pending] = await Promise.all([profile(peer), readSocial(`accounts/${peer}/requests/${me}`)]);
  assertSession(version);
  if (!target) throw new Error('User not found. Ask them to sign in and share their friend code.');
  if (pending) throw new Error('A request has already been sent.');
  await socialRequest(`accounts/${peer}/requests/${me}`, 'PUT', { from: me, createdAt: Date.now() });
}
export async function acceptFriendRequest(peer) {
  const { me, own, version } = await allowedPeer(peer);
  if (own.requests?.[peer]?.from !== peer) throw new Error('This request is no longer available.');
  assertSession(version);
  await patchSocial({ [`accounts/${me}/friends/${peer}`]: true, [`accounts/${peer}/friends/${me}`]: true,
    [`accounts/${me}/requests/${peer}`]: null, [`accounts/${peer}/requests/${me}`]: null });
}
export async function declineFriendRequest(peer) {
  await socialRequest(`accounts/${socialUid()}/requests/${validateUid(peer)}`, 'DELETE');
}
export async function removeFriend(peer) {
  peer = validateUid(peer); const me = socialUid();
  await patchSocial({ [`accounts/${me}/friends/${peer}`]: null, [`accounts/${peer}/friends/${me}`]: null });
}
export async function blockUser(peer) {
  peer = validateUid(peer); const me = socialUid();
  if (peer === me) throw new Error('You cannot block yourself.');
  await patchSocial({ [`accounts/${me}/blocks/${peer}`]: true,
    [`accounts/${me}/friends/${peer}`]: null, [`accounts/${peer}/friends/${me}`]: null,
    [`accounts/${me}/requests/${peer}`]: null, [`accounts/${peer}/requests/${me}`]: null });
}
export async function unblockUser(peer) {
  await socialRequest(`accounts/${socialUid()}/blocks/${validateUid(peer)}`, 'DELETE');
}
export async function sendRoomInvitation(peer, type, code) {
  if (!['video', 'chat'].includes(type) || !/^[A-Za-z0-9]{6}$/.test(code || '')) throw new Error('Join a room first, then invite your friend.');
  const { me, version } = await allowedPeer(peer, true);
  assertSession(version);
  // One active invitation per sender: retries replace it instead of spamming the inbox.
  await socialRequest(`accounts/${peer}/invitations/${me}`, 'PUT', {
    from: me, type, code, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000
  });
}
export async function validInvitation(sender) {
  const { me, version } = await allowedPeer(sender, true);
  const invitation = await readSocial(`accounts/${me}/invitations/${sender}`);
  assertSession(version);
  if (!invitation || invitation.from !== sender || invitation.expiresAt <= Date.now()
    || !['video','chat'].includes(invitation.type) || !/^[A-Za-z0-9]{6}$/.test(invitation.code)) {
    throw new Error('This invitation has expired or is no longer available.');
  }
  return invitation;
}
export async function dismissInvitation(sender) {
  await socialRequest(`accounts/${socialUid()}/invitations/${validateUid(sender)}`, 'DELETE');
}
