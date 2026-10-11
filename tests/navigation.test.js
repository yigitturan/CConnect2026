function node(classes = []) {
 const values = new Set(classes);
 return { dataset: {}, handlers: {}, classList: {
  add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value)
 }, addEventListener(event, handler) { this.handlers[event] = handler; }, getAttribute(name) { return name === 'data-tab' ? this.dataset.tab : null; } };
}
const tabs = ['rooms','video','chat','friends'].map(name => { const item = node(name === 'rooms' ? ['active'] : []); item.dataset.tab = name; return item; });
const ids = { 'rooms-section': node(), 'video-chat-container': node(['hidden']), 'chat-container': node(['hidden']), 'friends-section': node(['hidden']), socialToast: node(['hidden']), socialToastText: {} };
const contents = [ids['rooms-section'],ids['video-chat-container'],ids['chat-container'],ids['friends-section']];
const events = [];
globalThis.CustomEvent = function(type, options) { this.type = type; this.detail = options.detail; };
globalThis.document = {
 getElementById: id => ids[id] || null,
 querySelectorAll: selector => selector === '.nav-tab' ? tabs : contents,
 querySelector: selector => tabs.find(tab => selector.includes(`"${tab.dataset.tab}"`)) || null,
 dispatchEvent: event => events.push(event)
};
function assert(value, message) { if (!value) throw new Error(message); }
Promise.all([import('../js/sidepanel/navigation.js'),import('../js/sidepanel/social/view.js')]).then(([navigation, view]) => {
 navigation.initTabNavigation();
 view.notifySocial(1); assert(!ids.socialToast.classList.contains('hidden'), 'Notification shown outside Friends');
 view.showFriendsPanel(true);
 assert(tabs[3].classList.contains('active') && !ids['friends-section'].classList.contains('hidden'), 'Notification opens Friends tab');
 assert(ids.socialToast.classList.contains('hidden'), 'Notification dismissed on opening');
 assert(contents.filter(content => !content.classList.contains('hidden')).length === 1, 'Only one section visible');
 tabs[1].handlers.click(); view.showFriendsPanel(false);
 assert(tabs[1].classList.contains('active'), 'Accepting invitation preserves selected video room');
 tabs[3].handlers.click(); view.showFriendsPanel(false);
 assert(tabs[0].classList.contains('active'), 'Closing Friends during cleanup returns to Rooms');
 tabs[2].handlers.click(); assert(tabs[2].classList.contains('active'), 'Chat navigation retained');
 assert(!navigation.selectTab('missing') && tabs[2].classList.contains('active'), 'Unknown tabs do not disturb current selection');
 assert(events.some(event => event.detail.tab === 'friends'), 'Friends selection emits event for refresh');
 print('PASS: four tabs, notification navigation, invitation destination and cleanup');
}).catch(error => { print(String(error)); quit(1); });
