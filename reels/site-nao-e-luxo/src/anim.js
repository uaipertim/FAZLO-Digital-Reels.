/* =====================================================================
   FAZLO Digital — "Site não é luxo" — 9:16 (1080x1920, 60 fps), 33,0 s

   100% motion graphics. Mecânica: a palavra "LUXO" gigante, em contorno, racha
   e se DESMONTA em peças; as peças viram os blocos de um site simples e se
   encaixam num celular. O que parecia luxo é só o básico bem montado.

   100 BPM · 1 tempo = 0,6 s · 55 tempos
     1 gancho        0,0–4,2   SITE É COISA DE / POUSADA GRANDE? -> pausa
     2 o mito        4,2–9,0   LUXO gigante, contorno branco, brilho caricato; no golpe (6,6) racha e,
                               um 16º depois (6,75), se desmonta em peças que passam em volta do NÃO.
     3 o básico      9,0–18,0  o celular (660 px) sobe com o site vazio; a cada 2 tempos 3 peças viram
                               um bloco que cai no lugar (pousos em 10,2 · 11,4 · 12,6 · 13,8), com a
                               etiqueta (32 px no site montado): FOTOS DE CADA QUARTO · CONSULTA DE DATAS ·
                               COMO CHEGAR · WHATSAPP À VISTA
                               UMA POUSADA PEQUENA / PRECISA DO BÁSICO / BEM FEITO. (15,0–17,7)
     4 trabalha      18,0–25,8 noite: tela de bloqueio, 23:00; chega "Consulta pelo site" (valores em
                               barras). ELE TRABALHA / ATÉ QUANDO VOCÊ / NÃO PODE ATENDER. (19,5–25,5)
                               manhã: 07:00; o dono toca, "digitando…", a pousada responde (em barras)
     5 virada        25,8–30,0 o site montado, contorno lima: NÃO É / LUXO. -> É SER / ENCONTRADA. (27,9)
     6 CTA           30,0–33,0 logo FAZLO DIGITAL · Sites para pousadas e negócios locais ·
                               Fale com a FAZLO · link na bio

   O celular vai só até y 1560 (rodapé seguro): a parte de baixo se apaga antes.
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
  const NOITE = {
    off: T.trabalha,                                 // 18,0: a tela apaga, cai a noite
    lock: b(30.25),                                  // 18,15: tela de bloqueio
    relogio: b(31),                                  // 18,6: 22:59 -> 23:00
    notif: b(32),                                    // 19,2: "Consulta pelo site"
    frase: 19.5, fraseSai: 25.5,                     // ELE TRABALHA…
    manha: b(36),                                    // 21,6: amanhece
    roll: 21.75,                                     // 23:00 -> 07:00 (até 22,75)
    toque: b(39),                                    // 23,4: o dono toca a notificação
    digita: b(40),                                   // 24,0: "digitando…"
    envia: b(41),                                    // 24,6: a resposta da pousada
  };
  const VIRA = { luxo: 26.0, luxoSai: 27.6, golpe: 27.9, sai: 29.8 };

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
        if (p > 0 && q < 1) text(c, w, x, y + (1 - p) * size * 1.35 - q * size * 1.2, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : C.white, ls });
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
      case 'globe': c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0.15, 0); c.ellipse(0, 0, 0.15, 0.36, 0, 0, TAU); c.moveTo(-0.36, 0); c.lineTo(0.36, 0); break;
      case 'back': c.moveTo(0.1, -0.28); c.lineTo(-0.16, 0); c.lineTo(0.1, 0.28); break;
      case 'checks': c.moveTo(-0.42, 0.02); c.lineTo(-0.24, 0.2); c.lineTo(0.08, -0.18); c.moveTo(-0.06, 0.12); c.lineTo(0.02, 0.2); c.lineTo(0.36, -0.18); break;
      case 'send': c.moveTo(-0.3, -0.3); c.lineTo(0.34, 0); c.lineTo(-0.3, 0.3); c.lineTo(-0.18, 0); c.closePath(); c.fill(); c.restore(); return;
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
    // a caixa do NÃO. (entra no estouro): cada peça termina a explosão em volta dela, nunca por cima
    const ns = fit(['NÃO.'], DISPLAY, 900, 940, 260, -0.02);
    MEAS.font = fnt(DISPLAY, ns, 900); MEAS.letterSpacing = `${-ns * 0.02}px`;
    const nm = MEAS.measureText('NÃO.'), nb = LUXO_Y + ns * 0.36, M = 44;
    const NB = { x0: W / 2 - nm.width / 2 - M, x1: W / 2 + nm.width / 2 + M, y0: nb - nm.actualBoundingBoxAscent - M, y1: nb + nm.actualBoundingBoxDescent + M };
    pieces.forEach((p) => {
      const cs = Math.cos(p.rot), sn = Math.sin(p.rot);
      let hw = 0, hh = 0;                             // meia largura/altura da peça já girada
      p.P.forEach((q) => { const dx = q.x - p.cx, dy = q.y - p.cy; hw = Math.max(hw, Math.abs(dx * cs - dy * sn)); hh = Math.max(hh, Math.abs(dx * sn + dy * cs)); });
      p.bx = W / 2 + (p.cx - cw / 2); p.by = LUXO_Y + (p.cy - ch / 2);
      p.tx = p.bx + p.dir.x * p.dist; p.ty = p.by + p.dir.y * p.dist;
      if (p.tx + hw > NB.x0 && p.tx - hw < NB.x1 && p.ty + hh > NB.y0 && p.ty - hh < NB.y1) {
        const up = p.cy < ch / 2 || (p.cy === ch / 2 && hash(p.i, 11) < 0.5);
        p.ty = up ? NB.y0 - hh : NB.y1 + hh;
      }
    });
    // as 12 peças com mais traço viram os 4 blocos (3 cada); as 3 seguintes, o topo do site
    const ranked = [...pieces].sort((p, q) => q.ink - p.ink);
    ranked.slice(12, 15).forEach((p) => { p.header = true; });
    // pontos de espera em volta do celular (nunca na coluna da direita, y 1060–1560): cada peça vai para o
    // ponto livre mais próximo; os blocos juntam peças de lados diferentes (índice % 4)
    const PARK = [[105, 600], [105, 820], [105, 1040], [105, 1260], [105, 1460], [975, 600], [975, 800], [975, 990], [110, 360], [280, 240], [800, 240], [970, 360]];
    const pairs = [];
    ranked.slice(0, 12).forEach((p) => PARK.forEach((q, k) => pairs.push([Math.hypot(p.tx - q[0], p.ty - q[1]), p, k])));
    pairs.sort((u, v) => u[0] - v[0]);
    const usedP = new Set(), usedK = new Set();
    pairs.forEach(([, p, k]) => {
      if (usedP.has(p) || usedK.has(k)) return;
      usedP.add(p); usedK.add(k); p.park = { x: PARK[k][0], y: PARK[k][1] }; p.block = k % 4;
    });
    LX = { word, halo, size, cw, ch, asc, by, tw: m.width, pieces, cuts: CUTS };
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
    const sp = E.outCubic(prog(t, ESTOURO, ESTOURO + 0.9));
    const fl = prog(t, ESTOURO + 0.1, ESTOURO + 0.7);
    let x = lerp(p.bx, p.tx, sp) + Math.sin(t * 1.3 + p.ph) * 8 * fl;
    let y = lerp(p.by, p.ty, sp) + Math.cos(t * 1.1 + p.ph) * 8 * fl;
    let r = p.rot * sp + Math.sin(t * 0.9 + p.ph) * 0.05 * fl, s = 1, a = 1;
    if (p.park) {                                     // vai esperar em volta do celular, menor
      const k = E.inOutCubic(prog(t, 8.3 + p.i * 0.012, 9.2 + p.i * 0.012));
      x = lerp(x, p.park.x + Math.sin(t * 1.2 + p.ph) * 6, k); y = lerp(y, p.park.y + Math.cos(t * 1.4 + p.ph) * 6, k);
      s = lerp(1, 0.42, k); r = lerp(r, p.rot * 0.6 + Math.sin(t * 0.8 + p.ph) * 0.08, k);
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


  // ---------------------------------------------------------------- celular (660 px) e site genérico
  const BZ = 16, PW = 660, PHH = 1350, PR = 84;
  const PX = W / 2 - PW / 2, PY = 470;                // x 210–870: fora da coluna da direita (x 950–1080)
  const SW = PW - 2 * BZ, SH = PHH - 2 * BZ, SRD = PR - BZ;
  const SCR = { x: PX + BZ, y: PY + BZ };
  const SB = 52;                                      // barra de status
  const WEB = { x: SCR.x, y: SCR.y + SB, w: SW, h: SH - SB };
  const SX = WEB.x + 16, SWD = SW - 32;               // coluna do site (596 px)
  const CORTE_Y = 1560;                               // rodapé seguro: nada abaixo daqui (o celular se apaga antes)
  const SLOT_HEAD = { x: SX, y: WEB.y + 64, w: SWD, h: 60 };
  const LBL = 32, LBH = Math.round(LBL * 1.6), LBO = 10;   // etiqueta do site montado: 32 px, presa na borda de cima do bloco
  const SLOTS = [];
  {
    let yy = SLOT_HEAD.y + SLOT_HEAD.h + 14;
    [['FOTOS DE CADA QUARTO', 228], ['CONSULTA DE DATAS', 168], ['COMO CHEGAR', 150], ['WHATSAPP À VISTA', 84]].forEach(([label, h]) => {
      const y = yy + LBH - LBO;
      SLOTS.push({ label, y, h });
      yy = y + h + 14;
    });
  }
  const FORM = { x: W / 2, y: 340 };                  // onde as 3 peças viram o bloco (acima do celular)

  // desenha num layer e apaga a parte de baixo (degradê em y 1516–1560; nada abaixo de 1560)
  let LAYER = null;
  function faded(c, draw) {
    if (!LAYER) { LAYER = document.createElement('canvas'); LAYER.width = W; LAYER.height = H; }
    const g = LAYER.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.clearRect(0, 0, W, H);
    g.setTransform(c.getTransform());
    g.save(); draw(g); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
    const gr = g.createLinearGradient(0, CORTE_Y - 44, 0, CORTE_Y);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, CORTE_Y - 44, W, 44); g.fillStyle = '#000'; g.fillRect(0, CORTE_Y, W, H - CORTE_Y);
    g.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(LAYER, 0, 0); c.restore();
  }
  function phone(c, inner, glowA = 0) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 70; c.shadowOffsetY = 30;
    rrect(c, PX, PY, PW, PHH, PR); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, PX, PY, PW, PHH, PR); c.lineWidth = 3; c.strokeStyle = '#30363A'; c.stroke();
    c.fillStyle = '#1A1E20'; c.fillRect(PX - 3, PY + 240, 4, 90); c.fillRect(PX - 3, PY + 350, 4, 90); c.fillRect(PX + PW - 1, PY + 300, 4, 140);
    c.save(); rrect(c, SCR.x, SCR.y, SW, SH, SRD); c.clip();
    c.fillStyle = '#070808'; c.fillRect(SCR.x, SCR.y, SW, SH);
    inner(c);
    c.restore();
    icon(c, 'signal', SCR.x + SW - 112, SCR.y + 27, 26, '#F2F4F3'); icon(c, 'battery', SCR.x + SW - 58, SCR.y + 27, 34, '#F2F4F3', 0.07);
    rrect(c, W / 2 - 66, SCR.y + 11, 132, 34, 17); c.fillStyle = '#000'; c.fill();
    if (glowA > 0.01) {                               // virada: contorno lima com brilho
      c.save(); c.shadowColor = C.lime; c.shadowBlur = 46 * glowA;
      rrect(c, PX - 2, PY - 2, PW + 4, PHH + 4, PR + 2); c.lineWidth = 5; c.strokeStyle = rgba(C.lime, clamp(glowA)); c.stroke();
      c.restore();
    }
  }
  // o site vazio: barra de endereço (sem domínio), topo e os lugares tracejados dos blocos e etiquetas
  function siteFrame(c, t) {
    c.fillStyle = '#080A0A'; c.fillRect(SCR.x, SCR.y, SW, SH);
    fillR(c, SX, WEB.y + 10, SWD, 42, 21, '#1A1F1F');
    icon(c, 'lock', SX + 28, WEB.y + 31, 24, C.muted, 0.09); fillR(c, SX + 50, WEB.y + 26, 170, 10, 5, C.bar);
    const hp = prog(t, 9.45, 9.65);                    // o topo do site (vindo das 3 peças)
    if (hp > 0) {
      const hy = SLOT_HEAD.y + SLOT_HEAD.h / 2;
      c.save(); c.globalAlpha *= hp;
      c.beginPath(); c.arc(SX + 26, hy, 24, 0, TAU); c.fillStyle = C.lime; c.fill();
      fillR(c, SX + 64, hy - 16, 190, 14, 7, '#DCE2E2'); fillR(c, SX + 64, hy + 6, 120, 10, 5, C.bar2);
      icon(c, 'menu', SX + SWD - 26, hy, 34, C.soft, 0.1);
      c.restore();
    }
    SLOTS.forEach((sl, i) => {                         // lugares vazios, até o bloco pousar
      const a = 1 - prog(t, LAND[i] - 0.05, LAND[i]);
      if (a <= 0) return;
      c.save(); c.globalAlpha *= a * 0.7; c.setLineDash([10, 10]);
      strokeR(c, SX, sl.y, SWD, sl.h, 24, C.dim, 2);
      strokeR(c, SX, sl.y - LBH + LBO, 230, LBH - 4, (LBH - 4) / 2, C.dim, 2);
      c.restore();
    });
    const fy = SLOTS[3].y + SLOTS[3].h + 16;           // rodapé do site (some no corte)
    fillR(c, SX, fy, SWD, 100, 22, '#0C0F0F'); bars(c, SX + 22, fy + 26, [220, 150], 10, 22, C.bar);
  }
  function site(c, t) {
    siteFrame(c, t);
    for (let i = 0; i < 4; i++) if (t >= LAND[i]) drawBlock(c, i, t);
  }
  // conteúdo de cada bloco (coordenadas do quadro, no tamanho final)
  function blockBody(c, i, x, y, w, h) {
    if (i === 3) {                                     // WhatsApp à vista: o botão é o bloco
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 28; fillR(c, x, y, w, h, 24, C.lime); c.restore();
      const s = 'Conversar no WhatsApp', fs = 32, tw = measure(s, TEXT, fs, 700), gx = x + w / 2 - (tw + 62) / 2;
      icon(c, 'chat', gx + 22, y + h / 2, 48, C.ink, 0.1);
      text(c, s, gx + 62, y + h / 2 + 11, { size: fs, weight: 700, color: C.ink });
      return;
    }
    fillR(c, x, y, w, h, 24, C.card);
    if (i === 0) {                                     // fotos de cada quarto: a foto grande e mais duas
      const pw = Math.round((w - 36) * 0.64), ph = h - 24, tw = w - 36 - pw, th = (ph - 12) / 2;
      photo(c, 'room', x + 12, y + 12, pw, ph);
      photo(c, 'view', x + 24 + pw, y + 12, tw, th);
      photo(c, 'pool', x + 24 + pw, y + 24 + th, tw, th);
    } else if (i === 1) {                              // consulta de datas
      const fw = (w - 36) / 2, fh = 68;
      ['Entrada', 'Saída'].forEach((lb, j) => {
        const fx = x + 12 + j * (fw + 12);
        fillR(c, fx, y + 12, fw, fh, 14, C.card2); strokeR(c, fx, y + 12, fw, fh, 14, rgba(C.lime, 0.7), 2);
        text(c, lb, fx + 18, y + 42, { size: 22, weight: 500, color: C.muted });
        icon(c, 'cal', fx + fw - 30, y + 40, 30, C.lime, 0.08);
        fillR(c, fx + 18, y + 56, 110, 11, 5.5, C.bar2);
      });
      const ry = y + 24 + fh, rh = h - (ry - y) - 12;
      fillR(c, x + 12, ry, fw, rh, 14, C.card2);
      text(c, 'Hóspedes', x + 30, ry + rh / 2 - 3, { size: 20, weight: 500, color: C.muted });
      fillR(c, x + 30, ry + rh / 2 + 9, 70, 10, 5, C.bar2);
      fillR(c, x + 24 + fw, ry, fw, rh, 14, C.lime);
      text(c, 'Consultar', x + 24 + fw * 1.5, ry + rh / 2 + 9, { size: 26, weight: 700, color: C.ink, align: 'center' });
    } else {                                           // como chegar: mapa e endereço (só em barras)
      const mw = Math.round((w - 36) * 0.62), ax = x + 24 + mw, aw = w - 36 - mw;
      mapArt(c, x + 12, y + 12, mw, h - 24);
      c.beginPath(); c.arc(ax + 14, y + 44, 9, 0, TAU); c.fillStyle = C.lime; c.fill();
      bars(c, ax + 34, y + 38, [aw - 44, (aw - 44) * 0.7], 11, 26, C.bar2);
      strokeR(c, ax, y + h - 66, aw - 4, 46, 23, rgba(C.lime, 0.8), 2);
      icon(c, 'arrow', ax + (aw - 4) / 2, y + h - 43, 30, C.lime, 0.1);
    }
  }
  // etiqueta lima presa na borda de cima do bloco, alinhada à esquerda dele (top = borda de cima do bloco)
  function blockLabel(c, i, x, top, size) {
    if (size <= 0.5) return;
    const s = SLOTS[i].label, ph = size * 1.6, pw = measure(s, TEXT, size, 700) + size * 1.2, y = top - ph + LBO * (size / LBL);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 14; c.shadowOffsetY = 5;
    fillR(c, x, y, pw, ph, ph / 2, C.lime); c.restore();
    text(c, s, x + size * 0.6, y + ph / 2 + size * 0.36, { size, weight: 700, color: C.ink });
  }
  // um bloco: aparece em FORM (vindo das 3 peças), cai e encaixa no seu lugar no celular
  function drawBlock(c, i, t) {
    const L = LAND[i], sl = SLOTS[i];
    const ap = E.outBack(prog(t, L - 0.72, L - 0.5), 1.6);
    if (ap <= 0) return;
    const fall = E.inCubic(prog(t, L - 0.42, L));                       // queda com aceleração, pouso no tempo
    const sc = lerp(0.56, 1, E.outCubic(prog(t, L - 0.42, L)));
    const cx = lerp(FORM.x, SX + SWD / 2, fall), cy = lerp(FORM.y, sl.y + sl.h / 2, fall);
    const sq = 1 - 0.06 * kick(t, L, 0.18);                             // amassadinho no pouso
    const w = SWD, h = sl.h, k = sc * ap;
    c.save(); c.translate(cx, cy); c.scale(k, k * sq); c.translate(-w / 2, -h / 2);
    blockBody(c, i, 0, 0, w, h);
    const lit = kick(t, L, 0.5);
    if (lit > 0.02) { c.save(); c.shadowColor = C.lime; c.shadowBlur = 30 * lit; strokeR(c, 0, 0, w, h, 24, rgba(C.lime, lit), 4); c.restore(); }
    c.restore();
    const size = lerp(34, LBL, E.inOutCubic(prog(t, L, L + 0.35))) * Math.min(1, ap);
    blockLabel(c, i, cx - (w / 2) * k, cy - (h / 2) * k * sq, size);
    if (t > L - 0.74 && t < L - 0.4) glow(c, FORM.x, FORM.y, 180, 0.25 * (1 - prog(t, L - 0.6, L - 0.4)));   // clarão: as peças viram o bloco
  }

  // ---------------------------------------------------------------- cena 4: noite e manhã
  let MOON = null;
  const NSTARS = [];
  function buildNight() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 140; const g = cv.getContext('2d');
    g.fillStyle = '#EEF1F4'; g.beginPath(); g.arc(70, 70, 38, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(88, 58, 34, 0, TAU); g.fill();
    MOON = cv;
    const r = U.rng(31);
    for (let k = 0; k < 80; k++) {
      const x = 30 + r() * 1020; let y = 60 + r() * 1440;
      if (y > 460 && x > 180 && x < 900) y = 60 + r() * 380;           // atrás do celular não se vê: vai para o céu
      if (x > 930 && y > 1040) continue;                                // coluna da direita livre
      NSTARS.push([x, y, 0.8 + r() * 1.8, r() * TAU, 1.5 + r() * 3]);
    }
  }
  const nightK = (t) => E.inOutSine(prog(t, NOITE.off, NOITE.off + 0.8)) * (1 - E.inOutSine(prog(t, T.virada - 0.1, T.virada + 0.5)));
  const mornK = (t) => E.inOutSine(prog(t, NOITE.manha, NOITE.manha + 1.2));
  function sky(c, t) {
    const n = nightK(t);
    if (n <= 0.002) return;
    const m = mornK(t);
    c.save(); c.globalAlpha = n;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, U.mix('#0B1430', '#271A0E', m)); g.addColorStop(0.45, U.mix('#070A16', '#0E0B08', m)); g.addColorStop(1, '#050606');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const sa = (1 - m) * prog(t, NOITE.off + 0.2, NOITE.off + 1.0);    // estrelas (somem de manhã)
    if (sa > 0.01) NSTARS.forEach(([x, y, r, ph, w]) => {
      c.globalAlpha = n * sa * (0.35 + 0.65 * Math.abs(Math.sin(t * w * 0.5 + ph)));
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    });
    c.globalAlpha = n;
    // lua: sobe no alto à esquerda e se põe quando amanhece
    const mu = E.outCubic(prog(t, NOITE.off + 0.1, NOITE.off + 1.0)), md = E.inCubic(prog(t, NOITE.manha, NOITE.manha + 0.7));
    if (mu > 0 && md < 1) {
      const my = lerp(300, 165, mu) + md * 160;
      glow(c, 150, my, 130, 0.16 * (1 - md), '#DDE6FF');
      c.globalAlpha = n * (1 - md); c.drawImage(MOON, 80, my - 70); c.globalAlpha = n;
    }
    // sol: nasce no alto à direita; o céu esquenta
    const su = E.outCubic(prog(t, NOITE.manha + 0.4, NOITE.manha + 1.3));
    if (su > 0) {
      const sy = lerp(330, 175, su);
      glow(c, 930, sy, 440, 0.16 * su, '#FFB45C'); glow(c, 930, sy, 110, 0.5 * su, '#FFE2A8');
      c.beginPath(); c.arc(930, sy, 34, 0, TAU); c.fillStyle = rgba('#FFE9BE', su); c.fill();
    }
    c.restore();
  }
  // relógio da tela de bloqueio: as horas (e os minutos) rolam como num contador
  function clockState(t) {
    if (t < NOITE.manha) return [22, 1, 59, 1, E.inOutCubic(prog(t, NOITE.relogio - 0.35, NOITE.relogio))];   // 22:59 -> 23:00
    return [23, 8, 0, 0, E.inOutCubic(prog(t, NOITE.roll, NOITE.roll + 1.0))];                                // 23:00 -> 07:00
  }
  function clock(c, cx, by, size, t) {
    const [h0, hs, m0, ms, p] = clockState(t);
    c.save();
    c.font = fnt(TEXT, size, 300); c.letterSpacing = '0px'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#F4F6F6';
    const dw = Math.max(...'0123456789'.split('').map((d) => c.measureText(d).width));
    const cw = c.measureText(':').width + size * 0.08, pw = 2 * dw, x0 = cx - (2 * pw + cw) / 2;
    const step = size * 0.95, top = by - size * 0.8, hh = size * 0.9;
    const pair = (x, v0, steps, mod) => {
      const pos = v0 + steps * p, fl = Math.floor(pos + 1e-6), fr = steps ? pos - fl : 0;
      c.save(); c.beginPath(); c.rect(x - 8, top, pw + 16, hh); c.clip();
      [fl, fl + 1].forEach((v, j) => {
        if (j === 1 && fr < 0.001) return;
        const s = String(((v % mod) + mod) % mod).padStart(2, '0'), yy = by - fr * step + j * step;
        c.fillText(s[0], x + dw / 2, yy); c.fillText(s[1], x + dw * 1.5, yy);
      });
      c.restore();
    };
    pair(x0, h0, hs, 24);
    c.fillText(':', x0 + pw + cw / 2, by - size * 0.06);
    pair(x0 + pw + cw, m0, ms, 60);
    c.restore();
  }
  const ROWS = ['Entrada', 'Saída', 'Hóspedes', 'Chalé'];
  function consultaRows(c, x, y, w, rowH, fs) {        // os campos da consulta; os valores são barras
    const bw = [150, 150, 70, 190], lx = fs * 5.6;
    ROWS.forEach((lb, k) => {
      const ry = y + k * rowH;
      text(c, lb, x, ry + fs * 0.36, { size: fs, weight: 500, color: C.soft });
      fillR(c, x + lx, ry - 7, Math.min(bw[k], w - lx), 14, 7, C.bar2);
    });
  }
  function checkBadge(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = C.lime; c.fill(); icon(c, 'check', x, y, r * 1.6, C.ink, 0.13); }
  const NOT = { x: SCR.x + 20, y: SCR.y + 372, w: SW - 40, h: 330 };
  function notifCard(c) {
    const { x, y, w, h } = NOT;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 36; c.shadowOffsetY = 12;
    fillR(c, x, y, w, h, 34, 'rgba(36,41,44,0.95)'); c.restore();
    fillR(c, x + 24, y + 24, 58, 58, 16, C.lime); icon(c, 'globe', x + 53, y + 53, 42, C.ink, 0.085);   // ícone genérico (site)
    text(c, 'Consulta pelo site', x + 100, y + 64, { size: 30, weight: 700, color: C.white });
    text(c, '23:00', x + w - 26, y + 62, { size: 22, weight: 500, color: C.muted, align: 'right' });
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x + 24, y + 104, w - 48, 2);
    consultaRows(c, x + 30, y + 146, w - 120, 52, 26);
    checkBadge(c, x + w - 52, y + 146 + 3 * 52, 24);
  }
  function lockScreen(c, t) {
    const m = mornK(t);
    const g = c.createLinearGradient(0, SCR.y, 0, SCR.y + SH);
    g.addColorStop(0, U.mix('#101B3A', '#3A2814', m)); g.addColorStop(0.6, U.mix('#070B18', '#15100A', m)); g.addColorStop(1, '#050708');
    c.fillStyle = g; c.fillRect(SCR.x, SCR.y, SW, SH);
    fillR(c, W / 2 - 100, SCR.y + 112, 200, 16, 8, 'rgba(255,255,255,0.5)');          // data (em barra)
    clock(c, W / 2, SCR.y + 300, 168, t);
    const np = E.outBack(prog(t, NOITE.notif, NOITE.notif + 0.4), 1.3);
    if (np > 0) {
      const press = 1 - 0.03 * kick(t, NOITE.toque, 0.3), cy = NOT.y + NOT.h / 2, s = lerp(0.9, 1, clamp(np)) * press;
      c.save(); c.globalAlpha *= clamp(np * 1.5);
      c.translate(W / 2, cy - (1 - np) * 220); c.scale(s, s); c.translate(-W / 2, -cy);
      notifCard(c);
      c.restore();
    }
  }
  function avatar(c, x, y, r) {                        // silhueta genérica
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#2A3236'; c.fill(); c.clip();
    c.fillStyle = '#8A9292'; c.beginPath(); c.arc(x, y - r * 0.18, r * 0.36, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x, y + r * 0.78, r * 0.66, r * 0.5, 0, 0, TAU); c.fill();
    c.restore();
  }
  const BUB = { x: SX, y: WEB.y + 134, w: 500, h: 340 };
  const REP = { y: BUB.y + BUB.h + 36 };
  function chatScreen(c, t) {
    c.fillStyle = '#0A0D0E'; c.fillRect(SCR.x, SCR.y, SW, SH);
    const hy = WEB.y;
    c.fillStyle = '#131819'; c.fillRect(SCR.x, SCR.y, SW, SB + 100);
    icon(c, 'back', SX + 16, hy + 50, 40, C.soft, 0.11);
    avatar(c, SX + 82, hy + 50, 32);
    fillR(c, SX + 130, hy + 32, 210, 16, 8, '#DCE2E2'); fillR(c, SX + 130, hy + 60, 130, 11, 5.5, C.bar2);
    // a consulta que chegou às 23:00, já organizada pelo site
    const { x: bx, y: by, w: bw, h: bh } = BUB;
    fillR(c, bx, by, bw, bh, 28, '#1B2224');
    c.beginPath(); c.moveTo(bx, by + 22); c.lineTo(bx - 12, by + 4); c.lineTo(bx + 26, by); c.closePath(); c.fillStyle = '#1B2224'; c.fill();
    icon(c, 'globe', bx + 42, by + 46, 34, C.lime, 0.09);
    text(c, 'Consulta pelo site', bx + 70, by + 56, { size: 28, weight: 700, color: C.white });
    consultaRows(c, bx + 30, by + 124, bw - 60, 50, 26);
    text(c, '23:00', bx + bw - 24, by + bh - 22, { size: 20, weight: 500, color: C.muted, align: 'right' });
    // a resposta, só de manhã: "digitando…" (balão da pousada) e depois a mensagem
    const tp = E.outBack(prog(t, NOITE.digita, NOITE.digita + 0.3), 1.6), tq = prog(t, NOITE.envia - 0.04, NOITE.envia + 0.08);
    if (tp > 0 && tq < 1) {
      const dw = measure('digitando', TEXT, 26, 500), w = dw + 110, h = 78, rx = SX + SWD - w, ry = REP.y;
      c.save(); c.globalAlpha *= clamp(tp) * (1 - tq); c.translate(rx + w, ry); c.scale(tp, tp); c.translate(-(rx + w), -ry);
      fillR(c, rx, ry, w, h, 26, '#141A1C'); strokeR(c, rx, ry, w, h, 26, rgba(C.lime, 0.85), 2);
      text(c, 'digitando', rx + 30, ry + 48, { size: 26, weight: 500, color: C.soft });
      for (let k = 0; k < 3; k++) {
        const j = Math.max(0, Math.sin((t - NOITE.digita) * 9 - k * 0.9));
        c.beginPath(); c.arc(rx + 44 + dw + k * 18, ry + 42 - j * 7, 4.5, 0, TAU); c.fillStyle = C.lime; c.fill();
      }
      c.restore();
    }
    const rp = E.outBack(prog(t, NOITE.envia, NOITE.envia + 0.35), 1.6);
    if (rp > 0) {
      const w = 440, h = 170, rx = SX + SWD - w, ry = REP.y;
      c.save(); c.translate(rx + w, ry); c.scale(rp, rp); c.translate(-(rx + w), -ry);
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 30 * kick(t, NOITE.envia + 0.1, 0.6); fillR(c, rx, ry, w, h, 28, C.lime); c.restore();
      bars(c, rx + 28, ry + 34, [w - 70, w - 140, w - 220], 14, 30, 'rgba(10,12,12,0.5)');
      text(c, '07:00', rx + w - 66, ry + h - 20, { size: 20, weight: 600, color: 'rgba(10,12,12,0.72)', align: 'right' });
      icon(c, 'checks', rx + w - 38, ry + h - 27, 30, 'rgba(10,12,12,0.78)', 0.1);
      c.restore();
    }
    // campo de mensagem: a resposta sendo escrita (barra que cresce) até o envio
    const iy = 1422, ty = prog(t, NOITE.digita + 0.1, NOITE.envia - 0.05);
    fillR(c, SX, iy, SWD - 86, 70, 35, '#1B2224');
    if (ty > 0 && t < NOITE.envia) {
      const tw = 30 + 300 * ty;
      fillR(c, SX + 28, iy + 29, tw, 12, 6, C.soft);
      if (Math.sin(t * 18) > 0) { c.fillStyle = C.lime; c.fillRect(SX + 34 + tw, iy + 20, 3, 30); }
    } else fillR(c, SX + 28, iy + 30, 140, 11, 5.5, C.bar);
    c.beginPath(); c.arc(SX + SWD - 35, iy + 35, 35, 0, TAU); c.fillStyle = C.lime; c.fill();
    icon(c, 'send', SX + SWD - 33, iy + 35, 34, C.ink, 0.09);
  }
  // o toque do dono na notificação (de manhã)
  function touchDot(c, t) {
    const t0 = NOITE.toque, a = prog(t, t0 - 0.4, t0 - 0.2) * (1 - prog(t, t0 + 0.12, t0 + 0.3));
    if (a <= 0.01) return;
    const tx = 720, ty = NOT.y + 110, ap = E.outCubic(prog(t, t0 - 0.4, t0));
    const x = lerp(tx + 90, tx, ap), y = lerp(ty + 260, ty, ap), r = 36 * (1 - 0.18 * kick(t, t0, 0.25));
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    const rp = prog(t, t0, t0 + 0.45);
    if (rp > 0 && rp < 1) { c.beginPath(); c.arc(x, y, r + 54 * E.outCubic(rp), 0, TAU); c.globalAlpha *= 1 - rp; c.strokeStyle = C.white; c.stroke(); }
    c.restore();
  }
  // a tela do celular em cada momento: site -> (apaga) -> bloqueio -> conversa -> site (virada)
  function screenAt(c, t) {
    const back = E.inOutCubic(prog(t, T.virada, T.virada + 0.4));
    const siteA = t < T.virada ? (1 - 0.65 * prog(t, NOITE.off, NOITE.off + 0.15)) * (1 - prog(t, NOITE.lock, NOITE.lock + 0.3)) : back;
    if (t >= NOITE.off && t < T.virada + 0.4) {
      const lockA = prog(t, NOITE.lock, NOITE.lock + 0.3) * (1 - back);
      if (lockA > 0.001) { c.save(); c.globalAlpha *= lockA; lockScreen(c, t); c.restore(); }
      const cp = E.outCubic(prog(t, NOITE.toque + 0.12, NOITE.toque + 0.45));
      if (cp > 0) { c.save(); c.globalAlpha *= clamp(cp * 1.4) * (1 - back); c.translate(0, (1 - cp) * 90); chatScreen(c, t); c.restore(); }
    }
    if (siteA > 0.001) {
      c.save(); c.globalAlpha *= siteA;
      if (t >= T.virada) { const z = lerp(1.05, 1, back); c.translate(W / 2, SCR.y + SH / 2); c.scale(z, z); c.translate(-W / 2, -(SCR.y + SH / 2)); }
      site(c, t); c.restore();
    }
  }

  // ---------------------------------------------------------------- cena 5: virada
  const phoneGlow = (t) => E.outCubic(prog(t, T.virada + 0.1, T.virada + 0.5)) * (1 - prog(t, T.cta - 0.3, T.cta)) * (0.75 + 0.25 * Math.sin(t * 4)) + 0.6 * kick(t, VIRA.golpe, 0.7);
  function pings(c, t) {                               // "ser encontrada": ondas lima saindo do celular
    [VIRA.golpe, VIRA.golpe + 0.6].forEach((t0) => {
      const p = prog(t, t0, t0 + 1.1);
      if (p <= 0 || p >= 1) return;
      const e = E.outCubic(p), w = PW * (1 + 0.36 * e), h = PHH * (1 + 0.04 * e);
      c.save(); c.globalAlpha *= (1 - p) * 0.75; rrect(c, W / 2 - w / 2, PY + PHH / 2 - h / 2, w, h, PR * (1 + 0.3 * e));
      c.lineWidth = 4; c.strokeStyle = C.lime; c.stroke(); c.restore();
    });
  }
  // LUXO no contorno rachado da cena 2: peças levemente afastadas, a fresta lima entre elas
  let GAP = null;
  function luxoCracked(c, cx, cy, k, spread) {
    const place = (g, p) => {
      const dx = p.cx - LX.cw / 2, dy = p.cy - LX.ch / 2, d = Math.hypot(dx, dy) || 1, sp = spread * (0.7 + 0.6 * hash(p.i, 21));
      g.translate(p.cx + (dx / d) * sp, p.cy + (dy / d) * sp * 0.7); g.rotate((hash(p.i, 23) - 0.5) * 0.004 * spread); g.translate(-p.cx, -p.cy);
      g.beginPath(); p.P.forEach((q, j) => (j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y))); g.closePath();
    };
    const g = GAP.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, LX.cw, LX.ch);
    g.save(); g.beginPath(); g.rect((LX.cw - LX.tw) / 2 - 14, LX.by - LX.asc - 14, LX.tw + 28, LX.asc + 28); g.clip();   // só na palavra
    g.strokeStyle = C.lime; g.lineCap = 'round'; g.shadowColor = C.lime; g.shadowBlur = 14; g.lineWidth = 7;
    LX.cuts.forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); });
    g.restore();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';  // a fresta só aparece entre as peças
    LX.pieces.forEach((p) => { g.save(); place(g, p); g.fill(); g.restore(); });
    g.globalCompositeOperation = 'source-over';
    c.save(); c.translate(cx, cy); c.scale(k, k); c.translate(-LX.cw / 2, -LX.ch / 2);
    c.drawImage(GAP, 0, 0);
    LX.pieces.forEach((p) => { c.save(); place(c, p); c.clip(); c.drawImage(LX.word, 0, 0); c.restore(); });
    c.restore();
  }
  function naoELuxo(c, t) {
    const t0 = VIRA.luxo, t1 = VIRA.luxoSai;
    if (t < t0 - 0.05 || t > t1 + 0.6) return;
    titleBlock(c, ['NÃO É'], t, t0, t1, { size: SZ.naoE, y: SZ.naoEY, lime: ['NÃO', 'É'] });
    const p = E.outCubic(prog(t, t0 + 0.15, t0 + 0.65)), q = E.inCubic(prog(t, t1 + 0.06, t1 + 0.34));
    if (p <= 0 || q >= 1) return;
    const k = SZ.luxoK, dot = measure('.', DISPLAY, SZ.luxoS, 900), cx = W / 2 - dot / 2;
    c.save(); c.translate(0, -q * 90); c.globalAlpha *= clamp(p * 1.6) * (1 - q);
    luxoCracked(c, cx, SZ.luxoY, k, lerp(48, 9, p));
    text(c, '.', cx + (LX.tw * k) / 2 + 2, SZ.luxoY + (LX.asc * k) / 2, { fam: DISPLAY, size: SZ.luxoS, weight: 900, color: C.white });
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
  const SK = 0.966;                                   // inclinação da barra da logo
  function cta(c, t) {
    const wp = prog(t, T.cta - 0.12, T.cta + 0.4);     // "o corte": a barra lima varre na diagonal
    if (wp > 0 && wp < 1) {
      const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wp)), bw = 120;
      c.beginPath(); c.moveTo(x0 + SK * 1200 - bw / 2, -200); c.lineTo(x0 + SK * 1200 + bw / 2, -200); c.lineTo(x0 - SK * 1200 + bw / 2, 2200); c.lineTo(x0 - SK * 1200 - bw / 2, 2200); c.closePath();
      c.fillStyle = C.lime; c.fill();
    }
    if (t < T.cta - 0.1) return;
    const gp = prog(t, T.cta, T.cta + 1.0);
    glow(c, 540, 900, 520, 0.1 * gp + 0.03 * Math.sin(t * 3) * gp);
    drawLogo(c, 540, 880, 720, t, T.cta + 0.02);
    const s1 = E.outCubic(prog(t, T.cta + 0.85, T.cta + 1.3));
    text(c, 'Sites para pousadas e negócios locais', W / 2, 1100 + (1 - s1) * 24, { size: 40, weight: 500, color: C.soft, align: 'center', alpha: s1 });
    const s2 = E.outBack(prog(t, T.cta + 1.4, T.cta + 1.8), 1.6);
    if (s2 > 0) {
      const lbl = 'Fale com a FAZLO · link na bio', fw = measure(lbl, TEXT, 34, 600) + 120;
      c.save(); c.translate(W / 2, 1222); c.scale(s2, s2);
      rrect(c, -fw / 2, -38, fw, 76, 38); c.fillStyle = C.lime; c.fill();
      text(c, lbl, -fw / 2 + 40, 12, { size: 34, weight: 600, color: C.ink });
      icon(c, 'arrow', fw / 2 - 44, -2 - 4 * Math.sin(t * 6), 34, C.ink, 0.12);
      c.restore();
    }
    const fl = kick(t, T.cta, 0.3);                   // clarão lima na virada para a logo
    if (fl > 0.01) { c.fillStyle = rgba(C.lime, 0.16 * fl); c.fillRect(0, 0, W, H); }
  }

  // ---------------------------------------------------------------- textos
  const L_HOOK = ['SITE É COISA DE', 'POUSADA GRANDE?'];
  const L_FRASE = ['UMA POUSADA PEQUENA', 'PRECISA DO BÁSICO', 'BEM FEITO.'];
  const L_NOITE = ['ELE TRABALHA', 'ATÉ QUANDO VOCÊ', 'NÃO PODE ATENDER.'];
  const L_ACHADA = ['É SER', 'ENCONTRADA.'];
  let SZ = {};

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);
    sky(c, t);
    const sh = U.noise1(t * 30, 3) * 14 * kick(t, GOLPE, 0.3);
    c.save(); c.translate(sh, U.noise1(t * 30, 7) * 8 * kick(t, GOLPE, 0.3));

    // ===== 1 · GANCHO
    const hz = 1 + 0.05 * E.inOutSine(prog(t, 0.2, 4.0));                    // aproximação lenta durante a leitura
    c.save(); c.translate(W / 2, 890); c.scale(hz, hz); c.translate(-W / 2, -890);
    titleBlock(c, L_HOOK, t, -0.32, 3.9, { size: SZ.hook, y: 860, lime: ['GRANDE?'] });
    c.restore();

    // ===== 2 · O MITO
    if (t > T.mito - 0.05 && t < GOLPE - 0.02) drawLuxoWhole(c, t, 1);
    if (t >= GOLPE - 0.02 && t < ESTOURO) drawLuxoWhole(c, Math.min(t, GOLPE), 1, 1 - prog(t, GOLPE, GOLPE + 0.08));   // rachada: o brilho apaga
    drawCrack(c, t);
    const fl = kick(t, GOLPE, 0.18);
    if (fl > 0.02) { c.fillStyle = rgba(C.lime, 0.14 * fl); c.fillRect(-40, -40, W + 80, H + 80); }

    // ===== 3 a 5 · O CELULAR (some no rodapé seguro)
    const rise = E.outCubic(prog(t, 8.85, 9.45)), out = E.inCubic(prog(t, T.cta - 0.3, T.cta + 0.15));
    if (rise > 0 && out < 1) {
      // depois do último pouso o celular respira devagar (a imagem nunca congela nas pausas de leitura)
      const br = prog(t, LAND[3] + 0.05, LAND[3] + 0.4), fy = (Math.sin((t - LAND[3]) * 0.9) * 4 + Math.sin((t - LAND[3]) * 0.37) * 3) * br;
      const zb = 1 + 0.01 * Math.sin((t - LAND[3]) * 0.55) * br, cy = PY + PHH / 2;
      faded(c, (g) => {
        g.translate(0, (1 - rise) * 1300 + out * 1400 + fy);
        g.translate(W / 2, cy); g.scale(zb, zb); g.translate(-W / 2, -cy);
        pings(g, t);
        phone(g, (cc) => screenAt(cc, t), phoneGlow(t));
      });
    }
    drawPieces(c, t);
    // NÃO. (por cima das peças)
    const np = E.outBack(prog(t, ESTOURO, ESTOURO + 0.35), 1.8), nq = prog(t, 8.7, 8.95);
    if (np > 0 && nq < 1) {
      c.save(); c.globalAlpha *= clamp(np) * (1 - nq); c.translate(W / 2, LUXO_Y); const s = np * (1 - 0.15 * nq); c.scale(s, s);
      text(c, 'NÃO.', 0, SZ.nao * 0.36, { fam: DISPLAY, size: SZ.nao, weight: 900, color: C.lime, align: 'center', ls: -SZ.nao * 0.02 });
      c.restore();
    }
    for (let i = 0; i < 4; i++) if (t < LAND[i]) drawBlock(c, i, t);          // caindo: por cima de tudo
    titleBlock(c, L_FRASE, t, FRASE.t0, FRASE.t1, { size: SZ.frase, y: SZ.fraseY, lime: ['BEM', 'FEITO.'] });

    // ===== 4 · TRABALHA POR VOCÊ
    titleBlock(c, L_NOITE, t, NOITE.frase, NOITE.fraseSai, { size: SZ.noite, y: SZ.noiteY, lime: ['TRABALHA'] });
    touchDot(c, t);

    // ===== 5 · VIRADA
    naoELuxo(c, t);
    titleBlock(c, L_ACHADA, t, VIRA.golpe - 0.02, VIRA.sai, { size: SZ.achada, y: SZ.achadaY, lime: ['ENCONTRADA.'] });
    const vf = kick(t, VIRA.golpe, 0.25);
    if (vf > 0.02) { c.fillStyle = rgba(C.lime, 0.1 * vf); c.fillRect(-40, -40, W + 80, H + 80); }
    c.restore();

    // ===== 6 · CTA
    cta(c, t);
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
    blur: { default: [3, 1 / 120], ranges: [[ESTOURO, ESTOURO + 0.9, 5, 1 / 110], [T.cta - 0.3, T.cta + 0.2, 5, 1 / 110]] },
    setup() {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      buildLuxo(); buildNight(); loadLogo();
      SHINE = document.createElement('canvas'); SHINE.width = LX.cw; SHINE.height = LX.ch;
      GAP = document.createElement('canvas'); GAP.width = LX.cw; GAP.height = LX.ch;
      const f = (L, max) => fit(L, DISPLAY, 900, 940, max, -0.02);
      // títulos acima do celular, na faixa y 240–436 (centralizados nela)
      const ty = (n, s) => 240 + (196 - (0.74 * s + 1.12 * s * (n - 1))) / 2 + 0.74 * s;
      SZ = { hook: f(L_HOOK, 100), frase: f(L_FRASE, 60), nao: f(['NÃO.'], 260), noite: f(L_NOITE, 60), achada: f(L_ACHADA, 104), naoE: f(['NÃO É'], 84) };
      SZ.fraseY = ty(3, SZ.frase); SZ.noiteY = ty(3, SZ.noite); SZ.achadaY = ty(2, SZ.achada);
      SZ.luxoS = 140; SZ.luxoK = SZ.luxoS / LX.size;
      const hNE = 0.74 * SZ.naoE, hL = LX.asc * SZ.luxoK, top = 240 + (196 - (hNE + 26 + hL)) / 2;
      SZ.naoEY = top + hNE; SZ.luxoY = top + hNE + 26 + hL / 2;
    },
    frame,
    post,
    cover(ctx) {
      background(ctx, 20);
      glow(ctx, 540, 1060, 640, 0.07);
      drawLogo(ctx, 540, 352, 560, 99, 0);                           // logo no topo, centralizada
      // SITE / NÃO É / LUXO (contorno rachado): tudo em y 520–1460
      const s = fit(['NÃO É', 'SITE'], DISPLAY, 900, 880, 220, -0.02), k = 1, hL = LX.asc * k;
      const hTot = 0.74 * s + 1.14 * s + 0.36 * s + hL, y0 = 520 + (940 - hTot) / 2;
      const y1 = y0 + 0.74 * s, y2 = y1 + 1.14 * s, ly = y2 + 0.36 * s + hL / 2;
      text(ctx, 'SITE', 540, y1, { fam: DISPLAY, size: s, weight: 900, color: C.white, align: 'center', ls: -s * 0.02 });
      text(ctx, 'NÃO É', 540, y2, { fam: DISPLAY, size: s, weight: 900, color: C.lime, align: 'center', ls: -s * 0.02 });
      luxoCracked(ctx, 540, ly, k, 14);
    },
    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(T.mito, 'luxo');
      [5.0, 5.9].forEach((t, k) => cue(t, 'shine', { k }));
      cue(GOLPE, 'slash');
      cue(ESTOURO, 'burst');
      cue(8.3, 'gather', { d: 0.9 });
      cue(8.85, 'rise', { d: 0.6 });
      cue(9.45, 'header');
      LAND.forEach((t, k) => { cue(t - 0.72, 'form', { k }); cue(t - 0.42, 'fall', { k, d: 0.42 }); cue(t, 'drop', { k }); });
      cue(FRASE.t0, 'title');
      cue(NOITE.off, 'night');
      cue(NOITE.relogio, 'clock');
      cue(NOITE.notif, 'notif');
      cue(NOITE.frase, 'title');
      cue(NOITE.manha, 'morning', { d: 1.2 });
      cue(NOITE.roll, 'clockroll', { d: 1.0 });
      cue(NOITE.toque, 'tap');
      cue(NOITE.toque + 0.12, 'switch');
      cue(NOITE.digita, 'typing', { d: +(NOITE.envia - NOITE.digita).toFixed(3) });
      cue(NOITE.envia, 'sent');
      cue(T.virada, 'switch');
      cue(VIRA.luxo, 'title');
      cue(VIRA.luxo + 0.15, 'crack');
      cue(VIRA.golpe, 'hit');
      cue(T.cta, 'logo');
      cue(T.cta + 1.4, 'cta');
    },
  });
})();
