// ===== Save to Gallery (shared) =====
function saveToGallery(slotId, opts) {
  const slot = id(slotId);
  if (!slot) return;
  html(slot, '<div style="padding:10px;color:var(--muted);font-size:12px">Loading save tile…</div>');
  try {
    const h = root.generateImage({
      prompt: opts.prompt,
      seed: opts.seed || -1,
      resolution: opts.resolution || '512x512',
      guidanceScale: opts.guidanceScale || 7,
      negativePrompt: opts.negativePrompt || NEGATIVE_BASE,
      saveTitle: opts.saveTitle || (opts.prompt || '').slice(0, 60),
      saveDescription: opts.saveDescription || '',
      hideGalleryButtons: false,
    });
    html(slot, h);
  } catch (e) {
    html(slot, '<div style="padding:10px;color:var(--error);font-size:12px">Failed: ' + escapeHtml(e.message||e) + '</div>');
  }
}

// Listen for save confirmation signals from gallery iframes
on(window, 'message', (e) => {
  if (e.data && e.data.savedImageToGallerySignal) {
    const gal = id('galleryEmbed');
    if (gal && id('panel-gallery').classList.contains('active')) {
      initGallery();
    }
  }
});

// --- Image tab ---
function enableImageSaveGalleryBtn() {
  id('imageSaveGalleryBtn').disabled = !state.currentImage;
}
on('imageSaveGalleryBtn', 'click', () => {
  if (!state.currentImage) return;
  const inputs = state.currentImage.inputs || {};
  saveToGallery('imageSaveSlot', {
    prompt: inputs.prompt || state.currentImage.prompt || 'AI generated image',
    seed: inputs.seed || -1,
    resolution: inputs.resolution || '768x768',
    guidanceScale: inputs.guidanceScale || 7,
    negativePrompt: inputs.negativePrompt || '',
    saveTitle: (state.currentImage.prompt || 'image').slice(0, 60),
  });
});

// --- Image Editor ---
var editorLastPrompt = null;
on('editorSaveGalleryBtn', 'click', () => {
  if (!editorLastPrompt) return;
  saveToGallery('editorSaveSlot', {
    prompt: editorLastPrompt,
    resolution: '768x768',
    saveTitle: editorLastPrompt.slice(0, 60),
  });
});

// --- Image to Prompt ---
on('i2pSaveGalleryBtn', 'click', () => {
  const text = id('i2pOutput').textContent.trim();
  if (!text) return;
  const i2pPrompt = withShield(text, state.style);
  saveToGallery('i2pSaveSlot', {
    prompt: i2pPrompt,
    resolution: '768x768',
    saveTitle: text.slice(0, 60),
  });
});

// --- Image to Video ---
on('i2vSaveGalleryBtn', 'click', () => {
  if (!i2vImage) return;
  const i2vSavePrompt = withShield('cinematic still, dramatic scene', state.style);
  saveToGallery('i2vSaveSlot', {
    prompt: i2vSavePrompt,
    resolution: '768x768',
    saveTitle: 'image-to-video frame',
  });
});

// --- Image to Story ---
var i2sLastImagePrompt = null;
on('i2sSaveGalleryBtn', 'click', () => {
  const storyText = id('i2sOutput').textContent.trim();
  if (!storyText) return;
  const storyPrompt = storyText.slice(0, 200).replace(/\n/g, ', ') + ', artistic illustration, highly detailed';
  const finalPrompt = withShield(storyPrompt, state.style);
  saveToGallery('i2sSaveSlot', {
    prompt: finalPrompt,
    resolution: '768x768',
    saveTitle: 'Image to Story',
  });
});

// --- Comic Writer ---
var comicLastScript = null;
on('comicSaveGalleryBtn', 'click', () => {
  const slot = id('comicSaveSlot');
  if (!comicLastScript || !comicLastScript.length) { setStatus('comicStatus', 'Create a comic first.'); return; }
  html(slot, '');
  comicLastScript.forEach((s, i) => {
    const sub = el('div', { style: 'margin-bottom:8px' });
    html(sub, '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">Panel ' + (i+1) + '</div>');
    ap(slot, sub);
    try {
      const comicSavePrompt = withShield(s.image_prompt + ', comic book art, vibrant ink colors, halftone shading', state.style);
      sub.innerHTML += root.generateImage({
        prompt: comicSavePrompt,
        resolution: '512x512',
        guidanceScale: 7,
        saveTitle: 'Comic Panel ' + (i+1) + ': ' + (s.caption || '').slice(0, 40),
        hideGalleryButtons: false,
      });
    } catch (e) {
      sub.innerHTML += '<div style="color:var(--error);font-size:11px">Failed: ' + escapeHtml(e.message||e) + '</div>';
    }
  });
});

// --- Image Studio (canvas result → upload) ---
on('studioSaveGalleryBtn', 'click', async () => {
  if (!studioBaseImg) { setStatus('studioStatus', 'Nothing to save.'); return; }
  const slot = id('studioSaveSlot');
  const btn = id('studioSaveGalleryBtn');
  btn.disabled = true;
  html(slot, '<div style="padding:10px;color:var(--muted);font-size:12px">Uploading…</div>');
  try {
    const blob = await new Promise(res => studioCanvas.toBlob(res, 'image/png'));
    const res = await root.uploadPlugin(blob, { expires: Date.now() + 1000*60*60*24*365 });
    if (res.error) throw new Error(res.error);
    html(slot, '<div style="padding:10px;font-size:12px">Saved to uploads: <a href="' + res.url + '" target="_blank" style="color:var(--accent)">' + res.url + '</a><br><span style="color:var(--muted)">Note: canvas edits are uploaded as static files (not the AI gallery, which is for generated images). Use the Image tab to generate + save to the public gallery.</span></div>');
    setStatus('studioStatus', 'Uploaded.');
  } catch (e) {
    html(slot, '<div style="padding:10px;color:var(--error);font-size:12px">Failed: ' + escapeHtml(e.message||e) + '</div>');
  } finally {
    btn.disabled = false;
  }
});

// ===== GALLERY =====
var galleryInited = false;
var galleryCurrentSort = 'top';
function initGallery() {
  const embed = id('galleryEmbed');
  if (!embed) return;
  html(embed, '');
  try {
    html(embed, root.generateImage({ gallery: true, sort: galleryCurrentSort, contentFilter: 'g', adaptiveHeight: true }));
    galleryInited = true;
  } catch (e) {
    html(embed, '<div style="padding:14px;color:var(--error)">Gallery failed to load: ' + escapeHtml(e.message||e) + '</div>');
  }
}
qsa('.gallery-sort-btn').forEach(btn => {
  on(btn, 'click', () => {
    qsa('.gallery-sort-btn').forEach(b => b.style.background = '');
    btn.style.background = 'var(--accent)';
    btn.style.color = '#fff';
    galleryCurrentSort = btn.dataset.sort;
    initGallery();
  });
});
