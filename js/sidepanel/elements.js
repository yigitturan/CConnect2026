import { clearSharedNote } from "./shared-notes.js";

// ================== DOM ELEMENTS ==================
  
export const elements = {};

export function initElements() {
  Object.assign(elements, {
  // Main containers
  loginScreen: document.getElementById("login-screen"),
  signupScreen: document.getElementById("signup-screen"),
  appContainer: document.getElementById("app-container"),
  roomsSection: document.getElementById("rooms-section"),
  videoContainer: document.getElementById("video-chat-container"),
  chatContainer: document.getElementById("chat-container"),
  
  // Auth
  emailInput: document.getElementById("email"),
  passwordInput: document.getElementById("password"),
  signupEmailInput: document.getElementById("signup-email"),
  signupPasswordInput: document.getElementById("signup-password"),
  signupPasswordConfirm: document.getElementById("signup-password-confirm"),
  nicknameInput: document.getElementById("nickname"),
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  googleLoginBtn: document.getElementById("googleLoginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  statusEl: document.getElementById("status"),
  showSignupLink: document.getElementById("showSignup"),
  showLoginLink: document.getElementById("showLogin"),
  
  // Email verification
  sendVerificationBtn: document.getElementById("sendVerificationBtn"),
  verificationSection: document.getElementById("verification-section"),
  verificationCodeInput: document.getElementById("verification-code"),
  verificationTimerText: document.getElementById("verification-timer-text"),
  
  // Shared note
  sharedNoteInput: document.getElementById("sharedNoteInput"),
  sharedNoteLastUpdated: document.getElementById("sharedNoteLastUpdated"),
  clearSharedNote: document.getElementById("clearSharedNote"),
  
  // Room management
  createVideoChatCodeBtn: document.getElementById("createVideoChatCodeBtn"),
  createChatCodeBtn: document.getElementById("createChatCodeBtn"),
  generatedVideoCode: document.getElementById("generatedVideoCode"),
  generatedChatCode: document.getElementById("generatedChatCode"),
  videoCodeDisplay: document.getElementById("videoCodeDisplay"),
  chatCodeDisplay: document.getElementById("chatCodeDisplay"),
  copyVideoCodeBtn: document.getElementById("copyVideoCodeBtn"),
  copyChatCodeBtn: document.getElementById("copyChatCodeBtn"),
  videoCodeInput: document.getElementById("videoCodeInput"),
  chatCodeInput: document.getElementById("chatCodeInput"),
  joinVideoRoomBtn: document.getElementById("joinVideoRoomBtn"),
  joinChatRoomBtn: document.getElementById("joinChatRoomBtn"),
  currentVideoCode: document.getElementById("currentVideoCode"),
  currentChatCode: document.getElementById("currentChatCode"),
  closeVideoChat: document.getElementById("closeVideoChat"),
  closeChatRoom: document.getElementById("closeChatRoom"),
  
  // Chat
  messagesContainer: document.getElementById("messages-container"),
  messageInput: document.getElementById("messageInput"),
  sendMessageBtn: document.getElementById("sendMessageBtn"),
  
  // Video chat
  localVideo: document.getElementById("localVideo"),
  remoteVideo: document.getElementById("remoteVideo"),
  startButton: document.getElementById("startButton"),
  hangupButton: document.getElementById("hangupButton"),
  cameraToggle: document.getElementById("cameraToggle"),
  micToggle: document.getElementById("micToggle"),
  videoStatus: document.getElementById("videoStatus")
  });
}
