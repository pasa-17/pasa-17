/* Formulir pendaftaran rombongan: satu koordinator mendaftarkan banyak santri; kunci tiap santri = WhatsApp wali. */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, esc = U.esc, A = P.api;
  var MAX = 60;
  var root = null, pub = null, st = null, handlers = [];

  function blank() { return { nama: '', gender: '', jenjang: '', wa: '', ukuran: '' }; }
  function fresh() { return { rombongan: '', koordinator: '', koordinatorWa: '', kode: '', kodeInfo: null, infaq: '', setuju: false, rows: [blank(), blank(), blank()], sending: false, done: null }; }
  function normWa(v) {
    var d = String(v || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (d.indexOf('62') === 0) d = '0' + d.slice(2); else if (d.charAt(0) === '8') d = '0' + d;
    return d;
  }
  function quick() { return String(pub.pengaturan.infaq_cepat || '').split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return n > 0; }); }
  function minInfaq() { return parseInt(pub.pengaturan.infaq_min, 10) || 0; }
  function nominal() { return parseInt(st.infaq, 10) || minInfaq(); }
  function sumHtml() {
    var n = st.rows.length, nom = nominal(), pot = st.kodeInfo ? Math.min(st.kodeInfo.potongan, nom) : 0, per = Math.max(0, nom - pot);
    return '<div class="rows"><div><span>Infaq per santri</span><span>' + U.rupiah(nom) + '</span></div>' +
      (pot ? '<div><span>Potongan rombongan' + (st.kodeInfo.nama ? ' (' + esc(st.kodeInfo.nama) + ')' : '') + '</span><span>− ' + U.rupiah(pot) + '</span></div>' : '') +
      '<div><span>Jumlah santri</span><span>' + n + '</span></div><div class="tot"><span>Total infaq rombongan</span><b>' + U.rupiah(per * n) + '</b></div></div>';
  }
  function updSum() { var e = root && root.querySelector('#rbSum'); if (e) e.innerHTML = sumHtml(); }
  function cekKode() {
    var v = (st.kode || '').trim(), m = root.querySelector('#kodeMsg'); if (!m) return;
    if (!v) { st.kodeInfo = null; m.innerHTML = ''; return updSum(); }
    m.innerHTML = '<span class="muted">Memeriksa kode…</span>';
    A.post('cekKodeRombongan', { kode: v }, 20000).then(function (r) {
      if (r && r.success) { st.kodeInfo = r.data; m.innerHTML = '<span class="kode-ok">' + U.icon('check') + ' Kode <b>' + esc(r.data.kode) + '</b> berlaku' + (r.data.potongan ? ': potongan ' + U.rupiah(r.data.potongan) + ' per santri' : '') + '.</span>'; }
      else { st.kodeInfo = null; m.innerHTML = '<span class="kode-no">' + esc((r && r.message) || 'Kode tidak dikenali.') + '</span>'; }
      updSum();
    }, function () { m.innerHTML = '<span class="kode-no">Gagal memeriksa kode. Coba lagi.</span>'; });
  }
  function sizesFor(g) { return (pub.ukuran || []).filter(function (u) { return !u.untuk || !g || u.untuk === g; }); }

  function rowHtml(r, i) {
    var us = sizesFor(r.gender);
    return '<div class="rb-row" data-i="' + i + '"><div class="rb-no">' + (i + 1) + '</div><div class="rb-f">' +
      '<input class="input" data-k="nama" placeholder="Nama lengkap santri" value="' + esc(r.nama) + '" aria-label="Nama santri ' + (i + 1) + '">' +
      '<div class="rb-g">' +
      '<select class="select" data-k="gender" aria-label="Jenis kelamin ' + (i + 1) + '"><option value="">Ikhwan/Akhwat</option><option value="L"' + (r.gender === 'L' ? ' selected' : '') + '>Ikhwan (L)</option><option value="P"' + (r.gender === 'P' ? ' selected' : '') + '>Akhwat (P)</option></select>' +
      '<select class="select" data-k="jenjang" aria-label="Jenjang ' + (i + 1) + '"><option value="">Jenjang</option><option value="SD"' + (r.jenjang === 'SD' ? ' selected' : '') + '>SD</option><option value="SMP"' + (r.jenjang === 'SMP' ? ' selected' : '') + '>SMP</option></select>' +
      '<select class="select" data-k="ukuran" aria-label="Ukuran kaos ' + (i + 1) + '"><option value="">Ukuran kaos</option>' + us.map(function (u) { return '<option value="' + esc(u.id) + '"' + (r.ukuran === u.id ? ' selected' : '') + '>' + esc(u.label) + ' (LD ' + esc(u.lebar) + '×TB ' + esc(u.panjang) + ')</option>'; }).join('') + '</select></div>' +
      '<input class="input" data-k="wa" inputmode="tel" placeholder="WhatsApp wali, mis. 081234567890" value="' + esc(r.wa) + '" aria-label="WhatsApp wali ' + (i + 1) + '"></div>' +
      '<button type="button" class="icon-btn" data-del="' + i + '" aria-label="Hapus baris ' + (i + 1) + '"' + (st.rows.length <= 1 ? ' disabled' : '') + '>' + U.icon('trash') + '</button></div>';
  }
  function renderRows() { var el = root.querySelector('#rbRows'); if (el) el.innerHTML = st.rows.map(rowHtml).join(''); var c = root.querySelector('#rbCount'); if (c) c.textContent = st.rows.length + ' santri'; updSum(); }

  function quickHtml() {
    var cur = parseInt(st.infaq, 10) || 0;
    return '<div class="tile-grid">' + quick().map(function (n) { return '<label class="tile"><input type="radio" name="rbAmt" value="' + n + '"' + (cur === n ? ' checked' : '') + '><span><b>' + (n / 1000) + 'rb</b><small>' + U.rupiah(n) + '</small></span></label>'; }).join('') + '</div>';
  }
  function formHtml() {
    return '<div class="wrap"><div class="page-head"><div class="eyebrow">Khusus rombongan</div><h1>Pendaftaran Rombongan</h1>' +
      '<p>Untuk sekolah atau kelas yang mendaftar bersama. Cukup isi nama santri dan <b>nomor WhatsApp wali</b> masing-masing. E-tiket dikirim langsung ke WhatsApp tiap wali.</p></div>' +
      '<form id="rbForm" class="rb-form" novalidate>' +
      '<section class="card rb-card"><h2>1. Data Rombongan</h2>' +
      '<div class="field"><label class="lbl" for="rombongan">Nama sekolah / rombongan <span class="req">*</span></label><input class="input" id="rombongan" data-g="rombongan" placeholder="Contoh: SDIT Bina Insan Mulia - Kelas 5" value="' + esc(st.rombongan) + '"></div>' +
      '<div class="field"><label class="lbl" for="koordinator">Nama koordinator / guru <span class="opt">(opsional)</span></label><input class="input" id="koordinator" data-g="koordinator" value="' + esc(st.koordinator) + '"></div>' +
      '<div class="field"><label class="lbl" for="koordinatorWa">WhatsApp koordinator <span class="opt">(opsional)</span></label><input class="input" id="koordinatorWa" data-g="koordinatorWa" inputmode="tel" value="' + esc(st.koordinatorWa) + '"></div>' +
      '<div class="field"><label class="lbl" for="kode">Kode rombongan <span class="opt">(opsional)</span></label><div class="kode-row"><input class="input" id="kode" data-g="kode" autocapitalize="characters" maxlength="30" value="' + esc(st.kode) + '" placeholder="Bila diberi panitia"><button type="button" class="btn btn-soft" data-kode-cek>Terapkan</button></div><div class="kode-msg" id="kodeMsg" aria-live="polite"></div><div class="help">Kode dari panitia memberi potongan infaq per santri.</div></div></section>' +
      '<section class="card rb-card"><h2>2. Nominal Infaq per Santri</h2>' + quickHtml() + '<div class="field"><label class="lbl" for="rbInfaq">Atau nominal lain</label><div class="input-affix"><span class="pre" aria-hidden="true">Rp</span><input class="input" id="rbInfaq" inputmode="numeric" placeholder="Contoh: 175000" value="' + (quick().indexOf(parseInt(st.infaq, 10)) >= 0 ? '' : esc(st.infaq)) + '"></div><div class="help">Minimum ' + U.rupiah(minInfaq()) + ' per santri.</div></div><div id="rbSum">' + sumHtml() + '</div></section>' +
      '<section class="card rb-card"><div class="rb-head"><h2>3. Daftar Santri</h2><b id="rbCount">' + st.rows.length + ' santri</b></div>' +
      '<div id="rbRows" class="rb-rows">' + st.rows.map(rowHtml).join('') + '</div>' +
      '<button type="button" class="btn btn-soft" id="rbAdd">' + U.icon('plus') + ' Tambah santri</button></section>' +
      '<section class="card rb-card"><label class="check"><input type="checkbox" id="rbSetuju"' + (st.setuju ? ' checked' : '') + '><span>Saya menyetujui ketentuan &amp; tata tertib ' + esc(pub.pengaturan.nama_singkat) + ' dan menyatakan data yang diisi sudah benar.</span></label>' +
      '<div class="err-msg" id="rbErr" role="alert" aria-live="assertive"></div>' +
      '<button type="submit" class="btn btn-primary btn-xl btn-block" id="rbSend">Daftarkan Rombongan ' + U.icon('ticket') + '</button>' +
      '<p class="form-note">Pembayaran infaq rombongan diatur bersama panitia. Panitia akan menghubungi koordinator / wali.</p></section></form>' +
      '<p style="text-align:center;margin-top:16px"><a href="#/daftar">Daftar perorangan? Klik di sini</a></p></div>';
  }
  function doneHtml(r) {
    return '<div class="wrap"><section class="card rb-card rb-done"><div class="rb-ok">' + U.icon('check') + '</div><h1>Alhamdulillah, ' + r.items.length + ' santri terdaftar</h1>' +
      '<p>Rombongan <b>' + esc(r.rombongan) + '</b>. E-tiket dikirim ke WhatsApp masing-masing wali. Wali juga bisa membukanya lewat menu <a href="#/cek">Cek Status</a> dengan kode tiket dan nomor WhatsApp.</p>' +
      '<div class="rb-list">' + r.items.map(function (x) { return '<div><b>' + esc(x.kode) + '</b><span>' + esc(x.nama) + '</span><small>' + esc(x.wa) + '</small></div>'; }).join('') + '</div>' +
      '<a class="btn btn-ghost" href="#/">Kembali ke Beranda</a></section></div>';
  }
  function render() {
    if (!root) return;
    var s = pub.pendaftaran;
    if (st.done) { root.innerHTML = doneHtml(st.done); return; }
    if (s.status !== 'buka') { root.innerHTML = '<div class="wrap"><section class="card blocked"><h2>' + (s.status === 'penuh' ? 'Kuota Santri Sudah Penuh' : 'Pendaftaran Belum Dibuka / Sudah Ditutup') + '</h2><p>' + esc(s.pesan) + '</p></section></div>'; return; }
    root.innerHTML = formHtml();
  }
  function err(m) { var e = root.querySelector('#rbErr'); if (e) e.textContent = m || ''; }

  function validate() {
    if (st.rombongan.trim().length < 3) return 'Nama sekolah / rombongan wajib diisi.';
    if (st.koordinatorWa && !/^0\d{8,13}$/.test(normWa(st.koordinatorWa))) return 'Nomor WhatsApp koordinator tidak valid.';
    var seen = {};
    for (var i = 0; i < st.rows.length; i++) {
      var r = st.rows[i], n = 'Santri no. ' + (i + 1) + ': ';
      if (r.nama.trim().length < 3) return n + 'nama wajib diisi.';
      if (!r.gender) return n + 'pilih Ikhwan atau Akhwat.';
      if (!r.jenjang) return n + 'pilih jenjang SD atau SMP.';
      if (!r.ukuran) return n + 'pilih ukuran kaos.';
      if (!/^0\d{8,13}$/.test(normWa(r.wa))) return n + 'nomor WhatsApp wali tidak valid. Contoh: 081234567890.';
      var key = r.nama.trim().toLowerCase() + '|' + normWa(r.wa);
      if (seen[key]) return n + 'sama dengan baris sebelumnya.'; seen[key] = 1;
    }
    if (nominal() < minInfaq()) return 'Infaq minimal ' + U.rupiah(minInfaq()) + ' per santri.';
    if ((st.kode || '').trim() && !st.kodeInfo) return 'Tekan tombol Terapkan untuk memeriksa kode rombongan, atau kosongkan kolomnya.';
    if (!st.setuju) return 'Anda harus menyetujui ketentuan untuk melanjutkan.';
    return '';
  }
  function submit() {
    var m = validate(); if (m) { err(m); return; } err('');
    st.sending = true; var b = root.querySelector('#rbSend'); if (b) b.disabled = true;
    U.showBusy('Mendaftarkan rombongan…', 'Mohon jangan tutup halaman ini.');
    A.post('registerRombongan', {
      rombongan: st.rombongan.trim(), koordinator: st.koordinator.trim(), koordinatorWa: normWa(st.koordinatorWa), kode_rombongan: st.kodeInfo ? st.kodeInfo.kode : '', infaq: nominal(), setuju: true,
      santri: st.rows.map(function (r) { return { nama: r.nama.trim(), gender: r.gender, jenjang: r.jenjang, ukuran: r.ukuran, wa: normWa(r.wa) }; })
    }, 120000).then(function (r) {
      U.hideBusy(); st.sending = false;
      if (r && r.success) { st.done = r.data; render(); window.scrollTo({ top: 0 }); return; }
      err((r && r.message) || 'Pendaftaran gagal. Coba lagi.'); var b2 = root.querySelector('#rbSend'); if (b2) b2.disabled = false;
    }, function () { U.hideBusy(); st.sending = false; err('Koneksi terputus. Periksa internet lalu coba lagi.'); var b3 = root.querySelector('#rbSend'); if (b3) b3.disabled = false; });
  }

  function onInput(e) {
    var t = e.target, row = t.closest && t.closest('.rb-row');
    if (t.hasAttribute && t.hasAttribute('data-g')) { var v = t.value; if (t.getAttribute('data-g') === 'kode') { v = v.toUpperCase(); t.value = v; if (st.kodeInfo && st.kodeInfo.kode !== v.replace(/\s+/g, '')) { st.kodeInfo = null; var km = root.querySelector('#kodeMsg'); if (km) km.innerHTML = ''; updSum(); } } st[t.getAttribute('data-g')] = v; err(''); return; }
    if (t.name === 'rbAmt') { st.infaq = t.value; var c = root.querySelector('#rbInfaq'); if (c) c.value = ''; updSum(); err(''); return; }
    if (t.id === 'rbInfaq') { var dg = t.value.replace(/\D/g, '').slice(0, 9); t.value = dg; st.infaq = dg; root.querySelectorAll('input[name=rbAmt]').forEach(function (r) { r.checked = r.value === dg; }); updSum(); err(''); return; }
    if (t.id === 'rbSetuju') { st.setuju = t.checked; err(''); return; }
    if (!row) return;
    var i = +row.getAttribute('data-i'), k = t.getAttribute('data-k'); if (!k) return;
    if ((k === 'nama' || k === 'wa') && e.type !== 'input') return;
    st.rows[i][k] = t.value; err('');
    if (k === 'gender') { var u = sizesFor(t.value).filter(function (x) { return x.id === st.rows[i].ukuran; })[0]; if (!u) st.rows[i].ukuran = ''; renderRowAt(i); }
  }
  function renderRowAt(i) { var el = root.querySelector('.rb-row[data-i="' + i + '"]'); if (el) el.outerHTML = rowHtml(st.rows[i], i); }
  function onClick(e) {
    if (e.target.closest('[data-kode-cek]')) { e.preventDefault(); cekKode(); return; }
    if (e.target.closest('#rbAdd')) { if (st.rows.length >= MAX) return err('Maksimal ' + MAX + ' santri per pendaftaran.'); var prev = st.rows[st.rows.length - 1]; st.rows.push({ nama: '', gender: '', jenjang: prev ? prev.jenjang : '', wa: '', ukuran: '' }); renderRows(); var ins = root.querySelectorAll('.rb-row [data-k="nama"]'); if (ins.length) ins[ins.length - 1].focus(); return; }
    var d = e.target.closest('[data-del]'); if (d && st.rows.length > 1) { st.rows.splice(+d.getAttribute('data-del'), 1); renderRows(); }
  }
  function onSubmit(e) { if (e.target.id === 'rbForm') { e.preventDefault(); if (!st.sending) submit(); } }
  function bind(el) { [['input', onInput], ['change', onInput], ['click', onClick], ['submit', onSubmit]].forEach(function (h) { el.addEventListener(h[0], h[1]); handlers.push([el, h[0], h[1]]); }); }

  P.pages.rombongan = {
    title: 'Pendaftaran Rombongan — PASA 17',
    needsData: true,
    mount: function (el, data) { root = el; pub = data; if (!st) st = fresh(); bind(el); render(); },
    update: function (data) { var was = pub.pendaftaran.status; pub = data; if (root && data.pendaftaran.status !== was) render(); },
    unmount: function () { handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); }); handlers = []; root = null; }
  };
})();
