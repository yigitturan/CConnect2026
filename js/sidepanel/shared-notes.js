import { appState, sharedNoteSystem } from "./state.js";
import { elements } from "./elements.js";
import { showMessage } from "./utils.js";

// ================== SHARED NOTE SYSTEM ==================

export async function startSharedNoteSystem(roomId) {
console.log("📝 Shared note system starting...");

try {
 sharedNoteSystem.active = true;
 sharedNoteSystem.roomRef = appState.database.ref(`sharedNotes/${roomId}`);
 
 // Listen for note changes
 sharedNoteSystem.listener = sharedNoteSystem.roomRef.on("value", (snapshot) => {
   const data = snapshot.val();
   updateSharedNoteUI(data);
 });
 
 setupSharedNoteInput();
 
 console.log("✅ Shared note system started");
 
} catch (error) {
 console.error("❌ Shared note system error:", error);
}
}

export function setupSharedNoteInput() {
if (elements.sharedNoteInput) {
 elements.sharedNoteInput.addEventListener("input", handleSharedNoteInput);
}

if (elements.clearSharedNote) {
 elements.clearSharedNote.addEventListener("click", clearSharedNote);
}
}

export function handleSharedNoteInput(event) {
const content = event.target.value;

// Debounce updates
if (sharedNoteSystem.updateTimer) {
 clearTimeout(sharedNoteSystem.updateTimer);
}

sharedNoteSystem.updateTimer = setTimeout(() => {
 updateSharedNote(content);
}, 1000);
}

export async function updateSharedNote(content) {
if (!sharedNoteSystem.active || sharedNoteSystem.isUpdating) return;

try {
 sharedNoteSystem.isUpdating = true;
 
 await sharedNoteSystem.roomRef.set({
   content: content,
   lastUpdatedBy: appState.currentUser,
   lastUpdated: Date.now()
 });
 
 sharedNoteSystem.lastContent = content;
 
} catch (error) {
 console.error("Shared note update error:", error);
} finally {
 setTimeout(() => {
   sharedNoteSystem.isUpdating = false;
 }, 500);
}
}

export function updateSharedNoteUI(data) {
if (!data) {
 if (elements.sharedNoteInput) elements.sharedNoteInput.value = "";
 if (elements.sharedNoteLastUpdated) elements.sharedNoteLastUpdated.textContent = "No content";
 return;
}

const { content, lastUpdatedBy, lastUpdated } = data;

if (elements.sharedNoteInput && content !== sharedNoteSystem.lastContent && !sharedNoteSystem.isUpdating) {
 elements.sharedNoteInput.value = content || "";
 
 // Flash animation for external updates
 if (lastUpdatedBy !== appState.currentUser) {
   elements.sharedNoteInput.classList.add('updated');
   setTimeout(() => {
     elements.sharedNoteInput.classList.remove('updated');
   }, 600);
 }
}

if (elements.sharedNoteLastUpdated) {
 if (lastUpdated) {
   const timeAgo = getTimeAgo(lastUpdated);
   elements.sharedNoteLastUpdated.textContent = `Updated ${timeAgo} by ${lastUpdatedBy}`;
 } else {
   elements.sharedNoteLastUpdated.textContent = "No updates";
 }
}

sharedNoteSystem.lastContent = content || "";
}

export async function clearSharedNote() {
try {
 await sharedNoteSystem.roomRef.remove();
 if (elements.sharedNoteInput) elements.sharedNoteInput.value = "";
 showMessage("Shared note cleared");
} catch (error) {
 console.error("Clear shared note error:", error);
 showMessage("Failed to clear note", true);
}
}

export function stopSharedNoteSystem() {
if (sharedNoteSystem.active) {
 sharedNoteSystem.active = false;
 
 if (sharedNoteSystem.updateTimer) {
   clearTimeout(sharedNoteSystem.updateTimer);
   sharedNoteSystem.updateTimer = null;
 }
 
 if (sharedNoteSystem.listener && sharedNoteSystem.roomRef) {
   sharedNoteSystem.roomRef.off('value', sharedNoteSystem.listener);
   sharedNoteSystem.listener = null;
 }
 
 sharedNoteSystem.lastContent = "";
 sharedNoteSystem.isUpdating = false;
 
 if (elements.sharedNoteInput) elements.sharedNoteInput.value = "";
 if (elements.sharedNoteLastUpdated) elements.sharedNoteLastUpdated.textContent = "No content";
 
 console.log("🛑 Shared note system stopped");
}
}

export function getTimeAgo(timestamp) {
const now = Date.now();
const diff = now - timestamp;

const minutes = Math.floor(diff / 60000);
const hours = Math.floor(diff / 3600000);
const days = Math.floor(diff / 86400000);

if (days > 0) return `${days}d ago`;
if (hours > 0) return `${hours}h ago`;
if (minutes > 0) return `${minutes}m ago`;
return 'just now';
}
