import { chatStream } from './llm.js';

// ── Service Worker ───────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

// ── API Key (localStorage) ────────────────────────────────────────────────────
const KEY_STORE = 'voxspark_api_key';

function loadKey() {
  const k = localStorage.getItem(KEY_STORE);
  if (k) window.__VOXSPARK_API_KEY = k;
  return k;
}

function saveKey(k) {
  if (k) {
    localStorage.setItem(KEY_STORE, k);
    window.__VOXSPARK_API_KEY = k;
  } else {
    localStorage.removeItem(KEY_STORE);
    delete window.__VOXSPARK_API_KEY;
  }
}

loadKey();

// ── Settings Dialog ───────────────────────────────────────────────────────────
const settingsBtn = document.getElementById('settings-btn');
const settingsDialog = document.getElementById('settings-dialog');
const apiKeyInput = document.getElementById('api-key-input');
const keyStatus = document.getElementById('key-status');
const settingsSave = document.getElementById('settings-save');
const settingsCancel = document.getElementById('settings-cancel');

function refreshKeyStatus() {
  const k = localStorage.getItem(KEY_STORE);
  if (k) {
    keyStatus.textContent = `Key set (${k.slice(0, 12)}…)`;
    keyStatus.className = 'key-status set';
  } else {
    keyStatus.textContent = 'Not set';
    keyStatus.className = 'key-status';
  }
}

settingsBtn.addEventListener('click', () => {
  apiKeyInput.value = localStorage.getItem(KEY_STORE) || '';
  refreshKeyStatus();
  settingsDialog.classList.add('open');
  apiKeyInput.focus();
});

settingsCancel.addEventListener('click', () => settingsDialog.classList.remove('open'));

settingsDialog.addEventListener('click', (e) => {
  if (e.target === settingsDialog) settingsDialog.classList.remove('open');
});

settingsSave.addEventListener('click', () => {
  saveKey(apiKeyInput.value.trim());
  refreshKeyStatus();
  settingsDialog.classList.remove('open');
});

// ── PWA Install Banner ────────────────────────────────────────────────────────
let deferredInstall = null;
const banner = document.getElementById('install-banner');
const installBtn = document.getElementById('install-btn');
const dismissBtn = document.getElementById('dismiss-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
  banner.classList.add('show');
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  const { outcome } = await deferredInstall.userChoice;
  if (outcome === 'accepted') banner.classList.remove('show');
  deferredInstall = null;
});

dismissBtn.addEventListener('click', () => banner.classList.remove('show'));

// ── Chat UI ───────────────────────────────────────────────────────────────────
const form = document.getElementById('prompt-form');
const input = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const output = document.getElementById('output');

const SYSTEM = `You are VoxSpark, a concise and helpful AI assistant.
Answer clearly and directly. Use markdown sparingly — plain prose is preferred.`;

/** @type {Array<{role: string, content: string}>} */
const history = [];

function appendMessage(role, text) {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.textContent = text;
  output.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el;
}

// Auto-resize textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 160) + 'px';
});

// Submit on Enter (Shift+Enter = newline)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  appendMessage('user', text);
  history.push({ role: 'user', content: text });

  const bubble = appendMessage('assistant', '');
  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  bubble.prepend(spinner);

  let reply = '';
  try {
    for await (const chunk of chatStream(history, { system: SYSTEM })) {
      if (spinner.parentNode) spinner.remove();
      reply += chunk;
      bubble.textContent = reply;
      bubble.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    history.push({ role: 'assistant', content: reply });
  } catch (err) {
    spinner.remove();
    bubble.className = 'message error';
    bubble.textContent = `Error: ${err.message}`;
    history.pop(); // remove the failed user turn so history stays consistent
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});
