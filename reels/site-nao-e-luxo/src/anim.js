/* =====================================================================
   FAZLO Digital — "Site não é luxo" — 9:16 (1080x1920, 60 fps), 33,0 s

   100% motion graphics. Mecânica: a palavra "LUXO" gigante, em contorno, racha
   e se DESMONTA em peças; as peças viram os blocos de um site simples e se
   encaixam num celular. O que parecia luxo é só o básico bem montado.

   100 BPM · 1 tempo = 0,6 s · 55 tempos
     1 gancho        0,0–4,2   SITE É COISA DE / POUSADA GRANDE? -> pausa
     2 o mito        4,2–9,0   LUXO gigante, contorno branco, brilho caricato; no golpe (6,6) racha
                               e se desmonta em peças. NÃO.
     3 o básico      9,0–18,0  o celular sobe com o site vazio; a cada 2 tempos 3 peças viram um bloco
                               que cai no lugar (pousos em 10,2 · 11,4 · 12,6 · 13,8), com a etiqueta:
                               FOTOS DE CADA QUARTO · CONSULTA DE DATAS · COMO CHEGAR · WHATSAPP À VISTA
                               UMA POUSADA PEQUENA / PRECISA DO BÁSICO / BEM FEITO. (15,0–17,7)
     4 trabalha      18,0–25,8 noite (23:00): chega "Consulta pelo site" (valores em barras) ->
                               manhã (07:00): o dono abre, "digitando…", a pousada responde (barras)
                               ELE TRABALHA ATÉ QUANDO / VOCÊ NÃO PODE ATENDER.
     5 virada        25,8–30,0 o site montado, contorno lima: NÃO É LUXO. -> É SER ENCONTRADA.
     6 CTA           30,0–33,0 logo FAZLO DIGITAL · Sites para pousadas e negócios locais ·
                               Fale com a FAZLO · link na bio

   Interfaces ilustrativas e genéricas: nenhuma pousada real, nenhum número
   inventado, nenhuma promessa de preço. Fontes oficiais: Unbounded + Sora.
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
  const T = { gancho: 0, mito: b(7), basico: b(15), trabalha: b(30), virada: b(43), cta: b(50) };
  const DURATION = b(55);                            // 33,0 s
  const GOLPE = b(11);                               // 6,6: LUXO racha ("o corte")
  const ESTOURO = b(11.25);                          // 6,75: um 16º depois, as peças se soltam (e o NÃO.)
  const LAND = [b(17), b(19), b(21), b(23)];         // pouso de cada bloco, a cada 2 tempos: 10,2 · 11,4 · 12,6 · 13,8
  const FRASE = { t0: b(25), t1: 17.7 };             // UMA POUSADA PEQUENA… (2,7 s)

  // ---------------------------------------------------------------- cores e texto
  let DISPLAY, TEXT;
  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', card: '#141717', card2: '#1C2121', line: '#2A2F2F',
    bar: '#3A4141', bar2: '#566060', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C', dim: '#3A4444',
  };
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
    c.fillStyle = o.color || C.white; c.fillText(s, x, y);
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
      let x = W / 2 - total / 2;
      c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, 3 * W, size * 1.32); c.clip();
      for (const w of line.split(' ')) {
        const ww = measure(w, DISPLAY, size, wt, ls);
        const ti = t0 + k * (o.st ?? 0.07), p = E.outExpo(prog(t, ti, ti + 0.5));
        const q = E.inCubic(prog(t, t1 + k * 0.025, t1 + k * 0.025 + 0.28));
        const lime = o.lime && o.lime.includes(w);
        if (p > 0 && q < 1) text(c, w, x, y + (1 - p) * size * 1.15 - q * size * 1.2, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : C.white, ls });
        x += ww + sp; k++;
      }
      c.restore();
    });
  }

  // ---------------------------------------------------------------- formas e ícones
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function fillR(c, x, y, w, h, r, col) { rrect(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function strokeR(c, x, y, w, h, r, col, lw) { rrect(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function bars(c, x, y, ws, h = 10, gap = 20, col = C.bar) { ws.forEach((w, i) => fillR(c, x, y + i * gap, w, h, h / 2, col)); }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.005) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function icon(c, kind, x, y, s, color = C.white, lw = 0.09) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'chat':                                  // conversa (genérico, sem logo)
        c.roundRect(-0.4, -0.34, 0.8, 0.56, 0.14); c.moveTo(-0.2, 0.22); c.lineTo(-0.3, 0.4); c.lineTo(0.02, 0.22);
        c.moveTo(-0.2, -0.06); c.lineTo(0.2, -0.06); c.moveTo(-0.2, 0.06); c.lineTo(0.08, 0.06); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'menu': c.moveTo(-0.32, -0.2); c.lineTo(0.32, -0.2); c.moveTo(-0.32, 0); c.lineTo(0.32, 0); c.moveTo(-0.32, 0.2); c.lineTo(0.32, 0.2); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'signal': for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery': c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  // estrela de 4 pontas (o brilho "de luxo")
  function star(c, x, y, r, a) {
    if (a <= 0.01 || r <= 0.3) return;
    c.save(); c.globalAlpha *= clamp(a); c.translate(x, y);
    glow(c, 0, 0, r * 1.6, 0.5, '#FFFFFF');
    c.fillStyle = '#FFFFFF'; c.beginPath();
    c.moveTo(0, -r); c.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); c.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
    c.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); c.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r); c.fill();
    c.restore();
  }
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }

  // ---------------------------------------------------------------- ilustrações planas (site genérico)
  function photo(c, kind, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, Math.min(14, w * 0.06)); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    switch (kind) {
      case 'room':
        g('#E9DDCB', '#DCCAB0', 0, h * 0.7); g('#B99772', '#9C7A58', h * 0.7, h);
        c.fillStyle = '#A9C7D6'; c.fillRect(w * 0.64, h * 0.12, w * 0.24, h * 0.34); c.fillStyle = '#F1E8DA'; c.fillRect(w * 0.755, h * 0.12, w * 0.01, h * 0.34);
        c.fillStyle = '#7D5B40'; c.fillRect(w * 0.12, h * 0.36, w * 0.5, h * 0.2);
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.1, h * 0.54, w * 0.54, h * 0.2);
        c.fillStyle = '#F4F7F7'; c.beginPath(); c.roundRect(w * 0.15, h * 0.47, w * 0.18, h * 0.1, 6); c.roundRect(w * 0.39, h * 0.47, w * 0.18, h * 0.1, 6); c.fill();
        c.fillStyle = '#5E7F94'; c.fillRect(w * 0.1, h * 0.64, w * 0.54, h * 0.1);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.68, h * 0.56, w * 0.14, h * 0.16);
        break;
      case 'bath':
        g('#E4ECEC', '#D2DEDE');
        c.fillStyle = '#BFD6DE'; c.beginPath(); c.roundRect(w * 0.3, h * 0.1, w * 0.4, h * 0.36, w * 0.06); c.fill();
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.2, h * 0.58, w * 0.6, h * 0.42);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(w * 0.5, h * 0.58, w * 0.18, h * 0.05, 0, 0, TAU); c.fill();
        break;
      case 'view':
        g('#F3C38F', '#F6E3C4', 0, h * 0.6);
        c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(w * 0.7, h * 0.36, Math.min(w, h) * 0.1, 0, TAU); c.fill();
        c.fillStyle = '#8FA7B8'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w * 0.22, h * 0.34); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w, h * 0.66); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#5F7E6A'; c.beginPath(); c.moveTo(0, h * 0.78); c.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.8); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        break;
      case 'pool':
        g('#A6DBE6', '#E8F3EE', 0, h * 0.45);
        c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.45, w, h * 0.55);
        c.fillStyle = '#4FB6C8'; c.beginPath(); c.roundRect(w * 0.12, h * 0.55, w * 0.76, h * 0.32, 8); c.fill();
        c.fillStyle = '#3F7350'; [[0.86, 0.2, 0.07], [0.93, 0.17, 0.065]].forEach(([a1, b1, r1]) => { c.beginPath(); c.arc(w * a1, h * b1, Math.min(w, h * 2) * r1, 0, TAU); c.fill(); });
        break;
      default: break;
    }
    c.restore();
  }
  function mapArt(c, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, 12); c.clip(); c.translate(x, y);
    c.fillStyle = '#182020'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1C3324'; c.beginPath(); c.ellipse(w * 0.16, h * 0.26, w * 0.12, h * 0.2, 0.3, 0, TAU); c.fill();
    c.fillStyle = '#16343C'; c.beginPath(); c.ellipse(w * 0.92, h * 0.86, w * 0.18, h * 0.26, -0.35, 0, TAU); c.fill();
    c.strokeStyle = '#2E3838'; c.lineWidth = 7; c.lineCap = 'round';
    [[0, 0.6, 1, 0.48], [0.3, 0, 0.36, 1], [0.66, 0, 0.6, 1], [0, 0.2, 1, 0.14]].forEach(([a, bb, cc, d]) => { c.beginPath(); c.moveTo(w * a, h * bb); c.lineTo(w * cc, h * d); c.stroke(); });
    const P = { x: w * 0.48, y: h * 0.52 };
    c.save(); c.setLineDash([7, 7]); c.strokeStyle = rgba(C.lime, 0.85); c.lineWidth = 3;
    c.beginPath(); c.moveTo(w * 0.1, h * 0.92); c.quadraticCurveTo(w * 0.3, h * 0.62, P.x, P.y + 8); c.stroke(); c.restore();
    c.beginPath(); c.arc(P.x, P.y, 28, 0, TAU); c.fillStyle = rgba(C.lime, 0.18); c.fill();
    c.save(); c.translate(P.x, P.y - 18); c.fillStyle = C.lime; c.beginPath(); c.moveTo(0, 18); c.bezierCurveTo(-14, 3, -13, -3, -13, -5); c.arc(0, -5, 13, Math.PI, 0); c.bezierCurveTo(13, -3, 14, 3, 0, 18); c.fill();
    c.beginPath(); c.arc(0, -5, 5, 0, TAU); c.fillStyle = C.ink; c.fill(); c.restore();
    c.restore();
  }

  // ---------------------------------------------------------------- LUXO: contorno, brilho caricato e peças
  const LUXO_Y = 900;                                 // centro da palavra no quadro
  let LX = null;
  function polyArea(P) { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p.x * q.y - q.x * p.y; } return Math.abs(a) / 2; }
  function splitPoly(P, a, bb) {
    const side = (p) => (bb.x - a.x) * (p.y - a.y) - (bb.y - a.y) * (p.x - a.x);
    const A = [], B = [];
    for (let i = 0; i < P.length; i++) {
      const p = P[i], q = P[(i + 1) % P.length], sp = side(p), sq = side(q);
      if (sp >= 0) A.push(p); if (sp <= 0) B.push(p);
      if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) { const k = sp / (sp - sq), r = { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k }; A.push(r); B.push(r); }
    }
    return [A, B].filter((Q) => Q.length >= 3 && polyArea(Q) > 60);
  }
  function inPoly(P, x, y) {
    let ins = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], bb = P[j]; if (((a.y > y) !== (bb.y > y)) && (x < (bb.x - a.x) * (y - a.y) / (bb.y - a.y) + a.x)) ins = !ins; }
    return ins;
  }
  function buildLuxo() {
    const size = fit(['LUXO'], DISPLAY, 900, 930, 440, -0.02);
    const cw = 1040, ch = 440;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; return cv; };
    const word = mk(), g = word.getContext('2d');
    g.font = fnt(DISPLAY, size, 900); g.letterSpacing = `${-size * 0.02}px`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const m = g.measureText('LUXO'), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    const by = ch / 2 + (asc - desc) / 2;
    // contorno = letra engordada menos a letra (sem as sobreposições internas dos glifos da fonte)
    const fill = mk(), fg = fill.getContext('2d');
    fg.font = g.font; fg.letterSpacing = g.letterSpacing; fg.textAlign = 'center'; fg.fillStyle = '#FFFFFF'; fg.fillText('LUXO', cw / 2, by);
    for (let k = 0; k < 48; k++) g.drawImage(fill, Math.cos(k / 48 * TAU) * 7, Math.sin(k / 48 * TAU) * 7);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(fill, 0, 0); g.globalCompositeOperation = 'source-over';
    // brilho: cópias desfocadas do contorno (halo exagerado)
    const halo = mk(), hg = halo.getContext('2d'); hg.filter = 'blur(10px)'; hg.drawImage(word, 0, 0); hg.filter = 'blur(28px)'; hg.drawImage(word, 0, 0); hg.drawImage(word, 0, 0);
    // peças: o retângulo da palavra cortado por 6 linhas de rachadura
    const CUTS = [[150, 0, 330, 440], [470, 0, 420, 440], [640, 0, 735, 440], [860, 0, 790, 440], [0, 186, 1040, 252], [0, 300, 1040, 226]];
    let polys = [[{ x: 20, y: 70 }, { x: cw - 20, y: 70 }, { x: cw - 20, y: ch - 70 }, { x: 20, y: ch - 70 }]];
    CUTS.forEach(([x0, y0, x1, y1]) => { const a = { x: x0, y: y0 }, bb = { x: x1, y: y1 }; polys = polys.flatMap((P) => splitPoly(P, a, bb)); });
    const data = g.getImageData(0, 0, cw, ch).data;
    const pieces = polys.map((P, i) => {
      const cx = P.reduce((s, p) => s + p.x, 0) / P.length, cy = P.reduce((s, p) => s + p.y, 0) / P.length;
      let ink = 0;
      for (let y = 0; y < ch; y += 4) for (let x = 0; x < cw; x += 4) if (data[(y * cw + x) * 4 + 3] > 80 && inPoly(P, x, y)) ink++;
      const dx = cx - cw / 2, dy = cy - ch / 2, d = Math.hypot(dx, dy) || 1;
      const ang = Math.atan2(dy, dx) + (hash(i, 3) - 0.5) * 0.5;
      return { P, cx, cy, ink, i, dir: { x: Math.cos(ang), y: Math.sin(ang) * 1.6 }, dist: 110 + 160 * hash(i, 5) + d * 0.25, rot: (hash(i, 7) - 0.5) * 0.9, ph: hash(i, 9) * TAU };
    });
    // as 12 peças com mais traço viram os 4 blocos (3 cada); as 3 seguintes, o topo do site
    const ranked = [...pieces].sort((p, q) => q.ink - p.ink);
    const blockP = ranked.slice(0, 12).sort((p, q) => p.cx - q.cx);
    blockP.forEach((p, k) => { p.block = Math.floor(k / 3); });
    ranked.slice(12, 15).forEach((p) => { p.header = true; });
    LX = { word, halo, size, cw, ch, asc, by, pieces, cuts: CUTS };
    // pontos de espera (em volta do celular) de cada peça
    const park = [[150, 330], [300, 250], [420, 340], [660, 250], [800, 330], [940, 270], [130, 560], [190, 820], [120, 1000], [930, 560], [880, 800], [960, 980]];
    blockP.forEach((p, k) => { p.park = { x: park[k][0], y: park[k][1] }; });
  }
  // a palavra inteira (antes do golpe): halo pulsando, raios, reflexo que varre, estrelinhas
  function drawLuxoWhole(c, t, a, luz = 1) {
    if (a <= 0.01) return;
    const ent = E.outCubic(prog(t, T.mito, T.mito + 0.6));
    const z = lerp(1.22, 1, ent) * (1 + 0.035 * E.inOutSine(prog(t, T.mito + 0.6, GOLPE)));
    c.save(); c.globalAlpha *= a * ent;
    c.translate(W / 2, LUXO_Y); c.scale(z, z);
    // raios de "glamour" girando atrás
    c.save(); c.rotate(t * 0.12); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= luz;
    for (let k = 0; k < 18; k++) {
      c.rotate(TAU / 18);
      const gr = c.createLinearGradient(0, 0, 900, 0); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -40); c.lineTo(900, 40); c.closePath(); c.fill();
    }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= (0.85 + 0.15 * Math.sin(t * 5.2) + 0.5 * kick(t, T.mito + 0.15, 0.4)) * luz;
    c.drawImage(LX.halo, -LX.cw / 2, -LX.ch / 2); c.restore();
    c.drawImage(LX.word, -LX.cw / 2, -LX.ch / 2);
    // reflexo diagonal que varre as letras
    for (const s0 of [5.0, 5.9]) {
      const p = prog(t, s0, s0 + 0.55);
      if (p <= 0 || p >= 1) continue;
      const tmp = SHINE.getContext('2d');
      tmp.setTransform(1, 0, 0, 1, 0, 0); tmp.clearRect(0, 0, LX.cw, LX.ch);
      const x = lerp(-200, LX.cw + 200, E.inOutSine(p));
      const gr = tmp.createLinearGradient(x - 90, 0, x + 90, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      tmp.save(); tmp.translate(x, LX.ch / 2); tmp.transform(1, 0, -0.5, 1, 0, 0); tmp.translate(-x, -LX.ch / 2);
      tmp.fillStyle = gr; tmp.fillRect(x - 100, 0, 200, LX.ch); tmp.restore();
      tmp.globalCompositeOperation = 'destination-in'; tmp.filter = 'blur(2px)'; tmp.drawImage(LX.word, 0, 0); tmp.filter = 'none'; tmp.globalCompositeOperation = 'source-over';
      c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(SHINE, -LX.cw / 2, -LX.ch / 2); c.drawImage(SHINE, -LX.cw / 2, -LX.ch / 2); c.restore();
    }
    // estrelinhas piscando nas bordas das letras
    STARS.forEach(([sx, sy, r, ph], i) => {
      const tw = Math.max(0, Math.sin(t * 4.2 + ph)) ** 3 + 1.2 * kick(t, T.mito + 0.1 + i * 0.03, 0.35);
      star(c, sx - LX.cw / 2, sy - LX.ch / 2, r * tw, tw * luz);
    });
    c.restore();
  }
  const STARS = [[90, 120, 34, 0], [300, 330, 26, 1.7], [420, 110, 40, 3.1], [560, 340, 22, 4.4], [700, 116, 30, 0.9], [880, 330, 36, 2.6], [1000, 150, 24, 5.2], [520, 70, 18, 1.1]];
  let SHINE;
  // posição, giro, escala e opacidade de uma peça no instante t (quadro)
  function pieceState(p, t) {
    const base = { x: W / 2 + (p.cx - LX.cw / 2), y: LUXO_Y + (p.cy - LX.ch / 2) };
    const sp = E.outCubic(prog(t, ESTOURO, ESTOURO + 1.2));
    const fl = prog(t, ESTOURO + 0.1, ESTOURO + 0.7);
    let x = base.x + p.dir.x * p.dist * sp + Math.sin(t * 1.3 + p.ph) * 8 * fl;
    let y = base.y + p.dir.y * p.dist * sp + Math.cos(t * 1.1 + p.ph) * 8 * fl;
    let r = p.rot * sp + Math.sin(t * 0.9 + p.ph) * 0.05 * fl, s = 1, a = 1;
    if (p.park) {                                     // vai esperar em volta do celular, menor
      const k = E.inOutCubic(prog(t, 8.3 + p.i * 0.012, 9.2 + p.i * 0.012));
      x = lerp(x, p.park.x + Math.sin(t * 1.2 + p.ph) * 6, k); y = lerp(y, p.park.y + Math.cos(t * 1.4 + p.ph) * 6, k);
      s = lerp(1, 0.5, k); r = lerp(r, p.rot * 0.6 + Math.sin(t * 0.8 + p.ph) * 0.08, k);
      const L = LAND[p.block], f = E.inOutCubic(prog(t, L - 1.0, L - 0.66));   // junta-se às outras 2 e vira o bloco
      x = lerp(x, FORM.x + (p.cx - LX.cw / 2) * 0.12, f); y = lerp(y, FORM.y + (p.cy - LX.ch / 2) * 0.12, f);
      s = lerp(s, 0.3, f); a = 1 - prog(t, L - 0.74, L - 0.62);
    } else if (p.header) {                            // vira o topo do site
      const k = E.inOutCubic(prog(t, 9.15, 9.55));
      x = lerp(x, SLOT_HEAD.x + SLOT_HEAD.w / 2, k); y = lerp(y, SLOT_HEAD.y + SLOT_HEAD.h / 2, k);
      s = lerp(1, 0.25, k); a = 1 - prog(t, 9.45, 9.6);
    } else {                                          // peças vazias: somem no ar
      a = 1 - prog(t, 7.6, 8.4);
    }
    return { x, y, r, s, a };
  }
  function drawPieces(c, t) {
    if (t < ESTOURO) return;
    const lit = 1 - prog(t, ESTOURO, ESTOURO + 0.8);
    for (const p of LX.pieces) {
      const st = pieceState(p, t);
      if (st.a <= 0.01) continue;
      c.save(); c.globalAlpha *= st.a;
      c.translate(st.x, st.y); c.rotate(st.r); c.scale(st.s, st.s); c.translate(-p.cx, -p.cy);
      c.beginPath(); p.P.forEach((q, k) => (k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath();
      c.save(); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.035)'; c.fill();
      c.drawImage(LX.word, 0, 0);
      c.restore();
      c.lineWidth = 2 / st.s; c.strokeStyle = U.mix('#FFFFFF', C.lime, clamp(0.4 + lit)); c.globalAlpha *= 0.35 + 0.5 * lit; c.stroke();
      c.restore();
    }
  }
  // a rachadura lima corre pelas linhas de corte no golpe
  function drawCrack(c, t) {
    const p = prog(t, GOLPE - 0.03, GOLPE + 0.06), fade = 1 - prog(t, ESTOURO, ESTOURO + 0.1);
    if (p <= 0 || fade <= 0) return;
    c.save(); c.translate(W / 2 - LX.cw / 2, LUXO_Y - LX.ch / 2);
    c.beginPath(); c.rect(20, 70, LX.cw - 40, LX.ch - 140); c.clip();
    c.strokeStyle = C.lime; c.lineCap = 'round'; c.shadowColor = C.lime; c.shadowBlur = 18; c.globalAlpha *= fade;
    LX.cuts.forEach(([x0, y0, x1, y1], i) => {
      const q = clamp(p * 1.6 - i * 0.1);
      if (q <= 0) return;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;            // corre do meio para as pontas
      c.lineWidth = 5; c.beginPath();
      c.moveTo(lerp(mx, x0, q), lerp(my, y0, q)); c.lineTo(lerp(mx, x1, q), lerp(my, y1, q)); c.stroke();
    });
    c.restore();
  }

  // ---------------------------------------------------------------- celular e site genérico
  const SB = 40, BZ = 13, SW = 480, SH = SB + 1039;
  const PW = SW + 2 * BZ, PHH = SH + 2 * BZ, PX = W / 2 - PW / 2, PY = 448;
  const SCR = { x: PX + BZ, y: PY + BZ };
  const WEB = { x: SCR.x, y: SCR.y + SB, w: SW, h: 1039 };
  const SX = WEB.x + 12, SWD = SW - 24;               // coluna do site
  const SLOT_HEAD = { x: SX, y: WEB.y + 52, w: SWD, h: 50 };
  const SLOTS = [
    { y: WEB.y + 114, h: 250, label: 'FOTOS DE CADA QUARTO' },
    { y: WEB.y + 378, h: 186, label: 'CONSULTA DE DATAS' },
    { y: WEB.y + 578, h: 216, label: 'COMO CHEGAR' },
    { y: WEB.y + 808, h: 92, label: 'WHATSAPP À VISTA' },
  ];
  const FORM = { x: W / 2, y: 330 };                  // onde as 3 peças viram o bloco (acima do celular)
  function phone(c, inner) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 60; c.shadowOffsetY = 26;
    rrect(c, PX, PY, PW, PHH, 66); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, PX, PY, PW, PHH, 66); c.lineWidth = 3; c.strokeStyle = '#30363A'; c.stroke();
    c.fillStyle = '#1A1E20'; c.fillRect(PX - 3, PY + 190, 4, 70); c.fillRect(PX - 3, PY + 280, 4, 70); c.fillRect(PX + PW - 1, PY + 240, 4, 110);
    c.save(); rrect(c, SCR.x, SCR.y, SW, SH, 54); c.clip();
    c.fillStyle = '#070808'; c.fillRect(SCR.x, SCR.y, SW, SH);
    icon(c, 'signal', SCR.x + SW - 96, SCR.y + 21, 22, '#F2F4F3'); icon(c, 'battery', SCR.x + SW - 46, SCR.y + 21, 28, '#F2F4F3', 0.07);
    inner(c);
    c.restore();
    rrect(c, W / 2 - 54, SCR.y + 8, 108, 26, 13); c.fillStyle = '#000'; c.fill();
  }
  // o site vazio: barra de endereço (sem domínio), topo e os lugares tracejados dos blocos
  function siteFrame(c, t) {
    fillR(c, SX, WEB.y + 8, SWD, 34, 17, '#1A1F1F');
    icon(c, 'lock', SX + 24, WEB.y + 25, 20, C.muted, 0.09); fillR(c, SX + 42, WEB.y + 20, 140, 9, 4.5, C.bar);
    const hp = prog(t, 9.45, 9.65);                    // o topo do site (vindo das 3 peças)
    if (hp > 0) {
      c.save(); c.globalAlpha *= hp;
      c.beginPath(); c.arc(SX + 22, SLOT_HEAD.y + 25, 20, 0, TAU); c.fillStyle = C.lime; c.fill();
      fillR(c, SX + 54, SLOT_HEAD.y + 14, 150, 12, 6, '#DCE2E2'); fillR(c, SX + 54, SLOT_HEAD.y + 32, 96, 8, 4, C.bar2);
      icon(c, 'menu', SX + SWD - 22, SLOT_HEAD.y + 25, 28, C.soft, 0.1);
      c.restore();
    }
    SLOTS.forEach((sl, i) => {                         // lugares vazios, até o bloco pousar
      const a = 1 - prog(t, LAND[i] - 0.05, LAND[i]);
      if (a <= 0) return;
      c.save(); c.globalAlpha *= a * 0.7; c.setLineDash([9, 9]); strokeR(c, SX, sl.y, SWD, sl.h, 18, C.dim, 2); c.restore();
    });
    fillR(c, SX, WEB.y + 916, SWD, 90, 18, '#0C0F0F');                     // rodapé do site
    bars(c, SX + 18, WEB.y + 940, [180, 120], 9, 20, C.bar);
  }
  // conteúdo de cada bloco (coordenadas do quadro, no tamanho final)
  function blockBody(c, i, x, y, w, h) {
    if (i === 3) {                                     // WhatsApp à vista: o botão é o bloco
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 26; fillR(c, x, y, w, h, 20, C.lime); c.restore();
      icon(c, 'chat', x + 50, y + h / 2, 38, C.ink, 0.1);
      text(c, 'Conversar no WhatsApp', x + 84, y + h / 2 + 9, { size: 25, weight: 700, color: C.ink });
      return;
    }
    fillR(c, x, y, w, h, 20, C.card);
    if (i === 0) {                                     // fotos de cada quarto
      photo(c, 'room', x + 12, y + 12, w - 24, 160);
      const tw = (w - 24 - 16) / 3;
      ['bath', 'view', 'pool'].forEach((k, j) => photo(c, k, x + 12 + j * (tw + 8), y + 182, tw, h - 194));
    } else if (i === 1) {                              // consulta de datas
      const fw = (w - 36) / 2;
      ['Entrada', 'Saída'].forEach((lb, j) => {
        const fx = x + 12 + j * (fw + 12);
        fillR(c, fx, y + 14, fw, 70, 12, C.card2); strokeR(c, fx, y + 14, fw, 70, 12, rgba(C.lime, 0.7), 2);
        text(c, lb, fx + 14, y + 42, { size: 17, weight: 500, color: C.muted });
        icon(c, 'cal', fx + fw - 24, y + 38, 24, C.lime, 0.08);
        fillR(c, fx + 14, y + 58, 86, 10, 5, C.bar2);
      });
      fillR(c, x + 12, y + 96, w - 24, 30, 9, C.card2); text(c, 'Hóspedes', x + 28, y + 117, { size: 15, weight: 500, color: C.muted });
      fillR(c, x + 12, y + 136, w - 24, 38, 11, C.lime);
      text(c, 'Consultar', x + w / 2, y + 161, { size: 18, weight: 700, color: C.ink, align: 'center' });
    } else {                                           // como chegar
      mapArt(c, x + 12, y + 12, w - 24, h - 66);                      // endereço só em barras
      c.beginPath(); c.arc(x + 26, y + h - 30, 7, 0, TAU); c.fillStyle = C.lime; c.fill();
      bars(c, x + 44, y + h - 40, [230, 150], 9, 18, C.bar2);
    }
  }
  // etiqueta lima do bloco (grande na queda, menor depois do pouso)
  function blockLabel(c, i, x, y, k) {
    const size = lerp(30, 19, k), s = SLOTS[i].label, pw = measure(s, TEXT, size, 700) + size * 1.3, ph = size * 1.7;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
    fillR(c, x, y - ph / 2, pw, ph, ph / 2, C.lime); c.restore();
    text(c, s, x + size * 0.65, y + size * 0.36, { size, weight: 700, color: C.ink });
  }
  // um bloco: aparece em FORM (vindo das 3 peças), cai e encaixa no seu lugar no celular
  function drawBlock(c, i, t) {
    const L = LAND[i], sl = SLOTS[i];
    const ap = E.outBack(prog(t, L - 0.72, L - 0.5), 1.6);
    if (ap <= 0) return;
    const fall = E.inCubic(prog(t, L - 0.42, L));                       // queda com aceleração, pouso no tempo
    const sc0 = 0.56, sc = lerp(sc0, 1, E.outCubic(prog(t, L - 0.42, L)));
    const fx = FORM.x, fy = FORM.y, tx = SX + SWD / 2, ty = sl.y + sl.h / 2;
    const cx = lerp(fx, tx, fall), cy = lerp(fy, ty, fall);
    const sq = 1 - 0.06 * kick(t, L, 0.18);                             // amassadinho no pouso
    const w = SWD, h = sl.h;
    c.save(); c.translate(cx, cy); c.scale(sc * ap, sc * ap * sq); c.translate(-w / 2, -h / 2);
    blockBody(c, i, 0, 0, w, h);
    const lit = kick(t, L, 0.5);
    if (lit > 0.02) { c.save(); c.shadowColor = C.lime; c.shadowBlur = 30 * lit; strokeR(c, 0, 0, w, h, 20, rgba(C.lime, lit), 4); c.restore(); }
    c.restore();
    // etiqueta presa ao canto do bloco, legível durante a queda
    const k = E.inOutCubic(prog(t, L, L + 0.35));
    const lx = cx - (w / 2) * sc * ap + 10, ly = cy - (h / 2) * sc * ap;
    blockLabel(c, i, lx, ly, k);
    if (t > L - 0.74 && t < L - 0.4) glow(c, fx, fy, 160, 0.25 * (1 - prog(t, L - 0.6, L - 0.4)));   // clarão: as peças viram o bloco
  }

  // ---------------------------------------------------------------- textos
  const L_HOOK = ['SITE É COISA DE', 'POUSADA GRANDE?'];
  const L_FRASE = ['UMA POUSADA PEQUENA', 'PRECISA DO BÁSICO', 'BEM FEITO.'];
  let SZ = {};

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);
    const sh = U.noise1(t * 30, 3) * 14 * kick(t, GOLPE, 0.3);
    c.save(); c.translate(sh, U.noise1(t * 30, 7) * 8 * kick(t, GOLPE, 0.3));

    // ===== 1 · GANCHO
    titleBlock(c, L_HOOK, t, -0.32, 3.9, { size: SZ.hook, y: 860, lime: ['GRANDE?'] });

    // ===== 2 · O MITO
    if (t > T.mito - 0.05 && t < GOLPE - 0.02) drawLuxoWhole(c, t, 1);
    if (t >= GOLPE - 0.02 && t < ESTOURO) drawLuxoWhole(c, Math.min(t, GOLPE), 1, 1 - prog(t, GOLPE, GOLPE + 0.08));   // rachada: o brilho apaga
    drawCrack(c, t);
    const fl = kick(t, GOLPE, 0.18);
    if (fl > 0.02) { c.fillStyle = rgba(C.lime, 0.14 * fl); c.fillRect(-40, -40, W + 80, H + 80); }

    // ===== 3 · O BÁSICO
    const rise = E.outCubic(prog(t, 8.85, 9.45));
    if (rise > 0 && t < T.trabalha + 0.5) {
      const back = E.inOutCubic(prog(t, FRASE.t0 - 0.2, FRASE.t0 + 0.4));   // recua um pouco para a frase
      c.save(); c.translate(0, (1 - rise) * 1300 + back * 70);
      c.translate(W / 2, PY + PHH / 2); const ps = 1 - 0.06 * back; c.scale(ps, ps); c.translate(-W / 2, -(PY + PHH / 2));
      phone(c, (cc) => siteFrame(cc, t));
      c.save(); rrect(c, SCR.x, SCR.y, SW, SH, 54); c.clip();
      for (let i = 0; i < 4; i++) if (t >= LAND[i]) drawBlock(c, i, t);        // pousados: dentro da tela
      c.restore();
      c.restore();
    }
    drawPieces(c, t);
    // NÃO. (por cima das peças)
    const np = E.outBack(prog(t, ESTOURO, ESTOURO + 0.35), 1.8), nq = prog(t, 8.7, 8.95);
    if (np > 0 && nq < 1) {
      c.save(); c.globalAlpha *= clamp(np) * (1 - nq); c.translate(W / 2, LUXO_Y); const s = np * (1 - 0.15 * nq); c.scale(s, s);
      text(c, 'NÃO.', 0, SZ.nao * 0.36, { fam: DISPLAY, size: SZ.nao, weight: 900, color: C.lime, align: 'center', ls: -SZ.nao * 0.02 });
      c.restore();
    }
    if (rise > 0 && t < T.trabalha) {                                          // caindo: por cima de tudo
      const back = E.inOutCubic(prog(t, FRASE.t0 - 0.2, FRASE.t0 + 0.4));
      c.save(); c.translate(0, back * 70);
      for (let i = 0; i < 4; i++) if (t < LAND[i]) drawBlock(c, i, t);
      c.restore();
    }
    titleBlock(c, L_FRASE, t, FRASE.t0, FRASE.t1, { size: SZ.frase, y: 296, lime: ['BEM', 'FEITO.'] });
    c.restore();
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
    id: 'site-nao-e-luxo',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: { default: [3, 1 / 120], ranges: [[ESTOURO, ESTOURO + 0.9, 5, 1 / 110]] },
    setup() {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      buildLuxo();
      SHINE = document.createElement('canvas'); SHINE.width = LX.cw; SHINE.height = LX.ch;
      const f = (L, max) => fit(L, DISPLAY, 900, 940, max, -0.02);
      SZ = { hook: f(L_HOOK, 100), frase: f(L_FRASE, 64), nao: f(['NÃO.'], 260) };
    },
    frame,
    post,
    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(T.mito, 'luxo');
      cue(GOLPE, 'slash');
      LAND.forEach((t, k) => cue(t, 'drop', { k }));
    },
  });
})();
