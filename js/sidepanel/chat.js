import { appState, chatSystem } from "./state.js";
import { elements } from "./elements.js";
import { showMessage } from "./utils.js";

// ================== CHAT SYSTEM ==================
  
  export function startChatSystem(roomId) {
  console.log("💬 Starting chat system...");
  
  try {
   chatSystem.active = true;
   chatSystem.messagesRef = appState.database.ref(`chatMessages/${roomId}`);
   
   chatSystem.listener = chatSystem.messagesRef.on("value", (snapshot) => {
     if (elements.messagesContainer) {
       elements.messagesContainer.innerHTML = "";
       
       if (snapshot.exists()) {
         const messages = snapshot.val();
         Object.entries(messages)
           .sort(([,a], [,b]) => a.timestamp - b.timestamp)
           .forEach(([key, message]) => displayMessage(message));
         
         scrollToBottom();
       }
     }
   });
   
   setupMessageSending();
   
   console.log("✅ Chat system started");
   
  } catch (error) {
   console.error("❌ Chat startup error:", error);
   showMessage("Chat system error!", true);
  }
  }
  
  export function setupMessageSending() {
  if (elements.sendMessageBtn) {
   elements.sendMessageBtn.onclick = sendMessage;
  }
  
  if (elements.messageInput) {
   elements.messageInput.onkeypress = (e) => {
     if (e.key === "Enter") {
       e.preventDefault();
       sendMessage();
     }
   };
  }
  }
  
  export async function sendMessage() {
  const message = elements.messageInput?.value?.trim();
  if (!message || !chatSystem.active) return;
  
  try {
   await chatSystem.messagesRef.push({
     sender: appState.currentUser,
     text: message,
     timestamp: Date.now()
   });
   
   if (elements.messageInput) elements.messageInput.value = "";
   
  } catch (error) {
   console.error("Message sending error:", error);
   showMessage("Message sending error!", true);
  }
  }
  
  export function displayMessage(message) {
  if (!elements.messagesContainer) return;
  
  const messageEl = document.createElement("div");
  
  // Mesaj içeriği
  const isOwn = message.sender === appState.currentUser;
  
  // HTML yapısı
  messageEl.innerHTML = `
   <div class="message-header">
     <span class="message-sender">${message.sender}</span>
     <span class="message-time">${formatMessageTime(message.timestamp)}</span>
   </div>
   <div class="message-text">${escapeHtml(message.text)}</div>
  `;
  
  // CSS sınıfları
  messageEl.className = isOwn ? "message own-message" : "message other-message";
  
  // Renk sistemi (diğer kişiler için)
  if (!isOwn) {
   const colors = ["#8b5cf6", "#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
   const colorIndex = message.sender.charCodeAt(0) % colors.length;
   const senderEl = messageEl.querySelector('.message-sender');
   if (senderEl) {
     senderEl.style.backgroundColor = colors[colorIndex];
   }
  }
  
  elements.messagesContainer.appendChild(messageEl);
  }
  
  // Yardımcı fonksiyonlar
  export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // Bugünse sadece saat:dakika
  if (diff < 24 * 60 * 60 * 1000) {
   return date.toLocaleTimeString('tr-TR', { 
     hour: '2-digit', 
     minute: '2-digit' 
   });
  }
  
  // Eski mesajlar için tarih de
  return date.toLocaleString('tr-TR', { 
   day: '2-digit',
   month: '2-digit',
   hour: '2-digit', 
   minute: '2-digit' 
  });
  }
  
  export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
  }
  
  export function scrollToBottom() {
  if (elements.messagesContainer) {
   elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  }
  }
  
  export function stopChatSystem() {
  if (chatSystem.active) {
   chatSystem.active = false;
   
   if (chatSystem.listener && chatSystem.messagesRef) {
     chatSystem.messagesRef.off("value", chatSystem.listener);
     chatSystem.listener = null;
   }
   
   if (elements.messagesContainer) {
     elements.messagesContainer.innerHTML = "";
   }
   
   console.log("🛑 Chat system stopped");
  }
  }
