import { stopFriends } from './social/controller.js';
import { appState, emailVerificationState } from "./state.js";
import { elements } from "./elements.js";
import { stopSharedNoteSystem } from "./shared-notes.js";
import { stopChatSystem } from "./chat.js";
import { stopWebRTC } from "./webrtc.js";

// ================== CLEANUP FUNCTIONS ==================
  
  export function cleanup() {
  console.log("🧹 Cleaning up...");
  
  stopFriends();
  stopSharedNoteSystem();
  stopChatSystem();
  stopWebRTC();
  
  // Email verification cleanup
  if (emailVerificationState.timer) {
   clearInterval(emailVerificationState.timer);
   emailVerificationState.timer = null;
  }
  
  appState.currentVideoRoom = "";
  appState.currentChatRoom = "";
  
  resetUI();
  
  console.log("✅ Cleanup completed");
  }
  
  export function resetUI() {
  if (elements.currentVideoCode) elements.currentVideoCode.textContent = "---";
  if (elements.currentChatCode) elements.currentChatCode.textContent = "---";
  if (elements.videoCodeInput) elements.videoCodeInput.value = "";
  if (elements.chatCodeInput) elements.chatCodeInput.value = "";
  
  if (elements.videoContainer) elements.videoContainer.classList.add("hidden");
  if (elements.chatContainer) elements.chatContainer.classList.add("hidden");
  if (elements.videoCodeDisplay) elements.videoCodeDisplay.classList.add("hidden");
  if (elements.chatCodeDisplay) elements.chatCodeDisplay.classList.add("hidden");
  
  
  if (elements.videoStatus) elements.videoStatus.textContent = "Click to start call";
  
  if (elements.generatedVideoCode) elements.generatedVideoCode.textContent = "-";
  if (elements.generatedChatCode) elements.generatedChatCode.textContent = "-";
  }
