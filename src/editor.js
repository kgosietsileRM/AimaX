// ===== IMAGE EDITOR (region-targeted edit: vision finds the region, patch is generated, composited back) =====
var editorImage = null;
setupDropZone('editorDropZone', 'editorFileInput', (url) => { editorImage = url; showImageInZone('editorDropZone', url); });
on('editorUseCurrentBtn', 'click', () => {
  var cur = getCurrentMainImage();
  if (!cur) { setStatus('editorStatus', 'Generate an image in the Image tab first.'); return; }
  editorImage = cur; showImageInZone('editorDropZone', cur);
});

// Load an image element from a data URL
function loadImgEl(dataUrl) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Clamp helper
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Generate a patch image at a target aspect ratio from a prompt
async function generatePatch(prompt, aspectW, aspectH) {
  var res = '768x768';
  var ratio = aspectW / aspectH;
  if (ratio > 1.2) res = '768x512';
  else if (ratio < 0.83) res = '512x768';
  return await root.generateImage({
    prompt,
    resolution: res,
    guidanceScale: 8,
    negativePrompt: NEGATIVE_BASE,
  });
}

// Composite a patch onto a base canvas at a region with feathered edges.
// region = {x,y,w,h} in pixels on the base canvas.
// feather = blur distance in pixels for the alpha mask edge.
function compositePatch(baseCanvas, patchDataUrl, region, feather) {
  return new Promise((resolve, reject) => {
    var patchImg = new Image();
    patchImg.onload = () => {
      try {
        var ctx = baseCanvas.getContext('2d');
        var rx = clamp(region.x, 0, baseCanvas.width);
        var ry = clamp(region.y, 0, baseCanvas.height);
        var rw = clamp(region.w, 1, baseCanvas.width - rx);
        var rh = clamp(region.h, 1, baseCanvas.height - ry);
        // Draw the patch scaled to fit the region on a temp canvas
        var temp = el('canvas');
        temp.width = baseCanvas.width;
        temp.height = baseCanvas.height;
        var tctx = temp.getContext('2d');
        // Cover-fit the patch into the region (preserve aspect by cropping)
        var pAspect = patchImg.naturalWidth / patchImg.naturalHeight;
        var rAspect = rw / rh;
        var sx, sy, sw, sh;
        if (pAspect > rAspect) {
          sh = patchImg.naturalHeight;
          sw = sh * rAspect;
          sx = (patchImg.naturalWidth - sw) / 2;
          sy = 0;
        } else {
          sw = patchImg.naturalWidth;
          sh = sw / rAspect;
          sx = 0;
          sy = (patchImg.naturalHeight - sh) / 2;
        }
        tctx.drawImage(patchImg, sx, sy, sw, sh, rx, ry, rw, rh);
        // Build a feathered alpha mask
        var mask = el('canvas');
        mask.width = baseCanvas.width;
        mask.height = baseCanvas.height;
        var mctx = mask.getContext('2d');
        var f = Math.max(0, feather);
        if (f === 0) {
          mctx.fillStyle = '#fff';
          mctx.fillRect(rx, ry, rw, rh);
        } else {
          // Radial-ish feather via nested rounded rects
          mctx.fillStyle = '#fff';
          mctx.fillRect(rx + f, ry + f, rw - 2*f, rh - 2*f);
          // Edges with gradients
          function edgeGrad(x0,y0,x1,y1,rectFn){
            var g = mctx.createLinearGradient(x0,y0,x1,y1);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(1, 'rgba(255,255,255,1)');
            mctx.fillStyle = g;
            rectFn();
          }
          edgeGrad(rx,0,rx+f,0, function(){ mctx.fillRect(rx, ry+f, f, rh-2*f); });
          edgeGrad(rx+rw-f,0,rx+rw,0, function(){ mctx.fillRect(rx+rw-f, ry+f, f, rh-2*f); });
          edgeGrad(0,ry,0,ry+f, function(){ mctx.fillRect(rx+f, ry, rw-2*f, f); });
          edgeGrad(0,ry+rh-f,0,ry+rh, function(){ mctx.fillRect(rx+f, ry+rh-f, rw-2*f, f); });
          // Corners (solid white square, edges already feathered in)
          mctx.fillStyle = '#fff';
          mctx.fillRect(rx+f, ry+f, Math.max(0,rw-2*f), Math.max(0,rh-2*f));
        }
        // Apply mask as destination-in on temp
        tctx.globalCompositeOperation = 'destination-in';
        tctx.drawImage(mask, 0, 0);
        tctx.globalCompositeOperation = 'source-over';
        // Draw feathered patch onto base
        ctx.drawImage(temp, 0, 0);
        resolve(baseCanvas.toDataURL('image/png'));
      } catch (e) { reject(e); }
    };
    patchImg.onerror = reject;
    patchImg.src = patchDataUrl;
  });
}

// Vision: analyze image + edit instruction, return region + patch prompt.
// Uses chain-of-thought reasoning to infer implicit subjects (e.g. "make me
// have wings" → "me" = main person, wings attach to upper back) and to decide
// whether the edit is an ADDITION (region must expand beyond the subject to
// fit the new element), a MODIFICATION (tight region around the object), a
// REMOVAL (object's bounds), or ATMOSPHERIC (whole image).
async function analyzeEditRegion(dataUrl, editInstruction) {
  var blob = await dataUrlToBlob(dataUrl);
  var raw = await root.generateText({
    instruction: [
      "You are an expert image editing assistant. The user wants to apply this edit: \"" + editInstruction + "\".\n\n" +
      "You MUST reason step by step BEFORE deciding the region. Think about:\n" +
      "1. PRONOUN RESOLUTION: if the user says \"me\", \"my\", \"I\", \"the person\", \"the man/woman/child\" etc., identify WHO in the image they mean (usually the main subject). State their location in the frame.\n" +
      "2. ANATOMICAL/PHYSICAL PLACEMENT: if the edit adds or changes a body part, clothing, or accessory, reason about WHERE it attaches anatomically. Wings → upper back & sides. Hat → top of head. Sunglasses → eyes. Beard → lower face. Tail → lower back. Armor → torso. Jewelry → specific body part. The region must include that body part PLUS any space the new element will occupy (wings extend sideways beyond the body, so the region must include empty space beside the torso).\n" +
      "3. EDIT TYPE: classify as 'add' (new element appears), 'modify' (existing element changes color/style), 'remove' (existing element disappears), or 'atmospheric' (lighting, weather, time of day, mood — affects whole image).\n" +
      "4. REGION SIZE: for 'add', the region is the subject's body part PLUS surrounding empty space where the new element will extend (expand outward). For 'modify'/'remove', the region is the tight bounding box of just the target element. For 'atmospheric', the region is the whole image.\n" +
      "5. PATCH PROMPT: a dense text-to-image diffusion prompt (under 40 words) that regenerates ONLY the cropped region with the edit applied. CRITICAL: for 'add'/'modify' edits on a person, the patch prompt MUST preserve the subject's identity — include \"same person, same face, same pose, same clothing, same identity\" so the patch matches the surrounding original. Match the original lighting, style, and colors. Include \"anatomically correct\" if a human is in the region.\n\n" +
      "Respond with ONLY a compact JSON object on a single line (no markdown, no fences, no commentary). Fields:\n" +
      "subject_location: short description of where the main subject is in the frame (e.g. 'centered, upper-middle').\n" +
      "edit_type: 'add' | 'modify' | 'remove' | 'atmospheric'.\n" +
      "anatomy_reasoning: one sentence explaining WHERE the edit applies anatomically/physically and WHY (e.g. 'Wings attach to the upper back and extend sideways, so the region spans the torso plus empty space to both sides').\n" +
      "region: {\"x\":<0-100>,\"y\":<0-100>,\"w\":<0-100>,\"h\":<0-100>} — bounding box as PERCENTAGES of image width/height (x,y is top-left). For 'add' edits, EXPAND beyond the subject to fit the new element. For 'atmospheric', use {\"x\":0,\"y\":0,\"w\":100,\"h\":100}.\n" +
      "patch_prompt: dense diffusion prompt (under 40 words) for regenerating the cropped region WITH the edit, preserving subject identity and matching surrounding context.\n" +
      "full_desc: one sentence describing the original full image.\n" +
      "reasoning: a short readable summary combining subject_location + anatomy_reasoning + region choice (shown to the user).",
      blob,
    ],
  });
  var txt = String(raw).trim();
  var fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) txt = fence[1].trim();
  var lb = txt.indexOf('{'), rb = txt.lastIndexOf('}');
  if (lb !== -1 && rb > lb) txt = txt.slice(lb, rb + 1);
  var parsed;
  try { parsed = JSON.parse(txt); }
  catch (e) {
    // fallback: whole image
    parsed = { subject_location: '', edit_type: 'atmospheric', anatomy_reasoning: '', region: {x:0,y:0,w:100,h:100}, patch_prompt: editInstruction, full_desc: '', reasoning: 'Parse failed; falling back to full image.' };
  }
  // Validate region
  if (!parsed.region || typeof parsed.region !== 'object') parsed.region = {x:0,y:0,w:100,h:100};
  parsed.region.x = clamp(parseFloat(parsed.region.x)||0, 0, 100);
  parsed.region.y = clamp(parseFloat(parsed.region.y)||0, 0, 100);
  parsed.region.w = clamp(parseFloat(parsed.region.w)||100, 1, 100 - parsed.region.x);
  parsed.region.h = clamp(parseFloat(parsed.region.h)||100, 1, 100 - parsed.region.y);
  if (!parsed.edit_type) parsed.edit_type = 'modify';
  return parsed;
}

// Sample border context (dominant colors + brief description) from the region's
// perimeter on the original image, to help the patch match its surroundings.
function sampleRegionBorderContext(canvas, regionPx) {
  try {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var samples = [];
    var margin = Math.max(4, Math.round(Math.min(regionPx.w, regionPx.h) * 0.08));
    // Sample a ring of points just outside the region
    var pts = [];
    var steps = 16;
    for (var i = 0; i < steps; i++) {
      var t = i / steps;
      pts.push([regionPx.x - margin + t * (regionPx.w + 2*margin), regionPx.y - margin]); // top
      pts.push([regionPx.x - margin + t * (regionPx.w + 2*margin), regionPx.y + regionPx.h + margin]); // bottom
      pts.push([regionPx.x - margin, regionPx.y - margin + t * (regionPx.h + 2*margin)]); // left
      pts.push([regionPx.x + regionPx.w + margin, regionPx.y - margin + t * (regionPx.h + 2*margin)]); // right
    }
    var rSum=0,gSum=0,bSum=0,n=0;
    for (var p of pts) {
      var px = Math.round(clamp(p[0],0,W-1)), py = Math.round(clamp(p[1],0,H-1));
      var d = ctx.getImageData(px, py, 1, 1).data;
      rSum+=d[0]; gSum+=d[1]; bSum+=d[2]; n++;
    }
    var r=Math.round(rSum/n), g=Math.round(gSum/n), b=Math.round(bSum/n);
    return 'surrounding context colors: rgb(' + r + ',' + g + ',' + b + '), match this palette';
  } catch (e) {
    return '';
  }
}

on('editorRunBtn', 'click', async () => {
  if (!editorImage) { setStatus('editorStatus', 'Load an image first.'); return; }
  var text = id('editorText').value.trim();
  if (!text) { setStatus('editorStatus', 'Describe the edit you want.'); return; }
  var btn = id('editorRunBtn');
  btn.disabled = true;
  setStatus('editorStatus', 'Analyzing image and locating edit region...');
  html('editorOutput', '<span style="color:var(--muted)">Locating the region to edit…</span>');
  try {
    // Step 1: vision finds the region + builds a patch prompt
    var analysis = await analyzeEditRegion(editorImage, text);
    var showBox = id('editorShowRegionBox').checked;
    var allowFallback = id('editorFullEditFallback').checked;
    var feather = parseInt(id('editorFeatherSlider').value) || 12;

    var img = await loadImgEl(editorImage);
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

    // If region is the whole image and fallback is disabled, abort with guidance
    if (isFullImage && !allowFallback) {
      setOutput('editorOutput', '<span style="color:var(--muted)">The AI determined this edit affects the whole image. Enable "Allow full regen fallback" to proceed with a full regeneration, or describe a more specific edit.</span>');
      setStatus('editorStatus', 'Edit spans whole image; fallback disabled.');
      return;
    }

    // Step 2: generate a patch (or full regen if region ≈ whole image)
    if (isFullImage) {
      setStatus('editorStatus', 'Edit spans whole image — regenerating with edit applied...');
      var fullPrompt = withShield((analysis.full_desc || text) + ', ' + text + ', ' + ANTI_DISTORTION, state.style);
      var fullResult = await root.generateImage({
        prompt: fullPrompt,
        resolution: '768x768',
        guidanceScale: 8,
        negativePrompt: NEGATIVE_BASE,
      });
      if (!fullResult || !fullResult.dataUrl) throw new Error('No image returned');
      editorLastPrompt = fullPrompt;
      html('editorOutput', '<img src="' + fullResult.dataUrl + '" alt="edited"><div style="font-size:11px;color:var(--muted);margin-top:6px">Full-image regen (edit affected whole image). Reason: ' + escapeHtml(analysis.reasoning || '') + '</div>');
      id('editorSaveGalleryBtn').disabled = false;
      setStatus('editorStatus', 'Done (full regen).');
      return;
    }

    // Targeted patch
    setStatus('editorStatus', 'Generating patch for the targeted region...');
    var borderCtx = sampleRegionBorderContext(base, regionPx);
    var patchPrompt = withShield(analysis.patch_prompt + (borderCtx ? ', ' + borderCtx : '') + ', ' + ANTI_DISTORTION, state.style);
    var patchResult = await generatePatch(patchPrompt, regionPx.w, regionPx.h);
    if (!patchResult || !patchResult.dataUrl) throw new Error('No patch image returned');

    setStatus('editorStatus', 'Compositing patch onto original...');
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

    editorLastPrompt = patchPrompt;
    var editTypeLabel = { add: ICONS.plus + ' Addition', modify: ICONS.palette + ' Modify', remove: ICONS.trash + ' Remove', atmospheric: ICONS.globe + ' Atmospheric' }[analysis.edit_type] || analysis.edit_type;
    html('editorOutput', '<img src="' + displayUrl + '" alt="edited">' +
      '<div style="font-size:11px;color:var(--muted);margin-top:6px;padding:8px;background:var(--panel);border-radius:8px">' +
      '<strong style="color:var(--accent)">' + editTypeLabel + '</strong><br>' +
      '<strong>Subject:</strong> ' + escapeHtml(analysis.subject_location || '—') + '<br>' +
      '<strong>Anatomy:</strong> ' + escapeHtml(analysis.anatomy_reasoning || '—') + '<br>' +
      '<strong>Region:</strong> x=' + Math.round(analysis.region.x) + '% y=' + Math.round(analysis.region.y) + '% w=' + Math.round(analysis.region.w) + '% h=' + Math.round(analysis.region.h) + '%<br>' +
      '<strong>Reasoning:</strong> ' + escapeHtml(analysis.reasoning || '') + '</div>');
    id('editorSaveGalleryBtn').disabled = false;
    setStatus('editorStatus', 'Done — targeted region edited, rest of image preserved.');
  } catch (e) {
    html('editorOutput', '<span style="color:var(--error)">Failed: ' + escapeHtml(e.message || String(e)) + '</span>');
    setStatus('editorStatus', '');
  } finally {
    btn.disabled = false;
  }
});
