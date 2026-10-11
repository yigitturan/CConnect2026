import { appState } from "./state.js";
import { elements } from "./elements.js";
import { showMessage, generateCode } from "./utils.js";
import { startSharedNoteSystem, stopSharedNoteSystem } from "./shared-notes.js";
import { startChatSystem, stopChatSystem } from "./chat.js";
import { stopWebRTC } from "./webrtc.js";

// ================== ROOM MANAGEMENT ==================

export function initRoomManagement() {
// Create video code
if (elements.createVideoChatCodeBtn) {
 elements.createVideoChatCodeBtn.addEventListener("click", async () => {
   const code = generateCode();
   try {
     await appState.database.ref(`videoRooms/${code}`).set({
       createdBy: appState.currentUser,
       createdAt: Date.now()
     });
     
     if (elements.generatedVideoCode) elements.generatedVideoCode.textContent = code;
     if (elements.videoCodeDisplay) elements.videoCodeDisplay.classList.remove("hidden");
     showMessage("Video room code created: " + code);
   } catch (error) {
     showMessage("Code creation error!", true);
   }
 });
}

// Create chat code
if (elements.createChatCodeBtn) {
 elements.createChatCodeBtn.addEventListener("click", async () => {
   const code = generateCode();
   try {
     await appState.database.ref(`chatRooms/${code}`).set({
       createdBy: appState.currentUser,
       createdAt: Date.now()
     });
     
     if (elements.generatedChatCode) elements.generatedChatCode.textContent = code;
     if (elements.chatCodeDisplay) elements.chatCodeDisplay.classList.remove("hidden");
     showMessage("Chat room code created: " + code);
   } catch (error) {
     showMessage("Code creation error!", true);
   }
 });
}

// Copy codes
if (elements.copyVideoCodeBtn) {
 elements.copyVideoCodeBtn.addEventListener("click", () => {
   const code = elements.generatedVideoCode?.textContent;
   if (code && code !== "-") {
     copyToClipboard(code, "Video code copied!");
   }
 });
}

if (elements.copyChatCodeBtn) {
 elements.copyChatCodeBtn.addEventListener("click", () => {
   const code = elements.generatedChatCode?.textContent;
   if (code && code !== "-") {
     copyToClipboard(code, "Chat code copied!");
   }
 });
}

// Manual entry and friend invitations share exactly the same joining flow.
for (const [type, button, input] of [
  ['video', elements.joinVideoRoomBtn, elements.videoCodeInput],
  ['chat', elements.joinChatRoomBtn, elements.chatCodeInput]
]) {
  button?.addEventListener('click', async () => {
    try { await joinRoom(type, input?.value?.trim()); }
    catch (error) { showMessage(error.message, true); }
  });
}

// Close rooms
if (elements.closeVideoChat) {
 elements.closeVideoChat.addEventListener("click", () => {
   stopSharedNoteSystem();
   stopWebRTC();
   
   appState.currentVideoRoom = "";
   if (elements.videoContainer) elements.videoContainer.classList.add("hidden");
   if (elements.currentVideoCode) elements.currentVideoCode.textContent = "---";
   if (elements.videoCodeInput) elements.videoCodeInput.value = "";
   
   // Return to rooms tab
   const roomsTab = document.querySelector('.nav-tab[data-tab="rooms"]');
   if (roomsTab) roomsTab.click();
   
   announceRoomChange();
   showMessage("Video room closed.");
 });
}

if (elements.closeChatRoom) {
 elements.closeChatRoom.addEventListener("click", () => {
   stopChatSystem();
   
   appState.currentChatRoom = "";
   if (elements.chatContainer) elements.chatContainer.classList.add("hidden");
   if (elements.currentChatCode) elements.currentChatCode.textContent = "---";
   if (elements.chatCodeInput) elements.chatCodeInput.value = "";
   
   // Return to rooms tab
   const roomsTab = document.querySelector('.nav-tab[data-tab="rooms"]');
   if (roomsTab) roomsTab.click();
   
   announceRoomChange();
   showMessage("Chat room closed.");
 });
}

console.log("🏠 Room management initialized");
}

export function copyToClipboard(text, successMessage) {
if (navigator.clipboard) {
 navigator.clipboard.writeText(text).then(() => {
   showMessage(successMessage);
 }).catch(() => {
   fallbackCopyToClipboard(text, successMessage);
 });
} else {
 fallbackCopyToClipboard(text, successMessage);
}
}

export function fallbackCopyToClipboard(text, successMessage) {
const tempInput = document.createElement("input");
tempInput.value = text;
document.body.appendChild(tempInput);
tempInput.select();
document.execCommand("copy");
document.body.removeChild(tempInput);
showMessage(successMessage);
}

function announceRoomChange() {
  document.dispatchEvent(new CustomEvent('cconnect:room-change'));
}

export async function joinRoom(type, code) {
  if (!['video', 'chat'].includes(type) || !/^[A-Za-z0-9]{6}$/.test(code || '')) {
    throw new Error('Please enter a valid six-character room code.');
  }
  const user = appState.currentUser;
  const userId = appState.currentUserId;
  if (!user) throw new Error('Please sign in first.');
  const snapshot = await appState.database.ref(`${type === 'video' ? 'videoRooms' : 'chatRooms'}/${code}`).once('value');
  if (appState.currentUser !== user || appState.currentUserId !== userId) throw new Error('Your session has changed.');
  if (!snapshot.exists()) throw new Error('This room no longer exists.');
  if (type === 'video') {
    if (appState.currentVideoRoom !== code) {
      stopWebRTC();
      stopSharedNoteSystem();
      appState.currentVideoRoom = code;
      await startSharedNoteSystem(code);
    }
    if (elements.currentVideoCode) elements.currentVideoCode.textContent = code;
    if (elements.videoCodeInput) elements.videoCodeInput.value = code;
    elements.videoContainer?.classList.remove('hidden');
  } else {
    if (appState.currentChatRoom !== code) {
      stopChatSystem();
      appState.currentChatRoom = code;
      startChatSystem(code);
    }
    if (elements.currentChatCode) elements.currentChatCode.textContent = code;
    if (elements.chatCodeInput) elements.chatCodeInput.value = code;
    elements.chatContainer?.classList.remove('hidden');
  }
  document.querySelector(`.nav-tab[data-tab="${type}"]`)?.click();
  announceRoomChange();
  showMessage(type === 'video' ? 'Joined video room! Start your camera to begin the call.' : 'Joined chat room!');
}
