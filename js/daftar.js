/* Halaman Formulir Pendaftaran — satu halaman singkat (tanpa tahapan) */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, S = P.shared, A = P.api;
  var UN = (U.ukuranNama || function (u) { return (u.untuk === 'L' ? 'Ikhwan ' : u.untuk === 'P' ? 'Akhwat ' : '') + u.label; });
  var esc = U.esc;
  var MAX_BYTES = 4 * 1024 * 1024;
  var ORDER = ['prov', 'kota', 'kec', 'desa'];
  var LBL = { prov: 'Provinsi', kota: 'Kota / Kabupaten', kec: 'Kecamatan', desa: 'Desa / Kelurahan' };
  var PARENT = { kota: 'prov', kec: 'kota', desa: 'kec' };

  function fresh() {
    return { d: { nama: '', gender: '', jenjang: '', alamat: '', prov: '', kota: '', kec: '', desa: '', wa: '', email: '', cara: 'transfer', ukuran: '', infaq: '', medis: '', setuju: false },
      bukti: null, err: {}, sending: false, pan: { open: false, level: 'prov', q: '' } };
  }
  var st = fresh(), root = null, pub = null, guard = null;

  // ---------- alamat: satu kolom, memilih bertahap provinsi > kota/kab > kecamatan > desa ----------
  var WIL_SRC = [
    { b: 'https://www.emsifa.com/api-wilayah-indonesia/api/', p: { prov: 'provinces.json', kota: 'regencies/{id}.json', kec: 'districts/{id}.json', desa: 'villages/{id}.json' } },
    { b: 'https://ibnux.github.io/data-indonesia/', p: { prov: 'provinsi.json', kota: 'kabupaten/{id}.json', kec: 'kecamatan/{id}.json', desa: 'kelurahan/{id}.json' } },
    { b: 'https://emsifa.github.io/api-wilayah-indonesia/api/', p: { prov: 'provinces.json', kota: 'regencies/{id}.json', kec: 'districts/{id}.json', desa: 'villages/{id}.json' } }
  ];
  var W = { prov: null, kota: {}, kec: {}, desa: {}, fail: false, busy: {}, src: 0 };
  function titleCase(x) { return String(x || '').toLowerCase().replace(/(^|[\s\-\/(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\bDki\b/, 'DKI').replace(/\bDi\b/, 'DI'); }
  function wilGet(level, id, k) {
    k = k || 0;
    var idx = (W.src + k) % WIL_SRC.length, S = WIL_SRC[idx];
    var c = new AbortController(), tm = setTimeout(function () { c.abort(); }, 10000);
    return fetch(S.b + S.p[level].replace('{id}', id || ''), { signal: c.signal }).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (a) {
        if (!Array.isArray(a) || !a.length) throw new Error('kosong');
        W.src = idx;
        return a.map(function (x) { return { id: String(x.id), name: x.name || x.nama || '' }; });
      }, function (e) {
        clearTimeout(tm);
        W.err = (W.err ? W.err + ' | ' : '') + idx + ':' + (e && e.message || e);
        if (k + 1 < WIL_SRC.length) return wilGet(level, id, k + 1);
        throw e;
      });
  }
  function wilList(level) {
    if (level === 'prov') return W.prov || [];
    var par = st.d[PARENT[level]]; return (par && W[level][par]) || [];
  }
  function wilName(level) {
    var id = st.d[level], l = wilList(level);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return titleCase(l[i].name);
    return '';
  }
  function wilLoad(level) {
    var par = level === 'prov' ? '' : st.d[PARENT[level]];
    if (level !== 'prov' && !par) return;
    if ((level === 'prov' && W.prov) || (level !== 'prov' && W[level][par])) return;
    var key = level === 'prov' ? 'prov' : level + ':' + par;
    if (W.busy[key]) return; W.busy[key] = 1;
    wilGet(level, par).then(function (a) {
      if (level === 'prov') W.prov = a; else W[level][par] = a;
      delete W.busy[key]; renderPanel();
    }, function () {
      delete W.busy[key]; W.fail = true; st.pan.open = false;
      if (root && root.querySelector('[data-sec="santri"]')) renderSec('santri');
    });
  }
  function alamatAktif() { return fc('alamat').tampil && !W.fail; }
  function composeAlamat() {
    if (!alamatAktif()) return;
    var parts = [wilName('desa') && ('Desa/Kel. ' + wilName('desa')), wilName('kec') && ('Kec. ' + wilName('kec')), wilName('kota'), wilName('prov')].filter(Boolean);
    st.d.alamat = (st.d.prov && st.d.kota && st.d.kec && st.d.desa) ? parts.join(', ') : '';
  }
  function addrText() {
    if (st.d.alamat) return st.d.alamat;
    return ORDER.map(wilName).filter(Boolean).reverse().join(' › ');
  }
  function firstEmpty() { for (var i = 0; i < 4; i++) if (!st.d[ORDER[i]]) return ORDER[i]; return 'prov'; }
  function listHtml() {
    var lv = st.pan.level, q = st.pan.q.toLowerCase().trim(), l = wilList(lv), cur = st.d[lv];
    if (!l.length) return '<li class="ap-empty">Memuat daftar…</li>';
    var f = l.filter(function (o) { return !q || titleCase(o.name).toLowerCase().indexOf(q) >= 0; });
    if (!f.length) return '<li class="ap-empty">Tidak ditemukan</li>';
    return f.map(function (o) { return '<li><button type="button" role="option" class="ap-item' + (o.id === cur ? ' on' : '') + '" data-addr-pick="' + esc(o.id) + '">' + esc(titleCase(o.name)) + U.icon('chevron-right') + '</button></li>'; }).join('');
  }
  function renderPanel() {
    var box = root && root.querySelector('#addrPanel'); if (!box) return;
    var btn = root.querySelector('#addrBtn'), pan = st.pan;
    if (btn) { btn.classList.toggle('open', pan.open); btn.setAttribute('aria-expanded', pan.open ? 'true' : 'false'); var v = btn.querySelector('.addr-val'); if (v) { v.textContent = addrText() || 'Ketuk di sini untuk memilih alamat…'; btn.classList.toggle('has', !!addrText()); } }
    box.hidden = !pan.open;
    if (!pan.open) { box.innerHTML = ''; return; }
    var hadFocus = document.activeElement && document.activeElement.id === 'addrQ';
    var lv = pan.level, crumbs = ORDER.slice(0, ORDER.indexOf(lv)).map(function (k) { return '<button type="button" class="crumb" data-addr-back="' + k + '" title="Ubah ' + LBL[k] + '">' + esc(wilName(k)) + '</button>'; }).join('<span class="sep">›</span>');
    box.innerHTML = '<div class="ap-top"><b>Pilih ' + LBL[lv] + ' <small>(' + (ORDER.indexOf(lv) + 1) + '/4)</small></b><button type="button" class="ap-x" data-addr-close aria-label="Tutup pilihan alamat">' + U.icon('x') + '</button></div>' +
      (crumbs ? '<div class="ap-crumbs">' + crumbs + '</div>' : '') +
      '<input class="input ap-q" id="addrQ" type="search" placeholder="Cari ' + LBL[lv].toLowerCase() + '…" autocomplete="off" value="' + esc(pan.q) + '" aria-label="Cari ' + LBL[lv] + '">' +
      '<ul class="ap-list" id="addrList" role="listbox" aria-label="' + LBL[lv] + '">' + listHtml() + '</ul>';
    if (hadFocus || pan.focus) { var qi = box.querySelector('#addrQ'); if (qi && (hadFocus || window.innerWidth >= 700)) { try { qi.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } } pan.focus = false; }
  }
  function openPanel() {
    st.pan.open = true; st.pan.q = ''; st.pan.level = firstEmpty(); st.pan.focus = true;
    wilLoad(st.pan.level); renderPanel();
    var b = root.querySelector('#addrPanel'); if (b) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function closePanel() { st.pan.open = false; renderPanel(); }
  function pickAddr(id) {
    var lv = st.pan.level, i = ORDER.indexOf(lv);
    st.d[lv] = id; for (var j = i + 1; j < 4; j++) st.d[ORDER[j]] = '';
    st.pan.q = ''; composeAlamat();
    if (i < 3) { st.pan.level = ORDER[i + 1]; st.pan.focus = true; wilLoad(ORDER[i + 1]); }
    else { st.pan.open = false; clearErr('alamat'); }
    renderPanel(); updateSummary();
  }
  function backAddr(k) {
    var i = ORDER.indexOf(k); for (var j = i; j < 4; j++) st.d[ORDER[j]] = '';
    st.pan.level = k; st.pan.q = ''; st.pan.focus = true; composeAlamat(); wilLoad(k); renderPanel(); updateSummary();
  }

  // ---------- util ----------
  function fc(k) { return Object.assign({ tampil: true, wajib: true, label: '' }, ((pub && pub.fieldConfig) || {})[k] || {}); }
  function p() { return pub.pengaturan; }
  function normWa(v) {
    var d = String(v || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (d.indexOf('62') === 0) d = '0' + d.slice(2); else if (d.charAt(0) === '8') d = '0' + d;
    return d;
  }
  function size() { var u = (pub.ukuran || []).filter(function (x) { return x.id === st.d.ukuran; })[0]; return u || null; }
  function ukuranUntuk() { var g = st.d.gender; return (pub.ukuran || []).filter(function (u) { return !u.untuk || !g || u.untuk === g; }); }
  function quick() { return String(p().infaq_cepat || '').split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return n > 0; }); }
  function minInfaq() { return parseInt(p().infaq_min, 10) || 0; }
  function label(k, def) { return fc(k).label || def; }

  // ---------- kerangka ----------
  function banner() {
    var cd = U.countdown(p()), k = pub.kuota || {};
    return '<section class="reg-banner" aria-labelledby="h-reg"><div><div class="top"><span class="reg-ic">' + (U.safeUrl(p().logo_url) ? '<img src="' + esc(U.safeUrl(p().logo_url)) + '" alt="" referrerpolicy="no-referrer">' : U.icon('tent')) + '</span><div>' +
      '<div class="badges">' + S.regBadge(pub) + (pub.pendaftaran.status === 'buka' ? '<span class="badge badge-glass">Kuota tersisa ' + k.sisa + ' santri</span>' : '') + (cd ? '<span class="badge badge-glass">' + U.icon('clock') + ' ' + esc(cd.label) + '</span>' : '') + '</div>' +
      '<h1 id="h-reg">Pendaftaran ' + esc(p().nama_singkat) + '</h1>' +
      '<p>' + esc(p().lokasi) + ', ' + esc(U.fmtRange(p().tanggal_mulai, p().tanggal_selesai)) + '. Isi satu formulir singkat di bawah, e-tiket &amp; QR langsung terbit.</p></div></div></div>' +
      '<span class="badge badge-glass safe">' + U.icon('lock') + ' Koneksi aman (HTTPS)</span></section>';
  }
  function aside() {
    return '<aside class="reg-aside" aria-label="Ringkasan"><section class="card sum-card" aria-labelledby="h-sum"><div class="sum-head"><h3 id="h-sum">' + U.icon('idcard') + ' Ringkasan Pendaftar</h3><span class="badge">Draft</span></div>' +
      '<div id="sumBody"></div>' +
      '<ul class="checks"><li>' + U.icon('shield') + '<span>Pembayaran diverifikasi manual oleh panitia (transfer atau tunai).</span></li><li>' + U.icon('mail') + '<span>E-tiket QR terbit setelah formulir terkirim; konfirmasi dikirim lewat WhatsApp (dan email bila diisi).</span></li></ul></section>' +
      (p().kontak_wa ? '<div class="help-card"><span class="ic">' + U.icon('help') + '</span><span><b>Butuh Bantuan?</b><small>Hubungi panitia registrasi</small></span><a class="btn btn-soft" href="' + esc(S.waLink(p().kontak_wa, 'Assalamu\'alaikum, saya ingin bertanya tentang pendaftaran ' + p().nama_singkat)) + '" target="_blank" rel="noopener">Chat WA</a></div>' : '') +
      '<div class="loc-card"><span class="thumb">' + U.art('day') + '</span><span><small class="eyebrow">Lokasi kegiatan</small><b>' + esc(String(p().lokasi).split(',')[0]) + '</b><small>' + esc(p().alamat || p().lokasi) + '</small></span></div></aside>';
  }
  function blocked() {
    var s = pub.pendaftaran;
    return '<section class="card blocked" aria-live="polite"><span class="ic">' + U.icon(s.status === 'penuh' ? 'users' : 'lock') + '</span><h2>' +
      (s.status === 'penuh' ? 'Kuota Santri Sudah Penuh' : 'Pendaftaran Belum Dibuka / Sudah Ditutup') + '</h2><p>' + esc(s.pesan) + '</p>' +
      '<div class="acts"><a class="btn btn-primary" href="#/cek">' + U.icon('search') + ' Cek Status Pendaftaran</a><a class="btn btn-ghost" href="#/">Kembali ke Beranda</a></div></section>';
  }

  // ---------- ringkasan ----------
  function updateSummary() {
    var d = st.d, z = size(), amt = parseInt(d.infaq, 10) || 0;
    var gl = d.gender === 'L' ? 'Ikhwan' : d.gender === 'P' ? 'Akhwat' : '';
    var el = root && root.querySelector('#sumBody'); if (!el) return;
    el.innerHTML = '<div class="mini-ticket"><div class="mt-top"><span>' + esc(p().nama_singkat) + ' • ' + esc(String(p().lokasi).split(/[,&]/)[0].replace(/\s+$/, '')) + '</span><b>Draft</b></div>' +
      '<div class="nm">' + esc(d.nama || 'Nama calon santri') + '</div>' +
      '<div class="sub">' + [gl, d.jenjang].filter(Boolean).map(esc).join(' • ') + (gl || d.jenjang ? '' : '—') + '</div>' +
      '<div class="mt-grid"><div><small>Kaos peserta</small><b>' + (z ? esc(z.label) + ' (LD ' + esc(z.lebar) + ' × TB ' + esc(z.panjang) + ' cm)' : '—') + '</b></div>' +
      '<div><small>Infaq</small><b class="o">' + (amt ? U.rupiah(amt) : '—') + '</b></div></div></div>' +
      '<div class="rows"><div><span>Infaq operasional camp</span><span>' + U.rupiah(amt) + '</span></div><div><span>Biaya verifikasi sistem</span><span>Gratis (Rp0)</span></div>' +
      '<div class="tot"><span>Total diterima</span><b>' + U.rupiah(amt) + '</b></div></div>';
  }

  // ---------- bidang formulir ----------
  function fld(id, lbl, input, o) {
    o = o || {};
    return '<div class="field" data-f="' + id + '"><label class="lbl" for="' + id + '">' + lbl + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : (o.opt ? ' <span class="opt">(opsional)</span>' : '')) + '</label>' +
      input + (o.help ? '<div class="help" id="' + id + '-h">' + o.help + '</div>' : '') + '<div class="err-msg" id="' + id + '-e" role="alert"></div></div>';
  }
  function txt(id, ph, o) {
    o = o || {};
    return '<input class="input" id="' + id + '" name="' + id + '" type="' + (o.type || 'text') + '" value="' + esc(st.d[id]) + '" placeholder="' + esc(ph || '') + '" autocomplete="' + (o.ac || 'off') + '"' +
      (o.im ? ' inputmode="' + o.im + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + ' aria-describedby="' + id + '-h ' + id + '-e">';
  }
  function group(id, lbl, req, inner) {
    return '<div class="field" data-f="' + id + '" role="radiogroup" aria-labelledby="' + id + '-l"><span class="lbl" id="' + id + '-l">' + lbl + (req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</span>' + inner + '<div class="err-msg" id="' + id + '-e" role="alert"></div></div>';
  }
  function sec(key, no, title, sub, cls, inner) {
    return '<section class="fsec ' + cls + '" data-sec="' + key + '"><header class="fsec-h"><span class="fsec-n">' + no + '</span><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div></header><div class="fsec-b">' + inner + '</div></section>';
  }
  function chips(name, items, cur) {
    return '<div class="chips seg">' + items.map(function (it) {
      return '<label class="chip"><input type="radio" name="' + name + '" value="' + it[0] + '"' + (cur === it[0] ? ' checked' : '') + '><span>' + it[1] + '</span></label>';
    }).join('') + '</div>';
  }
  function alamatField() {
    if (!fc('alamat').tampil) return '';
    var lb = esc(label('alamat', 'Alamat Santri')), wj = fc('alamat').wajib;
    if (W.fail) {
      return '<div class="alert alert-warn">' + U.icon('alert') + '<span>Daftar wilayah belum bisa dimuat. Silakan ketik alamat lengkap. <small>(' + esc(String(W.err || '')) + ')</small></span></div>' +
        fld('alamat', lb, '<textarea class="textarea" id="alamat" name="alamat" rows="2" maxlength="300" placeholder="Jalan, desa/kelurahan, kecamatan, kota, provinsi" aria-describedby="alamat-h alamat-e">' + esc(st.d.alamat) + '</textarea>', { req: wj, opt: !wj });
    }
    var t = addrText();
    return '<div class="field addr" data-f="alamat"><span class="lbl" id="alamat-l">' + lb + (wj ? ' <span class="req" aria-hidden="true">*</span>' : ' <span class="opt">(opsional)</span>') + '</span>' +
      '<button type="button" class="addr-btn' + (t ? ' has' : '') + (st.pan.open ? ' open' : '') + '" id="addrBtn" data-addr-toggle aria-haspopup="listbox" aria-expanded="' + (st.pan.open ? 'true' : 'false') + '" aria-labelledby="alamat-l">' +
      U.icon('pin') + '<span class="addr-val">' + esc(t || 'Ketuk di sini untuk memilih alamat…') + '</span>' + U.icon('chevron-right') + '</button>' +
      '<div class="addr-panel" id="addrPanel"' + (st.pan.open ? '' : ' hidden') + '></div>' +
      '<div class="help" id="alamat-h">Pilih bertahap: Provinsi, lalu Kota/Kabupaten, Kecamatan, dan Desa/Kelurahan.</div><div class="err-msg" id="alamat-e" role="alert"></div></div>';
  }
  function buktiHtml() {
    var b = st.bukti;
    return '<label class="drop attn' + (b ? ' has-file' : '') + '" id="drop"><input type="file" id="buktiFile" accept="image/jpeg,image/png,image/webp,application/pdf" aria-describedby="bukti-h bukti-e">' +
      '<span class="ic">' + (b && b.preview ? '<img src="' + esc(b.preview) + '" alt="Pratinjau bukti transfer">' : U.icon(b ? 'file' : 'upload')) + '</span>' +
      '<span><b>' + (b ? esc(b.nama) : 'Ketuk di sini untuk mengunggah bukti transfer') + '</b><small>' + (b ? Math.max(1, Math.round(b.size / 1024)) + ' KB · siap dikirim' : 'Foto/screenshot JPG, PNG, WebP, atau PDF · maks. 4 MB') + '</small></span>' +
      (b ? '<button type="button" class="btn btn-soft btn-sm remove" data-rm-bukti>' + U.icon('trash') + ' Hapus</button>' : '') + '</label>';
  }

  // ---------- bagian-bagian formulir ----------
  function secHtml(key) {
    var d = st.d, q, h = '';
    if (key === 'santri') {
      h = fld('nama', 'Nama Lengkap Calon Santri', txt('nama', 'Contoh: Muhammad Azzam Alfatih', { ac: 'off', max: 100 }), { req: true }) +
        '<div class="row two">' + (fc('gender').tampil ? group('gender', esc(label('gender', 'Jenis Kelamin')), fc('gender').wajib, chips('gender', [['L', 'Ikhwan (L)'], ['P', 'Akhwat (P)']], d.gender)) : '') +
        group('jenjang', 'Jenjang', true, chips('jenjang', [['SD', 'SD'], ['SMP', 'SMP']], d.jenjang)) + '</div>' + alamatField();
      return sec('santri', 1, 'Data Santri', 'Nama, jenjang, dan alamat tempat tinggal.', 'c-santri', h);
    }
    if (key === 'kontak') {
      h = '<div class="row two">' + fld('wa', 'Nomor WhatsApp Aktif', txt('wa', 'Contoh: 0812 3456 7890', { type: 'tel', im: 'tel', ac: 'tel', max: 20 }), { req: true }) +
        fld('email', 'Email', txt('email', 'contoh@email.com', { type: 'email', im: 'email', ac: 'email', max: 120 }), { opt: true }) + '</div>' +
        '<div class="help">Konfirmasi dan e-tiket dikirim ke WhatsApp. Email boleh dikosongkan.</div>';
      return sec('kontak', 2, 'Kontak Wali', 'Hanya nomor WhatsApp yang wajib.', 'c-kontak', h);
    }
    if (key === 'kaos') {
      var us = ukuranUntuk(), jk = d.gender === 'P' ? 'Akhwat (perempuan)' : d.gender === 'L' ? 'Ikhwan (laki-laki)' : '';
      h = (jk ? '<div class="alert alert-info">' + U.icon('shirt') + '<span>Kaos untuk <b>' + jk + '</b>. Ukuran yang tampil sudah disesuaikan.</span></div>' : '<div class="alert alert-info">' + U.icon('shirt') + '<span>Pilih dulu <b>jenis kelamin</b> santri, ukuran kaos Ikhwan dan Akhwat berbeda.</span></div>') +
        group('ukuran', 'Ukuran Kaos' + (jk ? ' — ' + (d.gender === 'P' ? 'Akhwat' : 'Ikhwan') : ''), true, '<div class="tile-grid">' + us.map(function (u) {
          return '<label class="tile"><input type="radio" name="ukuran" value="' + esc(u.id) + '"' + (d.ukuran === u.id ? ' checked' : '') + '><span><b>' + esc(u.label) + '</b><small>LD ' + esc(u.lebar) + ' × TB ' + esc(u.panjang) + ' cm</small></span></label>';
        }).join('') + '</div>') +
        '<figure class="size-guide"><img src="assets/panduan-kaos.png" alt="Cara mengukur kaos: LD lebar dada, TB tinggi bahu" loading="lazy"><figcaption><b>LD</b> = Lebar Dada, <b>TB</b> = Tinggi Bahu (cm). Ukur kaos yang biasa dipakai ananda lalu cocokkan, bila ragu pilih satu ukuran di atasnya.</figcaption></figure>';
      return sec('kaos', 3, 'Ukuran Kaos', 'Panduan ukuran ada di bawah pilihan.', 'c-kaos', h);
    }
    if (key === 'bayar') {
      q = quick();
      var cur = parseInt(d.infaq, 10) || 0, isQuick = q.indexOf(cur) >= 0;
      h = group('amt', 'Nominal Infaq', true, '<div class="tile-grid">' + q.map(function (n) {
        return '<label class="tile"><input type="radio" name="amt" value="' + n + '"' + (isQuick && cur === n ? ' checked' : '') + '><span><b>' + (n / 1000) + 'rb</b><small>' + U.rupiah(n) + '</small></span></label>';
      }).join('') + '</div>') +
        fld('infaq', 'Atau nominal lain', '<div class="input-affix"><span class="pre" aria-hidden="true">Rp</span><input class="input" id="infaq" name="infaq" inputmode="numeric" autocomplete="off" value="' + (isQuick || !cur ? '' : cur) + '" placeholder="Contoh: 175000" aria-describedby="infaq-h infaq-e"></div>',
          { help: 'Minimum ' + U.rupiah(minInfaq()) + '. Boleh lebih sebagai infaq sukarela. <span id="infaqFmt"></span>' }) +
        group('cara', 'Cara Pembayaran', true, chips('cara', [['transfer', 'Transfer sekarang'], ['tunai', 'Bayar tunai ke panitia']], d.cara === 'tunai' ? 'tunai' : 'transfer'));
      if (d.cara === 'tunai') {
        h += '<div class="alert alert-info">' + U.icon('info') + '<span><b>Bayar tunai.</b> Infaq diserahkan langsung kepada panitia, tidak perlu bukti transfer. Status pendaftaran <b>Bayar Tunai</b> dan menjadi <b>Lunas</b> setelah panitia menerima pembayaran.</span></div>';
      } else {
        h += '<div class="pay-box"><div class="pay-h">' + U.icon('bank') + ' Transfer ke rekening resmi</div>' + S.rekening(p(), { cls: 'rek-box' }) +
          fld('bukti', 'Unggah Bukti Transfer', buktiHtml(), { req: true, help: 'Foto otomatis dikecilkan agar cepat terkirim. Bukti hanya dapat dilihat panitia.' }) + '</div>';
      }
      return sec('bayar', 4, 'Infaq &amp; Pembayaran', 'Pilih nominal, lalu cara membayar.', 'c-bayar', h);
    }
    h = fld('medis', esc(label('medis', 'Catatan Alergi / Penyakit')), '<textarea class="textarea" id="medis" name="medis" rows="2" maxlength="1000" placeholder="Contoh: alergi udang, asma ringan (kosongkan bila tidak ada)" aria-describedby="medis-h medis-e">' + esc(d.medis) + '</textarea>', { opt: !fc('medis').wajib, req: fc('medis').wajib }) +
      '<div class="field consent" data-f="setuju"><div class="consent-h">' + U.icon('shield') + ' Persetujuan (wajib dicentang)</div><label class="check"><input type="checkbox" id="setuju" name="setuju"' + (d.setuju ? ' checked' : '') + ' aria-describedby="setuju-e"><span>Saya menyetujui <a href="#" data-syarat>ketentuan &amp; tata tertib</a> ' + esc(p().nama_singkat) + ' dan menyatakan data yang diisi sudah benar.</span></label><div class="err-msg" id="setuju-e" role="alert"></div></div>' +
      '<div id="submitErr" aria-live="assertive"></div>' +
      '<button type="submit" class="btn btn-primary btn-xl btn-block" id="btnDaftar"' + (st.sending ? ' disabled' : '') + '>Daftarkan &amp; Dapatkan E-Tiket ' + U.icon('ticket') + '</button>' +
      '<p class="form-note">Satu formulir untuk satu anak. Untuk anak lain, isi formulir lagi setelah selesai.</p>';
    return sec('akhir', 5, 'Kirim Pendaftaran', 'Periksa lagi, lalu tekan tombol daftar.', 'c-akhir', h);
  }
  function formHtml() {
    return '<form id="regForm" novalidate>' + ['santri', 'kontak', 'kaos', 'bayar', 'akhir'].map(secHtml).join('') + '</form>';
  }
  function renderSec(key) {
    var el = root && root.querySelector('[data-sec="' + key + '"]'); if (!el) return;
    var tmp = document.createElement('div'); tmp.innerHTML = secHtml(key);
    el.parentNode.replaceChild(tmp.firstChild, el);
    if (key === 'santri') renderPanel();
    if (key === 'bayar') updateInfaqFmt();
  }

  // ---------- validasi ----------
  function validate() {
    var d = st.d, e = {};
    if (d.nama.trim().length < 3) e.nama = 'Nama lengkap santri wajib diisi.';
    if (fc('gender').tampil && fc('gender').wajib && !d.gender) e.gender = 'Pilih jenis kelamin.';
    if (!d.jenjang) e.jenjang = 'Pilih jenjang SD atau SMP.';
    if (alamatAktif()) {
      composeAlamat();
      if (fc('alamat').wajib && !d.alamat) e.alamat = 'Pilih alamat sampai desa/kelurahan.';
    } else if (fc('alamat').tampil && fc('alamat').wajib && !d.alamat.trim()) e.alamat = 'Alamat wajib diisi.';
    else if (fc('alamat').tampil && d.alamat.trim() && d.alamat.trim().length < 8) e.alamat = 'Alamat terlalu singkat. Tuliskan alamat lengkap.';
    if (!/^0\d{8,13}$/.test(normWa(d.wa))) e.wa = 'Nomor WhatsApp tidak valid. Contoh: 081234567890.';
    if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = 'Alamat email tidak valid. Kosongkan bila tidak punya email.';
    if (!size()) e.ukuran = d.gender ? 'Pilih ukuran kaos.' : 'Pilih jenis kelamin dulu, lalu ukuran kaos.';
    var n = parseInt(d.infaq, 10);
    if (!(n >= minInfaq())) e.infaq = 'Infaq minimal ' + U.rupiah(minInfaq()) + '.';
    if (d.cara !== 'tunai' && !st.bukti) e.bukti = 'Unggah bukti transfer.';
    if (fc('medis').tampil && fc('medis').wajib && !d.medis.trim()) e.medis = 'Catatan medis wajib diisi (tulis "-" bila tidak ada).';
    if (!d.setuju) e.setuju = 'Anda harus menyetujui ketentuan untuk melanjutkan.';
    return e;
  }
  function showErrors(e) {
    var first = null;
    Object.keys(e).forEach(function (k) {
      var key = k === 'infaq' && root.querySelector('[data-f="amt"]') && !root.querySelector('#infaq').value ? 'amt' : k;
      var f = root.querySelector('[data-f="' + key + '"]'); if (!f) f = root.querySelector('[data-f="' + k + '"]'); if (!f) return;
      f.classList.add('invalid');
      var m = f.querySelector('.err-msg'); if (m) m.textContent = e[k];
      var inp = f.querySelector('input,textarea'); if (inp && inp.type !== 'radio' && inp.type !== 'file') inp.setAttribute('aria-invalid', 'true');
      if (!first) first = f;
    });
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); var fi = first.querySelector('input:not([type=hidden]):not([type=radio]):not([type=file]),textarea,button.addr-btn'); if (fi) { try { fi.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } } }
  }
  function clearErr(key) {
    var f = root && root.querySelector('[data-f="' + key + '"]'); if (!f) return;
    f.classList.remove('invalid'); var m = f.querySelector('.err-msg'); if (m) m.textContent = '';
    var inp = f.querySelector('input,textarea'); if (inp) inp.removeAttribute('aria-invalid');
  }

  // ---------- render ----------
  function renderAll() {
    var open = pub.pendaftaran.status === 'buka';
    root.innerHTML = '<div class="wrap">' + banner() + (open ? '<div class="reg-grid"><section class="form-card one" id="formCard">' + formHtml() + '</section>' + aside() + '</div>' : blocked()) + '</div>';
    if (open) { updateSummary(); updateInfaqFmt(); if (alamatAktif()) wilLoad('prov'); renderPanel(); }
  }
  function updateInfaqFmt() {
    var el = root && root.querySelector('#infaqFmt'), n = parseInt(st.d.infaq, 10);
    if (el) el.textContent = n ? '= ' + U.rupiah(n) : '';
  }

  // ---------- berkas bukti ----------
  // ---------- berkas bukti ----------
  function toDataUrl(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = function () { rej(new Error('baca')); }; r.readAsDataURL(blob); });
  }
  function loadImg(url) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('img')); }; i.src = url; }); }
  function shrink(file) {
    var url = URL.createObjectURL(file);
    return loadImg(url).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight, big = Math.max(w, h) > 1800 || file.size > 900 * 1024;
      if (!big) return file;
      var sc = Math.min(1, 1600 / Math.max(w, h)); w = Math.round(w * sc); h = Math.round(h * sc);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      function tryQ(q) { return new Promise(function (r) { c.toBlob(r, 'image/jpeg', q); }).then(function (b) { return (b && b.size > 3.5 * 1024 * 1024 && q > .4) ? tryQ(q - .15) : b; }); }
      return tryQ(.85);
    }).then(function (b) { URL.revokeObjectURL(url); return b; }, function (err) { URL.revokeObjectURL(url); throw err; });
  }
  function takeFile(file) {
    var f = root.querySelector('[data-f="bukti"]');
    function fail(msg) { st.bukti = null; renderSec('bayar'); showErrors({ bukti: msg }); }
    if (!file) return;
    var okType = /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type) || /\.(jpe?g|png|webp|pdf)$/i.test(file.name);
    if (!okType) return fail('Format berkas harus JPG, PNG, WebP, atau PDF.');
    var isPdf = /pdf/i.test(file.type) || /\.pdf$/i.test(file.name);
    if (isPdf && file.size > MAX_BYTES) return fail('Ukuran PDF maksimal 4 MB.');
    if (!isPdf && file.size > 25 * 1024 * 1024) return fail('Foto terlalu besar. Pilih foto yang lebih kecil.');
    var drop = root.querySelector('#drop'); if (drop) drop.querySelector('small').textContent = 'Memproses berkas…';
    var work = isPdf ? Promise.resolve(file) : shrink(file);
    work.then(function (blob) {
      if (!blob || blob.size > MAX_BYTES) throw new Error('besar');
      return toDataUrl(blob).then(function (data) {
        if (st.bukti && st.bukti.preview) URL.revokeObjectURL(st.bukti.preview);
        var nm = file.name.replace(/\.[^.]*$/, '') + (isPdf ? '.pdf' : (blob === file ? file.name.match(/\.[^.]*$/) || '.jpg' : '.jpg'));
        st.bukti = { nama: String(nm), base64: data, size: blob.size, mime: blob.type, preview: isPdf ? '' : URL.createObjectURL(blob) };
        renderSec('bayar'); clearErr('bukti');
      });
    }).catch(function (err) {
      fail(err && err.message === 'big' || err && err.message === 'besar' ? 'Ukuran berkas maksimal 4 MB.' : 'Berkas tidak dapat dibaca. Gunakan foto JPG/PNG atau PDF.');
    });
  }

  // ---------- kirim ----------
  function submit() {
    var e = validate();
    if (Object.keys(e).length) { showErrors(e); return; }
    var d = st.d;
    var payload = {
      nama: d.nama.trim(), gender: d.gender, jenjang: d.jenjang, alamat: (composeAlamat(), d.alamat.trim()),
      wa: normWa(d.wa), email: d.email.trim(), ukuran: d.ukuran, infaq: parseInt(d.infaq, 10), medis: d.medis.trim(),
      setuju: true, cara: d.cara === 'tunai' ? 'tunai' : 'transfer',
      bukti: d.cara === 'tunai' || !st.bukti ? null : { nama: st.bukti.nama, base64: st.bukti.base64 }
    };
    st.sending = true; U.showBusy('Mengirim pendaftaran…', (d.cara === 'tunai' ? 'Mengirim data pendaftaran. ' : 'Mengunggah data dan bukti transfer. ') + 'Mohon jangan tutup halaman ini.');
    var btn = root.querySelector('#btnDaftar'); if (btn) btn.disabled = true;
    function reset() { st.sending = false; var b = root.querySelector('#btnDaftar'); if (b) b.disabled = false; }
    function showBox(html) { var box = root.querySelector('#submitErr'); if (box) { box.innerHTML = html; box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    A.post('register', payload, 90000).then(function (r) {
      U.hideBusy(); reset();
      if (r && r.success) {
        P.ticket.set(r.data);
        if (st.bukti && st.bukti.preview) URL.revokeObjectURL(st.bukti.preview);
        st = fresh(); detachGuard();
        U.toast('Pendaftaran berhasil. E-tiket siap.', 'ok');
        location.hash = '#/tiket';
        return;
      }
      var msg = (r && r.message) || 'Pendaftaran gagal. Silakan coba lagi.';
      if (r && (r.code === 'tutup' || r.code === 'penuh')) { A.refreshPublic().then(function () { }, function () { }); pub.pendaftaran = { status: r.code, pesan: msg }; detachGuard(); renderAll(); return; }
      showBox('<div class="alert alert-err">' + U.icon('alert') + '<span>' + esc(msg) + (r && r.code === 'ganda' ? ' <a href="#/cek">Buka Cek Pendaftaran</a>' : '') + '</span></div>');
      U.toast(msg, 'err');
    }).catch(function (err) {
      U.hideBusy(); reset();
      showBox('<div class="alert alert-warn">' + U.icon('alert') + '<span>' + esc(err.message || 'Koneksi terputus.') + ' <b>Data mungkin sudah tersimpan</b> — sebelum mengirim ulang, buka <a href="#/cek">Cek Pendaftaran</a>. Bila belum ada, tekan tombol daftar sekali lagi.</span></div>');
      U.toast('Pengiriman terputus. Lihat keterangan di bawah.', 'err');
    });
  }

  // ---------- event ----------
  function onInput(e) {
    var t = e.target;
    if (t.id === 'addrQ') { if (e.type !== 'input') return; st.pan.q = t.value; var ul = root.querySelector('#addrList'); if (ul) ul.innerHTML = listHtml(); return; }
    var n = t.name; if (!n) return;
    if (n === 'amt') { st.d.infaq = t.value; var c = root.querySelector('#infaq'); if (c) c.value = ''; clearErr('amt'); clearErr('infaq'); updateSummary(); updateInfaqFmt(); return; }
    if (n === 'infaq') {
      var digits = t.value.replace(/\D/g, '').slice(0, 9); if (digits !== t.value) t.value = digits;
      st.d.infaq = digits; root.querySelectorAll('input[name=amt]').forEach(function (r) { r.checked = (r.value === digits); });
      clearErr('infaq'); clearErr('amt'); updateSummary(); updateInfaqFmt(); return;
    }
    if (!(n in st.d)) return;
    st.d[n] = t.type === 'checkbox' ? t.checked : t.value;
    clearErr(n);
    if (n === 'gender') { var zz = size(); if (zz && zz.untuk && zz.untuk !== st.d.gender) st.d.ukuran = ''; clearErr('ukuran'); renderSec('kaos'); }
    if (n === 'cara') { renderSec('bayar'); }
    updateSummary();
  }
  function onClick(e) {
    var tg = e.target.closest('[data-addr-toggle]'); if (tg) { e.preventDefault(); if (st.pan.open) closePanel(); else openPanel(); return; }
    var pk = e.target.closest('[data-addr-pick]'); if (pk) { e.preventDefault(); pickAddr(pk.getAttribute('data-addr-pick')); return; }
    var bk = e.target.closest('[data-addr-back]'); if (bk) { e.preventDefault(); backAddr(bk.getAttribute('data-addr-back')); return; }
    if (e.target.closest('[data-addr-close]')) { e.preventDefault(); closePanel(); return; }
    var rm = e.target.closest('[data-rm-bukti]');
    if (rm) { e.preventDefault(); e.stopPropagation(); if (st.bukti && st.bukti.preview) URL.revokeObjectURL(st.bukti.preview); st.bukti = null; renderSec('bayar'); return; }
    if (st.pan.open && !e.target.closest('.addr')) closePanel();
  }
  function onKey(e) { if (e.key === 'Escape' && st.pan.open) { closePanel(); var b = root.querySelector('#addrBtn'); if (b) b.focus(); } }
  function onSubmit(e) { if (e.target.id === 'regForm') { e.preventDefault(); if (!st.sending) submit(); } }
  function onFile(e) { if (e.target.id === 'buktiFile') takeFile(e.target.files && e.target.files[0]); }
  function onDrag(e) {
    var d = e.target.closest && e.target.closest('#drop'); if (!d) return;
    if (e.type === 'dragover' || e.type === 'dragenter') { e.preventDefault(); d.classList.add('over'); }
    else if (e.type === 'dragleave') d.classList.remove('over');
    else if (e.type === 'drop') { e.preventDefault(); d.classList.remove('over'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeFile(f); }
  }
  function attachGuard() {
    if (guard) return;
    guard = function (e) { if (st.sending || st.d.nama || st.d.wa) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', guard);
  }
  function detachGuard() { if (guard) { window.removeEventListener('beforeunload', guard); guard = null; } }

  var handlers = [];
  function bind(el) {
    [['input', onInput], ['change', onInput], ['click', onClick], ['keydown', onKey], ['submit', onSubmit], ['change', onFile], ['dragover', onDrag], ['dragenter', onDrag], ['dragleave', onDrag], ['drop', onDrag]].forEach(function (h) {
      el.addEventListener(h[0], h[1]); handlers.push([el, h[0], h[1]]);
    });
  }

  P.pages.daftar = {
    title: 'Formulir Pendaftaran — PASA 17',
    needsData: true,
    mount: function (el, data) {
      root = el; pub = data; bind(el); renderAll();
      if (pub.pendaftaran.status === 'buka') attachGuard();
    },
    update: function (data) {
      var was = pub.pendaftaran.status; pub = data;
      if (!root) return;
      if (data.pendaftaran.status !== was) { renderAll(); if (data.pendaftaran.status === 'buka') attachGuard(); else detachGuard(); }
      else updateSummary();
    },
    unmount: function () {
      handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); }); handlers = []; detachGuard(); root = null;
    },
    reset: function () { st = fresh(); }
  };
})();
