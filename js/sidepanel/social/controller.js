import { appState } from '../state.js';
import { joinRoom, copyToClipboard } from '../rooms.js';
import { socialUid, clearSocialSession, sessionVersion, assertSession } from './api.js';
import * as model from './model.js';
import * as view from './view.js';
let timer = null;
let running = false;
let refreshing = null;
let actionPending = false;
let profiles = {};
let seen = new Set();
let lastSignature = '';
let myFriendCode = '';

export async function refreshFriends(force = false) {
  if (!running || (actionPending && !force)) return;
  if (refreshing) { await refreshing; if (force) return refreshFriends(true); return; }
  const version = sessionVersion();
  const job = (async () => {
    try {
      const account = await model.readAccount();
      const peers = [...new Set([...Object.keys(account.friends || {}), ...Object.keys(account.requests || {}),
        ...Object.keys(account.blocks || {}), ...Object.keys(account.invitations || {})])];
      await Promise.all(peers.filter(uid => !profiles[uid]).map(async uid => {
        const value = await model.profile(uid); assertSession(version);
        profiles[uid] = value || { nickname: `CC-${uid}` };
      }));
      assertSession(version);
      const rooms = { video: appState.currentVideoRoom, chat: appState.currentChatRoom };
      const activeInvitations = Object.entries(account.invitations || {}).filter(([, invite]) => invite.expiresAt > Date.now()).map(([uid]) => uid);
      const signature = JSON.stringify([account, rooms, activeInvitations]);
      if (signature !== lastSignature || force) {
        const notifications = view.renderFriends(account, profiles, rooms);
        const fresh = notifications.filter(key => !seen.has(key));
        notifications.forEach(key => seen.add(key));
        if (fresh.length) view.notifySocial(fresh.length);
        if (!notifications.length) document.getElementById('socialToast')?.classList.add('hidden');
        lastSignature = signature;
      }
      view.setSocialReady(true);
    } catch (error) {
      if (running && version === sessionVersion()) {
        view.feedback(error.message, true);
        view.setSocialReady(false, 'Could not update friends. Retrying…');
      }
    }
  })();
  refreshing = job;
  try { await job; } finally { if (refreshing === job) refreshing = null; }
}
export async function startFriends() {
  stopPolling();
  profiles = {}; seen = new Set(); lastSignature = '';
  myFriendCode = '';
  view.showIdentity(appState.currentUser, '');
  view.feedback(''); view.setSocialReady(false, 'Loading friends…');
  const version = sessionVersion();
  try {
    const code = await model.registerSocialProfile(); assertSession(version);
    myFriendCode = code;
    view.showIdentity(appState.currentUser, code);
    running = true;
    await refreshFriends();
    assertSession(version);
    timer = setInterval(() => { void refreshFriends(); }, 5000);
  } catch (error) {
    if (version === sessionVersion()) {
      view.setSocialReady(false, error.message || 'Friends are temporarily unavailable.');
      view.feedback(error.message || 'Could not load friends.', true);
    }
    // Do not break the existing login, rooms, or calls when social setup is unavailable.
    console.warn('Friends initialization failed:', {
      code: error.code || 'SOCIAL_INITIALIZATION_FAILED',
      status: error.status || null,
      message: error.message
    });
  }
}
function stopPolling() { running = false; if (timer) clearInterval(timer); timer = null; refreshing = null; }
export function stopFriends() {
  stopPolling(); clearSocialSession(); myFriendCode = ''; profiles = {}; seen = new Set(); lastSignature = ''; view.clearSocialView();
}
async function perform(button, action) {
  if (actionPending || !running) return;
  const version = sessionVersion(); actionPending = true; if (button) button.disabled = true;
  try {
    const result = await action(); assertSession(version); view.feedback(typeof result === 'string' ? result : 'Done.');
    await refreshFriends(true);
  } catch (error) {
    if (version === sessionVersion()) view.feedback(error.message, true);
  } finally {
    actionPending = false; if (button?.isConnected && version === sessionVersion()) button.disabled = false;
  }
}
export function initFriendsUI() {
  document.getElementById('friendsToggle')?.addEventListener('click', () => {
    const open = document.getElementById('friends-panel').classList.contains('hidden');
    view.showFriendsPanel(open); if (open) {
      if (running) void refreshFriends(true);
      else if (socialUid()) void startFriends();
    }
  });
  document.getElementById('closeFriendsPanel')?.addEventListener('click', () => view.showFriendsPanel(false));
  document.getElementById('viewSocialNotifications')?.addEventListener('click', () => view.showFriendsPanel(true));
  document.getElementById('copyFriendCode')?.addEventListener('click', () => {
    if (myFriendCode) copyToClipboard(`CC-${myFriendCode}`, 'Friend code copied!');
  });
  document.getElementById('addFriendForm')?.addEventListener('submit', event => {
    event.preventDefault();
    void perform(document.getElementById('addFriendBtn'), async () => {
      await model.sendFriendRequest(document.getElementById('friendCodeInput').value);
      document.getElementById('friendCodeInput').value = ''; return 'Friend request sent.';
    });
  });
  document.getElementById('socialLists')?.addEventListener('click', event => {
    const button = event.target.closest('[data-social-action]');
    if (!button || button.disabled) return;
    const peer = button.dataset.peer;
    const actions = {
      'accept-request': () => model.acceptFriendRequest(peer),
      'decline-request': () => model.declineFriendRequest(peer),
      remove: () => model.removeFriend(peer), block: () => model.blockUser(peer), unblock: () => model.unblockUser(peer),
      'decline-invite': () => model.dismissInvitation(peer),
      'invite-video': async () => { await model.sendRoomInvitation(peer, 'video', appState.currentVideoRoom); return 'Video room invitation sent.'; },
      'invite-chat': async () => { await model.sendRoomInvitation(peer, 'chat', appState.currentChatRoom); return 'Chat room invitation sent.'; },
      'accept-invite': async () => {
        const invitation = await model.validInvitation(peer);
        await joinRoom(invitation.type, invitation.code);
        await model.dismissInvitation(peer);
        view.showFriendsPanel(false);
      }
    };
    if (actions[button.dataset.socialAction]) void perform(button, actions[button.dataset.socialAction]);
  });
  document.addEventListener('cconnect:room-change', () => { if (!actionPending) void refreshFriends(true); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refreshFriends(true); });
}
