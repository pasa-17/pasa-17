/* Router, navigasi, footer, tema — titik masuk situs. */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  var U = P.ui, S = P.shared, A = P.api, esc = U.esc;
  var ROUTES = { '': 'home', '/': 'home', '/daftar': 'daftar', '/cek': 'cek', '/tiket': 'tiket', '/panduan': 'panduan' };
  var LINKS = [['#/', 'Beranda', 'home'], ['#/daftar', 'Formulir Pendaftaran', 'daftar'], ['#/cek', 'Cek Status', 'cek'], ['#/panduan', 'Panduan', 'panduan']];
  var main, cur = { key: null, page: null, mounted: false };

  function pathNow() { return (location.hash.replace(/^#/, '') || '/').split('?')[0]; }
  function pub() { return A.getCached(); }

  // ---------- kerangka ----------
  function buildNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML =
      '<nav class="nav" aria-label="Utama"><a class="brand" href="#/" aria-label="Beranda PASA 17"><span class="brand-mark" id="brandMark">' + U.icon('tent') + '</span>' +
      '<span class="brand-txt"><b id="brandName">PASA 17</b><span id="brandSub"></span></span></a>' +
      '<div class="nav-links">' + LINKS.map(function (l) { return '<a href="' + l[0] + '" data-key="' + l[2] + '">' + l[1] + '</a>'; }).join('') + '</div>' +
      '<div class="nav-actions"><button type="button" class="icon-btn" data-theme-btn></button><a class="nav-admin" href="admin.html">Portal Admin</a>' +
      '<a class="btn btn-primary" id="navDaftar" href="#/daftar">Daftar<span class="nav-cta-long">&nbsp;Sekarang</span></a>' +
      '<button type="button" class="icon-btn" id="menuBtn" aria-expanded="false" aria-controls="sheet" aria-label="Buka menu">' + U.icon('menu') + '</button></div></nav>' +
      '<div class="sheet" id="sheet" hidden>' + LINKS.map(function (l) { return '<a href="' + l[0] + '" data-key="' + l[2] + '">' + l[1] + U.icon('chevron-right') + '</a>'; }).join('') +
      '<a href="admin.html">Portal Admin' + U.icon('chevron-right') + '</a></div>';
    U.setTheme(U.themeNow());
    nav.querySelector('[data-theme-btn]').addEventListener('click', function () { U.setTheme(U.themeNow() === 'dark' ? 'light' : 'dark'); });
    var btn = nav.querySelector('#menuBtn'), sheet = nav.querySelector('#sheet');
    btn.addEventListener('click', function () {
      var open = sheet.hidden; sheet.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu'); btn.innerHTML = U.icon(open ? 'x' : 'menu');
    });
  }
  function closeSheet() {
    var sheet = document.getElementById('sheet'), btn = document.getElementById('menuBtn');
    if (sheet && !sheet.hidden) { sheet.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Buka menu'); btn.innerHTML = U.icon('menu'); }
  }
  function markActive() {
    // Tombol "Daftar" di bar atas hanya tampil di Beranda, Cek Status, dan E-Tiket (disembunyikan di Formulir & Panduan).
    document.body.setAttribute('data-page', cur.key || '');
    var nd = document.getElementById('navDaftar'); if (nd) nd.style.display = (cur.key === 'daftar' || cur.key === 'panduan') ? 'none' : '';
    document.querySelectorAll('#nav [data-key]').forEach(function (a) {
      if (a.getAttribute('data-key') === cur.key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  // Judul tab & deskripsi mengikuti Pengaturan (nama acara, lokasi, tanggal) — tidak ada teks lokasi yang tertanam.
  function pageTitle(page) {
    var d = pub(), p = d && d.pengaturan;
    if (page.isHome) return p ? (p.nama_acara || 'PASA') + (p.lokasi ? ' | ' + p.lokasi : '') : 'Pendaftaran PASA';
    return page.title;
  }
  function updateMeta(p) {
    var desc = 'Pendaftaran online ' + (p.nama_acara || 'PASA') + (p.lokasi ? ' di ' + p.lokasi : '') + (p.tanggal_mulai ? ', ' + U.fmtRange(p.tanggal_mulai, p.tanggal_selesai) : '') + '. Daftar lewat HP, unggah bukti infaq, dan terima e-tiket QR.';
    var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', desc);
    var og = document.querySelector('meta[property="og:description"]'); if (og) og.setAttribute('content', desc);
    var ot = document.querySelector('meta[property="og:title"]'); if (ot) ot.setAttribute('content', p.nama_acara || 'PASA');
  }
  function updateBrand(d) {
    if (!d) return; var p = d.pengaturan;
    updateMeta(p);
    if (cur && cur.page) document.title = pageTitle(cur.page);
    var n = document.getElementById('brandName'), s = document.getElementById('brandSub'), m = document.getElementById('brandMark');
    if (n) n.textContent = p.nama_singkat || 'PASA 17';
    if (s) s.textContent = String(p.lokasi || '').split(/[&,]/)[0].trim();
    var logo = U.safeUrl(p.logo_url);
    U.setFavicon(logo || '');
    if (m && logo && !m.querySelector('img')) { m.innerHTML = '<img src="' + esc(logo) + '" alt="" referrerpolicy="no-referrer">'; m.querySelector('img').addEventListener('error', function () { m.innerHTML = U.icon('tent'); }); }
  }

  function buildFooter(d) {
    var f = document.getElementById('footer'), p = d ? d.pengaturan : {}, med = d ? d.medsos || [] : [];
    var wa = S.waLink(p.kontak_wa);
    f.innerHTML = '<div class="wrap"><div class="f-cols">' +
      '<div><div class="brand-line"><span class="brand-mark" style="width:32px;height:32px">' + U.icon('tent') + '</span>' + esc((p.nama_singkat || 'PASA 17') + ' ' + String(p.lokasi || '').split(/[&,]/).pop().trim()) + '</div>' +
      '<p>' + esc(p.footer_teks || 'Pesantren Anak Shaleh ke-17. Membina generasi berakhlak mulia melalui tadabbur alam dan ukhuwah islamiyah.') + '</p>' +
      (p.alamat || p.lokasi ? '<ul class="contact-list" style="margin-top:14px"><li>' + U.icon('pin') + '<span>' + (U.safeUrl(p.peta_url) ? '<a href="' + esc(U.safeUrl(p.peta_url)) + '" target="_blank" rel="noopener">' + esc(p.alamat || p.lokasi) + '</a>' : esc(p.alamat || p.lokasi)) + '</span></li></ul>' : '') +
      (med.length ? '<div class="social">' + med.map(function (m) { return '<a href="' + esc(U.safeUrl(m.url)) + '" target="_blank" rel="noopener">' + esc(m.platform) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '<div>' + S.rekening(p) + '</div>' +
      '<div><h3>Pusat Bantuan &amp; Admin</h3><ul class="contact-list">' +
      (p.kontak_wa ? '<li>' + U.icon('chat') + '<span>WhatsApp: <a href="' + esc(wa) + '" target="_blank" rel="noopener">' + esc(p.kontak_wa) + '</a></span></li>' : '') +
      (p.kontak_hotline ? '<li>' + U.icon('phone') + '<span>Hotline: <a href="tel:' + esc(String(p.kontak_hotline).replace(/[^\d+]/g, '')) + '">' + esc(p.kontak_hotline) + '</a></span></li>' : '') +
      (p.kontak_email ? '<li>' + U.icon('mail') + '<span><a href="mailto:' + esc(p.kontak_email) + '">' + esc(p.kontak_email) + '</a></span></li>' : '') +
      (!p.kontak_wa && !p.kontak_hotline && !p.kontak_email ? '<li>' + U.icon('info') + '<span>Kontak panitia akan diumumkan.</span></li>' : '') + '</ul>' +
      '<a class="btn btn-soft btn-sm" style="margin-top:16px" href="#/cek">' + U.icon('ticket') + ' Sudah daftar? Cek E-Ticket di sini</a></div>' +
      '</div><div class="f-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(p.nama_acara || 'PASA 17') + '. Hak cipta dilindungi.</span>' +
      '<nav aria-label="Tautan footer"><button type="button" data-syarat>Ketentuan &amp; Tata Tertib</button><a href="admin.html">Akses Panitia</a></nav></div></div>';
  }

  // ---------- router ----------
  function skeleton() {
    main.innerHTML = '<div class="wrap" aria-busy="true" aria-label="Memuat"><div class="skel load-hero"></div><div class="skel" style="height:96px;margin-top:16px"></div><div class="skel" style="height:240px;margin-top:16px"></div></div>';
  }
  function errorState(err) {
    var cfg = !A.configured();
    main.innerHTML = '<div class="wrap"><div class="card err-state" role="alert"><h2>' + (cfg ? 'Situs belum tersambung ke server' : 'Tidak dapat memuat data') + '</h2><p class="muted">' + esc(err && err.message || 'Periksa koneksi internet Anda.') + '</p>' +
      '<button type="button" class="btn btn-primary" id="retry">Coba Lagi</button></div></div>';
    document.getElementById('retry').addEventListener('click', function () { route(true); });
  }

  function route(forceFetch) {
    var key = ROUTES[pathNow()], page = key && P.pages[key];
    if (cur.page && cur.page.unmount && cur.mounted) { try { cur.page.unmount(); } catch (e) { console.error(e); } }
    cur = { key: key || '404', page: page || null, mounted: false };
    closeSheet(); markActive(); window.scrollTo(0, 0);
    document.title = page ? pageTitle(page) : 'Halaman tidak ditemukan — PASA 17';
    if (!page) {
      main.innerHTML = '<div class="wrap"><div class="card err-state"><h2>Halaman tidak ditemukan</h2><a class="btn btn-primary" href="#/">Kembali ke Beranda</a></div></div>'; return;
    }
    var my = cur, data = pub();
    function mountNow(d) { if (cur !== my) return; main.innerHTML = ''; page.mount(main, d); my.mounted = true; main.focus({ preventScroll: true }); }
    if (!page.needsData) { mountNow(data); if (!data) A.refreshPublic().catch(function () { }); return; }
    if (data) { mountNow(data); return; }
    skeleton();
    A.refreshPublic().then(function (d) { mountNow(d); }, function (err) { if (cur === my) errorState(err); });
  }

  // ---------- tombol WhatsApp mengambang: hubungi admin (bisa lebih dari satu) ----------
  function parseAdmins(p) {
    var out = [];
    String((p && p.kontak_admin) || '').split(/\r?\n/).forEach(function (ln) {
      ln = ln.trim(); if (!ln) return;
      var i = ln.indexOf('|'), nama = i >= 0 ? ln.slice(0, i).trim() : '', hp = (i >= 0 ? ln.slice(i + 1) : ln).replace(/[^\d+]/g, '');
      if (hp.replace(/\D/g, '').length >= 8) out.push({ nama: nama || ('Admin ' + (out.length + 1)), hp: hp });
    });
    if (!out.length && p && p.kontak_wa && String(p.kontak_wa).replace(/\D/g, '').length >= 8) out.push({ nama: 'Admin Panitia', hp: String(p.kontak_wa) });
    return out.slice(0, 8);
  }
  function buildFab(d) {
    var old = document.getElementById('fab'); if (old) old.remove();
    var p = d && d.pengaturan, list = parseAdmins(p); if (!list.length) return;
    var msg = 'Assalamu\'alaikum, saya ingin bertanya tentang pendaftaran ' + (p.nama_singkat || 'PASA') + '.';
    var box = document.createElement('div'); box.id = 'fab'; box.className = 'fab';
    var many = list.length > 1;
    var btn = many ? '<button type="button" class="fab-btn" id="fabBtn" aria-expanded="false" aria-controls="fabMenu">' : '<a class="fab-btn" id="fabBtn" target="_blank" rel="noopener" href="' + esc(S.waLink(list[0].hp, msg)) + '">';
    box.innerHTML = (many ? '<div class="fab-menu" id="fabMenu" hidden><div class="fab-h">Pilih admin untuk dihubungi</div>' + list.map(function (x) {
      return '<a class="fab-item" target="_blank" rel="noopener" href="' + esc(S.waLink(x.hp, msg)) + '"><span class="fab-av">' + esc(x.nama.charAt(0).toUpperCase()) + '</span><span><b>' + esc(x.nama) + '</b><small>' + esc(x.hp) + '</small></span>' + U.icon('chat') + '</a>';
    }).join('') + '</div>' : '') + btn + '<span class="fab-ic">' + U.icon('chat') + '</span><span class="fab-tx">Hubungi Admin</span>' + (many ? '</button>' : '</a>');
    document.body.appendChild(box);
    if (many) {
      var b = box.querySelector('#fabBtn'), m = box.querySelector('#fabMenu');
      b.addEventListener('click', function (e) { e.stopPropagation(); var o = m.hidden; m.hidden = !o; b.setAttribute('aria-expanded', String(o)); });
      document.addEventListener('click', function (e) { if (!m.hidden && !box.contains(e.target)) { m.hidden = true; b.setAttribute('aria-expanded', 'false'); } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) { m.hidden = true; b.setAttribute('aria-expanded', 'false'); b.focus(); } });
    }
  }

  function init() {
    main = document.getElementById('main');
    U.installSprite(); buildNav(); buildFooter(pub()); updateBrand(pub()); buildFab(pub());
    S.bindGlobal(pub);
    var top = document.getElementById('toTop');
    top.innerHTML = U.icon('chevron-up'); top.setAttribute('aria-label', 'Kembali ke atas');
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 700); }, { passive: true });
    window.addEventListener('hashchange', function () { route(); });

    A.onPublic(function (d) {
      updateBrand(d); buildFooter(d); buildFab(d);
      if (cur.page && cur.mounted && cur.page.update) cur.page.update(d);
    });
    route();
    // segarkan di latar belakang (data cache tampil dulu)
    A.refreshPublic().catch(function (e) { if (pub()) console.warn('Gagal menyegarkan data:', e.message); });
    // segarkan saat tab kembali aktif setelah > 2 menit
    var hiddenAt = 0;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 120000) A.refreshPublic().catch(function () { });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
