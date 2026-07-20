// === html-factory.js — lightweight DOM helpers ===
function id(s) { return document.getElementById(s); }
function qs(s, c) { return (c || document).querySelector(s); }
function qsa(s, c) { return (c || document).querySelectorAll(s); }
function el(tag, attrs) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === 'on') for (var ev in attrs[k]) e.addEventListener(ev, attrs[k][ev]);
    else if (k === 'children') (attrs[k].forEach || function(f){ for(var i=0;i<attrs[k].length;i++) f(attrs[k][i],i,attrs[k]); })(function(c) { e.appendChild(c); });
    else e.setAttribute(k, attrs[k]);
  }
  for (var i = 2; i < arguments.length; i++) {
    var c = arguments[i];
    if (c != null) e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(c) : c);
  }
  return e;
}
function show(e) { if (typeof e === 'string') e = id(e); if (e) e.style.display = ''; }
function hide(e) { if (typeof e === 'string') e = id(e); if (e) e.style.display = 'none'; }
function vis(e, b) { if (b) show(e); else hide(e); }
function ac(e, c) { if (typeof e === 'string') e = id(e); if (e) e.classList.add(c); }
function rc(e, c) { if (typeof e === 'string') e = id(e); if (e) e.classList.remove(c); }
function tc(e, c, f) { if (typeof e === 'string') e = id(e); if (e) e.classList.toggle(c, f); }
function on(e, ev, fn, o) { if (typeof e === 'string') e = id(e); if (e) e.addEventListener(ev, fn, o); }
function html(e, h) { if (typeof e === 'string') e = id(e); if (e) e.innerHTML = h; }
function text(e, t) { if (typeof e === 'string') e = id(e); if (e) e.textContent = t; }
function ap(p, c) { if (typeof p === 'string') p = id(p); p.appendChild(c); }
function dl(url, name) { var a = document.createElement('a'); a.href = url; a.download = name || ''; document.body.appendChild(a); a.click(); a.remove(); }
function at(e, k, v) { if (typeof e === 'string') e = id(e); if (e) if (v !== undefined) e.setAttribute(k, v); else return e.getAttribute(k); }
function da(e, k, v) { if (typeof e === 'string') e = id(e); if (e) if (v !== undefined) e.dataset[k] = v; else return e.dataset[k]; }
function clear(e) { if (typeof e === 'string') e = id(e); if (e) e.innerHTML = ''; }
