/* Pembuat gambar e-tiket untuk portal admin: unduh PNG, ZIP massal, dan cetak. */
(function () {
  'use strict';
  var P = window.PASA = window.PASA || {}, U = P.ui;
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
      x.fillText([gl(t.gender), t.jenjang ? t.jenjang : (t.usia ? 'Usia ' + t.usia + ' th' : ''), t.ukuran ? 'Kaos ' + t.ukuran : ''].filter(Boolean).join('  ·  '), W / 2, y2 + 8);
      // status
      var stc = t.statusInfaq === 'Lunas' ? ['#E3EDE3', '#2C4E30'] : t.statusInfaq === 'Bukti Ditolak' ? ['#FFDAD6', '#93000A'] : ['#FFE9DB', '#A33E00'];
      x.font = '800 24px ' + F; var lbl = t.statusInfaq === 'Lunas' ? 'LUNAS · TERVERIFIKASI' : String(t.statusInfaq).toUpperCase(); var bw = x.measureText(lbl).width + 56;
      rr(x, (W - bw) / 2, 1200, bw, 56, 28, stc[0]); x.fillStyle = stc[1]; x.fillText(lbl, W / 2, 1237);
      x.fillStyle = '#7A8492'; x.font = '500 21px ' + F; x.fillText('Tunjukkan QR ini kepada panitia saat check-in', W / 2, 1290);
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }
  // ---------- ZIP (tanpa kompresi) ----------
  var CT = null;
  function crc32(u) {
    if (!CT) { CT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CT[n] = c >>> 0; } }
    var r = -1; for (var i = 0; i < u.length; i++) r = CT[(r ^ u[i]) & 255] ^ (r >>> 8); return (r ^ -1) >>> 0;
  }
  function zip(files) { // files: [{name, data:Uint8Array}]
    var parts = [], cen = [], off = 0, enc = new TextEncoder();
    function w16(v) { return [v & 255, (v >> 8) & 255]; }
    function w32(v) { return [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var nm = enc.encode(f.name), cr = crc32(f.data), sz = f.data.length;
      var lh = new Uint8Array([0x50, 0x4b, 3, 4].concat(w16(20), w16(0x0800), w16(0), w16(0), w16(0x21), w32(cr), w32(sz), w32(sz), w16(nm.length), w16(0)));
      parts.push(lh, nm, f.data);
      cen.push(new Uint8Array([0x50, 0x4b, 1, 2].concat(w16(20), w16(20), w16(0x0800), w16(0), w16(0), w16(0x21), w32(cr), w32(sz), w32(sz), w16(nm.length), w16(0), w16(0), w16(0), w16(0), w32(0), w32(off))), nm);
      off += lh.length + nm.length + sz;
    });
    var cs = 0; cen.forEach(function (c) { cs += c.length; });
    parts = parts.concat(cen, [new Uint8Array([0x50, 0x4b, 5, 6].concat(w16(0), w16(0), w16(files.length), w16(files.length), w32(cs), w32(off), w16(0)))]);
    return new Blob(parts, { type: 'application/zip' });
  }
  function save(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function fname(t) { return 'Tiket-' + t.kode + '-' + String(t.nama).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) + '.png'; }
  function blobToU8(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(new Uint8Array(r.result)); }; r.readAsArrayBuffer(b); }); }
  function blobUrl(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  // Proses berurutan agar memori aman; onProg(i, n)
  function each(items, fn, onProg) {
    var out = [], i = 0;
    return new Promise(function (res, rej) {
      (function next() {
        if (i >= items.length) return res(out);
        makePng(items[i]).then(fn).then(function (v) { out.push(v); i++; if (onProg) onProg(i, items.length); setTimeout(next, 0); }, rej);
      })();
    });
  }
  function downloadOne(t) { return makePng(t).then(function (b) { save(b, fname(t)); }); }
  function downloadZip(items, onProg) {
    return each(items, blobToU8, onProg).then(function (datas) {
      save(zip(datas.map(function (d, i) { return { name: fname(items[i]), data: d }; })), 'Tiket-PASA17-' + items.length + '-peserta.zip');
    });
  }
  function printAll(items, onProg) {
    return each(items, blobUrl, onProg).then(function (urls) {
      var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      document.body.appendChild(f);
      var d = f.contentWindow.document;
      d.open(); d.write('<!doctype html><html><head><meta charset="utf-8"><title>Cetak Tiket PASA 17</title><style>@page{size:A4;margin:6mm}*{box-sizing:border-box}body{margin:0}.g{display:grid;grid-template-columns:repeat(2,90mm);gap:4mm;justify-content:center}.g img{width:90mm;height:auto;display:block;break-inside:avoid}.pg{display:grid;grid-template-columns:repeat(2,90mm);gap:4mm;justify-content:center;page-break-after:always;break-after:page}.pg:last-child{page-break-after:auto;break-after:auto}</style></head><body>' +
        urls.reduce(function (h, u, i) { return h + (i % 4 === 0 ? (i ? '</div>' : '') + '<div class="pg">' : '') + '<img src="' + u + '" alt="">'; }, '') + '</div></body></html>'); d.close();
      var imgs = d.images, left = imgs.length;
      function go() { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { /* abaikan */ } setTimeout(function () { f.remove(); }, 60000); }
      if (!left) return go();
      [].forEach.call(imgs, function (im) { if (im.complete) { if (!--left) go(); } else im.onload = im.onerror = function () { if (!--left) go(); }; });
    });
  }
  P.tiketImg = { makePng: makePng, downloadOne: downloadOne, downloadZip: downloadZip, printAll: printAll, zip: zip };
})();
