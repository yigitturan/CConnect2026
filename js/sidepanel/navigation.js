

// ================== TAB NAVIGATION ==================

export function initTabNavigation() {
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

navTabs.forEach(tab => {
 tab.addEventListener('click', () => {
   const targetTab = tab.getAttribute('data-tab');
   
   // Remove active class from all tabs
   navTabs.forEach(t => t.classList.remove('active'));
   
   // Add active class to clicked tab
   tab.classList.add('active');
   
   // Hide all tab contents
   tabContents.forEach(content => content.classList.add('hidden'));
   
   // Show target tab content
   const targetContent = document.getElementById(`${targetTab}-section`) || 
                        document.getElementById(`${targetTab}-chat-container`) ||
                        document.getElementById(`${targetTab}-container`);
   
   if (targetContent) {
     targetContent.classList.remove('hidden');
   }
   
   console.log(`📋 Switched to ${targetTab} tab`);
 });
});

console.log("🔄 Tab navigation initialized");
}
