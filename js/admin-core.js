/* Portal admin — inti: sesi, pemanggilan API, helper umum. */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  var U = P.ui, A = P.api, esc = U.esc;
  var M = P.adm = { pages: {} };
  var KEY = 'pasa17.admin';
  var S = { token: '', nama: '', username: '' };

  U.addIcons({
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    verify: '<path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'eye-off': '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    key: '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    menu2: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'
  });

  // ---------- sesi ----------
  function load() { try { var o = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (o && o.token) S = o; } catch (e) { /* abaikan */ } }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* abaikan */ } }
  function clear() { S = { token: '', nama: '', username: '' }; SW = {}; if (typeof ST !== 'undefined') { ST.ready = false; ST.peserta = []; ST.checkin = []; ST.dash = null; } BK = {}; BKo = []; try { sessionStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }
  M.session = function () { return S; };
  M.setSession = function (d) { S = { token: d.token, nama: d.nama, username: d.username }; save(); };
  M.clearSession = clear;
  M.loadSession = load;
  M.onAuthLost = function () { };

  // Pemanggilan API admin. Sesi habis → kembali ke layar masuk.
  var READ = /^admin(List|Get|Log|Me|Dashboard|Export|Riwayat|Bootstrap|EmailUji)/;
  var SW = {};   // cache baca ringan untuk menu Konten/Pengaturan/Akun
  M.call = function (action, data, timeout) {
    if (!READ.test(action)) SW = {};
    return A.post(action, data || {}, timeout || 60000, S.token).then(function (r) {
      if (r && r.code === 'AUTH') { clear(); M.onAuthLost(r.message); var e = new Error(r.message); e.auth = true; throw e; }
      return r;
    });
  };
  // Versi ringkas: tampilkan toast bila gagal; kembalikan respons sukses atau null.
  M.run = function (action, data, o) {
    o = o || {};
    return M.call(action, data, o.timeout).then(function (r) {
      if (!r || !r.success) { if (!o.quiet) U.toast((r && r.message) || 'Gagal memproses.', 'err'); return null; }
      if (o.ok) U.toast(o.ok === true ? (r.message || 'Berhasil') : o.ok, 'ok');
      return r;
    }).catch(function (e) {
      if (e && e.auth) return null;
      if (!o.quiet) U.toast(e && e.message ? e.message : 'Tidak dapat terhubung ke server.', 'err');
      return null;
    });
  };

  // Tampilkan data tersimpan dulu (langsung), lalu segarkan dari server bila berbeda.
  // handler(r) dipanggil dengan cache, kemudian dengan data baru; r = null bila gagal dan belum ada cache.
  M.swr = function (action, data, handler) {
    var key = action + JSON.stringify(data || {}), hit = SW[key], seen = hit ? JSON.stringify(hit) : '';
    if (hit) handler(hit);
    M.run(action, data, { quiet: true }).then(function (r) {
      if (!r) { if (!hit) handler(null); return; }
      var now = JSON.stringify(r);
      SW[key] = r;
      if (!hit || now !== seen) handler(r);
    });
  };

  // ---------- penyimpanan data panitia ----------
  // Peserta, sesi, ukuran, dan check-in dimuat SEKALI lewat adminBootstrap lalu disimpan di memori
  // (sengaja tidak ditulis ke disk karena berisi data anak). Pencarian, filter, penghitungan, dan
  // perubahan status dikerjakan di browser, sehingga layar tidak menunggu server.
  var STATUS_L = ['Menunggu Bukti', 'Bukti Sedang Dicek', 'Lunas', 'Bukti Ditolak', 'Bayar Tunai'];
  var ST = { ready: false, peserta: [], sesi: [], ukuran: [], checkin: [], dash: null, at: 0 };
  var subs = [], inflight = null, pending = 0, refreshTimer = 0;
  function notify() { subs.slice().forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }
  function apply(d) {
    ST.peserta = d.peserta || []; ST.sesi = d.sesi || []; ST.ukuran = d.ukuran || []; ST.checkin = d.checkin || [];
    ST.dash = d.dashboard || null; ST.ready = true; ST.at = Date.now(); notify();
  }
  M.store = {
    data: ST,
    ready: function () { return ST.ready; },
    on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; },
    // force=false: pakai data bila masih baru (< 5 dtk). Mengembalikan promise; gagal bila server tak terjangkau.
    load: function (force) {
      if (inflight) return inflight;
      if (!force && ST.ready && Date.now() - ST.at < 5000) return Promise.resolve(ST);
      inflight = M.call('adminBootstrap', {}, 60000).then(function (r) {
        inflight = null;
        if (!r || !r.success) throw new Error((r && r.message) || 'Gagal memuat data.');
        if (pending > 0) { ST.at = Date.now(); return ST; }   // ada perubahan yang belum terkirim: jangan timpa tampilan
        apply(r.data); return ST;
      }, function (e) { inflight = null; throw e; });
      return inflight;
    },
    // Lacak perubahan yang sedang dikirim; setelah semuanya selesai, selaraskan dengan server secara diam-diam.
    track: function (promise) {
      pending++;
      var fin = function () {
        pending = Math.max(0, pending - 1);
        if (!pending) { clearTimeout(refreshTimer); refreshTimer = setTimeout(function () { M.store.load(true).catch(function () { }); }, 700); }
      };
      promise.then(fin, fin); return promise;
    },
    // Ubah baris peserta di memori; kembalikan fungsi pembatal.
    patch: function (ids, patch) {
      var set = {}; ids.forEach(function (i) { set[i] = 1; }); var old = [];
      ST.peserta.forEach(function (p) {
        if (!set[p.id]) return; var o = {};
        Object.keys(patch).forEach(function (k) { o[k] = p[k]; p[k] = patch[k]; }); p._s = null; old.push([p, o]);
      });
      notify();
      return function () { old.forEach(function (x) { Object.keys(x[1]).forEach(function (k) { x[0][k] = x[1][k]; }); x[0]._s = null; }); notify(); };
    },
    remove: function (ids) {
      var set = {}; ids.forEach(function (i) { set[i] = 1; });
      var gone = ST.peserta.filter(function (p) { return set[p.id]; });
      ST.peserta = ST.peserta.filter(function (p) { return !set[p.id]; }); notify();
      return function () { ST.peserta = ST.peserta.concat(gone); notify(); };
    },
    find: function (code) {
      code = String(code || '').trim().toUpperCase(); if (!code) return null;
      for (var i = 0; i < ST.peserta.length; i++) { var p = ST.peserta[i]; if ((p.qr && String(p.qr).toUpperCase() === code) || String(p.kode).toUpperCase() === code) return p; }
      return null;
    },
    addCheckin: function (c) { ST.checkin.unshift(c); notify(); return function () { var i = ST.checkin.indexOf(c); if (i >= 0) ST.checkin.splice(i, 1); notify(); }; },
    removeCheckin: function (c) { var i = ST.checkin.indexOf(c); if (i >= 0) { ST.checkin.splice(i, 1); notify(); } return function () { ST.checkin.unshift(c); notify(); }; },
    // Angka ringkasan dihitung ulang dari data lokal agar ikut berubah seketika.
    dashboard: function () {
      var d = Object.assign({}, ST.dash), rows = ST.peserta;
      var st = {}; STATUS_L.forEach(function (s) { st[s] = 0; }); var ter = 0, pen = 0, hari = {};
      rows.forEach(function (p) {
        st[p.statusInfaq] = (st[p.statusInfaq] || 0) + 1;
        if (p.statusInfaq === 'Lunas') ter += Number(p.infaq) || 0;
        if (p.statusInfaq === 'Bukti Sedang Dicek') pen += Number(p.infaq) || 0;
        var k = String(p.dibuat || '').slice(0, 10); if (k) hari[k] = (hari[k] || 0) + 1;
      });
      var sesi = ST.sesi.filter(function (s) { return s.aktif === 'true'; })[0], hadir = {};
      if (sesi) ST.checkin.forEach(function (c) { if (c.sesiId === sesi.id) hadir[c.pid] = 1; });
      d.totalPendaftar = rows.length; d.sisaKuota = Math.max(0, (d.kuota || 0) - rows.length);
      d.statusInfaq = st; d.infaq = Object.assign({}, d.infaq, { terhimpun: ter, pending: pen });
      d.rekapUkuran = ST.ukuran.map(function (u) { return { label: u.label, aktif: u.aktif === 'true', jumlah: rows.filter(function (p) { return p.ukuran === u.label; }).length }; });
      d.kehadiran = { hadir: Object.keys(hadir).length, total: rows.length, sesi: sesi ? sesi.nama : '' };
      d.grafikHarian = Object.keys(hari).sort().map(function (k) { return { tanggal: k, jumlah: hari[k] }; });
      return d;
    }
  };

  // Bukti transfer: diambil sekali, disimpan sementara (maks. 12), dan bisa dimuat lebih awal saat kursor di atas tombol.
  var BK = {}, BKo = [];
  M.bukti = function (id) {
    if (BK[id]) return BK[id];
    var pr = M.call('adminGetBukti', { id: id }, 90000).then(function (r) {
      if (!r || !r.success) throw new Error((r && r.message) || 'Bukti tidak dapat dimuat.');
      return r.data;
    });
    BK[id] = pr; BKo.push(id); if (BKo.length > 12) delete BK[BKo.shift()];
    pr.catch(function () { delete BK[id]; });
    return pr;
  };

  // ---------- helper ----------
  M.h = function (s) { return esc(s == null ? '' : s); };
  M.statusClass = function (s) {
    return s === 'Lunas' ? 'badge-ok' : s === 'Bukti Sedang Dicek' ? 'badge-warn' : s === 'Bukti Ditolak' ? 'badge-err' : 'badge-wait';
  };
  M.statusLabel = function (s) { return s === 'Bukti Sedang Dicek' ? 'Perlu Cek' : s; };
  M.fmtTime = function (s) { s = String(s || ''); return s.length >= 16 ? s.slice(8, 10) + '/' + s.slice(5, 7) + ' ' + s.slice(11, 16) : s; };
  M.waLink = function (wa, text) {
    var n = String(wa || '').replace(/\D/g, ''); if (n.charAt(0) === '0') n = '62' + n.slice(1);
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  };
  M.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };

  // Konfirmasi (pengganti confirm()). Mengembalikan Promise<boolean>.
  M.confirm = function (title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false, m;
      function end(v) { if (done) return; done = true; m.close(); resolve(v); }
      m = U.openModal({
        title: title, cls: 'confirm',
        html: '<p>' + M.h(text) + '</p><div class="acts"><button type="button" class="btn btn-soft" data-no>Batal</button><button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-yes>' + M.h(okLabel || 'Ya, lanjutkan') + '</button></div>',
        onClose: function () { if (!done) { done = true; resolve(false); } }
      });
      m.body.querySelector('[data-yes]').addEventListener('click', function () { end(true); });
      m.body.querySelector('[data-no]').addEventListener('click', function () { end(false); });
      m.body.querySelector('[data-no]').focus();
    });
  };

  // Pilih berkas gambar → dikecilkan di browser → {nama, base64, mime, size}.
  M.prepareImage = function (file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('Berkas belum dipilih.'));
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Format gambar harus JPG, PNG, atau WebP.'));
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(1, (maxSide || 1600) / Math.max(im.naturalWidth, im.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return reject(new Error('Gagal memproses gambar.'));
          var r = new FileReader();
          r.onload = function () { resolve({ nama: String(file.name || 'foto').replace(/\.[^.]*$/, ''), base64: r.result, mime: b.type, size: b.size }); };
          r.onerror = function () { reject(new Error('Gagal membaca gambar.')); };
          r.readAsDataURL(b);
        }, 'image/jpeg', quality || 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Berkas bukan gambar yang valid.')); };
      im.src = url;
    });
  };

  // Unggah foto situs ke Drive; kembalikan URL publik.
  M.uploadPhoto = function (file) {
    return M.prepareImage(file, 1600, 0.82).then(function (img) {
      return M.run('adminUploadMedia', { file: { nama: img.nama, base64: img.base64 } }, { timeout: 90000 });
    }).then(function (r) { return r ? r.data.url : null; }, function (e) { U.toast(e.message, 'err'); return null; });
  };

  // Unduh teks sebagai berkas.
  M.download = function (name, text, mime) {
    var b = new Blob(['﻿' + text], { type: mime || 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  M.empty = function (icon, title, text) {
    return '<div class="empty">' + U.icon(icon || 'info') + '<b>' + M.h(title) + '</b>' + (text ? '<p>' + M.h(text) + '</p>' : '') + '</div>';
  };
  M.skeleton = function (n) { var s = ''; for (var i = 0; i < (n || 3); i++) s += '<div class="skel" style="height:96px;margin-bottom:12px"></div>'; return s; };
  M.spinBtn = function (btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.l = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin sm" aria-hidden="true"></span>' + M.h(label || 'Memproses…'); }
    else { btn.disabled = false; if (btn.dataset.l) btn.innerHTML = btn.dataset.l; }
  };
  M.fieldHtml = function (id, label, o) {
    o = o || {};
    var tag = o.type === 'textarea'
      ? '<textarea class="textarea" id="' + id + '" rows="' + (o.rows || 3) + '"' + (o.ph ? ' placeholder="' + M.h(o.ph) + '"' : '') + '>' + M.h(o.value) + '</textarea>'
      : '<input class="input" id="' + id + '" type="' + (o.type || 'text') + '" value="' + M.h(o.value) + '"' + (o.ph ? ' placeholder="' + M.h(o.ph) + '"' : '') + (o.min != null ? ' min="' + o.min + '"' : '') + (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') + '>';
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label class="lbl" for="' + id + '">' + M.h(label) + (o.req ? '<span class="req">*</span>' : '') + '</label>' + tag + (o.help ? '<span class="help">' + o.help + '</span>' : '') + '</div>';
  };
  M.val = function (root, id) { var el = root.querySelector('#' + id); return el ? el.value : ''; };
})();
