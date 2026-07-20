// ===== IMAGE TO VIDEO (Ken Burns preview + AI frames) =====
var i2vImage = null;
var i2vPlaying = false;
function i2vRender() {
  const frame = id('i2vFrame');
  if (!i2vImage) {
    html(frame, '<span style="color:var(--muted);font-size:13px">No image loaded</span>');
    ac(frame, 'paused');
    return;
  }
  html(frame, '<img src="' + i2vImage + '" alt="preview">');
  if (i2vPlaying) rc(frame, 'paused'); else ac(frame, 'paused');
}
setupDropZone('i2vDropZone', 'i2vFileInput', (url) => { i2vImage = url; i2vRender(); id('i2vSaveGalleryBtn').disabled = false; });
on('i2vUseCurrentBtn', 'click', () => {
  const cur = getCurrentMainImage();
  if (!cur) { setStatus('i2vStatus', 'Generate an image in the Image tab first.'); return; }
  i2vImage = cur; i2vRender();
  id('i2vSaveGalleryBtn').disabled = false;
});
on('i2vPreviewBtn', 'click', () => {
  if (!i2vImage) { setStatus('i2vStatus', 'Load an image first.'); return; }
  i2vPlaying = true; i2vRender();
  html(id('i2vPlayPauseBtn'), ICONS.pause + ' Pause');
  setStatus('i2vStatus', 'Playing preview...');
});
on('i2vPlayPauseBtn', 'click', () => {
  if (!i2vImage) { setStatus('i2vStatus', 'Load an image first.'); return; }
  i2vPlaying = !i2vPlaying;
  i2vRender();
  html(id('i2vPlayPauseBtn'), i2vPlaying ? ICONS.pause + ' Pause' : ICONS.play + ' Play');
});
on('i2vDownloadFrameBtn', 'click', () => {
  if (!i2vImage) { setStatus('i2vStatus', 'Load an image first.'); return; }
  dl(i2vImage, 'video-frame-' + Date.now() + '.png');
});
on('i2vGenFramesBtn', 'click', async () => {
  if (!i2vImage) { setStatus('i2vStatus', 'Load an image first.'); return; }
  const btn = id('i2vGenFramesBtn');
  btn.disabled = true;
  setStatus('i2vStatus', 'Describing image for variation frames...');
  try {
    const blob = await dataUrlToBlob(i2vImage);
    const desc = await root.generateText({
      instruction: ["Describe this image as a short diffusion prompt (under 40 words).", blob],
    });
    const basePrompt = String(desc).trim();
    setStatus('i2vStatus', 'Generating 3 variation frames (queued)...');
    const variations = [
      basePrompt + ', wide angle, dramatic cinematic shot, ' + ANTI_DISTORTION,
      basePrompt + ', close-up, intimate detail, ' + ANTI_DISTORTION,
      basePrompt + ', different time of day, golden hour lighting, ' + ANTI_DISTORTION,
    ];
    const frame = id('i2vFrame');
    html(frame, '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px">' +
      '<div class="spinner" style="width:32px;height:32px;border:3px solid #444;border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite"></div>' +
      '<span style="color:#ccc;font-size:12px">Generating frame 1 of 3…</span>' +
    '</div>');
    const results = [];
    for (let i = 0; i < variations.length; i++) {
      setStatus('i2vStatus', 'Generating frame ' + (i+1) + ' of ' + variations.length + '...');
      const i2vPrompt = withShield(variations[i], state.style);
      const r = await root.generateImage({ prompt: i2vPrompt, resolution: '768x768', guidanceScale: 7, negativePrompt: NEGATIVE_BASE });
      if (r && r.dataUrl) results.push(r.dataUrl);
    }
    if (results.length === 0) throw new Error('No frames generated');
    i2vImage = null;
    i2vPlaying = true;
    let idx = 0;
    rc(frame, 'paused');
    html(frame, '<img src="' + results[0] + '" alt="frame">');
    const imgEl = frame.querySelector('img');
    imgEl.style.animation = 'kenBurns 12s ease-in-out infinite alternate';
    if (window._i2vSlideTimer) clearInterval(window._i2vSlideTimer);
    window._i2vSlideTimer = setInterval(() => {
      idx = (idx + 1) % results.length;
      imgEl.src = results[idx];
    }, 3000);
    html(id('i2vPlayPauseBtn'), ICONS.pause + ' Pause');
    setStatus('i2vStatus', 'Slideshow of ' + results.length + ' AI-generated frames. (Note: true MP4 export requires an external tool — download frames individually.)');
  } catch (e) {
    setStatus('i2vStatus', 'Failed: ' + (e.message || e));
  } finally {
    btn.disabled = false;
  }
});
