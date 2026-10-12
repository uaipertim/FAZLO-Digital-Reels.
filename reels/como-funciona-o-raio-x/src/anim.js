/* =====================================================================
   FAZLO Digital — "Como funciona o raio-x" — 9:16 (1080x1920, 60 fps), 36,6 s

   100% motion graphics. Gesto central: a LINHA DE SCAN lima. Tudo o que ela
   atravessa vira raio-x (negativo lima, estrutura); na virada, ela transforma
   o raio-x no site real da Pousada Vale dos Canteiros (capturas autorizadas,
   src/assets/site/, sem a seção de depoimentos).

   100 BPM · 1 tempo = 0,6 s
     1 gancho      0,0–4,2    ANTES DE DESENHAR QUALQUER TELA, -> (scan) A GENTE FAZ UM RAIO-X.
     2 a coleta    4,2–12,0   a ficha se monta; o scan acende LOGO · FOTOS · CHALÉS · CAFÉ ·
                              PASSEIOS · HISTÓRIA · CONTATOS (miniaturas reais); TUDO O QUE A POUSADA TEM.
     3 o único     12,0–18,0  O QUE SÓ ELA TEM? — 5 chips (dados do site)
     4 o hóspede   18,0–23,4  O QUE O HÓSPEDE PRECISA SABER? — 4 chips
     5 o site      23,4–33,6  "o corte": celular + navegador em raio-x; o scan revela o site real;
                              7 encaixes, cada chip acende a sua seção (2 deles em modais:
                              "Ver detalhes" do chalé e Day Use);
                              CADA SEÇÃO DO SITE NASCE DO RAIO-X.
     6 fechamento  33,6–36,6  logo FAZLO DIGITAL (SVG do kit), Sites para pousadas e negócios
                              locais · Fale com a FAZLO · link na bio

   Fontes oficiais: Unbounded (títulos) e Sora (textos). Lima #C6FA41.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, hash, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 100;
  const { BT } = U.tempo(BPM);                      // 0,6 s
  const b = (n) => +(n * BT).toFixed(4);
  const T = { gancho: 0, coleta: b(7), unico: b(20), precisa: b(30), site: b(39), fecho: b(56) };
  const DURATION = b(61);                            // 36,6 s
  const SCAN1 = { t0: 2.4, t1: 3.3, y0: 240, y1: 1690 };   // passa pela base de "RAIO-X." em 3,0 s
  const RAIOX = 3.0;
  const ROW_T = (i) => 5.4 + 0.6 * i;                // o scan acende cada item da ficha
  const U_T = [13.2, 13.8, 14.4, 15.0, 15.6];        // chips do "único"
  const H_T = [19.5, 20.1, 20.7, 21.3];              // chips do hóspede
  const CUT = T.site;                                // "o corte" (23,4)
  const REVEAL = { t0: 23.52, t1: 23.92 };           // o scan revela o site real
  const FLY = 0.5;

  // ---------------------------------------------------------------- cores e texto
  let DISPLAY, TEXT;
  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', card: '#0E1212', card2: '#151B1B', line: '#263030',
    bar: '#353B3B', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C', dim: '#3A4444',
  };
  const SK = 0.966;
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, fam, size, weight, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function fit(lines, fam, weight, maxW, maxSize, lsK = 0) { let z = maxSize; while (z > 10 && lines.some((s) => measure(s, fam, z, weight, z * lsK) > maxW)) z -= 1; return z; }
  function text(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save(); c.globalAlpha *= clamp(a);
    c.font = fnt(o.fam || TEXT, o.size, o.weight || 600); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
    if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.lineJoin = 'round'; c.strokeText(s, x, y); }
    else { c.fillStyle = o.color || C.white; c.fillText(s, x, y); }
    c.restore();
  }
  // título: palavras sobem de uma fenda (uma por vez) e saem para cima em t1
  function titleBlock(c, lines, t, t0, t1, o) {
    if (t < t0 || t > t1 + 0.7) return;
    const size = o.size, lh = size * (o.lh || 1.12), ls = -size * 0.02, wt = o.weight || 900;
    let k = 0;
    lines.forEach((line, li) => {
      const y = o.y + li * lh;
      const total = measure(line, DISPLAY, size, wt, ls), sp = measure(' ', DISPLAY, size, wt, ls);
      let x = (o.x ?? W / 2) - (o.align === 'left' ? 0 : total / 2);
      c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, 3 * W, size * 1.32); c.clip();
      for (const w of line.split(' ')) {
        const ww = measure(w, DISPLAY, size, wt, ls);
        const ti = t0 + k * (o.st ?? 0.07), p = E.outExpo(prog(t, ti, ti + 0.5));
        const q = E.inCubic(prog(t, t1 + k * 0.025, t1 + k * 0.025 + 0.28));
        const lime = o.lime && o.lime.some((s) => w.startsWith(s));
        if (p > 0 && q < 1) text(c, w, x, y + (1 - p) * size * 1.15 - q * size * 1.2, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : C.white, ls });
        x += ww + sp; k++;
      }
      c.restore();
    });
  }

  // ---------------------------------------------------------------- ícones (traço)
  function icon(c, kind, x, y, s, color = C.white, lw = 0.09) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'pin':
        c.moveTo(0, 0.45); c.bezierCurveTo(-0.38, 0.05, -0.36, -0.1, -0.36, -0.12); c.arc(0, -0.12, 0.36, Math.PI, 0); c.bezierCurveTo(0.36, -0.1, 0.38, 0.05, 0, 0.45); c.closePath();
        c.moveTo(0.13, -0.12); c.arc(0, -0.12, 0.13, 0, TAU); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'bed': c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'list':
        for (let k = 0; k < 3; k++) { const yy = -0.24 + k * 0.24; c.moveTo(-0.36, yy); c.lineTo(-0.27, yy + 0.08); c.lineTo(-0.14, yy - 0.08); c.moveTo(-0.02, yy); c.lineTo(0.38, yy); } break;
      case 'hat':                                   // chapéu de tropeiro
        c.ellipse(0, 0.16, 0.46, 0.1, 0, 0, TAU); c.moveTo(-0.24, 0.12); c.bezierCurveTo(-0.26, -0.12, -0.18, -0.3, 0, -0.3); c.bezierCurveTo(0.18, -0.3, 0.26, -0.12, 0.24, 0.12);
        c.moveTo(-0.22, 0.0); c.lineTo(0.22, 0.0); break;
      case 'door':
        c.moveTo(-0.24, 0.42); c.lineTo(-0.24, -0.16); c.arc(0, -0.16, 0.24, Math.PI, 0); c.lineTo(0.24, 0.42); c.closePath(); c.moveTo(0.13, 0.1); c.arc(0.1, 0.1, 0.03, 0, TAU);
        c.moveTo(-0.38, 0.42); c.lineTo(0.38, 0.42); break;
      case 'drop':
        c.moveTo(0, -0.42); c.bezierCurveTo(0.12, -0.24, 0.32, -0.04, 0.32, 0.14); c.arc(0, 0.14, 0.32, 0, Math.PI); c.bezierCurveTo(-0.32, -0.04, -0.12, -0.24, 0, -0.42); c.closePath(); break;
      case 'fire':
        c.moveTo(0, 0.42); c.bezierCurveTo(-0.34, 0.42, -0.4, 0.06, -0.18, -0.16); c.bezierCurveTo(-0.16, -0.02, -0.08, 0.04, -0.04, 0.04);
        c.bezierCurveTo(-0.12, -0.18, 0.0, -0.36, 0.12, -0.44); c.bezierCurveTo(0.12, -0.2, 0.4, -0.06, 0.34, 0.16); c.bezierCurveTo(0.3, 0.34, 0.16, 0.42, 0, 0.42); c.closePath(); break;
      case 'sun':
        c.arc(0, 0, 0.16, 0, TAU); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; c.moveTo(Math.cos(a) * 0.27, Math.sin(a) * 0.27); c.lineTo(Math.cos(a) * 0.4, Math.sin(a) * 0.4); } break;
      case 'chat':                                  // contato por mensagem (genérico)
        c.moveTo(-0.3, 0.36); c.lineTo(-0.24, 0.16); c.arc(0, -0.02, 0.36, 2.35, 2.35 + TAU * 0.93); c.closePath();
        c.moveTo(-0.12, -0.12); c.quadraticCurveTo(-0.12, 0.12, 0.12, 0.12); break;
      case 'camera': c.roundRect(-0.4, -0.4, 0.8, 0.8, 0.22); c.moveTo(0.19, 0); c.arc(0, 0, 0.19, 0, TAU); c.moveTo(0.29, -0.25); c.arc(0.26, -0.25, 0.03, 0, TAU); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'signal': for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery': c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function checkBadge(c, x, y, r, a = 1) {
    if (a <= 0.01 || r <= 0.5) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = C.lime; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    icon(c, 'check', x, y + r * 0.04, r * 1.6, C.ink, 0.13); c.restore();
  }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.005) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }

  // ---------------------------------------------------------------- linha de scan (gesto central)
  // horizontal, com núcleo branco-lima, brilho e uma faixa de "leitura" que fica para trás
  function scanLine(c, y, x0, x1, a = 1, dir = 1) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a;
    const band = 150;
    const g = c.createLinearGradient(0, y, 0, y - dir * band);
    g.addColorStop(0, rgba(C.lime, 0.28)); g.addColorStop(1, rgba(C.lime, 0));
    c.fillStyle = g; c.fillRect(x0, dir > 0 ? y - band : y, x1 - x0, band);
    c.shadowColor = C.lime; c.shadowBlur = 24;
    c.fillStyle = C.lime; c.fillRect(x0, y - 3, x1 - x0, 6);
    c.shadowBlur = 0; c.fillStyle = '#F2FFD0'; c.fillRect(x0, y - 1, x1 - x0, 2);
    c.fillStyle = C.lime;                                        // marcas nas pontas
    c.fillRect(x0, y - 14, 4, 28); c.fillRect(x1 - 4, y - 14, 4, 28);
    c.restore();
  }

  // planta genérica de um site (gancho): o que o raio-x enxerga por trás de qualquer tela
  function blueprint(c, a) {
    c.save(); c.globalAlpha *= a * 0.5; c.strokeStyle = C.lime; c.fillStyle = C.lime; c.lineWidth = 2;
    const L = 150, R = 930;
    c.strokeRect(L, 300, R - L, 54); c.fillRect(L + 24, 320, 120, 14); [0, 1, 2].forEach((i) => c.fillRect(R - 260 + i * 80, 322, 56, 10));
    c.strokeRect(L, 380, R - L, 230); c.beginPath(); c.moveTo(L, 380); c.lineTo(R, 610); c.moveTo(R, 380); c.lineTo(L, 610); c.stroke();
    c.setLineDash([8, 8]); c.strokeRect(L, 1230, R - L, 300); c.setLineDash([]);
    [0, 1, 2].forEach((i) => { const x = L + 24 + i * 256; c.strokeRect(x, 1260, 228, 150); c.beginPath(); c.moveTo(x, 1260); c.lineTo(x + 228, 1410); c.moveTo(x + 228, 1260); c.lineTo(x, 1410); c.stroke(); c.fillRect(x, 1432, 160, 12); c.fillRect(x, 1458, 110, 10); });
    c.restore();
  }

  // ---------------------------------------------------------------- site real (capturas)
  let MAN, IMG;
  function loadManifest() {
    const x = new XMLHttpRequest(); x.open('GET', '/reels/como-funciona-o-raio-x/src/assets/site/manifest.json', false); x.send();
    MAN = JSON.parse(x.responseText);
  }
  const img = (file) => IMG[file.replace(/\.jpg$/, '')];
  // raio-x: o negativo da imagem tingido de lima
  function drawX(c, im, sx, sy, sw, sh, dx, dy, dw, dh, photo = false) {
    c.save();
    c.filter = photo ? 'grayscale(1) invert(1) contrast(1.25) brightness(0.62)' : 'grayscale(1) invert(1) contrast(1.6) brightness(1.35)';
    c.drawImage(im, sx, sy, sw, sh, dx, dy, dw, dh);
    c.filter = 'none';
    c.globalCompositeOperation = 'multiply'; c.fillStyle = C.lime; c.fillRect(dx, dy, dw, dh);
    c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(198,250,65,0.07)'; c.fillRect(dx, dy, dw, dh);
    c.restore();
  }
  // página do dispositivo (dev: 'mobile' | 'desktop') rolada em `scroll` (px CSS), dentro do retângulo r.
  // xrayFrom: abaixo desta linha (y do quadro) a página aparece em raio-x
  function drawPage(c, dev, scroll, r, xrayFrom = null) {
    const D = MAN[dev], k = r.w / D.W, vis = r.h / k, s1 = scroll + vis;
    const pass = (xr) => {
      for (const ch of D.chunks) {
        const a0 = Math.max(ch.y, scroll), a1 = Math.min(ch.y + ch.h, s1);
        if (a1 <= a0) continue;
        const im = img(ch.file), q = D.dpr;
        const args = [im, 0, (a0 - ch.y) * q, im.width, (a1 - a0) * q, r.x, r.y + (a0 - scroll) * k, r.w, (a1 - a0) * k];
        if (xr) drawX(c, ...args); else c.drawImage(...args);
      }
      const mp = D.map;
      if (mp && mp.y < s1 && mp.y + mp.h > scroll) {
        const im = img(mp.file), args = [im, 0, 0, im.width, im.height, r.x + mp.x * k, r.y + (mp.y - scroll) * k, mp.w * k, mp.h * k];
        if (xr) drawX(c, ...args); else c.drawImage(...args);
      }
    };
    c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
    c.fillStyle = '#F4F0E8'; c.fillRect(r.x, r.y, r.w, r.h);
    if (xrayFrom === null || xrayFrom <= r.y) pass(false);
    else if (xrayFrom >= r.y + r.h) { c.fillStyle = C.ink; c.fillRect(r.x, r.y, r.w, r.h); pass(true); wire(c, dev, scroll, r); }
    else {
      c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, xrayFrom - r.y); c.clip(); pass(false); c.restore();
      c.save(); c.beginPath(); c.rect(r.x, xrayFrom, r.w, r.y + r.h - xrayFrom); c.clip(); c.fillStyle = C.ink; c.fillRect(r.x, r.y, r.w, r.h); pass(true); wire(c, dev, scroll, r); c.restore();
    }
    c.restore();
  }
  // estrutura (planta) por cima do raio-x: caixas das seções, fotos e títulos medidos na captura
  function wire(c, dev, scroll, r) {
    const D = MAN[dev], k = r.w / D.W;
    const R = (bx) => [r.x + bx.x * k, r.y + (bx.y - scroll) * k, bx.w * k, bx.h * k];
    c.save(); c.strokeStyle = rgba(C.lime, 0.75); c.lineWidth = 1.5; c.setLineDash([6, 6]);
    Object.values(D.sections).forEach((bx) => { const [x, y, w, h] = R(bx); c.strokeRect(x + 3, y + 3, w - 6, h - 6); });
    c.setLineDash([]);
    Object.values(D.images).forEach((bx) => { if (!bx) return; const [x, y, w, h] = R(bx); c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke(); });
    c.fillStyle = rgba(C.lime, 0.8);
    Object.values(D.anchors).forEach((bx) => { if (!bx) return; const [x, y, w, h] = R(bx); c.fillRect(x, y + h * 0.3, Math.min(w, r.w * 0.6), Math.max(3, h * 0.4)); });
    c.restore();
  }
  // recorte de uma caixa da captura (px CSS) para o retângulo de destino (preenche, centralizado)
  function crop(c, dev, bx, dx, dy, dw, dh, xr = false) {
    const D = MAN[dev], q = D.dpr, ar = dw / dh;
    let w = bx.w, h = bx.w / ar;
    if (h > bx.h) { h = bx.h; w = h * ar; }
    const sx0 = bx.x + (bx.w - w) / 2, sy0 = bx.y + (bx.h - h) / 2;
    const ch = D.chunks.find((cc) => sy0 >= cc.y && sy0 + h <= cc.y + cc.h) || D.chunks.find((cc) => sy0 >= cc.y && sy0 < cc.y + cc.h);
    const im = img(ch.file);
    const args = [im, Math.max(0, sx0) * q, (sy0 - ch.y) * q, w * q, Math.min(h, ch.y + ch.h - sy0) * q, dx, dy, dw, dh];
    if (xr) drawX(c, ...args, true); else c.drawImage(...args);
  }

  // ---------------------------------------------------------------- celular e navegador
  const PH = { w: 460, h: 930 };
  const PHONE = { x: 522, y: 578, s: 0.9 };
  const PSCR = { x: PHONE.x + 14 * PHONE.s, y: PHONE.y + 14 * PHONE.s, w: (PH.w - 28) * PHONE.s, h: (PH.h - 28) * PHONE.s };
  const BRW = { x: 40, y: 636, w: 840, h: 524 };
  const BSCR = { x: BRW.x + 2, y: BRW.y + 54, w: BRW.w - 4, h: BRW.h - 56 };
  function phoneShell(c, x, y, s, inner, dim = 0) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
    rrect(c, 0, 0, PH.w, PH.h, 62); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, 0, 0, PH.w, PH.h, 62); c.lineWidth = 3; c.strokeStyle = '#30363A'; c.stroke();
    c.restore();
    c.save(); rrect(c, PSCR.x, PSCR.y, PSCR.w, PSCR.h, 50 * s); c.clip();
    inner();
    c.save(); c.globalAlpha *= 0.94; c.fillStyle = U.mix('#F4F0E8', '#5E5B56', clamp(dim)); c.fillRect(PSCR.x, PSCR.y, PSCR.w, 40); c.restore();   // barra de status
    icon(c, 'signal', PSCR.x + PSCR.w - 110, PSCR.y + 22, 24, C.ink); icon(c, 'battery', PSCR.x + PSCR.w - 50, PSCR.y + 22, 30, C.ink, 0.07);
    c.restore();
    c.save(); c.translate(x, y); c.scale(s, s); rrect(c, PH.w / 2 - 58, 28, 116, 32, 16); c.fillStyle = '#000'; c.fill(); c.restore();
  }
  function browserShell(c, inner) {
    const { x, y, w, h } = BRW;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    rrect(c, x, y, w, h, 20); c.fillStyle = '#0D1010'; c.fill(); c.restore();
    rrect(c, x, y, w, h, 20); c.lineWidth = 2; c.strokeStyle = '#2E3434'; c.stroke();
    [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(x + 26 + i * 20, y + 27, 6.5, 0, TAU); c.fillStyle = '#3A4040'; c.fill(); });
    rrect(c, x + 100, y + 12, w - 130, 30, 15); c.fillStyle = '#1A1F1F'; c.fill();
    icon(c, 'lock', x + 122, y + 27, 20, C.muted, 0.09);
    text(c, 'pousadavaledoscanteiros.com.br', x + 138, y + 33, { size: 16, weight: 500, color: C.soft });
    c.save(); rrect(c, BSCR.x, BSCR.y, BSCR.w, BSCR.h, 16); c.clip(); inner(); c.restore();
  }

  // ---------------------------------------------------------------- chips
  const CH = {
    tropeiros: { label: 'Fazenda de tropeiros', ic: 'hat', kind: 'U' },
    desde: { label: 'Desde 2009', ic: 'door', kind: 'U' },
    cachoeiras: { label: 'Cachoeiras na fazenda', ic: 'drop', kind: 'U' },
    fogao: { label: 'Fogão a lenha', ic: 'fire', kind: 'U' },
    dayuse: { label: 'Day Use', ic: 'sun', kind: 'U' },
    datas: { label: 'Datas e hóspedes', ic: 'cal', kind: 'H' },
    chale: { label: 'Qual chalé', ic: 'bed', kind: 'H' },
    chegar: { label: 'Como chegar', ic: 'pin', kind: 'H' },
    incluso: { label: 'O que está incluso', ic: 'list', kind: 'H' },
  };
  const U_ORDER = ['tropeiros', 'desde', 'cachoeiras', 'fogao', 'dayuse'];
  const H_ORDER = ['datas', 'chale', 'chegar', 'incluso'];
  const CHIP_H = 84, CHIP_FS = 36;
  const chipW = (key) => measure(CH[key].label, TEXT, CHIP_FS, 700) + 118;
  // chip centrado em (x, y); U = cheio (o que só ela tem), H = contorno (o que o hóspede precisa)
  function chip(c, key, x, y, s, o = {}) {
    if (s <= 0.01 || (o.alpha ?? 1) <= 0.01) return;
    const ch = CH[key], w = chipW(key), hh = CHIP_H;
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= clamp(o.alpha ?? 1);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
    rrect(c, -w / 2, -hh / 2, w, hh, hh / 2); c.fillStyle = ch.kind === 'U' ? C.white : C.card; c.fill(); c.restore();
    if (ch.kind === 'H') { rrect(c, -w / 2, -hh / 2, w, hh, hh / 2); c.lineWidth = 3; c.strokeStyle = C.lime; c.stroke(); }
    if (o.lit > 0) { c.save(); c.shadowColor = C.lime; c.shadowBlur = 30 * o.lit; rrect(c, -w / 2, -hh / 2, w, hh, hh / 2); c.lineWidth = 4; c.strokeStyle = rgba(C.lime, o.lit); c.stroke(); c.restore(); }
    const ix = -w / 2 + 44;
    c.beginPath(); c.arc(ix, 0, 27, 0, TAU);
    if (ch.kind === 'U') { c.fillStyle = C.lime; c.fill(); icon(c, ch.ic, ix, 0, 36, C.ink, 0.1); }
    else { c.lineWidth = 2.5; c.strokeStyle = rgba(C.lime, 0.6); c.stroke(); icon(c, ch.ic, ix, 0, 36, C.lime, 0.1); }
    text(c, ch.label, ix + 40, 13, { size: CHIP_FS, weight: 700, color: ch.kind === 'U' ? C.ink : C.white });
    c.restore();
  }

  // ---------------------------------------------------------------- logo oficial (SVG do kit, montada pelas formas)
  let LOGO = null;
  function loadLogo() {
    const x = new XMLHttpRequest(); x.open('GET', '/brand/logo/kit/FAZLO-DIGITAL-branca-transparente.svg', false); x.send();
    const doc = new DOMParser().parseFromString(x.responseText, 'image/svg+xml');
    const vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    const paths = [...doc.querySelectorAll('path')].map((p) => ({ fill: p.getAttribute('fill'), d: p.getAttribute('d') }));
    const subs = paths[0].d.split(/(?=M)/).filter((s) => s.trim()).map((d) => {
      const n = d.match(/-?\d+\.?\d*/g).map(Number), xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
      return { d, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
    const inside = (a, o) => o !== a && o.x0 <= a.x0 && o.x1 >= a.x1 && o.y0 <= a.y0 && o.y1 >= a.y1;
    const pieces = [];
    subs.forEach((s) => {
      if (subs.some((o) => inside(s, o))) return;
      const holes = subs.filter((o) => inside(o, s));
      pieces.push({ path: new Path2D([s.d, ...holes.map((hh) => hh.d)].join(' ')), x0: s.x0, x1: s.x1, y0: s.y0, y1: s.y1 });
    });
    pieces.sort((a, b2) => a.x0 - b2.x0);
    LOGO = { vb, pieces, slash: { path: new Path2D(paths[1].d), fill: paths[1].fill }, digital: { path: new Path2D(paths[2].d), fill: paths[2].fill } };
  }
  // logo com largura w (do arquivo) centrada em (cx, cy), montada a partir de t0
  function drawLogo(c, cx, cy, w, t, t0, a = 1) {
    if (!LOGO || a <= 0.01) return;
    const [vx, vy, vw, vh] = LOGO.vb, s = w / vw;
    c.save(); c.globalAlpha *= a;
    c.translate(cx - (vw / 2) * s, cy - (vh / 2) * s); c.scale(s, s); c.translate(-vx, -vy);
    LOGO.pieces.forEach((pc, i) => {
      const p = E.outExpo(prog(t, t0 + i * 0.05, t0 + i * 0.05 + 0.5));
      if (p <= 0) return;
      c.save(); c.beginPath(); c.rect(pc.x0 - 4, pc.y0 - 4, pc.x1 - pc.x0 + 8, pc.y1 - pc.y0 + 8); c.clip();
      c.translate(0, (1 - p) * (pc.y1 - pc.y0 + 10));
      c.fillStyle = '#FFFFFF'; c.fill(pc.path, 'evenodd'); c.restore();
    });
    const ps = E.outCubic(prog(t, t0 + 0.18, t0 + 0.55));
    if (ps > 0) { c.save(); c.beginPath(); const yb = 124 - (124 - 26) * ps; c.rect(200, yb, 160, 130); c.clip(); c.fillStyle = LOGO.slash.fill; c.fill(LOGO.slash.path, 'evenodd'); c.restore(); }
    const pd = prog(t, t0 + 0.45, t0 + 0.85);
    if (pd > 0) { c.save(); c.globalAlpha *= pd; c.translate((1 - E.outCubic(pd)) * 30, 0); c.fillStyle = LOGO.digital.fill; c.fill(LOGO.digital.path, 'evenodd'); c.restore(); }
    c.restore();
  }

  // ---------------------------------------------------------------- textos
  const L1 = ['ANTES DE DESENHAR', 'QUALQUER TELA,'];
  const L2 = ['A GENTE FAZ', 'UM RAIO-X.'];
  const L_TUDO = ['TUDO O QUE A', 'POUSADA TEM.'];
  const L_SO = ['O QUE SÓ', 'ELA TEM?'];
  const L_PRECISA = ['O QUE O HÓSPEDE', 'PRECISA SABER?'];
  const L_NASCE = ['CADA SEÇÃO DO SITE', 'NASCE DO RAIO-X.'];
  let S1, S2, S_TUDO, S_SO, S_PRE, S_NASCE;
  const Y1 = 740, Y2 = 1090;

  // ---------------------------------------------------------------- ficha (cena 2)
  const FX = 120, FY = 440, FW = 840, FH = 990, ROW0 = FY + 130, ROWH = 122;
  const ITEMS = ['LOGO', 'FOTOS', 'CHALÉS', 'CAFÉ', 'PASSEIOS', 'HISTÓRIA', 'CONTATOS'];
  let THUMB;                                          // caixas (px CSS, celular) das miniaturas reais
  function ficha(c, t, scanY, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0.01) return;
    const build = o.build ?? 1;
    c.save(); c.globalAlpha *= a;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20;
    rrect(c, FX, FY, FW, FH * E.outCubic(clamp(build * 1.4)), 30); c.fillStyle = C.card; c.fill(); c.restore();
    rrect(c, FX, FY, FW, FH * E.outCubic(clamp(build * 1.4)), 30); c.lineWidth = 2; c.strokeStyle = C.line; c.stroke();
    const ha = prog(build, 0.2, 0.5);
    text(c, 'RAIO-X', FX + 44, FY + 66, { fam: DISPLAY, size: 40, weight: 900, color: C.lime, alpha: ha, ls: 1 });
    text(c, 'Pousada Vale dos Canteiros', FX + 44, FY + 106, { size: 28, weight: 600, color: C.soft, alpha: ha });
    for (let k = 0; k < 16; k++) { const bw = hash(k, 5) > 0.6 ? 5 : 2; c.fillStyle = rgba(C.soft, 0.5 * ha); c.fillRect(FX + FW - 230 + k * 11, FY + 52, bw, 44); }   // código da ficha
    for (let i = 0; i < 7; i++) {
      const ry = ROW0 + i * ROWH, mid = ry + ROWH / 2;
      const ra = prog(build, 0.35 + i * 0.07, 0.55 + i * 0.07);
      if (ra <= 0) continue;
      c.save(); c.globalAlpha *= ra;
      c.fillStyle = C.line; c.fillRect(FX + 30, ry, FW - 60, 1.5);
      const lit = o.lit ? o.lit(i) : 0;
      const ck = E.outBack(clamp(lit * 1.5));
      c.beginPath(); c.arc(FX + 62, mid, 20, 0, TAU); c.lineWidth = 2.5; c.strokeStyle = lit > 0 ? C.lime : C.dim; c.stroke();
      if (ck > 0) checkBadge(c, FX + 62, mid, 20 * ck, 1);
      text(c, ITEMS[i], FX + 104, mid + 15, { fam: DISPLAY, size: 40, weight: 800, color: lit > 0 ? U.mix(C.dim, C.white, clamp(lit * 2)) : C.dim });
      const tx = FX + FW - 316, ty = mid - 44, tw = 270, th = 88;          // miniatura real
      c.save(); rrect(c, tx, ty, tw, th, 12); c.clip();
      c.fillStyle = C.ink; c.fillRect(tx, ty, tw, th);
      if (i === 6) thumbContacts(c, tx, ty, tw, th, scanY);
      else {
        crop(c, 'mobile', THUMB[i], tx, ty, tw, th, true);
        if (scanY > ty) { c.save(); c.beginPath(); c.rect(tx, ty, tw, Math.min(th, scanY - ty)); c.clip(); crop(c, 'mobile', THUMB[i], tx, ty, tw, th, false); c.restore(); }
      }
      const sh = o.shine || 0;                                            // brilho que passa pelas fotos
      if (sh > 0 && sh < 1) {
        const bx = tx - 120 + (tw + 240) * E.inOutSine(clamp(sh * 1.4 - i * 0.06));
        const gb = c.createLinearGradient(bx - 60, 0, bx + 60, 0);
        gb.addColorStop(0, 'rgba(255,255,255,0)'); gb.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gb.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gb; c.fillRect(tx, ty, tw, th);
      }
      c.restore();
      rrect(c, tx, ty, tw, th, 12); c.lineWidth = 2; c.strokeStyle = lit > 0 ? rgba(C.lime, 0.5 + 0.5 * kick(t, ROW_T(i), 0.5)) : C.dim; c.setLineDash(lit > 0 ? [] : [7, 6]); c.stroke(); c.setLineDash([]);
      c.restore();
    }
    c.restore();
  }
  function thumbContacts(c, tx, ty, tw, th, scanY) {          // CONTATOS: só ícones (sem nomes nem números)
    const on = scanY > ty + th / 2;
    const col = on ? C.lime : rgba(C.lime, 0.35);
    [['chat', tx + tw * 0.33], ['camera', tx + tw * 0.67]].forEach(([ic, x]) => {
      c.beginPath(); c.arc(x, ty + th / 2, 30, 0, TAU); c.fillStyle = on ? '#1B2222' : '#101414'; c.fill();
      icon(c, ic, x, ty + th / 2, 40, col, 0.09);
    });
  }
  const scanAt = (t) => lerp(ROW0, ROW0 + 7 * ROWH, clamp((t - 5.1) / 4.2));

  // ---------------------------------------------------------------- cena 5: alvos no site
  // cada encaixe: instante de chegada, chips, alvo (seção na página, ou modal)
  const DOCKS = [
    { t: 24.0, keys: ['datas'], to: 'consulte' },
    { t: 25.45, keys: ['chale'], to: 'chales' },
    { t: 26.35, keys: ['incluso'], to: 'modal' },       // modal "Ver detalhes" do chalé
    { t: 27.82, keys: ['cachoeiras'], to: 'viver' },
    { t: 28.75, keys: ['dayuse'], to: 'dayuse' },       // modal do Day Use
    { t: 30.22, keys: ['fogao'], to: 'sabores' },
    { t: 31.42, keys: ['tropeiros', 'desde'], to: 'historia' },
    { t: 32.67, keys: ['chegar'], to: 'onde' },
  ];
  const MODAL = { open: 26.1, close: 27.0 };
  const DAYM = { open: 28.5, close: 29.45 };
  let TGT;                                            // retângulos (px CSS) e rolagem por alvo, celular e desktop
  function buildTargets() {
    const m = MAN.mobile, d = MAN.desktop;
    const visM = PSCR.h / (PSCR.w / m.W), visD = BSCR.h / (BSCR.w / d.W);
    const R = (x, y0, y1, w) => ({ x, y: y0, w, h: y1 - y0 });
    const mob = {
      consulte: R(10, m.anchors.consulte.y - 26, m.anchors.consulte.y + 620, 370),
      chales: R(10, m.anchors.chales.y - 44, m.images.chales.y + m.images.chales.h + 10, 370),
      viver: R(10, m.anchors.viver.y - 14, m.images.passeios.y + m.images.passeios.h + 10, 370),
      sabores: R(10, m.anchors.sabores.y - 14, m.images.cafe.y + m.images.cafe.h * 0.72, 370),
      historia: R(10, m.anchors.historia.y - 14, m.sections.historia.y + m.sections.historia.h - 20, 370),
      onde: R(10, m.anchors.onde.y - 14, m.map.y + m.map.h + 10, 370),
    };
    const desk = {
      consulte: R(96, d.sections.disponibilidade.y + 6, d.sections.disponibilidade.y + d.sections.disponibilidade.h - 8, 1248),
      chales: R(80, d.anchors.chales.y - 50, Math.min(d.firstCard.y + d.firstCard.h, d.anchors.chales.y - 50 + visD - 90), 1280),
      viver: R(80, d.anchors.viver.y - 20, d.images.passeios.y + d.images.passeios.h + 10, 1280),
      sabores: R(80, d.anchors.sabores.y - 20, d.anchors.sabores.y + visD - 110, 1280),
      historia: R(80, d.anchors.historia.y - 20, d.sections.historia.y + d.sections.historia.h - 40, 1280),
      onde: R(80, d.anchors.onde.y - 20, d.map.y + d.map.h + 10, 1280),
    };
    const scrollFor = (rr, vis, top) => Math.max(0, rr.y - top);
    TGT = {};
    for (const k of Object.keys(mob)) TGT[k] = { m: mob[k], d: desk[k], sm: scrollFor(mob[k], visM, 116), sd: scrollFor(desk[k], visD, 40) };   // 116: a etiqueta do chip fica abaixo da barra de status
    TGT.consulte.sm = Math.max(0, m.anchors.consulte.y - 150);
    // alvos dentro dos modais (px CSS da área visível capturada)
    const inc = m.modal.incluso, du = m.dayuse, dd = d.dayuse;
    TGT.modal = { m: { x: inc.x - 10, y: inc.y - 10, w: inc.w + 20, h: inc.h + 20 } };
    TGT.dayuse = {
      m: { x: du.cachoeiras.x - 10, y: du.cachoeiras.y - 8, w: du.cachoeiras.w + 20, h: du.cachoeiras.h + 16 },
      d: { x: dd.cachoeiras.x - 10, y: dd.cachoeiras.y - 8, w: dd.cachoeiras.w + 20, h: dd.cachoeiras.h + 16 },
      mt: du.title, dt: dd.title,
    };
  }
  // rolagem (px CSS) do celular e do desktop no instante t: vai de alvo em alvo antes de cada encaixe
  const PAGE_STEPS = () => DOCKS.filter((dk) => TGT[dk.to] && TGT[dk.to].sm !== undefined);
  // entre um encaixe e outro a página deriva devagar (nunca congela); a deriva recomeça a cada seção
  const DRIFT = 9;                                    // px CSS por segundo
  function scrollAt(t, dev) {
    const steps = PAGE_STEPS(), key = dev === 'm' ? 'sm' : 'sd';
    let s = TGT[steps[0].to][key] + DRIFT * Math.max(0, t - CUT);
    for (let i = 1; i < steps.length; i++) {
      const st = steps[i], t0 = st.t - 0.62, t1 = st.t - 0.12;
      if (t < t0) break;
      const from = TGT[steps[i - 1].to][key] + DRIFT * (t0 - (i === 1 ? CUT : steps[i - 1].t - 0.12));
      const next = TGT[st.to][key];
      s = t < t1 ? lerp(from, next, E.inOutCubic(prog(t, t0, t1))) : next + DRIFT * (t - t1);
    }
    return s;
  }
  const modalAlpha = (t, M) => E.outCubic(prog(t, M.open, M.open + 0.22)) * (1 - E.inCubic(prog(t, M.close, M.close + 0.17)));

  // posição de bandeja (cenas 4 e 5) e de encaixe de cada chip
  let TRAY4, TRAY5;
  function buildTrays() {
    const row = (keys, y, s, gap = 16) => {
      const ws = keys.map((k) => chipW(k) * s), tot = ws.reduce((a, v) => a + v, 0) + gap * (keys.length - 1);
      let x = W / 2 - tot / 2; const out = {};
      keys.forEach((k, i) => { out[k] = { x: x + ws[i] / 2, y, s }; x += ws[i] + gap; });
      return out;
    };
    TRAY4 = { ...row(['tropeiros', 'desde', 'cachoeiras'], 292, 0.56), ...row(['fogao', 'dayuse'], 350, 0.56) };
    TRAY5 = { ...row(['tropeiros', 'desde', 'cachoeiras'], 404, 0.56), ...row(['fogao', 'dayuse', 'datas'], 458, 0.56), ...row(['chale', 'chegar', 'incluso'], 512, 0.56) };
  }
  // retângulo (no quadro) de um alvo, no celular, no instante t (acompanha a rolagem)
  function targetRectPhone(to, t) {
    const k = PSCR.w / MAN.mobile.W;
    if (to === 'modal' || to === 'dayuse') { const r = TGT[to].m; return { x: PSCR.x + r.x * k, y: PSCR.y + r.y * k, w: r.w * k, h: r.h * k }; }
    const r = TGT[to].m, sc = scrollAt(t, 'm');
    return { x: PSCR.x + r.x * k, y: PSCR.y + (r.y - sc) * k, w: r.w * k, h: r.h * k };
  }
  function dockPoint(dk, j, t) {                      // chips presos como etiquetas na borda de cima da seção
    const r = targetRectPhone(dk.to, t), s = dk.keys.length > 1 ? 0.44 : 0.5;
    let x = r.x + 6;
    for (let i = 0; i < j; i++) x += chipW(dk.keys[i]) * s + 6;
    return { x: x + chipW(dk.keys[j]) * s / 2, y: r.y - 18, s };
  }
  function highlight(c, r, a, t, t0) {
    if (a <= 0.01) return;
    const pulse = kick(t, t0, 0.5);
    c.save(); c.globalAlpha *= a;
    rrect(c, r.x, r.y, r.w, r.h, 12); c.fillStyle = rgba(C.lime, 0.07 + 0.1 * pulse); c.fill();
    c.shadowColor = C.lime; c.shadowBlur = 18 + 20 * pulse;
    rrect(c, r.x, r.y, r.w, r.h, 12); c.lineWidth = 3 + 2 * pulse; c.strokeStyle = C.lime; c.stroke();
    c.restore();
    checkBadge(c, r.x + r.w - 6, r.y + 6, 15 * E.outBack(clamp(prog(t, t0, t0 + 0.3))) * (1 + 0.06 * Math.sin(t * 4)), a);
  }

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);
    const sh = U.noise1(t * 30, 3) * 10 * kick(t, RAIOX, 0.25) + U.noise1(t * 30, 9) * 8 * kick(t, CUT, 0.25);
    c.save(); c.translate(sh, 0);

    // ===== 1 · GANCHO
    if (t < T.coleta + 0.5) {
      const sy = lerp(SCAN1.y0, SCAN1.y1, prog(t, SCAN1.t0, SCAN1.t1));
      const scanOn = t >= SCAN1.t0 && t <= SCAN1.t1 + 0.05;
      const out1 = prog(t, 3.4, 3.9);
      // linha de scan "em espera" no alto, antes de descer (um brilho corre por ela)
      const idle = prog(t, 0.5, 0.9) * (1 - prog(t, SCAN1.t0 - 0.05, SCAN1.t0));
      if (idle > 0) {
        c.save(); c.globalAlpha *= idle * 0.85;
        c.fillStyle = rgba(C.lime, 0.55); c.fillRect(40, SCAN1.y0 - 1.5, W - 80, 3);
        const hx = 40 + ((t * 620) % (W + 200)) - 100, gr = c.createLinearGradient(hx - 110, 0, hx + 110, 0);
        gr.addColorStop(0, rgba(C.lime, 0)); gr.addColorStop(0.5, rgba('#F2FFD0', 1)); gr.addColorStop(1, rgba(C.lime, 0));
        c.fillStyle = gr; c.fillRect(Math.max(40, hx - 110), SCAN1.y0 - 3, Math.min(220, W - 40 - Math.max(40, hx - 110)), 6);
        c.fillStyle = C.lime; c.fillRect(40, SCAN1.y0 - 14, 4, 28); c.fillRect(W - 44, SCAN1.y0 - 14, 4, 28);
        c.restore();
      }
      // frase 1: acima da linha vira raio-x (contorno lima); aproximação lenta enquanto é lida
      c.save(); c.globalAlpha *= 1 - out1;
      const z1 = 1 + 0.045 * E.inOutSine(prog(t, 0, SCAN1.t1));
      c.translate(W / 2, Y1); c.scale(z1, z1); c.translate(-W / 2, -Y1);
      if (t < SCAN1.t0) titleBlock(c, L1, t, -0.32, 99, { size: S1, y: Y1, st: 0.07 });
      else {
        c.save(); c.beginPath(); c.rect(0, sy, W, H); c.clip(); titleBlock(c, L1, t, -0.32, 99, { size: S1, y: Y1 }); c.restore();
        c.save(); c.beginPath(); c.rect(0, 0, W, sy); c.clip();
        L1.forEach((line, i) => text(c, line, W / 2, Y1 + i * S1 * 1.12, { fam: DISPLAY, size: S1, weight: 900, align: 'center', ls: -S1 * 0.02, stroke: rgba(C.lime, 0.75), lw: 2 }));
        c.restore();
      }
      c.restore();
      // frase 2: revelada pela linha; "RAIO-X." em lima, com golpe em 3,0
      const mv = E.inOutCubic(prog(t, 3.75, 4.45));
      if (t >= SCAN1.t0) {
        c.save(); c.beginPath(); c.rect(0, 0, W, t > SCAN1.t1 ? H : sy); c.clip();
        c.globalAlpha *= 1 - prog(t, 4.25, 4.5);
        const sc = lerp(1, 0.42, mv), pop = 1 + 0.08 * kick(t, RAIOX, 0.3);
        c.translate(W / 2, lerp(Y2 + 40, FY + 66, mv)); c.scale(sc * pop, sc * pop); c.translate(-W / 2, -(Y2 + 40));
        const ls = -S2 * 0.02;
        text(c, L2[0], W / 2, Y2, { fam: DISPLAY, size: S2, weight: 900, align: 'center', ls });
        const wU = measure('UM ', DISPLAY, S2, 900, ls), wR = measure('RAIO-X.', DISPLAY, S2, 900, ls), x0 = W / 2 - (wU + wR) / 2;
        text(c, 'UM', x0, Y2 + S2 * 1.12, { fam: DISPLAY, size: S2, weight: 900, ls });
        glow(c, x0 + wU + wR / 2, Y2 + S2 * 0.8, 340, 0.22 * kick(t, RAIOX, 0.6));
        text(c, 'RAIO-X.', x0 + wU, Y2 + S2 * 1.12, { fam: DISPLAY, size: S2, weight: 900, color: C.lime, ls });
        c.restore();
      }
      const bp = (t >= SCAN1.t0 ? 1 : 0) * (1 - prog(t, 3.7, 4.2));
      if (bp > 0) { c.save(); c.beginPath(); c.rect(0, 0, W, t > SCAN1.t1 ? H : sy); c.clip(); blueprint(c, bp); c.restore(); }
      if (scanOn) scanLine(c, sy, 40, W - 40, 1);
    }

    // ===== 2–3 · FICHA
    if (t > T.coleta - 0.1 && t < T.precisa + 0.5) {
      const build = prog(t, T.coleta, T.coleta + 1.0);
      const sY = t < 5.1 ? ROW0 - 1 : t < 9.75 ? scanAt(t) : 9999;
      const mini = E.inOutCubic(prog(t, T.unico, T.unico + 0.6));
      const fade = 1 - prog(t, T.precisa, T.precisa + 0.4);
      c.save();
      const cx = FX + FW / 2, cy = FY + FH / 2;
      const zf = 1 + 0.045 * E.inOutSine(prog(t, 9.4, T.unico + 0.3));        // depois do scan, aproximação lenta
      c.translate(lerp(cx, 540, mini), lerp(cy, 480, mini)); const ms = lerp(1, 0.42, mini) * zf; c.scale(ms, ms); c.translate(-cx, -cy);
      ficha(c, t, sY, { build, alpha: fade, lit: (i) => prog(t, ROW_T(i) - 0.05, ROW_T(i) + 0.25), shine: prog(t, 10.0, 11.4) });
      if (t >= 5.1 && t < 9.75) scanLine(c, sY, FX - 20, FX + FW + 20, 1 - prog(t, 9.5, 9.75));
      const fs = prog(t, 12.45, 12.95);                         // filtro: o scan passa pela ficha
      if (fs > 0 && fs < 1) scanLine(c, lerp(FY + 20, FY + FH - 20, E.inOutSine(fs)), FX - 20, FX + FW + 20, 1);
      c.restore();
    }
    titleBlock(c, L_TUDO, t, 9.6, T.unico - 0.1, { size: S_TUDO, y: 300, lime: ['TUDO'] });

    // ===== 3–5 · CHIPS (estados) e O SITE REAL
    const chips = chipLayout(t);
    CHIPS_DOCKED = chips.filter((q) => q.docked);
    if (t > CUT - 0.05 && t < T.fecho + 0.6) site(c, t);
    chips.filter((q) => !q.docked).forEach((q) => chip(c, q.key, q.x, q.y, q.s, { alpha: q.alpha, lit: q.lit }));
    titleBlock(c, L_SO, t, 12.2, T.precisa - 0.1, { size: S_SO, y: 830, lime: ['SÓ', 'ELA'] });
    titleBlock(c, L_PRECISA, t, T.precisa + 0.3, CUT - 0.95, { size: S_PRE, y: 520, lime: ['PRECISA', 'SABER?'] });
    titleBlock(c, L_NASCE, t, CUT + 0.45, T.fecho - 0.2, { size: S_NASCE, y: 290, lime: ['RAIO-X.'] });
    if (t > T.precisa - 0.05 && t < T.precisa + 0.6) {            // o scan sobe: virada para o hóspede
      const p = prog(t, T.precisa, T.precisa + 0.5);
      scanLine(c, lerp(1520, 240, E.inOutSine(p)), 40, W - 40, 1 - prog(t, T.precisa + 0.42, T.precisa + 0.5), -1);
    }

    // ===== 6 · FECHAMENTO
    if (t > T.fecho - 0.1) {
      const gp = prog(t, T.fecho, T.fecho + 1.0);
      glow(c, 540, 900, 520, 0.1 * gp + 0.03 * Math.sin(t * 3) * gp);
      drawLogo(c, 540, 900, 720, t, T.fecho + 0.02);
      const ls = prog(t, T.fecho, T.fecho + 0.55);
      if (ls > 0 && ls < 1) scanLine(c, lerp(700, 1150, E.inOutSine(ls)), 120, 960, 1 - prog(t, T.fecho + 0.45, T.fecho + 0.55));
      const s1 = E.outCubic(prog(t, 34.4, 34.85));
      text(c, 'Sites para pousadas e negócios locais', W / 2, 1110 + (1 - s1) * 24, { size: 40, weight: 500, color: C.soft, align: 'center', alpha: s1 });
      const s2 = E.outBack(prog(t, 34.9, 35.3), 1.6);
      if (s2 > 0) {
        const lbl = 'Fale com a FAZLO · link na bio', fw = measure(lbl, TEXT, 34, 600) + 120;
        c.save(); c.translate(W / 2, 1228); c.scale(s2, s2);
        rrect(c, -fw / 2, -38, fw, 76, 38); c.fillStyle = C.lime; c.fill();
        text(c, lbl, -fw / 2 + 40, 12, { size: 34, weight: 600, color: C.ink });
        icon(c, 'arrow', fw / 2 - 44, -2 - 4 * Math.sin(t * 6), 34, C.ink, 0.12);
        c.restore();
      }
    }
    c.restore();
  }
  let CHIPS_DOCKED = [];

  // posição de cada chip no instante t: sai da ficha (único) ou entra pelo lado (hóspede), vai para a
  // bandeja, e na cena 5 voa em arco até a sua seção, onde fica preso (docked)
  function chipLayout(t) {
    const out = [];
    if (t < U_T[0] - 0.6 || t > T.fecho + 0.5) return out;
    const place = (key, x, y, s, al) => {
      const i5 = Object.keys(TRAY5).indexOf(key);
      const m5 = E.inOutCubic(prog(t, CUT - 0.75 + i5 * 0.02, CUT - 0.2 + i5 * 0.02));
      const p5 = TRAY5[key];
      let X = lerp(x, p5.x, m5), Y = lerp(y, p5.y, m5), S = lerp(s, p5.s, m5);
      const dk = DOCKS.find((d) => d.keys.includes(key));
      const j = dk.keys.indexOf(key), ta = dk.t + j * 0.15;
      if (t >= ta) { out.push({ key, dk, j, ta, docked: true }); return; }
      const fp = E.inOutCubic(prog(t, ta - FLY, ta));
      if (fp > 0) {
        const dp = dockPoint(dk, j, t);
        const cx2 = (p5.x + dp.x) / 2 + 80, cy2 = Math.min(p5.y, dp.y) - 40;
        X = (1 - fp) * (1 - fp) * p5.x + 2 * (1 - fp) * fp * cx2 + fp * fp * dp.x;
        Y = (1 - fp) * (1 - fp) * p5.y + 2 * (1 - fp) * fp * cy2 + fp * fp * dp.y;
        S = lerp(p5.s, dp.s, fp);
      }
      out.push({ key, x: X, y: Y, s: S, alpha: (al ?? 1) * (1 - prog(t, T.fecho - 0.1, T.fecho + 0.2)), lit: 0.6 * fp });
    };
    U_ORDER.forEach((key, i) => {
      const t0 = U_T[i];
      if (t < t0 - 0.45) return;
      const em = E.outCubic(prog(t, t0 - 0.45, t0));               // sai da ficha
      let x = lerp(540, W / 2, em), y = lerp(480, 1040 + i * 100, em), s = lerp(0.3, 1, E.outBack(prog(t, t0 - 0.45, t0 + 0.05)));
      y += Math.sin(t * 1.4 + i) * 6 * prog(t, t0, t0 + 0.4);
      const m4 = E.inOutCubic(prog(t, T.precisa + i * 0.05, T.precisa + 0.6 + i * 0.05));
      if (m4 > 0) { const p = TRAY4[key]; x = lerp(x, p.x, m4); y = lerp(y, p.y, m4); s = lerp(s, p.s, m4); }
      place(key, x, y, s);
    });
    H_ORDER.forEach((key, i) => {
      const t0 = H_T[i];
      if (t < t0 - 0.2) return;
      const p = E.outBack(prog(t, t0 - 0.2, t0 + 0.2), 1.8);
      const x = W / 2 + (1 - clamp(p)) * 240 * (i % 2 ? 1 : -1), y = 790 + i * 108 + Math.sin(t * 1.3 + i * 2) * 6 * prog(t, t0, t0 + 0.4);
      place(key, x, y, p, clamp(prog(t, t0 - 0.2, t0)));
    });
    return out;
  }
  const nextPage = (dk) => DOCKS.find((d2) => d2.t > dk.t && TGT[d2.to].sm !== undefined);
  // opacidade do destaque/chip de um encaixe no instante t
  function dockAlpha(dk, t, browser = false) {
    let a = prog(t, dk.t, dk.t + 0.15);
    if (dk.to === 'modal') return a * modalAlpha(t, MODAL);
    if (dk.to === 'dayuse') return a * modalAlpha(t, DAYM);
    const np = nextPage(dk);
    if (np) a *= 1 - prog(t, np.t - 0.62, np.t - 0.45);
    return a * (1 - 0.85 * clamp((browser ? 0 : modalAlpha(t, MODAL)) + modalAlpha(t, DAYM)));
  }
  // chips presos a seções da página: ficam até a página rolar para longe; somem sob os modais
  function chipAlpha(dk, t) {
    if (dk.to === 'modal') return modalAlpha(t, MODAL);
    if (dk.to === 'dayuse') return modalAlpha(t, DAYM);
    return prog(t, dk.t, dk.t + 0.1) * (1 - clamp(modalAlpha(t, MODAL) + modalAlpha(t, DAYM)));
  }

  // cena 5: navegador (atrás) + celular (à frente) com o site real
  function site(c, t) {
    const appear = E.outCubic(prog(t, CUT, CUT + 0.25));
    const out = E.inCubic(prog(t, T.fecho - 0.15, T.fecho + 0.4));
    const xr = t < REVEAL.t1 ? lerp(560, 1460, E.inOutSine(prog(t, REVEAL.t0, REVEAL.t1))) : null;   // abaixo: raio-x
    c.save();
    c.globalAlpha *= appear * (1 - out);
    const sc = lerp(0.94, 1, appear) * lerp(1, 0.86, out);
    c.translate(540, 1000); c.scale(sc, sc); c.translate(-540, -1000 - out * 60);
    const dz = 1 + 0.02 * prog(t, CUT, T.fecho);                   // aproximação lenta (nunca congela)
    c.translate(540, 1000); c.scale(dz, dz); c.translate(-540, -1000);
    const sm = scrollAt(t, 'm'), sd = scrollAt(t, 'd');
    // navegador
    browserShell(c, () => {
      drawPage(c, 'desktop', sd, BSCR, xr);
      const da = modalAlpha(t, DAYM);
      if (da > 0) {
        const im = img(MAN.desktop.dayuse.file);
        c.save(); c.globalAlpha *= da; c.drawImage(im, BSCR.x, BSCR.y - (1 - da) * 20, BSCR.w, BSCR.w * im.height / im.width); c.restore();
      }
      const kd = BSCR.w / MAN.desktop.W;
      DOCKS.forEach((dk) => {
        const g = TGT[dk.to];
        if (!g || !g.d || t < dk.t) return;
        const a = dockAlpha(dk, t, true);
        let r;
        if (dk.to === 'dayuse') r = { x: BSCR.x + g.d.x * kd, y: BSCR.y + g.d.y * kd, w: g.d.w * kd, h: g.d.h * kd };
        else r = { x: BSCR.x + g.d.x * kd, y: BSCR.y + (g.d.y - sd) * kd, w: g.d.w * kd, h: g.d.h * kd };
        highlight(c, r, a * 0.9, t, dk.t);
      });
    });
    // celular
    phoneShell(c, PHONE.x, PHONE.y, PHONE.s, () => {
      drawPage(c, 'mobile', sm, PSCR, xr);
      const ov = (file, a) => {
        if (a <= 0) return;
        const im = img(file);
        c.save(); c.globalAlpha *= a; c.drawImage(im, PSCR.x, PSCR.y + (1 - a) * 30, PSCR.w, PSCR.w * im.height / im.width); c.restore();
      };
      ov(MAN.mobile.modal.files[1], modalAlpha(t, MODAL));
      ov(MAN.mobile.dayuse.file, modalAlpha(t, DAYM));
      DOCKS.forEach((dk) => {
        if (t < dk.t) return;
        const a = dockAlpha(dk, t);
        if (a > 0.01) highlight(c, targetRectPhone(dk.to, t), a, t, dk.t);
      });
      // chips presos às suas seções (rolam junto com a página; nos modais, somem com o modal)
      CHIPS_DOCKED.forEach(({ key, dk, j, ta }) => {
        const p = dockPoint(dk, j, t);
        chip(c, key, p.x, p.y, p.s * (1 + 0.08 * kick(t, ta, 0.35)), { alpha: chipAlpha(dk, t), lit: 0.6 + 0.4 * kick(t, ta, 0.5) });
      });
    }, modalAlpha(t, MODAL) + modalAlpha(t, DAYM));
    c.restore();
    if (t >= REVEAL.t0 && t <= REVEAL.t1 + 0.05) scanLine(c, xr ?? 1460, 30, W - 30, 1 - prog(t, REVEAL.t1 - 0.04, REVEAL.t1 + 0.05));
    // "o corte": a barra lima varre na diagonal
    const wp = prog(t, CUT - 0.12, CUT + 0.4);
    if (wp > 0 && wp < 1) {
      const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wp)), bw = 120;
      c.beginPath(); c.moveTo(x0 + SK * 1200 - bw / 2, -200); c.lineTo(x0 + SK * 1200 + bw / 2, -200); c.lineTo(x0 - SK * 1200 + bw / 2, 2200); c.lineTo(x0 - SK * 1200 - bw / 2, 2200); c.closePath();
      c.fillStyle = C.lime; c.fill();
    }
  }

  // ---------------------------------------------------------------- pós: vinheta e grão leves
  let GRAIN, VIG;
  function post(ctx, t) {
    if (!GRAIN) {
      GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 384;
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = U.rng(4);
      for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 80; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      VIG = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.38, W / 2, H * 0.5, H * 0.82);
      VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,0.5)');
    }
    ctx.globalAlpha = 1; ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
    const f = Math.floor(t * 60 + 1e-6);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.05;
    const ox = -Math.floor(hash(f, 1) * 384), oy = -Math.floor(hash(f, 2) * 384);
    for (let y = oy; y < H; y += 384) for (let x = ox; x < W; x += 384) ctx.drawImage(GRAIN, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  FZD.define({
    id: 'como-funciona-o-raio-x',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [3, 1 / 120],
      ranges: [[2.35, 3.4, 5, 1 / 120], [3.7, 4.6, 4, 1 / 120], [12.0, 12.7, 4, 1 / 120], [CUT - 0.15, T.fecho + 0.5, 5, 1 / 110]],
    },

    setup(api) {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      IMG = api.assets;
      loadLogo(); loadManifest();
      const m = MAN.mobile;
      THUMB = [
        { x: m.anchors.logo.x - 8, y: m.anchors.logo.y - 10, w: m.anchors.logo.w + 16, h: m.anchors.logo.h + 20 },
        { x: 0, y: 110, w: m.W, h: 200 },
        m.images.chales, m.images.cafe, m.images.passeios, m.images.historia,
      ];
      S1 = fit(L1, DISPLAY, 900, 940, 96, -0.02);
      S2 = fit(L2, DISPLAY, 900, 900, 104, -0.02);
      S_TUDO = fit(L_TUDO, DISPLAY, 900, 900, 62, -0.02);
      S_SO = fit(L_SO, DISPLAY, 900, 900, 84, -0.02);
      S_PRE = fit(L_PRECISA, DISPLAY, 900, 920, 72, -0.02);
      S_NASCE = fit(L_NASCE, DISPLAY, 900, 920, 54, -0.02);
      buildTargets(); buildTrays();
    },

    frame,
    post,

    cover(ctx) {
      background(ctx, 20);
      glow(ctx, 540, 1150, 620, 0.08);
      drawLogo(ctx, 540, 352, 560, 99, 0);                           // logo no topo, centralizada
      const sA = fit(['COMO FUNCIONA O'], DISPLAY, 900, 900, 92, -0.02);
      text(ctx, 'COMO FUNCIONA O', 540, 610, { fam: DISPLAY, size: sA, weight: 900, align: 'center', ls: -sA * 0.02 });
      const sR = fit(['RAIO-X'], DISPLAY, 900, 860, 230, -0.02);
      text(ctx, 'RAIO-X', 540, 610 + sR * 0.98, { fam: DISPLAY, size: sR, weight: 900, color: C.lime, align: 'center', ls: -sR * 0.02 });
      // ficha atravessada pela linha de scan: acima, lida (✓ e fotos reais); abaixo, em raio-x
      ctx.save(); ctx.translate(540, 1210); ctx.scale(0.74, 0.74); ctx.translate(-(FX + FW / 2), -(ROW0 + 2.5 * ROWH));
      const sy = ROW0 + 2.5 * ROWH;
      const yEnd = ROW0 + 5 * ROWH;
      ctx.save(); ctx.beginPath(); ctx.rect(FX - 60, FY - 40, FW + 120, yEnd - FY + 40); ctx.clip();
      ficha(ctx, 20, sy, { lit: (i) => (i < 3 ? 1 : 0) });
      const fg = ctx.createLinearGradient(0, yEnd - 260, 0, yEnd);
      fg.addColorStop(0, 'rgba(5,6,6,0)'); fg.addColorStop(1, 'rgba(5,6,6,1)');
      ctx.fillStyle = fg; ctx.fillRect(FX - 60, yEnd - 260, FW + 120, 262);
      ctx.restore();
      scanLine(ctx, sy, FX - 30, FX + FW + 30, 1);
      ctx.restore();
    },

    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(SCAN1.t0, 'scan', { d: SCAN1.t1 - SCAN1.t0 });
      cue(RAIOX, 'raiox');
      cue(T.coleta, 'ficha');
      for (let i = 0; i < 7; i++) cue(ROW_T(i), 'row', { k: i });
      cue(9.6, 'title');
      cue(T.unico, 'shrink');
      cue(12.45, 'filter', { d: 0.5 });
      U_T.forEach((t, k) => cue(t, 'chipU', { k }));
      cue(T.precisa, 'flip');
      H_T.forEach((t, k) => cue(t, 'chipH', { k }));
      cue(CUT, 'slash');
      cue(REVEAL.t0, 'reveal', { d: REVEAL.t1 - REVEAL.t0 });
      let k = 0;
      DOCKS.forEach((dk) => dk.keys.forEach((_, j) => { const ta = dk.t + j * 0.15; cue(ta - FLY, 'fly', { k, d: FLY }); cue(ta, 'dock', { k }); k++; }));
      cue(MODAL.open, 'modal'); cue(MODAL.close, 'modalclose');
      cue(DAYM.open, 'modal'); cue(DAYM.close, 'modalclose');
      cue(CUT + 0.45, 'title');
      cue(T.fecho, 'logo');
      cue(34.9, 'cta');
    },
  });
})();
