// ===== DARK MODE TOGGLE =====
(function(){
  const btn = id('themeToggle');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') ac(document.documentElement, 'dark-mode');
  if (saved === 'light') rc(document.documentElement, 'dark-mode');
  on(btn, 'click', () => {
    const isDark = tc(document.documentElement, 'dark-mode');
    html(btn, isDark ? ICONS.sun : ICONS.moon);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html(btn, ICONS.sun);
  }
})();

// ===== PROMPT CHIPS =====
on('promptChips', 'click', e => {
  const chip = e.target.closest('.prompt-chip');
  if (!chip) return;
  if (chip.id === 'randomPromptChip') { handleRandomPrompt(); return; }
  const ta = id('generate-textarea');
  ta.value = chip.dataset.prompt;
  ta.focus();
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
});

// ===== ADVANCED OPTIONS TOGGLE =====
on('advancedToggle', 'click', () => {
  const btn = id('advancedToggle');
  const panel = id('advancedPanel');
  tc(btn, 'open');
  tc(panel, 'open');
  at(btn, 'aria-expanded', btn.classList.contains('open'));
});

// ===== PROMPT HISTORY =====
var HISTORY_KEY = 'promptHistory';
function getPromptHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function savePromptHistory(prompt) {
  if (!prompt || prompt.length < 3) return;
  let hist = getPromptHistory().filter(p => p !== prompt);
  hist.unshift(prompt);
  if (hist.length > 20) hist = hist.slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  renderPromptHistory();
}
function renderPromptHistory() {
  const panel = id('promptHistoryPanel');
  const hist = getPromptHistory();
  html(panel, '<div style="font-size:11px;color:var(--muted);padding:4px 10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Recent prompts</div>');
  hist.forEach(p => {
    const item = el('div', { class: 'history-item', title: p });
    text(item, p);
    on(item, 'click', () => {
      const ta = id('generate-textarea');
      ta.value = p;
      ta.focus();
    });
    ap(panel, item);
  });
}
renderPromptHistory();

// ===== IMAGE LIGHTBOX =====
(function(){
  const overlay = id('lightboxOverlay');
  const img = id('lightboxImg');
  on(overlay, 'click', () => {
    rc(overlay, 'visible');
  });
  on(document, 'keydown', e => {
    if (e.key === 'Escape') {
      rc(overlay, 'visible');
      const dd = id('styleDropdown');
      if (dd && dd.classList.contains('open')) {
        rc(dd, 'open');
        at('styleDropdownTrigger', 'aria-expanded', 'false');
      }
    }
  });
  on('main-image', 'click', e => {
    if (e.target.src && !e.target.src.includes('svg')) {
      img.src = e.target.src;
      ac(overlay, 'visible');
    }
  });
})();

// ===== TOAST HELPER =====
function showToast(msg, duration) {
  duration = duration || 2500;
  const el = id('toastNotification');
  text(el, msg);
  ac(el, 'visible');
  setTimeout(() => rc(el, 'visible'), duration);
}

// ===== COPY PROMPT BUTTON =====
(function(){
  const wrapper = qs('.enhance-prompt-wrapper');
  const btn = el('button', { class: 'copy-prompt-btn', type: 'button', title: 'Copy prompt to clipboard' });
  html(btn, ICONS.clipboard + ' Copy');
  on(btn, 'click', () => {
    const ta = id('generate-textarea');
    if (!ta.value.trim()) return;
    navigator.clipboard.writeText(ta.value.trim()).then(() => {
      showToast('Prompt copied!');
      html(btn, ICONS.check + ' Copied');
      setTimeout(() => { html(btn, ICONS.clipboard + ' Copy'); }, 1500);
    }).catch(() => showToast('Failed to copy'));
  });
  ap(wrapper, btn);
})();
