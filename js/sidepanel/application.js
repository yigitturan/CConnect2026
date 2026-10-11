import { appState, emailVerificationState, sharedNoteSystem, chatSystem, webrtcSystem } from "./state.js";
import { elements } from "./elements.js";
import { showMessage } from "./utils.js";
import { sendRealEmail, sendVerificationCode, verifyEmailCode, resetEmailVerificationState } from "./email-verification.js";
import { cleanup } from "./lifecycle.js";
import { initApp } from "./startup.js";
import { emergencyRecovery } from "./recovery.js";
import { getSystemStatus } from "./debug.js";

export function startSidepanel() {
  // ================== GLOBAL API ==================
  
  window.videoSyncApp = {
  version: "7.0.0-with-real-email-verification",
  appState,
  emailVerificationState,
  sharedNoteSystem,
  chatSystem,
  webrtcSystem,
  elements,
  
  // Core functions
  cleanup,
  showMessage,
  emergencyRecovery,
  
  // Email verification functions
  sendVerificationCode,
  verifyEmailCode,
  resetEmailVerificationState,
  sendRealEmail,
  
  // Debug functions
  getSystemStatus,
  
  // Status function
  getStatus: getSystemStatus,
  
  // Convenience functions
  emergency: emergencyRecovery,
  
  // Timer control
  
  // Advanced debug
  
  // Emergency functions
  clearAllTimers: () => {
   for (let i = 1; i < 99999; i++) {
     try {
       clearInterval(i);
       clearTimeout(i);
     } catch (e) {}
   }
   console.log("🧹 All timers cleared");
  }
  };
  
  // ================== INITIALIZATION ==================
  
  // Start the app
  initApp();
  
  // ================== FINAL STATUS REPORTING ==================
  
  setTimeout(() => {
  const status = getSystemStatus();
  console.log("🎉 FIXED CCONNECT APP v7 WITH REAL EMAIL VERIFICATION FULLY LOADED!");
  console.log("📊 System Status:", status);
  console.log("📋 Available debug commands:");
  console.log("  - window.videoSyncApp.getStatus()");
  console.log("  - window.videoSyncApp.emergencyRecovery()");
  console.log("  - window.videoSyncApp.sendRealEmail()");
  console.log("🔧 Emergency functions:");
  console.log("  - window.videoSyncApp.cleanup()");
  console.log("  - window.videoSyncApp.clearAllTimers()");
  
  console.log("🎯 MAJOR FEATURES:");
  console.log("  ✅ REAL email verification system with Firebase Extensions");
  console.log("  ✅ Professional HTML email templates");
  console.log("  ✅ Password confirmation validation");
  console.log("  ✅ Enhanced error recovery");
  console.log("  ✅ Improved state management");
  console.log("  ✅ Emergency recovery system");
  console.log("  ✅ Shared Note system integrated");
  console.log("  ✅ WebRTC video calling");
  console.log("  ✅ Chat system");
  console.log("  ✅ Firebase Firestore integration");
  
  }, 2000);
  
// Final ready message
setTimeout(() => {
  console.log("🎯 CCONNECT APP WITH REAL EMAIL VERIFICATION TAMAMEN HAZIR!");
  console.log(`⏰ Yükleme zamanı: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🔢 App versiyon: v7.0.0-with-real-email-verification`);
  console.log("🔧 Yeni özellikler:");
  console.log("  ✅ Firebase Extensions ile GERÇEK email gönderme");
  console.log("  ✅ Professional HTML email templates");
  console.log("  ✅ Şifre tekrarı kontrolü eklendi");
  console.log("  ✅ Gelişmiş şifre validasyonu");
  console.log("  ✅ 6 haneli doğrulama kodu sistemi");
  console.log("  ✅ Firebase Firestore ile güvenli kayıt");
  console.log("  ✅ Gerçek email gönderme (demo değil!)");
  console.log("  ✅ Tüm eski özellikler korundu ve geliştirildi");
  console.log("📧 Email Setup Required:");
  console.log("  1. Firebase Console → Extensions → 'Trigger Email' yükleyin");
  console.log("  2. Gmail SMTP ayarlarını yapın");
  console.log("  3. Gmail App Password oluşturun");
  console.log("🏁 Initialization complete - Ready for video calls and chat with REAL email verification!");
  }, 3000);
  

}
