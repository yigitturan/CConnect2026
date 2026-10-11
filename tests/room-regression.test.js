// Mock DOM/Firebase regression test; run with JavaScriptCore (jsc).
globalThis.console = { log() {}, error(...args) { throw new Error(args.join(' ')); } };
globalThis.window = { addEventListener() {}, dispatchEvent() {} };
globalThis.setTimeout = () => 1;
globalThis.CustomEvent = function(type) { this.type = type; };
globalThis.clearTimeout = () => {};
globalThis.clearInterval = () => {};
const nodes = new Map();
function node(id) {
 if (!nodes.has(id)) nodes.set(id, { dataset: {}, isConnected: true, replaceChildren() {}, setAttribute() {}, value: '', textContent: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return true; } }, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
 return nodes.get(id);
}
globalThis.document = { getElementById: node, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, dispatchEvent() {} };
const writes = [];
function ref(path) { return { set: async value => writes.push({ path, value }), once: async () => ({ exists: () => true, val: () => null }), on: () => () => {}, off() {}, child: name => ref(path+'/'+name), push: async value => writes.push({ path, value }), remove() {} }; }
globalThis.firebase = { apps: [1], database: () => ({ goOnline() {}, ref }) };
Promise.all([
 import('../js/sidepanel/application.js'),
 import('../js/sidepanel/elements.js')
]).then(async ([app, dom]) => {
 dom.initElements(); app.startSidepanel();
 const api = window.videoSyncApp;
 if (!api.appState.initialized) throw new Error('Startup failed');
 api.appState.currentUser = 'tester';
 await node('createVideoChatCodeBtn').handlers.click();
 await node('createChatCodeBtn').handlers.click();
 if (!writes.some(w => w.path.startsWith('videoRooms/')) || !writes.some(w => w.path.startsWith('chatRooms/'))) throw new Error('Room creation failed');
 node('videoCodeInput').value = 'VIDEO1';
 await node('joinVideoRoomBtn').handlers.click();
 if (api.appState.currentVideoRoom !== 'VIDEO1' || !api.sharedNoteSystem.active) throw new Error('Video room join failed');
 node('chatCodeInput').value = 'CHAT01';
 await node('joinChatRoomBtn').handlers.click();
 node('messageInput').value = 'Hello';
 await node('sendMessageBtn').onclick();
 if (!writes.some(w => w.path === 'chatMessages/CHAT01' && w.value.text === 'Hello')) throw new Error('Message sending failed');
 if (typeof node('startButton').onclick !== 'function' || typeof node('cameraToggle').onclick !== 'function' || typeof node('micToggle').onclick !== 'function') throw new Error('Media controls missing');
 const state = api.emailVerificationState;
 api.resetEmailVerificationState();
 if (state !== api.emailVerificationState) throw new Error('Verification state reference changed');
 node('closeChatRoom').handlers.click();
 node('closeVideoChat').handlers.click();
 if (api.appState.currentChatRoom || api.appState.currentVideoRoom) throw new Error('Room close failed');
 print('PASS: module startup, room creation/join/close, message sending, media bindings, shared state');
}).catch(error => { print(String(error)); print(error.stack || ''); quit(1); });
