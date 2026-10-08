/* =====================================================================
   FAZLO Digital — REEL 002 · "Muito além de um site" — 9:16 (1080x1920, 60 fps)
   100 BPM (1 compasso = 2,4 s)

   Conceito: ZOOM INFINITO. A câmera começa dentro de "um site" — uma página —
   e não para de se afastar. A cada golpe ela revela que aquilo era só uma peça
   de algo maior:

     nível 0  UMA PÁGINA       "UM SITE / É SÓ UMA PÁGINA?"
     nível 1  IDENTIDADE       a página é um ladrilho de um mosaico que forma uma marca
     nível 2  INFORMAÇÕES      o mosaico é um nó de uma estrutura organizada
     nível 3  APRESENTAÇÃO     a estrutura é a tela iluminada de um palco
     nível 4  CONEXÃO          o palco é o centro de uma rede de conexões
     nível 5  A MARCA          a rede inteira estava dentro da barra lima da logo

   Cada nível é um mundo próprio (cor, desenho, tipografia, animação) e
   contém o anterior num "quadro-filho" (um ladrilho, um nó, uma tela, um
   cartão, a barra da logo). O desenho é recursivo: renderLevel(k) desenha o
   nível k e, dentro do quadro-filho, o nível k-1 já reduzido. A profundidade
   d(t) é contínua: o zoom nunca corta.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, hash, noise1, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 100;
  const { BT, S16, bar } = U.tempo(BPM);           // 0,6 s · 0,15 s
  const DURATION = 23.0;
  const T = {
    pagina: 0,          // c.1  UM SITE / É SÓ UMA PÁGINA?
    ident: bar(2),      // c.2  -> identidade
    info: bar(3),       // c.3  -> informações
    apres: bar(4),      // c.4  -> apresentação
    conex: bar(5),      // c.5  -> conexão
    frase1: bar(6),     // c.6  UM SITE NÃO É SÓ ALGO QUE SUA EMPRESA TEM.
    frase2: bar(7),     // c.7  É PARTE DE COMO ELA SE APRESENTA AO MUNDO.
    final: bar(8),      // c.8  a barra da logo aparece; a marca se forma
    logo: bar(8, 2),    //      pouso da marca: MUITO ALÉM DE UM SITE.
    url: bar(9),        // c.9  fazlodigital.com.br
  };
  const TR = 0.6;                                   // duração de cada salto de zoom
  const ZOOMS = [T.ident, T.info, T.apres, T.conex];

  // ---------------------------------------------------------------- marca
  let B, C, DISPLAY, TEXT, LOGOD, PAPER, INK;
  const SK = 0.966, SW = 0.438;
  const DL = Math.hypot(SK, 1);
  const DIR = { x: SK / DL, y: -1 / DL };

  // ---------------------------------------------------------------- desenho
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function slashPts(cx, cy, h, w = SW * h) {
    const k = SK * h / 2;
    return [[cx - w / 2 + k, cy - h / 2], [cx + w / 2 + k, cy - h / 2], [cx + w / 2 - k, cy + h / 2], [cx - w / 2 - k, cy + h / 2]];
  }
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function glow(c, x, y, r, color, a) {
    if (a <= 0.002 || r <= 1) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, clamp(a))); g.addColorStop(0.3, rgba(color, clamp(a) * 0.42)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function flash(c, a, color = '#FFFFFF', mode = 'screen') {     // 'multiply' tinge fundos claros (no papel, o 'screen' some)
    if (a <= 0.01) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = mode; c.fillStyle = rgba(color, clamp(a)); c.fillRect(0, 0, W, H); c.restore();
  }

  // ---------------------------------------------------------------- texto
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, fam, size, weight, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function fit(s, fam, weight, maxW, maxSize, lsK = 0) {
    let size = maxSize;
    while (size > 10 && measure(s, fam, size, weight, size * lsK) > maxW) size -= 1;
    return size;
  }
  function text(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save();
    c.globalAlpha *= clamp(a);
    c.font = fnt(o.fam, o.size, o.weight); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = o.color || INK;
    c.fillText(s, x, y);
    c.restore();
  }
  function charXs(s, o, x) {
    const w = measure(s, o.fam, o.size, o.weight, o.ls || 0);
    let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const xs = [];
    for (const ch of s) { xs.push(cx); cx += measure(ch, o.fam, o.size, o.weight, o.ls || 0); }
    return { xs, w, x0: xs[0] };
  }
  // letras sobem de uma fenda (máscara na linha de base)
  function riseLine(c, s, x, y, o, t, t0, st = 0.02, dur = 0.42) {
    if (t < t0) return;
    const { xs } = charXs(s, o, x);
    c.save(); c.beginPath(); c.rect(-W, y - o.size * 1.1, 3 * W, o.size * 1.38); c.clip();
    [...s].forEach((ch, i) => {
      if (ch === ' ') return;
      const p = E.outExpo(prog(t, t0 + i * st, t0 + i * st + dur));
      if (p > 0) text(c, ch, xs[i], y + (1 - p) * o.size * 1.15, { ...o, align: 'left' });
    });
    c.restore();
  }
  // rótulo editorial: número do capítulo + fio + frase de apoio
  const wordLeft = (s, size) => W / 2 - measure(s, DISPLAY, size, 900, -size * 0.02) / 2;   // rótulo alinhado à palavra-título
  function chapter(c, n, s, x, y, t, t0, color, numColor) {
    const p = E.outExpo(prog(t, t0, t0 + 0.5));
    if (p <= 0) return;
    text(c, n, x, y, { fam: TEXT, size: 40, weight: 700, color: numColor, alpha: p });
    c.fillStyle = rgba(color, 0.9 * p); c.fillRect(x + 66, y - 14, 70 * p, 3);
    riseLine(c, s, x + 156, y, { fam: TEXT, size: 40, weight: 700, color, ls: 7 }, t, t0 + 0.06, 0.015, 0.4);
  }

  // ================================================================ NÍVEIS
  // cada nível: draw(c, t, sc) no seu próprio espaço 1080x1920 (sc = px de tela por unidade);
  // A = onde o quadro do nível anterior fica (x, y, escala s = 1/F); clip = forma do quadro-filho
  const LV = [];

  // ---------------------------------------------------------------- nível 0 · a página
  const CARD = { x: 150, y: 470, w: 780, h: 930 };
  const BLOCKS = [
    { x: 50, y: 50, w: 26, h: 26, r: 13, c: 'ink' }, { x: 600, y: 58, w: 130, h: 10, r: 5, c: 'line' },
    { x: 50, y: 140, w: 520, h: 58, r: 12, c: 'ink' }, { x: 50, y: 216, w: 380, h: 58, r: 12, c: 'ink' },
    { x: 50, y: 312, w: 600, h: 16, r: 8, c: 'line' }, { x: 50, y: 342, w: 540, h: 16, r: 8, c: 'line' }, { x: 50, y: 372, w: 470, h: 16, r: 8, c: 'line' },
    { x: 50, y: 428, w: 680, h: 300, r: 22, c: 'img' },
    { x: 50, y: 766, w: 330, h: 112, r: 18, c: 'soft' }, { x: 400, y: 766, w: 330, h: 112, r: 18, c: 'soft' },
  ];
  let S_SITE;
  function drawL0(c, t) {
    c.fillStyle = C.accent; c.fillRect(0, 0, W, H);
    // faixas diagonais em movimento lento
    c.save(); c.fillStyle = '#B8EC34';
    for (let k = -2; k < 8; k++) { const u = k * 300 + (t * 60) % 300; poly(c, [[u, 0], [u + 120, 0], [u + 120 - SK * H, H], [u - SK * H, H]]); c.fill(); }
    c.restore();
    // o cartão-página flutua de leve
    const fl = Math.sin(t * 2.2) * 6;
    c.save(); c.translate(0, fl);
    c.fillStyle = 'rgba(70,95,10,0.22)'; rr(c, CARD.x + 20, CARD.y + 28, CARD.w, CARD.h, 36); c.fill();
    c.fillStyle = '#FFFFFF'; rr(c, CARD.x, CARD.y, CARD.w, CARD.h, 34); c.fill();
    BLOCKS.forEach((b, k) => {
      const p = E.outBack(prog(t, 0.04 + k * 0.075, 0.04 + k * 0.075 + 0.32), 1.8);
      if (p <= 0) return;
      const x = CARD.x + b.x, y = CARD.y + b.y;
      c.save(); c.translate(x + b.w / 2, y + b.h / 2); c.scale(p, p); c.translate(-(x + b.w / 2), -(y + b.h / 2));
      rr(c, x, y, b.w, b.h, b.r);
      c.fillStyle = b.c === 'ink' ? INK : b.c === 'line' ? '#CFD1CB' : b.c === 'soft' ? '#EEEFEA' : '#1C1D1F'; c.fill();
      if (b.c === 'img') {
        c.save(); rr(c, x, y, b.w, b.h, b.r); c.clip();
        c.fillStyle = C.accent; poly(c, slashPts(x + b.w * 0.62, y + b.h / 2, b.h * 0.8)); c.fill();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x + 90, y + 90, 34, 0, TAU); c.fill();
        c.restore();
      }
      c.restore();
    });
    c.restore();
    // UM SITE / É SÓ UMA PÁGINA?
    const sl = E.outExpo(prog(t, 0, 0.35));
    c.save(); c.translate(W / 2, 330); c.scale(lerp(1.06, 1, sl), lerp(1.06, 1, sl)); c.translate(-W / 2, -330);
    text(c, 'UM SITE', W / 2, 400, { fam: DISPLAY, size: S_SITE, weight: 900, color: INK, ls: -S_SITE * 0.02, align: 'center' });
    c.restore();
    riseLine(c, 'É SÓ UMA PÁGINA?', W / 2, 1500, { fam: DISPLAY, size: 58, weight: 800, color: INK, ls: -0.5, align: 'center' }, t, 1.2, 0.02, 0.45);
  }

  // ---------------------------------------------------------------- nível 1 · identidade (mosaico)
  const T1 = { w: 108, h: 192, gx: 122, gy: 206, ax: 486, ay: 864 };
  const SL1 = () => slashPts(540, 950, 1700);
  let TILES = [];
  function buildTiles() {
    const sl = SL1();
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) {
      const x = T1.ax + i * T1.gx, y = T1.ay + j * T1.gy;
      if (x > W + 20 || x + T1.w < -20 || y > H + 20 || y + T1.h < -20) continue;
      const lime = inPoly(x + T1.w / 2, y + T1.h / 2, sl);
      TILES.push({ i, j, x, y, lime, white: !lime && hash(i * 7 + 3, j * 13 + 5) < 0.07, anchor: i === 0 && j === 0 });
    }
  }
  let S_IDENT;
  function drawL1(c, t, sc) {
    c.fillStyle = '#0B0B0C'; c.fillRect(0, 0, W, H);
    const s0 = T.ident;
    for (const tl of TILES) {
      if (tl.anchor) continue;
      // onda diagonal a cada tempo: o ladrilho gira e acende
      const b = Math.max(0, Math.floor((t - s0) / BT));
      const tb = s0 + b * BT + (tl.i - tl.j) * 0.03 + 0.2;
      const fl = t > s0 ? kick(t, tb, 0.35) : 0;
      const flip = Math.abs(Math.cos(Math.PI * clamp((t - tb) / 0.3) * (fl > 0.02 ? 1 : 0)));
      const sx = lerp(1, flip, 0.9);
      c.save(); c.translate(tl.x + T1.w / 2, tl.y + T1.h / 2); c.scale(sx, 1); c.translate(-(tl.x + T1.w / 2), -(tl.y + T1.h / 2));
      rr(c, tl.x, tl.y, T1.w, T1.h, 8);
      c.fillStyle = tl.lime ? U.mix(C.accent, '#E9FFB0', fl * 0.6) : tl.white ? '#E9E9E5' : U.mix('#18191B', '#2A2C30', fl);
      c.fill();
      if (sc * T1.w > 18) {                                     // miniaturas: páginas dentro dos ladrilhos
        if (tl.lime) { c.fillStyle = '#FFFFFF'; rr(c, tl.x + 14, tl.y + 44, 80, 98, 5); c.fill(); c.fillStyle = INK; c.fillRect(tl.x + 22, tl.y + 56, 44, 7); c.fillRect(tl.x + 22, tl.y + 68, 32, 7); }
        else { c.fillStyle = tl.white ? '#BDBEB8' : '#34363B'; c.fillRect(tl.x + 16, tl.y + 24, 56, 6); c.fillRect(tl.x + 16, tl.y + 38, 40, 6); }
      }
      c.restore();
    }
    // moldura do ladrilho-âncora (onde mora a página)
    if (t > s0) { c.strokeStyle = rgba('#FFFFFF', 0.6 * kick(t, s0 + TR, 0.8)); c.lineWidth = 3; rr(c, T1.ax - 4, T1.ay - 4, T1.w + 8, T1.h + 8, 11); c.stroke(); }
    // texto
    const g = c.createLinearGradient(0, 1160, 0, 1640);
    g.addColorStop(0, 'rgba(11,11,12,0)'); g.addColorStop(0.35, 'rgba(11,11,12,0.88)'); g.addColorStop(1, 'rgba(11,11,12,0.95)');
    c.fillStyle = g; c.fillRect(0, 1160, W, 480);
    if (sc * S_IDENT < 2) return;
    chapter(c, '01', 'REPRESENTA SUA', wordLeft('IDENTIDADE.', S_IDENT), 1330, t, s0 + 0.15, '#FFFFFF', C.accent);
    // IDENTIDADE.: cada letra carimba
    const o = { fam: DISPLAY, size: S_IDENT, weight: 900, color: '#FFFFFF', ls: -S_IDENT * 0.02, align: 'center' };
    const { xs } = charXs('IDENTIDADE.', o, W / 2);
    [...'IDENTIDADE.'].forEach((ch, i) => {
      const t0 = s0 + 0.3 + i * 0.035, p = E.outExpo(prog(t, t0, t0 + 0.3));
      if (p <= 0) return;
      const cw = measure(ch, o.fam, o.size, o.weight, o.ls);
      c.save(); c.translate(xs[i] + cw / 2, 1460 - S_IDENT * 0.36); c.scale(lerp(2.2, 1, p), lerp(2.2, 1, p)); c.translate(-(xs[i] + cw / 2), -(1460 - S_IDENT * 0.36));
      text(c, ch, xs[i], 1460, { ...o, align: 'left', alpha: clamp(p * 2), color: i === 10 ? C.accent : '#FFFFFF' });
      c.restore();
    });
  }

  // ---------------------------------------------------------------- nível 2 · informações (estrutura)
  const NW = 135, NH = 240;
  const NODES = [
    { x: 540, y: 360, p: -1 },
    { x: 215, y: 720, p: 0 }, { x: 555, y: 720, p: 0 }, { x: 840, y: 720, p: 0 },
    { x: 130, y: 1070, p: 1 }, { x: 300, y: 1070, p: 1 }, { x: 470, y: 1070, p: 2, anchor: true }, { x: 640, y: 1070, p: 2 }, { x: 840, y: 1070, p: 3 },
  ];
  const A2 = NODES.find((n) => n.anchor);
  let S_INFO;
  function edgePath(n) {                                    // conexão ortogonal pai -> filho
    const P = NODES[n.p], y0 = P.y + NH / 2, y1 = n.y - NH / 2, ym = (y0 + y1) / 2;
    return [[P.x, y0], [P.x, ym], [n.x, ym], [n.x, y1]];
  }
  function drawPath(c, pts, p) {                            // desenha uma fração p do caminho
    const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let rem = L * p;
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const f = Math.min(1, rem / seg[i - 1]);
      c.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); rem -= seg[i - 1];
    }
    c.stroke();
    return L;
  }
  function pointOn(pts, p) {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    let rem = L * p;
    for (let i = 1; i < pts.length; i++) { if (rem <= seg[i - 1]) { const f = rem / seg[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; } rem -= seg[i - 1]; }
    return pts[pts.length - 1];
  }
  function drawL2(c, t, sc) {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(24,25,24,0.05)'; c.lineWidth = 1.5;          // grade de construção
    c.beginPath(); for (let x = 0; x <= W; x += 60) { c.moveTo(x, 0); c.lineTo(x, H); } for (let y = 0; y <= H; y += 60) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
    const s0 = T.info + 0.12;
    const order = (n) => (NODES[n].p < 0 ? 0 : NODES[NODES[n].p].p < 0 ? 1 : 2);
    // conexões: desenham de cima para baixo, depois pulsos lima correm por elas
    c.strokeStyle = INK; c.lineWidth = 4; c.lineJoin = 'round';
    NODES.forEach((n, i) => {
      if (n.p < 0) return;
      const t0 = s0 + (order(i) - 1) * 0.3 + i * 0.02;
      const p = E.inOutCubic(prog(t, t0, t0 + 0.35));
      if (n.anchor) { if (p > 0) drawPath(c, edgePath(n), p); return; }
      if (p > 0) drawPath(c, edgePath(n), p);
    });
    NODES.forEach((n, i) => {
      if (n.p < 0) return;
      const t0 = s0 + (order(i) - 1) * 0.3 + i * 0.02 + 0.35;
      if (t < t0) return;
      const ph = ((t - t0) / 1.1 + hash(i, 5)) % 1, [x, y] = pointOn(edgePath(n), ph);
      c.fillStyle = C.accent; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      const P = NODES[n.p], ym = (P.y + NH / 2 + n.y - NH / 2) / 2;   // nós de junção
      c.fillStyle = INK; c.fillRect(P.x - 7, ym - 7, 14, 14);
    });
    // nós
    NODES.forEach((n, i) => {
      if (n.anchor) return;
      const t0 = s0 + order(i) * 0.3 - 0.15 + i * 0.02;
      const p = E.outBack(prog(t, t0, t0 + 0.3), 1.6);
      if (p <= 0) return;
      const x = n.x - NW / 2, y = n.y - NH / 2;
      c.save(); c.translate(n.x, n.y); c.scale(p, p); c.translate(-n.x, -n.y);
      rr(c, x, y, NW, NH, 14); c.fillStyle = INK; c.fill();
      if (sc * NW > 20) {
        c.fillStyle = '#FFFFFF'; c.fillRect(x + 18, y + 26, 70, 9); c.fillStyle = '#5B5D59'; c.fillRect(x + 18, y + 44, 96, 6); c.fillRect(x + 18, y + 56, 80, 6);
        c.fillStyle = i === 0 ? C.accent : '#2B2D30'; rr(c, x + 18, y + 80, NW - 36, 96, 8); c.fill();
        c.fillStyle = C.accent; c.fillRect(x + 18, y + NH - 34, 24, 10);
      }
      c.restore();
    });
    // moldura do nó-âncora
    c.strokeStyle = INK; c.lineWidth = 4; rr(c, A2.x - NW / 2 - 2, A2.y - NH / 2 - 2, NW + 4, NH + 4, 16); c.stroke();
    if (sc * S_INFO < 2) return;
    chapter(c, '02', 'ORGANIZA SUAS', wordLeft('INFORMAÇÕES.', S_INFO), 1330, t, T.info + 0.15, INK, C.accentLo);
    // INFORMAÇÕES.: as letras chegam fora de ordem e se ordenam
    const s = 'INFORMAÇÕES.', o = { fam: DISPLAY, size: S_INFO, weight: 900, color: INK, ls: -S_INFO * 0.02, align: 'center' };
    const { xs } = charXs(s, o, W / 2);
    const perm = [7, 2, 10, 0, 5, 11, 3, 8, 1, 6, 4, 9];
    [...s].forEach((ch, i) => {
      const p = E.outCubic(prog(t, T.info + 0.35 + i * 0.012, T.info + 0.75 + i * 0.012));
      if (p <= 0) return;
      const x = lerp(xs[perm[i]], xs[i], p), y = 1460 + (1 - p) * (i % 2 ? -50 : 50);
      text(c, ch, x, y, { ...o, align: 'left', alpha: clamp(p * 3) });
    });
  }

  // ---------------------------------------------------------------- nível 3 · apresentação (palco)
  const M3 = { x: 540 - W / 3.2 / 2, y: 580, w: W / 3.2, h: H / 3.2 };
  let S_APRES;
  function drawL3(c, t, sc) {
    c.fillStyle = '#050506'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(540, 860, 0, 540, 860, 1200);
    g.addColorStop(0, '#1C1D21'); g.addColorStop(1, '#050506');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // piso
    const fy = M3.y + M3.h;
    const fg = c.createLinearGradient(0, fy, 0, H);
    fg.addColorStop(0, '#16171A'); fg.addColorStop(1, '#050506');
    c.fillStyle = fg; c.fillRect(0, fy, W, H - fy);
    c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 2;
    for (let k = -8; k <= 8; k++) { c.beginPath(); c.moveTo(540 + k * 40, fy); c.lineTo(540 + k * 260, H); c.stroke(); }
    // reflexo da tela no piso
    const rg = c.createLinearGradient(0, fy, 0, fy + 260);
    rg.addColorStop(0, 'rgba(243,243,243,0.20)'); rg.addColorStop(1, 'rgba(243,243,243,0)');
    c.fillStyle = rg; c.fillRect(M3.x, fy + 6, M3.w, 260);
    // refletores acendem um a um, no tempo
    const s0 = T.apres;
    const SP = [[150, -80, 0.15], [930, -80, 0.45], [540, -160, 0.75]];
    c.save(); c.globalCompositeOperation = 'lighter';
    SP.forEach(([sx, sy, dt], k) => {
      const on = t < s0 ? 0 : clamp((t - s0 - dt) / 0.06) * (0.85 + 0.15 * Math.sin(t * 7 + k));
      if (on <= 0) return;
      const sway = Math.sin(t * 0.9 + k * 2) * 40;
      const tx = 540 + sway, ty = M3.y + M3.h * 0.55;
      const ang = Math.atan2(ty - sy, tx - sx), half = 0.2, L = 1900;
      const g2 = c.createLinearGradient(sx, sy, tx, ty + 400);
      g2.addColorStop(0, rgba(k === 2 ? '#FFFFFF' : C.accent, 0.42 * on)); g2.addColorStop(1, rgba(k === 2 ? '#FFFFFF' : C.accent, 0));
      c.fillStyle = g2;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(ang - half) * L, sy + Math.sin(ang - half) * L); c.lineTo(sx + Math.cos(ang + half) * L, sy + Math.sin(ang + half) * L); c.closePath(); c.fill();
      glow(c, sx, sy + 40, 160, '#FFFFFF', 0.5 * on);
      // poeira no feixe
      for (let i = 0; i < 26; i++) {
        const a = ang + (hash(i, k + 3) - 0.5) * half * 1.6, r = 300 + ((hash(i, k + 5) * 1400 + t * 40) % 1400);
        c.fillStyle = rgba('#FFFFFF', 0.25 * on * hash(i, k + 7)); c.fillRect(sx + Math.cos(a) * r, sy + Math.sin(a) * r, 3, 3);
      }
    });
    glow(c, 540, M3.y + M3.h / 2, 620, '#FFFFFF', 0.10 * clamp((t - s0) * 2));
    c.restore();
    if (sc * S_APRES < 2) return;
    chapter(c, '03', 'VALORIZA SUA', wordLeft('APRESENTAÇÃO.', S_APRES), 1400, t, s0 + 0.15, '#FFFFFF', C.accent);
    // APRESENTAÇÃO.: a luz varre e acende a palavra
    const o = { fam: DISPLAY, size: S_APRES, weight: 900, ls: -S_APRES * 0.02, align: 'center' };
    const w = measure('APRESENTAÇÃO.', o.fam, o.size, o.weight, o.ls), x0 = W / 2 - w / 2;
    const a0 = clamp((t - s0 - 0.25) * 4);
    text(c, 'APRESENTAÇÃO.', W / 2, 1520, { ...o, color: '#2A2B2F', alpha: a0 });
    const lp = E.inOutSine(prog(t, s0 + 0.35, s0 + 0.95));
    if (lp > 0) {
      c.save(); c.beginPath(); c.rect(x0 - 20, 1300, (w + 40) * lp, 300); c.clip();
      text(c, 'APRESENTAÇÃO.', W / 2, 1520, { ...o, color: '#FFFFFF' });
      c.restore();
      if (lp < 1) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x0 + (w + 40) * lp, 1490, 160, C.accent, 0.6); c.restore(); }
    }
  }
  function overL3(c, t) {                                   // moldura da tela, por cima do nível filho
    c.strokeStyle = '#000000'; c.lineWidth = 10; rr(c, M3.x - 5, M3.y - 5, M3.w + 10, M3.h + 10, 14); c.stroke();
    c.strokeStyle = rgba(C.accent, 0.5 + 0.5 * kick(t, Math.floor((t - T.apres) / BT) * BT + T.apres, 0.3)); c.lineWidth = 3;
    rr(c, M3.x - 11, M3.y - 11, M3.w + 22, M3.h + 22, 18); c.stroke();
  }

  // ---------------------------------------------------------------- nível 4 · conexão (rede)
  const C4 = { w: W / 7, h: H / 7 };
  const NET = { nodes: [], edges: [] };
  function buildNet() {
    const r = U.rng(21);
    const rings = [330, 500, 740, 1100, 1650, 2450, 3650, 5400, 8000, 12000];
    const counts = [6, 9, 12, 16, 20, 26, 32, 38, 44, 50];
    const ringNodes = [];
    rings.forEach((R, k) => {
      const ns = [];
      const off = r() * TAU;
      for (let i = 0; i < counts[k]; i++) {
        const a = off + i / counts[k] * TAU + (r() - 0.5) * 0.25, rad = R * (0.88 + r() * 0.24);
        const n = { x: 540 + Math.cos(a) * rad, y: 960 + Math.sin(a) * rad * 0.92, a, R, k, sz: 7 + R * 0.012, ph: r() };
        NET.nodes.push(n); ns.push(NET.nodes.length - 1);
      }
      ringNodes.push(ns);
    });
    ringNodes.forEach((ns, k) => ns.forEach((ni) => {
      const n = NET.nodes[ni];
      if (k === 0) { NET.edges.push([-1, ni]); return; }
      const prev = ringNodes[k - 1].map((pj) => [pj, Math.abs(((NET.nodes[pj].a - n.a + Math.PI * 3) % TAU) - Math.PI)]).sort((a, b) => a[1] - b[1]);
      NET.edges.push([prev[0][0], ni]);
      if (r() < 0.35) NET.edges.push([prev[1][0], ni]);
    }));
    ringNodes.forEach((ns) => ns.forEach((ni, i) => { if (r() < 0.3) NET.edges.push([ni, ns[(i + 1) % ns.length]]); }));
  }
  let S_CONEX;
  function drawL4(c, t, sc) {
    c.fillStyle = C.accent; c.fillRect(-80000, -80000, 160000, 160000);   // plano infinito
    const s0 = T.conex;
    const grow = E.outCubic(prog(t, s0, s0 + 1.2));
    // ondas a cada tempo
    const b = Math.floor((t - s0) / BT);
    c.save(); c.lineWidth = 3 / Math.max(sc, 0.02);
    for (let k = 0; k < 4; k++) {
      const tb = s0 + (b - k) * BT; if (tb < s0) continue;
      const q = (t - tb) / 2.4, R = 200 + q * 2600;
      c.strokeStyle = rgba(INK, 0.22 * (1 - q)); c.beginPath(); c.ellipse(540, 960, R, R * 0.92, 0, 0, TAU); c.stroke();
    }
    c.restore();
    // arestas
    const P = (i) => (i < 0 ? { x: 540, y: 960, R: 0, k: -1 } : NET.nodes[i]);
    for (const [ai, bi] of NET.edges) {
      const a = P(ai), bb = P(bi);
      const vis = t < s0 ? 1 : clamp((grow * 14000 - bb.R) / 400);   // a rede se espalha a partir do centro
      if (vis <= 0) continue;
      const lw = 2.2 + bb.R * 0.003;
      if (lw * sc < 0.25) continue;
      c.strokeStyle = rgba(INK, 0.55 * vis); c.lineWidth = lw;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(lerp(a.x, bb.x, vis), lerp(a.y, bb.y, vis)); c.stroke();
      // pulso branco correndo do centro para fora
      const ph = ((t - s0) * 0.9 + bb.ph) % 1;
      if (vis >= 1 && t > s0) { const rad = lw * 2.2; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(lerp(a.x, bb.x, ph), lerp(a.y, bb.y, ph), rad, 0, TAU); c.fill(); }
    }
    for (const n of NET.nodes) {
      const vis = t < s0 ? 1 : clamp((grow * 14000 - n.R) / 400);
      if (vis <= 0 || n.sz * sc < 0.4) continue;
      const pop = 1 + 0.25 * kick(t, s0 + n.R / 6000 + 0.1, 0.3);
      c.fillStyle = INK; c.beginPath(); c.arc(n.x, n.y, n.sz * vis * pop, 0, TAU); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(n.x, n.y, n.sz * 0.38 * vis, 0, TAU); c.fill();
    }
    // sombra do cartão central
    c.fillStyle = 'rgba(40,60,0,0.25)'; rr(c, 540 - C4.w / 2 + 10, 960 - C4.h / 2 + 14, C4.w, C4.h, 18); c.fill();
    if (sc * S_CONEX < 2) return;
    // texto (some quando a câmera se afasta para as frases finais)
    const fade = 1 - prog(t, T.frase1 - 0.25, T.frase1);
    if (fade <= 0) return;
    c.save(); c.globalAlpha = fade;
    const g = c.createLinearGradient(0, 1150, 0, 1600);
    g.addColorStop(0, rgba(C.accent, 0)); g.addColorStop(0.3, rgba(C.accent, 0.92)); g.addColorStop(1, rgba(C.accent, 0.96));
    c.fillStyle = g; c.fillRect(-W, 1150, 3 * W, 500);
    chapter(c, '04', 'FACILITA A', wordLeft('CONEXÃO', S_CONEX), 1290, t, s0 + 0.15, INK, INK);
    riseLine(c, 'CONEXÃO', W / 2, 1430, { fam: DISPLAY, size: S_CONEX, weight: 900, color: INK, ls: -S_CONEX * 0.02, align: 'center' }, t, s0 + 0.3, 0.03, 0.45);
    riseLine(c, 'COM SEUS CLIENTES.', W / 2, 1515, { fam: TEXT, size: 46, weight: 700, color: INK, ls: 4, align: 'center' }, t, s0 + 0.6, 0.015, 0.4);
    c.restore();
  }
  function overL4(c, t) {
    c.strokeStyle = INK; c.lineWidth = 5; rr(c, 540 - C4.w / 2 - 2.5, 960 - C4.h / 2 - 2.5, C4.w + 5, C4.h + 5, 18); c.stroke();
  }

  // ---------------------------------------------------------------- nível 5 · a marca
  let LG;
  function buildLogo() {
    const sl = B.slash, iw = LOGOD.naturalWidth, ih = LOGOD.naturalHeight;
    const kx = iw / sl.imgW, ky = ih / sl.imgH;
    const bx0 = 46 * kx, by0 = 85 * ky, bx1 = 1916 * kx, by1 = 494 * ky;
    const s = 820 / (bx1 - bx0), cx = W / 2, cy = 1040;
    const x0 = cx - ((bx0 + bx1) / 2) * s, y0 = cy - ((by0 + by1) / 2) * s;
    const P_ = (x, y) => [x0 + x * kx * s, y0 + y * ky * s];
    const corners = [P_(sl.tl, sl.top), P_(sl.tr, sl.top), P_(sl.br, sl.bottom), P_(sl.bl, sl.bottom)];
    LG = { s, x0, y0, w: iw * s, h: ih * s, slash: corners, scx: corners.reduce((a, q) => a + q[0], 0) / 4, scy: corners.reduce((a, q) => a + q[1], 0) / 4, top: y0 + by0 * s, bot: y0 + by1 * s };
  }
  let S_MUITO;
  function drawL5(c, t, sc) {
    c.fillStyle = PAPER; c.fillRect(-80000, -80000, 160000, 160000);
    // depois do pouso, a barra pulsa: ecos inclinados saem dela no bumbo (1º e 3º tempos), por baixo de tudo
    for (let ti = T.url; ti < DURATION; ti += 2 * BT) {
      const r = prog(t, ti, ti + 2.0);
      if (r <= 0 || r >= 1) continue;
      poly(c, slashPts(LG.scx, LG.scy, lerp(300, 2600, E.outCubic(r))));
      c.strokeStyle = rgba(C.accentLo, 0.6 * (1 - r) * (1 - r) * Math.min(1, r * 10)); c.lineWidth = 3; c.stroke();
    }
    // a logo se materializa em volta da barra quando a câmera já está perto da escala final
    const la = clamp((4.6 - sc) / 1.6);
    if (la > 0) { c.globalAlpha = la; c.drawImage(LOGOD, LG.x0, LG.y0, LG.w, LG.h); c.globalAlpha = 1; }
  }
  function overL5(c, t, sc) {
    // no fim, a barra volta a ser exatamente a do arquivo oficial
    const fa = clamp((t - T.logo - 0.2) / 0.5);
    if (fa > 0) { c.globalAlpha = fa; c.drawImage(LOGOD, LG.x0, LG.y0, LG.w, LG.h); c.globalAlpha = 1; }
  }

  LV.push({ draw: drawL0 });
  LV.push({ draw: drawL1, A: { x: T1.ax, y: T1.ay, s: 0.1 }, clip: (c) => rr(c, T1.ax, T1.ay, T1.w, T1.h, 8) });
  LV.push({ draw: drawL2, A: { x: A2.x - NW / 2, y: A2.y - NH / 2, s: 1 / 8 }, clip: (c) => rr(c, A2.x - NW / 2, A2.y - NH / 2, NW, NH, 14) });
  LV.push({ draw: drawL3, over: overL3, A: { x: M3.x, y: M3.y, s: 1 / 3.2 }, clip: (c) => rr(c, M3.x, M3.y, M3.w, M3.h, 10) });
  LV.push({ draw: drawL4, over: overL4, A: { x: 540 - C4.w / 2, y: 960 - C4.h / 2, s: 1 / 7 }, clip: (c) => rr(c, 540 - C4.w / 2, 960 - C4.h / 2, C4.w, C4.h, 16) });
  LV.push({ draw: drawL5, over: overL5, A: null, clip: (c) => poly(c, LG.slash) });   // A definido no setup (depende da logo)
  const AVG = ['#E9F7C6', '#2B3A12', '#E3E3E0', '#2A2C2E', '#C5FA40'];             // cor média de cada nível (quando o quadro fica minúsculo)

  // ---------------------------------------------------------------- profundidade da câmera
  function hermite(p, m0) { return m0 * (p * p * p - 2 * p * p + p) + (3 * p * p - 2 * p * p * p); }
  function depth(t) {
    if (t < T.ident) return -0.025 * E.inOutSine(prog(t, 0.4, T.ident));            // leve aproximação antes do 1º salto
    for (let k = 0; k < 4; k++) {
      const z = ZOOMS[k], from = k === 0 ? -0.025 : k - 0.03;
      if (t < z + TR) return lerp(from, k + 1, E.outCubic(prog(t, z, z + TR)));     // salto: explode no golpe e desacelera
      const next = k < 3 ? ZOOMS[k + 1] : T.frase1;
      if (t < next) return k + 1 - (k < 3 ? 0.03 : 0.015) * E.inOutSine(prog(t, z + TR, next));
    }
    if (t < T.final) return lerp(3.985, 4.5, E.inQuad(prog(t, T.frase1, T.final)));   // a rede cresce e a barra aparece
    if (t < T.logo) {
      const v = 2 * (4.5 - 3.985) / (T.final - T.frase1);                              // continua com a mesma velocidade
      return lerp(4.5, 5, hermite(prog(t, T.final, T.logo), v * (T.logo - T.final) / 0.5));
    }
    return 5 + 0.035 * E.inOutSine(prog(t, T.logo, DURATION));
  }
  // transformação do nível mais externo visível: tela = (p - c) * S + c'
  function view(d) {
    if (d <= 0) { const S = Math.pow(10, -d); return { n: 0, S, tx: W / 2 - W / 2 * S, ty: H / 2 - H / 2 * S }; }
    const n = Math.min(5, Math.ceil(d - 1e-9));
    const A = LV[n].A, F = 1 / A.s;
    const S = Math.pow(F, Math.min(n, 5.5) - d);
    const cx = A.x + (W / 2) * A.s, cy = A.y + (H / 2) * A.s;
    const k = n === 5 && d > 5 ? 0 : (S - 1) / (F - 1);
    const sx = cx + (W / 2 - cx) * k, sy = cy + (H / 2 - cy) * k;
    return { n, S, tx: sx - cx * S, ty: sy - cy * S };
  }
  // desenha o nível k e, dentro do quadro-filho, o nível k-1 (recursivo)
  function renderLevel(c, k, t, sc) {
    LV[k].draw(c, t, sc);
    if (k > 0) {
      const A = LV[k].A, cs = sc * A.s;
      c.save(); LV[k].clip(c); c.clip();
      if (cs * W >= 3) { c.translate(A.x, A.y); c.scale(A.s, A.s); renderLevel(c, k - 1, t, cs); }
      else { c.fillStyle = AVG[k - 1]; c.fillRect(A.x, A.y, W * A.s, H * A.s); }
      c.restore();
    }
    if (LV[k].over) LV[k].over(c, t, sc);
  }

  // ================================================================ sobreposições de tela
  let S_FR;
  const FR1 = ['UM SITE NÃO É SÓ', 'ALGO QUE SUA', 'EMPRESA TEM.'];
  const FR2 = ['É PARTE DE COMO', 'ELA SE APRESENTA', 'AO MUNDO.'];
  function frases(c, t) {
    for (const [lines, t0, t1] of [[FR1, T.frase1, T.frase2], [FR2, T.frase2, T.final]]) {
      if (t < t0 || t > t1 + 0.1) continue;
      // placa preta inclinada (pontas na inclinação da barra): lê sobre o lima, a rede e o papel.
      // Abre do centro; na saída, a borda esquerda varre para a direita e leva o texto junto.
      const pin = E.outExpo(prog(t, t0, t0 + 0.4)), out = E.inCubic(prog(t, t1 - 0.24, t1));
      const y0 = 420, lh = S_FR * 1.16;
      const h = lh * 3 + 80, cy = y0 + lh - S_FR * 0.4, k = SK * h / 2 * 0.35;
      const xl = 540 - 505 * pin + 1010 * out, xr = 540 + 505 * pin;
      if (xr - xl < 1) continue;
      const plate = () => poly(c, [[xl + k, cy - h / 2], [xr + k, cy - h / 2], [xr - k, cy + h / 2], [xl - k, cy + h / 2]]);
      plate(); c.fillStyle = INK; c.fill();
      c.fillStyle = C.accent; c.fillRect(xl + k + 40, cy - h / 2 - 8, 120 * pin * (1 - out), 8);
      c.save(); plate(); c.clip();
      lines.forEach((s, i) => {
        riseLine(c, s, 540, y0 + i * lh, { fam: TEXT, size: S_FR, weight: 700, color: i === 2 ? C.accent : '#FFFFFF', ls: -1, align: 'center' }, t, t0 + 0.05 + i * BT / 2, 0.012, 0.4);
      });
      c.restore();
    }
  }
  // MUITO ALÉM / DE UM SITE. e o endereço (sobre a marca)
  function fechamento(c, t) {
    if (t < T.logo - 0.05) return;
    const o = { fam: DISPLAY, size: S_MUITO, weight: 900, color: INK, ls: -S_MUITO * 0.02, align: 'center' };
    riseLine(c, 'MUITO ALÉM', 540, 620, o, t, T.logo, 0.03, 0.5);
    riseLine(c, 'DE UM SITE.', 540, 620 + S_MUITO * 1.12, o, t, T.logo + 0.15, 0.03, 0.5);
    // a barra deixa um anel inclinado no pouso
    const r = prog(t, T.logo, T.logo + 0.8);
    if (r > 0 && r < 1) { poly(c, slashPts(LG.scx, LG.scy, lerp(140, 1600, E.outCubic(r)))); c.strokeStyle = rgba(C.accentLo, 0.9 * (1 - r)); c.lineWidth = 6 * (1 - r) + 2; c.stroke(); }
    // pílula preta com o endereço
    const pf = E.outExpo(prog(t, T.url, T.url + 0.45));
    if (pf <= 0) return;
    const usz = 50, uw = measure('fazlodigital.com.br', DISPLAY, usz, 600, 0), uy = LG.bot + 220;
    const pw = (uw + 130) * pf, ph = usz * 1.9, px = 540 - pw / 2, py = uy - usz * 1.27;
    rr(c, px, py, pw, ph, ph / 2); c.fillStyle = INK; c.fill();
    if (pf > 0.6) { c.fillStyle = C.accent; c.beginPath(); c.arc(px + 44, py + ph / 2, 10, 0, TAU); c.fill(); }
    const { xs } = charXs('fazlodigital.com.br', { fam: DISPLAY, size: usz, weight: 600, align: 'center' }, 540 + 18);
    [...'fazlodigital.com.br'].forEach((ch, i) => {
      const t0 = T.url + 0.15 + i * 0.025, a = prog(t, t0, t0 + 0.12), p = E.outBack(prog(t, t0, t0 + 0.3), 2);
      if (a > 0) text(c, ch, xs[i], uy + (1 - p) * 26, { fam: DISPLAY, size: usz, weight: 600, color: i >= 12 ? '#B9BCB4' : '#FFFFFF', alpha: a });
    });
    // brilho que atravessa a pílula a cada compasso
    const gl = prog(t, T.url + 1.2 + Math.floor((t - T.url - 1.2) / 2.4) * 2.4, T.url + 1.8 + Math.floor((t - T.url - 1.2) / 2.4) * 2.4);
    if (t > T.url + 1.2 && gl > 0 && gl < 1) {
      c.save(); rr(c, px, py, pw, ph, ph / 2); c.clip(); c.globalCompositeOperation = 'lighter';
      const gx = lerp(px - 100, px + pw + 100, gl), g = c.createLinearGradient(gx - 80, 0, gx + 80, 0);
      g.addColorStop(0, 'rgba(197,250,64,0)'); g.addColorStop(0.5, 'rgba(197,250,64,0.35)'); g.addColorStop(1, 'rgba(197,250,64,0)');
      c.fillStyle = g; c.fillRect(px, py, pw, ph); c.restore();
    }
  }

  // ================================================================ montagem
  function frame(ctx, t) {
    const d = depth(t);
    const v = view(d);
    // pouso da marca: a câmera dá um soco curto em volta da logo
    const pk = 1 + 0.06 * kick(t, T.logo, 0.3);
    if (pk > 1.0005) { v.S *= pk; v.tx = 540 - (540 - v.tx) * pk; v.ty = 1000 - (1000 - v.ty) * pk; }
    ctx.save();
    ctx.setTransform(v.S, 0, 0, v.S, v.tx, v.ty);
    renderLevel(ctx, v.n, t, v.S);
    ctx.restore();
    if (v.n === 5) { ctx.save(); ctx.setTransform(v.S, 0, 0, v.S, v.tx, v.ty); fechamento(ctx, t); ctx.restore(); }
    frases(ctx, t);
    // golpe de cada salto: clarão curto
    for (const z of ZOOMS) flash(ctx, 0.22 * kick(t, z, 0.12));
    flash(ctx, 0.4 * kick(t, T.logo, 0.2), C.accent, 'multiply');
    // tremor
    const sh = shakeAt(t);
    if (Math.abs(sh.x) + Math.abs(sh.y) > 0.3) {
      const m = 30;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(ctx.canvas, -m + sh.x, -m * H / W + sh.y, W + 2 * m, H + 2 * m * H / W);
      ctx.restore();
    }
  }
  const SHAKE = [[0, 14, 0.3], ...ZOOMS.map((z) => [z, 12, 0.25]), [T.logo, 16, 0.35]];
  function shakeAt(t) {
    let x = 0, y = 0;
    for (const [t0, amp, dur] of SHAKE) {
      if (t < t0 || t > t0 + dur * 1.5) continue;
      const k = kick(t, t0, dur) * amp;
      x += noise1((t - t0) * 40, 11) * k; y += noise1((t - t0) * 40, 23) * k;
    }
    return { x, y };
  }

  // ================================================================ capa
  function cover(ctx) {
    const t = 16.4;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // a barra gigante, com o mundo de conexões dentro
    const sl = slashPts(560, 1040, 760);
    ctx.save(); poly(ctx, sl); ctx.clip();
    ctx.save(); ctx.translate(560 - 540 * 0.42, 1040 - 960 * 0.42); ctx.scale(0.42, 0.42); renderLevel(ctx, 4, t, 0.42); ctx.restore();
    ctx.restore();
    poly(ctx, sl); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke();
    const o = { fam: DISPLAY, size: S_MUITO, weight: 900, color: INK, ls: -S_MUITO * 0.02, align: 'center' };
    text(ctx, 'MUITO ALÉM', 540, 470, o);
    text(ctx, 'DE UM SITE.', 540, 470 + S_MUITO * 1.12, o);
    const lw = 600, s = lw / 1870;
    ctx.drawImage(LOGOD, 540 - 981 * s, 1500 - 289.5 * s, 2000 * s, 621 * s);
    text(ctx, 'fazlodigital.com.br', 540, 1500 + 205 * s + 74, { fam: DISPLAY, size: 38, weight: 600, color: INK, align: 'center' });
  }

  // ================================================================ cues (som)
  function cues(api) {
    const c = api.cue;
    c(0, 'hit', { v: 1 });
    BLOCKS.forEach((b, k) => c(0.04 + k * 0.075 + 0.12, 'block', { k }));
    c(1.2, 'ask', { n: 15 });
    ZOOMS.forEach((z, k) => { c(z - 0.25, 'pre', { d: 0.25 }); c(z, 'zoom', { k: k + 1 }); });
    // identidade: ondas dos ladrilhos
    for (let b = 1; b < 4; b++) c(T.ident + b * BT + 0.2, 'flip', { k: b });
    c(T.ident + 0.3, 'stamp', { n: 11 });
    // informações: conexões e nós
    c(T.info + 0.12, 'link', { d: 0.9 }); c(T.info + 0.35, 'sort', { n: 12 });
    // apresentação: refletores
    [0.15, 0.45, 0.75].forEach((dt, k) => c(T.apres + dt, 'light', { k }));
    c(T.apres + 0.35, 'reveal', { d: 0.6 });
    // conexão
    c(T.conex + 0.1, 'network', { d: 1.2 });
    for (let b = 1; b < 4; b++) c(T.conex + b * BT, 'ripple', { k: b });
    // frases
    [T.frase1, T.frase2].forEach((t0, j) => { c(t0, 'plate', { j }); for (let i = 0; i < 3; i++) c(t0 + 0.05 + i * BT / 2, 'line', { i, j }); });
    c(T.frase2, 'rise', { d: T.final - T.frase2 });
    c(T.final, 'band', { d: T.logo - T.final });
    c(T.logo, 'logo', { v: 1 });
    c(T.url, 'url', { n: 19, st: 0.025 });
    c(T.url + 1.2, 'glint', { d: 0.6 });
    c(T.url + 3.6, 'glint', { d: 0.6 });
  }

  // ================================================================ pós
  let BL0, BL1, BL2, GRAIN, VIG;
  function post(ctx, t) {
    if (!BL1) {
      const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      BL0 = mk(270, 480); BL1 = mk(270, 480); BL2 = mk(135, 240); GRAIN = mk(384, 384);
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = U.rng(3);
      for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      VIG = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.35, W / 2, H * 0.5, H * 0.78);
      VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,0.5)');
    }
    // bloom só quando o nível escuro (mosaico, palco) domina a tela
    const v = view(depth(t));
    const F = v.n > 0 ? 1 / LV[v.n].A.s : 1;
    const dark = (v.n === 1 || v.n === 3) ? clamp(1.2 - (v.S - 1) / (F - 1) * 1.6) : 0;
    if (dark > 0.01) {
      const a0 = BL0.getContext('2d'), a1 = BL1.getContext('2d'), a2 = BL2.getContext('2d');
      a0.globalCompositeOperation = 'copy'; a0.drawImage(ctx.canvas, 0, 0, 270, 480);
      a1.globalCompositeOperation = 'copy'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
      a1.globalCompositeOperation = 'multiply'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
      a2.globalCompositeOperation = 'copy'; a2.filter = 'blur(6px) brightness(1.3)'; a2.drawImage(BL1, 0, 0, 135, 240); a2.filter = 'none';
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = 0.4 * dark; ctx.drawImage(BL1, 0, 0, W, H);
      ctx.globalAlpha = 0.55 * dark; ctx.drawImage(BL2, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = lerp(0.3, 0.9, dark); ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
    const f = Math.floor(t * 60 + 1e-6);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = lerp(0.07, 0.13, dark);
    const ox = -Math.floor(hash(f, 1) * 384), oy = -Math.floor(hash(f, 2) * 384);
    for (let y = oy; y < H; y += 384) for (let x = ox; x < W; x += 384) ctx.drawImage(GRAIN, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  FZD.define({
    id: 'reel-02',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [4, 1 / 120],
      ranges: [
        [0, 0.6, 8, 1 / 80],
        ...ZOOMS.map((z) => [z - 0.05, z + TR, 12, 1 / 60]),
        [T.final - 0.2, T.logo + 0.4, 10, 1 / 60],
        [T.url, T.url + 0.8, 6, 1 / 90],
      ],
    },
    setup(api) {
      B = api.brand; C = B.color; DISPLAY = B.font.display; TEXT = B.font.text;
      LOGOD = api.assets.logoDark; PAPER = C.paper; INK = C.inkDark;
      S_SITE = fit('UM SITE', DISPLAY, 900, 880, 230, -0.02);
      S_IDENT = fit('IDENTIDADE.', DISPLAY, 900, 740, 200, -0.02);     // 740 px: com a aproximação, termina antes da coluna de botões (x 950)
      S_INFO = fit('INFORMAÇÕES.', DISPLAY, 900, 740, 200, -0.02);
      S_APRES = fit('APRESENTAÇÃO.', DISPLAY, 900, 760, 200, -0.02);
      S_CONEX = fit('CONEXÃO', DISPLAY, 900, 760, 220, -0.02);
      S_FR = fit('ELA SE APRESENTA', TEXT, 700, 820, 104, -0.01);
      S_MUITO = fit('MUITO ALÉM', DISPLAY, 900, 880, 200, -0.02);
      buildTiles(); buildNet(); buildLogo();
      const s5 = 1 / 50;                                    // a rede (nível 4) vive dentro da barra da logo
      LV[5].A = { x: LG.scx - (W / 2) * s5, y: LG.scy - (H / 2) * s5, s: s5 };
    },
    frame(ctx, t) { frame(ctx, t); },
    post,
    cover(ctx) { cover(ctx); },
    cues,
  });
})();
