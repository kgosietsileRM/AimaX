// ===== IMAGE TO STORY =====
var i2sImage = null;
setupDropZone('i2sDropZone', 'i2sFileInput', (url) => { i2sImage = url; showImageInZone('i2sDropZone', url); });
on('i2sUseCurrentBtn', 'click', () => {
  const cur = getCurrentMainImage();
  if (!cur) { setStatus('i2sStatus', 'Generate an image in the Image tab first.'); return; }
  i2sImage = cur; showImageInZone('i2sDropZone', cur);
});
on('i2sRunBtn', 'click', async () => {
  if (!i2sImage) { setStatus('i2sStatus', 'Load an image first.'); return; }
  const btn = id('i2sRunBtn');
  btn.disabled = true;
  const dark = id('i2sDarkBox').checked;
  html('i2sOutput', '');
  setStatus('i2sStatus', 'Reading the image...');
  try {
    const blob = await dataUrlToBlob(i2sImage);
    let acc = '';
    await root.generateText({
      instruction: ["Write a vivid short story (200-350 words) inspired by this image. Use the scene, mood, and details visible. Third person, past tense.", blob, dark ? "\nTone: dark, atmospheric, suspenseful." : "\nTone: warm, hopeful."],
      onChunk: (d) => {
        acc += d.textChunk;
        html('i2sOutput', escapeHtml(acc));
      },
    });
    setStatus('i2sStatus', 'Done.');
    id('i2sSaveGalleryBtn').disabled = false;
  } catch (e) {
    html('i2sOutput', '<span style="color:var(--error)">Failed: ' + escapeHtml(e.message || String(e)) + '</span>');
    setStatus('i2sStatus', '');
  } finally {
    btn.disabled = false;
  }
});
