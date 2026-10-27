/* Portal admin — menu WhatsApp & Notifikasi: Blast, Antrean & Riwayat, Konfigurasi. */
(function () {
  'use strict';
  var P = window.PASA, U = P.ui, M = P.adm, h = M.h;
  U.addIcons({
    contacts: '<rect width="20" height="20" x="2" y="2" rx="3"/><circle cx="12" cy="9" r="3"/><path d="M6.5 19a5.5 5.5 0 0 1 11 0"/>'
  });
  var STATUS = ['Menunggu Bukti', 'Bukti Sedang Dicek', 'Lunas', 'Bukti Ditolak', 'Bayar Tunai'];
  var VARS = ['nama', 'santri', 'kode', 'status', 'acara', 'singkat', 'link_cek', 'link_grup', 'kontak_wa'];

  // ---------- helper bersama (dipakai juga oleh CRM) ----------
  M.waBadge = function (s) {
    return s === 'Terdaftar' ? '<span class="wa-badge ya">✓ WA</span>' : s === 'Tidak Terdaftar' ? '<span class="wa-badge tidak">✕ bukan WA</span>' : '<span class="wa-badge belum">? belum dicek</span>';
  };
  M.switchHtml = function (key, on, dis) {
    return '<button type="button" class="switch' + (on ? ' on' : '') + '" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-sw="' + h(key) + '"' + (dis ? ' disabled' : '') + '><i></i></button>';
  };
  function bubble(text) {
    return h(text).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  }
  function fill(tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null && v[k] !== '' ? v[k] : m; }); }
  function statBadge(s) {
    var c = s === 'Terkirim' || s === 'Selesai' ? 'badge-ok' : s === 'Gagal' ? 'badge-err' : s === 'Antri' || s === 'Proses' || s === 'Berjalan' ? 'badge-warn' : 'badge-wait';
    return '<span class="badge ' + c + '">' + h(s) + '</span>';
  }

  // Draf blast bertahan selama portal terbuka (pindah tab tidak menghapusnya).
  var W = { sumber: 'crm', f: { segmen: '', status: '', statusWA: '', tag: '', cari: '' }, teks: '', rows: [], ringkas: null, sel: {}, judul: '', pesan: '', batch: 20, jeda: '5',
    hanyaWa: false, label: '', active: null, auto: false };
  M.waPrefill = null;

  var TABS = [['blast', 'Blast WhatsApp'], ['antrean', 'Antrean & Riwayat'], ['konfigurasi', 'Konfigurasi']];

  M.pages.wa = function (el, arg) {
    var tab = TABS.filter(function (t) { return t[0] === arg; })[0] ? arg : 'blast', timers = [], alive = true;
    function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
    el.innerHTML = '<div class="page-head"><div><h1>WhatsApp &amp; Notifikasi</h1><p class="muted">Kirim pesan massal, pantau antrean, dan atur notifikasi otomatis (Fonnte + Email).</p></div></div>' +
      '<section class="card list-card"><div class="toolbar"><div class="tabs scroll" role="tablist">' + TABS.map(function (t) {
        return '<button type="button" role="tab" class="tab' + (t[0] === tab ? ' on' : '') + '" data-tab="' + t[0] + '" aria-selected="' + (t[0] === tab) + '">' + t[1] + '</button>';
      }).join('') + '</div></div></section><div id="wbody"></div>';
    el.addEventListener('click', function (e) { var t = e.target.closest('[data-tab]'); if (t) location.hash = '#/wa/' + t.getAttribute('data-tab'); });
    var body = el.querySelector('#wbody');
    if (tab === 'blast') blastTab(body, every, function () { return alive; });
    else if (tab === 'antrean') antreanTab(body, every, function () { return alive; });
    else konfigTab(body, function () { return alive; });
    return function () { alive = false; timers.forEach(clearInterval); };
  };

  // =====================================================================
  // TAB 1 — BLAST
  // =====================================================================
  function blastTab(box, every, isAlive) {
    var segs = [], busyDet = false, procBusy = false, count = 0;
    box.innerHTML = '<div class="wa-grid">' +
      '<section class="card pad"><h2>1. Pilih Sasaran</h2><div class="form-grid" id="wf"></div>' +
      '<div class="acts left"><button type="button" class="btn btn-primary" id="wLoad">' + U.icon('users') + ' Muat Penerima</button><button type="button" class="btn btn-soft" id="wDet">' + U.icon('phone') + ' Deteksi Nomor WA</button></div>' +
      '<div id="wsum" class="wa-sum"></div><div id="wlist"></div></section>' +
      '<section class="card pad"><h2>2. Tulis Pesan</h2>' + M.fieldHtml('w_judul', 'Judul (catatan internal)', { value: W.judul, ph: 'mis. Info jadwal kedatangan' }) +
      '<div class="field"><span class="lbl">Sisipkan variabel</span><div class="varbar">' + VARS.map(function (v) { return '<button type="button" class="btn btn-soft btn-sm" data-var="' + v + '">{' + v + '}</button>'; }).join('') + '</div></div>' +
      M.fieldHtml('w_pesan', 'Isi pesan', { type: 'textarea', rows: 7, value: W.pesan, ph: "Assalamu'alaikum {nama}, …", help: 'Gunakan *tebal* untuk huruf tebal. {nama} = nama wali.' }) +
      '<div class="wa-preview" id="wprev" aria-live="polite"></div>' +
      '<h2 class="mt">3. Ukuran Batch &amp; Jeda</h2><div class="seg-batch" id="wbatch" role="group" aria-label="Ukuran batch">' + [10, 20, 50].map(function (n) {
        return '<button type="button" data-b="' + n + '" class="' + (W.batch === n ? 'on' : '') + '">' + n + '</button>';
      }).join('') + '</div>' + M.fieldHtml('w_jeda', 'Jeda antarpesan (detik)', { value: W.jeda, help: 'Angka tetap (5) atau acak (3-8). Disarankan ≥ 5 detik agar nomor aman.' }) +
      '<p class="help" id="wplan"></p><div class="acts left"><button type="button" class="btn btn-ok btn-lg" id="wGo">' + U.icon('send') + ' Mulai Blast</button></div>' +
      '<p class="help">Tips anti-banned: gunakan nomor yang sudah “hangat”, mulai batch 10, jeda acak, dan jangan kirim tautan yang sama ke ratusan orang dalam 1 jam.</p></section></div>' +
      '<div id="wact"></div><section class="card pad"><div class="sec-h"><h2>Riwayat Blast</h2><button type="button" class="btn btn-soft btn-sm" id="wRef">' + U.icon('refresh') + ' Muat ulang</button></div><div id="whist">' + M.skeleton(1) + '</div></section>';

    function drawFilters() {
      var f = box.querySelector('#wf');
      var sel = function (id, label, opts, v) { return '<div class="field"><label class="lbl" for="' + id + '">' + label + '</label><select class="select" id="' + id + '">' + opts.map(function (o) { return '<option value="' + h(o[0]) + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select></div>'; };
      f.innerHTML = sel('wSumber', 'Sumber penerima', [['crm', 'Kontak CRM (wali santri & kontak luar)'], ['manual', 'Tempel nomor manual']], W.sumber) +
        (W.sumber === 'manual'
          ? M.fieldHtml('w_teks', 'Daftar nomor (satu per baris: 0812…|Nama)', { type: 'textarea', rows: 5, value: W.teks, cls: 'span2', ph: '081234567890|Bapak Ahmad\n081298765432|Ibu Siti' })
          : sel('wSeg', 'Segmen', [['', 'Semua segmen']].concat(segs.map(function (s) { return [s, s]; })), W.f.segmen) +
            sel('wSt', 'Status infaq (wali santri)', [['', 'Semua status']].concat(STATUS.map(function (s) { return [s, s]; })), W.f.status) +
            sel('wWa', 'Status WhatsApp', [['', 'Semua'], ['Terdaftar', 'Terdaftar WA'], ['Tidak Terdaftar', 'Bukan WA'], ['belum', 'Belum dicek']], W.f.statusWA) +
            M.fieldHtml('w_tag', 'Tag', { value: W.f.tag, ph: 'opsional' }) + M.fieldHtml('w_cari', 'Cari nama / nomor', { value: W.f.cari, cls: 'span2' }));
    }

    function validRow(r) { return r.valid && !r.ganda && !r.optOut; }
    function selectedRows() { return W.rows.filter(function (r) { return W.sel[r.id]; }); }
    function renderSum() {
      var s = W.ringkas, n = selectedRows().length;
      box.querySelector('#wsum').innerHTML = s ? '<span class="chipn">Total <b>' + s.total + '</b></span><span class="chipn ok">Valid <b>' + s.valid + '</b></span><span class="chipn err">Tidak valid <b>' + s.tidakValid + '</b></span><span class="chipn">Ganda <b>' + s.ganda + '</b></span><span class="chipn">Opt-out <b>' + s.optOut + '</b></span><span class="chipn ok">Terdaftar WA <b>' + s.terdaftarWA + '</b></span><span class="chipn">Bukan WA <b>' + s.tidakTerdaftarWA + '</b></span><span class="chipn">Terpilih <b>' + n + '</b></span>' +
        '<label class="check"><input type="checkbox" id="wOnly"' + (W.hanyaWa ? ' checked' : '') + '><span>Kirim hanya ke nomor terdeteksi WhatsApp</span></label>' : '';
      plan();
    }
    function renderList() {
      var l = box.querySelector('#wlist');
      if (!W.rows.length) { l.innerHTML = W.ringkas ? M.empty('users', 'Tidak ada penerima', 'Ubah filter lalu muat ulang.') : ''; renderSum(); return; }
      var show = W.rows.slice(0, 300), all = W.rows.every(function (r) { return !validRow(r) || W.sel[r.id]; });
      l.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th><input type="checkbox" id="wAll"' + (all ? ' checked' : '') + ' aria-label="Pilih semua"></th><th>Nama</th><th>Nomor</th><th>WA</th></tr></thead><tbody>' + show.map(function (r) {
        var off = !validRow(r);
        return '<tr class="' + (off ? 'off' : '') + '"><td><input type="checkbox" data-id="' + h(r.id) + '"' + (W.sel[r.id] ? ' checked' : '') + (off ? ' disabled' : '') + '></td><td><b>' + h(r.nama || '—') + '</b>' + (r.santri ? '<small>' + h(r.santri) + '</small>' : '') + '</td><td><span class="code">' + h(r.hp || '—') + '</span>' +
          (!r.valid ? '<small class="err">tidak valid</small>' : r.ganda ? '<small>ganda</small>' : r.optOut ? '<small>opt-out</small>' : '') + '</td><td>' + M.waBadge(r.statusWA) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (W.rows.length > 300 ? '<p class="help">Menampilkan 300 dari ' + W.rows.length + ' baris. Semua yang valid ikut terkirim bila dicentang “pilih semua”.</p>' : '');
      renderSum();
    }
    function plan() {
      var n = selectedRows().filter(function (r) { return !W.hanyaWa || r.statusWA !== 'Tidak Terdaftar'; }).length, b = Math.ceil(n / W.batch) || 0;
      box.querySelector('#wplan').textContent = n ? n + ' penerima → ' + b + ' batch · server mengirim 1 batch per menit (±' + b + ' menit), walau halaman ditutup.' : 'Pilih penerima terlebih dahulu.';
      box.querySelector('#wGo').innerHTML = U.icon('send') + ' Mulai Blast (' + n + ' nomor)';
      preview();
    }
    function preview() {
      var r = selectedRows()[0] || W.rows[0] || {}, pesan = (M.val(box, 'w_pesan') || W.pesan);
      var v = { nama: r.nama || 'Bapak/Ibu', santri: r.santri || 'Ananda', kode: r.kode || 'PASA-001' };
      box.querySelector('#wprev').innerHTML = pesan.trim() ? '<div class="bub">' + bubble(fill(pesan, v)) + '</div><small>Pratinjau dengan data penerima pertama</small>' : '<small>Pratinjau pesan tampil di sini.</small>';
    }

    function readFilters() {
      W.sumber = M.val(box, 'wSumber') || W.sumber;
      if (W.sumber === 'manual') W.teks = M.val(box, 'w_teks');
      else { W.f = { segmen: M.val(box, 'wSeg'), status: M.val(box, 'wSt'), statusWA: M.val(box, 'wWa'), tag: M.val(box, 'w_tag').trim(), cari: M.val(box, 'w_cari').trim() }; }
    }
    function selectDefault() {
      W.sel = {}; W.rows.forEach(function (r) { if (validRow(r) && !(W.hanyaWa && r.statusWA === 'Tidak Terdaftar')) W.sel[r.id] = true; });
    }
    function load(extra) {
      var btn = box.querySelector('#wLoad'); M.spinBtn(btn, true, 'Memuat…');
      var d = extra || (W.sumber === 'manual' ? { sumber: 'manual', teks: W.teks } : Object.assign({ sumber: 'crm' }, W.f));
      M.run('adminGetAudience', d, { timeout: 90000 }).then(function (r) {
        M.spinBtn(btn, false); if (!r || !isAlive()) return;
        W.rows = r.data.rows; W.ringkas = r.data.ringkas; selectDefault(); renderList();
      });
    }
    function deteksi() {
      if (busyDet) return;
      var todo = selectedRows().filter(function (r) { return r.valid && !r.statusWA; }).map(function (r) { return r.hp; });
      if (!todo.length) return U.toast('Semua penerima terpilih sudah dicek.', 'ok');
      busyDet = true; var btn = box.querySelector('#wDet'), done = 0, tot = todo.length, fail = false;
      function step() {
        if (!todo.length || fail || !isAlive()) { busyDet = false; M.spinBtn(btn, false); if (isAlive()) { recount(); renderList(); if (!fail) U.toast('Deteksi selesai.', 'ok'); } return; }
        var chunk = todo.splice(0, 50); M.spinBtn(btn, true, 'Mengecek ' + done + '/' + tot);
        M.run('adminWaValidate', { nomor: chunk }, { timeout: 90000 }).then(function (r) {
          if (!r) { fail = true; return step(); }
          done += chunk.length;
          W.rows.forEach(function (x) { var s = r.data.peta[x.hp]; if (s) x.statusWA = s; });
          step();
        });
      }
      step();
    }
    function recount() {
      var s = W.ringkas; if (!s) return; s.terdaftarWA = 0; s.tidakTerdaftarWA = 0; s.belumDicek = 0;
      W.rows.forEach(function (r) { if (r.statusWA === 'Terdaftar') s.terdaftarWA++; else if (r.statusWA === 'Tidak Terdaftar') s.tidakTerdaftarWA++; else s.belumDicek++; });
    }
    function start() {
      W.judul = M.val(box, 'w_judul').trim(); W.pesan = M.val(box, 'w_pesan'); W.jeda = M.val(box, 'w_jeda').trim() || '5';
      var rows = selectedRows().filter(function (r) { return !W.hanyaWa || r.statusWA !== 'Tidak Terdaftar'; });
      if (!W.judul) return U.toast('Isi judul blast.', 'err');
      if (!W.pesan.trim()) return U.toast('Isi pesan blast.', 'err');
      if (!rows.length) return U.toast('Belum ada penerima terpilih.', 'err');
      if (!/^\d{1,3}(-\d{1,3})?$/.test(W.jeda)) return U.toast('Jeda harus angka, mis. 5 atau 3-8.', 'err');
      var b = Math.ceil(rows.length / W.batch);
      M.confirm('Mulai blast?', 'Pesan dikirim ke ' + rows.length + ' nomor dalam ' + b + ' batch (jeda ' + W.jeda + ' detik). Pesan yang sudah terkirim tidak dapat ditarik.', 'Ya, mulai', false).then(function (ok) {
        if (!ok) return;
        var btn = box.querySelector('#wGo'); M.spinBtn(btn, true, 'Membuat blast…');
        M.run('adminBuatBlast', { judul: W.judul, pesan: W.pesan, ukuranBatch: W.batch, jeda: W.jeda, hanyaTerdaftar: W.hanyaWa,
          sasaranLabel: W.label || (W.sumber === 'manual' ? 'Nomor manual' : 'CRM' + (W.f.segmen ? ' · ' + W.f.segmen : '')),
          penerima: rows.map(function (r) { return W.sumber === 'manual' ? { hp: r.hp, nama: r.nama } : { kontakId: r.id }; }) }, { ok: true, timeout: 120000 }).then(function (r) {
          M.spinBtn(btn, false); if (!r || !isAlive()) return;
          W.active = r.data.blastId; W.auto = false; W.rows = []; W.ringkas = null; W.sel = {}; renderList(); loadHist(true);
        });
      });
    }

    // ----- blast aktif & riwayat -----
    var hist = [], trig = true;
    function drawActive() {
      var a = hist.filter(function (x) { return x.id === W.active; })[0], c = box.querySelector('#wact');
      if (!a) { c.innerHTML = ''; return; }
      var run = a.status === 'Berjalan';
      c.innerHTML = '<section class="card pad wa-active"><div class="sec-h"><div><h2>' + h(a.judul) + ' ' + statBadge(a.status) + '</h2><p class="muted">' + h(a.sasaran) + ' · batch ' + a.batch + ' · jeda ' + h(a.jeda) + ' dtk</p></div><button type="button" class="icon-btn sm" data-wclose aria-label="Tutup pantauan">' + U.icon('x') + '</button></div>' +
        '<div class="meter sage"><i style="width:' + a.persen + '%"></i></div><p class="wa-count"><b>' + a.terkirim + '</b> terkirim · <b>' + a.gagal + '</b> gagal · <b>' + a.sisa + '</b> sisa (' + a.persen + '%)</p>' +
        (!trig ? '<div class="alert alert-warn" role="alert">' + U.icon('alert') + '<span>Pengirim otomatis (trigger) belum terpasang. Jalankan fungsi <code>pasangTrigger</code> sekali di editor Apps Script, atau kirim batch manual dengan tombol di bawah.</span></div>' : '') +
        (run ? '<div class="acts left"><button type="button" class="btn btn-primary" data-wnext>' + U.icon('play') + ' Kirim Batch Berikutnya Sekarang</button>' +
          '<label class="check"><input type="checkbox" id="wAuto"' + (W.auto ? ' checked' : '') + '><span>Otomatis <b id="wcd"></b></span></label><button type="button" class="btn btn-no" data-wstop>' + U.icon('x') + ' Hentikan</button></div><p class="help">Server tetap mengirim 1 batch per menit walau halaman ini ditutup.</p>' : '') + '</section>';
    }
    function drawHist() {
      var c = box.querySelector('#whist');
      if (!hist.length) { c.innerHTML = M.empty('send', 'Belum ada blast'); return; }
      c.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Judul</th><th>Sasaran</th><th>Batch · jeda</th><th>Progres</th><th>Status</th><th></th></tr></thead><tbody>' + hist.map(function (x) {
        return '<tr data-id="' + h(x.id) + '"><td><b>' + h(x.judul) + '</b><small>' + h(M.fmtTime(x.tanggal)) + ' · ' + h(x.oleh) + '</small></td><td>' + h(x.sasaran) + '</td><td>' + x.batch + ' · ' + h(x.jeda) + ' dtk</td><td>' + x.terkirim + '/' + x.total + ' (' + x.persen + '%)' + (x.gagal ? ' <small class="err">' + x.gagal + ' gagal</small>' : '') + '</td><td>' + statBadge(x.status) + '</td><td class="nw"><button type="button" class="btn btn-soft btn-sm" data-wpan>Pantau</button>' + (x.status === 'Berjalan' ? ' <button type="button" class="btn btn-no btn-sm" data-wstop>Hentikan</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }
    function loadHist(first) {
      M.run('adminListBlast', {}, { quiet: true }).then(function (r) {
        if (!r || !isAlive()) return;
        hist = r.data.items; trig = r.data.triggerAktif; drawHist(); drawActive();
        if (first && !W.active) { var run = hist.filter(function (x) { return x.status === 'Berjalan'; })[0]; if (run) { W.active = run.id; drawActive(); } }
      });
    }
    function proses(id) {
      if (procBusy) return; procBusy = true;
      M.run('adminProsesBlast', { blastId: id || W.active }, { timeout: 90000 }).then(function (r) {
        procBusy = false; if (!r || !isAlive()) return;
        if (r.data && r.message) U.toast(r.message, 'ok');
        loadHist(false);
      });
    }
    function stop(id) {
      M.confirm('Hentikan blast?', 'Pesan yang belum terkirim dibatalkan. Yang sudah terkirim tetap terkirim.', 'Hentikan', true).then(function (ok) {
        if (ok) M.run('adminHentikanBlast', { blastId: id }, { ok: true }).then(function () { W.auto = false; loadHist(false); });
      });
    }

    // ----- hitung mundur otomatis -----
    function interval() {
      var a = hist.filter(function (x) { return x.id === W.active; })[0]; if (!a) return 60;
      var j = String(a.jeda).split('-').map(Number), avg = (j[0] + (j[1] != null ? j[1] : j[0])) / 2;
      return Math.max(30, Math.round(a.batch * avg));
    }
    every(function () {
      if (!isAlive()) return;
      var a = hist.filter(function (x) { return x.id === W.active; })[0], cd = box.querySelector('#wcd');
      if (!a || a.status !== 'Berjalan') { W.auto = false; return; }
      if (!W.auto) { if (cd) cd.textContent = ''; count = 0; return; }
      count++; var left = interval() - count; if (cd) cd.textContent = '(' + Math.max(0, left) + ' dtk)';
      if (left <= 0) { count = 0; proses(); }
    }, 1000);
    every(function () { if (!document.hidden && W.active) loadHist(false); }, 20000);

    // ----- event -----
    box.addEventListener('click', function (e) {
      var t = e.target;
      var v = t.closest('[data-var]'); if (v) { var ta = box.querySelector('#w_pesan'), s = ta.selectionStart || ta.value.length, txt = '{' + v.getAttribute('data-var') + '}'; ta.value = ta.value.slice(0, s) + txt + ta.value.slice(ta.selectionEnd || s); ta.focus(); ta.selectionStart = ta.selectionEnd = s + txt.length; W.pesan = ta.value; preview(); return; }
      var b = t.closest('[data-b]'); if (b) { W.batch = Number(b.getAttribute('data-b')); Array.prototype.forEach.call(box.querySelectorAll('#wbatch button'), function (x) { x.classList.toggle('on', x === b); }); plan(); return; }
      if (t.closest('#wLoad')) { readFilters(); W.label = ''; load(); return; }
      if (t.closest('#wDet')) return deteksi();
      if (t.closest('#wGo')) return start();
      if (t.closest('#wRef')) return loadHist(false);
      if (t.closest('[data-wnext]')) return proses();
      if (t.closest('[data-wclose]')) { W.active = null; W.auto = false; return drawActive(); }
      var row = t.closest('tr[data-id]');
      if (t.closest('[data-wpan]') && row) { W.active = row.getAttribute('data-id'); W.auto = false; drawActive(); box.querySelector('#wact').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (t.closest('[data-wstop]')) return stop(row ? row.getAttribute('data-id') : W.active);
    });
    box.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'wSumber') { readFilters(); drawFilters(); return; }
      if (t.id === 'wAuto') { W.auto = t.checked; count = 0; return; }
      if (t.id === 'wOnly') { W.hanyaWa = t.checked; selectDefault(); renderList(); return; }
      if (t.id === 'wAll') { W.sel = {}; if (t.checked) selectDefault(); renderList(); return; }
      var id = t.getAttribute && t.getAttribute('data-id'); if (id) { if (t.checked) W.sel[id] = true; else delete W.sel[id]; renderSum(); }
    });
    box.addEventListener('input', function (e) {
      if (e.target.id === 'w_pesan') { W.pesan = e.target.value; preview(); }
      else if (e.target.id === 'w_judul') W.judul = e.target.value;
      else if (e.target.id === 'w_jeda') W.jeda = e.target.value;
    });

    drawFilters(); renderList(); preview(); plan(); drawActive(); loadHist(true);
    M.run('adminGetCrmStats', {}, { quiet: true }).then(function (r) { if (r && isAlive()) { segs = Object.keys(r.data.segmen); var cur = box.querySelector('#wSeg'); if (cur) drawFilters(); } });
    if (M.waPrefill) {
      var p = M.waPrefill; M.waPrefill = null; W.sumber = 'crm'; W.label = p.label || 'Kontak terpilih'; W.f = { segmen: '', status: '', statusWA: '', tag: '', cari: '' };
      load({ sumber: 'crm', ids: p.ids });
    }
  }

  // =====================================================================
  // TAB 2 — ANTREAN & RIWAYAT
  // =====================================================================
  function antreanTab(box, every, isAlive) {
    var F = { status: '', kanal: '' };
    box.innerHTML = '<div id="aWarn"></div><div class="stats" id="aKpi"></div><section class="card list-card"><div class="toolbar"><div class="tb-right">' +
      '<select class="select sm" id="aSt" aria-label="Filter status"><option value="">Semua status</option><option>Antri</option><option>Proses</option><option>Terkirim</option><option>Gagal</option><option>Batal</option></select>' +
      '<select class="select sm" id="aKn" aria-label="Filter kanal"><option value="">WA &amp; Email</option><option value="WA">WhatsApp</option><option value="EMAIL">Email</option></select>' +
      '<button type="button" class="btn btn-soft" id="aNow">' + U.icon('play') + ' Proses Sekarang</button><button type="button" class="btn btn-soft" id="aRetry">' + U.icon('refresh') + ' Ulangi yang Gagal</button></div></div>' +
      '<div class="pad" id="aList">' + M.skeleton(2) + '</div></section>';
    function load() {
      M.run('adminListAntrean', F, { quiet: true }).then(function (r) {
        if (!isAlive()) return; if (!r) { box.querySelector('#aList').innerHTML = M.empty('alert', 'Gagal memuat antrean'); return; }
        var s = r.data.ringkas, it = r.data.items;
        box.querySelector('#aWarn').innerHTML = r.data.triggerAktif ? '' : '<div class="alert alert-warn" role="alert">' + U.icon('alert') + '<span>Pengirim otomatis belum terpasang, jadi pesan tidak terkirim sendiri. Jalankan fungsi <code>pasangTrigger</code> sekali di editor Apps Script (lihat panduan), atau tekan “Proses Sekarang”.</span></div>';
        box.querySelector('#aKpi').innerHTML = [['MENUNGGU', s.Antri + s.Proses, 'warn'], ['TERKIRIM', s.Terkirim, 'sage'], ['GAGAL', s.Gagal, 'orange'], ['DIBATALKAN', s.Batal, '']].map(function (k) {
          return '<div class="card stat"><small>' + k[0] + '</small><b>' + k[1] + '</b>' + (k[0] === 'MENUNGGU' && r.data.emailKuota != null ? '<p>Sisa kuota email hari ini: <b>' + r.data.emailKuota + '</b></p>' : '') + '</div>';
        }).join('');
        box.querySelector('#aList').innerHTML = it.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Kanal</th><th>Tujuan</th><th>Event</th><th>Pesan</th><th>Status</th></tr></thead><tbody>' + it.map(function (x) {
          return '<tr><td class="nw">' + h(M.fmtTime(x.dikirim || x.dibuat)) + '</td><td><span class="badge badge-wait">' + h(x.kanal) + '</span></td><td><span class="code">' + h(x.tujuan) + '</span>' + (x.nama ? '<small>' + h(x.nama) + '</small>' : '') + '</td><td>' + h(x.event) + '</td><td class="msg">' + h(x.pesan) + '</td><td>' + statBadge(x.status) + (x.respon && x.status !== 'Terkirim' ? '<small>' + h(x.respon) + '</small>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : M.empty('chat', 'Antrean kosong', 'Pesan otomatis dan blast akan muncul di sini.');
      });
    }
    box.addEventListener('change', function (e) { if (e.target.id === 'aSt') F.status = e.target.value; else if (e.target.id === 'aKn') F.kanal = e.target.value; else return; load(); });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('#aNow, #aRetry'); if (!b) return;
      M.spinBtn(b, true, 'Memproses…');
      M.run(b.id === 'aNow' ? 'adminProsesAntrean' : 'adminUlangiAntrean', {}, { ok: true, timeout: 90000 }).then(function () { M.spinBtn(b, false); load(); });
    });
    load(); every(function () { if (!document.hidden) load(); }, 15000);
  }

  // =====================================================================
  // TAB 3 — KONFIGURASI
  // =====================================================================
  function konfigTab(box, isAlive) {
    var C = null, tokDraft = '', open = {}, sample = { wali: 'Bapak Ahmad', nama: 'Zaid', kode: 'PASA-001', infaq: 'Rp 150.000', acara: 'Pesantren Anak Shaleh', singkat: 'PASA 17', link_cek: 'https://…/#/cek', link_grup: 'https://chat.whatsapp.com/…', kontak_wa: '0812…', alasan: 'Nominal tidak sesuai', wa: '0812…' };
    box.innerHTML = M.skeleton(3);
    M.run('adminGetNotifConfig', {}, { quiet: true }).then(function (r) {
      if (!isAlive()) return; if (!r) { box.innerHTML = M.empty('alert', 'Gagal memuat konfigurasi'); return; }
      C = r.data; draw();
    });
    function draw() {
      var evs = C.events;
      box.innerHTML = '<div class="cfg-grid"><section class="card pad"><div class="cfg-h"><h2>WhatsApp (Fonnte)</h2>' + M.switchHtml('waAktif', C.waAktif) + '</div>' +
        '<p class="help">Notifikasi WhatsApp <b>' + (C.waAktif ? 'AKTIF' : 'NONAKTIF') + '</b>. Daftar di fonnte.com → Device → scan QR nomor WhatsApp panitia → salin token.</p>' +
        '<p><span class="badge ' + (C.tokenAda ? 'badge-ok' : 'badge-wait') + '">' + (C.tokenAda ? 'Token terpasang ' + h(C.tokenMask) : 'Token belum dipasang') + '</span></p>' +
        '<div class="inline"><input class="input" id="c_tok" type="password" autocomplete="off" value="' + h(tokDraft) + '" placeholder="' + (C.tokenAda ? 'Ganti token (kosongkan bila tidak diubah)' : 'Tempel token Fonnte') + '" aria-label="Token Fonnte">' + (C.tokenAda ? '<button type="button" class="btn btn-soft" id="cTokDel">Hapus</button>' : '') + '</div>' +
        '<div class="acts left"><button type="button" class="btn btn-soft" id="cDev">' + U.icon('phone') + ' Cek Perangkat</button></div><div id="cDevOut"></div>' +
        '<div class="inline"><input class="input" id="c_to" type="tel" placeholder="081234567890" aria-label="Nomor tes"><button type="button" class="btn btn-dark" id="cTest">Kirim Tes WA</button></div>' +
        '<div class="form-grid mt">' + M.fieldHtml('c_pan', 'Penerima notifikasi panitia (nomor WhatsApp atau grup)', { value: C.waPanitia, type: 'text', cls: 'span2', help: 'Isi nomor (081234567890) atau pilih grup WhatsApp. Kosong = pakai WhatsApp panitia di Pengaturan › Beranda & Kontak. Untuk grup, nomor pengirim Fonnte harus sudah menjadi anggota grup.' }) +
        '<div class="field span2"><div class="acts left" style="margin-top:0"><button type="button" class="btn btn-soft btn-sm" id="cGrp">' + U.icon('users') + ' Pilih dari grup WhatsApp</button><button type="button" class="btn btn-soft btn-sm" id="cTesPan">Kirim tes ke penerima ini</button></div><div id="cGrpOut"></div></div>' +
        M.fieldHtml('c_situs', 'Alamat situs (untuk tautan Cek Pendaftaran)', { value: C.situsUrl, cls: 'span2', ph: 'https://pasa-17.github.io/' }) +
        '<div class="field"><span class="lbl">Ukuran batch bawaan</span><div class="seg-batch" id="cBatch">' + [10, 20, 50].map(function (n) { return '<button type="button" data-cb="' + n + '" class="' + (C.batch === n ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div></div>' +
        M.fieldHtml('c_jeda', 'Jeda antarpesan (detik)', { value: C.jeda, help: 'Mis. 5 atau 3-8.' }) +
        '<div class="field span2"><label class="check">' + M.switchHtml('deteksi', C.deteksi) + '<span>Cek otomatis nomor kontak baru terdaftar WhatsApp</span></label></div></div></section>' +

        '<section class="card pad"><div class="cfg-h"><h2>Email</h2>' + M.switchHtml('emailAktif', C.emailAktif) + '</div>' +
        '<p class="help">Notifikasi Email <b>' + (C.emailAktif ? 'AKTIF' : 'NONAKTIF') + '</b>. E-tiket saat pendaftaran tetap dikirim terpisah. Sisa kuota email hari ini: <b>' + (C.emailKuota == null ? '—' : C.emailKuota) + '</b> (Gmail biasa ±100/hari).</p>' +
        '<div class="inline"><input class="input" id="c_em" type="email" placeholder="email@contoh.com" aria-label="Email tes"><button type="button" class="btn btn-dark" id="cEmTest">Kirim Tes Email</button></div>' +
        '<h3 class="mt">Pengirim otomatis</h3><p><span class="badge ' + (C.triggerAktif ? 'badge-ok' : 'badge-err') + '">' + (C.triggerAktif ? 'Trigger aktif (tiap 1 menit)' : 'Trigger BELUM terpasang') + '</span></p>' +
        (C.triggerAktif ? '' : '<p class="help">Buka editor Apps Script, pilih fungsi <code>pasangTrigger</code>, tekan Jalankan, lalu beri izin. Cukup sekali.</p>') + '</section></div>' +

        '<section class="card pad"><h2>Matriks Notifikasi Otomatis</h2><p class="help">Pilih kejadian mana yang dikirim lewat WhatsApp dan/atau Email. Saklar utama di atas harus aktif.</p>' +
        '<div class="tbl-wrap"><table class="tbl mx"><thead><tr><th>Kejadian</th><th>Penerima</th><th>WA</th><th>Email</th><th></th></tr></thead><tbody>' + evs.map(function (ev) {
          var o = open[ev.kode];
          return '<tr data-ev="' + ev.kode + '"><td><b>' + h(ev.label) + '</b><small>' + h(ev.kode) + '</small></td><td>' + (ev.untuk === 'panitia' ? 'Panitia' : 'Wali') + '</td><td>' + M.switchHtml('ev:' + ev.kode + ':wa', ev.wa, !C.waAktif) + '</td><td>' + M.switchHtml('ev:' + ev.kode + ':email', ev.email, !C.emailAktif) + '</td><td><button type="button" class="btn btn-soft btn-sm" data-edit>' + U.icon('edit') + ' ' + (o ? 'Tutup' : 'Ubah') + '</button></td></tr>' +
            (o ? '<tr class="ed"><td colspan="5">' + M.fieldHtml('e_s_' + ev.kode, 'Subjek email', { value: ev.subjek }) + M.fieldHtml('e_p_' + ev.kode, 'Isi pesan', { type: 'textarea', rows: 8, value: ev.pesan, help: 'Variabel: ' + C.variabel.map(function (v) { return '<code>{' + v + '}</code>'; }).join(' ') }) +
              '<div class="wa-preview"><div class="bub" id="pv_' + ev.kode + '">' + bubble(fill(ev.pesan, sample)) + '</div><small>Pratinjau dengan data contoh</small></div><div class="acts left"><button type="button" class="btn btn-soft btn-sm" data-reset>' + U.icon('undo') + ' Kembalikan bawaan</button></div></td></tr>' : '');
        }).join('') + '</tbody></table></div>' +
        '<div class="acts left"><button type="button" class="btn btn-primary btn-lg" id="cSave">Simpan Konfigurasi</button></div></section>';
    }
    function collect() {
      var d = { waAktif: C.waAktif, emailAktif: C.emailAktif, batch: C.batch, jeda: M.val(box, 'c_jeda').trim(), deteksi: C.deteksi, waPanitia: M.val(box, 'c_pan').trim(), situsUrl: M.val(box, 'c_situs').trim(), matriks: {} };
      tokDraft = M.val(box, 'c_tok').trim(); if (tokDraft) d.token = tokDraft;
      C.events.forEach(function (ev) {
        var s = box.querySelector('#e_s_' + ev.kode), p = box.querySelector('#e_p_' + ev.kode);
        if (s) ev.subjek = s.value; if (p) ev.pesan = p.value;
        d.matriks[ev.kode] = { wa: ev.wa, email: ev.email, subjek: ev.subjek, pesan: ev.pesan };
      });
      return d;
    }
    function sync() { // simpan isian yang sedang diketik ke state sebelum menggambar ulang
      tokDraft = M.val(box, 'c_tok');       C.jeda = M.val(box, 'c_jeda') || C.jeda; C.waPanitia = M.val(box, 'c_pan'); C.situsUrl = M.val(box, 'c_situs');
      C.events.forEach(function (ev) { var s = box.querySelector('#e_s_' + ev.kode), p = box.querySelector('#e_p_' + ev.kode); if (s) ev.subjek = s.value; if (p) ev.pesan = p.value; });
    }
    box.addEventListener('click', function (e) {
      if (!C) return; var t = e.target;
      var sw = t.closest('[data-sw]');
      if (sw) {
        if (sw.disabled) return; sync(); var k = sw.getAttribute('data-sw'), m = k.split(':');
        if (m[0] === 'ev') { var ev = C.events.filter(function (x) { return x.kode === m[1]; })[0]; ev[m[2]] = !ev[m[2]]; } else C[k] = !C[k];
        draw(); return;
      }
      var cb = t.closest('[data-cb]'); if (cb) { sync(); C.batch = Number(cb.getAttribute('data-cb')); draw(); return; }
      var tr = t.closest('tr[data-ev]');
      if (tr && t.closest('[data-edit]')) { sync(); var kd = tr.getAttribute('data-ev'); open[kd] = !open[kd]; draw(); return; }
      var ed = t.closest('tr.ed'); if (ed && t.closest('[data-reset]')) { var prev = ed.previousElementSibling.getAttribute('data-ev'), ev2 = C.events.filter(function (x) { return x.kode === prev; })[0]; ev2.pesan = ev2.pesanDefault; ev2.subjek = ev2.subjekDefault; draw(); return; }
      if (t.closest('#cTokDel')) { M.confirm('Hapus token?', 'Notifikasi WhatsApp berhenti sampai token dipasang lagi.', 'Hapus', true).then(function (ok) { if (ok) save({ token: '__HAPUS__', waAktif: false }); }); return; }
      if (t.closest('#cDev')) { var b = t.closest('#cDev'); M.spinBtn(b, true, 'Mengecek…'); M.run('adminGetWaDevice', {}, { timeout: 60000 }).then(function (r) { M.spinBtn(b, false); var o = box.querySelector('#cDevOut'); if (!r || !o) return; var x = r.data; o.innerHTML = '<div class="alert alert-ok">' + U.icon('check-circle') + '<span>Nomor <b>' + h(x.nomor) + '</b> · status <b>' + h(x.status) + '</b> · paket ' + h(x.paket) + ' · kuota ' + h(x.kuota) + (x.kedaluwarsa ? ' · berlaku s/d ' + h(x.kedaluwarsa) : '') + '</span></div>'; }); return; }
      if (t.closest('#cGrp') || t.closest('[data-grpref]')) {
        var gb = t.closest('#cGrp') || t.closest('[data-grpref]'), refresh = !!t.closest('[data-grpref]');
        M.spinBtn(gb, true, 'Membaca grup…');
        M.run('adminWaGrupList', { segarkan: refresh }, { timeout: 90000 }).then(function (r) {
          M.spinBtn(gb, false); var o = box.querySelector('#cGrpOut'); if (!o || !r) return;
          o.innerHTML = '<div class="inline mt"><select class="select sm" id="cGrpSel" aria-label="Pilih grup WhatsApp" style="flex:1;width:auto;min-width:0"><option value="">— pilih grup —</option>' +
            r.data.rows.map(function (g) { return '<option value="' + h(g.id) + '">' + h(g.name || g.id) + '</option>'; }).join('') + '</select><button type="button" class="btn btn-soft btn-sm" data-grpref>Segarkan</button></div>' +
            '<p class="help">' + r.data.rows.length + ' grup terbaca. Pilih satu, lalu klik Simpan Konfigurasi.</p>';
        });
        return;
      }
      if (t.closest('#cTesPan')) { var bp = t.closest('#cTesPan'), tujuan = M.val(box, 'c_pan').trim(); if (!tujuan) { U.toast('Isi dulu nomor atau pilih grup penerima.', 'err'); return; } M.spinBtn(bp, true, 'Mengirim…'); M.run('adminWaUji', { to: tujuan }, { ok: true, timeout: 60000 }).then(function () { M.spinBtn(bp, false); }); return; }
      if (t.closest('#cTest')) { var b2 = t.closest('#cTest'); M.spinBtn(b2, true, 'Mengirim…'); M.run('adminWaUji', { to: M.val(box, 'c_to') }, { ok: true, timeout: 60000 }).then(function () { M.spinBtn(b2, false); }); return; }
      if (t.closest('#cEmTest')) { var b3 = t.closest('#cEmTest'); M.spinBtn(b3, true, 'Mengirim…'); M.run('adminNotifEmailUji', { email: M.val(box, 'c_em') }, { ok: true, timeout: 60000 }).then(function () { M.spinBtn(b3, false); }); return; }
      if (t.closest('#cSave')) save(null);
    });
    box.addEventListener('change', function (e) { if (e.target.id === 'cGrpSel' && e.target.value) { var pan = box.querySelector('#c_pan'); if (pan) pan.value = e.target.value; } });
    box.addEventListener('input', function (e) {
      var m = /^e_p_(\w+)$/.exec(e.target.id || ''); if (m) { var pv = box.querySelector('#pv_' + m[1]); if (pv) pv.innerHTML = bubble(fill(e.target.value, sample)); }
    });
    function save(over) {
      var d = Object.assign(collect(), over || {}), btn = box.querySelector('#cSave'); M.spinBtn(btn, true, 'Menyimpan…');
      M.run('adminSimpanNotifConfig', d, { ok: true, timeout: 90000 }).then(function (r) {
        if (!isAlive()) return; M.spinBtn(btn, false);
        if (r) { C = r.data; tokDraft = ''; draw(); if (C.peringatan) U.toast(C.peringatan, 'err'); }
      });
    }
  }
})();
