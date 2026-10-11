import { appState, emailVerificationState, sharedNoteSystem, chatSystem, webrtcSystem } from "./state.js";

// ================== DEBUG AND MONITORING ==================
  
  export function getSystemStatus() {
  return {
   timestamp: Date.now(),
   version: "7.0.0-with-real-email-verification",
   appState: {
     initialized: appState.initialized,
     currentUser: appState.currentUser,
     currentVideoRoom: appState.currentVideoRoom,
     currentChatRoom: appState.currentChatRoom
   },
   emailVerificationState: {
     pendingEmail: emailVerificationState.pendingEmail,
     isVerifying: emailVerificationState.isVerifying,
     hasActiveTimer: !!emailVerificationState.timer,
     emailSent: emailVerificationState.emailSent
   },
   sharedNoteSystem: {
     active: sharedNoteSystem.active,
     listenerActive: !!sharedNoteSystem.listener,
     lastContent: sharedNoteSystem.lastContent,
     isUpdating: sharedNoteSystem.isUpdating
   },
   chatSystem: {
     active: chatSystem.active,
     listenerActive: !!chatSystem.listener
   },
   webrtcSystem: {
     hasLocalStream: !!webrtcSystem.localStream,
     hasRemoteStream: !!webrtcSystem.remoteStream,
     connectionState: webrtcSystem.peerConnection?.connectionState || 'none',
     isCameraOn: webrtcSystem.isCameraOn,
     isMicOn: webrtcSystem.isMicOn
   }
  };
  }
