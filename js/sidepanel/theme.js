const THEMES = ['original', 'light', 'dark'];
const LABELS = { original: 'Original', light: 'Light', dark: 'Dark' };
const STORAGE_KEY = 'cconnect.theme';
let currentTheme = 'original';

function updateButtons() {
  const nextTheme = THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length];
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    const label = `Theme: ${LABELS[currentTheme]}. Switch to ${LABELS[nextTheme]} theme`;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.dataset.theme = currentTheme;
  });
}

function applyTheme(theme) {
  currentTheme = THEMES.includes(theme) ? theme : 'original';
  document.documentElement.dataset.theme = currentTheme;
  updateButtons();
}

export function restoreTheme() {
  let savedTheme = 'original';
  try {
    savedTheme = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Theme preference could not be read:', error);
  }
  applyTheme(savedTheme);
}

export function cycleTheme() {
  applyTheme(THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length]);
  try {
    localStorage.setItem(STORAGE_KEY, currentTheme);
  } catch (error) {
    console.warn('Theme preference could not be saved:', error);
  }
}

export function initThemeControls() {
  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', cycleTheme);
  });
  updateButtons();
}
