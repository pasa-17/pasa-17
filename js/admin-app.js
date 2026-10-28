/* Portal admin — layar masuk, kerangka, router. */
(function () {
  'use strict';
  var P = window.PASA, U = P.ui, A = P.api, M = P.adm, h = M.h;
  var app = document.getElementById('app');
  var NAV = [['#/', 'Ringkasan Kuota', 'dashboard', 'dashboard'], ['#/bayar', 'Verifikasi Bayar', 'verify', 'bayar'], ['#/peserta', 'Data Peserta', 'list', 'peserta'],
    ['#/scan', 'Scan QR / Masuk', 'qr', 'scan'], ['#/wa', 'WhatsApp & Notifikasi', 'chat', 'wa'], ['#/crm', 'CRM Kontak', 'contacts', 'crm'], ['#/konten', 'Konten Situs', 'layers', 'konten'], ['#/pengaturan', 'Pengaturan', 'settings', 'pengaturan'], ['#/akun', 'Akun & Sistem', 'users', 'akun']];
  var ROUTES = { '': 'dashboard', '/': 'dashboard', '/bayar': 'bayar', '/peserta': 'peserta', '/scan': 'scan', '/wa': 'wa', '/crm': 'crm', '/konten': 'konten', '/pengaturan': 'pengaturan', '/akun': 'akun' };
  var cleanup = null, mainEl = null;

  U.installSprite();
  U.setFavicon();

  // ---------- layar masuk ----------
  function showLogin(msg) {
    if (cleanup) { try { cleanup(); } catch (e) { /* abaikan */ } cleanup = null; }
    app.innerHTML = '<div class="login-wrap"><div class="card login"><span class="brand-mark big">' + U.icon('tent') + '</span><h1>Portal Admin PASA 17</h1><p class="muted">Masuk dengan akun panitia.</p>' +
      (A.configured() ? '' : '<div class="alert alert-err" role="alert">' + U.icon('alert') + '<span>Alamat server (GAS_URL) belum diisi di <code>js/config.js</code>.</span></div>') +
      '<div id="lmsg">' + (msg ? '<div class="alert alert-warn" role="alert">' + U.icon('info') + '<span>' + h(msg) + '</span></div>' : '') + '</div>' +
      '<form id="lf" novalidate>' + M.fieldHtml('lu', 'Username', { autocomplete: 'username' }) +
      '<div class="field"><label class="lbl" for="lp">Password</label><div class="pw"><input class="input" id="lp" type="password" autocomplete="current-password"><button type="button" class="icon-btn" id="lsee" aria-label="Tampilkan password">' + U.icon('eye') + '</button></div></div>' +
      '<button type="submit" class="btn btn-primary btn-block btn-lg" id="lok">Masuk</button></form>' +
      '<a class="back" href="./">' + U.icon('arrow-left') + ' Kembali ke situs publik</a></div></div>';
    var f = app.querySelector('#lf');
    app.querySelector('#lsee').addEventListener('click', function () {
      var i = app.querySelector('#lp'), show = i.type === 'password'; i.type = show ? 'text' : 'password';
      this.innerHTML = U.icon(show ? 'eye-off' : 'eye'); this.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = M.val(app, 'lu').trim(), p = M.val(app, 'lp'), box = app.querySelector('#lmsg'), btn = app.querySelector('#lok');
      if (!u || !p) { box.innerHTML = '<div class="alert alert-err" role="alert">' + U.icon('alert') + '<span>Isi username dan password.</span></div>'; return; }
      M.spinBtn(btn, true, 'Memeriksa…');
      A.post('adminLogin', { username: u, password: p }, 45000).then(function (r) {
        if (r && r.success) { M.setSession(r.data); start(); return; }
        M.spinBtn(btn, false);
        box.innerHTML = '<div class="alert alert-err" role="alert">' + U.icon('alert') + '<span>' + h((r && r.message) || 'Gagal masuk.') + '</span></div>';
      }).catch(function (err) {
        M.spinBtn(btn, false);
        box.innerHTML = '<div class="alert alert-err" role="alert">' + U.icon('alert') + '<span>' + h(err.message) + '</span></div>';
      });
    });
    var lu = app.querySelector('#lu'); if (lu) lu.focus();
  }
  M.showLogin = showLogin;
  M.onAuthLost = function (msg) { showLogin(msg || 'Sesi berakhir. Silakan masuk lagi.'); };

  // ---------- kerangka ----------
  function shell() {
    var s = M.session();
    app.innerHTML = '<div class="adm-shell"><aside class="adm-side" id="side"><a class="brand" href="#/"><span class="brand-mark">' + U.icon('tent') + '</span><span class="brand-txt"><b>PASA 17</b><span>Portal Admin</span></span></a>' +
      '<nav class="adm-nav" aria-label="Menu panitia"><span class="nav-h">MENU PANITIA</span>' + NAV.map(function (n) { return '<a href="' + n[0] + '" data-k="' + n[3] + '">' + U.icon(n[2]) + '<span>' + n[1] + '</span></a>'; }).join('') + '</nav>' +
      '<a class="side-foot" href="./">' + U.icon('arrow-left') + ' <span>Ke Website Publik</span></a></aside>' +
      '<div class="adm-main"><header class="adm-top"><div class="top-l"><a class="brand sm-only" href="#/"><span class="brand-mark">' + U.icon('tent') + '</span></a><span class="top-t" id="topT">PASA 17</span></div>' +
      '<div class="top-r"><button type="button" class="icon-btn" data-theme-btn aria-label="Ganti tema"></button><div class="who"><b>' + h(s.nama) + '</b><small>@' + h(s.username) + '</small></div><button type="button" class="btn btn-soft btn-sm" id="out">' + U.icon('logout') + ' <span>Keluar</span></button></div></header>' +
      '<main id="am" class="adm-page" tabindex="-1"></main></div></div>';
    mainEl = app.querySelector('#am');
    U.setTheme(U.themeNow());
    app.querySelector('[data-theme-btn]').addEventListener('click', function () { U.setTheme(U.themeNow() === 'dark' ? 'light' : 'dark'); });
    app.querySelector('#out').addEventListener('click', function () {
      M.call('adminLogout', {}).catch(function () { }).then(function () { clearInterval(warmT); M.clearSession(); showLogin(); });
    });
  }

  // ---------- router ----------
  function route() {
    if (!mainEl || !M.session().token) return;
    var path = (location.hash.replace(/^#/, '') || '/').split('?')[0], parts = path.split('/'), base = '/' + (parts[1] || ''), arg = parts[2] || '';
    var key = ROUTES[base] || ROUTES[path] || null;
    if (cleanup) { try { cleanup(); } catch (e) { /* abaikan */ } cleanup = null; }
    if (!key) { mainEl.innerHTML = '<div class="adm-in">' + M.empty('help', 'Halaman tidak ditemukan', 'Pilih menu di samping.') + '</div>'; return; }
    Array.prototype.forEach.call(app.querySelectorAll('.adm-nav a'), function (a) {
      var on = a.getAttribute('data-k') === key; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var t = NAV.filter(function (n) { return n[3] === key; })[0]; app.querySelector('#topT').textContent = t ? t[1] : '';
    document.title = (t ? t[1] + ' — ' : '') + 'Portal Admin PASA 17';
    mainEl.innerHTML = '';
    var box = document.createElement('div'); box.className = 'adm-in'; mainEl.appendChild(box);
    var r = M.pages[key](box, arg);
    if (typeof r === 'function') cleanup = r;
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  var warmT = 0;
  function start() {
    shell(); route();
    M.store.load().catch(function () { });      // muat semua data panitia sekali, sejak awal
    // Jaga server tetap "hangat" (tanpa jeda start dingin) selama portal terbuka.
    clearInterval(warmT);
    warmT = setInterval(function () { if (!document.hidden && M.session().token) A.get('ping').catch(function () { }); }, 180000);
    // Menu lain disiapkan sebelum diklik.
    setTimeout(function () { M.swr('adminListModul', { modul: 'kegiatan' }, function () { }); M.swr('adminGetPengaturan', {}, function () { }); }, 2500);
  }

  // ---------- mulai ----------
  M.loadSession();
  if (!A.configured()) { showLogin(); }
  else if (M.session().token) {
    app.innerHTML = '<div class="login-wrap"><div class="spin" aria-label="Memuat"></div></div>';
    // Langsung tampilkan portal dan muat data (token diperiksa server pada panggilan pertama) — tanpa menunggu adminMe dulu.
    start();
  } else showLogin();
})();
