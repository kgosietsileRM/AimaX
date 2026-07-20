// ===== build-dom.js — Dynamic DOM builder =====
// Builds every DOM element for the application.
// Event wiring stays in the respective module files.

// ===== Data: Nav items =====
var NAV_ITEMS = [
  { tab:'image', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>', label:'Image' },
  { tab:'img-editor', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>', label:'Image Editor' },
  { tab:'img-to-prompt', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10h10"/><path d="M20 12v10H10"/><path d="m7.5 7.5 9 9"/><path d="m16.5 7.5-9 9"/></svg>', label:'Image to Prompt' },
  { tab:'img-to-video', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>', label:'Image to Video' },
  { tab:'img-to-story', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>', label:'Image to Story' },
  { tab:'comic', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>', label:'Comic Writer' },
  { tab:'studio', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>', label:'Image Studio' },
  { tab:'gallery', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>', label:'My Gallery' },
];

// ===== Data: Prompt chips =====
var PROMPT_CHIPS = [
  { prompt:'A majestic dragon flying over a misty mountain range at sunset', label:'Dragon at sunset', svg:ICONS.dragon },
  { prompt:'A cozy cabin in a snowy forest with warm light glowing from the windows', label:'Cozy cabin', svg:ICONS.house },
  { prompt:'An astronaut floating in space with Earth reflected in the visor', label:'Astronaut', svg:ICONS.astronaut },
  { prompt:'A cyberpunk city street at night with neon signs and rain reflections', label:'Cyberpunk city', svg:ICONS.city },
  { prompt:'A beautiful watercolor painting of a Japanese garden with cherry blossoms', label:'Japanese garden', svg:ICONS.flower },
  { prompt:'A magical library with floating books and glowing staircases', label:'Magic library', svg:ICONS.books },
  { prompt:'A steampunk airship sailing above the clouds at dawn, brass and copper details', label:'Steampunk airship', svg:ICONS.boat },
  { prompt:'An underwater coral reef city inhabited by luminous jellyfish, sun rays filtering down', label:'Underwater city', svg:ICONS.jellyfish },
  { prompt:'A samurai standing in a bamboo forest during a snowstorm, ink wash painting style', label:'Samurai in snow', svg:ICONS.bamboo },
];

// ===== Data: Studio toolbar =====
var STUDIO_TOOLBAR = [
  { tag:'button', id:'studioUndoBtn', cls:'studio-tb-btn', attrs:{disabled:'',title:'Undo'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' },
  { tag:'button', id:'studioRedoBtn', cls:'studio-tb-btn', attrs:{disabled:'',title:'Redo'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>' },
  { tag:'divider' },
  { tag:'button', id:'studioZoomInBtn', cls:'studio-tb-btn', attrs:{title:'Zoom In'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' },
  { tag:'button', id:'studioZoomOutBtn', cls:'studio-tb-btn', attrs:{title:'Zoom Out'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' },
  { tag:'label', id:'studioZoomLabel', text:'100%', cls:'studio-zoom-label' },
  { tag:'button', id:'studioZoomFitBtn', cls:'studio-tb-btn', attrs:{title:'Fit to Canvas'}, svg:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>' },
  { tag:'button', id:'studioZoom100Btn', cls:'studio-tb-btn', attrs:{title:'Actual Size (100%)'}, svg:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
  { tag:'button', id:'studioPanBtn', cls:'studio-tb-btn', attrs:{title:'Pan Mode'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>' },
  { tag:'button', id:'studioResetPosBtn', cls:'studio-tb-btn', attrs:{disabled:'',title:'Reset Position'}, svg:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' },
  { tag:'divider' },
  { tag:'label', id:'studioResLabel', text:'-- \u00d7 --', cls:'studio-res-label' },
];

var STUDIO_ACTIONS = [
  { id:'studioDiscardBtn', svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', label:'Discard', title:'Discard and return to selection' },
  { id:'studioRestoreBtn', svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>', label:'Restore', title:'Restore to original' },
  { id:'studioDownloadBtn', svg:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', label:'Download', primary:true },
];

// ===== Data: Studio floating tools =====
var STUDIO_FLOATING_TOOLS = [
  { tool:'adjustments', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>', title:'Adjustments', active:true },
  { tool:'edit', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>', title:'Edit' },
  { tool:'resize', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', title:'Transform' },
  { tool:'background', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>', title:'Background' },
  { tool:'retouch', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/></svg>', title:'Retouch' },
  { tool:'video', icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>', title:'Video' },
];

// ===== Data: Studio filter presets =====
var STUDIO_FILTER_PRESETS = [
  { filter:'warm', label:'Warm' },
  { filter:'cool', label:'Cool' },
  { filter:'noir', label:'Noir' },
  { filter:'vintage', label:'Vintage' },
];

// ===== Data: Studio resize buttons =====
var STUDIO_RESIZE_BTNS = [
  { id:'studioRotateBtn', label:'Rotate 90\u00b0' },
  { id:'studioFlipHBtn', label:'Flip Horizontal' },
  { id:'studioFlipVBtn', label:'Flip Vertical' },
  { id:'studioCropBtn', label:'Crop to Selection' },
];

// ===================================================================
// Builder functions — create DOM elements only, no event wiring
// ===================================================================

function buildNavItems() {
  html('sidebarNav', NAV_ITEMS.map(function(item, i) {
    return '<button class="sidebar-nav-item' + (i === 0 ? ' active' : '') + '" data-tab="' + item.tab + '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-controls="panel-' + item.tab + '">' +
      '<span class="nav-icon">' + item.icon + '</span><span class="sidebar-nav-item__label">' + item.label + '</span></button>';
  }).join(''));
}

function buildPromptChips() {
  var container = id('promptChips');
  var label = el('span', { class:'chips-toggle-label' });
  html(label, ICONS.bulb + ' Prompt ideas');
  var toggle = el('button', { class:'chips-dropdown-toggle', type:'button', 'aria-expanded':'false' },
    label,
    el('span', { class:'chips-chevron' }, '\u25be')
  );
  ap(container, toggle);
  var body = el('div', { class:'chips-dropdown-body' });
  var randomChip = el('span', { class:'prompt-chip random-chip', id:'randomPromptChip' });
  html(randomChip, ICONS.dice + ' Random Prompt');
  ap(body, randomChip);
  PROMPT_CHIPS.forEach(function(c) {
    var chip = el('span', { class:'prompt-chip', 'data-prompt':c.prompt });
    html(chip, c.svg + ' ' + c.label);
    ap(body, chip);
  });
  ap(container, body);
  on(toggle, 'click', function() { tc(container, 'open'); at(toggle, 'aria-expanded', container.classList.contains('open')); });
}

function buildModelButtons() {
  var groups = [
    { id:'model-selector', btns:[
      { id:'modelHdButton', label:'HD', cls:'selected' },
      { id:'modelGeniusModeButton', label:'Genius' },
      { id:'modelSuperGeniusModeButton', label:'Super Genius' },
    ]},
    { id:'standard-image-preference', btns:[
      { id:'modelTurboButton', label:'Speed' },
      { id:'modelQualityButton', label:'Quality', cls:'selected' },
    ]},
    { id:'genius-image-preference', btns:[
      { id:'modelClassButton', label:'Classic', cls:'selected' },
      { id:'modelAnimeButton', label:'Anime' },
      { id:'modelPhotoButton', label:'Photography' },
      { id:'modelCinemaButton', label:'Cinematic' },
      { id:'modelGraphicsButton', label:'Graphic Design' },
    ]},
  ];
  groups.forEach(function(g) {
    var el = id(g.id);
    if (!el) return;
    html(el, g.btns.map(function(b) {
      return '<button id="' + b.id + '" type="button"' + (b.cls ? ' class="' + b.cls + '"' : '') + '>' + b.label + '</button>';
    }).join(''));
  });
}

function buildEditButtons() {
  var groups = [
    { id:'editOptsTransform', btns:[
      { id:'enhanceImageButton', label:'Enhance (Upscale 2x)' },
      { id:'rotateButton', label:'Rotate 90\u00b0' },
      { id:'flipHButton', label:'Flip Horizontal' },
      { id:'flipVButton', label:'Flip Vertical' },
    ]},
    { id:'editOptsFilters', btns:[
      { id:'grayscaleButton', label:'Grayscale' },
      { id:'invertButton', label:'Invert Colors' },
      { id:'removeBgButton', label:'Remove Background' },
    ]},
    { id:'editOptsMore', btns:[
      { id:'animateButton', label:'Animate' },
      { id:'photopeaButton', label:'Edit In Photopea' },
    ]},
  ];
  groups.forEach(function(g) {
    var el = id(g.id);
    if (!el) return;
    html(el, g.btns.map(function(b) {
      return '<button class="edit-option-button" id="' + b.id + '">' + b.label + '</button>';
    }).join(''));
  });
}

function buildGallerySortBtns() {
  var el = id('gallerySortRow');
  if (!el) return;
  html(el, ['top','recent','trending'].map(function(s) {
    return '<button class="tool-btn secondary gallery-sort-btn" data-sort="' + s + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</button>';
  }).join(''));
}

function buildStyleButtons() {
  html('styleDropdownPanel', STYLES.map(function(s) {
    return '<div class="style-option' + (s.id === state.style ? ' selected' : '') + '" data-style="' + s.id + '">' +
      '<span class="option-swatch" style="background:' + s.gradient + '">' + s.svg + '</span>' +
      '<span class="option-label">' + s.name + '</span>' +
      '<span class="option-check" style="font-size:14px;line-height:1">\u2713</span>' +
    '</div>';
  }).join(''));
}

function buildShapeButtons() {
  var row = id('shape-row');
  html(row, '');
  for (var i = 1; i <= 5; i++) {
    var s = SHAPES[i];
    var btn = el('div', { class: 'imageShapeButton' + (i === state.shape ? ' selected' : ''), id: 'edit_shape_' + i, 'data-shape': i });
    html(btn, '<div class="shape-inner" style="width:' + s.w + 'px;height:' + s.h + 'px;"></div>');
    ap(row, btn);
  }
}

function buildStudioToolbar() {
  var group1 = id('studioTbTools');
  var group2 = id('studioTbActions');
  if (!group1 || !group2) return;
  html(group1, STUDIO_TOOLBAR.map(function(item) {
    if (item.tag === 'divider') return '<div class="studio-tb-divider"></div>';
    if (item.tag === 'label') return '<span class="' + (item.cls || '') + '" id="' + item.id + '">' + (item.text || '') + '</span>';
    var attrs = '';
    for (var k in item.attrs) { attrs += ' ' + k + '="' + item.attrs[k] + '"'; }
    return '<button class="' + item.cls + '" id="' + item.id + '"' + attrs + '>' + (item.svg || '') + '</button>';
  }).join(''));
  html(group2, STUDIO_ACTIONS.map(function(a) {
    var cls = 'studio-action-btn' + (a.primary ? ' primary' : '');
    return '<button class="' + cls + '" id="' + a.id + '"' + (a.title ? ' title="' + a.title + '"' : '') + '>' + a.svg + '<span class="studio-action-label">' + a.label + '</span></button>';
  }).join(''));
}

function buildStudioFloatingTools() {
  var el = id('studioFloatingTools');
  if (!el) return;
  html(el, STUDIO_FLOATING_TOOLS.map(function(t) {
    var cls = 'studio-tool-btn' + (t.active ? ' active' : '');
    return '<button class="' + cls + '" data-studio-tool="' + t.tool + '" title="' + t.title + '">' + t.icon + '</button>';
  }).join(''));
}

function buildStudioFilterPresets() {
  var el = id('studioFilterPresets');
  if (!el) return;
  html(el, STUDIO_FILTER_PRESETS.map(function(f) {
    return '<button class="studio-filter-btn" data-filter="' + f.filter + '">' + f.label + '</button>';
  }).join(''));
}

function buildStudioResizeBtns() {
  var el = id('studioResizeBtns');
  if (!el) return;
  html(el, STUDIO_RESIZE_BTNS.map(function(b) {
    return '<button class="studio-sidebar-action" id="' + b.id + '">' + b.label + '</button>';
  }).join(''));
}

// ===================================================================
// Section builders — create DOM subtrees using el()/ap()/html()
// ===================================================================

function buildSidebarToggle() {
  var btn = el('button', { class:'mobile-sidebar-toggle', id:'mobileSidebarToggle', 'aria-label':'Toggle sidebar' });
  html(btn, '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>');
  return btn;
}

function buildSidebar() {
  var aside = el('aside', { class:'app-sidebar', id:'appSidebar' });

  var header = el('div', { class:'sidebar-header' });
  var logoMark = el('span', { class:'logo-mark' });
  html(logoMark, ICONS.palette);
  ap(header, el('div', { class:'sidebar-logo' },
    logoMark,
    el('span', { class:'logo-text' }, 'AI Studio')
  ));
  var headerRight = el('div', { style:'display:flex;gap:4px;align-items:center' });
  var themeBtn = el('button', { class:'theme-toggle', id:'themeToggle', 'aria-label':'Toggle dark mode', title:'Toggle dark mode' });
  html(themeBtn, ICONS.moon);
  ap(headerRight, themeBtn);
  ap(header, headerRight);
  ap(aside, header);

  var collapseBtn = el('button', { class:'sidebar-collapse-btn', id:'sidebarCollapseBtn', 'aria-label':'Collapse sidebar' });
  html(collapseBtn,
    '<svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>' +
    '<svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>');
  ap(aside, collapseBtn);

  ap(aside, el('div', { class:'accent-line' }));

  var newBtn = el('button', { class:'sidebar-new-btn', id:'sidebarNewBtn' },
    el('span', { class:'plus-icon' }, '+'),
    el('span', { class:'sidebar-new-btn__label' }, 'New Image')
  );
  ap(aside, newBtn);

  ap(aside, el('div', { class:'sidebar-section-title' }, 'Tools'));
  ap(aside, el('nav', { class:'sidebar-nav', id:'sidebarNav', role:'tablist', 'aria-label':'Tools' }));

  var footer = el('div', { class:'sidebar-footer' },
    el('span', { class:'sidebar-footer-dot' }),
    el('span', { class:'sidebar-footer-label' }, 'Ready')
  );
  ap(aside, footer);

  return aside;
}

function buildImageInputCol() {
  var col = el('div', { class:'model-card-col image-input' });
  var span = el('span', { class:'model-input-col' });

  // Header
  var header = el('div', { class:'outline-try-it' },
    el('h2', { id:'mode-header', class:'create-image-header' }, 'Create an image from text prompt')
  );
  ap(span, header);

  // Prompt area
  var promptContainer = el('div', { class:'prompt-pill-container' });
  var wrapper = el('div', { class:'enhance-prompt-wrapper' });
  ap(wrapper, el('textarea', { id:'generate-textarea', class:'model-input-text-input dynamic-border', placeholder:'Describe what you\'d like to generate', name:'text', style:'height:125px;overflow-y:auto' }));
  ap(wrapper, el('textarea', { id:'edit-textarea', class:'model-input-text-input dynamic-border', placeholder:'Describe the changes you\'d like to make', name:'text', style:'display:none;height:48px;overflow-y:hidden' }));
  var enhanceBtn = el('button', { id:'enhancePromptIcon', type:'button', class:'enhance-prompt-icon', 'data-tooltip':'Enhance prompt', 'aria-label':'Enhance prompt with AI' });
  html(enhanceBtn, '<svg class="enhance-icon" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor"><path d="m499-287 335-335-52-52-335 335 52 52Zm-379-62q0 29 20 45t66 21q16 2 25.5 14.5T240-240q-1 17-12 28t-27 9q-81-10-121-46.5T40-349q0-65 53.5-105.5T242-503q39-3 58.5-12.5T320-542q0-22-21-34.5T230-596q-16-2-25.5-15t-7.5-29q2-17 14-27.5t28-8.5q83 12 122 44.5t39 89.5q0 53-38.5 83T248-423q-64 5-96 23.5T120-349Zm398 156L353-358l382-382q20-20 47.5-20t47.5 20l70 70q20 20 20 47.5T900-575L518-193Zm-159 33q-17 4-30-9t-9-30l33-159 165 165-159 33Z"></path></svg><svg class="undo-icon" style="display:none" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"></path></svg>');
  ap(wrapper, enhanceBtn);
  ap(promptContainer, wrapper);

  var submitBtn = el('button', { id:'mobileSubmitButton', type:'button', class:'pill-submit-button', 'aria-label':'Generate image' });
  html(submitBtn, '<span class="submit-text">Submit</span><svg class="submit-arrow" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 3.5L11 18.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 9.5L11 3.5L17 9.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path></svg><div class="mobile-spinner" style="display:none"></div>');
  ap(promptContainer, submitBtn);
  ap(span, promptContainer);

  // Chips
  ap(span, el('div', { class:'prompt-chips', id:'promptChips' }));

  // Advanced toggle
  var advToggle = el('button', { class:'advanced-toggle', id:'advancedToggle', type:'button', 'aria-expanded':'false', 'aria-controls':'advancedPanel' },
    el('span', { class:'adv-chevron' }, '\u25BE'),
    ' Advanced options'
  );
  ap(span, advToggle);

  // Advanced panel
  var advPanel = el('div', { class:'advanced-panel', id:'advancedPanel' });
  ap(advPanel, el('div', { class:'advanced-row' },
    el('label', { 'for':'negativePromptInput' }, 'Negative'),
    el('input', { type:'text', id:'negativePromptInput', placeholder:'extra limbs, deformed hands, extra fingers, text, watermark' })
  ));
  ap(advPanel, el('div', { class:'advanced-row' },
    el('label', { 'for':'seedInput' }, 'Seed'),
    el('input', { type:'number', id:'seedInput', placeholder:'Random (-1)', min:'-1', value:'-1', style:'width:100px;flex:none' })
  ));
  var advRow3 = el('div', { class:'advanced-row', style:'align-items:center;gap:8px' });
  var validateLabel = el('label', { class:'model-checkbox-label', title:'Vision-checks each generated image for deformities (extra limbs, fused fingers, malformed faces) and auto-regenerates if found' });
  ap(validateLabel, el('input', { type:'checkbox', id:'validateToggle', checked:'checked' }));
  ap(validateLabel, document.createTextNode(' Auto-fix deformed figures'));
  ap(advRow3, validateLabel);
  ap(advPanel, advRow3);
  ap(span, advPanel);

  // Prompt history
  var histPanel = el('div', { class:'prompt-history-panel', id:'promptHistoryPanel' });
  html(histPanel, '<div style="font-size:11px;color:var(--muted);padding:4px 10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">Recent prompts</div>');
  ap(span, histPanel);

  // Generate/edit selector
  var sel = el('div', { id:'generate-edit-selector', style:'display:none;margin-bottom:10px' },
    el('button', { id:'generateButton', type:'button', class:'selector-button active' }, 'Generate'),
    el('button', { id:'editButton', type:'button', class:'selector-button' }, 'Edit')
  );
  ap(span, sel);

  // Submit button container
  var submitContainer = el('div', { id:'model-submit-button-container' });
  ap(submitContainer, el('button', { id:'modelSubmitButton', type:'button' }, 'Generate'));

  var undoContainer = el('div', { id:'undo-redo-container', style:'display:none' });
  var undoGroup = el('div', { class:'undo-redo-buttons' });
  var undoBtn = el('button', { id:'undoButton', type:'button', disabled:'disabled' });
  html(undoBtn, '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"></path></svg> Undo');
  ap(undoGroup, undoBtn);
  var redoBtn = el('button', { id:'redoButton', type:'button', disabled:'disabled' });
  html(redoBtn, 'Redo <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"></path></svg>');
  ap(undoGroup, redoBtn);
  ap(undoContainer, undoGroup);
  ap(submitContainer, undoContainer);
  ap(span, submitContainer);

  ap(col, span);

  // Generation controls
  var genControls = el('div', { id:'generation-controls', style:'display:block' });
  ap(genControls, el('div', { class:'outline-try-it' }, el('h2', null, 'Choose a model')));

  var optsContainer = el('div', { id:'model-all-options-container' });
  ap(optsContainer, el('div', { class:'image-models-container', id:'model-selector' }));
  ap(optsContainer, el('div', { class:'outline-try-it' }, el('h2', { id:'options-header' }, 'Preference')));
  ap(optsContainer, el('div', { class:'image-models-priority-container', id:'standard-image-preference' }));
  ap(optsContainer, el('div', { class:'image-models-preference-container', id:'genius-image-preference', style:'display:none' }));

  var borderCheck = el('div', { class:'options-border-with-checkbox' });
  var checkboxContainer = el('div', { id:'model-checkbox-container' });
  var checkboxRow = el('div', { class:'model-checkbox-row' });

  var newLabel = el('label', { class:'model-checkbox-label' });
  ap(newLabel, el('input', { type:'checkbox', id:'model-new-checkbox' }));
  ap(newLabel, el('span', null, 'Ye Newe'));
  ap(checkboxRow, newLabel);

  var oldLabel = el('label', { class:'model-checkbox-label', style:'display:none' });
  ap(oldLabel, el('input', { type:'checkbox', id:'model-old-checkbox' }));
  ap(oldLabel, el('span', null, 'Ye Olde'));
  ap(checkboxRow, oldLabel);

  ap(checkboxContainer, checkboxRow);
  ap(borderCheck, checkboxContainer);
  ap(optsContainer, borderCheck);

  ap(optsContainer, el('div', { class:'options-border' }));
  ap(optsContainer, el('div', { class:'outline-try-it desktop-styles-header' }, el('h2', null, 'Choose a style')));

  var styleDropdown = el('div', { class:'style-dropdown', id:'styleDropdown' });
  var trigger = el('button', { type:'button', class:'style-dropdown-trigger', id:'styleDropdownTrigger', 'aria-haspopup':'listbox', 'aria-expanded':'false', 'aria-label':'Choose a style' });
  ap(trigger, el('span', { class:'selected-swatch', id:'selectedSwatch' }));
  ap(trigger, el('span', { class:'selected-label', id:'selectedLabel' }, 'AI Image'));
  html(trigger, trigger.innerHTML + '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>');
  ap(styleDropdown, trigger);
  ap(styleDropdown, el('div', { class:'style-dropdown-panel', id:'styleDropdownPanel', role:'listbox', 'aria-label':'Art styles' }));
  ap(optsContainer, el('div', { class:'desktop-style-container' }, styleDropdown));

  ap(optsContainer, el('div', { class:'options-border desktop-only-border' }));

  var collapsible = el('div', { class:'collapsible-sections-container' });
  ap(collapsible, el('button', { id:'modelEditButton', type:'button', class:'open', 'aria-expanded':'true', 'aria-controls':'suboutline-try-it' }, 'Choose Shape'));
  var shapeGroup = el('div', { id:'suboutline-try-it', role:'group', 'aria-label':'Aspect ratios', style:'display:flex;margin-bottom:16px' });
  ap(shapeGroup, el('div', { id:'shape-row' }));
  ap(collapsible, shapeGroup);
  ap(optsContainer, collapsible);
  ap(genControls, optsContainer);
  ap(col, genControls);

  // Edit controls
  var editControls = el('div', { id:'edit-controls', style:'display:none' });
  ap(editControls, el('div', { class:'outline-try-it' }, el('h2', null, 'Transform')));
  ap(editControls, el('div', { class:'edit-options-stack', id:'editOptsTransform' }));
  ap(editControls, el('div', { class:'outline-try-it' }, el('h2', null, 'Adjustments')));

  var adjStack = el('div', { class:'adjustments-stack' });
  var mkAdj = function(id, label) {
    var row = el('label', { class:'adjustment-row' });
    ap(row, el('span', { class:'adjustment-label' }, label));
    ap(row, el('input', { type:'range', id:id+'Slider', min:'-100', max:'100', value:'0', class:'adjustment-slider' }));
    ap(row, el('span', { class:'adjustment-value', id:id+'Val' }, '0'));
    return row;
  };
  ap(adjStack, mkAdj('brightness', 'Brightness'));
  ap(adjStack, mkAdj('contrast', 'Contrast'));
  ap(adjStack, mkAdj('saturation', 'Saturation'));
  ap(adjStack, el('button', { class:'edit-option-button', id:'applyAdjustmentsButton' }, 'Apply Adjustments'));
  ap(editControls, adjStack);

  ap(editControls, el('div', { class:'outline-try-it' }, el('h2', null, 'Filters')));
  ap(editControls, el('div', { class:'edit-options-stack', id:'editOptsFilters' }));
  ap(editControls, el('div', { class:'outline-try-it' }, el('h2', null, 'More editing options')));
  ap(editControls, el('div', { class:'edit-options-stack', id:'editOptsMore' }));
  ap(col, editControls);

  return col;
}

function buildImageOutputCol() {
  var col = el('div', { class:'model-card-col image-output' });

  // ===== Image panel =====
  var imagePanel = el('div', { class:'tab-panel active', id:'panel-image', role:'tabpanel' });
  ap(imagePanel, el('h2', { class:'try-it-result-error', id:'tryItResultError' }));

  var resultArea = el('div', { class:'try-it-result-area', id:'place_holder_picture_model' });
  var emptyState = el('div', { class:'empty-state', id:'emptyImageState' });
  var emptyIcon = el('div', { class:'empty-state-icon' });
  html(emptyIcon, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>');
  ap(emptyState, emptyIcon);
  ap(emptyState, el('div', { class:'empty-state-title' }, 'Your creation awaits'));
  ap(emptyState, el('div', { class:'empty-state-desc' }, 'Type a prompt and click Generate to create your first image. Try one of the suggestion chips for quick inspiration.'));
  ap(resultArea, emptyState);

  ap(resultArea, el('img', { class:'placeholder-image', style:'display:none', id:'main-image', src:'' }));
  var loading = el('div', { class:'loading-overlay', id:'loadingOverlay' });
  ap(loading, el('div', { class:'spinner' }));
  ap(loading, el('div', { class:'loading-text', id:'loadingText' }, 'Generating image...'));
  ap(resultArea, loading);
  ap(imagePanel, resultArea);

  // Reasoning panel
  var reasonPanel = el('div', { class:'reasoning-panel', id:'reasoningPanel', hidden:'hidden' });
  var reasonHead = el('button', { class:'reasoning-header', id:'reasoningHeader', type:'button', 'aria-expanded':'false', 'aria-controls':'reasoningContent' });
  html(reasonHead, '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-3 13.3V18a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.7A7 7 0 0 0 12 2zm-1 19h2v1a1 1 0 0 1-1 1h0a1 1 0 0 1-1-1v-1z"/></svg><span>Reasoning</span><svg class="reasoning-chev" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>');
  ap(reasonPanel, reasonHead);
  ap(reasonPanel, el('div', { class:'reasoning-body', id:'reasoningBody' }));
  ap(imagePanel, reasonPanel);

  // Edit buttons
  var editContainer = el('div', { class:'edit-buttons-container' });
  var extraBtns = el('div', { class:'extra-models-buttons', id:'edit-options-container' });
  var variationBtn = el('button', { id:'variationButton', class:'edit-pill-button', disabled:'disabled' });
  html(variationBtn, ICONS.dice + ' Variation');
  ap(extraBtns, variationBtn);
  ap(extraBtns, el('button', { id:'download-button', class:'edit-pill-button', disabled:'disabled' }, 'Download'));
  ap(extraBtns, el('button', { id:'share-model-image', class:'edit-pill-button', disabled:'disabled' }, 'Share'));
  var copyPromptBtn = el('button', { id:'copyPromptAgainBtn', class:'edit-pill-button', disabled:'disabled' });
  html(copyPromptBtn, ICONS.clipboard + ' Copy Prompt');
  ap(extraBtns, copyPromptBtn);
  ap(extraBtns, el('button', { id:'createCharButton', class:'edit-pill-button', style:'display:none' }, 'Talk to Image'));
  ap(editContainer, extraBtns);

  ap(editContainer, el('div', { class:'image-info-bar', id:'imageInfoBar', hidden:'hidden' }));

  var recentStrip = el('div', { class:'recent-images-strip', id:'recentImagesStrip', hidden:'hidden' });
  ap(recentStrip, el('div', { class:'recent-strip-label' }, 'Recent in session'));
  ap(recentStrip, el('div', { class:'recent-strip-track', id:'recentImagesTrack' }));
  ap(editContainer, recentStrip);

  ap(editContainer, el('div', { class:'create-character-status', id:'create-character-status' }));

  var saveRow = el('div', { class:'save-to-gallery-row' });
  var imageSaveBtn = el('button', { class:'save-gallery-btn', id:'imageSaveGalleryBtn', disabled:'disabled' });
  html(imageSaveBtn, ICONS.heart + ' Save to Gallery');
  ap(saveRow, imageSaveBtn);
  ap(saveRow, el('div', { class:'save-tile-slot', id:'imageSaveSlot' }));
  ap(editContainer, saveRow);
  ap(imagePanel, editContainer);

  ap(col, imagePanel);

  // ===== Editor panel =====
  var editorPanel = el('div', { class:'tab-panel', id:'panel-img-editor', role:'tabpanel' });
  var editorCard = el('div', { class:'tool-card' });
  var editorTitle = el('h3');
  html(editorTitle, ICONS.pencil + ' Image Editor');
  ap(editorCard, editorTitle);
  ap(editorCard, el('p', { class:'tool-desc' }, 'Upload an image, describe what to change, and the AI targets only the relevant region \u2014 generating a patch and compositing it back onto your original, so the rest of the image stays untouched.'));

  var toolRow = el('div', { class:'tool-row', style:'margin-top:10px;align-items:center;gap:14px;flex-wrap:wrap' });
  ap(toolRow, el('button', { class:'tool-btn', id:'editorRunBtn' }, 'Apply Targeted Edit'));
  ap(toolRow, el('button', { class:'tool-btn secondary', id:'editorUseCurrentBtn' }, 'Use Main Image'));

  var blendLabel = el('label', { class:'model-checkbox-label', title:'Higher = stronger edit blend at region edges', style:'white-space:nowrap' });
  ap(blendLabel, el('input', { type:'range', id:'editorFeatherSlider', min:'0', max:'40', value:'12', style:'width:90px;vertical-align:middle' }));
  ap(blendLabel, document.createTextNode(' Blend'));
  ap(toolRow, blendLabel);

  var regionLabel = el('label', { class:'model-checkbox-label', title:'Show the detected edit region overlay', style:'white-space:nowrap' });
  ap(regionLabel, el('input', { type:'checkbox', id:'editorShowRegionBox' }));
  ap(regionLabel, document.createTextNode(' Show region'));
  ap(toolRow, regionLabel);

  var fallbackLabel = el('label', { class:'model-checkbox-label', title:'If unchecked, falls back to full-image regeneration when the edit spans the whole image', style:'white-space:nowrap' });
  ap(fallbackLabel, el('input', { type:'checkbox', id:'editorFullEditFallback', checked:'checked' }));
  ap(fallbackLabel, document.createTextNode(' Allow full regen fallback'));
  ap(toolRow, fallbackLabel);

  ap(editorCard, toolRow);
  ap(editorCard, el('textarea', { class:'tool-textarea', id:'editorText', placeholder:'e.g. make the sky purple, add a hat, turn the car red, remove the person...', style:'margin-top:10px' }));
  ap(editorCard, el('div', { class:'tool-status', id:'editorStatus' }));
  ap(editorPanel, editorCard);

  var split = el('div', { class:'editor-split' });
  var origPane = el('div', { class:'editor-pane' });
  ap(origPane, el('div', { class:'editor-pane-label' }, 'Original'));
  var origZone = el('div', { class:'tool-upload-zone editor-pane-canvas', id:'editorDropZone' });
  var origUploadEmoji = el('span', { class:'upload-emoji' });
  html(origUploadEmoji, ICONS.camera);
  ap(origZone, origUploadEmoji);
  ap(origZone, el('span', null, 'Click or drop an image here'));
  ap(origZone, el('input', { type:'file', id:'editorFileInput', accept:'image/*', hidden:'hidden' }));
  ap(origPane, origZone);
  ap(split, origPane);

  var editPane = el('div', { class:'editor-pane' });
  ap(editPane, el('div', { class:'editor-pane-label' }, 'Edited Result'));
  var editOut = el('div', { class:'tool-output editor-pane-canvas', id:'editorOutput' });
  html(editOut, '<span style="color:var(--muted)">Result will appear here.</span>');
  ap(editPane, editOut);
  ap(split, editPane);
  ap(editorPanel, split);

  var editorSave = el('div', { class:'save-to-gallery-row' });
  var editorSaveBtn = el('button', { class:'save-gallery-btn', id:'editorSaveGalleryBtn', disabled:'disabled' });
  html(editorSaveBtn, ICONS.heart + ' Save to Gallery');
  ap(editorSave, editorSaveBtn);
  ap(editorSave, el('div', { class:'save-tile-slot', id:'editorSaveSlot' }));
  ap(editorPanel, editorSave);

  ap(col, editorPanel);

  // ===== Image to Prompt panel =====
  var i2pPanel = el('div', { class:'tab-panel', id:'panel-img-to-prompt', role:'tabpanel' });
  var i2pCard = el('div', { class:'tool-card' });
  var i2pTitle = el('h3');
  html(i2pTitle, ICONS.tag + ' Image to Prompt');
  ap(i2pCard, i2pTitle);
  ap(i2pCard, el('p', { class:'tool-desc' }, 'Upload an image and the AI will describe it as a detailed text-to-image prompt you can reuse.'));
  var i2pZone = el('div', { class:'tool-upload-zone', id:'i2pDropZone' });
  var i2pUploadEmoji = el('span', { class:'upload-emoji' });
  html(i2pUploadEmoji, ICONS.camera);
  ap(i2pZone, i2pUploadEmoji);
  ap(i2pZone, el('span', null, 'Click or drop an image here'));
  ap(i2pZone, el('input', { type:'file', id:'i2pFileInput', accept:'image/*', hidden:'hidden' }));
  ap(i2pCard, i2pZone);
  var i2pRow = el('div', { class:'tool-row' });
  ap(i2pRow, el('button', { class:'tool-btn', id:'i2pRunBtn' }, 'Generate Prompt'));
  ap(i2pRow, el('button', { class:'tool-btn secondary', id:'i2pUseCurrentBtn' }, 'Use Main Image'));
  ap(i2pCard, i2pRow);
  ap(i2pCard, el('div', { class:'tool-status', id:'i2pStatus' }));
  ap(i2pPanel, i2pCard);

  html(i2pPanel, i2pPanel.innerHTML +
    '<div class="tool-output" id="i2pOutput"><span style="color:var(--muted)">Prompt will appear here.</span></div>' +
    '<div class="tool-row" style="margin-top:8px">' +
      '<button class="tool-btn secondary" id="i2pCopyBtn">Copy</button>' +
      '<button class="tool-btn secondary" id="i2pSendBtn">Send to Image Tab</button>' +
    '</div>' +
    '<div class="save-to-gallery-row">' +
      '<button class="save-gallery-btn" id="i2pSaveGalleryBtn" disabled>' + ICONS.heart + ' Save to Gallery</button>' +
      '<div class="save-tile-slot" id="i2pSaveSlot"></div>' +
    '</div>'
  );
  ap(col, i2pPanel);

  // ===== Image to Video panel =====
  var i2vPanel = el('div', { class:'tab-panel', id:'panel-img-to-video', role:'tabpanel' });
  html(i2vPanel,
    '<div class="tool-card">' +
      '<h3>' + ICONS.clapper + ' Image to Video</h3>' +
      '<p class="tool-desc">Turn a still image into an animated video preview with a smooth Ken Burns pan/zoom effect. You can also generate fresh frames via AI to make a short slideshow.</p>' +
      '<div class="tool-upload-zone" id="i2vDropZone"><span class="upload-emoji">' + ICONS.camera + '</span><span>Click or drop an image here</span><input type="file" id="i2vFileInput" accept="image/*" hidden></div>' +
      '<div class="tool-row" style="margin-top:10px">' +
        '<button class="tool-btn" id="i2vPreviewBtn">' + ICONS.play + ' Play Preview</button>' +
        '<button class="tool-btn secondary" id="i2vUseCurrentBtn">Use Main Image</button>' +
        '<button class="tool-btn secondary" id="i2vGenFramesBtn">' + ICONS.sparkle + ' Generate AI Frames</button>' +
      '</div>' +
      '<div class="tool-status" id="i2vStatus"></div>' +
    '</div>' +
    '<div class="video-preview-frame paused" id="i2vFrame"><span style="color:var(--muted);font-size:13px">No image loaded</span></div>' +
    '<div class="video-controls">' +
        '<button class="tool-btn secondary" id="i2vPlayPauseBtn">' + ICONS.play + ' Play</button>' +
      '<button class="tool-btn secondary" id="i2vDownloadFrameBtn">Download Frame</button>' +
    '</div>' +
    '<div class="save-to-gallery-row">' +
      '<button class="save-gallery-btn" id="i2vSaveGalleryBtn" disabled>' + ICONS.heart + ' Save Frame to Gallery</button>' +
      '<div class="save-tile-slot" id="i2vSaveSlot"></div>' +
    '</div>'
  );
  ap(col, i2vPanel);

  // ===== Image to Story panel =====
  var i2sPanel = el('div', { class:'tab-panel', id:'panel-img-to-story', role:'tabpanel' });
  html(i2sPanel,
    '<div class="tool-card">' +
      '<h3>' + ICONS.book + ' Image to Story</h3>' +
      '<p class="tool-desc">Upload an image and the AI writes a short story inspired by what it sees. Output streams as it generates.</p>' +
      '<div class="tool-upload-zone" id="i2sDropZone"><span class="upload-emoji">' + ICONS.camera + '</span><span>Click or drop an image here</span><input type="file" id="i2sFileInput" accept="image/*" hidden></div>' +
      '<div class="tool-row" style="margin-top:10px">' +
        '<label class="model-checkbox-label"><input type="checkbox" id="i2sDarkBox" checked> Dark tone</label>' +
        '<button class="tool-btn" id="i2sRunBtn">Write Story</button>' +
        '<button class="tool-btn secondary" id="i2sUseCurrentBtn">Use Main Image</button>' +
      '</div>' +
      '<div class="tool-status" id="i2sStatus"></div>' +
    '</div>' +
    '<div class="tool-output" id="i2sOutput"><span style="color:var(--muted)">Your story will appear here.</span></div>' +
    '<div class="save-to-gallery-row">' +
      '<button class="save-gallery-btn" id="i2sSaveGalleryBtn" disabled>' + ICONS.heart + ' Save Story Image to Gallery</button>' +
      '<div class="save-tile-slot" id="i2sSaveSlot"></div>' +
    '</div>'
  );
  ap(col, i2sPanel);

  // ===== Comic panel =====
  var comicPanel = el('div', { class:'tab-panel', id:'panel-comic', role:'tabpanel' });
  html(comicPanel,
    '<div class="tool-card">' +
      '<h3>' + ICONS.burst + ' Comic Book Writer</h3>' +
      '<p class="tool-desc">Give a theme and the AI writes a 4-panel comic script, then generates each panel as an image.</p>' +
      '<input class="tool-input" id="comicThemeInput" placeholder="e.g. a robot discovers a garden in the ruins of a city">' +
      '<div class="tool-row">' +
        '<label class="model-checkbox-label"><input type="checkbox" id="comicColorBox" checked> Color</label>' +
        '<label class="model-checkbox-label"><input type="checkbox" id="comicCaptionBox" checked> Captions</label>' +
        '<button class="tool-btn" id="comicRunBtn">Create Comic</button>' +
      '</div>' +
      '<div class="tool-status" id="comicStatus"></div>' +
    '</div>' +
    '<div class="comic-grid" id="comicGrid">' +
      '<div class="comic-panel"><span style="color:var(--muted);font-size:12px">Panel 1</span></div>' +
      '<div class="comic-panel"><span style="color:var(--muted);font-size:12px">Panel 2</span></div>' +
      '<div class="comic-panel"><span style="color:var(--muted);font-size:12px">Panel 3</span></div>' +
      '<div class="comic-panel"><span style="color:var(--muted);font-size:12px">Panel 4</span></div>' +
    '</div>' +
    '<div class="save-to-gallery-row">' +
      '<button class="save-gallery-btn" id="comicSaveGalleryBtn" disabled>' + ICONS.heart + ' Save All Panels to Gallery</button>' +
      '<div class="save-tile-slot" id="comicSaveSlot"></div>' +
    '</div>'
  );
  ap(col, comicPanel);

  // ===== Studio panel =====
  var studioPanel = el('div', { class:'tab-panel', id:'panel-studio', role:'tabpanel' });
  html(studioPanel,
    '<div class="studio-container">' +
      '<div class="studio-toolbar">' +
        '<div class="studio-toolbar-group" id="studioTbTools"></div>' +
        '<div class="studio-toolbar-group" id="studioTbActions"></div>' +
      '</div>' +
      '<div class="studio-body">' +
        '<div class="studio-canvas-area">' +
          '<div class="studio-canvas-wrap" id="studioCanvasWrap">' +
            '<div class="studio-upload-zone" id="studioDropZone"><span class="studio-upload-icon">' + ICONS.camera + '</span><span class="studio-upload-text">Click or drop an image here</span><input type="file" id="studioFileInput" accept="image/*" hidden></div>' +
            '<button class="studio-view-original" id="studioViewOrig">View Original</button>' +
          '</div>' +
          '<div class="studio-tool-bar" id="studioFloatingTools"></div>' +
        '</div>' +
        '<button class="studio-show-sidebar-btn" id="studioShowSidebarBtn" aria-label="Show sidebar" style="display:none">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>' +
        '</button>' +
        '<div class="studio-sidebar">' +
          '<div class="studio-sidebar-header">' +
            '<h3 class="studio-sidebar-title" id="studioSidebarTitle">Adjustments</h3>' +
          '</div>' +
          '<button class="studio-sidebar-close" id="studioSidebarClose" aria-label="Collapse sidebar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>' +
          '<div class="studio-sidebar-body" id="studioSidebarBody">' +
            // adjustments panel
            '<div class="studio-tool-panel" id="studioPanelAdjustments">' +
              '<div class="studio-control"><label>Hue <span id="studioHueVal">0</span></label><input type="range" id="studioHue" min="0" max="360" value="0"></div>' +
              '<div class="studio-control"><label>Blur <span id="studioBlurVal">0</span></label><input type="range" id="studioBlur" min="0" max="20" value="0" step="0.5"></div>' +
              '<div class="studio-control"><label>Brightness <span id="studioBrightVal">0</span></label><input type="range" id="studioBright" min="-100" max="100" value="0"></div>' +
              '<div class="studio-control"><label>Contrast <span id="studioContrastVal">0</span></label><input type="range" id="studioContrast" min="-100" max="100" value="0"></div>' +
              '<div class="studio-control"><label>Saturation <span id="studioSatVal">0</span></label><input type="range" id="studioSat" min="-100" max="100" value="0"></div>' +
              '<div class="studio-control"><label>Vignette <span id="studioVigVal">0</span></label><input type="range" id="studioVig" min="0" max="100" value="0"></div>' +
              '<button class="studio-sidebar-action" id="studioResetAdjBtn" style="margin-top:var(--space-2)">Reset Adjustments</button>' +
              '<div class="studio-filter-presets"><span class="studio-filter-label">Quick Filters</span><div class="studio-filter-row" id="studioFilterPresets"></div></div>' +
            '</div>' +
            // edit panel
            '<div class="studio-tool-panel" id="studioPanelEdit" style="display:none">' +
              '<div class="studio-control"><label>Edit Instruction</label><textarea class="studio-textarea" id="studioEditText" rows="3" placeholder="e.g. make the sky purple, add a hat, turn the car red..."></textarea></div>' +
              '<button class="studio-sidebar-action" id="studioEditRunBtn">Apply Edit</button>' +
              '<div class="studio-control"><label>Blend <span id="studioEditFeatherVal">12</span></label><input type="range" id="studioEditFeather" min="0" max="40" value="12"></div>' +
              '<label class="studio-checkbox-row"><input type="checkbox" id="studioEditShowRegion"> Show edit region</label>' +
              '<label class="studio-checkbox-row"><input type="checkbox" id="studioEditAllowFallback" checked> Allow full regen</label>' +
              '<div id="studioEditResult" style="display:none"><div class="studio-edit-reasoning" id="studioEditReasoning"></div><div class="studio-edit-detail" id="studioEditDetail"></div></div>' +
              '<div class="tool-status" id="studioEditStatus"></div>' +
            '</div>' +
            '<div class="studio-tool-panel" id="studioPanelResize" style="display:none"><div id="studioResizeBtns"></div></div>' +
            '<div class="studio-tool-panel" id="studioPanelBackground" style="display:none">' +
              '<div class="studio-control"><label>Replace with</label><select class="studio-select" id="studioBgMode"><option value="transparent">Transparent</option><option value="color">Solid Color</option><option value="gradient">Gradient</option></select></div>' +
              '<button class="studio-sidebar-action" id="studioBgRemoveBtn" disabled>Background Remover (coming soon)</button>' +
            '</div>' +
            '<div class="studio-tool-panel" id="studioPanelRetouch" style="display:none">' +
              '<div class="studio-control"><label>Brush Size</label><input type="range" id="studioBrushSize" min="1" max="100" value="20"></div>' +
              '<button class="studio-sidebar-action" disabled>Retouch (coming soon)</button>' +
            '</div>' +
            '<div class="studio-tool-panel" id="studioPanelVideo" style="display:none">' +
              '<p style="color:var(--muted);font-size:var(--text-sm);line-height:1.5">Generate a short animated video from the current image.</p>' +
              '<button class="studio-sidebar-action" disabled>Generate Video (coming soon)</button>' +
            '</div>' +
            '<div class="studio-sidebar-footer">' +
              '<button class="studio-sidebar-action" id="studioUseCurrentBtn">Use Main Image</button>' +
              '<button class="studio-sidebar-action" id="studioResetBtn">Reset All</button>' +
              '<button class="studio-sidebar-action" id="studioSendMainBtn">Send to Image Tab</button>' +
              '<button class="studio-save-gallery-btn" id="studioSaveGalleryBtn" disabled>' + ICONS.heart + ' Save to Gallery</button>' +
              '<div class="save-tile-slot" id="studioSaveSlot"></div>' +
              '<div class="tool-status" id="studioStatus"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
  ap(col, studioPanel);

  // ===== Gallery panel =====
  var galleryPanel = el('div', { class:'tab-panel', id:'panel-gallery', role:'tabpanel' });
  html(galleryPanel,
    '<div class="tool-card">' +
      '<h3>' + ICONS.folder + ' My Gallery</h3>' +
      '<p class="tool-desc">Public per-generator image gallery. Images saved with the ' + ICONS.heart + ' button on any generation appear here. Use the buttons to filter and sort.</p>' +
      '<div class="tool-row" style="margin-bottom:10px" id="gallerySortRow"></div>' +
    '</div>' +
    '<div class="gallery-embed" id="galleryEmbed"></div>'
  );
  ap(col, galleryPanel);

  return col;
}

// ===================================================================
// buildDom() — orchestrates all DOM creation
// ===================================================================

function buildDom() {
  var container = id('model-card-container');
  ap(container, buildSidebarToggle());
  ap(container, buildSidebar());
  ap(container, buildImageInputCol());
  ap(container, buildImageOutputCol());

  // ===== Lightbox =====
  html('lightboxOverlay', '<img id="lightboxImg" src="" alt="Full size image">');

  // ===== Data-driven builders =====
  buildNavItems();
  buildPromptChips();
  buildModelButtons();
  buildEditButtons();
  buildGallerySortBtns();
  buildStyleButtons();
  buildShapeButtons();
  buildStudioToolbar();
  buildStudioFloatingTools();
  buildStudioFilterPresets();
  buildStudioResizeBtns();
}

// ===== Init =====
buildDom();
