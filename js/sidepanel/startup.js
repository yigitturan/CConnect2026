import { initFriendsUI } from './social/controller.js';
import { appState } from "./state.js";
import { elements } from "./elements.js";
import { initFirebase } from "./firebase.js";
import { showMessage } from "./utils.js";
import { setupPasswordValidation } from "./validation.js";
import { initAuth } from "./auth.js";
import { initTabNavigation } from "./navigation.js";
import { initRoomManagement } from "./rooms.js";
import { initWebRTC } from "./webrtc.js";
import { cleanup, resetUI } from "./lifecycle.js";

// ================== STARTUP SYSTEM ==================
  
  export function initApp() {
  console.log("🚀 Fixed Cconnect App v7 with REAL Email Verification starting...");
  
  try {
   if (!initFirebase()) {
     throw new Error("Firebase could not be initialized");
   }
   
   setupPasswordValidation();
   initTabNavigation();
   initAuth();
   initRoomManagement();
   initFriendsUI();
   initWebRTC();
   
   setInitialUIState();
   setupGlobalEventListeners();
   
   appState.initialized = true;
   console.log("✅ Fixed app successfully started");
   showMessage("Fixed Cconnect App v7 with REAL Email Verification ready!");
   
  } catch (error) {
   console.error("❌ App startup error:", error);
   showMessage("Application startup error: " + error.message, true);
  }
  }
  
  export function setInitialUIState() {
  if (elements.loginScreen) elements.loginScreen.classList.remove("hidden");
  if (elements.signupScreen) elements.signupScreen.classList.add("hidden");
  if (elements.appContainer) elements.appContainer.classList.add("hidden");
  
  if (elements.videoContainer) elements.videoContainer.classList.add("hidden");
  if (elements.chatContainer) elements.chatContainer.classList.add("hidden");
  
  if (elements.roomsSection) elements.roomsSection.classList.remove("hidden");
  
  const firstTab = document.querySelector('.nav-tab[data-tab="rooms"]');
  if (firstTab) firstTab.classList.add('active');
  
  resetUI();
  
  console.log("🎨 Initial UI state set");
  }
  
  export function setupGlobalEventListeners() {
  window.addEventListener('error', (event) => {
   console.error("🚨 Global error:", event.error);
   showMessage("System error occurred!", true);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
   console.error("🚨 Promise rejection:", event.reason);
   showMessage("Connection error!", true);
  });
  
  window.addEventListener('beforeunload', () => {
   console.log("📄 Page closing, cleaning up...");
   cleanup();
  });
  
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) {
     console.log("👁️ Tab hidden");
   } else {
     console.log("👁️ Tab visible");
   }
  });
  
  console.log("🔧 Global event listeners set up");
  }
