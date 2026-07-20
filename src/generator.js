// ===== Model selection =====
function setupModelButtons() {
  qsa('#model-selector button').forEach(btn => {
    on(btn, 'click', () => {
      qsa('#model-selector button').forEach(b => rc(b, 'selected'));
      ac(btn, 'selected');
      const id = btn.id;
      if (id === 'modelHdButton') state.model = 'hd';
      else if (id === 'modelGeniusModeButton') state.model = 'genius';
      else if (id === 'modelSuperGeniusModeButton') state.model = 'super-genius';
      const isGenius = state.model !== 'hd';
      id('standard-image-preference').style.display = isGenius ? 'none' : 'flex';
      id('genius-image-preference').style.display = isGenius ? 'flex' : 'none';
    });
  });
  qsa('#standard-image-preference button').forEach(btn => {
    on(btn, 'click', () => {
      qsa('#standard-image-preference button').forEach(b => rc(b, 'selected'));
      ac(btn, 'selected');
      state.preference = btn.id === 'modelTurboButton' ? 'speed' : 'quality';
    });
  });
  qsa('#genius-image-preference button').forEach(btn => {
    on(btn, 'click', () => {
      qsa('#genius-image-preference button').forEach(b => rc(b, 'selected'));
      ac(btn, 'selected');
      const map = { modelClassButton:'classic', modelAnimeButton:'anime', modelPhotoButton:'photo', modelCinemaButton:'cinema', modelGraphicsButton:'graphics' };
      state.geniusStyle = map[btn.id] || 'classic';
    });
  });
}

// ===== Mode selection (Generate/Edit) =====
function setupModeButtons() {
  on('generateButton', 'click', () => {
    state.mode = 'generate';
    ac('generateButton', 'active');
    rc('editButton', 'active');
    show('generate-textarea');
    hide('edit-textarea');
    qs('.prompt-pill-container').style.display = '';
    show('model-submit-button-container');
    show('generation-controls');
    hide('edit-controls');
    text('mode-header', 'Create an image from text prompt');
    hide('undo-redo-container');
    text('modelSubmitButton', 'Generate');
  });
  on('editButton', 'click', () => {
    if (!state.currentImage) {
      showError('Generate an image first before editing.');
      return;
    }
    state.mode = 'edit';
    ac('editButton', 'active');
    rc('generateButton', 'active');
    hide('generate-textarea');
    hide('edit-textarea');
    hide('.prompt-pill-container');
    hide('model-submit-button-container');
    hide('generation-controls');
    show('edit-controls');
    text('mode-header', 'Edit your image');
    show('undo-redo-container');
    editBaseDataUrl = state.currentImage.dataUrl;
    resetAdjustmentSliders();
  });
}

// ===== Checkbox =====
on('model-new-checkbox', 'change', (e) => {
  state.yeNewe = e.target.checked;
});

// ===== Collapsible (shape) =====
on('modelEditButton', 'click', () => {
  const btn = id('modelEditButton');
  const c = id('suboutline-try-it');
  tc(btn, 'open');
  const isOpen = btn.classList.contains('open');
  c.style.display = isOpen ? 'flex' : 'none';
  at(btn, 'aria-expanded', isOpen);
});

// ===== Build prompt =====
// ===== Hallucination Shield header prompt builder =====
// Combines the 10 physically-grounded template sections from styleConfigs (main.pjs)
// into a single header prompt prepended to the user's text.

// Centralized anti-distortion directives applied to ALL generation paths.
// These reinforce anatomical correctness, count limits, and physical grounding
// to counter diffusion models' tendency to produce deformed figures.
var ANTI_DISTORTION = [
  'anatomically correct',
  'correct human anatomy',
  'symmetrical face',
  'exactly 2 eyes, 1 nose, 1 mouth',
  'exactly 5 fingers per hand (no extra, no fused)',
  'proper limb proportions',
  'natural joint articulation',
  'coherent body structure',
  'no extra limbs, no missing limbs, no fused digits',
  'no distorted hands, no malformed faces',
  'grounded physical contact with surfaces',
  'consistent lighting from a single primary source',
].join(', ');

// Centralized negative prompt to suppress common failure modes.
var NEGATIVE_BASE = [
  'blur', 'blurry', 'low quality', 'worst quality',
  'distorted', 'deformed', 'disfigured', 'mutated',
  'extra limbs', 'missing limbs', 'fused limbs', 'extra fingers', 'missing fingers',
  'malformed hands', 'bad hands', 'long fingers', 'fused fingers',
  'asymmetric face', 'distorted face', 'warped eyes', 'cross-eyed',
  'extra heads', 'two heads', 'fused faces',
  'warped body', 'broken spine', 'unnatural pose', 'impossible anatomy',
  'cloned subject', 'duplicated figure',
  'text', 'watermark', 'signature', 'logo', 'username',
  'jpeg artifacts', 'compression artifacts', 'noise', 'grain',
  'cropped', 'out of frame', 'cut off',
  'lowres', 'pixelated', 'blocky',
].join(', ');

// Helper: apply shield guardrails as trailing style context (user text first)
function withShield(userText, styleId) {
  const header = buildHeaderPrompt(styleId);
  if (!header) return userText;
  return userText + '. Style: ' + header.full;
}

function buildHeaderPrompt(styleId) {
  const styleObj = STYLES.find(s => s.id === styleId) || STYLES[0];
  if (!styleObj.configName) return null;
  const cfg = STYLE_CONFIGS[styleObj.configName];
  if (!cfg) return null;
  // Only the render-style section is generic enough to apply to ANY user
  // request without overriding their subject/composition/color choices.
  // The other 9 sections describe one specific scene and would fight the user.
  return {
    full: cfg.style_render || '',
    styleRender: cfg.style_render || '',
  };
}

function buildPrompt(userText) {
  const styleObj = STYLES.find(s => s.id === state.style) || STYLES[0];
  let prompt = userText.trim();
  const header = buildHeaderPrompt(state.style);
  if (header) {
    // USER REQUEST FIRST (primary), shield guardrails as supporting context
    prompt = prompt + '. Style: ' + header.full;
  } else if (styleObj.modifier) {
    prompt = prompt + ', ' + styleObj.modifier;
  }
  // Genius style modifiers
  if (state.model !== 'hd') {
    const geniusMods = {
      classic: 'highly detailed, masterpiece, professional art',
      anime: 'anime style, detailed illustration, vibrant colors',
      photo: 'photorealistic, 8k, professional photography, sharp focus',
      cinema: 'cinematic lighting, film still, dramatic composition, depth of field',
      graphics: 'graphic design, clean vector art, bold composition',
    };
    prompt += ', ' + (geniusMods[state.geniusStyle] || geniusMods.classic);
  }
  if (state.model === 'super-genius') {
    prompt += ', ultra-detailed, intricate, award-winning, trending on artstation';
  }
  if (state.yeNewe) {
    prompt += ', modern, contemporary, fresh aesthetic';
  }
  // Append anti-distortion directives to every prompt for anatomical integrity
  prompt += ', ' + ANTI_DISTORTION;
  return prompt;
}

function getResolution() {
  // Speed preference downsizes to 512x512-ish
  if (state.preference === 'speed' && state.model === 'hd') {
    return '512x512';
  }
  return SHAPES[state.shape].resolution;
}

function getGuidanceScale() {
  // Higher guidance = stricter adherence to the prompt, reducing hallucination.
  if (state.model === 'super-genius') return 12;
  if (state.model === 'genius') return 9;
  return state.preference === 'quality' ? 8 : 6;
}

// ===== Reasoning =====
// Genius / Super Genius models reason about the prompt before generating.
// HD mode skips reasoning for speed.
function shouldReason() {
  return state.model !== 'hd';
}

function renderReasoning(plan) {
  const panel = id('reasoningPanel');
  const body = id('reasoningBody');
  if (!plan) { panel.hidden = true; return; }
  panel.hidden = false;
  const sections = [
    ['Subject', plan.subject],
    ['Composition', plan.composition],
    ['Lighting & Mood', plan.lighting],
    ['Palette', plan.palette],
    ['Style Notes', plan.style],
    ['Potential Issues', plan.issues],
    ['Final Prompt', plan.finalPrompt],
  ];
  html(body, sections
    .filter(([, v]) => v)
    .map(([label, val]) =>
      '<div class="reasoning-section"><div class="reasoning-label">' + label + '</div><div>' + escapeHtml(String(val)) + '</div></div>'
    ).join(''));
  if (plan.thinking) {
    body.innerHTML += '<div class="reasoning-thinking">' + escapeHtml(String(plan.thinking)) + '</div>';
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function reasonAboutPrompt(userText, isEdit, editInstr) {
  const styleObj = STYLES.find(s => s.id === state.style) || STYLES[0];
  const styleName = styleObj.name;
  const modelLabel = state.model === 'super-genius' ? 'Super Genius' : 'Genius';
  const geniusStyleLabel = {
    classic: 'Classic detailed art',
    anime: 'Anime illustration',
    photo: 'Photorealistic',
    cinema: 'Cinematic film still',
    graphics: 'Graphic design',
  }[state.geniusStyle];

  const task = isEdit
    ? `The user already has an image generated from this base prompt: "${userText}". They want to edit it with this instruction: "${editInstr}". Reason about how to modify the prompt to achieve the edit while preserving the good qualities of the base image and maintaining anatomical correctness (no deformed figures, no extra limbs, no fused fingers).`
    : `The user wants to generate an image from this prompt: "${userText}".`;

  const instruction = `You are an expert image generation prompt enhancer for the ${modelLabel} model. The user wrote a prompt and you will suggest SHORT enhancing keywords to append to it — you must NOT rewrite or rephrase the user's words.

${task}

Selected style: ${styleName}
Aesthetic direction: ${geniusStyleLabel}
Shape/aspect: ${state.shape === 2 ? 'portrait (tall)' : state.shape === 3 ? 'landscape (wide)' : state.shape === 4 ? 'large square' : state.shape === 5 ? 'tall portrait' : 'square'}

CRITICAL RULE: The user's original prompt MUST appear VERBATIM as the first part of finalPrompt. Your job is only to append a few comma-separated enhancing keywords (lighting, composition, mood, quality, and ANATOMICAL CORRECTNESS terms) that complement — never contradict or replace — the user's intent. Do not invent a new subject, change the scene, or paraphrase.

ANTI-DISTORTION FOCUS: Your enhancing keywords MUST include terms that prevent deformed figures: "anatomically correct", "proper proportions", "correct number of fingers", "symmetrical features". Flag any potential anatomy issues (extra limbs, fused digits, warped faces) in the "issues" field.

Respond with ONLY a compact JSON object on a single line. No markdown, no fences, no commentary. Each field value must be under 15 words. Fields:
subject, composition, lighting, palette, style, issues, thinking, finalPrompt
The finalPrompt field MUST start with the user's original prompt text, followed by a comma and your enhancing keywords. Keep total under 60 words.`;

  const raw = await root.generateText({
    instruction,
  });
  // Extract JSON even if wrapped in markdown fences or truncated
  let txt = raw.trim();
  const fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) txt = fence[1].trim();
  const firstBrace = txt.indexOf('{');
  const lastBrace = txt.lastIndexOf('}');
  if (firstBrace !== -1) {
    txt = txt.slice(firstBrace);
    if (lastBrace > firstBrace) {
      txt = txt.slice(0, lastBrace - firstBrace + 1);
    } else {
      // Truncated — no closing brace; try to close it
      txt = txt.replace(/,\s*$/, '') + '}';
    }
  }
  try {
    const parsed = JSON.parse(txt);
    // If finalPrompt got truncated, reconstruct from available fields
    if (!parsed.finalPrompt) {
      const parts = [parsed.subject, parsed.composition, parsed.lighting, parsed.palette, parsed.style]
        .filter(Boolean).join(', ');
      parsed.finalPrompt = parts;
    }
    return parsed;
  } catch (e) {
    // Fall back: try to extract finalPrompt via regex, else use raw
    const fpMatch = txt.match(/"finalPrompt"\s*:\s*"([^"]*)/);
    return {
      finalPrompt: fpMatch ? fpMatch[1] : raw.trim().slice(0, 400),
      thinking: 'Reasoning parse failed; using extracted prompt.',
    };
  }
}

// ===== Enhance prompt =====
async function enhancePrompt() {
  const ta = state.mode === 'edit' ? id('edit-textarea') : id('generate-textarea');
  const text = ta.value.trim();
  if (!text) { showError('Enter a prompt first.'); return; }
  if (state.isEnhancing) return;
  state.isEnhancing = true;
  const icon = id('enhancePromptIcon');
  ac(icon, 'enhancing');
  icon.querySelector('.enhance-icon').style.display = 'none';
  icon.querySelector('.undo-icon').style.display = 'none';
  showError('');
  try {
    const enhanced = await root.generateText({
      instruction: 'Improve this image generation prompt by adding vivid descriptive details, style keywords, lighting, composition, and quality terms. Keep it under 80 words. Return ONLY the improved prompt, no preamble.\n\nIMPORTANT anti-distortion rules:\n- Do NOT add multiple human figures to the scene (single subject only — multiple figures cause limb fusion).\n- If the prompt involves a person, append: "anatomically correct, exactly 5 fingers per hand, symmetrical face, proper proportions".\n- Avoid describing intricate hand poses or complex interactions (these cause deformed hands).\n- Prefer clear, grounded, simple poses.\n\nOriginal prompt: ' + text,
      stopSequences: ['\n\n'],
    });
    state.originalPrompt = text;
    state.enhancedPrompt = enhanced.trim();
    ta.value = state.enhancedPrompt;
    icon.querySelector('.enhance-icon').style.display = '';
    icon.querySelector('.undo-icon').style.display = '';
  } catch (e) {
    showError('Failed to enhance prompt: ' + e.message);
    icon.querySelector('.enhance-icon').style.display = '';
  } finally {
    state.isEnhancing = false;
    rc(icon, 'enhancing');
  }
}

function undoEnhance() {
  const ta = state.mode === 'edit' ? id('edit-textarea') : id('generate-textarea');
  if (state.originalPrompt) {
    ta.value = state.originalPrompt;
    state.enhancedPrompt = '';
    id('enhancePromptIcon').querySelector('.undo-icon').style.display = 'none';
  }
}

on('enhancePromptIcon', 'click', () => {
  const undoIcon = id('enhancePromptIcon').querySelector('.undo-icon');
  if (undoIcon.style.display !== 'none' && state.originalPrompt) {
    undoEnhance();
  } else {
    enhancePrompt();
  }
});

// ===== Generate / Edit =====
function showError(msg) {
  text('tryItResultError', msg || '');
}
function setLoading(on, t) {
  tc('loadingOverlay', 'active', on);
  if (t) text('loadingText', t);
  id('modelSubmitButton').disabled = on;
  id('mobileSubmitButton').disabled = on;
  const ms = qs('.mobile-spinner');
  if (ms) ms.style.display = on ? 'block' : 'none';
}

async function handleSubmitAction() {
  if (state.isGenerating) return;
  return handleGenerate();
}

async function handleGenerate() {
  const ta = id('generate-textarea');
  const userText = ta.value.trim();
  if (!userText) { showError('Please enter a prompt.'); return; }
  showError('');
  savePromptHistory(userText);
  state.isGenerating = true;
  setLoading(true, 'Generating image...');
  id('reasoningPanel').hidden = true;
  try {
    let prompt;
    if (shouldReason()) {
      setLoading(true, 'Reasoning about the prompt...');
      const plan = await reasonAboutPrompt(userText, false, null);
      renderReasoning(plan);
      if (plan && plan.finalPrompt && plan.finalPrompt.trim().toLowerCase().startsWith(userText.toLowerCase())) {
        prompt = plan.finalPrompt;
      } else {
        prompt = buildPrompt(userText);
      }
    } else {
      prompt = buildPrompt(userText);
    }
    setLoading(true, 'Generating image...');
    const negInput = id('negativePromptInput');
    const seedInput = id('seedInput');
    const validateToggle = id('validateToggle');
    const userNegPrompt = (negInput && negInput.value.trim()) ? negInput.value.trim() : '';
    const userSeed = (seedInput && parseInt(seedInput.value) > -1) ? parseInt(seedInput.value) : undefined;
    const opts = {
      prompt,
      resolution: getResolution(),
      guidanceScale: getGuidanceScale(),
      negativePrompt: NEGATIVE_BASE + (userNegPrompt ? ', ' + userNegPrompt : ''),
    };
    if (userSeed !== undefined) opts.seed = userSeed;
    let result, validationInfo;
    if (validateToggle && validateToggle.checked) {
      const safe = await safeGenerateImage(opts, (s) => setLoading(true, s));
      result = safe.result;
      validationInfo = safe.validation;
    } else {
      result = await root.generateImage(opts);
    }
    if (typeof result !== 'object' || !result.dataUrl) {
      throw new Error(typeof result === 'string' ? result : 'No image returned');
    }
    applyResult(result, prompt, userText);
    if (validationInfo) {
      const bar = id('imageInfoBar');
      if (bar && !bar.hidden) {
        const tag = validationInfo.is_deformed
          ? '<span class="info-chip" style="color:var(--error)"><strong>' + ICONS.warning + '</strong> ' + escapeHtml(validationInfo.issues || 'deformed') + '</span>'
          : '<span class="info-chip" style="color:#16a34a"><strong>' + ICONS.check + '</strong> verified clean</span>';
        bar.innerHTML += tag;
      }
    }
  } catch (e) {
    showError('Generation failed: ' + (e.message || e));
  } finally {
    state.isGenerating = false;
    setLoading(false);
  }
}

function applyResult(result, prompt, userText) {
  state.currentImage = { dataUrl: result.dataUrl, prompt, userText: userText || '', inputs: result.inputs };
  const img = id('main-image');
  const emptyState = id('emptyImageState');
  if (img) { show(img); rc(img, 'placeholder-image'); }
  if (emptyState) hide(emptyState);
  img.src = result.dataUrl;
  if (result.inputs && result.inputs.seed !== undefined) {
    const existing = id('seedDisplay');
    if (existing) existing.remove();
    const sd = el('div', { class: 'seed-display', id: 'seedDisplay', title: 'Click to reuse this seed' });
    text(sd, 'Seed: ' + result.inputs.seed);
    on(sd, 'click', () => {
      const si = id('seedInput');
      if (si) si.value = result.inputs.seed;
      showToast('Seed copied: ' + result.inputs.seed);
    });
    img.parentElement.appendChild(sd);
  }
  renderImageInfoBar(result, prompt);
  addToRecentStrip(result.dataUrl, prompt);
  state.history = [{ dataUrl: result.dataUrl, prompt }];
  state.historyIndex = 0;
  show('generate-edit-selector');
  id('download-button').disabled = false;
  id('share-model-image').disabled = false;
  id('variationButton').disabled = false;
  id('copyPromptAgainBtn').disabled = false;
  updateUndoRedo();
}

function renderImageInfoBar(result, prompt) {
  const bar = id('imageInfoBar');
  if (!bar) return;
  const inputs = result.inputs || {};
  const chips = [];
  if (inputs.resolution) chips.push('<span class="info-chip"><strong>' + ICONS.ruler + '</strong> ' + inputs.resolution + '</span>');
  if (inputs.seed !== undefined) chips.push('<span class="info-chip"><strong>' + ICONS.dice + '</strong> ' + inputs.seed + '</span>');
  if (inputs.guidanceScale !== undefined) chips.push('<span class="info-chip"><strong>' + ICONS.target + '</strong> guidance ' + inputs.guidanceScale + '</span>');
  const styleName = (STYLES.find(s => s.id === state.style) || {}).name;
  if (styleName) chips.push('<span class="info-chip"><strong>' + ICONS.palette + '</strong> ' + escapeHtml(styleName) + '</span>');
  const modelLabel = state.model === 'super-genius' ? 'Super Genius' : state.model === 'genius' ? 'Genius' : 'HD';
  chips.push('<span class="info-chip"><strong>' + ICONS.bolt + '</strong> ' + modelLabel + '</span>');
  html(bar, chips.join(''));
  bar.hidden = chips.length === 0;
}

// ===== Recent images strip (session-only) =====
function addToRecentStrip(dataUrl, prompt) {
  const strip = id('recentImagesStrip');
  const track = id('recentImagesTrack');
  if (!strip || !track) return;
  strip.hidden = false;
  if (!state.recentImages) state.recentImages = [];
  if (state.recentImages.length && state.recentImages[0].dataUrl === dataUrl) return;
  state.recentImages.unshift({ dataUrl, prompt });
  if (state.recentImages.length > 12) state.recentImages.length = 12;
  renderRecentStrip();
}

function renderRecentStrip() {
  const track = id('recentImagesTrack');
  const strip = id('recentImagesStrip');
  if (!track || !strip) return;
  const items = state.recentImages || [];
  strip.hidden = items.length === 0;
  html(track, '');
  const currentUrl = state.currentImage && state.currentImage.dataUrl;
  items.forEach((item, idx) => {
    const thumb = el('div', { class: 'recent-thumb' + (item.dataUrl === currentUrl ? ' active' : ''), title: (item.prompt || '').slice(0, 100) });
    html(thumb, '<img src="' + item.dataUrl + '" alt="recent"><button class="thumb-del" aria-label="Remove">×</button>');
    on(thumb, 'click', (e) => {
      if (e.target.classList.contains('thumb-del')) {
        state.recentImages.splice(idx, 1);
        renderRecentStrip();
        return;
      }
      state.currentImage = { dataUrl: item.dataUrl, prompt: item.prompt || '', inputs: {} };
      const mi = id('main-image');
      mi.src = item.dataUrl;
      rc(mi, 'placeholder-image');
      hide('emptyImageState');
      show(mi);
      renderRecentStrip();
    });
    ap(track, thumb);
  });
}

// ===== Post-generation validation: vision checks for deformities =====
// Sends the generated image to the vision model; if deformities are detected
// (extra limbs, fused fingers, malformed faces), the image is regenerated
// with stronger anti-distortion params. Up to maxRetries attempts.
async function validateImage(dataUrl) {
  try {
    var blob = await dataUrlToBlob(dataUrl);
    var raw = await root.generateText({
      instruction: [
        "You are a quality-control inspector for AI-generated images. Examine this image carefully for ANATOMICAL DEFECTS and structural deformities. Check specifically for: extra limbs, missing limbs, fused limbs, extra fingers (more than 5 per hand), missing fingers, fused fingers, malformed hands, extra heads, duplicated faces, asymmetric/distorted faces, warped eyes, impossible body proportions, broken spines, unnatural joint angles, cloned/duplicated subjects, and fused/morphed figures.\n\nRespond with ONLY a compact JSON object on a single line (no markdown, no fences). Fields:\nis_deformed: true if ANY anatomical defect is present, false otherwise.\nseverity: 'none' | 'minor' | 'major' (minor = small glitch barely noticeable, major = clearly broken anatomy).\nissues: a short comma-separated list of specific defects found (empty string if none).\nrecommendation: 'accept' | 'regenerate' (regenerate if severity is major).",
        blob,
      ],
    });
    var txt = String(raw).trim();
    var fence = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) txt = fence[1].trim();
    var lb = txt.indexOf('{'), rb = txt.lastIndexOf('}');
    if (lb !== -1 && rb > lb) txt = txt.slice(lb, rb + 1);
    var parsed;
    try { parsed = JSON.parse(txt); } catch (e) {
      return { is_deformed: false, severity: 'none', issues: '', recommendation: 'accept', parseFailed: true };
    }
    return {
      is_deformed: parsed.is_deformed === true,
      severity: parsed.severity || 'none',
      issues: parsed.issues || '',
      recommendation: parsed.recommendation || 'accept',
    };
  } catch (e) {
    // If validation itself fails, don't block the result — accept the image
    return { is_deformed: false, severity: 'none', issues: '', recommendation: 'accept', validationError: String(e.message || e) };
  }
}

// Safe generation wrapper: generate → validate → auto-regenerate if deformed.
// opts: standard generateImage options.
// onStatus: optional callback(statusText) for loading updates.
// Returns { result, validation, attempts }.
async function safeGenerateImage(opts, onStatus) {
  var maxRetries = 2;
  var currentOpts = Object.assign({}, opts);
  // Ensure anti-distortion negative prompt
  currentOpts.negativePrompt = (opts.negativePrompt || NEGATIVE_BASE) + ', ' + NEGATIVE_BASE;
  var lastResult = null;
  var lastValidation = null;
  for (var attempt = 0; attempt <= maxRetries; attempt++) {
    if (onStatus) onStatus(attempt === 0 ? 'Generating image...' : 'Deformity detected — regenerating (attempt ' + (attempt + 1) + '/' + (maxRetries + 1) + ')...');
    lastResult = await root.generateImage(currentOpts);
    if (typeof lastResult !== 'object' || !lastResult.dataUrl) {
      throw new Error(typeof lastResult === 'string' ? lastResult : 'No image returned');
    }
    if (attempt === maxRetries) break; // last attempt — accept whatever we get
    if (onStatus) onStatus('Validating image for anatomical defects...');
    lastValidation = await validateImage(lastResult.dataUrl);
    if (!lastValidation.is_deformed || lastValidation.recommendation !== 'regenerate') {
      break; // acceptable — stop here
    }
    // Deformed: strengthen params for retry
    currentOpts.guidanceScale = Math.min(20, (currentOpts.guidanceScale || 7) + 3);
    // Reinforce: add explicit anti-distortion to the prompt
    if (currentOpts.prompt.indexOf(ANTI_DISTORTION) === -1) {
      currentOpts.prompt = currentOpts.prompt + ', ' + ANTI_DISTORTION;
    }
    // Strengthen negative prompt with specific detected issues
    if (lastValidation.issues) {
      currentOpts.negativePrompt = currentOpts.negativePrompt + ', ' + lastValidation.issues;
    }
  }
  return { result: lastResult, validation: lastValidation, attempts: attempt + 1 };
}


async function handleVariation() {
  if (!state.currentImage) { showError('Generate an image first.'); return; }
  if (state.isGenerating) return;
  const inputs = state.currentImage.inputs
    ? { ...state.currentImage.inputs }
    : { prompt: state.currentImage.prompt, resolution: getResolution(), guidanceScale: getGuidanceScale() };
  delete inputs.seed;
  inputs.negativePrompt = (inputs.negativePrompt || '') + ', ' + NEGATIVE_BASE;
  state.isGenerating = true;
  setLoading(true, 'Generating variation...');
  id('reasoningPanel').hidden = true;
  try {
    const validateToggle = id('validateToggle');
    let result;
    if (validateToggle && validateToggle.checked) {
      const safe = await safeGenerateImage(inputs, (s) => setLoading(true, s));
      result = safe.result;
    } else {
      result = await root.generateImage(inputs);
    }
    if (typeof result !== 'object' || !result.dataUrl) {
      throw new Error(typeof result === 'string' ? result : 'No image returned');
    }
    applyResult(result, inputs.prompt, state.currentImage.userText || '');
  } catch (e) {
    showError('Variation failed: ' + (e.message || e));
  } finally {
    state.isGenerating = false;
    setLoading(false);
  }
}

// ===== Random prompt generator =====
async function handleRandomPrompt() {
  const chip = id('randomPromptChip');
  if (!chip || chip.classList.contains('loading')) return;
  ac(chip, 'loading');
  const ta = id('generate-textarea');
  try {
    const out = await root.generateText({
      instruction: 'Write a single vivid, creative text-to-image diffusion prompt under 35 words. Pick an interesting, evocative subject with specific details about composition, lighting, mood, and style. Vary the genre (fantasy, sci-fi, slice-of-life, surreal, historical, nature, etc.). Return ONLY the prompt text, no preamble, no quotes.\n\nIMPORTANT: use a SINGLE subject only (no multi-figure scenes — they cause limb fusion). If a person is included, mention "anatomically correct" and keep the pose simple and grounded.',
      stopSequences: ['\n\n'],
    });
    const text = String(out).trim().replace(/^["\']|["\']$/g, '');
    if (text) {
      ta.value = text;
      ta.focus();
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  } catch (e) {
    showError('Random prompt failed: ' + (e.message || e));
  } finally {
    rc(chip, 'loading');
  }
}
