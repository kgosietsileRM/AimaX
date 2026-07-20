// ===== Wire buttons =====
on('modelSubmitButton', 'click', handleSubmitAction);
on('mobileSubmitButton', 'click', handleSubmitAction);
on('variationButton', 'click', handleVariation);
on('copyPromptAgainBtn', 'click', () => {
  if (!state.currentImage) return;
  const text = state.currentImage.userText || state.currentImage.prompt || '';
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('Prompt copied!')).catch(() => showToast('Failed to copy'));
});
on('undoButton', 'click', undoImageEdit);
on('redoButton', 'click', redoImageEdit);
on('download-button', 'click', downloadImage);
on('share-model-image', 'click', shareImage);
on('enhanceImageButton', 'click', upscaleImageAction);
on('rotateButton', 'click', rotateImageAction);
on('flipHButton', 'click', () => flipImageAction(true));
on('flipVButton', 'click', () => flipImageAction(false));
on('grayscaleButton', 'click', grayscaleAction);
on('invertButton', 'click', invertAction);
on('removeBgButton', 'click', removeBgAction);
on('applyAdjustmentsButton', 'click', applyAdjustmentsAction);
let _previewDebounce = null;
function debouncedPreview() {
  clearTimeout(_previewDebounce);
  _previewDebounce = setTimeout(previewAdjustments, 80);
}
['brightness', 'contrast', 'saturation'].forEach(name => {
  on(name + 'Slider', 'input', debouncedPreview);
});
on('animateButton', 'click', async () => {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  showToast('Animating... generating 3 frame variations');
  try {
    const base = withShield(state.currentImage.prompt || 'animate, motion, dynamic', state.style);
    const ta = id('generate-textarea');
    const origVal = ta.value;
    for (let i = 0; i < 3; i++) {
      ta.value = base + `, frame ${i+1}, animation sequence, smooth motion`;
      await handleGenerate();
    }
    ta.value = origVal;
    showToast('Animation frames generated!');
  } catch(e) { showToast('Animation failed: ' + e.message); }
});
on('photopeaButton', 'click', () => {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  dl(state.currentImage.dataUrl, 'edit-me.png');
  showToast('Image downloaded - open it in Photopea to edit');
});

// Ctrl/Cmd+Enter to submit
on('generate-textarea', 'keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmitAction();
});
on('edit-textarea', 'keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSubmitAction();
});

// ===== Init =====
setupModelButtons();
setupModeButtons();
on('reasoningHeader', 'click', () => {
  const panel = id('reasoningPanel');
  tc(panel, 'collapsed');
  at('reasoningHeader', 'aria-expanded', !panel.classList.contains('collapsed'));
});

// ===== Left sidebar: tab switching =====
function switchTab(name) {
  qsa('.sidebar-nav-item').forEach(b => {
    const isActive = b.dataset.tab === name;
    tc(b, 'active', isActive);
    at(b, 'aria-selected', isActive);
  });
  qsa('.tab-panel').forEach(p => tc(p, 'active', p.id === 'panel-' + name));
  const isImage = name === 'image';
  qs('.image-input').style.display = isImage ? '' : 'none';
  qs('.image-output').classList.toggle('full-width', !isImage);
  if (name === 'gallery') initGallery();
  if (name === 'studio') ensureStudioCanvas();
  rc('appSidebar', 'mobile-open');
}
on('sidebarNav', 'click', (e) => {
  const btn = e.target.closest('.sidebar-nav-item');
  if (!btn) return;
  switchTab(btn.dataset.tab);
});
on('sidebarCollapseBtn', 'click', () => {
  var sb = id('appSidebar');
  tc(sb, 'collapsed');
  at('sidebarCollapseBtn', 'aria-label', sb.classList.contains('collapsed') ? 'Expand sidebar' : 'Collapse sidebar');
});
on('mobileSidebarToggle', 'click', () => {
  tc('appSidebar', 'mobile-open');
});
on('sidebarNewBtn', 'click', () => {
  switchTab('image');
  id('generate-textarea').value = '';
  id('generate-textarea').focus();
  if (state.currentImage) {
    hide('main-image');
    var es = id('emptyImageState');
    if (es) show(es);
    hide('generate-edit-selector');
    id('download-button').disabled = true;
    id('share-model-image').disabled = true;
    id('variationButton').disabled = true;
    id('copyPromptAgainBtn').disabled = true;
    var ib = id('imageInfoBar'); if (ib) ib.hidden = true;
    var sd = id('seedDisplay'); if (sd) sd.remove();
    state.currentImage = null;
    state.history = [];
    state.historyIndex = -1;
    updateUndoRedo();
  }
});

// ===== Shared helpers =====
function setStatus(id, msg) { text(id, msg || ''); }
function setOutput(id, h) { html(id, h || ''); }

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then(r => r.blob());
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function setupDropZone(zoneId, inputId, onImage) {
  const zone = id(zoneId);
  const input = id(inputId);
  on(zone, 'click', () => input.click());
  on(input, 'change', async () => {
    const f = input.files[0];
    if (!f) return;
    const url = await fileToDataUrl(f);
    onImage(url);
  });
  on(zone, 'dragover', (e) => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
  on(zone, 'dragleave', () => { zone.style.borderColor = ''; });
  on(zone, 'drop', async (e) => {
    e.preventDefault();
    zone.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith('image/')) return;
    const url = await fileToDataUrl(f);
    onImage(url);
  });
}
function showImageInZone(zoneId, dataUrl) {
  const zone = id(zoneId);
  ac(zone, 'has-image');
  html(zone, '<img src="' + dataUrl + '" alt="loaded">');
}
function getCurrentMainImage() {
  const img = id('main-image');
  if (!img || !img.src || img.classList.contains('placeholder-image')) return null;
  return img.src;
}
