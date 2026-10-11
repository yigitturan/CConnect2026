import { sendMessage } from "./chat.js";

// ================== BACKGROUND MESSAGE SENDER ==================
  
  export async function sendToBackground(action, data) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage({ action, ...data }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response || { success: false, error: "No response" });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
  }
