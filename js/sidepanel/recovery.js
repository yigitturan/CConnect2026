import { emailVerificationState } from "./state.js";
import { showMessage } from "./utils.js";
import { resetEmailVerificationState } from "./email-verification.js";

// ================== EMERGENCY RECOVERY SYSTEM ==================
  
  export function emergencyRecovery() {
  console.log("🚨 Emergency recovery starting...");
  
  try {
   // 1. Stop all timers aggressively
   
   if (emailVerificationState.timer) {
     clearInterval(emailVerificationState.timer);
     emailVerificationState.timer = null;
   }
   
   // Clear any remaining timers
   for (let i = 1; i < 99999; i++) {
     try {
       clearInterval(i);
       clearTimeout(i);
     } catch (e) {
       // Ignore errors
     }
   }
   
   resetEmailVerificationState();
   
   showMessage("Emergency recovery completed successfully!");
   console.log("✅ Emergency recovery completed");
   
  } catch (error) {
   console.error("❌ Emergency recovery failed:", error);
   showMessage("Emergency recovery failed: " + error.message, true);
  }
  }
