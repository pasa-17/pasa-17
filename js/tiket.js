/* Halaman E-Tiket QR + penyimpanan tiket sementara (per tab) */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {};
  P.pages = P.pages || {};
  var U = P.ui, S = P.shared, esc = U.esc;
  var KEY = 'pasa17.ticket';
  var mem = null;

  P.ticket = {
    set: function (data, fresh) {
      mem = { data: data, fresh: fresh !== false };
      try { sessionStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* abaikan */ }
    },
    get: function () {
      if (!mem) { try { mem = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { mem = null; } }
      return mem && mem.data ? mem.data : null;
    },
    consumeFresh: function () { var f = !!(mem && mem.fresh); if (mem) { mem.fresh = false; try { sessionStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* abaikan */ } } return f; },
    clear: function () { mem = null; try { sessionStorage.removeItem(KEY); } catch (e) { /* abaikan */ } }
  };

  function gl(g) { return g === 'L' ? 'Ikhwan' : g === 'P' ? 'Akhwat' : ''; }

  // ---------- PNG ----------
  function rr(x, px, py, w, h, r, fill) {
    x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); }
  }
  function wrap(x, text, cx, y, maxW, lh, maxLines) {
    var words = String(text).split(/\s+/), line = '', lines = [];
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
    lines.forEach(function (l, i) { x.fillText(l, cx, y + i * lh); });
    return lines.length * lh;
  }
  function makePng(t) {
    var F = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    var ready = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('800 40px "Plus Jakarta Sans"'), document.fonts.load('600 28px "Plus Jakarta Sans"')]).catch(function () { }) : Promise.resolve();
    return ready.then(function () {
      var W = 900, H = 1340, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
      x.fillStyle = '#0D1B2A'; x.fillRect(0, 0, W, H);
      var g = x.createRadialGradient(W, 0, 40, W, 0, 700); g.addColorStop(0, 'rgba(232,93,4,.35)'); g.addColorStop(1, 'rgba(232,93,4,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      rr(x, 40, 40, W - 80, H - 80, 44, '#FFFFFF');
      x.save(); rr(x, 40, 40, W - 80, 250, 44); x.clip(); x.fillStyle = '#0D1B2A'; x.fillRect(40, 40, W - 80, 250);
      var g2 = x.createRadialGradient(W - 40, 40, 20, W - 40, 40, 520); g2.addColorStop(0, 'rgba(232,93,4,.4)'); g2.addColorStop(1, 'rgba(232,93,4,0)'); x.fillStyle = g2; x.fillRect(40, 40, W - 80, 250); x.restore();
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.fillStyle = '#F2F1EC'; x.font = '800 54px ' + F; x.fillText(String(t.acara.nama).match(/PASA\s*\d+/i) ? String(t.acara.nama).match(/PASA\s*\d+/i)[0].toUpperCase() : 'PASA', 90, 140);
      x.fillStyle = '#E85D04'; x.font = '800 24px ' + F; x.textAlign = 'right'; x.fillText('E-TIKET', W - 90, 130);
      x.textAlign = 'left'; x.fillStyle = '#A9B8C9'; x.font = '600 26px ' + F; x.fillText(t.acara.nama, 90, 192);
      x.font = '500 24px ' + F; x.fillText(U.fmtRange(t.acara.mulai, t.acara.selesai) + '  ·  ' + String(t.acara.lokasi).split(',')[0], 90, 240);
      // sobekan
      x.setLineDash([14, 12]); x.strokeStyle = '#D9D6CB'; x.lineWidth = 3; x.beginPath(); x.moveTo(90, 330); x.lineTo(W - 90, 330); x.stroke(); x.setLineDash([]);
      x.fillStyle = '#0D1B2A'; x.beginPath(); x.arc(40, 330, 30, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(W - 40, 330, 30, 0, Math.PI * 2); x.fill();
      // QR
      var qs = 470; rr(x, (W - qs - 40) / 2, 372, qs + 40, qs + 40, 24, '#FFFFFF'); x.strokeStyle = '#E2DFD6'; x.lineWidth = 2; x.stroke();
      P.qr.draw(x, t.qr, (W - qs) / 2, 392, qs, 2);
      x.textAlign = 'center';
      x.fillStyle = '#5A6472'; x.font = '700 22px ' + F; x.fillText('KODE TIKET', W / 2, 936);
      x.fillStyle = '#0D1B2A'; x.font = '800 64px ' + F; x.fillText(t.kode, W / 2, 1004);
      x.font = '800 38px ' + F; var used = wrap(x, t.nama, W / 2, 1066, W - 220, 46, 2);
      var y2 = 1066 + used + 6; x.fillStyle = '#5A6472'; x.font = '500 26px ' + F;
      x.fillText([gl(t.gender), t.usia ? 'Usia ' + t.usia + ' th' : '', t.ukuran ? 'Kaos ' + t.ukuran : ''].filter(Boolean).join('  ·  '), W / 2, y2 + 8);
      // status
      var stc = t.statusInfaq === 'Lunas' ? ['#E3EDE3', '#2C4E30'] : t.statusInfaq === 'Bukti Ditolak' ? ['#FFDAD6', '#93000A'] : ['#FFE9DB', '#A33E00'];
      x.font = '800 24px ' + F; var lbl = t.statusInfaq === 'Lunas' ? 'LUNAS · TERVERIFIKASI' : String(t.statusInfaq).toUpperCase(); var bw = x.measureText(lbl).width + 56;
      rr(x, (W - bw) / 2, 1200, bw, 56, 28, stc[0]); x.fillStyle = stc[1]; x.fillText(lbl, W / 2, 1237);
      x.fillStyle = '#7A8492'; x.font = '500 21px ' + F; x.fillText('Tunjukkan QR ini kepada panitia saat check-in', W / 2, 1290);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }
  function downloadPng(t, btn) {
    if (btn) btn.disabled = true;
    makePng(t).then(function (b) {
      if (!b) throw new Error('png');
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'E-Tiket-' + t.kode + '.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      U.toast('E-tiket diunduh', 'ok');
    }).catch(function () { U.toast('Gagal membuat gambar tiket. Coba tangkapan layar.', 'err'); })
      .then(function () { if (btn) btn.disabled = false; });
  }

  // ---------- tampilan ----------
  function view(t, fresh) {
    var cfg = (P.api.getCached() || {}).pengaturan || {};
    var open = (P.api.getCached() || {}).pendaftaran && P.api.getCached().pendaftaran.status === 'buka';
    var st = t.statusInfaq, need = st === 'Menunggu Bukti' || st === 'Bukti Ditolak';
    var rek = t.rekening || {};
    var statusCard = need
      ? '<div class="alert alert-warn">' + U.icon('alert') + '<span>' + (st === 'Bukti Ditolak' ? 'Bukti transfer belum dapat diterima panitia. Silakan transfer/unggah ulang atau hubungi panitia.' : 'Infaq belum tercatat. Transfer ke rekening di bawah, lalu hubungi panitia untuk mengirim bukti.') + '</span></div>' +
        S.rekening({ bank_nama: rek.bank, bank_rekening: rek.nomor, bank_atas_nama: rek.atasNama, qris_url: rek.qris }, { cls: 'rek' })
      : st === 'Bayar Tunai'
        ? '<div class="alert alert-info">' + U.icon('wallet') + '<span><b>Pembayaran tunai.</b> Serahkan infaq ' + U.rupiah(t.infaq) + ' langsung kepada panitia. Status berubah menjadi <b>Lunas</b> setelah panitia menerima dan mengonfirmasi pembayaran.</span></div>'
      : st === 'Lunas'
        ? '<div class="alert alert-ok">' + U.icon('shield') + '<span>Infaq sudah terverifikasi. Tiket ini siap dipakai untuk check-in.</span></div>'
        : '<div class="alert alert-info">' + U.icon('clock') + '<span>Panitia sedang memeriksa bukti transfer. Status berubah menjadi <b>Lunas</b> setelah terverifikasi — buka menu <a href="#/cek">Cek Pendaftaran</a> untuk memantau.</span></div>';
    var grup = t.linkGrup ? '<div class="link-box"><span>' + esc(t.linkGrup) + '</span><button type="button" class="btn btn-soft btn-sm" data-copy="' + esc(t.linkGrup) + '" data-msg="Link grup disalin">' + U.icon('copy') + ' Salin</button></div>' +
      '<a class="btn btn-primary" href="' + esc(U.safeUrl(t.linkGrup)) + '" target="_blank" rel="noopener">' + U.icon('chat') + ' Buka Grup WhatsApp Wali</a>'
      : '<p>Link grup WhatsApp wali akan diinformasikan panitia.</p>';
    var em = t.emailStatus === 'terkirim' ? '<div class="alert alert-ok">' + U.icon('mail') + '<span>E-tiket juga dikirim ke email wali. Bila belum terlihat, periksa folder <b>Spam</b>.</span></div>'
      : /^gagal/.test(t.emailStatus || '') ? '<div class="alert alert-warn">' + U.icon('mail') + '<span>Email e-tiket belum terkirim. <b>Unduh tiket ini</b> sekarang. Kapan pun Anda bisa membukanya lagi lewat <a href="#/cek">Cek Pendaftaran</a> dengan kode tiket dan nomor WhatsApp.</span></div>' : '';
    return '<div class="wrap"><div class="page-head"><div class="eyebrow">E-Tiket santri</div><h1>' + (fresh ? 'Alhamdulillah, pendaftaran berhasil' : 'E-Tiket ' + esc(t.kode)) + '</h1>' +
      '<p>Simpan tiket ini. Tunjukkan QR kepada panitia saat kedatangan di hari-H.</p></div>' +
      (fresh ? '<div class="alert alert-ok" style="margin-top:16px" role="status">' + U.icon('check') + '<span>Data diterima. <b>Catat kode tiket ' + esc(t.kode) + '</b> — bersama nomor WhatsApp wali, kode ini dipakai untuk membuka kembali tiket lewat Cek Pendaftaran.</span></div>' : '') +
      '<div class="tiket-grid"><article class="pass" aria-label="E-Tiket ' + esc(t.nama) + '">' +
      '<div class="pass-top"><div class="pt-row"><span class="pt-brand">' + U.icon('tent') + ' ' + esc(cfg.nama_singkat || 'PASA 17') + '</span><span class="pt-tag">E-TIKET</span></div><div class="pt-name">' + esc(t.acara.nama) + '</div>' +
      '<div class="pt-name">' + esc(U.fmtRange(t.acara.mulai, t.acara.selesai)) + ' · ' + esc(String(t.acara.lokasi).split(',')[0]) + '</div></div><div class="pass-tear"></div>' +
      '<div class="pass-body"><div class="qr-box" id="qrBox" aria-label="QR check-in">' + P.qr.svg(t.qr, { margin: 2, label: 'QR check-in ' + t.kode }) + '</div>' +
      '<div><div class="kode-lbl">Kode tiket</div><div class="kode">' + esc(t.kode) + '</div></div>' +
      '<div><div class="nm">' + esc(t.nama) + '</div><div class="sub">' + esc([gl(t.gender), t.usia ? 'Usia ' + t.usia + ' th' : '', t.panggilan ? 'Panggilan ' + t.panggilan : ''].filter(Boolean).join(' · ')) + '</div></div>' +
      S.statusBadge(st) +
      '<div class="pass-grid"><div><small>Wali</small><b>' + esc(t.wali) + '</b></div><div><small>Ukuran kaos</small><b>' + esc(t.ukuran) + '</b></div>' +
      '<div><small>Infaq</small><b>' + U.rupiah(t.infaq) + '</b></div><div><small>Terdaftar</small><b>' + esc(U.fmtDate(String(t.dibuat).slice(0, 10))) + '</b></div>' +
      '<div class="full"><small>Lokasi</small><b>' + esc(t.acara.lokasi) + '</b></div></div>' +
      '<div class="pass-actions no-print"><button type="button" class="btn btn-primary btn-lg" id="dlPng">' + U.icon('download') + ' Unduh E-Tiket (PNG)</button>' +
      '<button type="button" class="btn btn-ghost" id="prn">Cetak</button></div></div></article>' +
      '<div class="side-stack"><section class="card info-card" aria-labelledby="h-st"><h2 id="h-st">' + U.icon('wallet') + ' Status infaq</h2>' + statusCard + '</section>' +
      '<section class="card info-card" aria-labelledby="h-grp"><h2 id="h-grp">' + U.icon('users') + ' Grup WhatsApp wali</h2>' + grup + '</section>' +
      (em ? '<section class="card info-card" aria-labelledby="h-em"><h2 id="h-em">' + U.icon('mail') + ' E-tiket via email</h2>' + em + '</section>' : '') +
      (t.panduanAcara ? '<section class="card info-card" aria-labelledby="h-pa"><h2 id="h-pa">' + U.icon('book') + ' Panduan acara</h2><p class="preline">' + esc(t.panduanAcara) + '</p></section>' : '') +
      '<div class="no-print" style="display:flex;flex-wrap:wrap;gap:10px">' + (open ? '<a class="btn btn-soft" href="#/daftar">' + U.icon('plus') + ' Daftarkan anak lain</a>' : '') + '<a class="btn btn-soft" href="#/cek">' + U.icon('search') + ' Cek pendaftaran lain</a><a class="btn btn-soft" href="#/">Beranda</a></div>' +
      '</div></div></div>';
  }

  P.pages.tiket = {
    title: 'E-Tiket — PASA 17',
    needsData: false,
    mount: function (el) {
      var t = P.ticket.get();
      if (!t) { el.innerHTML = '<div class="wrap"><div class="card err-state"><h2>Belum ada tiket yang dibuka</h2><p class="muted">Daftar santri baru, atau buka tiket yang sudah ada dengan kode tiket dan nomor WhatsApp wali.</p><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><a class="btn btn-primary" href="#/cek">Cek Pendaftaran</a><a class="btn btn-ghost" href="#/daftar">Daftar</a></div></div></div>'; return; }
      var fresh = P.ticket.consumeFresh();
      el.innerHTML = view(t, fresh);
      var d = el.querySelector('#dlPng'); if (d) d.addEventListener('click', function () { downloadPng(t, d); });
      var p = el.querySelector('#prn'); if (p) p.addEventListener('click', function () { window.print(); });
    },
    unmount: function () { }
  };
  P._makePng = makePng; // untuk pengujian
})();
