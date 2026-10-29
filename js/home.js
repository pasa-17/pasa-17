/* Halaman Beranda */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, S = P.shared;
  var K_ICONS = ['book', 'target', 'mountain', 'flame'];
  var F_ICONS = { mosque: 'moon', sports: 'target', leaf: 'leaf', food: 'utensils', shirt: 'shirt' };
  var lastSig = '', cleanups = [], photoList = [];

  function sig(pub) { var c = Object.assign({}, pub); delete c.serverTime; return JSON.stringify(c); }

  function hero(pub) {
    var p = pub.pengaturan, st = pub.pendaftaran || {}, cd = U.countdown(p), k = pub.kuota || {};
    var open = st.status === 'buka';
    return '<section class="hero" aria-labelledby="h-hero">' +
      '<div class="hero-copy">' +
        '<div class="hero-badges">' + S.regBadge(pub) +
          (cd ? '<span class="badge badge-glass">' + U.icon('clock') + ' ' + U.esc(cd.label) + '</span>' : '') +
          (open && k.total ? '<span class="badge badge-glass">' + U.icon('users') + ' Sisa kuota ' + k.sisa + ' dari ' + k.total + ' santri</span>' : '') +
        '</div>' +
        '<div class="eyebrow on-navy">' + U.icon('tent') + ' ' + 'Pesantren Anak Shaleh</div>' +
        '<h1 id="h-hero">' + U.esc(p.hero_judul || p.nama_acara) + '</h1>' +
        '<p class="lead">' + U.esc(p.hero_subjudul || 'Membangun generasi tangguh, mandiri, dan berakhlak Qurani di alam terbuka. Tiga hari penuh berkah merajut ukhuwah, menghidupkan sunnah, dan menyatu dengan keindahan ciptaan-Nya.') + '</p>' +
        '<div class="hero-meta">' +
          '<span class="badge">' + U.icon('calendar') + ' ' + U.esc(U.fmtRange(p.tanggal_mulai, p.tanggal_selesai)) + '</span>' +
          '<span class="badge">' + U.icon('pin') + ' ' + U.esc(p.lokasi) + '</span>' +
          '<span class="badge">' + U.icon('users') + ' Usia ' + U.esc(p.usia_min) + ' – ' + U.esc(p.usia_maks) + ' tahun</span>' +
        '</div>' +
        '<div class="hero-cta">' +
          (open ? '<a class="btn btn-primary btn-lg" href="#/daftar">Daftar Santri Sekarang ' + U.icon('arrow-right') + '</a>'
                : '<a class="btn btn-primary btn-lg" href="#/cek">Cek Status Pendaftaran ' + U.icon('search') + '</a>') +
          (p.kontak_wa && open ? '<a class="btn btn-on-navy btn-lg btn-admin-reg" target="_blank" rel="noopener" href="' + U.esc(S.waLink(p.kontak_wa, ['Assalamu\'alaikum, kami kesulitan mendaftar lewat website ' + (p.nama_singkat || 'PASA') + '. Mohon bantuan pendaftaran ananda. Berikut data kami:', '',
            'DATA SANTRI', '1. Nama lengkap:', '2. Nama panggilan:', '3. Jenis kelamin (Ikhwan/Akhwat):', '4. Tanggal lahir (tgl-bulan-tahun):', '5. Jenjang (SD/SMP):',
            '6. Asal sekolah & kelas:', '7. Alamat: provinsi, kota/kabupaten, kecamatan, desa/kelurahan:', '',
            'DATA WALI', '8. Nama wali (ayah/ibu):', '9. Nomor WhatsApp aktif:', '10. Email (boleh dikosongkan):', '',
            'KAOS & INFAQ', '11. Ukuran kaos:', '12. Nominal infaq (minimal ' + U.rupiah(parseInt(p.infaq_min, 10) || 0) + '):', '13. Cara bayar: transfer (kirim foto bukti di chat ini) atau tunai ke panitia', '',
            'LAINNYA', '14. Alergi / kondisi kesehatan ananda (tulis "-" bila tidak ada):', '15. Setuju dengan syarat & ketentuan acara (ya/tidak):', '',
            'Jazakumullahu khairan.'].join('\n'))) + '">' + U.icon('help') + ' Daftar Lewat Admin</a>' : '') +
          '<button type="button" class="btn btn-on-navy btn-lg" data-scroll="kegiatan">Pelajari Kegiatan</button>' +
        '</div>' +
      '</div>' +
      '<div class="hero-art">' + U.img(p.hero_foto, 'Suasana perkemahan ' + (p.nama_singkat || 'PASA'), '', 'night') +
        '<div class="hero-chip"><span class="ic">' + U.icon('moon') + '</span><span><b>Sholat Berjamaah &amp; Mabit</b>Di bawah naungan alam terbuka</span></div>' +
      '</div></section>' +
      '<div class="stats hero-stats" role="list">' +
        '<div class="stat" role="listitem"><b>16 Edisi</b><span><em class="s-full">Kiprah sejak 2008 membina santri</em><em class="s-short">Kiprah sejak 2008</em></span></div>' +
        '<div class="stat" role="listitem"><b>1 : 6</b><span><em class="s-full">Rasio murabbi pendamping santri</em><em class="s-short">Rasio murabbi–santri</em></span></div>' +
        '<div class="stat" role="listitem"><b>100%</b><span><em class="s-full">Makanan halal, sehat &amp; bergizi</em><em class="s-short">Halal, sehat &amp; bergizi</em></span></div>' +
        '<div class="stat" role="listitem"><b>24 Jam</b><span><em class="s-full">Tim medis &amp; paramedis lapangan</em><em class="s-short">Medis &amp; paramedis</em></span></div>' +
      '</div>';
  }

  function kegiatan(pub) {
    if (!pub.kegiatan.length) return '';
    return '<section class="sec wrap-sec" id="kegiatan" aria-labelledby="h-keg"><div class="sec-head split"><div><div class="eyebrow">Kurikulum holistik</div>' +
      '<h2 id="h-keg">Menyemai Karakter Juara di Alam Bebas</h2></div>' +
      '<p>Kombinasi teruji antara pendalaman adab Islami, hafalan Al-Qur\'an, dan ketahanan fisik yang melatih anak tangguh dan mandiri.</p></div>' +
      '<div class="k-grid">' + pub.kegiatan.map(function (k, i) {
        var dark = i % 4 === 1, hasPhoto = !!U.safeUrl(k.foto_url);
        return '<article class="card k-card' + (dark ? ' dark' : '') + '">' +
          (hasPhoto ? U.img(k.foto_url, k.judul, 'k-media', dark ? 'night' : 'day') : '<span class="k-ic">' + U.icon(K_ICONS[i % 4] || 'leaf') + '</span>') +
          (k.label ? '<div class="eyebrow">' + U.esc(k.label) + '</div>' : '') +
          '<h3>' + U.esc(k.judul) + '</h3><p class="k-desc">' + U.esc(k.deskripsi) + '</p>' +
          '<button type="button" class="k-more" aria-expanded="false" hidden>Selengkapnya</button>' +
          ((k.info_kiri || k.info_kanan) ? '<div class="k-tags">' + (k.info_kiri ? '<span>' + U.esc(k.info_kiri) + '</span>' : '') + (k.info_kanan ? '<span>' + U.esc(k.info_kanan) + '</span>' : '') + '</div>' : '') +
          '</article>';
      }).join('') + '</div></section>';
  }

  function photoCard(it, idx, kind) {
    return '<button type="button" class="photo" data-lb="' + idx + '" aria-label="Perbesar foto' + (it.judul ? ': ' + U.esc(it.judul) : '') + '">' +
      U.img(it.foto_url, it.judul || 'Foto kegiatan', '', kind || 'day') + (it.judul ? '<span class="cap">' + U.esc(it.judul) + '</span>' : '') + '</button>';
  }

  function strip(pub) {
    var items = pub.fotoStrip && pub.fotoStrip.length ? pub.fotoStrip : (pub.galeri || []).map(function (g) { return { foto_url: g.foto_url, judul: g.judul, baris: '1' }; });
    photoList = items.map(function (it) { return { url: it.foto_url, title: it.judul }; });
    if (!items.length) return '';
    var p = pub.pengaturan, r1 = [], r2 = [];
    items.forEach(function (it, i) { (it.baris === '2' ? r2 : r1).push(photoCard(it, i, i % 2 ? 'night' : 'day')); });
    if (!r1.length) { r1 = r2; r2 = []; }
    return '<section class="sec" id="potret" aria-labelledby="h-potret"><div class="wrap"><div class="sec-head split"><div><div class="eyebrow">Dokumentasi langsung</div>' +
      '<h2 id="h-potret">' + U.esc(p.strip_judul || 'Potret Keceriaan Sahabat Shalih') + '</h2></div>' +
      '<p>Arahkan kursor atau sentuh foto untuk menjeda, klik untuk memperbesar.</p></div></div>' +
      marquee(r1, false, p.strip_kecepatan) + (r2.length ? marquee(r2, true, p.strip_kecepatan) : '') + '</section>';
  }

  function marquee(cards, rev, speed) {
    return '<div class="marquee' + (rev ? ' rev' : '') + '" data-speed="' + U.esc(speed || 40) + '"><div class="track">' + cards.join('') + '</div></div>';
  }

  function testimoni(pub) {
    var t = pub.testimoni || [];
    if (!t.length) return '';
    var p = pub.pengaturan, r1 = [], r2 = [];
    function card(x) {
      var n = Math.max(1, Math.min(5, parseInt(x.rating, 10) || 5)), stars = '';
      for (var i = 0; i < n; i++) stars += U.icon('star', 'fill');
      return '<figure class="card tcard"><div class="stars" role="img" aria-label="' + n + ' dari 5 bintang">' + stars + '</div>' +
        '<blockquote style="margin:0"><p>“' + U.esc(x.isi) + '”</p></blockquote>' +
        '<figcaption class="who"><span class="avatar" aria-hidden="true">' + U.esc(U.initials(x.nama)) + '</span><span><b>' + U.esc(x.nama) + '</b><small>' + U.esc(x.keterangan) + '</small></span></figcaption></figure>';
    }
    t.forEach(function (x) { (x.baris === '2' ? r2 : r1).push(card(x)); });
    if (!r1.length) { r1 = r2; r2 = []; }
    return '<section class="sec" aria-labelledby="h-testi"><div class="wrap"><div class="sec-head"><div class="eyebrow">Kesan orang tua</div><h2 id="h-testi">' + U.esc(p.testi_judul || 'Apa Kata Wali Santri PASA?') + '</h2></div></div>' +
      marquee(r1, false, p.testi_kecepatan || 60) + (r2.length ? marquee(r2, true, p.testi_kecepatan || 60) : '') + '</section>';
  }

  function video(pub) {
    var v = pub.video || [];
    if (!v.length) return '';
    return '<section class="sec" id="video" aria-labelledby="h-video"><div class="video">' +
      '<div class="v-copy"><div class="eyebrow on-navy">Video dokumentasi PASA</div><h2 id="h-video">Saksikan Hangatnya Kenangan PASA Tahun Lalu</h2>' +
      '<p>Tonton cuplikan kebersamaan santri: dari halaqah subuh, tantangan outbound, hingga muhasabah di alam terbuka.</p>' +
      '<p id="vTitle" style="color:var(--on-navy);font-weight:700"></p>' +
      (v.length > 1 ? '<div class="v-list" role="group" aria-label="Pilih video">' + v.map(function (x, i) { return '<button type="button" data-v="' + i + '" aria-pressed="' + (i === 0) + '">' + U.esc(x.judul || 'Video ' + (i + 1)) + '</button>'; }).join('') + '</div>' : '') +
      '</div><div class="player" id="player"></div></div></section>';
  }

  function alur(pub) {
    var p = pub.pengaturan;
    var st = [
      ['01', 'Isi Formulir Online', 'Lengkapi data santri, ukuran kaos lapangan, kontak wali, dan catatan medis ananda.', 'Waktu isi: ± 5 menit'],
      ['02', 'Transfer & Unggah Bukti', 'Transfer infaq operasional ke rekening resmi, lalu unggah bukti transfer di formulir.', 'Diverifikasi oleh panitia'],
      ['03', 'Terima E-Tiket QR', 'E-tiket terbit otomatis setelah formulir terkirim, juga dikirim ke email wali beserta link grup WhatsApp.', 'Bisa dicek ulang kapan saja'],
      ['04', 'Check-in di Hari-H', 'Tunjukkan QR e-tiket kepada panitia untuk di-scan saat kedatangan.', U.fmtDate(p.tanggal_mulai)]
    ];
    return '<section class="sec" aria-labelledby="h-alur"><div class="wrap-in"><div class="sec-head center" style="justify-items:center"><div class="eyebrow">Alur registrasi cepat</div><h2 id="h-alur">4 Langkah Mudah Menuju Perkemahan</h2>' +
      '<p>Proses serba digital dan transparan. Wali santri dapat memantau status secara mandiri.</p></div>' +
      '<div class="s4">' + st.map(function (s) { return '<div class="card"><span class="num">' + s[0] + '</span><h3>' + s[1] + '</h3><p>' + s[2] + '</p><span class="tag">' + U.esc(s[3]) + '</span></div>'; }).join('') + '</div>' +
      '<div class="center" style="margin-top:24px"><a class="btn btn-dark" href="#/daftar">' + U.icon('file') + ' Mulai Registrasi Santri Sekarang</a></div></div></section>';
  }

  function fasilitas(pub) {
    var f = pub.fasilitas || [];
    if (!f.length && !pub.ukuran.length) return '';
    return '<section class="sec" aria-labelledby="h-fas"><div class="sec-head split"><div><div class="eyebrow">Standar kenyamanan &amp; keamanan</div><h2 id="h-fas">Fasilitas Edu-Camp Standar Lengkap</h2></div>' +
      '<p>' + U.esc(pub.pengaturan.lokasi) + ' menyediakan sarana yang terawat dengan sanitasi dan kebersihan yang terjaga.</p></div>' +
      (f.length ? '<div class="f-grid">' + f.map(function (x, i) {
        var hasPhoto = !!U.safeUrl(x.foto_url);
        return '<article class="card f-card">' + (hasPhoto ? U.img(x.foto_url, x.judul, 'f-media', 'day') : '<span class="k-ic">' + U.icon(F_ICONS[x.ikon] || 'tent') + '</span>') +
          '<h3>' + U.esc(x.judul) + '</h3><p>' + U.esc(x.deskripsi) + '</p></article>';
      }).join('') + '</div>' : '') +
      (pub.ukuran.length ? '<div class="card size-card"><h3>' + U.icon('shirt') + ' Tabel Ukuran Kaos Peserta</h3>' +
        '<table class="size-table"><caption class="sr-only">Ukuran kaos dalam sentimeter</caption><thead><tr><th scope="col">Untuk</th><th scope="col">Ukuran</th><th scope="col">Lebar Dada / LD (cm)</th><th scope="col">Tinggi Bahu / TB (cm)</th></tr></thead><tbody>' +
        pub.ukuran.map(function (u) { return '<tr><td>' + (u.untuk === 'L' ? 'Ikhwan' : u.untuk === 'P' ? 'Akhwat' : 'Ikhwan &amp; Akhwat') + '</td><td>' + U.esc(u.label) + '</td><td>' + U.esc(u.lebar) + '</td><td>' + U.esc(u.panjang) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="help">Ukuran kaos anak. Cocokkan dengan kaos yang biasa dipakai ananda.</p></div>' : '') +
      '</section>';
  }

  function infaq(pub) {
    var p = pub.pengaturan, open = pub.pendaftaran && pub.pendaftaran.status === 'buka';
    return '<section class="sec" aria-labelledby="h-infaq"><div class="infaq"><div><div class="eyebrow on-navy">Investasi akhirat &amp; pembinaan ummat</div>' +
      '<h2 id="h-infaq">Infaq Operasional Santri</h2>' +
      '<p style="margin-top:12px">Kegiatan PASA diselenggarakan dengan prinsip ukhuwah dan ta\'awun. Infaq operasional mencakup konsumsi 3 hari 2 malam.</p>' +
      '<div class="min"><small>Minimum infaq kemitraan</small><b>' + U.rupiah(p.infaq_min) + ' <span style="font-size:15px;font-weight:600;color:var(--on-navy-muted)">/ santri</span></b></div>' +
      '<p style="margin-top:8px;font-size:14px">Bebas menambah nominal infaq sukarela.</p></div>' +
      '<div>' + S.rekening(p) + '<a class="btn btn-primary btn-block btn-lg" style="margin-top:14px" href="#/' + (open ? 'daftar' : 'cek') + '">' + (open ? 'Daftar &amp; Salurkan Infaq' : 'Cek Status Pendaftaran') + ' ' + U.icon('arrow-right') + '</a></div></div></section>';
  }

  function cta(pub) {
    var open = pub.pendaftaran && pub.pendaftaran.status === 'buka', k = pub.kuota || {};
    return '<section class="sec" aria-labelledby="h-cta"><div class="cta"><div><h2 id="h-cta">Amankan Kursi Ananda Sebelum Kuota Habis!</h2>' +
      '<p>Pendaftaran ditutup begitu kuota ' + (k.total || 150) + ' santri terpenuhi demi menjaga kualitas rasio pendampingan.</p></div>' +
      '<div class="acts"><a class="btn btn-ghost" href="#/cek">Cek Status Pendaftaran</a>' + (open ? '<a class="btn btn-primary" href="#/daftar">Daftar Sekarang</a>' : '') + '</div></div></section>';
  }

  // ---------- perilaku ----------
  function setupMarquee(m) {
    var track = m.querySelector('.track'), orig = track.innerHTML, n = track.children.length;
    function build() {
      m.classList.remove('static'); track.innerHTML = orig;
      var gap = 16, w = 0;
      Array.prototype.forEach.call(track.children, function (c) { w += c.getBoundingClientRect().width + gap; });
      if (w < m.clientWidth * 1.02) { m.classList.add('static'); return; }
      Array.prototype.slice.call(track.children).forEach(function (c) {
        var cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); cl.setAttribute('tabindex', '-1');
        Array.prototype.forEach.call(cl.querySelectorAll('button,a'), function (x) { x.setAttribute('tabindex', '-1'); });
        track.appendChild(cl);
      });
      var speed = Math.max(10, parseFloat(m.getAttribute('data-speed')) || 40);
      m.style.setProperty('--dur', Math.max(14, speed * n / 8) + 's');
    }
    build();
    var t; function onResize() { clearTimeout(t); t = setTimeout(build, 250); }
    window.addEventListener('resize', onResize); cleanups.push(function () { window.removeEventListener('resize', onResize); });
    var tm;
    m.addEventListener('touchstart', function () { clearTimeout(tm); m.classList.add('paused'); }, { passive: true });
    m.addEventListener('touchend', function () { tm = setTimeout(function () { m.classList.remove('paused'); }, 1500); }, { passive: true });
  }

  function openLightbox(i) {
    var list = photoList.filter(function (x) { return U.safeUrl(x.url); });
    if (!list.length) return;
    var cur = Math.max(0, Math.min(list.length - 1, i)); var real = photoList[i];
    cur = Math.max(0, list.indexOf(real));
    var m;
    function body() {
      var it = list[cur];
      return '<img src="' + U.esc(U.safeUrl(it.url)) + '" alt="' + U.esc(it.title || 'Foto kegiatan') + '" referrerpolicy="no-referrer">' +
        (it.title ? '<div class="lb-cap">' + U.esc(it.title) + '</div>' : '') +
        (list.length > 1 ? '<button class="icon-btn lb-nav prev" data-lbn="-1" aria-label="Foto sebelumnya">' + U.icon('chevron-left') + '</button><button class="icon-btn lb-nav next" data-lbn="1" aria-label="Foto berikutnya">' + U.icon('chevron-right') + '</button>' : '');
    }
    function go(d) { cur = (cur + d + list.length) % list.length; m.body.innerHTML = body(); }
    m = U.openModal({ title: 'Foto kegiatan', hideTitle: true, cls: 'lightbox', html: body(),
      onKey: function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); } });
    m.body.addEventListener('click', function (e) { var b = e.target.closest('[data-lbn]'); if (b) go(parseInt(b.getAttribute('data-lbn'), 10)); });
  }

  function setupVideo(el, pub) {
    var player = el.querySelector('#player'), vs = pub.video || []; if (!player || !vs.length) return;
    var idx = 0, title = el.querySelector('#vTitle');
    function show() {
      var v = vs[idx];
      title.textContent = v.judul || '';
      player.innerHTML = '<button type="button" class="cover" style="background-image:url(https://i.ytimg.com/vi/' + encodeURIComponent(v.youtube_id) + '/hqdefault.jpg)" aria-label="Putar video: ' + U.esc(v.judul || 'Dokumentasi PASA') + '"><span class="play">' + U.icon('play') + '</span></button>';
      player.querySelector('button').addEventListener('click', function () {
        player.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.youtube_id) + '?autoplay=1&rel=0" title="' + U.esc(v.judul || 'Video dokumentasi PASA') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      });
    }
    show();
    el.querySelectorAll('[data-v]').forEach(function (b) {
      b.addEventListener('click', function () {
        idx = parseInt(b.getAttribute('data-v'), 10);
        el.querySelectorAll('[data-v]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        show();
      });
    });
  }

  function render(el, pub) {
    el.innerHTML = '<div class="wrap">' + hero(pub) + kegiatan(pub) + '</div>' +
      '<div class="wrap">' + fasilitas(pub) + '</div>' + strip(pub) +
      '<div class="wrap">' + video(pub) + '</div>' +
      '<div class="wrap">' + alur(pub).replace('wrap-in', 'wrap-in') + '</div>' + testimoni(pub) +
      '<div class="wrap">' + infaq(pub) + cta(pub) + '</div>';
    cleanups.forEach(function (f) { f(); }); cleanups = [];
    el.querySelectorAll('.marquee').forEach(setupMarquee);
    setupVideo(el, pub);
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-lb]'); if (b) { openLightbox(parseInt(b.getAttribute('data-lb'), 10)); return; }
      var m = e.target.closest && e.target.closest('.k-more');
      if (m) { var c = m.closest('.k-card'), on = !c.classList.contains('open'); c.classList.toggle('open', on); m.setAttribute('aria-expanded', on ? 'true' : 'false'); m.textContent = on ? 'Ringkas' : 'Selengkapnya'; }
    });
    // Tombol "Selengkapnya" hanya muncul bila deskripsi terpotong (HP); dihitung ulang saat layar/font berubah.
    function fitMore() {
      el.querySelectorAll('.k-card').forEach(function (c) {
        var p = c.querySelector('.k-desc'), m = c.querySelector('.k-more'); if (!p || !m || c.classList.contains('open')) return;
        m.hidden = !(p.scrollHeight > p.clientHeight + 1);
      });
    }
    requestAnimationFrame(fitMore);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMore);
    window.addEventListener('resize', fitMore); cleanups.push(function () { window.removeEventListener('resize', fitMore); });
    lastSig = sig(pub);
  }

  P.pages.home = {
    title: 'home', isHome: true,
    needsData: true,
    mount: function (el, pub) { render(el, pub); this._el = el; },
    update: function (pub) { if (this._el && sig(pub) !== lastSig) render(this._el, pub); },
    unmount: function () { cleanups.forEach(function (f) { f(); }); cleanups = []; this._el = null; lastSig = ''; }
  };
})();
