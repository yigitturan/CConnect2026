import { elements } from "./elements.js";

// ================== UTILITY FUNCTIONS ==================
  
  export function showMessage(message, isError = false) {
  if (elements.statusEl) {
    elements.statusEl.textContent = message;
    elements.statusEl.style.color = isError ? "#ef4444" : "#10b981";
    elements.statusEl.classList.remove("hidden");
    setTimeout(() => {
      elements.statusEl.textContent = "";
      elements.statusEl.classList.add("hidden");
    }, 5000);
  }
  console.log(isError ? "❌" : "✅", message);
  }
  
  export function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
  }
  
  export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
  }
  
  export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
  }
