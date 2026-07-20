// ===== IMAGE TO PROMPT =====
var i2pImage = null;
setupDropZone('i2pDropZone', 'i2pFileInput', (url) => { i2pImage = url; showImageInZone('i2pDropZone', url); });
on('i2pUseCurrentBtn', 'click', () => {
  const cur = getCurrentMainImage();
  if (!cur) { setStatus('i2pStatus', 'Generate an image in the Image tab first.'); return; }
  i2pImage = cur; showImageInZone('i2pDropZone', cur);
});
on('i2pRunBtn', 'click', async () => {
  if (!i2pImage) { setStatus('i2pStatus', 'Load an image first.'); return; }
  const btn = id('i2pRunBtn');
  btn.disabled = true;
  setStatus('i2pStatus', 'Analyzing image...');
  html('i2pOutput', '<span style="color:var(--muted)">Thinking…</span>');
  try {
    const blob = await dataUrlToBlob(i2pImage);
    const out = await root.generateText({
      instruction: ["Look at this image and write a single dense text-to-image diffusion prompt that would reproduce it as closely as possible. Include subject, style, composition, lighting, color palette, mood, and quality boosters. Return ONLY the prompt text, no preamble, no quotes, under 70 words.\n\nIMPORTANT: if the image contains a person, include 'anatomically correct, exactly 5 fingers per hand, symmetrical face' in the prompt to prevent deformities when reproduced. Keep the description to a single subject if possible.", blob],
    });
    const text = String(out).trim();
    html('i2pOutput', escapeHtml(text));
    setStatus('i2pStatus', 'Done.');
    id('i2pSaveGalleryBtn').disabled = false;
  } catch (e) {
    html('i2pOutput', '<span style="color:var(--error)">Failed: ' + escapeHtml(e.message || String(e)) + '</span>');
    setStatus('i2pStatus', '');
  } finally {
    btn.disabled = false;
  }
});
on('i2pCopyBtn', 'click', () => {
  const text = id('i2pOutput').textContent.trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => setStatus('i2pStatus', 'Copied to clipboard.'));
});
on('i2pSendBtn', 'click', () => {
  const text = id('i2pOutput').textContent.trim();
  if (!text) { setStatus('i2pStatus', 'Generate a prompt first.'); return; }
  id('generate-textarea').value = text;
  switchTab('image');
  setStatus('i2pStatus', 'Sent to Image tab prompt.');
});
