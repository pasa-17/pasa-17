/* Halaman Cek Pendaftaran + halaman Panduan */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, esc = U.esc, A = P.api;

  P.pages.cek = {
    title: 'Cek Pendaftaran — PASA 17',
    needsData: false,
    mount: function (el) {
      el.innerHTML = '<div class="wrap"><div class="page-head" style="justify-items:center;text-align:center"><div class="eyebrow">Cek pendaftaran</div><h1>Buka Kembali E-Tiket Anda</h1>' +
        '<p>Masukkan kode tiket dan nomor WhatsApp yang didaftarkan untuk melihat e-tiket dan status infaq.</p></div>' +
        '<form class="card cek-card" id="cekForm" novalidate>' +
        '<div class="field" data-f="kode"><label class="lbl" for="kode">Kode tiket <span class="req" aria-hidden="true">*</span></label><input class="input" id="kode" name="kode" placeholder="Contoh: PASA-001" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" aria-describedby="kode-h kode-e"><div class="help" id="kode-h">Tertera di e-tiket dan email konfirmasi.</div><div class="err-msg" id="kode-e" role="alert"></div></div>' +
        '<div class="field" data-f="wa"><label class="lbl" for="wa">Nomor WhatsApp wali <span class="req" aria-hidden="true">*</span></label><input class="input" id="wa" name="wa" type="tel" inputmode="tel" placeholder="Contoh: 0812 3456 7890" autocomplete="tel" maxlength="20" aria-describedby="wa-e"><div class="err-msg" id="wa-e" role="alert"></div></div>' +
        '<div id="cekMsg" aria-live="assertive"></div>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">' + U.icon('search') + ' Cek Pendaftaran</button></form>' +
        '<p class="help center" style="margin-top:16px">Lupa kode tiket? Hubungi panitia dengan menyebutkan nama santri dan nomor WhatsApp wali.</p></div>';
      var form = el.querySelector('#cekForm'), msg = el.querySelector('#cekMsg');
      function setErr(k, m) { var f = el.querySelector('[data-f="' + k + '"]'); f.classList.toggle('invalid', !!m); f.querySelector('.err-msg').textContent = m || ''; var i = f.querySelector('input'); if (m) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); }
      form.addEventListener('input', function (e) {
        if (e.target.id === 'kode') { var v = e.target.value.toUpperCase(); if (v !== e.target.value) e.target.value = v; }
        setErr(e.target.name, '');
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault(); msg.innerHTML = '';
        var kode = form.kode.value.trim().toUpperCase(), wa = form.wa.value.trim(), bad = false;
        if (!kode) { setErr('kode', 'Isi kode tiket.'); bad = true; }
        if (wa.replace(/\D/g, '').length < 8) { setErr('wa', 'Isi nomor WhatsApp yang valid.'); bad = true; }
        if (bad) { var first = form.querySelector('.invalid input'); if (first) first.focus(); return; }
        var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.innerHTML = '<span class="spin" style="width:20px;height:20px;border-width:3px"></span> Memeriksa…';
        A.post('cekPendaftaran', { kode: kode, wa: wa }, 30000).then(function (r) {
          if (r && r.success) { P.ticket.set(r.data, false); location.hash = '#/tiket'; return; }
          msg.innerHTML = '<div class="alert alert-err">' + U.icon('alert') + '<span>' + esc((r && r.message) || 'Pendaftaran tidak ditemukan.') + '</span></div>';
        }).catch(function (err) {
          msg.innerHTML = '<div class="alert alert-err">' + U.icon('alert') + '<span>' + esc(err.message) + '</span></div>';
        }).then(function () { btn.disabled = false; btn.innerHTML = U.icon('search') + ' Cek Pendaftaran'; });
      });
      form.kode.focus({ preventScroll: true });
    },
    unmount: function () { }
  };

  P.pages.panduan = {
    title: 'Panduan Pendaftaran — PASA 17',
    needsData: true,
    mount: function (el, pub) {
      var p = pub.pengaturan, open = pub.pendaftaran && pub.pendaftaran.status === 'buka';
      function li(i, t, d) { return '<li class="card info-card"><h2>' + U.icon(i) + ' ' + t + '</h2><p>' + d + '</p></li>'; }
      el.innerHTML = '<div class="wrap"><div class="page-head"><div class="eyebrow">Panduan</div><h1>Cara Mendaftarkan Santri</h1>' +
        '<p>Satu formulir untuk satu anak. Prosesnya sekitar lima menit lewat HP — siapkan hal-hal berikut.</p></div>' +
        '<ul class="s4" style="margin-top:24px">' +
        li('user', 'Data santri', 'Nama lengkap, jenis kelamin, jenjang (SD atau SMP), dan alamat tempat tinggal.') +
        li('users', 'Kontak wali', 'Cukup nomor WhatsApp aktif. Email boleh dikosongkan.') +
        li('shirt', 'Ukuran kaos', 'Pilih ukuran anak berdasarkan tabel lebar × panjang (cm) di formulir.') +
        li('wallet', 'Infaq &amp; bukti transfer', 'Minimum ' + U.rupiah(p.infaq_min) + '. Transfer ke rekening resmi lalu unggah fotonya (JPG/PNG/WebP/PDF, maks. 4 MB).') +
        '</ul>' +
        '<div class="sec-head" style="margin-top:48px"><div class="eyebrow">Setelah mendaftar</div><h2>Apa yang terjadi berikutnya</h2></div>' +
        '<div class="side-stack" style="max-width:760px">' +
        '<div class="card info-card"><h2>' + U.icon('qr') + ' E-tiket QR</h2><p>Tiket langsung tampil di layar dan dikirim ke email. Unduh sebagai gambar atau tangkap layar.</p></div>' +
        '<div class="card info-card"><h2>' + U.icon('shield') + ' Verifikasi infaq</h2><p>Panitia memeriksa bukti transfer secara manual. Status berubah dari <b>Bukti Sedang Dicek</b> menjadi <b>Lunas</b>. Pantau lewat <a href="#/cek">Cek Pendaftaran</a>.</p></div>' +
        '<div class="card info-card"><h2>' + U.icon('chat') + ' Grup WhatsApp wali</h2><p>Link grup tampil di halaman e-tiket dan di email setelah pendaftaran berhasil.</p></div>' +
        '<div class="card info-card"><h2>' + U.icon('calendar') + ' Hari-H, ' + esc(U.fmtDate(p.tanggal_mulai)) + '</h2><p>Tunjukkan QR e-tiket kepada panitia untuk di-scan saat kedatangan di ' + esc(p.lokasi) + '.</p></div></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:28px">' + (open ? '<a class="btn btn-primary btn-lg" href="#/daftar">Mulai Pendaftaran ' + U.icon('arrow-right') + '</a>' : '') + '<a class="btn btn-ghost btn-lg" href="#/cek">Cek Pendaftaran</a></div></div>';
    },
    unmount: function () { }
  };
})();
