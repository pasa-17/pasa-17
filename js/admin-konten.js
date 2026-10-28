/* Portal admin — Konten (CRUD modul), Pengaturan, Akun & Sistem. */
(function () {
  'use strict';
  var P = window.PASA, U = P.ui, M = P.adm, h = M.h;

  // =====================================================================
  // KONTEN — CRUD generik per modul
  // =====================================================================
  var MODS = [
    { key: 'kegiatan', label: 'Kegiatan', title: 'judul', sub: 'label', photo: 'foto_url', flag: 'tampil', hint: 'Kartu kegiatan di beranda.',
      fields: [['label', 'Label kecil', 'text', 'Contoh: Ruhani & Akademik'], ['judul', 'Judul', 'text', '', 1], ['deskripsi', 'Deskripsi', 'textarea'], ['info_kiri', 'Info kiri', 'text', 'Contoh: 3 Hari'], ['info_kanan', 'Info kanan', 'text', 'Contoh: Instruktur bersertifikat'], ['foto_url', 'Foto', 'photo']] },
    { key: 'fasilitas', label: 'Fasilitas', title: 'judul', sub: 'deskripsi', photo: 'foto_url', flag: 'tampil', hint: 'Daftar fasilitas di beranda.',
      fields: [['judul', 'Judul', 'text', '', 1], ['deskripsi', 'Deskripsi', 'textarea'], ['ikon', 'Ikon', 'select', [['mosque', 'Masjid / ibadah'], ['sports', 'Olahraga'], ['leaf', 'Alam'], ['food', 'Konsumsi'], ['shirt', 'Perlengkapan']]], ['foto_url', 'Foto (opsional)', 'photo']] },
    { key: 'fotostrip', label: 'Foto Bergerak', title: 'judul', sub: 'baris', subFmt: function (v) { return 'Baris ' + (v || 1); }, photo: 'foto_url', flag: 'tampil', hint: 'Foto yang bergulir di bagian "Potret Keceriaan". Pilih baris 1 atau 2.',
      fields: [['foto_url', 'Foto', 'photo', '', 1], ['judul', 'Keterangan', 'text'], ['baris', 'Baris', 'select', [['1', 'Baris 1'], ['2', 'Baris 2']]]] },
    { key: 'video', label: 'Video', title: 'judul', sub: 'url', flag: 'tampil', hint: 'Tempel tautan YouTube. Video diputar langsung di beranda.',
      fields: [['judul', 'Judul video', 'text'], ['url', 'Tautan YouTube', 'url', 'https://youtu.be/…', 1]] },
    { key: 'testimoni', label: 'Testimoni', title: 'nama', sub: 'isi', flag: 'tampil', hint: 'Diisi admin saja. Tampil dua baris di beranda.',
      fields: [['nama', 'Nama', 'text', '', 1], ['keterangan', 'Keterangan', 'text', 'Contoh: Wali Santri PASA 16'], ['isi', 'Isi testimoni', 'textarea', '', 1], ['rating', 'Bintang', 'select', [['5', '5'], ['4', '4'], ['3', '3'], ['2', '2'], ['1', '1']]], ['baris', 'Baris', 'select', [['1', 'Baris 1'], ['2', 'Baris 2']]]] },
    { key: 'medsos', label: 'Media Sosial', title: 'platform', sub: 'url', flag: 'tampil', hint: 'Tampil di footer, kontak, dan (opsional) email.',
      fields: [['platform', 'Platform', 'text', 'Instagram, YouTube, TikTok…', 1], ['url', 'Tautan', 'url', 'https://…', 1], ['di_email', 'Tampilkan di email', 'select', [['true', 'Ya'], ['false', 'Tidak']]]] },
    { key: 'ukuran', label: 'Ukuran Kaos', title: 'label', sub: 'lebar', subFmt: function (v, it) { return (it.untuk === 'L' ? 'Ikhwan' : it.untuk === 'P' ? 'Akhwat' : 'Ikhwan & Akhwat') + ' · ' + h(it.lebar) + ' × ' + h(it.panjang) + ' cm'; }, flag: 'aktif', flagLabel: 'Aktif', hint: 'Kaos Ikhwan dan Akhwat berbeda: buat baris terpisah untuk masing-masing (pilih kolom Untuk). Ukuran anak dalam cm (lebar × panjang). Ukuran yang sudah dipakai peserta hanya bisa dinonaktifkan.',
      fields: [['untuk', 'Untuk', 'select', [['', 'Ikhwan & Akhwat (sama)'], ['L', 'Ikhwan (laki-laki)'], ['P', 'Akhwat (perempuan)']]], ['label', 'Label', 'text', 'S, M, L, XL', 1], ['lebar', 'Lebar (cm)', 'number', '', 1], ['panjang', 'Panjang (cm)', 'number', '', 1]] },
    { key: 'sesi', label: 'Sesi Check-in', title: 'nama', flag: 'aktif', flagLabel: 'Aktif', hint: 'Sesi yang dipakai di Scan QR (bawaan: Kedatangan, Makan, Pulang).',
      fields: [['nama', 'Nama sesi', 'text', 'Contoh: Kedatangan', 1]] }
  ];

  function photoField(id, value, label) {
    return '<div class="field photo-field" data-pf="' + id + '"><span class="lbl">' + h(label) + '</span><div class="pf-box"><div class="pf-prev" id="' + id + '_p">' + (U.safeUrl(value) ? '<img src="' + h(U.safeUrl(value)) + '" alt="Pratinjau" referrerpolicy="no-referrer">' : U.icon('image')) + '</div>' +
      '<div class="pf-acts"><input type="hidden" id="' + id + '" value="' + h(value) + '"><input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" id="' + id + '_f"><button type="button" class="btn btn-soft btn-sm" data-pick>' + U.icon('upload') + ' Pilih foto</button><button type="button" class="btn btn-soft btn-sm" data-clear>Hapus</button></div></div><span class="help">Foto dikecilkan otomatis sebelum diunggah.</span></div>';
  }
  function bindPhotos(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.photo-field'), function (f) {
      var id = f.getAttribute('data-pf'), hid = f.querySelector('#' + id), file = f.querySelector('#' + id + '_f'), prev = f.querySelector('#' + id + '_p');
      function show() { prev.innerHTML = U.safeUrl(hid.value) ? '<img src="' + h(U.safeUrl(hid.value)) + '" alt="Pratinjau" referrerpolicy="no-referrer">' : U.icon('image'); }
      f.querySelector('[data-pick]').addEventListener('click', function () { file.click(); });
      f.querySelector('[data-clear]').addEventListener('click', function () { hid.value = ''; show(); });
      file.addEventListener('change', function () {
        var fl = file.files[0]; if (!fl) return;
        var btn = f.querySelector('[data-pick]'); M.spinBtn(btn, true, 'Mengunggah…');
        M.uploadPhoto(fl).then(function (url) { M.spinBtn(btn, false); if (url) { hid.value = url; show(); U.toast('Foto terunggah.', 'ok'); } file.value = ''; });
      });
    });
  }
  function inputFor(def, value) {
    var id = 'm_' + def[0], type = def[2], req = !!def[4];
    if (type === 'photo') return photoField(id, value, def[1]);
    if (type === 'select') return '<div class="field"><label class="lbl" for="' + id + '">' + h(def[1]) + '</label><select class="select" id="' + id + '">' + def[3].map(function (o) { return '<option value="' + h(o[0]) + '"' + (String(value || def[3][0][0]) === o[0] ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select></div>';
    return M.fieldHtml(id, def[1], { type: type === 'textarea' ? 'textarea' : type === 'number' ? 'number' : type === 'url' ? 'url' : 'text', value: value, ph: type === 'textarea' ? def[3] : def[3], req: req, cls: type === 'textarea' ? 'span2' : '' });
  }

  M.pages.konten = function (el, arg) {
    var cur = MODS[0], items = [], alive = true, seq = 0;
    var want = arg && MODS.filter(function (m) { return m.key === arg; })[0]; if (want) cur = want;
    el.innerHTML = '<div class="page-head"><div><h1>Kelola Konten</h1><p class="muted">Semua perubahan langsung tampil di situs publik.</p></div></div><section class="card list-card"><div class="toolbar"><div class="tabs scroll" id="mtabs" role="tablist"></div></div><div class="mod-head" id="mh"></div><div id="ml"></div></section>';
    function tabs() {
      el.querySelector('#mtabs').innerHTML = MODS.map(function (m) { return '<button type="button" role="tab" class="tab' + (m === cur ? ' on' : '') + '" data-m="' + m.key + '" aria-selected="' + (m === cur) + '">' + h(m.label) + '</button>'; }).join('');
    }
    function load() {
      var my = ++seq; tabs();
      el.querySelector('#mh').innerHTML = '<p class="muted">' + h(cur.hint || '') + '</p><button type="button" class="btn btn-primary btn-sm" id="mAdd">' + U.icon('plus') + ' Tambah</button>';
      el.querySelector('#ml').innerHTML = '<div class="pad">' + M.skeleton(3) + '</div>';
      M.swr('adminListModul', { modul: cur.key }, function (r) {
        if (!alive || my !== seq) return;
        if (!r) { el.querySelector('#ml').innerHTML = M.empty('alert', 'Gagal memuat'); return; }
        items = r.data.items; draw();
      });
    }
    function draw() {
      var box = el.querySelector('#ml');
      if (!items.length) { box.innerHTML = M.empty('layers', 'Belum ada data', 'Klik "Tambah" untuk membuat yang pertama.'); return; }
      box.innerHTML = '<ul class="mlist">' + items.map(function (it, i) {
        var on = it[cur.flag] !== 'false', sub = cur.subFmt ? cur.subFmt(it[cur.sub], it) : h(it[cur.sub] || '');
        return '<li data-id="' + h(it.id) + '" class="' + (on ? '' : 'off') + '">' +
          (cur.photo ? '<span class="th">' + (U.safeUrl(it[cur.photo]) ? '<img src="' + h(U.safeUrl(it[cur.photo])) + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : U.icon('image')) + '</span>' : '') +
          '<div class="mi"><b>' + h(it[cur.title] || '(tanpa judul)') + '</b><small>' + sub + '</small></div>' +
          '<div class="macts"><label class="tgl" title="' + (cur.flagLabel || 'Tampilkan') + '"><input type="checkbox" data-tgl' + (on ? ' checked' : '') + '><span>' + (cur.flagLabel || 'Tampil') + '</span></label>' +
          '<button type="button" class="icon-btn sm" data-up aria-label="Naik"' + (i === 0 ? ' disabled' : '') + '>' + U.icon('arrow-up') + '</button><button type="button" class="icon-btn sm" data-dn aria-label="Turun"' + (i === items.length - 1 ? ' disabled' : '') + '>' + U.icon('arrow-down') + '</button>' +
          '<button type="button" class="icon-btn sm" data-edit aria-label="Ubah">' + U.icon('edit') + '</button><button type="button" class="icon-btn sm danger" data-del aria-label="Hapus">' + U.icon('trash') + '</button></div></li>';
      }).join('') + '</ul>';
    }
    function form(it) {
      var edit = !!it; it = it || {};
      var m = U.openModal({ title: (edit ? 'Ubah ' : 'Tambah ') + cur.label, cls: 'wide', html: '<form id="mf" novalidate><div class="form-grid">' + cur.fields.map(function (d) { return inputFor(d, it[d[0]]); }).join('') + '</div><div class="acts"><button type="button" class="btn btn-soft" data-c>Batal</button><button type="submit" class="btn btn-primary" id="mOk">Simpan</button></div></form>' });
      bindPhotos(m.body);
      m.body.querySelector('[data-c]').addEventListener('click', m.close);
      m.body.querySelector('#mf').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var item = edit ? { id: it.id } : {};
        cur.fields.forEach(function (d) { item[d[0]] = M.val(m.body, 'm_' + d[0]).trim(); });
        if (edit && cur.flag) item[cur.flag] = it[cur.flag];
        var btn = m.body.querySelector('#mOk'); M.spinBtn(btn, true, 'Menyimpan…');
        M.run('adminSimpanModul', { modul: cur.key, item: item }, { ok: 'Tersimpan.' }).then(function (r) { M.spinBtn(btn, false); if (r) { m.close(); load(); } });
      });
    }
    function find(id) { return items.filter(function (x) { return x.id === id; })[0]; }
    function move(id, d) {
      var i = items.findIndex(function (x) { return x.id === id; }), j = i + d; if (j < 0 || j >= items.length) return;
      var t = items[i]; items[i] = items[j]; items[j] = t; draw();
      M.run('adminUrutModul', { modul: cur.key, ids: items.map(function (x) { return x.id; }) }, { quiet: false }).then(function (r) { if (!r) load(); });
    }
    el.addEventListener('click', function (e) {
      var t = e.target, tab = t.closest('[data-m]');
      if (tab) { cur = MODS.filter(function (m) { return m.key === tab.getAttribute('data-m'); })[0]; location.hash = '#/konten/' + cur.key; return; }
      if (t.closest('#mAdd')) return form(null);
      var li = t.closest('li[data-id]'); if (!li) return;
      var id = li.getAttribute('data-id');
      if (t.closest('[data-edit]')) return form(find(id));
      if (t.closest('[data-up]')) return move(id, -1);
      if (t.closest('[data-dn]')) return move(id, 1);
      if (t.closest('[data-del]')) {
        var it = find(id);
        M.confirm('Hapus "' + (it[cur.title] || 'data ini') + '"?', 'Data akan dihapus dari situs. Tindakan ini tidak dapat dibatalkan.', 'Hapus', true).then(function (ok) {
          if (ok) M.run('adminHapusModul', { modul: cur.key, id: id }, { ok: true }).then(function (r) { if (r) load(); });
        });
      }
    });
    el.addEventListener('change', function (e) {
      if (!e.target.matches('[data-tgl]')) return;
      var id = e.target.closest('li').getAttribute('data-id'), on = e.target.checked;
      M.run('adminTampilModul', { modul: cur.key, id: id, tampil: on }, { ok: true }).then(function (r) { if (!r) load(); else { var it = find(id); it[cur.flag] = on ? 'true' : 'false'; draw(); } });
    });
    load();
    return function () { alive = false; };
  };

  // =====================================================================
  // PENGATURAN
  // =====================================================================
  var SECTIONS = [
    { id: 'acara', label: 'Acara & Pendaftaran', fields: [
      ['nama_acara', 'Nama acara', 'text'], ['nama_singkat', 'Nama singkat', 'text'], ['lokasi', 'Lokasi', 'text'],
      ['tanggal_mulai', 'Tanggal mulai', 'date'], ['tanggal_selesai', 'Tanggal selesai', 'date'],
      ['kuota', 'Kuota santri', 'number'], ['usia_min', 'Usia minimal', 'number'], ['usia_maks', 'Usia maksimal', 'number'],
      ['pendaftaran_mode', 'Mode buka/tutup pendaftaran', 'select', [['manual', 'Manual (pakai tombol di Ringkasan)'], ['jadwal', 'Otomatis menurut jadwal']]],
      ['jadwal_buka', 'Jadwal buka (WIB)', 'datetime-local', 'Dipakai bila mode jadwal.'], ['jadwal_tutup', 'Jadwal tutup (WIB)', 'datetime-local'],
      ['pesan_tutup', 'Pesan saat ditutup', 'textarea'], ['pesan_penuh', 'Pesan saat kuota penuh', 'textarea'],
      ['syarat_teks', 'Syarat & ketentuan', 'textarea', 'Tampil di formulir dan beranda.'], ['panduan_acara', 'Panduan acara (tampil di e-tiket)', 'textarea'],
      ['perlengkapan', 'Perlengkapan yang dibawa santri', 'textarea', 'Tulis satu barang per baris (jaket, sajadah, dll). Otomatis dikirim lewat WhatsApp dan email ke wali setelah mendaftar, juga bila admin yang mendaftarkan.'],
      ['link_grup', 'Tautan grup WhatsApp wali', 'url', 'Hanya tampil setelah wali berhasil mendaftar.']] },
    { id: 'infaq', label: 'Infaq & Rekening', fields: [
      ['infaq_min', 'Infaq minimum (Rp)', 'number'], ['infaq_cepat', 'Nominal cepat (pisahkan koma)', 'text', 'Contoh: 100000,150000,200000,250000'], ['target_infaq', 'Target infaq (Rp)', 'number'],
      ['bank_nama', 'Nama bank', 'text'], ['bank_rekening', 'Nomor rekening', 'text', 'Wajib terisi sebelum pendaftaran dibuka.'], ['bank_atas_nama', 'Atas nama', 'text'], ['qris_url', 'Gambar QRIS', 'photo']] },
    { id: 'beranda', label: 'Beranda & Kontak', fields: [
      ['hero_judul', 'Judul hero', 'text'], ['hero_subjudul', 'Sub-judul hero', 'textarea'], ['hero_foto', 'Foto hero', 'photo'], ['logo_url', 'Logo', 'photo'],
      ['strip_judul', 'Judul foto bergerak', 'text'], ['strip_kecepatan', 'Kecepatan foto bergerak (detik/putaran; makin besar makin lambat)', 'number'],
      ['testi_judul', 'Judul testimoni', 'text'], ['testi_kecepatan', 'Kecepatan testimoni (detik/putaran)', 'number'],
      ['kontak_wa', 'WhatsApp panitia', 'text'], ['kontak_email', 'Email panitia', 'text'], ['kontak_hotline', 'Hotline', 'text'],
      ['alamat', 'Alamat', 'textarea'], ['peta_url', 'Tautan peta', 'url'], ['footer_teks', 'Teks footer', 'textarea'], ['warna_aksen', 'Warna aksen', 'color']] },
    { id: 'email', label: 'Email', fields: [
      ['email_nama_pengirim', 'Nama pengirim email', 'text'], ['email_medsos', 'Sertakan media sosial di email', 'select', [['true', 'Ya'], ['false', 'Tidak']]]] },
    { id: 'form', label: 'Field Formulir', custom: 'form' }
  ];

  function setField(def, v) {
    var id = 's_' + def[0], type = def[2], help = typeof def[3] === 'string' ? def[3] : '';
    if (type === 'photo') return photoField(id, v, def[1]);
    if (type === 'select') return '<div class="field"><label class="lbl" for="' + id + '">' + h(def[1]) + '</label><select class="select" id="' + id + '">' + def[3].map(function (o) { return '<option value="' + h(o[0]) + '"' + (String(v) === o[0] ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select></div>';
    if (type === 'textarea') return M.fieldHtml(id, def[1], { type: 'textarea', rows: /^wa_pesan/.test(def[0]) ? 8 : 4, value: v, help: h(help), cls: 'span2' });
    return M.fieldHtml(id, def[1], { type: type, value: v, help: h(help) });
  }

  M.pages.pengaturan = function (el, arg) {
    var dirty = false;
    var cfg = null, fc = null, sec = SECTIONS.filter(function (s) { return s.id === arg; })[0] || SECTIONS[0], alive = true;
    el.innerHTML = '<div class="page-head"><div><h1>Pengaturan</h1><p class="muted">Atur acara, infaq, tampilan beranda, dan formulir.</p></div></div><section class="card list-card"><div class="toolbar"><div class="tabs scroll" id="stabs" role="tablist"></div></div><div class="pad" id="sbody">' + M.skeleton(3) + '</div></section>';
    function tabs() {
      el.querySelector('#stabs').innerHTML = SECTIONS.map(function (s) { return '<button type="button" role="tab" class="tab' + (s === sec ? ' on' : '') + '" data-s="' + s.id + '" aria-selected="' + (s === sec) + '">' + h(s.label) + '</button>'; }).join('');
    }
    function draw() {
      tabs();
      var b = el.querySelector('#sbody');
      if (sec.custom === 'form') {
        b.innerHTML = '<p class="help">Atur kolom formulir pendaftaran: tampilkan, wajibkan, dan ubah labelnya. Kolom inti (nama, tanggal lahir, wali, WhatsApp, email, kaos, infaq) selalu tampil.</p><div class="fc-list">' +
          Object.keys(fc).map(function (k) { var f = fc[k]; return '<div class="fc-row" data-k="' + h(k) + '"><input class="input" data-l value="' + h(f.label) + '" aria-label="Label ' + h(k) + '"><label class="check"><input type="checkbox" data-t' + (f.tampil ? ' checked' : '') + '><span>Tampil</span></label><label class="check"><input type="checkbox" data-w' + (f.wajib ? ' checked' : '') + '><span>Wajib</span></label></div>'; }).join('') +
          '</div><div class="acts left"><button type="button" class="btn btn-primary" id="sSave">Simpan pengaturan</button></div>';
        return;
      }
      b.innerHTML = '<form id="sf" novalidate><div class="form-grid">' + sec.fields.map(function (d) { return setField(d, cfg[d[0]] == null ? '' : cfg[d[0]]); }).join('') + '</div><div class="acts left"><button type="submit" class="btn btn-primary" id="sSave">Simpan pengaturan</button></div></form>' +
        (sec.id === 'email' ? '<hr><div id="tpl"></div>' : '');
      bindPhotos(b);
      if (sec.id === 'email') emailTools(b.querySelector('#tpl'));
      b.querySelector('#sf').addEventListener('submit', function (e) { e.preventDefault(); save(); });
    }
    function save() {
      var btn = el.querySelector('#sSave'), body = el.querySelector('#sbody'), p = {};
      if (sec.custom === 'form') {
        var o = {}; Array.prototype.forEach.call(body.querySelectorAll('.fc-row'), function (r) {
          o[r.getAttribute('data-k')] = { label: r.querySelector('[data-l]').value.trim(), tampil: r.querySelector('[data-t]').checked, wajib: r.querySelector('[data-w]').checked };
        });
        p.field_config = o;
      } else {
        sec.fields.forEach(function (d) {
          var v = M.val(body, 's_' + d[0]); p[d[0]] = (d[2] === 'textarea') ? v : v.trim();
          if (d[2] === 'datetime-local' && p[d[0]] && p[d[0]].length > 16) p[d[0]] = p[d[0]].slice(0, 16);
        });
      }
      M.spinBtn(btn, true, 'Menyimpan…');
      M.run('adminSimpanPengaturan', { pengaturan: p }, { ok: 'Pengaturan disimpan.' }).then(function (r) {
        M.spinBtn(btn, false);
        if (r) { Object.keys(p).forEach(function (k) { if (k === 'field_config') { Object.keys(p.field_config).forEach(function (f) { fc[f] = Object.assign({}, fc[f], p.field_config[f]); }); } else cfg[k] = p[k]; }); }
      });
    }
    function emailTools(box) {
      box.innerHTML = '<h3>Template email e-tiket</h3><div id="tplb">' + M.skeleton(1) + '</div>';
      M.run('adminGetTemplate', {}, { quiet: true }).then(function (r) {
        var b = box.querySelector('#tplb'); if (!b) return;
        if (!r) { b.innerHTML = M.empty('alert', 'Gagal memuat template'); return; }
        b.innerHTML = '<div class="form-grid">' + M.fieldHtml('t_subjek', 'Subjek', { value: r.data.subjek, cls: 'span2' }) + M.fieldHtml('t_isi', 'Isi email (HTML sederhana)', { type: 'textarea', rows: 10, value: r.data.isi, cls: 'span2', help: 'Placeholder: ' + r.data.placeholder.map(function (x) { return '<code>' + h(x) + '</code>'; }).join(' ') }) + '</div>' +
          '<div class="acts left"><button type="button" class="btn btn-primary" id="tSave">Simpan template</button></div>' +
          '<h3>Kirim email uji</h3><div class="inline"><input class="input" id="t_to" type="email" placeholder="email@contoh.com" aria-label="Email tujuan uji"><button type="button" class="btn btn-dark" id="tTest">Kirim uji</button></div>';
        b.querySelector('#tSave').addEventListener('click', function () { var btn = this; M.spinBtn(btn, true, 'Menyimpan…'); M.run('adminSimpanTemplate', { subjek: M.val(b, 't_subjek'), isi: M.val(b, 't_isi') }, { ok: true }).then(function () { M.spinBtn(btn, false); }); });
        b.querySelector('#tTest').addEventListener('click', function () { var btn = this; M.spinBtn(btn, true, 'Mengirim…'); M.run('adminEmailUji', { to: M.val(b, 't_to') }, { ok: true, timeout: 90000 }).then(function () { M.spinBtn(btn, false); }); });
      });
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-s]'); if (t) { location.hash = '#/pengaturan/' + t.getAttribute('data-s'); return; }
      if (e.target.closest('#sSave') && sec.custom === 'form') save();
    });
    el.addEventListener('input', function () { dirty = true; });
    M.swr('adminGetPengaturan', {}, function (r) {
      if (!alive || (dirty && r)) return;
      if (!r) { el.querySelector('#sbody').innerHTML = M.empty('alert', 'Gagal memuat pengaturan'); return; }
      cfg = r.data.pengaturan; fc = r.data.fieldConfig; draw();
    });
    return function () { alive = false; };
  };

  // =====================================================================
  // AKUN & SISTEM
  // =====================================================================
  M.pages.akun = function (el) {
    var alive = true, me = M.session();
    el.innerHTML = '<div class="page-head"><div><h1>Akun & Sistem</h1><p class="muted">Kelola akun panitia, password, dan riwayat aktivitas.</p></div></div>' +
      '<section class="card pad"><div class="sec-h"><div><span class="eyebrow">Akun panitia</span><h2>Admin</h2></div><button type="button" class="btn btn-primary btn-sm" id="aAdd">' + U.icon('plus') + ' Tambah admin</button></div><div id="alist">' + M.skeleton(1) + '</div></section>' +
      '<section class="card pad"><span class="eyebrow">Keamanan</span><h2>Ganti Password Saya</h2><form id="pw" novalidate><div class="form-grid">' +
      M.fieldHtml('pw0', 'Password lama', { type: 'password', autocomplete: 'current-password', cls: 'span2' }) + M.fieldHtml('pw1', 'Password baru', { type: 'password', autocomplete: 'new-password', help: 'Minimal 8 karakter, mengandung huruf dan angka.' }) + M.fieldHtml('pw2', 'Ulangi password baru', { type: 'password', autocomplete: 'new-password' }) +
      '</div><div class="acts left"><button type="submit" class="btn btn-primary" id="pwOk">Ganti password</button></div></form></section>' +
      '<section class="card pad"><div class="sec-h"><div><span class="eyebrow">Jejak audit</span><h2>Log Aktivitas</h2></div><button type="button" class="btn btn-soft btn-sm" id="lRef">' + U.icon('refresh') + ' Muat ulang</button></div><div id="llist">' + M.skeleton(1) + '</div></section>';

    function loadAdm() {
      M.swr('adminListAdmin', {}, function (r) {
        if (!alive) return; var b = el.querySelector('#alist');
        if (!r) { b.innerHTML = M.empty('alert', 'Gagal memuat'); return; }
        b.innerHTML = '<ul class="trash-list">' + r.data.items.map(function (a) {
          return '<li data-id="' + h(a.id) + '"><div><b>' + h(a.nama) + (a.username === me.username ? ' <span class="badge badge-ok">Anda</span>' : '') + '</b><small>@' + h(a.username) + ' · dibuat ' + h(M.fmtTime(a.dibuat)) + (a.aktif ? '' : ' · nonaktif') + '</small></div><div>' +
            '<button type="button" class="btn btn-soft btn-sm" data-name>' + U.icon('edit') + ' Nama</button><button type="button" class="btn btn-soft btn-sm" data-reset>' + U.icon('key') + ' Reset password</button>' +
            '<button type="button" class="btn ' + (a.aktif ? 'btn-danger' : 'btn-ok') + ' btn-sm" data-act="' + (a.aktif ? '0' : '1') + '">' + (a.aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button></div></li>';
        }).join('') + '</ul>';
      });
    }
    function loadLog() {
      M.swr('adminLog', { limit: 100 }, function (r) {
        if (!alive) return; var b = el.querySelector('#llist');
        if (!r || !r.data.items.length) { b.innerHTML = M.empty('history', 'Belum ada aktivitas'); return; }
        b.innerHTML = '<div class="logs">' + r.data.items.map(function (l) { return '<div class="logrow"><time>' + h(M.fmtTime(l.waktu)) + '</time><b>' + h(l.admin) + '</b><span class="code">' + h(l.aksi) + '</span><small>' + h(l.detail) + '</small></div>'; }).join('') + '</div>';
      });
    }
    function pwModal(title, withName, cb, name) {
      var m = U.openModal({ title: title, html: '<form id="pm" novalidate>' + (withName ? M.fieldHtml('pm_u', 'Username', { ph: 'huruf kecil, angka, titik, strip', req: 1 }) + M.fieldHtml('pm_n', 'Nama tampilan', { req: 1 }) : '') + (withName === 'name' ? '' : M.fieldHtml('pm_p', 'Password' + (withName ? '' : ' baru'), { type: 'password', autocomplete: 'new-password', help: 'Minimal 8 karakter, huruf dan angka.', req: 1 })) + '<div class="acts"><button type="button" class="btn btn-soft" data-c>Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div></form>' });
      m.body.querySelector('[data-c]').addEventListener('click', m.close);
      m.body.querySelector('#pm').addEventListener('submit', function (e) { e.preventDefault(); cb(m); });
      return m;
    }
    el.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('#aAdd')) {
        pwModal('Tambah admin', true, function (m) {
          M.run('adminTambahAdmin', { username: M.val(m.body, 'pm_u'), nama: M.val(m.body, 'pm_n'), password: M.val(m.body, 'pm_p') }, { ok: true }).then(function (r) { if (r) { m.close(); loadAdm(); } });
        });
        return;
      }
      if (t.closest('#lRef')) return loadLog();
      var li = t.closest('li[data-id]'); if (!li) return;
      var id = li.getAttribute('data-id');
      if (t.closest('[data-reset]')) pwModal('Reset password', false, function (m) {
        M.run('adminResetPassword', { id: id, passwordBaru: M.val(m.body, 'pm_p') }, { ok: true }).then(function (r) { if (r) m.close(); });
      });
      if (t.closest('[data-name]')) {
        var m2 = U.openModal({ title: 'Ubah nama', html: '<form id="nm" novalidate>' + M.fieldHtml('nm_n', 'Nama tampilan', { value: li.querySelector('b').firstChild.textContent.trim() }) + '<div class="acts"><button type="button" class="btn btn-soft" data-c>Batal</button><button type="submit" class="btn btn-primary">Simpan</button></div></form>' });
        m2.body.querySelector('[data-c]').addEventListener('click', m2.close);
        m2.body.querySelector('#nm').addEventListener('submit', function (ev) { ev.preventDefault(); M.run('adminUbahAdmin', { id: id, nama: M.val(m2.body, 'nm_n') }, { ok: true }).then(function (r) { if (r) { m2.close(); loadAdm(); } }); });
      }
      var ac = t.closest('[data-act]');
      if (ac) {
        var on = ac.getAttribute('data-act') === '1';
        M.confirm(on ? 'Aktifkan akun?' : 'Nonaktifkan akun?', on ? 'Akun dapat masuk kembali.' : 'Akun tidak dapat masuk lagi sampai diaktifkan.', on ? 'Aktifkan' : 'Nonaktifkan', !on).then(function (ok) {
          if (ok) M.run('adminUbahAdmin', { id: id, aktif: on }, { ok: true }).then(function () { loadAdm(); });
        });
      }
    });
    el.querySelector('#pw').addEventListener('submit', function (e) {
      e.preventDefault();
      var n1 = M.val(el, 'pw1'), n2 = M.val(el, 'pw2');
      if (n1 !== n2) return U.toast('Password baru dan ulangannya tidak sama.', 'err');
      var btn = el.querySelector('#pwOk'); M.spinBtn(btn, true, 'Menyimpan…');
      M.run('adminGantiPassword', { passwordLama: M.val(el, 'pw0'), passwordBaru: n1 }, { ok: true }).then(function (r) { M.spinBtn(btn, false); if (r) e.target.reset(); });
    });
    loadAdm(); loadLog();
    return function () { alive = false; };
  };
})();
