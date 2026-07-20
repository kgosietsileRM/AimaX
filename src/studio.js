// ===== IMAGE STUDIO (manipulator) =====
var studioBaseImg = null; // HTMLImageElement
var studioCanvas, studioCtx;
var studioBaseDataUrl = null;
var studioOriginalDataUrl = null; // first loaded, unchanged by edits
var studioOrigImg = null; // preloaded original Image element
var studioCropMode = false;
var studioCropRect = null; // {x,y,w,h} in canvas coords
var studioZoom = 1;
var studioPanX = 0, studioPanY = 0;
var studioPanDragging = false, studioPanStart = null;
var cropStart = null;
var studioUndoStack = [];
var studioRedoStack = [];
var STUDIO_MAX_UNDO = 25;
var STUDIO_UNDO_SKIP = false; // set to true during undo/redo to avoid re-saving

function studioSaveUndo() {
  if (STUDIO_UNDO_SKIP || !studioCanvas) return;
  studioUndoStack.push(studioCanvas.toDataURL('image/png'));
  if (studioUndoStack.length > STUDIO_MAX_UNDO) studioUndoStack.shift();
  studioRedoStack = [];
  studioUpdateUndoRedo();
}

function studioUndo() {
  if (studioUndoStack.length === 0) return;
  studioRedoStack.push(studioCanvas.toDataURL('image/png'));
  studioLoadUndoState(studioUndoStack.pop());
}

function studioRedo() {
  if (studioRedoStack.length === 0) return;
  studioUndoStack.push(studioCanvas.toDataURL('image/png'));
  studioLoadUndoState(studioRedoStack.pop());
}

function studioLoadUndoState(dataUrl) {
  var img = new Image();
  img.onload = function() {
    STUDIO_UNDO_SKIP = true;
    studioBaseImg = img;
    studioBaseDataUrl = dataUrl;
    studioCanvas.width = img.naturalWidth;
    studioCanvas.height = img.naturalHeight;
    studioResetSliders();
    var txt = id('studioText');
    if (txt) txt.value = '';
    studioRedraw();
    text('studioResLabel', img.naturalWidth + ' \u00d7 ' + img.naturalHeight);
    id('studioSaveGalleryBtn').disabled = false;
    setStatus('studioStatus', 'Restored.');
    STUDIO_UNDO_SKIP = false;
    studioUpdateUndoRedo();
  };
  img.src = dataUrl;
}

function studioUpdateUndoRedo() {
  var ub = id('studioUndoBtn');
  var rb = id('studioRedoBtn');
  if (ub) ub.disabled = studioUndoStack.length === 0;
  if (rb) rb.disabled = studioRedoStack.length === 0;
}
function canvasPos(e) {
  var rect = studioCanvas.getBoundingClientRect();
  var sx = studioCanvas.width / rect.width;
  var sy = studioCanvas.height / rect.height;
  return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
}

function ensureStudioCanvas() {
  if (studioCanvas) return;
  var wrap = id('studioCanvasWrap');
  var zone = id('studioDropZone');
  studioCanvas = el('canvas', { style: 'display:none' });
  studioCtx = studioCanvas.getContext('2d');
  wrap.insertBefore(studioCanvas, zone);
  // Unified pointer events — crop in cropMode, else drag-pan when zoomed
  on(studioCanvas, 'pointerdown', function(e) {
    if (studioCropMode) {
      cropStart = canvasPos(e);
      studioCropRect = { x: cropStart.x, y: cropStart.y, w: 0, h: 0 };
      return;
    }
    if (studioZoom > 1) {
      studioPanDragging = true;
      studioPanStart = { x: e.clientX - studioPanX, y: e.clientY - studioPanY };
      studioCanvas.style.cursor = 'grabbing';
      studioCanvas.setPointerCapture(e.pointerId);
    }
  });
  on(studioCanvas, 'pointermove', function(e) {
    if (studioCropMode && cropStart) {
      var p = canvasPos(e);
      studioCropRect = { x: Math.min(cropStart.x, p.x), y: Math.min(cropStart.y, p.y), w: Math.abs(p.x - cropStart.x), h: Math.abs(p.y - cropStart.y) };
      studioRedraw();
      return;
    }
    if (studioPanDragging) {
      studioPanX = e.clientX - studioPanStart.x;
      studioPanY = e.clientY - studioPanStart.y;
      studioApplyZoom();
    }
  });
  on(studioCanvas, 'pointerup', function() {
    if (studioCropMode) { cropStart = null; return; }
    studioPanDragging = false;
    studioCanvas.style.cursor = '';
  });
  on(studioCanvas, 'pointercancel', function() {
    studioPanDragging = false;
    studioCanvas.style.cursor = '';
  });
  // Wheel zoom
  on(wrap, 'wheel', function(e) {
    if (!studioBaseImg) return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.1 : 0.1;
    studioZoom = Math.max(0.1, Math.min(5, studioZoom + delta));
    studioApplyZoom();
  }, { passive: false });
}
function studioLoadImage(dataUrl) {
  ensureStudioCanvas();
  var img = new Image();
  img.onload = function() {
    studioBaseImg = img;
    studioBaseDataUrl = dataUrl;
    studioOriginalDataUrl = dataUrl;
    var origImg = new Image();
    origImg.onload = function() { studioOrigImg = origImg; };
    origImg.src = dataUrl;
    studioShowingOriginal = false;
    var origBtn = id('studioViewOrig');
    if (origBtn) origBtn.textContent = 'View Original';
    studioCanvas.width = img.naturalWidth;
    studioCanvas.height = img.naturalHeight;
    show(studioCanvas);
    studioZoom = 1;
    studioPanX = 0; studioPanY = 0;
    studioApplyZoom();
    hide('studioDropZone');
    studioResetSliders();
    studioRedraw();
    text('studioResLabel', img.naturalWidth + ' \u00d7 ' + img.naturalHeight);
    setStatus('studioStatus', 'Loaded ' + img.naturalWidth + '\u00d7' + img.naturalHeight + '.');
    id('studioSaveGalleryBtn').disabled = false;
  };
  img.src = dataUrl;
}
function studioApplyZoom() {
  if (!studioCanvas) return;
  studioCanvas.style.transform = 'translate(' + studioPanX + 'px, ' + studioPanY + 'px) scale(' + studioZoom + ')';
  studioCanvas.style.transformOrigin = 'center center';
  text('studioZoomLabel', Math.round(studioZoom * 100) + '%');
}
function studioResetSliders() {
  ['Hue','Blur','Bright','Contrast','Sat','Vig'].forEach(function(k) {
    var el = id('studio'+k);
    if (el) { el.value = 0; }
    text('studio'+k+'Val', '0');
  });
}
function studioRedraw() {
  if (!studioBaseImg) return;
  // Reset view-original toggle
  if (studioShowingOriginal) {
    studioShowingOriginal = false;
    text('studioViewOrig', 'View Original');
  }
  var w = studioCanvas.width, h = studioCanvas.height;
  var hue = parseInt(id('studioHue').value);
  var blur = parseFloat(id('studioBlur').value);
  var bright = parseInt(id('studioBright').value);
  var contrast = parseInt(id('studioContrast').value);
  var sat = parseInt(id('studioSat').value);
  var vig = parseInt(id('studioVig').value);
  var brightPct = 100 + bright;
  var contrastPct = 100 + contrast;
  var satPct = Math.max(0, 100 + sat);
  var filterStr = 'brightness(' + brightPct + '%) contrast(' + contrastPct + '%) saturate(' + satPct + '%) blur(' + blur + 'px) hue-rotate(' + hue + 'deg)';
  studioCtx.save();
  studioCtx.clearRect(0, 0, w, h);
  studioCtx.filter = filterStr;
  studioCtx.drawImage(studioBaseImg, 0, 0);
  studioCtx.filter = 'none';
  if (vig > 0) {
    var grad = studioCtx.createRadialGradient(w/2, h/2, Math.min(w,h)*0.3, w/2, h/2, Math.max(w,h)*0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,' + (vig/100 * 0.9) + ')');
    studioCtx.fillStyle = grad;
    studioCtx.fillRect(0, 0, w, h);
  }
  var txt = id('studioText');
  if (txt && txt.value && txt.value.trim()) {
    studioCtx.save();
    var fontSize = Math.max(16, Math.round(w / 18));
    studioCtx.font = 'bold ' + fontSize + 'px sans-serif';
    studioCtx.textAlign = 'center';
    studioCtx.textBaseline = 'bottom';
    studioCtx.fillStyle = 'rgba(0,0,0,0.6)';
    studioCtx.fillRect(0, h - fontSize*1.6, w, fontSize*1.6);
    studioCtx.fillStyle = '#fff';
    studioCtx.fillText(txt.value.slice(0, 80), w/2, h - fontSize*0.4);
    studioCtx.restore();
  }
  if (studioCropRect) {
    studioCtx.strokeStyle = '#fff';
    studioCtx.lineWidth = 2;
    studioCtx.setLineDash([6, 4]);
    studioCtx.strokeRect(studioCropRect.x, studioCropRect.y, studioCropRect.w, studioCropRect.h);
    studioCtx.setLineDash([]);
  }
  studioCtx.restore();
}

// Tool switching (floating toolbar)
qsa('.studio-tool-btn[data-studio-tool]').forEach(function(btn) {
  on(btn, 'click', function() {
    qsa('.studio-tool-btn[data-studio-tool]').forEach(function(b) { rc(b, 'active'); });
    ac(btn, 'active');
    var tool = btn.dataset.studioTool;
    var panels = {
      adjustments: 'studioPanelAdjustments',
      edit: 'studioPanelEdit',
      resize: 'studioPanelResize',
      background: 'studioPanelBackground',
      retouch: 'studioPanelRetouch',
      video: 'studioPanelVideo'
    };
    var titles = {
      adjustments: 'Adjustments',
      edit: 'AI Edit',
      resize: 'Transform',
      background: 'Background',
      retouch: 'Retouch',
      video: 'Video'
    };
    Object.values(panels).forEach(function(p) { hide(p); });
    show(panels[tool]);
    text('studioSidebarTitle', titles[tool] || tool);
  });
});

// Sidebar close/show buttons
on('studioSidebarClose', 'click', function() {
  var sb = qs('.studio-sidebar');
  var showBtn = id('studioShowSidebarBtn');
  if (sb) {
    sb.style.display = 'none';
    if (showBtn) showBtn.style.display = '';
  }
});
on('studioShowSidebarBtn', 'click', function() {
  var sb = qs('.studio-sidebar');
  var showBtn = id('studioShowSidebarBtn');
  if (sb) {
    sb.style.display = '';
    if (showBtn) showBtn.style.display = 'none';
  }
});

// Zoom controls
on('studioZoomInBtn', 'click', function() {
  studioZoom = Math.min(5, studioZoom + 0.25);
  studioApplyZoom();
});
on('studioZoomOutBtn', 'click', function() {
  studioZoom = Math.max(0.1, studioZoom - 0.25);
  studioApplyZoom();
});
// Undo/Redo
on('studioUndoBtn', 'click', studioUndo);
on('studioRedoBtn', 'click', studioRedo);

on('studioResetPosBtn', 'click', function() {
  studioZoom = 1;
  studioPanX = 0; studioPanY = 0;
  studioApplyZoom();
});
on('studioZoomFitBtn', 'click', function() {
  if (!studioBaseImg || !studioCanvas) return;
  var wrap = id('studioCanvasWrap');
  var wrapW = wrap.clientWidth, wrapH = wrap.clientHeight;
  var imgW = studioCanvas.width, imgH = studioCanvas.height;
  var fit = Math.min(wrapW / imgW, wrapH / imgH, 1);
  studioZoom = Math.round(fit * 100) / 100;
  studioPanX = 0; studioPanY = 0;
  studioApplyZoom();
});
on('studioZoom100Btn', 'click', function() {
  studioZoom = 1;
  studioPanX = 0; studioPanY = 0;
  studioApplyZoom();
});

setupDropZone('studioDropZone', 'studioFileInput', studioLoadImage);
on('studioUseCurrentBtn', 'click', function() {
  var cur = getCurrentMainImage();
  if (!cur) { setStatus('studioStatus', 'Generate an image in the Image tab first.'); return; }
  studioLoadImage(cur);
});
['Hue','Blur','Bright','Contrast','Sat','Vig'].forEach(function(k) {
  var el = id('studio'+k);
  if (!el) return;
  on(el, 'input', function() {
    text('studio'+k+'Val', el.value);
    studioRedraw();
  });
});
on('studioResetAdjBtn', 'click', function() {
  studioResetSliders();
  studioRedraw();
  setStatus('studioStatus', 'Adjustments reset.');
});
// Quick filter presets
var FILTER_PRESETS = {
  warm:  { Hue: 30, Blur: 0, Bright: 8, Contrast: 10, Sat: 15, Vig: 12 },
  cool:  { Hue: 200, Blur: 0, Bright: 5, Contrast: 5, Sat: -10, Vig: 0 },
  noir:  { Hue: 0, Blur: 0, Bright: -5, Contrast: 40, Sat: -100, Vig: 20 },
  vintage: { Hue: 340, Blur: 1, Bright: 5, Contrast: 5, Sat: -20, Vig: 25 },
};
qsa('.studio-filter-btn').forEach(function(btn) {
  on(btn, 'click', function() {
    var name = this.dataset.filter;
    var vals = FILTER_PRESETS[name];
    if (!vals) return;
    studioSaveUndo();
    Object.keys(vals).forEach(function(k) {
      var el = id('studio'+k);
      if (el) { el.value = vals[k]; text('studio'+k+'Val', vals[k]); }
    });
    studioRedraw();
    setStatus('studioStatus', 'Filter: ' + name.charAt(0).toUpperCase() + name.slice(1));
  });
});
var studioTextInput = id('studioText');
if (studioTextInput) on(studioTextInput, 'input', studioRedraw);
on('studioApplyTextBtn', 'click', function() {
  studioRedraw();
  setStatus('studioStatus', 'Text applied. Adjust the text field and it updates live.');
});
on('studioRotateBtn', 'click', function() {
  if (!studioBaseImg) return;
  var w = studioCanvas.width, h = studioCanvas.height;
  var out = el('canvas');
  out.width = h; out.height = w;
  var octx = out.getContext('2d');
  octx.translate(h/2, w/2);
  octx.rotate(Math.PI/2);
  octx.drawImage(studioCanvas, -w/2, -h/2);
  commitStudio(out);
});
on('studioFlipHBtn', 'click', function() {
  if (!studioBaseImg) return;
  var w = studioCanvas.width, h = studioCanvas.height;
  var out = el('canvas');
  out.width = w; out.height = h;
  var octx = out.getContext('2d');
  octx.translate(w, 0); octx.scale(-1, 1);
  octx.drawImage(studioCanvas, 0, 0);
  commitStudio(out);
});
on('studioFlipVBtn', 'click', function() {
  if (!studioBaseImg) return;
  var w = studioCanvas.width, h = studioCanvas.height;
  var out = el('canvas');
  out.width = w; out.height = h;
  var octx = out.getContext('2d');
  octx.translate(0, h); octx.scale(1, -1);
  octx.drawImage(studioCanvas, 0, 0);
  commitStudio(out);
});
function commitStudio(canvas) {
  studioSaveUndo();
  var url = canvas.toDataURL('image/png');
  var img = new Image();
  img.onload = function() {
    studioBaseImg = img;
    studioBaseDataUrl = url;
    studioCanvas.width = img.naturalWidth;
    studioCanvas.height = img.naturalHeight;
    studioResetSliders();
    studioRedraw();
    text('studioResLabel', img.naturalWidth + ' \u00d7 ' + img.naturalHeight);
    setStatus('studioStatus', 'Committed.');
  };
  img.src = url;
}
on('studioCropBtn', 'click', function() {
  if (!studioBaseImg) { setStatus('studioStatus', 'Load an image first.'); return; }
  if (studioCropMode && studioCropRect && studioCropRect.w > 4 && studioCropRect.h > 4) {
    var r = studioCropRect;
    var out = el('canvas');
    out.width = Math.round(r.w); out.height = Math.round(r.h);
    var octx = out.getContext('2d');
    octx.drawImage(studioCanvas, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
    studioCropMode = false;
    studioCropRect = null;
    commitStudio(out);
    setStatus('studioStatus', 'Cropped.');
  } else {
    studioCropMode = !studioCropMode;
    studioCropRect = null;
    setStatus('studioStatus', studioCropMode ? 'Drag a rectangle on the image, then click again to apply.' : 'Crop cancelled.');
    studioRedraw();
  }
});
on('studioResetBtn', 'click', function() {
  if (!studioBaseDataUrl) return;
  studioSaveUndo();
  var img = new Image();
  img.onload = function() {
    studioBaseImg = img;
    studioCanvas.width = img.naturalWidth;
    studioCanvas.height = img.naturalHeight;
    studioResetSliders();
    var txt = id('studioText');
    if (txt) txt.value = '';
    studioRedraw();
    text('studioResLabel', img.naturalWidth + ' \u00d7 ' + img.naturalHeight);
    setStatus('studioStatus', 'Reset to original.');
  };
  img.src = studioBaseDataUrl;
});
on('studioDownloadBtn', 'click', function() {
  if (!studioBaseImg) return;
  dl(studioCanvas.toDataURL('image/png'), 'studio-' + Date.now() + '.png');
});
on('studioSendMainBtn', 'click', function() {
  if (!studioBaseImg) { setStatus('studioStatus', 'Nothing to send.'); return; }
  var url = studioCanvas.toDataURL('image/png');
  var mi = id('main-image');
  mi.src = url;
  rc(mi, 'placeholder-image');
  hide('emptyImageState');
  show(mi);
  if (!state.currentImage) state.currentImage = { dataUrl: url, prompt: 'studio edit', inputs: {} };
  else state.currentImage = Object.assign({}, state.currentImage, { dataUrl: url });
  state.history = [{ dataUrl: url, prompt: 'studio edit' }];
  state.historyIndex = 0;
  id('download-button').disabled = false;
  id('share-model-image').disabled = false;
  show('generate-edit-selector');
  updateUndoRedo();
  switchTab('image');
  setStatus('studioStatus', 'Sent to Image tab.');
});
on('studioDiscardBtn', 'click', function() {
  if (!studioBaseImg) return;
  if (!confirm('Discard the current image and return to the upload screen?')) return;
  studioBaseImg = null;
  studioBaseDataUrl = null;
  studioCropMode = false;
  studioCropRect = null;
  studioZoom = 1;
  studioPanX = 0; studioPanY = 0;
  if (studioCanvas) hide(studioCanvas);
  show('studioDropZone');
  text('studioResLabel', '-- \u00d7 --');
  id('studioSaveGalleryBtn').disabled = true;
  setStatus('studioStatus', '');
});
on('studioRestoreBtn', 'click', function() {
  if (!studioBaseDataUrl) return;
  id('studioResetBtn').click();
});

// ===== Studio AI Edit (region-targeted) =====
on('studioEditRunBtn', 'click', async function() {
  if (!studioBaseImg) { setStatus('studioEditStatus', 'Load an image into the Studio first.'); return; }
  var text = id('studioEditText').value.trim();
  if (!text) { setStatus('studioEditStatus', 'Describe the edit you want.'); return; }

  var btn = id('studioEditRunBtn');
  btn.disabled = true;
  setStatus('studioEditStatus', 'Analyzing image and locating edit region...');
  hide('studioEditResult');

  try {
    studioSaveUndo();
    var sourceDataUrl = studioCanvas.toDataURL('image/png');
    var analysis = await analyzeEditRegion(sourceDataUrl, text);
    var showBox = id('studioEditShowRegion').checked;
    var allowFallback = id('studioEditAllowFallback').checked;
    var feather = parseInt(id('studioEditFeather').value) || 12;

    var img = await loadImgEl(sourceDataUrl);
    var base = el('canvas');
    base.width = img.naturalWidth;
    base.height = img.naturalHeight;
    var bctx = base.getContext('2d');
    bctx.drawImage(img, 0, 0);

    var W = base.width, H = base.height;
    var regionPx = {
      x: (analysis.region.x / 100) * W,
      y: (analysis.region.y / 100) * H,
      w: (analysis.region.w / 100) * W,
      h: (analysis.region.h / 100) * H,
    };
    var isFullImage = analysis.region.w >= 99 && analysis.region.h >= 99;

    if (isFullImage && !allowFallback) {
      setStatus('studioEditStatus', 'Edit spans whole image; enable "Allow full regen" or be more specific.');
      return;
    }

    if (isFullImage) {
      setStatus('studioEditStatus', 'Edit spans whole image — regenerating...');
      var fullPrompt = withShield((analysis.full_desc || text) + ', ' + text + ', ' + ANTI_DISTORTION, state.style);
      var fullResult = await root.generateImage({
        prompt: fullPrompt,
        resolution: '768x768',
        guidanceScale: 8,
        negativePrompt: NEGATIVE_BASE,
      });
      if (!fullResult || !fullResult.dataUrl) throw new Error('No image returned');
      await studioLoadEdited(fullResult.dataUrl);
      showEditDetail(analysis);
      setStatus('studioEditStatus', 'Done (full regen).');
      return;
    }

    setStatus('studioEditStatus', 'Generating patch for the targeted region...');
    var borderCtx = sampleRegionBorderContext(base, regionPx);
    var patchPrompt = withShield(analysis.patch_prompt + (borderCtx ? ', ' + borderCtx : '') + ', ' + ANTI_DISTORTION, state.style);
    var patchResult = await generatePatch(patchPrompt, regionPx.w, regionPx.h);
    if (!patchResult || !patchResult.dataUrl) throw new Error('No patch image returned');

    setStatus('studioEditStatus', 'Compositing patch onto original...');
    var composited = await compositePatch(base, patchResult.dataUrl, regionPx, feather);

    var displayUrl = composited;
    if (showBox) {
      var overlay = el('canvas');
      overlay.width = W; overlay.height = H;
      var octx = overlay.getContext('2d');
      octx.drawImage(await loadImgEl(composited), 0, 0);
      octx.strokeStyle = '#ff3366';
      octx.lineWidth = Math.max(2, Math.round(W / 300));
      octx.setLineDash([10, 6]);
      octx.strokeRect(regionPx.x, regionPx.y, regionPx.w, regionPx.h);
      octx.setLineDash([]);
      displayUrl = overlay.toDataURL('image/png');
    }

    await studioLoadEdited(displayUrl);
    showEditDetail(analysis);
    setStatus('studioEditStatus', 'Done — targeted region edited, rest preserved.');
  } catch (e) {
    setStatus('studioEditStatus', 'Edit failed: ' + (e.message || String(e)));
  } finally {
    btn.disabled = false;
  }
});

function studioLoadEdited(dataUrl) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      studioBaseImg = img;
      studioBaseDataUrl = dataUrl;
      studioCanvas.width = img.naturalWidth;
      studioCanvas.height = img.naturalHeight;
      studioResetSliders();
      var txt = id('studioText');
      if (txt) txt.value = '';
      studioRedraw();
      text('studioResLabel', img.naturalWidth + ' \u00d7 ' + img.naturalHeight);
      id('studioSaveGalleryBtn').disabled = false;
      resolve();
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function showEditDetail(analysis) {
  show('studioEditResult');
  var editTypeLabel = { add: 'Addition', modify: 'Modify', remove: 'Removal', atmospheric: 'Atmospheric' }[analysis.edit_type] || analysis.edit_type;
  html('studioEditReasoning', '<strong>' + editTypeLabel + '</strong> &mdash; ' + escapeHtml(analysis.reasoning || ''));
  html('studioEditDetail',
    '<strong>Region:</strong> x=' + Math.round(analysis.region.x) + '% y=' + Math.round(analysis.region.y) + '% w=' + Math.round(analysis.region.w) + '% h=' + Math.round(analysis.region.h) + '%<br>' +
    '<strong>Subject:</strong> ' + escapeHtml(analysis.subject_location || '&mdash;'));
}

// Blend slider live value
on('studioEditFeather', 'input', function() {
  text('studioEditFeatherVal', this.value);
});

// ===== View Original toggle button =====
var studioShowingOriginal = false;
on('studioViewOrig', 'click', function() {
  if (!studioOrigImg || !studioCanvas || !studioCtx) return;
  studioShowingOriginal = !studioShowingOriginal;
  if (studioShowingOriginal) {
    studioCtx.clearRect(0, 0, studioCanvas.width, studioCanvas.height);
    studioCtx.drawImage(studioOrigImg, 0, 0, studioCanvas.width, studioCanvas.height);
    this.textContent = 'Current';
  } else {
    studioRedraw();
    this.textContent = 'View Original';
  }
});
