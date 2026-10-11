import { restoreTheme, initThemeControls } from './js/sidepanel/theme.js';
import { renderSidepanel } from './js/sidepanel/render.js';
import { initElements } from './js/sidepanel/elements.js';
import { restoreSavedLogin } from './js/sidepanel/auth.js';
import { startSidepanel } from './js/sidepanel/application.js';

async function bootstrap() {
  try {
    restoreTheme();
    await renderSidepanel();
    initElements();
    initThemeControls();
    startSidepanel();
    await restoreSavedLogin();
  } catch (error) {
    console.error('Cconnect sidepanel could not start:', error);
    const message = document.createElement('p');
    message.className = 'status-message';
    message.textContent = 'Cconnect could not start. Please reopen the side panel.';
    document.body.replaceChildren(message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
