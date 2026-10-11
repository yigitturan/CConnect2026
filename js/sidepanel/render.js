// Load packaged extension HTML before binding controls.
export async function renderSidepanel() {
  const placeholders = [...document.querySelectorAll('template[data-component]')];
  const fragments = await Promise.all(placeholders.map(async placeholder => {
    const name = placeholder.dataset.component;
    const url = new URL(`../../partials/sidepanel/${name}.html`, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${name}: ${response.status}`);
    const fragment = document.createElement('template');
    fragment.innerHTML = await response.text();
    return fragment.content;
  }));
  placeholders.forEach((placeholder, index) => placeholder.replaceWith(fragments[index]));
}
