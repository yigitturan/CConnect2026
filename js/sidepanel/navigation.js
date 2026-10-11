// Shared navigation for tab buttons, notifications and room invitations.
export function selectTab(targetTab) {
  const tab = document.querySelector(`.nav-tab[data-tab="${targetTab}"]`);
  const content = document.getElementById(`${targetTab}-section`) ||
    document.getElementById(`${targetTab}-chat-container`) ||
    document.getElementById(`${targetTab}-container`);
  if (!tab || !content) return false;
  document.querySelectorAll('.nav-tab').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(item => item.classList.add('hidden'));
  tab.classList.add('active');
  content.classList.remove('hidden');
  document.dispatchEvent(new CustomEvent('cconnect:tab-change', { detail: { tab: targetTab } }));
  return true;
}

export function initTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => selectTab(tab.getAttribute('data-tab')));
  });
}
