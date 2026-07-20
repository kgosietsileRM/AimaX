// ===== COMIC BOOK WRITER =====
var comicRunning = false;
on('comicRunBtn', 'click', async () => {
  if (comicRunning) return;
  const theme = id('comicThemeInput').value.trim();
  if (!theme) { setStatus('comicStatus', 'Enter a theme first.'); return; }
  comicRunning = true;
  const btn = id('comicRunBtn');
  btn.disabled = true;
  const color = id('comicColorBox').checked;
  const captions = id('comicCaptionBox').checked;
  const grid = id('comicGrid');
  const panels = grid.querySelectorAll('.comic-panel');
  panels.forEach((p, i) => {
    p.className = 'comic-panel';
    html(p, '<span style="color:var(--muted);font-size:12px">Panel ' + (i+1) + '</span>');
  });
  setStatus('comicStatus', 'Writing 4-panel script...');
  try {
    const scriptRaw = await root.generateText({
      instruction: `You are a comic book writer. Write a 4-panel comic about: "${theme}".\nRespond with ONLY a compact JSON array of 4 objects, each with "image_prompt" (a dense text-to-image diffusion prompt under 30 words describing the panel art) and "caption" (a short caption/narration under 15 words). No markdown, no commentary. The four panels should form a coherent mini-story.\nIMPORTANT: Each image_prompt MUST avoid describing complex multi-figure scenes or intricate hand poses (these cause deformed figures in generation). Prefer clear single-subject compositions with simple, grounded poses. Include "anatomically correct" in each image_prompt.`,
    });
    let txt = String(scriptRaw).trim();
    const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) txt = fence[1].trim();
    const lb = txt.indexOf('['), rb = txt.lastIndexOf(']');
    if (lb !== -1 && rb > lb) txt = txt.slice(lb, rb + 1);
    let script;
    try { script = JSON.parse(txt); }
    catch (e) {
      const matches = [...txt.matchAll(/"image_prompt"\s*:\s*"([^"]+)"/g)];
      script = matches.map(m => ({ image_prompt: m[1], caption: '' }));
    }
    if (!Array.isArray(script) || script.length === 0) throw new Error('Could not parse script');
    comicLastScript = script;
    const styleSuffix = color ? ', comic book art, vibrant ink colors, halftone shading, dynamic' : ', black and white comic book art, ink linework, high contrast';
    for (let i = 0; i < Math.min(4, script.length); i++) {
      const panel = panels[i];
      ac(panel, 'loading');
      html(panel, '<div class="comic-loading"><div class="spinner"></div></div>' + (captions && script[i].caption ? '<div class="comic-caption">' + escapeHtml(script[i].caption) + '</div>' : ''));
      setStatus('comicStatus', 'Generating panel ' + (i+1) + ' of ' + script.length + '...');
      try {
        const comicPrompt = withShield(script[i].image_prompt + styleSuffix, state.style);
        const r = await root.generateImage({
          prompt: comicPrompt,
          resolution: '512x512',
          guidanceScale: 7,
          negativePrompt: NEGATIVE_BASE,
        });
        const h = '<img src="' + r.dataUrl + '" alt="panel ' + (i+1) + '">' + (captions && script[i].caption ? '<div class="comic-caption">' + escapeHtml(script[i].caption) + '</div>' : '');
        html(panel, h);
      } catch (e) {
        rc(panel, 'loading');
        html(panel, '<span style="color:var(--error);font-size:11px;padding:6px">Panel failed: ' + escapeHtml(e.message||e) + '</span>');
      }
    }
    setStatus('comicStatus', 'Comic complete.');
    id('comicSaveGalleryBtn').disabled = false;
  } catch (e) {
    setStatus('comicStatus', 'Failed: ' + (e.message || e));
  } finally {
    comicRunning = false;
    btn.disabled = false;
  }
});
