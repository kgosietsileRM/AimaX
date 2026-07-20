// ===== Style helpers =====
function selectStyle(styleId) {
  state.style = styleId;
  qsa('.style-option').forEach(opt => {
    tc(opt, 'selected', opt.dataset.style === styleId);
  });
  updateStyleDropdownTrigger();
}

function updateStyleDropdownTrigger() {
  const s = STYLES.find(x => x.id === state.style) || STYLES[0];
  var swatch = id('selectedSwatch');
  swatch.style.background = s.gradient;
  html(swatch, s.svg);
  text('selectedLabel', s.name);
}

// Wire style option clicks
qsa('.style-option').forEach(opt => {
  on(opt, 'click', () => {
    selectStyle(opt.dataset.style);
    rc('styleDropdown', 'open');
  });
});
updateStyleDropdownTrigger();

// Style dropdown open/close
on('styleDropdownTrigger', 'click', (e) => {
  e.stopPropagation();
  const dd = id('styleDropdown');
  tc(dd, 'open');
  at('styleDropdownTrigger', 'aria-expanded', dd.classList.contains('open'));
});
on(document, 'click', (e) => {
  const dd = id('styleDropdown');
  if (dd && !dd.contains(e.target)) {
    rc(dd, 'open');
    at('styleDropdownTrigger', 'aria-expanded', 'false');
  }
});

// ===== Shape helpers =====
function selectShape(n) {
  state.shape = n;
  qsa('.imageShapeButton').forEach(btn => {
    tc(btn, 'selected', parseInt(btn.dataset.shape) === n);
  });
}

// Wire shape button clicks
qsa('.imageShapeButton').forEach(btn => {
  on(btn, 'click', () => selectShape(parseInt(btn.dataset.shape)));
});
