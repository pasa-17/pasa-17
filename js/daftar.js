/* Halaman Formulir Pendaftaran — 5 langkah */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, S = P.shared, A = P.api;
  var esc = U.esc;

  var STEPS = [
    { t: 'Santri', ic: 'user' }, { t: 'Orang Tua', ic: 'users' }, { t: 'Kaos', ic: 'shirt' },
    { t: 'Infaq', ic: 'wallet' }, { t: 'Syarat', ic: 'shield' }
  ];
  var MAX_BYTES = 4 * 1024 * 1024;

  function fresh() {
    return { step: 1, d: { nama: '', panggilan: '', gender: '', tgl_lahir: '', jenjang: '', sekolah: '', alamat: '', prov: '', kota: '', kec: '', desa: '', wali: '', wa: '', email: '', cara: 'transfer', ukuran: '', infaq: '', medis: '', setuju: false }, bukti: null, err: {}, sending: false };
  }
  var st = fresh(), root = null, pub = null, guard = null;

  // ---------- alamat berjenjang: provinsi > kota/kab > kecamatan > desa ----------
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
  var WLEVEL = { prov: ['prov', 'provinces.json', null], kota: ['kota', 'regencies/', 'prov'], kec: ['kec', 'districts/', 'kota'], desa: ['desa', 'villages/', 'kec'] };
  function wilList(level) {
    if (level === 'prov') return W.prov || [];
    var par = st.d[WLEVEL[level][2]]; return (par && W[level][par]) || [];
  }
  function wilName(level) {
    var id = st.d[level], l = wilList(level);
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return titleCase(l[i].name);
    return '';
  }
  function optHtml(level, ph) {
    var l = wilList(level), cur = st.d[level];
    return '<option value="">' + esc(ph) + '</option>' + l.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === cur ? ' selected' : '') + '>' + esc(titleCase(o.name)) + '</option>'; }).join('');
  }
  function wilSel(level, lbl, ph) {
    var dis = level !== 'prov' && !st.d[WLEVEL[level][2]];
    return fld(level, lbl, '<select class="select" id="' + level + '" name="' + level + '"' + (dis ? ' disabled' : '') + ' aria-describedby="' + level + '-e">' + optHtml(level, ph) + '</select>', { req: true });
  }
  function wilFill(level) {
    var el = root && root.querySelector('#' + level); if (!el) return;
    var ph = { prov: 'Pilih provinsi', kota: 'Pilih kota / kabupaten', kec: 'Pilih kecamatan', desa: 'Pilih desa / kelurahan' }[level];
    var par = level === 'prov' ? 'x' : st.d[WLEVEL[level][2]];
    var wait = level === 'prov' ? !W.prov : (par && !W[level][par]);
    el.innerHTML = wait ? '<option value="">Memuat…</option>' : optHtml(level, ph);
    el.disabled = !par || wait;
  }
  function wilLoad(level) {
    var key = level === 'prov' ? 'prov' : level + ':' + st.d[WLEVEL[level][2]];
    var par = level === 'prov' ? '' : st.d[WLEVEL[level][2]];
    if (level !== 'prov' && !par) { wilFill(level); return; }
    if ((level === 'prov' && W.prov) || (level !== 'prov' && W[level][par])) { wilFill(level); return; }
    if (W.busy[key]) return;
    W.busy[key] = 1; wilFill(level);
    wilGet(level, par).then(function (a) {
      if (level === 'prov') W.prov = a; else W[level][par] = a;
      delete W.busy[key]; wilFill(level);
    }, function () {
      delete W.busy[key]; W.fail = true;
      if (st.step === 1 && root && root.querySelector('#formCard')) renderStep(false);
    });
  }
  function wilInit() { if (fcAlamatRol()) { wilLoad('prov'); wilLoad('kota'); wilLoad('kec'); wilLoad('desa'); } }
  function fcAlamatRol() { return fc('alamat').tampil && !W.fail; }
  function wilChange(level) {
    var order = ['prov', 'kota', 'kec', 'desa'], i = order.indexOf(level);
    for (var j = i + 1; j < order.length; j++) { st.d[order[j]] = ''; clearErr(order[j]); }
    if (i < 3) { wilLoad(order[i + 1]); for (var k = i + 2; k < 4; k++) wilFill(order[k]); }
    composeAlamat();
  }
  function composeAlamat() {
    if (!fcAlamatRol()) return;
    var parts = [wilName('desa') && ('Desa/Kel. ' + wilName('desa')), wilName('kec') && ('Kec. ' + wilName('kec')), wilName('kota'), wilName('prov')].filter(Boolean);
    st.d.alamat = (st.d.prov && st.d.kota && st.d.kec && st.d.desa) ? parts.join(', ') : '';
  }

  // ---------- util ----------
  function fc(k) { return Object.assign({ tampil: true, wajib: true, label: '' }, ((pub && pub.fieldConfig) || {})[k] || {}); }
  function p() { return pub.pengaturan; }
  function ageAtEvent(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
    var b = iso.split('-').map(Number), r = String(p().tanggal_mulai).split('-').map(Number), a = r[0] - b[0];
    if (r[1] < b[1] || (r[1] === b[1] && r[2] < b[2])) a--;
    return a;
  }
  function validDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false;
    var x = iso.split('-').map(Number), d = new Date(Date.UTC(x[0], x[1] - 1, x[2]));
    return d.getUTCFullYear() === x[0] && d.getUTCMonth() === x[1] - 1 && d.getUTCDate() === x[2];
  }
  function normWa(v) {
    var d = String(v || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
    if (d.indexOf('62') === 0) d = '0' + d.slice(2); else if (d.charAt(0) === '8') d = '0' + d;
    return d;
  }
  function size() { var u = (pub.ukuran || []).filter(function (x) { return x.label === st.d.ukuran; })[0]; return u || null; }
  function quick() { return String(p().infaq_cepat || '').split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return n > 0; }); }
  function minInfaq() { return parseInt(p().infaq_min, 10) || 0; }
  function label(k, def) { return fc(k).label || def; }

  // ---------- kerangka ----------
  function banner() {
    var cd = U.countdown(p()), k = pub.kuota || {};
    return '<section class="reg-banner" aria-labelledby="h-reg"><div><div class="top"><span class="reg-ic">' + (U.safeUrl(p().logo_url) ? '<img src="' + esc(U.safeUrl(p().logo_url)) + '" alt="" referrerpolicy="no-referrer">' : U.icon('tent')) + '</span><div>' +
      '<div class="badges">' + S.regBadge(pub) + (pub.pendaftaran.status === 'buka' ? '<span class="badge badge-glass">Kuota tersisa ' + k.sisa + ' santri</span>' : '') + (cd ? '<span class="badge badge-glass">' + U.icon('clock') + ' ' + esc(cd.label) + '</span>' : '') + '</div>' +
      '<h1 id="h-reg">Formulir Peserta ' + esc(p().nama_singkat) + '</h1>' +
      '<p>' + esc(p().lokasi) + ', ' + esc(U.fmtRange(p().tanggal_mulai, p().tanggal_selesai)) + '. Lengkapi formulir bertahap di bawah untuk mencetak e-tiket &amp; QR registrasi santri.</p></div></div></div>' +
      '<span class="badge badge-glass safe">' + U.icon('lock') + ' Koneksi aman (HTTPS)</span></section>';
  }
  function stepper() {
    return '<nav class="stepper" aria-label="Langkah pendaftaran"><ol>' + STEPS.map(function (s, i) {
      var n = i + 1, cls = n < st.step ? 'done' : n === st.step ? 'cur' : '';
      return '<li class="' + cls + '"><button type="button" data-goto="' + n + '"' + (n < st.step ? '' : ' disabled') + (n === st.step ? ' aria-current="step"' : '') + '>' +
        '<span class="dotc">' + U.icon(n < st.step ? 'check' : s.ic) + '</span><span class="st-lbl">' + n + '. ' + s.t + '</span></button></li>';
    }).join('') + '</ol></nav>';
  }
  function aside() {
    return '<aside class="reg-aside" aria-label="Ringkasan"><section class="card sum-card" aria-labelledby="h-sum"><div class="sum-head"><h3 id="h-sum">' + U.icon('idcard') + ' Ringkasan Pendaftar</h3><span class="badge" id="sumStep"></span></div>' +
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
    var d = st.d, a = ageAtEvent(d.tgl_lahir), z = size(), amt = parseInt(d.infaq, 10) || 0;
    var gl = d.gender === 'L' ? 'Ikhwan' : d.gender === 'P' ? 'Akhwat' : '';
    var el = root.querySelector('#sumBody'); if (!el) return;
    root.querySelector('#sumStep').textContent = 'Tahap ' + st.step + ' / 5';
    el.innerHTML = '<div class="mini-ticket"><div class="mt-top"><span>' + esc(p().nama_singkat) + ' • ' + esc(String(p().lokasi).split(/[,&]/)[0].replace(/\s+$/, '')) + '</span><b>' + (st.step === 5 ? 'Siap dikirim' : 'Draft') + '</b></div>' +
      '<div class="nm">' + esc(d.nama || 'Nama calon santri') + '</div>' +
      '<div class="sub">' + (gl ? esc(gl) : '—') + (a != null && a >= 0 ? ' &bull; Usia ' + a + ' th' : '') + '</div>' +
      '<div class="mt-grid"><div><small>Kaos peserta</small><b>' + (z ? esc(z.label) + ' (' + esc(z.lebar) + ' × ' + esc(z.panjang) + ' cm)' : '—') + '</b></div>' +
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

  function stepHtml() {
    var d = st.d, q, h = '';
    if (st.step === 1) {
      var a = ageAtEvent(d.tgl_lahir), umin = +p().usia_min, umax = +p().usia_maks;
      h += '<div class="row">' + fld('nama', 'Nama Lengkap Calon Santri', txt('nama', 'Contoh: Muhammad Azzam Alfatih', { ac: 'off', max: 100 }), { req: true }) + '</div>';
      var two = '';
      if (fc('panggilan').tampil) two += fld('panggilan', esc(label('panggilan', 'Nama Panggilan di Camp')), txt('panggilan', 'Contoh: Azzam', { max: 40 }), { req: fc('panggilan').wajib, opt: !fc('panggilan').wajib });
      if (fc('gender').tampil) two += group('gender', esc(label('gender', 'Jenis Kelamin')), fc('gender').wajib,
        '<div class="chips seg"><label class="chip"><input type="radio" name="gender" value="L"' + (d.gender === 'L' ? ' checked' : '') + '><span>Ikhwan (L)</span></label><label class="chip"><input type="radio" name="gender" value="P"' + (d.gender === 'P' ? ' checked' : '') + '><span>Akhwat (P)</span></label></div>');
      if (two) h += '<div class="row two">' + two + '</div>';
      h += '<div class="row two">' + fld('tgl_lahir', 'Tanggal Lahir (usia ' + umin + '–' + umax + ' th)', '<input class="input" id="tgl_lahir" name="tgl_lahir" type="date" value="' + esc(d.tgl_lahir) + '" max="' + U.todayWib() + '" aria-describedby="tgl_lahir-h tgl_lahir-e">',
        { req: true, help: '<span id="agePill">' + agePill(a) + '</span>' }) +
        group('jenjang', 'Jenjang', true, '<div class="chips seg"><label class="chip"><input type="radio" name="jenjang" value="SD"' + (d.jenjang === 'SD' ? ' checked' : '') + '><span>SD</span></label><label class="chip"><input type="radio" name="jenjang" value="SMP"' + (d.jenjang === 'SMP' ? ' checked' : '') + '><span>SMP</span></label></div>') + '</div>';
      if (fc('alamat').tampil && !W.fail) {
        var wj = fc('alamat').wajib;
        h += '<div class="row"><div class="alert alert-info">' + U.icon('info') + '<span>Alamat tempat tinggal santri: pilih dari daftar mulai dari provinsi sampai desa/kelurahan.</span></div></div>' +
          '<div class="row two">' + wilSel('prov', 'Provinsi', 'Pilih provinsi') + wilSel('kota', 'Kota / Kabupaten', 'Pilih kota / kabupaten') + '</div>' +
          '<div class="row two">' + wilSel('kec', 'Kecamatan', 'Pilih kecamatan') + wilSel('desa', 'Desa / Kelurahan', 'Pilih desa / kelurahan') + '</div>';
      } else if (fc('alamat').tampil) h += (W.fail ? '<div class="row"><div class="alert alert-warn">' + U.icon('alert') + '<span>Daftar wilayah belum bisa dimuat. Silakan ketik alamat lengkap. <small>(' + esc(String(W.err || '')) + ')</small></span></div></div>' : '') + '<div class="row">' + fld('alamat', esc(label('alamat', 'Alamat Lengkap Santri')), '<textarea class="textarea" id="alamat" name="alamat" rows="2" maxlength="300" placeholder="Jalan, RT/RW, desa/kelurahan, kecamatan, kota, provinsi" aria-describedby="alamat-h alamat-e">' + esc(d.alamat) + '</textarea>', { req: fc('alamat').wajib, opt: !fc('alamat').wajib }) + '</div>';
      if (fc('sekolah').tampil) h += '<div class="row">' + fld('sekolah', esc(label('sekolah', 'Asal Sekolah & Tingkat Kelas')), txt('sekolah', 'Contoh: SDIT Al-Ukhuwah / Kelas 5', { max: 120 }), { req: fc('sekolah').wajib, opt: !fc('sekolah').wajib }) + '</div>';
    } else if (st.step === 2) {
      h += '<div class="row">' + fld('wali', 'Nama Wali (Ayah/Ibu)', txt('wali', 'Contoh: Hendra Setiawan', { ac: 'name', max: 100 }), { req: true }) + '</div>' +
        '<div class="row two">' + fld('wa', 'Nomor WhatsApp Aktif', txt('wa', 'Contoh: 0812 3456 7890', { type: 'tel', im: 'tel', ac: 'tel', max: 20 }), { req: true, help: 'Dipakai panitia menghubungi wali dan untuk menu Cek Pendaftaran.' }) +
        fld('email', 'Alamat Email', txt('email', 'contoh@email.com', { type: 'email', im: 'email', ac: 'email', max: 120 }), { opt: true, help: 'Boleh dikosongkan. Bila diisi, e-tiket juga dikirim ke email ini; bila kosong, kabar dikirim lewat WhatsApp.' }) + '</div>' +
        '<div class="alert alert-info">' + U.icon('info') + '<span>Satu formulir untuk satu anak. Bila mendaftarkan lebih dari satu anak, isi formulir lagi setelah selesai.</span></div>';
    } else if (st.step === 3) {
      var us = pub.ukuran || [];
      h += group('ukuran', 'Ukuran Kaos Lapangan', true, '<div class="tile-grid">' + us.map(function (u) {
        return '<label class="tile"><input type="radio" name="ukuran" value="' + esc(u.label) + '"' + (d.ukuran === u.label ? ' checked' : '') + '><span><b>' + esc(u.label) + '</b><small>' + esc(u.lebar) + ' × ' + esc(u.panjang) + ' cm</small></span></label>';
      }).join('') + '</div>') +
        '<div class="alert alert-info">' + U.icon('info') + '<span>Ukuran kaos <b>anak</b>, tertera <b>lebar × panjang</b> dalam sentimeter. Ukur kaos yang biasa dipakai ananda lalu cocokkan.</span></div>';
    } else if (st.step === 4) {
      q = quick();
      var cur = parseInt(d.infaq, 10) || 0, isQuick = q.indexOf(cur) >= 0;
      h += group('amt', 'Nominal Infaq Operasional', true, '<div class="tile-grid">' + q.map(function (n) {
        return '<label class="tile"><input type="radio" name="amt" value="' + n + '"' + (isQuick && cur === n ? ' checked' : '') + '><span><b>' + (n / 1000) + 'rb</b><small>' + U.rupiah(n) + '</small></span></label>';
      }).join('') + '</div>') +
        fld('infaq', 'Atau nominal lain', '<div class="input-affix"><span class="pre" aria-hidden="true">Rp</span><input class="input" id="infaq" name="infaq" inputmode="numeric" autocomplete="off" value="' + (isQuick || !cur ? '' : cur) + '" placeholder="Contoh: 175000" aria-describedby="infaq-h infaq-e"></div>',
          { help: 'Minimum ' + U.rupiah(minInfaq()) + '. Boleh lebih sebagai infaq sukarela. <span id="infaqFmt"></span>' }) +
        group('cara', 'Cara Pembayaran', true, '<div class="chips seg"><label class="chip"><input type="radio" name="cara" value="transfer"' + (d.cara !== 'tunai' ? ' checked' : '') + '><span>Transfer sekarang</span></label><label class="chip"><input type="radio" name="cara" value="tunai"' + (d.cara === 'tunai' ? ' checked' : '') + '><span>Bayar tunai ke panitia</span></label></div>');
      if (d.cara === 'tunai') {
        h += '<div class="alert alert-info">' + U.icon('info') + '<span><b>Bayar tunai.</b> Infaq diserahkan langsung kepada panitia (tidak perlu bukti transfer). Pendaftaran Anda tercatat dengan status <b>Bayar Tunai</b> dan menjadi <b>Lunas</b> setelah panitia menerima pembayaran. Konfirmasi dan e-tiket dikirim lewat WhatsApp.</span></div>';
      } else {
        h += '<div><div class="lbl" style="margin-bottom:8px">Transfer ke rekening resmi</div>' + S.rekening(p(), { cls: 'rek-box' }) + '</div>' +
          fld('bukti', 'Bukti Transfer', buktiHtml(), { req: true, help: 'Foto otomatis dikecilkan agar cepat terkirim. Bukti hanya dapat dilihat panitia.' });
      }
    } else {
      var z = size(), amt = parseInt(d.infaq, 10) || 0, a2 = ageAtEvent(d.tgl_lahir);
      function grp(title, goto, rows) {
        return '<div class="review"><div style="align-items:center"><b>' + title + '</b><button type="button" class="review-edit" data-goto="' + goto + '">Ubah</button></div>' +
          rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1] || '—') + '</dd></div>'; }).join('') + '</div>';
      }
      h += '<dl style="display:grid;gap:12px;margin:0">' +
        grp('Santri', 1, [['Nama', d.nama], ['Jenis kelamin', d.gender === 'L' ? 'Ikhwan (L)' : d.gender === 'P' ? 'Akhwat (P)' : ''], ['Tanggal lahir', U.fmtDate(d.tgl_lahir) + (a2 != null ? ' (usia ' + a2 + ' th)' : '')], ['Sekolah', (d.jenjang ? d.jenjang + ' · ' : '') + d.sekolah], ['Alamat', d.alamat]]) +
        grp('Orang tua', 2, [['Wali', d.wali], ['WhatsApp', normWa(d.wa)], ['Email', d.email || 'Tidak diisi (konfirmasi lewat WhatsApp)']]) +
        grp('Kaos & infaq', 4, [['Kaos', z ? z.label + ' (' + z.lebar + ' × ' + z.panjang + ' cm)' : ''], ['Infaq', U.rupiah(amt)], ['Cara bayar', d.cara === 'tunai' ? 'Tunai ke panitia' : 'Transfer'], d.cara === 'tunai' ? ['Bukti transfer', 'Tidak diperlukan'] : ['Bukti transfer', st.bukti ? st.bukti.nama : '']]) + '</dl>' +
        fld('medis', esc(label('medis', 'Catatan Medis / Alergi')), '<textarea class="textarea" id="medis" name="medis" maxlength="1000" placeholder="Contoh: alergi udang, asma ringan, atau tulis &quot;-&quot; bila tidak ada" aria-describedby="medis-h medis-e">' + esc(d.medis) + '</textarea>',
          { req: fc('medis').wajib, opt: !fc('medis').wajib, help: 'Membantu tim medis camp menyiapkan penanganan yang tepat.' }) +
        '<div class="field" data-f="setuju"><label class="check"><input type="checkbox" id="setuju" name="setuju"' + (d.setuju ? ' checked' : '') + ' aria-describedby="setuju-e"><span>Saya menyetujui <a href="#" data-syarat>ketentuan &amp; tata tertib</a> ' + esc(p().nama_singkat) + ' dan menyatakan data yang diisi sudah benar.</span></label><div class="err-msg" id="setuju-e" role="alert"></div></div>' +
        '<div id="submitErr" aria-live="assertive"></div>';
    }
    var nextLbl = ['Lanjut: Kontak Wali', 'Lanjut: Ukuran Kaos', 'Lanjut: Infaq', 'Lanjut: Persetujuan', 'Daftarkan &amp; Dapatkan E-Tiket'][st.step - 1];
    return '<form id="regForm" novalidate><div class="step-no">Langkah ' + st.step + ' dari 5</div><h2 id="stepTitle" tabindex="-1">' +
      ['Identitas Lengkap Calon Santri', 'Kontak Wali Santri', 'Ukuran Kaos Peserta', 'Infaq &amp; Bukti Transfer', 'Catatan Medis &amp; Persetujuan'][st.step - 1] + '</h2>' +
      '<div class="form-body">' + h + '</div><div class="form-nav">' +
      (st.step > 1 ? '<button type="button" class="btn btn-ghost btn-lg" data-prev>' + U.icon('arrow-left') + ' Kembali</button>' : '') +
      '<button type="submit" class="btn btn-primary btn-lg"' + (st.sending ? ' disabled' : '') + '>' + nextLbl + ' ' + U.icon(st.step === 5 ? 'ticket' : 'arrow-right') + '</button></div></form>';
  }
  function agePill(a) {
    if (a == null) return 'Usia dihitung pada hari acara (' + esc(U.fmtDate(p().tanggal_mulai)) + ').';
    var ok = a >= +p().usia_min && a <= +p().usia_maks;
    return '<span class="age-pill' + (ok ? '' : ' bad') + '">' + U.icon(ok ? 'check' : 'alert') + ' Usia pada hari acara: ' + a + ' tahun' + (ok ? '' : ' — di luar batas ' + esc(p().usia_min) + '–' + esc(p().usia_maks) + ' tahun') + '</span>';
  }
  function buktiHtml() {
    var b = st.bukti;
    return '<label class="drop' + (b ? ' has-file' : '') + '" id="drop"><input type="file" id="buktiFile" accept="image/jpeg,image/png,image/webp,application/pdf" aria-describedby="bukti-h bukti-e">' +
      '<span class="ic">' + (b && b.preview ? '<img src="' + esc(b.preview) + '" alt="Pratinjau bukti transfer">' : U.icon(b ? 'file' : 'upload')) + '</span>' +
      '<span><b>' + (b ? esc(b.nama) : 'Pilih atau seret berkas bukti transfer') + '</b><small>' + (b ? Math.max(1, Math.round(b.size / 1024)) + ' KB · siap dikirim' : 'JPG, PNG, WebP, atau PDF · maks. 4 MB') + '</small></span>' +
      (b ? '<button type="button" class="btn btn-soft btn-sm remove" data-rm-bukti>' + U.icon('trash') + ' Hapus</button>' : '') + '</label>';
  }

  // ---------- validasi ----------
  function validate(step) {
    var d = st.d, e = {};
    if (step === 1) {
      if (d.nama.trim().length < 3) e.nama = 'Nama lengkap santri wajib diisi.';
      if (fc('panggilan').tampil && fc('panggilan').wajib && !d.panggilan.trim()) e.panggilan = 'Nama panggilan wajib diisi.';
      if (fc('gender').tampil && fc('gender').wajib && !d.gender) e.gender = 'Pilih jenis kelamin.';
      if (!validDate(d.tgl_lahir)) e.tgl_lahir = 'Isi tanggal lahir yang valid.';
      else { var a = ageAtEvent(d.tgl_lahir); if (a < +p().usia_min || a > +p().usia_maks) e.tgl_lahir = 'Usia santri harus ' + p().usia_min + '–' + p().usia_maks + ' tahun pada hari acara.'; }
      if (!d.jenjang) e.jenjang = 'Pilih jenjang SD atau SMP.';
      if (fc('sekolah').tampil && fc('sekolah').wajib && !d.sekolah.trim()) e.sekolah = 'Asal sekolah wajib diisi.';
      if (fcAlamatRol()) {
        if (!d.prov) e.prov = 'Pilih provinsi.';
        if (!d.kota) e.kota = 'Pilih kota atau kabupaten.';
        if (!d.kec) e.kec = 'Pilih kecamatan.';
        if (!d.desa) e.desa = 'Pilih desa atau kelurahan.';
        composeAlamat();
      } else if (fc('alamat').tampil && fc('alamat').wajib && !d.alamat.trim()) e.alamat = 'Alamat wajib diisi.';
      else if (fc('alamat').tampil && d.alamat.trim() && d.alamat.trim().length < 8) e.alamat = 'Alamat terlalu singkat. Tuliskan alamat lengkap.';
    } else if (step === 2) {
      if (d.wali.trim().length < 3) e.wali = 'Nama wali wajib diisi.';
      if (!/^0\d{8,13}$/.test(normWa(d.wa))) e.wa = 'Nomor WhatsApp tidak valid. Contoh: 081234567890.';
      if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = 'Alamat email tidak valid. Kosongkan bila tidak punya email.';
    } else if (step === 3) {
      if (!size()) e.ukuran = 'Pilih ukuran kaos.';
    } else if (step === 4) {
      var n = parseInt(d.infaq, 10);
      if (!(n >= minInfaq())) e.infaq = 'Infaq minimal ' + U.rupiah(minInfaq()) + '.';
      if (d.cara !== 'tunai' && !st.bukti) e.bukti = 'Unggah bukti transfer.';
    } else if (step === 5) {
      if (fc('medis').tampil && fc('medis').wajib && !d.medis.trim()) e.medis = 'Catatan medis wajib diisi (tulis "-" bila tidak ada).';
      if (!d.setuju) e.setuju = 'Anda harus menyetujui ketentuan untuk melanjutkan.';
    }
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
      if (!first) first = f.querySelector('input:not([type=hidden]),textarea') || f;
    });
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); try { first.focus({ preventScroll: true }); } catch (x) { /* abaikan */ } }
  }
  function clearErr(key) {
    var f = root.querySelector('[data-f="' + key + '"]'); if (!f) return;
    f.classList.remove('invalid'); var m = f.querySelector('.err-msg'); if (m) m.textContent = '';
    var inp = f.querySelector('input,textarea'); if (inp) inp.removeAttribute('aria-invalid');
  }

  // ---------- render ----------
  function renderStep(focus) {
    var card = root.querySelector('#formCard'); if (!card) return;
    card.innerHTML = stepHtml();
    root.querySelector('.stepper').outerHTML = stepper();
    updateSummary(); updateInfaqFmt();
    if (st.step === 1) wilInit();
    if (Object.keys(st.err).length) { var e = st.err; st.err = {}; showErrors(e); }
    else if (focus) {
      var t = root.querySelector('#stepTitle');
      (root.querySelector('.reg-banner') || card).scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (t) t.focus({ preventScroll: true });
    }
  }
  function renderAll() {
    var open = pub.pendaftaran.status === 'buka';
    root.innerHTML = '<div class="wrap">' + banner() + (open ? stepper() + '<div class="reg-grid"><section class="card form-card" id="formCard"></section>' + aside() + '</div>' : blocked()) + '</div>';
    if (open) renderStep(false);
  }
  function updateInfaqFmt() {
    var el = root.querySelector('#infaqFmt'), n = parseInt(st.d.infaq, 10);
    if (el) el.textContent = n ? '= ' + U.rupiah(n) : '';
  }

  // ---------- navigasi ----------
  function goto(n) { st.step = n; renderStep(true); }
  function next() {
    var e = validate(st.step);
    if (Object.keys(e).length) { showErrors(e); return; }
    if (st.step < 5) goto(st.step + 1); else submit();
  }

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
    function fail(msg) { st.bukti = null; renderStep(false); st.err = { bukti: msg }; showErrors(st.err); st.err = {}; }
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
        renderStep(false); clearErr('bukti');
      });
    }).catch(function (err) {
      fail(err && err.message === 'big' || err && err.message === 'besar' ? 'Ukuran berkas maksimal 4 MB.' : 'Berkas tidak dapat dibaca. Gunakan foto JPG/PNG atau PDF.');
    });
  }

  // ---------- kirim ----------
  function submit() {
    var all = {}, firstBad = 0;
    for (var s = 1; s <= 5; s++) { var e = validate(s); if (Object.keys(e).length) { if (!firstBad) { firstBad = s; all = e; } } }
    if (firstBad) { if (firstBad !== st.step) { st.err = all; goto(firstBad); } else showErrors(all); return; }
    var d = st.d;
    var payload = {
      nama: d.nama.trim(), panggilan: d.panggilan.trim(), gender: d.gender, tgl_lahir: d.tgl_lahir, jenjang: d.jenjang, sekolah: d.sekolah.trim(), alamat: (composeAlamat(), d.alamat.trim()),
      wali: d.wali.trim(), wa: normWa(d.wa), email: d.email.trim(), ukuran: d.ukuran, infaq: parseInt(d.infaq, 10), medis: d.medis.trim(),
      setuju: true, cara: d.cara === 'tunai' ? 'tunai' : 'transfer',
      bukti: d.cara === 'tunai' || !st.bukti ? null : { nama: st.bukti.nama, base64: st.bukti.base64 }
    };
    st.sending = true; U.showBusy('Mengirim pendaftaran…', (st.d.cara === 'tunai' ? 'Mengirim data pendaftaran. ' : 'Mengunggah data dan bukti transfer. ') + 'Mohon jangan tutup halaman ini.');
    var btn = root.querySelector('button[type=submit]'); if (btn) btn.disabled = true;
    A.post('register', payload, 90000).then(function (r) {
      U.hideBusy(); st.sending = false;
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
      renderStep(false);
      var box = root.querySelector('#submitErr');
      if (box) box.innerHTML = '<div class="alert alert-err">' + U.icon('alert') + '<span>' + esc(msg) + (r && r.code === 'ganda' ? ' <a href="#/cek">Buka Cek Pendaftaran</a>' : '') + '</span></div>';
      U.toast(msg, 'err');
    }).catch(function (err) {
      U.hideBusy(); st.sending = false; renderStep(false);
      var box = root.querySelector('#submitErr');
      if (box) box.innerHTML = '<div class="alert alert-warn">' + U.icon('alert') + '<span>' + esc(err.message || 'Koneksi terputus.') + ' <b>Data mungkin sudah tersimpan</b> — sebelum mengirim ulang, periksa email Anda atau buka <a href="#/cek">Cek Pendaftaran</a>. Bila belum ada, tekan tombol daftar sekali lagi.</span></div>';
      U.toast('Pengiriman terputus. Lihat keterangan di bawah.', 'err');
    });
  }

  // ---------- event ----------
  function onInput(e) {
    var t = e.target, n = t.name; if (!n) return;
    if (n === 'amt') { st.d.infaq = t.value; var c = root.querySelector('#infaq'); if (c) c.value = ''; clearErr('amt'); clearErr('infaq'); updateSummary(); updateInfaqFmt(); return; }
    if (n === 'infaq') {
      var digits = t.value.replace(/\D/g, '').slice(0, 9); if (digits !== t.value) t.value = digits;
      st.d.infaq = digits; root.querySelectorAll('input[name=amt]').forEach(function (r) { r.checked = (r.value === digits); });
      clearErr('infaq'); clearErr('amt'); updateSummary(); updateInfaqFmt(); return;
    }
    if (!(n in st.d)) return;
    st.d[n] = t.type === 'checkbox' ? t.checked : t.value;
    clearErr(n);
    if (n === 'tgl_lahir') { var pill = root.querySelector('#agePill'); if (pill) pill.innerHTML = agePill(ageAtEvent(t.value)); }
    if (n === 'cara') { renderStep(false); return; }
    if (n === 'prov' || n === 'kota' || n === 'kec') wilChange(n); else if (n === 'desa') composeAlamat();
    updateSummary();
  }
  function onClick(e) {
    var g = e.target.closest('[data-goto]'); if (g && !g.disabled) { e.preventDefault(); goto(parseInt(g.getAttribute('data-goto'), 10)); return; }
    if (e.target.closest('[data-prev]')) { goto(st.step - 1); return; }
    var rm = e.target.closest('[data-rm-bukti]');
    if (rm) { e.preventDefault(); e.stopPropagation(); if (st.bukti && st.bukti.preview) URL.revokeObjectURL(st.bukti.preview); st.bukti = null; renderStep(false); }
  }
  function onSubmit(e) { if (e.target.id === 'regForm') { e.preventDefault(); if (!st.sending) next(); } }
  function onFile(e) { if (e.target.id === 'buktiFile') takeFile(e.target.files && e.target.files[0]); }
  function onDrag(e) {
    var d = e.target.closest && e.target.closest('#drop'); if (!d) return;
    if (e.type === 'dragover' || e.type === 'dragenter') { e.preventDefault(); d.classList.add('over'); }
    else if (e.type === 'dragleave') d.classList.remove('over');
    else if (e.type === 'drop') { e.preventDefault(); d.classList.remove('over'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) takeFile(f); }
  }
  function attachGuard() {
    if (guard) return;
    guard = function (e) { if (st.sending || st.step > 1 || st.d.nama || st.d.wali) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', guard);
  }
  function detachGuard() { if (guard) { window.removeEventListener('beforeunload', guard); guard = null; } }

  var handlers = [];
  function bind(el) {
    [['input', onInput], ['change', onInput], ['click', onClick], ['submit', onSubmit], ['change', onFile], ['dragover', onDrag], ['dragenter', onDrag], ['dragleave', onDrag], ['drop', onDrag]].forEach(function (h) {
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
