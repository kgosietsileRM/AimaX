// ===== Image manipulation (canvas-based, no regeneration) =====
var editBaseDataUrl = null;

function loadImageToCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = el('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve({ canvas, ctx, img });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function commitEdit(dataUrl, label) {
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push({ dataUrl, prompt: (state.currentImage?.prompt || '') + ' [' + label + ']' });
  state.historyIndex = state.history.length - 1;
  state.currentImage = { dataUrl, prompt: state.currentImage?.prompt || '', inputs: state.currentImage?.inputs || {} };
  id('main-image').src = dataUrl;
  hide('emptyImageState');
  show('main-image');
  id('variationButton').disabled = false;
  id('copyPromptAgainBtn').disabled = false;
  enableImageSaveGalleryBtn();
  const ib = id('imageInfoBar');
  if (ib) { ib.hidden = false; html(ib, '<span class="info-chip"><strong>' + ICONS.pencil + '</strong> edited</span>'); }
  editBaseDataUrl = dataUrl;
  updateUndoRedo();
}

async function upscaleImageAction() {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  setLoading(true, 'Upscaling image 2x...');
  try {
    const { canvas, ctx, img } = await loadImageToCanvas(state.currentImage.dataUrl);
    const w = img.naturalWidth, h = img.naturalHeight;
    const out = el('canvas');
    out.width = w * 2;
    out.height = h * 2;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, w, h, 0, 0, w * 2, h * 2);
    commitEdit(out.toDataURL('image/png'), 'upscaled 2x');
  } catch (e) {
    showError('Upscale failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

async function rotateImageAction() {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  setLoading(true, 'Rotating image...');
  try {
    const { img } = await loadImageToCanvas(state.currentImage.dataUrl);
    const w = img.naturalWidth, h = img.naturalHeight;
    const out = el('canvas');
    out.width = h;
    out.height = w;
    const octx = out.getContext('2d');
    octx.translate(h / 2, w / 2);
    octx.rotate(Math.PI / 2);
    octx.drawImage(img, -w / 2, -h / 2);
    commitEdit(out.toDataURL('image/png'), 'rotated 90°');
  } catch (e) {
    showError('Rotate failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

async function flipImageAction(horizontal) {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  setLoading(true, 'Flipping image...');
  try {
    const { img } = await loadImageToCanvas(state.currentImage.dataUrl);
    const w = img.naturalWidth, h = img.naturalHeight;
    const out = el('canvas');
    out.width = w;
    out.height = h;
    const octx = out.getContext('2d');
    if (horizontal) {
      octx.translate(w, 0);
      octx.scale(-1, 1);
    } else {
      octx.translate(0, h);
      octx.scale(1, -1);
    }
    octx.drawImage(img, 0, 0);
    commitEdit(out.toDataURL('image/png'), horizontal ? 'flipped H' : 'flipped V');
  } catch (e) {
    showError('Flip failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

async function applyFilter(fn, label) {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  setLoading(true, label + '...');
  try {
    const { canvas, ctx } = await loadImageToCanvas(state.currentImage.dataUrl);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) fn(d, i);
    ctx.putImageData(imgData, 0, 0);
    commitEdit(canvas.toDataURL('image/png'), label.toLowerCase());
  } catch (e) {
    showError(label + ' failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

function grayscaleAction() {
  return applyFilter((d, i) => {
    const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    d[i] = d[i + 1] = d[i + 2] = g;
  }, 'Grayscale');
}

function invertAction() {
  return applyFilter((d, i) => {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  }, 'Invert');
}

async function removeBgAction() {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  setLoading(true, 'Removing background...');
  try {
    const { canvas, ctx } = await loadImageToCanvas(state.currentImage.dataUrl);
    const w = canvas.width, h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    const corners = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.floor(w / 2), 0], [0, Math.floor(h / 2)],
    ];
    let rSum = 0, gSum = 0, bSum = 0;
    for (const [cx, cy] of corners) {
      const idx = (cy * w + cx) * 4;
      rSum += d[idx]; gSum += d[idx + 1]; bSum += d[idx + 2];
    }
    const bgR = rSum / corners.length;
    const bgG = gSum / corners.length;
    const bgB = bSum / corners.length;
    const threshold = 48;
    for (let i = 0; i < d.length; i += 4) {
      const dist = Math.sqrt((d[i] - bgR) ** 2 + (d[i + 1] - bgG) ** 2 + (d[i + 2] - bgB) ** 2);
      if (dist < threshold) {
        d[i + 3] = 0;
      } else if (dist < threshold + 24) {
        d[i + 3] = Math.round(((dist - threshold) / 24) * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);
    commitEdit(canvas.toDataURL('image/png'), 'bg removed');
  } catch (e) {
    showError('Background removal failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

// ===== Adjustment sliders =====
function resetAdjustmentSliders() {
  ['brightness', 'contrast', 'saturation'].forEach(name => {
    id(name + 'Slider').value = 0;
    text(name + 'Val', '0');
  });
}

async function previewAdjustments() {
  const b = parseInt(id('brightnessSlider').value);
  const c = parseInt(id('contrastSlider').value);
  const s = parseInt(id('saturationSlider').value);
  text('brightnessVal', b);
  text('contrastVal', c);
  text('saturationVal', s);
  if (b === 0 && c === 0 && s === 0) {
    id('main-image').src = editBaseDataUrl;
    return;
  }
  try {
    const { canvas, ctx } = await loadImageToCanvas(editBaseDataUrl);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const brightness = b * 2.55;
    const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
    const sat = 1 + s / 100;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] + brightness;
      let g = d[i + 1] + brightness;
      let bl = d[i + 2] + brightness;
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      bl = contrastFactor * (bl - 128) + 128;
      const gray = 0.299 * r + 0.587 * g + 0.114 * bl;
      r = gray + (r - gray) * sat;
      g = gray + (g - gray) * sat;
      bl = gray + (bl - gray) * sat;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, bl));
    }
    ctx.putImageData(imgData, 0, 0);
    id('main-image').src = canvas.toDataURL('image/png');
  } catch (e) {}
}

async function applyAdjustmentsAction() {
  if (!editBaseDataUrl) { showError('Nothing to apply.'); return; }
  const b = parseInt(id('brightnessSlider').value);
  const c = parseInt(id('contrastSlider').value);
  const s = parseInt(id('saturationSlider').value);
  if (b === 0 && c === 0 && s === 0) { showError('No adjustments to apply.'); return; }
  setLoading(true, 'Applying adjustments...');
  try {
    const { canvas, ctx } = await loadImageToCanvas(editBaseDataUrl);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    const brightness = b * 2.55;
    const contrastFactor = (259 * (c + 255)) / (255 * (259 - c));
    const sat = 1 + s / 100;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i] + brightness;
      let g = d[i + 1] + brightness;
      let bl = d[i + 2] + brightness;
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      bl = contrastFactor * (bl - 128) + 128;
      const gray = 0.299 * r + 0.587 * g + 0.114 * bl;
      r = gray + (r - gray) * sat;
      g = gray + (g - gray) * sat;
      bl = gray + (bl - gray) * sat;
      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, bl));
    }
    ctx.putImageData(imgData, 0, 0);
    commitEdit(canvas.toDataURL('image/png'), 'adjusted');
    resetAdjustmentSliders();
  } catch (e) {
    showError('Adjustments failed: ' + (e.message || e));
  } finally {
    setLoading(false);
  }
}

function updateUndoRedo() {
  id('undoButton').disabled = state.historyIndex <= 0;
  id('redoButton').disabled = state.historyIndex >= state.history.length - 1;
}

function undoImageEdit() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  const item = state.history[state.historyIndex];
  state.currentImage = { dataUrl: item.dataUrl, prompt: item.prompt, inputs: {} };
  const img = id('main-image');
  img.src = item.dataUrl;
  rc(img, 'placeholder-image');
  hide('emptyImageState');
  show(img);
  editBaseDataUrl = item.dataUrl;
  resetAdjustmentSliders();
  updateUndoRedo();
}
function redoImageEdit() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++;
  const item = state.history[state.historyIndex];
  state.currentImage = { dataUrl: item.dataUrl, prompt: item.prompt, inputs: {} };
  const img = id('main-image');
  img.src = item.dataUrl;
  rc(img, 'placeholder-image');
  hide('emptyImageState');
  show(img);
  editBaseDataUrl = item.dataUrl;
  resetAdjustmentSliders();
  updateUndoRedo();
}

// ===== Download / Share =====
function downloadImage() {
  if (!state.currentImage) return;
  dl(state.currentImage.dataUrl, 'image-' + Date.now() + '.png');
}

async function shareImage() {
  if (!state.currentImage) return;
  const status = id('create-character-status');
  text(status, 'Uploading image to share...');
  try {
    const blob = await (await fetch(state.currentImage.dataUrl)).blob();
    const res = await root.uploadPlugin(blob, { expires: Date.now() + 1000*60*60*24*30 });
    if (res.error) throw new Error(res.error);
    const url = res.url;
    await navigator.clipboard.writeText(url).catch(()=>{});
    html(status, 'Share link copied: <a href="' + url + '" target="_blank" style="color:var(--accent)">' + url + '</a>');
  } catch (e) {
    text(status, 'Share failed: ' + (e.message || e));
  }
}
