(function (w, d) {
  'use strict';
  var root = d.documentElement;
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  (function boot() {
    var t = ls('bm-theme') || ls('bm_theme') || 'dark';
    var light = t === 'light';
    root.classList.toggle('theme-light', light);
    root.setAttribute('data-theme', light ? 'light' : 'dark');
    var m = ls('bm_mo') || 'on';
    if (m === 'auto') root.removeAttribute('data-mo'); else root.setAttribute('data-mo', m);
    if (ls('bm-font-bold') === 'on') root.classList.add('bold-mode');
    var f = ls('bm-font');
    if (f && f !== 'default') root.style.setProperty('--u-font', 'var(--bm-font)');
    var meta = d.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', light ? '#f4f4f2' : '#0e0e0e');
  })();

  var fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  function rp(n, o) {
    n = Number(n) || 0;
    var s = fmt.format(Math.abs(Math.round(n)));
    return (n < 0 ? '-' : (o && o.plus && n > 0 ? '+' : '')) + 'Rp' + (o && o.space ? ' ' : '') + s;
  }
  function num(v) {
    if (typeof v === 'number') return v;
    var s = String(v == null ? '' : v).replace(/[^\d-]/g, '');
    return s ? parseInt(s, 10) || 0 : 0;
  }
  function short(n) {
    n = Number(n) || 0;
    var a = Math.abs(n), sg = n < 0 ? '-' : '';
    if (a >= 1e9) return sg + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace('.', ',').replace(',0', '') + ' M';
    if (a >= 1e6) return sg + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',').replace(',0', '') + ' jt';
    if (a >= 1e3) return sg + Math.round(a / 1e3) + ' rb';
    return sg + a;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reduce() {
    var m = root.getAttribute('data-mo');
    if (m === 'off') return true;
    if (m === 'on') return false;
    return w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function vib(ms) { try { if (navigator.vibrate && !reduce()) navigator.vibrate(ms || 8); } catch (e) {} }

  var stack = [];
  var skip = 0, pend = 0, pendT = 0;
  function pushLayer(close) {
    var id = 'u' + Date.now() + Math.random().toString(36).slice(2, 6);
    stack.push({ id: id, close: close });
    try { history.pushState({ uLayer: id }, ''); } catch (e) {}
    return id;
  }
  function dropLayer(id) {
    var i = -1;
    for (var k = 0; k < stack.length; k++) if (stack[k].id === id) i = k;
    if (i < 0) return;
    stack.splice(i, 1);
    pend++;
    if (!pendT) pendT = setTimeout(function () {
      var n = pend; pend = 0; pendT = 0;
      if (n) { skip++; try { history.go(-n); } catch (e) { skip--; } }
    }, 0);
  }
  w.addEventListener('popstate', function () {
    if (skip) { skip--; return; }
    if (!stack.length) return;
    var top = stack.pop();
    top.close(true);
  });

  function scrim(onTap) {
    var s = d.createElement('div');
    s.className = 'u-scrim';
    s.addEventListener('click', onTap);
    d.body.appendChild(s);
    requestAnimationFrame(function () { s.classList.add('on'); });
    return s;
  }
  function lockScroll(on) {
    var b = d.body;
    var n = Number(b.getAttribute('data-u-lock') || 0) + (on ? 1 : -1);
    if (n < 0) n = 0;
    b.setAttribute('data-u-lock', n);
    b.classList.toggle('u-lock', n > 0);
  }

  function sheet(el, opt) {
    opt = opt || {};
    if (typeof el === 'string') el = d.getElementById(el);
    var api = { el: el, isOpen: false };
    var sc, layer, lastFocus;
    function open() {
      if (api.isOpen) return api;
      api.isOpen = true;
      lastFocus = d.activeElement;
      sc = scrim(function () { close(); });
      el.style.setProperty('--u-dy', '0px');
      el.hidden = false;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      lockScroll(true);
      requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('on'); }); });
      layer = pushLayer(function () { close(true); });
      var f = el.querySelector('[autofocus]');
      if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 320);
      if (opt.onOpen) opt.onOpen(api);
      return api;
    }
    function close(fromBack) {
      if (!api.isOpen) return api;
      api.isOpen = false;
      el.classList.remove('on', 'u-drag');
      el.style.setProperty('--u-dy', '0px');
      if (sc) { var s = sc; s.classList.remove('on'); setTimeout(function () { s.remove(); }, 260); sc = null; }
      lockScroll(false);
      setTimeout(function () { if (!api.isOpen) el.hidden = true; }, 360);
      if (layer) { var id = layer; layer = null; dropLayer(id); }
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
      if (opt.onClose) opt.onClose(api, !!fromBack);
      return api;
    }
    api.open = open;
    api.close = function () { return close(false); };
    el.hidden = true;
    el.addEventListener('click', function (e) { if (e.target.closest('[data-u-close]')) close(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var dragZone = el.querySelectorAll('.u-hdl,.u-shh');
    var sy = 0, dy = 0, st = 0, dragging = false, pid = null;
    function down(e) {
      if (e.target.closest('button,input,select,textarea,a')) return;
      dragging = true; pid = e.pointerId; sy = e.clientY; dy = 0; st = performance.now();
      el.classList.add('u-drag');
      try { e.currentTarget.setPointerCapture(pid); } catch (x) {}
    }
    function move(e) {
      if (!dragging || e.pointerId !== pid) return;
      dy = Math.max(0, e.clientY - sy);
      if (e.clientY < sy) dy = -Math.min(20, Math.sqrt(sy - e.clientY) * 2);
      el.style.setProperty('--u-dy', dy + 'px');
    }
    function up(e) {
      if (!dragging || e.pointerId !== pid) return;
      dragging = false;
      el.classList.remove('u-drag');
      var v = dy / Math.max(1, performance.now() - st);
      if (dy > el.offsetHeight * 0.28 || (v > 0.5 && dy > 30)) close();
      else el.style.setProperty('--u-dy', '0px');
    }
    for (var i = 0; i < dragZone.length; i++) {
      dragZone[i].addEventListener('pointerdown', down);
      dragZone[i].addEventListener('pointermove', move);
      dragZone[i].addEventListener('pointerup', up);
      dragZone[i].addEventListener('pointercancel', up);
    }
    return api;
  }

  function confirmBox(o) {
    o = o || {};
    return new Promise(function (res) {
      var box = d.createElement('div');
      box.className = 'u-dlg';
      box.setAttribute('role', 'alertdialog');
      box.setAttribute('aria-modal', 'true');
      box.innerHTML = '<h3>' + esc(o.title || 'Yakin?') + '</h3>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '') +
        '<div class="u-da"><button type="button" class="u-bt u-sec" data-r="0">' + esc(o.cancel || 'Batal') + '</button>' +
        '<button type="button" class="u-bt ' + (o.danger ? 'u-dgf' : '') + '" data-r="1">' + esc(o.ok || 'Ya') + '</button></div>';
      var done = false, layer;
      function fin(v, fromBack) {
        if (done) return; done = true;
        box.classList.remove('on'); sc.classList.remove('on');
        setTimeout(function () { box.remove(); sc.remove(); }, 260);
        lockScroll(false);
        if (!fromBack) dropLayer(layer);
        res(v);
      }
      var sc = scrim(function () { fin(false); });
      sc.style.zIndex = 62;
      d.body.appendChild(box);
      lockScroll(true);
      layer = pushLayer(function () { fin(false, true); });
      box.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (b) fin(b.getAttribute('data-r') === '1'); });
      requestAnimationFrame(function () { box.classList.add('on'); var f = box.querySelector('[data-r="1"]'); if (f) f.focus({ preventScroll: true }); });
    });
  }

  var tWrap;
  var ICON = {
    ok: '<svg class="u-ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    er: '<svg class="u-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>',
    in: '<svg class="u-ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>'
  };
  function toast(msg, o) {
    o = o || {};
    if (!tWrap) {
      tWrap = d.createElement('div');
      tWrap.className = 'u-toasts';
      tWrap.setAttribute('role', 'status');
      tWrap.setAttribute('aria-live', 'polite');
      d.body.appendChild(tWrap);
    }
    while (tWrap.children.length > 2) tWrap.firstChild.remove();
    var t = d.createElement('div');
    var type = o.type || 'in';
    t.className = 'u-toast u-' + type + 't';
    t.innerHTML = (ICON[type] || '') + '<span>' + esc(msg) + '</span>' + (o.action ? '<button type="button">' + esc(o.action) + '</button>' : '');
    tWrap.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('on'); }); });
    var timer, gone = false;
    function hide() {
      if (gone) return; gone = true; clearTimeout(timer);
      t.classList.remove('on');
      setTimeout(function () { t.remove(); }, 300);
    }
    function arm() { clearTimeout(timer); timer = setTimeout(hide, o.ms || (o.action ? 5000 : 2600)); }
    arm();
    var b = t.querySelector('button');
    if (b) b.addEventListener('click', function () { hide(); if (o.onAction) o.onAction(); });
    var sx = 0, dx = 0, pid = null;
    t.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; pid = e.pointerId; sx = e.clientX; dx = 0; t.classList.add('u-drag'); clearTimeout(timer); try { t.setPointerCapture(pid); } catch (x) {} });
    t.addEventListener('pointermove', function (e) { if (e.pointerId !== pid) return; dx = e.clientX - sx; t.style.setProperty('--u-dx', dx + 'px'); t.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 220)); });
    function end(e) {
      if (e.pointerId !== pid) return; pid = null; t.classList.remove('u-drag');
      if (Math.abs(dx) > 80) { t.style.setProperty('--u-dx', (dx > 0 ? 400 : -400) + 'px'); t.style.opacity = '0'; gone = true; setTimeout(function () { t.remove(); }, 250); }
      else { t.style.setProperty('--u-dx', '0px'); t.style.opacity = ''; arm(); }
    }
    t.addEventListener('pointerup', end);
    t.addEventListener('pointercancel', end);
    if (type === 'er') vib(20);
    return { hide: hide };
  }

  function seg(el, onChange) {
    if (typeof el === 'string') el = d.getElementById(el);
    var ind = el.querySelector('.u-segi');
    if (!ind) { ind = d.createElement('i'); ind.className = 'u-segi'; el.insertBefore(ind, el.firstChild); }
    var btns = [].slice.call(el.querySelectorAll('button'));
    el.setAttribute('role', 'radiogroup');
    function place(animate) {
      var on = el.querySelector('button.on') || null;
      if (!on) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1';
      if (!animate) ind.style.transition = 'none';
      ind.style.width = on.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + (on.offsetLeft - 3) + 'px)';
      if (!animate) { ind.offsetWidth; ind.style.transition = ''; }
    }
    function set(v, silent) {
      btns.forEach(function (b) { var on = b.getAttribute('data-v') === String(v); b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      place(true);
      if (!silent && onChange) onChange(v);
    }
    btns.forEach(function (b) { b.setAttribute('role', 'radio'); b.type = 'button'; b.addEventListener('click', function () { if (!b.classList.contains('on')) { vib(6); set(b.getAttribute('data-v')); } }); });
    place(false);
    if (w.ResizeObserver) new ResizeObserver(function () { place(false); }).observe(el);
    return { set: set, get: function () { var b = el.querySelector('button.on'); return b ? b.getAttribute('data-v') : null; } };
  }

  function nav(el, onPick) {
    if (typeof el === 'string') el = d.getElementById(el);
    var items = [].slice.call(el.querySelectorAll('a,button'));
    var n = items.length;
    el.style.setProperty('--u-n', n);
    var pill = el.querySelector(':scope>i');
    function idxOn() { for (var i = 0; i < n; i++) if (items[i].classList.contains('on')) return i; return 0; }
    function setI(i) { el.style.setProperty('--u-i', i); }
    setI(idxOn());
    var pid = null, sx = 0, moved = false, startI = 0, rect = null, cur = 0;
    function idxAt(x) { var r = rect || el.getBoundingClientRect(); var inner = r.width - 12; var i = Math.floor((x - r.left - 6) / (inner / n)); return Math.max(0, Math.min(n - 1, i)); }
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      pid = e.pointerId; sx = e.clientX; moved = false; rect = el.getBoundingClientRect(); startI = idxOn(); cur = idxAt(e.clientX);
      try { el.setPointerCapture(pid); } catch (x) {}
    });
    el.addEventListener('pointermove', function (e) {
      if (e.pointerId !== pid) return;
      if (!moved && Math.abs(e.clientX - sx) < 8) return;
      moved = true;
      el.classList.add('u-drag');
      var inner = rect.width - 12, cw = inner / n;
      var p = Math.max(0, Math.min(n - 1, (e.clientX - rect.left - 6 - cw / 2) / cw));
      el.style.setProperty('--u-i', p.toFixed(3));
      var ni = Math.round(p);
      if (ni !== cur) { cur = ni; vib(5); }
    });
    var supp = false, suppT;
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      el.classList.remove('u-drag');
      var i = e.type === 'pointercancel' ? startI : idxAt(e.clientX);
      setI(i);
      if (e.type === 'pointercancel') return;
      supp = true; clearTimeout(suppT); suppT = setTimeout(function () { supp = false; }, 500);
      if (i !== startI) go(i);
    }
    function go(i) {
      items.forEach(function (b, k) { b.classList.toggle('on', k === i); if (k === i) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      setI(i);
      vib(6);
      if (onPick) onPick(i, items[i]);
      else if (items[i].tagName === 'A' && items[i].getAttribute('href')) location.href = items[i].href;
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('click', function (e) {
      if (supp) { e.preventDefault(); supp = false; return; }
      var b = e.target.closest('a,button');
      if (!b) return;
      e.preventDefault();
      go(items.indexOf(b));
    });
    return { set: function (i) { go(i); } };
  }

  function hero(el, dots, onChange) {
    if (typeof el === 'string') el = d.getElementById(el);
    if (typeof dots === 'string') dots = d.getElementById(dots);
    var cards = [].slice.call(el.children);
    if (dots) {
      dots.innerHTML = cards.map(function (c, i) { return '<button type="button" aria-label="Kartu ' + (i + 1) + '"></button>'; }).join('');
      dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var i = [].indexOf.call(dots.children, b); show(i); });
    }
    var cur = -1;
    function mark(i) {
      if (i === cur) return; cur = i;
      if (dots) [].forEach.call(dots.children, function (b, k) { b.classList.toggle('on', k === i); });
      if (onChange) onChange(i);
    }
    function show(i) { var c = cards[i]; if (!c) return; el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: reduce() ? 'auto' : 'smooth' }); }
    var raf = 0;
    el.addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var mid = el.scrollLeft + el.clientWidth / 2, best = 0, bd = 1e9;
        cards.forEach(function (c, i) { var m = c.offsetLeft + c.offsetWidth / 2; var dd = Math.abs(m - mid); if (dd < bd) { bd = dd; best = i; } });
        mark(best);
      });
    }, { passive: true });
    mark(0);
    return { show: show, get: function () { return cur; } };
  }

  function spark(svg, vals) {
    if (typeof svg === 'string') svg = d.getElementById(svg);
    vals = (vals || []).map(Number);
    if (vals.length < 2) { svg.innerHTML = ''; return; }
    var W = 100, H = 40, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rg = mx - mn || 1;
    var pts = vals.map(function (v, i) { return [(i / (vals.length - 1)) * W, H - 3 - ((v - mn) / rg) * (H - 6)]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join('');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = '<path class="u-ar" d="' + line + 'L' + W + ' ' + H + 'L0 ' + H + 'Z"/><path d="' + line + '"/>';
  }

  function moneyInput(inp, onVal) {
    if (typeof inp === 'string') inp = d.getElementById(inp);
    inp.setAttribute('inputmode', 'numeric');
    inp.setAttribute('autocomplete', 'off');
    function fmtNow(quiet) {
      var v = num(inp.value);
      var t = inp.value.trim() === '' ? '' : fmt.format(v);
      if (t !== inp.value) {
        var end = inp.value.length - (inp.selectionEnd == null ? inp.value.length : inp.selectionEnd);
        inp.value = t;
        try { var p = Math.max(0, t.length - end); inp.setSelectionRange(p, p); } catch (e) {}
      }
      if (!quiet && onVal) onVal(v);
    }
    inp.addEventListener('input', function () { fmtNow(false); });
    fmtNow(true);
    return { get: function () { return num(inp.value); }, set: function (v) { inp.value = v === '' || v == null ? '' : fmt.format(num(v)); if (onVal) onVal(num(v)); } };
  }

  function stepper(el, onVal) {
    if (typeof el === 'string') el = d.getElementById(el);
    var inp = el.querySelector('input');
    var min = Number(el.getAttribute('data-min') || 0), max = Number(el.getAttribute('data-max') || 9999);
    var bs = el.querySelectorAll('button');
    function val() { return Math.max(min, Math.min(max, parseInt(inp.value, 10) || 0)); }
    function set(v, quiet) { v = Math.max(min, Math.min(max, v)); inp.value = v; bs[0].disabled = v <= min; bs[1].disabled = v >= max; if (!quiet && onVal) onVal(v); }
    var hold, rep;
    function startHold(dir) { stopHold(); set(val() + dir); vib(5); hold = setTimeout(function () { rep = setInterval(function () { set(val() + dir); }, 80); }, 420); }
    function stopHold() { clearTimeout(hold); clearInterval(rep); }
    [[bs[0], -1], [bs[1], 1]].forEach(function (p) {
      p[0].type = 'button';
      p[0].addEventListener('pointerdown', function (e) { e.preventDefault(); startHold(p[1]); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { p[0].addEventListener(ev, stopHold); });
      p[0].addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(val() + p[1]); } });
    });
    inp.setAttribute('inputmode', 'numeric');
    inp.addEventListener('input', function () { inp.value = inp.value.replace(/\D/g, ''); if (onVal) onVal(val()); });
    inp.addEventListener('blur', function () { set(val()); });
    set(val(), true);
    return { get: val, set: set };
  }

  function grow(ta) {
    function fit() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 2 + 'px'; }
    ta.addEventListener('input', fit);
    if (ta.hasAttribute('data-oneline')) {
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var f = [].slice.call(d.querySelectorAll('input:not([type=hidden]):not([disabled]),textarea:not([disabled]),select:not([disabled])')).filter(function (x) { return x.offsetParent; });
          var i = f.indexOf(ta); if (i > -1 && f[i + 1]) f[i + 1].focus();
        }
      });
      ta.addEventListener('input', function () { if (/\n/.test(ta.value)) { var p = ta.selectionStart; ta.value = ta.value.replace(/\s*\n\s*/g, ' '); ta.selectionStart = ta.selectionEnd = p; fit(); } });
    }
    fit();
    return fit;
  }

  function search(wrap, onQ) {
    if (typeof wrap === 'string') wrap = d.getElementById(wrap);
    var inp = wrap.querySelector('input'), x = wrap.querySelector('.u-x');
    var t;
    function upd() { wrap.classList.toggle('u-has', !!inp.value); clearTimeout(t); t = setTimeout(function () { if (onQ) onQ(inp.value.trim()); }, 120); }
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') inp.blur(); });
    if (x) x.addEventListener('click', function () { inp.value = ''; upd(); inp.focus(); });
    upd();
    return { set: function (v) { inp.value = v; upd(); } };
  }

  function topbar(el) {
    if (typeof el === 'string') el = d.getElementById(el);
    function f() { el.classList.toggle('u-sc', (w.scrollY || root.scrollTop) > 4); }
    w.addEventListener('scroll', f, { passive: true });
    f();
  }

  function ptr(fn) {
    var ind = d.createElement('div');
    ind.className = 'u-ptr';
    ind.innerHTML = '<svg class="u-ic" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>';
    d.body.appendChild(ind);
    var sy = null, py = 0, busy = false, pid = null;
    d.addEventListener('touchstart', function (e) {
      if (busy || (w.scrollY || root.scrollTop) > 0 || stack.length || e.touches.length > 1) { sy = null; return; }
      if (e.target.closest('.u-nav,.u-sheet,.u-hero,.u-tbw,input,textarea,select')) { sy = null; return; }
      sy = e.touches[0].clientY; py = 0;
    }, { passive: true });
    d.addEventListener('touchmove', function (e) {
      if (sy == null) return;
      var dy = e.touches[0].clientY - sy;
      if (dy <= 0) { ind.classList.remove('on'); py = 0; return; }
      py = Math.min(110, dy * 0.5);
      ind.classList.add('on');
      ind.style.setProperty('--u-py', py + 'px');
    }, { passive: true });
    d.addEventListener('touchend', function () {
      if (sy == null) return; sy = null;
      if (py >= 70) {
        busy = true; vib(10);
        ind.classList.add('u-run');
        Promise.resolve().then(fn).catch(function () {}).then(function () {
          setTimeout(function () { ind.classList.remove('u-run', 'on'); ind.style.setProperty('--u-py', '0px'); busy = false; }, 250);
        });
      } else { ind.classList.remove('on'); ind.style.setProperty('--u-py', '0px'); }
      py = 0;
    }, { passive: true });
  }

  function stagger(container) {
    if (typeof container === 'string') container = d.getElementById(container);
    if (reduce()) return;
    [].forEach.call(container.children, function (c, i) { c.style.setProperty('--u-k', Math.min(i, 12)); c.classList.remove('u-in-up'); void c.offsetWidth; c.classList.add('u-in-up'); });
  }

  w.BMUI = {
    rp: rp, num: num, short: short, esc: esc, reduce: reduce, vib: vib,
    sheet: sheet, confirm: confirmBox, toast: toast, seg: seg, nav: nav, hero: hero, spark: spark,
    money: moneyInput, stepper: stepper, grow: grow, search: search, topbar: topbar, ptr: ptr, stagger: stagger,
    layer: { push: pushLayer, drop: dropLayer, count: function () { return stack.length; } }
  };
})(window, document);
