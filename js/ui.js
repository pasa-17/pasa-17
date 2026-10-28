/* Helper tampilan: escape, format, ikon, ilustrasi hutan, toast, modal, tema. */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};

  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // ---------- Teks aman ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function safeUrl(u) {
    try {
      if (!u || !String(u).trim()) return '';
      var x = new URL(String(u).trim(), location.href);
      return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '';
    } catch (e) { return ''; }
  }
  function rupiah(n) {
    var v = Math.round(Number(n) || 0);
    return 'Rp' + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // ---------- Tanggal (zona WIB) ----------
  function parseIso(s) { var p = String(s || '').split('-').map(Number); return { y: p[0], m: p[1], d: p[2] }; }
  function fmtDate(s) { if (!s) return ''; var p = parseIso(s); return p.d + ' ' + BULAN[p.m - 1] + ' ' + p.y; }
  function fmtRange(a, b) {
    if (!a) return '';
    if (!b || a === b) return fmtDate(a);
    var x = parseIso(a), y = parseIso(b);
    if (x.y === y.y && x.m === y.m) return x.d + '–' + y.d + ' ' + BULAN[x.m - 1] + ' ' + x.y;
    return fmtDate(a) + ' – ' + fmtDate(b);
  }
  function todayWib() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); }
  function utcDay(s) { var p = parseIso(s); return Date.UTC(p.y, p.m - 1, p.d); }
  function countdown(p) {
    var today = todayWib(), start = p.tanggal_mulai, end = p.tanggal_selesai || start;
    if (!start) return null;
    if (today < start) {
      var n = Math.round((utcDay(start) - utcDay(today)) / 86400000);
      return { status: 'menuju', hari: n, label: 'H-' + n + ' menuju ' + (p.nama_singkat || 'acara') };
    }
    if (today === start) return { status: 'harih', hari: 0, label: 'Hari-H' };
    if (today <= end) return { status: 'berlangsung', hari: 0, label: 'Sedang berlangsung' };
    return { status: 'selesai', hari: 0, label: 'Acara selesai' };
  }

  // ---------- Ikon (sprite SVG, gaya garis) ----------
  var ICONS = {
    tent: '<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    bank: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
    idcard: '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
  };

  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  }

  // ---------- Ilustrasi hutan pinus (cadangan bila foto belum ada) ----------
  function pines(seed, y, h, fill, op) {
    var out = '', x = -20, n = 0;
    while (x < 430) {
      var w = h * 0.58 + ((seed * 7 + n * 13) % 14), hh = h + ((seed * 5 + n * 11) % 18);
      out += '<use href="#pine" x="' + x + '" y="' + (y - hh) + '" width="' + w + '" height="' + hh + '" fill="' + fill + '" opacity="' + op + '"/>';
      x += w * 0.62 + ((seed + n * 3) % 9); n++;
    }
    return out;
  }
  function art(kind) {
    var day = kind === 'day', fire = kind !== 'day';
    var sky = day ? 'url(#g-day)' : 'url(#g-dusk)';
    var far = day ? '#86A887' : '#16293B', mid = day ? '#5B8460' : '#0F2230', near = day ? '#2F5436' : '#08141D';
    var stars = '';
    if (!day) for (var i = 0; i < 18; i++) stars += '<circle cx="' + ((i * 53) % 400) + '" cy="' + (8 + (i * 37) % 120) + '" r="' + (i % 3 ? 0.9 : 1.4) + '" fill="#fff" opacity="' + (0.35 + (i % 4) * 0.15) + '"/>';
    return '<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<rect width="400" height="300" fill="' + sky + '"/>' + stars +
      (day ? '<circle cx="310" cy="64" r="30" fill="#FFF3D1"/>' : '<circle cx="312" cy="66" r="22" fill="#FFE9C7" opacity=".92"/><circle cx="322" cy="60" r="20" fill="#14283A"/>') +
      pines(1, 232, 96, far, 1) + pines(4, 258, 80, mid, 1) +
      (fire ? '<circle cx="262" cy="268" r="60" fill="url(#g-glow)"/>' : '') +
      '<path d="M146 270 L190 205 L234 270Z" fill="' + (day ? '#E85D04' : '#C94E04') + '"/><path d="M190 205 L190 270 L168 270Z" fill="rgba(0,0,0,.18)"/>' +
      (fire ? '<path d="M258 270c-9-6-9-16-2-24 2 6 6 8 8 7-1-8 3-14 7-18 2 12 12 14 8 28z" fill="#FFB347"/><path d="M262 270c-5-3-5-8-1-12 1 3 3 4 4 3 0 5 3 7 4 9z" fill="#FFE08A"/>' : '') +
      pines(7, 304, 78, near, 1) + '</svg>';
  }

  // Gambar dari URL admin; bila gagal dimuat diganti ilustrasi.
  function img(url, alt, cls, kind) {
    var u = safeUrl(url);
    if (!u) return '<span class="' + esc(cls || '') + ' img-fallback" role="img" aria-label="' + esc(alt || '') + '">' + art(kind || 'night') + '</span>';
    return '<img class="' + esc(cls || '') + '" src="' + esc(u) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-fb="' + esc(kind || 'night') + '">';
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.getAttribute('data-fb') !== null && !t.__fb) {
      t.__fb = true;
      var s = document.createElement('span');
      s.className = (t.className || '') + ' img-fallback'; s.setAttribute('role', 'img'); s.setAttribute('aria-label', t.alt || '');
      s.innerHTML = art(t.getAttribute('data-fb') || 'night');
      t.replaceWith(s);
    }
  }, true);

  function installSprite() {
    var sym = '';
    Object.keys(ICONS).forEach(function (k) { sym += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; });
    var html = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + sym +
      '<symbol id="pine" viewBox="0 0 40 70"><path d="M20 0 32 22h-6l10 18h-8l12 22H23v8h-6v-8H0l12-22H4l10-18H8z"/></symbol>' +
      '<linearGradient id="g-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070E18"/><stop offset=".55" stop-color="#1E3048"/><stop offset="1" stop-color="#B4501A"/></linearGradient>' +
      '<linearGradient id="g-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFD9C6"/><stop offset="1" stop-color="#F6F0DC"/></linearGradient>' +
      '<radialGradient id="g-glow"><stop offset="0" stop-color="#FF9A3C" stop-opacity=".75"/><stop offset="1" stop-color="#FF9A3C" stop-opacity="0"/></radialGradient>' +
      '</defs></svg>';
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // ---------- Toast ----------
  function toast(msg, type) {
    var box = document.getElementById('toast'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.setAttribute('role', type === 'err' ? 'alert' : 'status');
    el.innerHTML = (type === 'ok' ? icon('check') : type === 'err' ? icon('alert') : icon('info')) + '<span>' + esc(msg) + '</span>';
    box.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 320); }, type === 'err' ? 5200 : 2800);
  }

  function copyText(text, okMsg) {
    function done() { toast(okMsg || 'Tersalin', 'ok'); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-100px;opacity:0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? done() : toast('Gagal menyalin. Salin manual.', 'err'); } catch (e) { toast('Gagal menyalin. Salin manual.', 'err'); }
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  // ---------- Modal ----------
  var modalStack = [];
  function openModal(o) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    var id = 'm' + Math.random().toString(36).slice(2, 7);
    bg.innerHTML = '<div class="modal ' + (o.cls || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '"><div class="modal-head"><h2 id="' + id + '"' + (o.hideTitle ? ' class="sr-only"' : '') + '>' + esc(o.title || '') + '</h2>' +
      '<button class="icon-btn" data-close aria-label="Tutup">' + icon('x') + '</button></div><div class="modal-body">' + (o.html || '') + '</div></div>';
    var prev = document.activeElement;
    function close() {
      document.removeEventListener('keydown', onKey); bg.remove(); document.body.style.overflow = modalStack.length > 1 ? 'hidden' : '';
      modalStack.pop(); if (o.onClose) o.onClose(); if (prev && prev.focus) prev.focus();
    }
    function onKey(e) { if (e.key === 'Escape' && modalStack[modalStack.length - 1] === close) close(); if (o.onKey) o.onKey(e); }
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg); document.body.style.overflow = 'hidden'; modalStack.push(close);
    var f = bg.querySelector('[data-close]'); if (f) f.focus();
    return { el: bg, body: bg.querySelector('.modal-body'), close: close };
  }

  // ---------- Layar sibuk ----------
  var busyEl = null;
  function showBusy(title, text) {
    hideBusy();
    busyEl = document.createElement('div'); busyEl.className = 'busy'; busyEl.setAttribute('role', 'alertdialog'); busyEl.setAttribute('aria-live', 'assertive');
    busyEl.innerHTML = '<div class="box"><div class="spin" aria-hidden="true"></div><b>' + esc(title) + '</b><p>' + esc(text || '') + '</p></div>';
    document.body.appendChild(busyEl); document.body.style.overflow = 'hidden';
  }
  function hideBusy() { if (busyEl) { busyEl.remove(); busyEl = null; document.body.style.overflow = ''; } }

  // ---------- Tema ----------
  function themeNow() { return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('pasa17.theme', t); } catch (e) { /* abaikan */ }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#070E18' : '#F8F7F2');
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      b.setAttribute('aria-label', t === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
      b.innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
    });
  }

  function initials(name) {
    var p = String(name || '').trim().split(/\s+/).filter(Boolean);
    return ((p[0] || '?').charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }

  // Ikon tab browser mengikuti logo yang diunggah di Pengaturan (dicache agar tab admin & kunjungan berikutnya langsung sama).
  var LOGO_KEY = 'pasa_logo';
  function setFavicon(url) {
    var u = url ? safeUrl(url) : '';
    try { if (url) localStorage.setItem(LOGO_KEY, u || ''); else u = localStorage.getItem(LOGO_KEY) || ''; } catch (e) { /* abaikan */ }
    if (!u) return;
    ['icon', 'apple-touch-icon'].forEach(function (rel) {
      var l = document.querySelector('link[rel="' + rel + '"]');
      if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); }
      l.removeAttribute('type'); l.removeAttribute('sizes'); l.href = u;
    });
  }

  P.ui = {
    setFavicon: setFavicon,
    ukuranNama: function (u) { return (u.untuk === 'L' ? 'Ikhwan ' : u.untuk === 'P' ? 'Akhwat ' : '') + u.label; },
    esc: esc, safeUrl: safeUrl, rupiah: rupiah, fmtDate: fmtDate, fmtRange: fmtRange, todayWib: todayWib, countdown: countdown,
    addIcons: function (o) { Object.keys(o).forEach(function (k) { ICONS[k] = o[k]; }); }, icon: icon, art: art, img: img, installSprite: installSprite, toast: toast, copyText: copyText, openModal: openModal,
    showBusy: showBusy, hideBusy: hideBusy, themeNow: themeNow, setTheme: setTheme, initials: initials
  };
})();
