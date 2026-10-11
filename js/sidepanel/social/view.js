import { selectTab } from '../navigation.js';
const node = id => document.getElementById(id);
export function feedback(message, error = false) {
  const target = node('socialFeedback');
  if (target) { target.textContent = message; target.dataset.error = String(error); }
}
export function showFriendsPanel(open = true) {
  if (open) {
    selectTab('friends');
    node('socialToast')?.classList.add('hidden');
  } else if (document.querySelector('.nav-tab[data-tab="friends"]')?.classList.contains('active')) {
    selectTab('rooms');
  }
}
export function setSocialReady(ready, message = '') {
  node('socialLists')?.classList.toggle('hidden', !ready);
  node('socialLoading')?.classList.toggle('hidden', ready);
  if (node('socialLoading')) node('socialLoading').textContent = message;
  if (node('addFriendBtn')) node('addFriendBtn').disabled = !ready;
}
export function showIdentity(nickname, code) {
  if (node('socialNickname')) node('socialNickname').textContent = nickname;
  if (node('myFriendCode')) node('myFriendCode').textContent = code ? `CC-${code}` : 'Friend code unavailable';
  if (node('copyFriendCode')) node('copyFriendCode').disabled = !code;
}
function text(tag, className, value) {
  const item = document.createElement(tag); item.className = className; item.textContent = value; return item;
}
function row(title, detail, actions) {
  const item = text('div', 'social-item', '');
  item.append(text('strong', 'social-item-title', title), text('p', 'social-item-detail', detail));
  const controls = text('div', 'social-item-actions', '');
  for (const action of actions) {
    const button = text('button', `btn btn-sm ${action.danger ? 'btn-danger' : 'btn-ghost'}`, action.label);
    button.type = 'button'; button.disabled = Boolean(action.disabled);
    button.dataset.socialAction = action.action; button.dataset.peer = action.peer;
    controls.append(button);
  }
  item.append(controls); return item;
}
function list(id, items, empty) {
  node(id)?.replaceChildren(...(items.length ? items : [text('p', 'social-empty', empty)]));
}
export function renderFriends(account, profiles, rooms) {
  const name = uid => profiles[uid]?.nickname || 'Cconnect user';
  const blocked = account.blocks || {};
  const friendIds = Object.keys(account.friends || {}).filter(uid => !blocked[uid]);
  const requests = Object.entries(account.requests || {}).filter(([uid, request]) => !blocked[uid] && request.from === uid && !account.friends?.[uid]);
  const invites = Object.entries(account.invitations || {}).filter(([uid, invite]) => !blocked[uid] && account.friends?.[uid] && invite.from === uid && invite.expiresAt > Date.now());
  list('socialInbox', [
    ...requests.map(([uid]) => row(name(uid), 'Wants to add you as a friend.', [
      { label: 'Accept', action: 'accept-request', peer: uid }, { label: 'Decline', action: 'decline-request', peer: uid },
      { label: 'Block', action: 'block', peer: uid, danger: true }
    ])),
    ...invites.map(([uid, invite]) => row(name(uid), `Invited you to a ${invite.type === 'video' ? 'video' : 'chat'} room · ${invite.code}`, [
      { label: 'Join room', action: 'accept-invite', peer: uid }, { label: 'Decline', action: 'decline-invite', peer: uid }
    ]))
  ], 'No new requests or invitations.');
  list('socialFriends', friendIds.map(uid => row(name(uid), profiles[uid]?.friendCode ? `CC-${profiles[uid].friendCode}` : 'Friend', [
    { label: 'Video invite', action: 'invite-video', peer: uid, disabled: !rooms.video },
    { label: 'Chat invite', action: 'invite-chat', peer: uid, disabled: !rooms.chat },
    { label: 'Remove', action: 'remove', peer: uid }, { label: 'Block', action: 'block', peer: uid, danger: true }
  ])), 'No friends yet. Add someone using their friend code.');
  list('socialBlocked', Object.keys(blocked).map(uid => row(name(uid), profiles[uid]?.friendCode ? `CC-${profiles[uid].friendCode}` : 'Friend', [
    { label: 'Unblock', action: 'unblock', peer: uid }
  ])), 'No blocked people.');
  const count = requests.length + invites.length;
  if (node('socialBadge')) { node('socialBadge').textContent = String(count); node('socialBadge').classList.toggle('hidden', !count); }
  return [...requests.map(([uid, request]) => `request:${uid}:${request.createdAt}`), ...invites.map(([uid, invite]) => `invite:${uid}:${invite.createdAt}`)];
}
export function notifySocial(count) {
  if (!node('friends-section')?.classList.contains('hidden')) return;
  if (node('socialToastText')) node('socialToastText').textContent = `${count} new friend request${count === 1 ? '' : 's'} or room invitation${count === 1 ? '' : 's'}.`;
  node('socialToast')?.classList.remove('hidden');
}
export function clearSocialView() {
  for (const id of ['socialInbox', 'socialFriends', 'socialBlocked']) node(id)?.replaceChildren();
  node('socialBadge')?.classList.add('hidden'); node('socialToast')?.classList.add('hidden');
  if (node('friendCodeInput')) node('friendCodeInput').value = '';
  showIdentity('', ''); feedback(''); setSocialReady(false, 'Sign in to load your friends.'); showFriendsPanel(false);
}
