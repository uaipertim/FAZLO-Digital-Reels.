/* =====================================================================
   FAZLO Digital — REEL 001 · "Seu negócio já é bom. Seu digital precisa parecer isso."
   9:16 (1080x1920, 60 fps) · 120 BPM (1 compasso = 2 s)

   Conceito "À ALTURA": a barra lima da logo vira a FRONTEIRA DE RESOLUÇÃO.
   De um lado, o negócio como ele é: nítido. Do outro, o digital: pixelado,
   apagado, atrasado, a 12 quadros por segundo, e o "JÁ É BOM." vira "JÁ É BOM?".

     c.1     o negócio, nítido: SEU NEGÓCIO / JÁ É BOM.
     c.2     a barra corta: NA PRÁTICA | NO DIGITAL — o lado digital em baixa resolução
     c.3     o digital toma a tela e o negócio encolhe: "parece menor do que é"
     c.4     travado, picotado: SEU DIGITAL / PRECISA PARECER...
     c.5     ISSO. A barra se abre e o mundo vira um estúdio claro em alta definição
     c.6–9   MAIS FORTE. · MAIS PROFISSIONAL. · MAIS CONFIÁVEL. · MAIS MARCANTE.
             (peso, precisão, fundação, marca: cada golpe com seu próprio movimento)
     c.10–11 a fronteira volta, agora sem diferença: PRESENÇA DIGITAL À ALTURA DO SEU NEGÓCIO.
     c.12–13 a logo (versão escura oficial) resolve de pixel a nítida; fazlodigital.com.br

   Motor em core/engine.js: frame(ctx, t) desenha o quadro exato do instante t.
   Os cues (audio/cues.json) alimentam scripts/audio.py, cuja trilha também
   passa de lo-fi a hi-fi na virada.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, hash, noise1, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 120;
  const { BT, S16, bar } = U.tempo(BPM);          // 0,5 s · 0,125 s
  const DURATION = 26.6;
  const T = {
    hook: 0,            // c.1    o negócio, nítido
    split: bar(2),      // c.2    a barra corta: o digital em baixa resolução
    shrink: bar(3),     // c.3    o digital toma a tela; tudo encolhe
    stall: bar(4),      // c.4    travado: SEU DIGITAL / PRECISA PARECER
    virada: bar(5),     // c.5    ISSO. — alta definição
    forte: bar(6), prof: bar(7), conf: bar(8), marc: bar(9),
    altura: bar(10),    // c.10–11 à altura
    marca: bar(12),     // c.12–13 logo + endereço
  };
  const SWEEP = [T.virada, T.virada + 0.45];
  const FREEZE = [[bar(4, 1), bar(4, 1) + 0.18], [bar(4, 2.5), bar(4, 2.5) + 0.22]];
  const URL_T = T.marca + 1.0;

  // ---------------------------------------------------------------- marca
  let B, C, DISPLAY, TEXT, LOGO, LOGOD, PAPER, INK;
  const SK = 0.966, SW = 0.438;                    // barra da logo: inclinação (dx/dy) e largura/altura
  const DL = Math.hypot(SK, 1);
  const DIR = { x: SK / DL, y: -1 / DL };          // ao longo da barra, subindo para a direita
  const NRM = { x: 1 / DL, y: SK / DL };
  const uOf = (x, y) => x + SK * y;                // coordenada inclinada: constante ao longo da barra
  const UC = uOf(W / 2, 900);                      // a fronteira passa pelo centro

  // ---------------------------------------------------------------- desenho
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function slashPts(cx, cy, h, w = SW * h) {
    const k = SK * h / 2;
    return [[cx - w / 2 + k, cy - h / 2], [cx + w / 2 + k, cy - h / 2], [cx + w / 2 - k, cy + h / 2], [cx - w / 2 - k, cy + h / 2]];
  }
  function slash(c, cx, cy, h, color, alpha = 1, w) {
    if (alpha <= 0.002 || h <= 0.5) return;
    poly(c, slashPts(cx, cy, h, w)); c.globalAlpha = alpha; c.fillStyle = color; c.fill(); c.globalAlpha = 1;
  }
  // faixa da tela entre as retas inclinadas u0 e u1
  function band(c, u0, u1, y0 = -300, y1 = H + 300) { poly(c, [[u0 - SK * y0, y0], [u1 - SK * y0, y0], [u1 - SK * y1, y1], [u0 - SK * y1, y1]]); }
  // barra horizontal com pontas na inclinação da barra (marca-texto)
  function marker(c, cx, cy, w, h) { const k = SK * h / 2; poly(c, [[cx - w / 2 + k, cy - h / 2], [cx + w / 2 + k, cy - h / 2], [cx + w / 2 - k, cy + h / 2], [cx - w / 2 - k, cy + h / 2]]); }
  function glow(c, x, y, r, color, a) {
    if (a <= 0.002 || r <= 1) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, clamp(a))); g.addColorStop(0.3, rgba(color, clamp(a) * 0.42)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function slantLight(c, u, half, color, a) {
    if (a <= 0.002) return;
    const g = c.createLinearGradient(u - half, 0, u + half, 0);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.5, rgba(color, clamp(a))); g.addColorStop(1, rgba(color, 0));
    c.save(); c.transform(1, 0, -SK, 1, 0, 0); c.fillStyle = g; c.fillRect(u - half, -300, 2 * half, H + 600); c.restore();
  }
  function flash(c, a, color = '#F3FFDC') {
    if (a <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = rgba(color, clamp(a)); c.fillRect(0, 0, W, H); c.restore();
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
  // posição x (esquerda) de cada caractere de uma linha alinhada
  function charXs(s, o, x) {
    const w = measure(s, o.fam, o.size, o.weight, o.ls || 0);
    let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const xs = [];
    for (const ch of s) { xs.push(cx); cx += measure(ch, o.fam, o.size, o.weight, o.ls || 0); }
    return { xs, w, x0: xs[0] };
  }
  // letra a letra: cada uma sobe e acende em sequência
  function cascade(c, s, x, y, o, t, t0, st = 0.022, dur = 0.32) {
    if (t < t0) return;
    const { xs } = charXs(s, o, x);
    [...s].forEach((ch, i) => {
      const p = E.outCubic(prog(t, t0 + i * st, t0 + i * st + dur));
      if (p > 0 && ch !== ' ') text(c, ch, xs[i], y + (1 - p) * o.size * 0.7, { ...o, align: 'left', alpha: (o.alpha ?? 1) * p });
    });
  }
  // palavra fatiada na inclinação da barra (assinatura cinética da marca)
  function sliced(c, s, x, y, o, t, t0, opt = {}) {
    if (t < t0) return;
    const { n = 6, dur = 0.5, st = 0.03, spread = 650, out = null, light = false } = opt;
    const w = measure(s, o.fam, o.size, o.weight, o.ls || 0);
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const top = y - o.size * 0.82, bot = y + o.size * 0.25;
    const ua = uOf(x0, top) - 6, ub = uOf(x0 + w, bot) + 6, du = (ub - ua) / n;
    for (let i = 0; i < n; i++) {
      const pin = E.outExpo(prog(t, t0 + i * st, t0 + i * st + dur));
      const to = out == null ? 0 : out + (n - 1 - i) * st * 0.6;
      const pout = out == null ? 0 : E.inExpo(prog(t, to, to + dur * 0.55));
      if (pin <= 0 || pout >= 1) continue;
      const sg = i % 2 ? 1 : -1;
      const d = sg * spread * (1 - pin) - sg * spread * pout;
      c.save();
      band(c, ua + i * du, ua + (i + 1) * du + 0.6, top - 1600, bot + 1600); c.clip();
      c.translate(DIR.x * d, DIR.y * d);
      text(c, s, x, y, { ...o, alpha: (o.alpha ?? 1) * clamp(pin * 2.2) * (1 - pout * 0.6) });
      c.restore();
      const m = Math.max(1 - pin, pout);
      if (m > 0.01 && m < 0.999) {                              // fio de luz no trilho em movimento
        const u = ua + (i + (sg > 0 ? 1 : 0)) * du;
        c.save(); c.globalCompositeOperation = light ? 'source-over' : 'lighter';
        c.strokeStyle = rgba(light ? C.accentLo : C.accent, 0.9 * Math.sin(m * Math.PI) * (o.alpha ?? 1)); c.lineWidth = 3;
        c.beginPath(); c.moveTo(u - SK * (top - 60), top - 60); c.lineTo(u - SK * (bot + 60), bot + 60); c.stroke();
        c.restore();
      }
    }
  }

  // ---------------------------------------------------------------- 3D
  function fly({ x: px = 0, y: py = 0, z: pz = 0, yaw = 0, pitch = 0, f = 1100, cx = W / 2, cy = H / 2 }) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return (x, y, z) => {
      x -= px; y -= py; z -= pz;
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      if (z2 < 30) return null;
      const s = f / z2;
      return { x: cx + x1 * s, y: cy + y2 * s, s, z: z2 };
    };
  }

  // ================================================================ tamanhos (setup)
  let S_NEG, S_BOM, S_L, S_ISSO, S_F, S_P, S_C, S_M, S_BOM2, S_A;
  const A1 = { cx: W / 2, cy: 900, y1: 790, y2: 1010 };
  const Y_L1 = 610;
  let Y_L2;
  const Y_ISSO = 1030, Y_HERO = 1010, TX = 84, AX = 110;   // AX: margem do bloco final (termina antes da coluna de ações)

  // ================================================================ ATO 1 · o negócio nítido x o digital em baixa resolução
  function act1Scale(t) { return lerp(1, 0.46, E.inOutCubic(prog(t, T.shrink + 0.25, T.shrink + 1.7))); }
  function glyphEnd(t, lofi) {
    if (!lofi || t < T.split + 0.22) return '.';
    return hash(Math.floor(t * 9), 17) < 0.14 ? '.' : '?';     // o ponto final vira dúvida
  }
  // "JÁ É BOM." com BOM em lima; a largura é sempre medida com o ponto, para nada pular
  function bomLine(c, y, end, size, colA, colB, alpha = 1) {
    const o = { fam: DISPLAY, size, weight: 900, ls: -size * 0.02 };
    const wa = measure('JÁ É ', o.fam, size, 900, o.ls), wb = measure('BOM', o.fam, size, 900, o.ls), wc = measure('.', o.fam, size, 900, o.ls);
    const x0 = W / 2 - (wa + wb + wc) / 2;
    text(c, 'JÁ É ', x0, y, { ...o, color: colA, alpha });
    text(c, 'BOM', x0 + wa, y, { ...o, color: colB, alpha });
    text(c, end, x0 + wa + wb, y, { ...o, color: colB, alpha });
    return { x0, wa, wb, wc };
  }
  function dropLetters(c, s, x, y, o, t, t0, st, dur) {
    const { xs } = charXs(s, o, x);
    [...s].forEach((ch, i) => {
      if (ch === ' ') return;
      const p = prog(t, t0 + i * st, t0 + i * st + dur);
      if (p <= 0) return;
      const e = E.outBack(p, 1.4);
      text(c, ch, xs[i], y - (1 - e) * o.size * 1.3, { ...o, align: 'left', alpha: clamp(p * 2.5) });
    });
  }
  function scene1(c, t, lofi) {
    c.fillStyle = '#07080A'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, 900, 0, W / 2, 900, 1300);
    g.addColorStop(0, '#1C1F25'); g.addColorStop(0.6, '#0C0D10'); g.addColorStop(1, '#060607');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    slantLight(c, ((t * 170) % 3600) - 300, 240, C.accent, 0.05);
    c.restore();
    const s = act1Scale(t) * lerp(1.14, 1, E.outCubic(prog(t, 0, 0.9)));   // abre com um recuo de câmera
    c.save(); c.translate(A1.cx, A1.cy); c.scale(s, s); c.translate(-A1.cx, -A1.cy);
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, W / 2, 930, 640, C.accent, 0.08 + 0.14 * kick(t, 0.5, 0.7) + 0.25 * kick(t, 0, 0.45)); c.restore();
    dropLetters(c, 'SEU NEGÓCIO', W / 2, A1.y1, { fam: DISPLAY, size: S_NEG, weight: 900, color: C.ink, ls: -S_NEG * 0.02, align: 'center' }, t, -0.14, 0.018, 0.26);
    if (t >= 0.42) {
      const sl = E.outExpo(prog(t, 0.42, 0.7));
      const sc = lerp(1.75, 1, sl), cy = A1.y2 - S_BOM * 0.36;
      c.save(); c.translate(W / 2, cy); c.scale(sc, sc); c.translate(-W / 2, -cy);
      const m = bomLine(c, A1.y2, glyphEnd(t, lofi), S_BOM, C.ink, C.accent, clamp(sl * 3));
      c.restore();
      // sublinhado lima que se desenha sob BOM
      const ul = E.outExpo(prog(t, 1.0, 1.35));
      if (ul > 0) { c.fillStyle = C.accent; c.fillRect(m.x0 + m.wa, A1.y2 + S_BOM * 0.14, m.wb * ul, S_BOM * 0.06); }
    }
    // reflexo no piso: o título espelhado, esmaecendo
    if (t >= 0.42) {
      c.save(); c.translate(0, 2 * (A1.y2 + S_BOM * 0.24)); c.scale(1, -1);
      c.globalAlpha = 0.14 * clamp((t - 0.42) * 4);
      bomLine(c, A1.y2, glyphEnd(t, lofi), S_BOM, C.ink, C.accent);
      c.restore();
      const rg = c.createLinearGradient(0, A1.y2 + S_BOM * 0.24, 0, A1.y2 + S_BOM * 1.1);
      rg.addColorStop(0, 'rgba(7,8,10,0)'); rg.addColorStop(1, 'rgba(7,8,10,1)');
      c.fillStyle = rg; c.fillRect(0, A1.y2 + S_BOM * 0.24, W, S_BOM);
    }
    // brilho que atravessa o título
    const sh = prog(t, 1.0, 1.7);
    if (sh > 0 && sh < 1) { c.save(); c.globalCompositeOperation = 'lighter'; slantLight(c, lerp(500, 2500, E.inOutSine(sh)), 120, '#FFFFFF', 0.16); c.restore(); }
    c.restore();
  }

  // --- o digital: a mesma cena renderizada pequena, sem cor, atrasada e a 12 quadros por segundo
  let LC = null, LX = null;
  const lofiBlock = (t) => Math.round(lerp(12, 20, prog(t, T.shrink, T.virada)));
  function lofiTime(t) {
    for (const [a, b] of FREEZE) if (t >= a && t < b) t = a;
    return Math.max(0, Math.floor((t - 0.09) * 12) / 12);
  }
  function renderLofi(ctx, t, drawScene) {
    const k = lofiBlock(t), w = Math.ceil(W / k), h = Math.ceil(H / k);
    if (!LC) { LC = document.createElement('canvas'); LX = LC.getContext('2d', { willReadFrequently: true }); }
    if (LC.width !== w || LC.height !== h) { LC.width = w; LC.height = h; }
    LX.setTransform(w / W, 0, 0, h / H, 0, 0); LX.globalAlpha = 1; LX.globalCompositeOperation = 'source-over';
    drawScene(LX, lofiTime(t), true);
    LX.setTransform(1, 0, 0, 1, 0, 0);
    const id = LX.getImageData(0, 0, w, h), d = id.data, f = Math.floor(lofiTime(t) * 12);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const r = d[i], g = d[i + 1], b = d[i + 2], l = 0.3 * r + 0.59 * g + 0.11 * b;
      const n = (hash(p, f) - 0.5) * 9;
      const R = 34 + lerp(r, l, 0.75) * 0.6 + n, G = 36 + lerp(g, l, 0.7) * 0.6 + n, Bc = 33 + lerp(b, l, 0.8) * 0.56 + n;
      d[i] = Math.round(R / 21) * 21; d[i + 1] = Math.round(G / 21) * 21; d[i + 2] = Math.round(Bc / 21) * 21;   // posterizado
    }
    LX.putImageData(id, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const jit = 0.6 + 1.8 * prog(t, T.shrink, T.virada);
    for (let r = 0; r < h; r++) {                               // linhas "fora de sincronia"
      const jx = hash(r, f * 3 + 7) > 0.85 ? Math.round((hash(r, f) - 0.5) * k * jit) : 0;
      ctx.drawImage(LC, 0, r, w, 1, jx, r * k, w * k, k);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.17)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);  // linhas de varredura
    ctx.restore();
  }
  // a fronteira: a barra lima corta a tela na diagonal
  function uBound(t) { return t < T.split ? 1e5 : lerp(UC, -500, E.inOutCubic(prog(t, T.shrink, T.shrink + 1.35))); }
  function bladeLine(c, t, t0, u, { light = false, fade = 1 } = {}) {
    if (t < t0 - 0.07) return;
    const p = E.outCubic(prog(t, t0 - 0.07, t0 + 0.07));            // a lâmina corre de baixo-esquerda para cima-direita
    const y1 = H + 200, y0 = lerp(H + 200, -200, p);
    const a = fade * (1 - 0.3 * prog(t, t0 + 0.1, t0 + 0.6));
    if (a <= 0.01) return;
    c.save();
    if (!light) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(C.accent, 0.22 * a); c.lineWidth = 26; c.beginPath(); c.moveTo(u - SK * y1, y1); c.lineTo(u - SK * y0, y0); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = rgba(light ? C.accentLo : C.accent, a); c.lineWidth = light ? 6 : 5;
    c.beginPath(); c.moveTo(u - SK * y1, y1); c.lineTo(u - SK * y0, y0); c.stroke();
    if (light) { c.strokeStyle = rgba(C.accent, a); c.lineWidth = 3; c.stroke(); }
    c.restore();
  }
  function overlay1(c, t) {
    // rótulos das duas metades
    const lo = 1 - prog(t, T.shrink, T.shrink + 0.3);
    const kk = { fam: TEXT, size: 34, weight: 700, ls: 9 };
    cascade(c, 'NA PRÁTICA', TX, 560, { ...kk, color: C.ink, alpha: 0.95 * lo }, t, T.split + 0.25, 0.03, 0.3);
    const w2 = measure('NO DIGITAL', TEXT, 34, 700, 9);
    cascade(c, 'NO DIGITAL', 930 - w2, 1330, { ...kk, color: '#A3A996', alpha: 0.95 * lo }, t, T.split + 0.5, 0.03, 0.3);
    // narração
    const nf = 1 - prog(t, T.stall - 0.15, T.stall);
    const nn = { fam: TEXT, size: 44, weight: 600, color: C.ink, ls: 1.5, align: 'center', alpha: 0.92 * nf };
    cascade(c, 'NO DIGITAL, ELE PARECE', W / 2, 1360, nn, t, T.shrink + 0.6, 0.02, 0.3);
    cascade(c, 'MENOR DO QUE É.', W / 2, 1426, nn, t, T.shrink + 1.0, 0.025, 0.3);
    // SEU DIGITAL / PRECISA PARECER
    const oL = { fam: DISPLAY, size: S_L, weight: 800, color: C.ink, ls: -S_L * 0.01, align: 'center' };
    sliced(c, 'SEU DIGITAL', W / 2, Y_L1, oL, t, T.stall, { n: 5 });
    sliced(c, 'PRECISA PARECER', W / 2, Y_L2, oL, t, T.stall + 1.0, { n: 7 });
    // esperança: uma barra nítida acende no meio do digital apagado
    const hp = prog(t, T.stall + 1.0, T.virada);
    if (hp > 0) {
      const h = lerp(40, 300, E.inCubic(hp)) * (1 + 0.08 * kick(t, Math.floor(t / BT) * BT, 0.2));
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, W / 2, 1220, 200 + 260 * hp, C.accent, 0.25 + 0.45 * hp); c.restore();
      slash(c, W / 2, 1220, h, C.accent, clamp(hp * 4));
    }
  }
  function act1(ctx, t) {
    scene1(ctx, t, false);
    if (t >= T.split) {
      ctx.save(); band(ctx, uBound(t), 9000); ctx.clip();
      ctx.globalAlpha = clamp((t - T.split) / 0.06);
      renderLofi(ctx, t, scene1);
      ctx.restore();
      // a fronteira, enquanto ainda está na tela
      const fadeB = t < T.shrink ? 1 : 0.55;
      bladeLine(ctx, t, T.split, uBound(t), { fade: fadeB });
      if (t < T.split + 0.25) flash(ctx, 0.35 * kick(t, T.split, 0.15));
    }
    overlay1(ctx, t);
  }

  // ================================================================ ESTÚDIO CLARO (alta definição)
  let BOKEH = null;
  function buildBokeh() {
    BOKEH = document.createElement('canvas'); BOKEH.width = 1000; BOKEH.height = 840;
    const g = BOKEH.getContext('2d');
    g.filter = 'blur(26px)'; g.fillStyle = C.accent;
    poly(g, slashPts(500, 420, 500)); g.fill();
  }
  function floorGrid(c, t) {
    const cam = fly({ x: 50 * Math.sin(t * 0.21), y: -560, z: -300 + (t - T.virada) * 45, yaw: 0.05 * Math.sin(t * 0.17), pitch: 0.3, f: 1100, cy: 1010 });
    c.save(); c.lineWidth = 1.6;
    for (let gi = -16; gi <= 16; gi++) {
      const a = cam(gi * 240, 0, 260), b = cam(gi * 240, 0, 7200);
      if (!a || !b) continue;
      const g = c.createLinearGradient(a.x, a.y, b.x, b.y);
      g.addColorStop(0, 'rgba(24,25,24,0.10)'); g.addColorStop(1, 'rgba(24,25,24,0)');
      c.strokeStyle = g; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    for (let gj = 0; gj < 28; gj++) {
      const z = 260 + gj * 250 - ((t * 45) % 250);
      const a = cam(-4000, 0, z), b = cam(4000, 0, z);
      if (!a || !b) continue;
      c.strokeStyle = `rgba(24,25,24,${0.09 * clamp(1.2 - z / 7000)})`;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.restore();
  }
  function stageLight(c, t) {
    c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, 820, 60, W / 2, 900, 1400);
    g.addColorStop(0, '#FCFCFA'); g.addColorStop(0.55, '#EFEFEC'); g.addColorStop(1, '#D4D4CF');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    floorGrid(c, t);
    // barras lima desfocadas, em profundidade
    for (let i = 0; i < 6; i++) {
      const s = 0.45 + 0.8 * hash(i, 41), x = hash(i, 42) * W + Math.sin(t * 0.3 + i) * 60 + (t - T.virada) * (12 + 20 * hash(i, 43)) * (i % 2 ? 1 : -1);
      const y = 200 + hash(i, 44) * 1300 + Math.cos(t * 0.25 + i) * 40;
      c.globalAlpha = 0.12 + 0.14 * hash(i, 45);
      c.drawImage(BOKEH, x - 500 * s, y - 420 * s, 1000 * s, 840 * s);
    }
    c.globalAlpha = 1;
  }
  // palavra-herói: tipografia preta com volume (extrusão) e sombra no chão
  const SHADOWS = {};
  function shadowSprite(s, size, ls) {
    const key = s + size;
    if (SHADOWS[key]) return SHADOWS[key];
    const w = Math.ceil(measure(s, DISPLAY, size, 900, ls) + 160), h = Math.ceil(size * 1.6);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    g.filter = 'blur(16px)'; g.font = fnt(DISPLAY, size, 900); g.letterSpacing = `${ls}px`; g.textAlign = 'center'; g.fillStyle = '#000';
    g.fillText(s, w / 2, h * 0.72);
    return (SHADOWS[key] = { img: cv, w, h });
  }
  function heroWord(c, s, x, y, size, o = {}) {
    const { depth = 26, alpha = 1, shadow = 1, color = INK, ls = -size * 0.02 } = o;
    if (alpha <= 0.01) return;
    const dx = 0.42, dy = 0.9;
    if (shadow > 0.01) {
      const sp = shadowSprite(s, size, ls);
      c.save(); c.globalAlpha = 0.3 * shadow * alpha;
      c.drawImage(sp.img, x - sp.w / 2 + depth * 0.5, y + depth * 0.9 - sp.h * 0.15, sp.w, sp.h * 0.3);
      c.restore();
    }
    const N = Math.max(1, Math.round(depth / 2.2));
    for (let k = N; k >= 1; k--) {
      const d = depth * k / N;
      text(c, s, x + dx * d, y + dy * d, { fam: DISPLAY, size, weight: 900, ls, align: 'center', alpha, color: U.mix('#6E716C', '#2B2D2B', k / N) });
    }
    text(c, s, x, y, { fam: DISPLAY, size, weight: 900, ls, align: 'center', alpha, color });
  }
  function heroChar(c, ch, x, y, size, depth, color = INK) {
    const N = Math.max(1, Math.round(depth / 2.2));
    for (let k = N; k >= 1; k--) { const d = depth * k / N; text(c, ch, x + 0.42 * d, y + 0.9 * d, { fam: DISPLAY, size, weight: 900, color: U.mix('#6E716C', '#2B2D2B', k / N) }); }
    text(c, ch, x, y, { fam: DISPLAY, size, weight: 900, color });
  }
  function kickerMais(c, t, t0, y) {
    cascade(c, 'MAIS', W / 2, y, { fam: TEXT, size: 40, weight: 700, color: '#6A6D68', ls: 18, align: 'center' }, t, t0, 0.04, 0.3);
  }
  // saída em chicote, ao longo da barra
  function whipOut(c, t, tEnd) { const p = E.inCubic(prog(t, tEnd - 0.28, tEnd - 0.1)); c.translate(DIR.x * 1800 * p, DIR.y * 1800 * p); return p; }
  function dust(c, t, t0, x, y, spread, n = 60, seed = 1) {
    const s = t - t0;
    if (s < 0 || s > 1.1) return;
    c.save(); c.fillStyle = INK;
    for (let i = 0; i < n; i++) {
      const dir = hash(i, seed) < 0.5 ? -1 : 1, v = 300 + 900 * hash(i, seed + 1), up = 120 + 420 * hash(i, seed + 2);
      const px = x + dir * (spread * 0.3 * hash(i, seed + 3) + v * s * Math.exp(-s * 1.5));
      const py = y - up * s + 900 * s * s;
      if (py > y + 30) continue;
      c.globalAlpha = 0.5 * (1 - s / 1.1);
      const z = 2 + 4 * hash(i, seed + 4);
      c.fillRect(px, py, z, z);
    }
    c.restore();
  }

  // --- c.5 ISSO.
  function sceneIsso(c, t) {
    c.save();
    whipOut(c, t, T.forte);
    const oL = { fam: DISPLAY, size: S_L, weight: 800, color: INK, ls: -S_L * 0.01, align: 'center' };
    text(c, 'SEU DIGITAL', W / 2, Y_L1, oL);
    text(c, 'PRECISA PARECER', W / 2, Y_L2, oL);
    const set = E.outExpo(prog(t, T.virada, T.virada + 0.6));
    const sc = lerp(1.14, 1, set) * (1 + 0.035 * E.inOutSine(prog(t, T.virada + 0.6, T.forte)));
    c.save(); c.translate(W / 2, Y_ISSO - S_ISSO * 0.36); c.scale(sc, sc); c.translate(-W / 2, -(Y_ISSO - S_ISSO * 0.36));
    heroWord(c, 'ISSO.', W / 2, Y_ISSO, S_ISSO, { depth: 38 });
    c.restore();
    c.restore();
  }
  // --- c.6 MAIS FORTE. (peso)
  function sceneForte(c, t) {
    const fall = E.inQuad(prog(t, T.forte - 0.22, T.forte));
    if (fall <= 0) return;
    c.save();
    whipOut(c, t, T.prof);
    kickerMais(c, t, T.forte + 0.05, Y_HERO - S_F * 0.73 - 70);
    const sq = 1 - 0.14 * kick(t, T.forte, 0.25);
    const py = Y_HERO + S_F * 0.2;
    c.save(); c.translate(W / 2, py); c.scale(1 + (1 - sq) * 0.6, sq); c.translate(-W / 2, -py);
    heroWord(c, 'FORTE.', W / 2, Y_HERO - (1 - fall) * 1500, S_F, { depth: 52, shadow: fall });
    c.restore();
    dust(c, t, T.forte, W / 2, Y_HERO + 50, 820, 70, 3);
    // onda de pressão no chão
    const r = prog(t, T.forte, T.forte + 0.6);
    if (r > 0 && r < 1) { c.save(); c.strokeStyle = rgba(INK, 0.25 * (1 - r)); c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, Y_HERO + 60, 200 + 900 * E.outCubic(r), 30 + 120 * E.outCubic(r), 0, 0, TAU); c.stroke(); c.restore(); }
    c.restore();
  }
  // --- c.7 MAIS PROFISSIONAL. (precisão: tudo se alinha)
  function sceneProf(c, t) {
    if (t < T.prof - 0.22) return;
    c.save();
    whipOut(c, t, T.conf);
    const s = 'PROFISSIONAL.', o = { fam: DISPLAY, size: S_P, weight: 900, ls: -S_P * 0.02, align: 'center' };
    const { xs, w, x0 } = charXs(s, o, W / 2);
    const cap = Y_HERO - S_P * 0.73, base = Y_HERO;
    // guias de construção
    c.save(); c.strokeStyle = rgba(INK, 0.28); c.lineWidth = 2;
    const g1 = E.outExpo(prog(t, T.prof + 0.05, T.prof + 0.45));
    if (g1 > 0) for (const y of [cap, base]) { c.beginPath(); c.moveTo(W / 2 - 620 * g1, y); c.lineTo(W / 2 + 620 * g1, y); c.stroke(); }
    xs.forEach((x, i) => {
      const p = E.outCubic(prog(t, T.prof + 0.25 + i * 0.03, T.prof + 0.45 + i * 0.03));
      if (p > 0) { c.beginPath(); c.moveTo(x, base + 150); c.lineTo(x, base + 150 - (300 + S_P) * p); c.stroke(); }
    });
    const rl = E.outExpo(prog(t, T.prof + 0.75, T.prof + 1.1));
    if (rl > 0) {                                              // régua
      const ry = cap - 150;
      c.beginPath(); c.moveTo(x0, ry); c.lineTo(x0 + w * rl, ry); c.stroke();
      for (let k = 0; k <= 40; k++) { const x = x0 + w * k / 40; if (x > x0 + w * rl) break; c.beginPath(); c.moveTo(x, ry); c.lineTo(x, ry - (k % 5 ? 10 : 22)); c.stroke(); }
    }
    c.restore();
    xs.forEach((x, i) => {                                     // nós lima nas interseções
      const p = prog(t, T.prof + 0.5 + i * 0.02, T.prof + 0.62 + i * 0.02);
      if (p > 0) { const z = 10 * E.outBack(p, 2); c.fillStyle = C.accent; c.fillRect(x - z / 2, base - z / 2, z, z); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(x - z / 2, base - z / 2, z, z); }
    });
    kickerMais(c, t, T.prof, cap - 230);
    // letras: chegam fora de lugar e encaixam no golpe
    const enter = E.outCubic(prog(t, T.prof - 0.22, T.prof - 0.02));
    [...s].forEach((ch, i) => {
      const r1 = hash(i, 91) - 0.5, r2 = hash(i, 92) - 0.5, r3 = hash(i, 93) - 0.5;
      const ps = E.outBack(prog(t, T.prof + i * 0.008, T.prof + i * 0.008 + 0.17), 1.7);
      const mess = 1 - ps;
      const cw = measure(ch, o.fam, o.size, o.weight, o.ls);
      const px = xs[i] + r1 * 240 * mess - DIR.x * 1500 * (1 - enter), py = base + r2 * 300 * mess - DIR.y * 1500 * (1 - enter);
      c.save(); c.translate(px + cw / 2, py - S_P * 0.36); c.rotate(r3 * 1.1 * mess); c.scale(1 + r2 * 0.7 * mess, 1 + r2 * 0.7 * mess);
      heroChar(c, ch, -cw / 2, S_P * 0.36, S_P, 14);
      c.restore();
    });
    // linha de alinhamento que corre pela base
    const al = prog(t, T.prof + 1.0, T.prof + 1.6);
    if (al > 0 && al < 1) { const x = lerp(x0 - 100, x0 + w + 100, E.inOutSine(al)); c.fillStyle = C.accent; c.fillRect(x - 70, base + 26, 140, 8); c.fillStyle = INK; c.fillRect(x - 70, base + 34, 140, 2); }
    c.restore();
  }
  // --- c.8 MAIS CONFIÁVEL. (fundação: cada letra pousa numa base sólida)
  function sceneConf(c, t) {
    if (t < T.conf - 0.3) return;
    c.save();
    whipOut(c, t, T.marc);
    const s = 'CONFIÁVEL.', o = { fam: DISPLAY, size: S_C, weight: 900, ls: -S_C * 0.02, align: 'center' };
    const { xs, w, x0 } = charXs(s, o, W / 2);
    const base = Y_HERO;
    // a base: um bloco que sobe do chão
    const pr = E.outCubic(prog(t, T.conf - 0.28, T.conf - 0.02));
    if (pr > 0) {
      const bw = w + 40, bh = 64, bx = W / 2 - bw / 2 - 20, by = base + 30 + (1 - pr) * 700, dd = 30;
      c.save(); c.globalAlpha = clamp(pr * 2);
      c.fillStyle = '#3B3D3A'; poly(c, [[bx + bw, by], [bx + bw + dd * 0.42, by + dd * 0.9], [bx + bw + dd * 0.42, by + bh + dd * 0.9], [bx + bw, by + bh]]); c.fill();
      c.fillStyle = '#4C4F4B'; poly(c, [[bx, by + bh], [bx + bw, by + bh], [bx + bw + dd * 0.42, by + bh + dd * 0.9], [bx + dd * 0.42, by + bh + dd * 0.9]]); c.fill();
      c.fillStyle = INK; c.fillRect(bx, by, bw, bh);
      const lk = kick(t, T.conf + s.length * S16, 0.5);
      c.fillStyle = C.accent; c.fillRect(bx, by, bw, 6 + 4 * lk);
      if (lk > 0.02) { c.globalCompositeOperation = 'source-over'; c.fillStyle = rgba(C.accent, 0.45 * lk); c.fillRect(bx - 20, by - 10, bw + 40, 26); }
      c.restore();
    }
    kickerMais(c, t, T.conf, base - S_C * 0.73 - 80);
    [...s].forEach((ch, i) => {
      const land = T.conf + i * S16;
      const f = E.inQuad(prog(t, land - 0.2, land));
      if (f <= 0) return;
      const sq = 1 - 0.18 * kick(t, land, 0.18);
      const cw = measure(ch, o.fam, o.size, o.weight, o.ls);
      c.save(); c.translate(xs[i] + cw / 2, base); c.scale(1 + (1 - sq) * 0.5, sq); c.translate(-(xs[i] + cw / 2), -base);
      heroChar(c, ch, xs[i], base - (1 - f) * 1300, S_C, 22);
      c.restore();
      dust(c, t, land, xs[i] + cw / 2, base + 30, 80, 10, 50 + i * 7);
    });
    c.restore();
  }
  // --- c.9 MAIS MARCANTE. (a marca: a barra carimba e deixa eco)
  function sceneMarc(c, t) {
    if (t < T.marc - 0.2) return;
    c.save();
    whipOut(c, t, T.altura);
    const s = 'MARCANTE.', o = { fam: DISPLAY, size: S_M, weight: 900, ls: -S_M * 0.02, align: 'center' };
    const w = measure(s, o.fam, o.size, o.weight, o.ls), cy = Y_HERO - S_M * 0.36;
    // ecos: contornos da palavra que se expandem a cada tempo
    for (let k = 0; k < 4; k++) {
      const e = prog(t, T.marc + k * BT, T.marc + k * BT + 0.9);
      if (e <= 0 || e >= 1) continue;
      const sc = 1 + 0.55 * E.outCubic(e);
      c.save(); c.translate(W / 2, cy); c.scale(sc, sc); c.translate(-W / 2, -cy);
      c.font = fnt(o.fam, o.size, 900); c.letterSpacing = `${o.ls}px`; c.textAlign = 'center';
      c.strokeStyle = rgba(INK, 0.35 * (1 - e)); c.lineWidth = 2.5 / sc; c.strokeText(s, W / 2, Y_HERO);
      c.restore();
    }
    // o carimbo lima
    const st = E.inExpo(prog(t, T.marc - 0.16, T.marc));
    if (st > 0) {
      const sc = lerp(2.6, 1, st) * (1 + 0.04 * kick(t, T.marc, 0.3));
      c.save(); c.translate(W / 2, cy); c.scale(sc, sc); c.rotate(-0.02);
      marker(c, 0, 0, w + 150, S_M * 1.25); c.globalAlpha = clamp(st * 1.5); c.fillStyle = C.accent; c.fill();
      c.restore();
      // anéis do impacto
      const r = prog(t, T.marc, T.marc + 0.7);
      if (r > 0 && r < 1) { c.save(); c.translate(W / 2, cy); c.scale(1 + 1.4 * E.outCubic(r), 1 + 1.4 * E.outCubic(r)); marker(c, 0, 0, w + 150, S_M * 1.25); c.strokeStyle = rgba(C.accentLo, 0.8 * (1 - r)); c.lineWidth = 4; c.stroke(); c.restore(); }
    }
    kickerMais(c, t, T.marc, Y_HERO - S_M * 0.73 - 120);
    const wa = E.outExpo(prog(t, T.marc - 0.04, T.marc + 0.25));
    if (wa > 0) {
      const sc = lerp(1.15, 1, wa);
      c.save(); c.translate(W / 2, cy); c.scale(sc, sc); c.translate(-W / 2, -cy);
      heroWord(c, s, W / 2, Y_HERO, S_M, { depth: 18, alpha: clamp(wa * 3), shadow: 0 });
      c.restore();
    }
    c.restore();
  }
  // --- c.10–11 À ALTURA
  function sceneAltura(c, t) {
    if (t < T.altura - 0.1) return;
    c.save();
    whipOut(c, t, T.marca);
    const t0 = T.altura;
    // a fronteira volta — agora dos dois lados é a mesma coisa
    const fadeL = 1 - prog(t, t0 + 0.65, t0 + 1.0);
    bladeLine(c, t, t0, UC, { light: true, fade: fadeL });
    const kk = { fam: TEXT, size: 34, weight: 700, ls: 9, color: INK };
    const ko = 1 - prog(t, t0 + 0.9, t0 + 1.05);
    cascade(c, 'NA PRÁTICA', TX, 560, { ...kk, alpha: ko }, t, t0 + 0.05, 0.03, 0.3);
    const w2 = measure('NO DIGITAL', TEXT, 34, 700, 9);
    cascade(c, 'NO DIGITAL', 930 - w2, 1330, { ...kk, alpha: ko }, t, t0 + 0.2, 0.03, 0.3);
    // o mesmo "JÁ É BOM." dos dois lados, nítido
    const bin = E.outExpo(prog(t, t0, t0 + 0.4)), bout = E.inCubic(prog(t, t0 + 0.9, t0 + 1.05));
    if (bin > 0 && bout < 1) {
      const cy = 1000 - S_BOM2 * 0.36, sc = lerp(1.2, 1, bin) * (1 - 0.3 * bout);
      c.save(); c.translate(W / 2, cy); c.scale(sc, sc); c.translate(-W / 2, -cy);
      const m = bomLine(c, 1000, '.', S_BOM2, INK, INK, clamp(bin * 3) * (1 - bout));
      c.fillStyle = rgba(C.accent, (1 - bout)); c.fillRect(m.x0 + m.wa, 1000 + S_BOM2 * 0.14, m.wb, S_BOM2 * 0.07);
      c.restore();
      // pulso de "igual": os dois lados acendem juntos
      const mp = kick(t, t0 + 0.5, 0.35);
      if (mp > 0.02) { c.save(); c.globalAlpha = 0.5 * mp; c.strokeStyle = C.accent; c.lineWidth = 6; c.strokeRect(70, 780, W - 140, 330); c.restore(); }
    }
    // PRESENÇA DIGITAL / À ALTURA / DO SEU NEGÓCIO. — a palavra sobe até a linha de nível
    const yA = 1010, cap = yA - S_A * 0.73;
    cascade(c, 'PRESENÇA DIGITAL', W / 2, cap - 150, { fam: TEXT, size: 40, weight: 700, color: '#5E615C', ls: 12, align: 'center' }, t, t0 + 1.0, 0.025, 0.3);
    const lv = E.outExpo(prog(t, t0 + 1.0, t0 + 1.4));             // a linha de nível: a altura do negócio
    if (lv > 0) {
      c.fillStyle = C.accent; c.fillRect(W / 2 - 470 * lv, cap - 52, 940 * lv, 10);
      c.fillStyle = INK; c.fillRect(W / 2 - 470 * lv, cap - 42, 940 * lv, 2);
      for (const sx of [-1, 1]) { const x = W / 2 + sx * 470 * lv; c.fillRect(x - 1, cap - 70, 2, 46); }
    }
    const rs = E.outBack(prog(t, t0 + 1.25, t0 + 1.55), 1.2);
    if (rs > 0) {
      c.save(); c.beginPath(); c.rect(0, 0, W, yA + 60); c.clip();   // emerge do chão
      heroWord(c, 'À ALTURA', W / 2, yA + (1 - rs) * S_A * 1.3, S_A, { depth: 30, shadow: clamp(rs) });
      c.restore();
      const hit = kick(t, t0 + 1.5, 0.35);
      if (hit > 0.02) { c.fillStyle = rgba(C.accent, 0.6 * hit); c.fillRect(W / 2 - 500, cap - 60, 1000, 26); }
    }
    const sN = fit('DO SEU NEGÓCIO.', DISPLAY, 900, 860, 100, -0.02);
    sliced(c, 'DO SEU NEGÓCIO.', W / 2, yA + 40 + sN * 1.05, { fam: DISPLAY, size: sN, weight: 900, ls: -sN * 0.02, align: 'center', color: INK }, t, t0 + 2.0, { n: 7, light: true });
    c.restore();
  }

  // ================================================================ MARCA
  let LG;
  function buildLogo() {
    const sl = B.slash, iw = LOGOD.naturalWidth, ih = LOGOD.naturalHeight;
    const kx = iw / sl.imgW, ky = ih / sl.imgH;
    const bx0 = 46 * kx, by0 = 85 * ky, bx1 = 1916 * kx, by1 = 494 * ky;
    const s = 880 / (bx1 - bx0), cx = W / 2, cy = 880;
    const x0 = cx - ((bx0 + bx1) / 2) * s, y0 = cy - ((by0 + by1) / 2) * s;
    const P_ = (x, y) => [x0 + x * kx * s, y0 + y * ky * s];
    const corners = [P_(sl.tl, sl.top), P_(sl.tr, sl.top), P_(sl.br, sl.bottom), P_(sl.bl, sl.bottom)];
    LG = {
      s, x0, y0, w: iw * s, h: ih * s, cx, cy, slash: corners,
      scx: corners.reduce((a, q) => a + q[0], 0) / 4, scy: corners.reduce((a, q) => a + q[1], 0) / 4,
      sh: (sl.bottom - sl.top) * ky * s, top: y0 + by0 * s, bot: y0 + by1 * s, left: x0 + bx0 * s, right: x0 + bx1 * s,
    };
  }
  let PXC = null, PXX = null, LBUF = null;
  // a logo resolve de pixel a nítida (degraus no ritmo); depois, só o arquivo oficial
  function drawLogoDark(c, t, push) {
    const m0 = T.marca;
    if (t < m0) return;
    const steps = [36, 18, 9, 4.5], si = Math.floor((t - m0) / S16);
    c.save(); c.translate(LG.cx, LG.cy); c.scale(push, push); c.translate(-LG.cx, -LG.cy);
    if (si < steps.length) {
      const k = steps[si], w = Math.ceil(W / k), h = Math.ceil(H / k);
      if (!PXC) { PXC = document.createElement('canvas'); PXX = PXC.getContext('2d'); }
      if (PXC.width !== w || PXC.height !== h) { PXC.width = w; PXC.height = h; }
      PXX.setTransform(1, 0, 0, 1, 0, 0); PXX.clearRect(0, 0, w, h);
      PXX.imageSmoothingEnabled = true; PXX.drawImage(LOGOD, LG.x0 / k, LG.y0 / k, LG.w / k, LG.h / k);
      c.imageSmoothingEnabled = false; c.drawImage(PXC, 0, 0, w * k, h * k); c.imageSmoothingEnabled = true;
    } else {
      if (!LBUF) { LBUF = document.createElement('canvas'); LBUF.width = W; LBUF.height = H; }
      const b = LBUF.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H);
      b.drawImage(LOGOD, LG.x0, LG.y0, LG.w, LG.h);
      for (const [g0, dur] of [[m0 + 0.6, 0.6], [25.0, 0.6]]) {         // brilho especular só sobre o desenho
        const p = prog(t, g0, g0 + dur);
        if (p <= 0 || p >= 1) continue;
        b.globalCompositeOperation = 'source-atop';
        slantLight(b, lerp(uOf(LG.left, LG.top) - 300, uOf(LG.right, LG.bot) + 300, E.inOutSine(p)), 130, '#FFFFFF', 0.75);
        b.globalCompositeOperation = 'source-over';
      }
      c.drawImage(LBUF, 0, 0);
    }
    c.restore();
  }
  function sceneMarca(c, t) {
    const m0 = T.marca;
    const push = 1 + 0.03 * E.inOutSine(prog(t, m0 + 0.5, DURATION));
    // halo lima suave atrás
    glow(c, LG.scx, LG.scy, 620, C.accent, 0.12 + 0.12 * kick(t, m0, 0.7));
    drawLogoDark(c, t, push);
    // a barra chega grande e pousa no lugar exato da barra da logo; fica nítida enquanto as letras resolvem
    const sp = E.inExpo(prog(t, m0 - 0.16, m0));
    const fade = 1 - prog(t, m0 + 0.5, m0 + 0.7);
    if (sp > 0 && fade > 0) {
      const sc = lerp(26, 1, sp) * push;
      poly(c, LG.slash.map(([x, y]) => [LG.cx + (LG.scx - LG.cx) * push + (x - LG.scx) * sc, LG.cy + (LG.scy - LG.cy) * push + (y - LG.scy) * sc]));
      c.fillStyle = rgba(C.accent, fade * clamp(sp * 2)); c.fill();
    }
    // onda de choque
    const sw = prog(t, m0, m0 + 0.7);
    if (sw > 0 && sw < 1) { poly(c, slashPts(LG.scx, LG.scy, lerp(LG.sh, 3600, E.outCubic(sw)))); c.strokeStyle = rgba(C.accentLo, 0.9 * (1 - sw)); c.lineWidth = 8 * (1 - sw) + 2; c.stroke(); }
    // apoio + endereço numa pílula lima
    cascade(c, 'SOLUÇÕES DIGITAIS PARA EMPRESAS', W / 2, LG.bot + 140, { fam: TEXT, size: 28, weight: 600, color: '#4A4D48', ls: 7, align: 'center' }, t, m0 + 0.75, 0.018, 0.4);
    const usz = 50, uw = measure('fazlodigital.com.br', DISPLAY, usz, 600, 0), uy = LG.bot + 320;
    const pw = uw + 100, ph = usz * 1.9, px = W / 2 - pw / 2, py = uy - usz * 1.27;
    const pf = E.outExpo(prog(t, URL_T - 0.1, URL_T + 0.35));
    if (pf > 0) {
      c.save(); c.beginPath(); c.rect(px - 10, 0, (pw + 20) * pf, H); c.clip();
      U.rr(c, px, py, pw, ph, ph / 2); c.fillStyle = C.accent; c.fill();
      c.restore();
    }
    if (t >= URL_T) {
      const s = 'fazlodigital.com.br';
      const { xs } = charXs(s, { fam: DISPLAY, size: usz, weight: 600, align: 'center' }, W / 2);
      [...s].forEach((ch, i) => {
        const t0 = URL_T + 0.1 + i * 0.03, p = E.outBack(prog(t, t0, t0 + 0.3), 2), a = prog(t, t0, t0 + 0.1);
        if (a > 0) text(c, ch, xs[i], uy + (1 - p) * 30, { fam: DISPLAY, size: usz, weight: 600, color: INK, alpha: a });
      });
      const pulse = t > URL_T + 1 ? kick(t, Math.floor((t - URL_T) / (2 * BT)) * 2 * BT + URL_T, 0.35) : 0;
      if (pulse > 0.02) { U.rr(c, px - 6 * pulse, py - 6 * pulse, pw + 12 * pulse, ph + 12 * pulse, ph / 2 + 6 * pulse); c.strokeStyle = rgba(C.accentLo, 0.6 * pulse); c.lineWidth = 3; c.stroke(); }
    }
  }

  // ================================================================ VIRADA: a barra se abre e traz a alta definição
  function lightWorld(c, t) {
    stageLight(c, t);
    if (t < T.forte) sceneIsso(c, t);
    if (t >= T.forte - 0.25 && t < T.prof) sceneForte(c, t);
    if (t >= T.prof - 0.25 && t < T.conf) sceneProf(c, t);
    if (t >= T.conf - 0.3 && t < T.marc) sceneConf(c, t);
    if (t >= T.marc - 0.25 && t < T.altura) sceneMarc(c, t);
    if (t >= T.altura - 0.12 && t < T.marca) sceneAltura(c, t);
    if (t >= T.marca - 0.2) sceneMarca(c, t);
  }
  const DEBRIS = [];
  function buildDebris() {
    const r = U.rng(11);
    for (let i = 0; i < 220; i++) DEBRIS.push({ y: r() * (H + 400) - 200, side: r() < 0.5 ? -1 : 1, v: 300 + r() * 1100, rot: (r() - 0.5) * 8, s: 8 + r() * 16, c: r(), tc: SWEEP[0] + r() * (SWEEP[1] - SWEEP[0]) * 0.9 });
  }
  function sweepHalf(t) { return lerp(SW * 300 / 2, 3200, E.outCubic(prog(t, SWEEP[0], SWEEP[1]))); }
  function virada(ctx, t) {
    const a = sweepHalf(t), uc = uOf(W / 2, 1220);
    ctx.save(); band(ctx, uc + a, 9000); ctx.clip(); act1Dark(ctx, t); ctx.restore();
    ctx.save(); band(ctx, -9000, uc - a); ctx.clip(); act1Dark(ctx, t); ctx.restore();
    ctx.save(); band(ctx, uc - a, uc + a); ctx.clip(); lightWorld(ctx, t); ctx.restore();
    // as bordas da abertura
    for (const u of [uc - a, uc + a]) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(C.accent, 0.35); ctx.lineWidth = 40;
      ctx.beginPath(); ctx.moveTo(u + SK * 300, -300); ctx.lineTo(u - SK * (H + 300), H + 300); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(u + SK * 300, -300); ctx.lineTo(u - SK * (H + 300), H + 300); ctx.stroke();
    }
    debris(ctx, t, uc);
    flash(ctx, 0.6 * kick(t, T.virada, 0.16));
  }
  // os pixels do digital se soltam na borda e viram peças nítidas
  function debris(c, t, uc) {
    for (const d of DEBRIS) {
      const s = t - d.tc;
      if (s < 0 || s > 0.9) continue;
      const u0 = uc + d.side * sweepHalf(d.tc);
      const x0 = u0 - SK * d.y, y0 = d.y;
      const dist = d.v * s * Math.exp(-s * 1.2);
      const x = x0 + d.side * NRM.x * dist, y = y0 + d.side * NRM.y * dist + 300 * s * s;
      const sz = lerp(d.s, 4, prog(s, 0, 0.9));
      c.save(); c.translate(x, y); c.rotate(d.rot * s);
      c.globalAlpha = 1 - s / 0.9;
      c.fillStyle = s < 0.15 ? '#6B7060' : d.c < 0.45 ? C.accent : d.c < 0.8 ? INK : '#FFFFFF';
      c.fillRect(-sz / 2, -sz / 2, sz, sz);
      c.restore();
    }
  }
  // ato 1 quando já está todo no digital (fundo escuro em baixa resolução + textos nítidos)
  function act1Dark(ctx, t) {
    renderLofi(ctx, t, scene1);
    overlay1(ctx, t);
  }

  // ================================================================ montagem
  const SHAKE = [[0.5, 16, 0.3], [T.split, 10, 0.25], [T.virada, 26, 0.45], [T.forte, 34, 0.45], [T.prof, 8, 0.25], [T.conf, 8, 0.2], [T.conf + 9 * S16, 10, 0.3], [T.marc, 24, 0.4], [T.marca, 18, 0.4]];
  function shakeAt(t) {
    let x = 0, y = 0;
    for (const [t0, amp, dur] of SHAKE) {
      if (t < t0 || t > t0 + dur * 1.5) continue;
      const k = kick(t, t0, dur) * amp;
      x += noise1((t - t0) * 40, 11) * k; y += noise1((t - t0) * 40, 23) * k;
    }
    return { x, y };
  }
  function frame(ctx, t) {
    if (t < SWEEP[0]) act1(ctx, t);
    else if (t < SWEEP[1]) virada(ctx, t);
    else lightWorld(ctx, t);
    const sh = shakeAt(t);
    if (Math.abs(sh.x) + Math.abs(sh.y) > 0.3) {
      const m = 40;
      ctx.save(); ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(ctx.canvas, -m + sh.x, -m * H / W + sh.y, W + 2 * m, H + 2 * m * H / W);
      ctx.restore();
    }
  }

  // ================================================================ capa
  function cover(ctx) {
    const t = 3.2;
    // metade de cima/esquerda: o negócio, nítido, em estúdio claro
    stageLight(ctx, T.virada + 3);
    const S = fit('JÁ É BOM.', DISPLAY, 900, 900, 220, -0.02);
    const draw = (c, lofi) => {
      text(c, 'SEU NEGÓCIO', W / 2, 800, { fam: DISPLAY, size: S_NEG, weight: 900, color: lofi ? C.ink : INK, ls: -S_NEG * 0.02, align: 'center' });
      const m = bomLine(c, 1010, lofi ? '?' : '.', S, lofi ? C.ink : INK, lofi ? C.accent : INK);
      if (!lofi) { c.fillStyle = C.accent; c.fillRect(m.x0 + m.wa, 1010 + S * 0.14, m.wb, S * 0.07); }
    };
    draw(ctx, false);
    text(ctx, 'NA PRÁTICA', TX, 560, { fam: TEXT, size: 36, weight: 700, ls: 9, color: INK });
    // metade de baixo/direita: o digital, em baixa resolução
    const u = UC;
    ctx.save(); band(ctx, u, 9000); ctx.clip();
    renderLofi(ctx, t, (c, tt) => {
      c.fillStyle = '#0B0C0E'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(W / 2, 900, 0, W / 2, 900, 1300); g.addColorStop(0, '#22262B'); g.addColorStop(1, '#060607');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      draw(c, true);
    });
    const w2 = measure('NO DIGITAL', TEXT, 36, 700, 9);
    text(ctx, 'NO DIGITAL', 930 - w2, 1290, { fam: TEXT, size: 36, weight: 700, ls: 9, color: '#A3A996' });
    // logo oficial (versão clara, sobre o lado escuro) + endereço
    const lw = 520, s = lw / 1870;
    ctx.drawImage(LOGO, W / 2 + 60 - 981 * s, 1500 - 289.5 * s, 2000 * s, 621 * s);
    text(ctx, 'fazlodigital.com.br', W / 2 + 60, 1500 + 205 * s + 70, { fam: DISPLAY, size: 34, weight: 600, color: C.ink, align: 'center' });
    ctx.restore();
    bladeLine(ctx, 10, 0, u, { fade: 1 });
  }

  // ================================================================ cues (som)
  function cues(api) {
    const c = api.cue;
    // ATO 1
    c(0, 'hit', { v: 1 });
    c(0.0, 'letters', { n: 10, st: 0.018 });
    c(0.5, 'slam', { v: 1 });
    c(1.0, 'shine', { d: 0.7 });
    c(T.split - 0.07, 'blade', { d: 0.14 });
    c(T.split, 'cut', { v: 1 });
    c(T.split + 0.22, 'q', { v: 1 });
    c(T.split + 0.25, 'label', { n: 10, d: 0.3 }); c(T.split + 0.5, 'label', { n: 10, d: 0.3, lofi: true });
    c(T.shrink, 'spread', { d: 1.35 });
    c(T.shrink + 0.25, 'shrink', { d: 1.45 });
    c(T.shrink + 0.6, 'narr', { n: 22, d: 0.45 }); c(T.shrink + 1.0, 'narr', { n: 15, d: 0.38 });
    c(T.stall, 'line', { n: 5 }); c(T.stall + 1.0, 'line', { n: 7 });
    FREEZE.forEach(([a, b]) => c(a, 'freeze', { d: b - a }));
    c(T.stall + 1.0, 'hope', { d: 1.0 });
    c(T.virada - 0.3, 'suck', { d: 0.3 });
    // VIRADA
    c(T.virada, 'virada', { v: 1 });
    c(T.virada, 'debris', { d: 0.5 });
    // ATRIBUTOS
    for (const [tk, ty] of [[T.forte, 'forte'], [T.prof, 'snap'], [T.conf, 'conf'], [T.marc, 'stamp'], [T.altura, 'cut2'], [T.marca, 'logo']]) c(tk - 0.28, 'whip', { d: 0.18 });
    c(T.forte - 0.22, 'fall', { d: 0.22 }); c(T.forte, 'forte', { v: 1 }); c(T.forte + 0.05, 'kicker', { n: 4, d: 0.12 });
    c(T.prof - 0.2, 'scatter', { d: 0.18 }); c(T.prof, 'snap', { v: 1 }); c(T.prof + 0.05, 'guide', { k: 0 });
    c(T.prof + 0.25, 'ticks', { n: 13, st: 0.03 }); c(T.prof + 0.5, 'nodes', { n: 13, st: 0.02 }); c(T.prof + 0.75, 'ruler', { d: 0.35 }); c(T.prof + 1.0, 'align', { d: 0.6 });
    c(T.conf - 0.28, 'plinth', { d: 0.26 });
    for (let i = 0; i < 10; i++) c(T.conf + i * S16, 'block', { k: i, pan: (i - 4.5) / 6 });
    c(T.conf + 10 * S16, 'lock', { v: 1 });
    c(T.marc - 0.16, 'pre', { d: 0.16 }); c(T.marc, 'stamp', { v: 1 });
    for (let k = 1; k < 4; k++) c(T.marc + k * BT, 'echo', { k });
    // À ALTURA
    c(T.altura - 0.07, 'blade', { d: 0.14, light: true }); c(T.altura, 'cut2', { v: 1 });
    c(T.altura + 0.5, 'match', { v: 1 });
    c(T.altura + 1.0, 'kicker', { n: 16, d: 0.4 }); c(T.altura + 1.0, 'level', { d: 0.4 });
    c(T.altura + 1.25, 'rise', { d: 0.25 }); c(T.altura + 2.0, 'word', { n: 7 });
    // MARCA
    c(T.marca - 0.16, 'pre', { d: 0.16 });
    c(T.marca, 'logo', { v: 1 });
    for (let k = 1; k < 4; k++) c(T.marca + k * S16, 'res', { k });
    c(T.marca + 0.5, 'crisp', { v: 1 });
    c(T.marca + 0.6, 'glint', { d: 0.6 });
    c(T.marca + 0.75, 'kicker', { n: 31, d: 0.55 });
    c(URL_T - 0.1, 'pill', { d: 0.45 });
    c(URL_T + 0.1, 'url', { n: 19, st: 0.03 });
    c(25.0, 'glint', { d: 0.6 });
  }

  // ================================================================ pós: bloom (só no escuro), vinheta e grão
  let BL0, BL1, BL2, GRAIN, VIG;
  function post(ctx, t) {
    if (!BL1) {
      const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      BL0 = mk(270, 480); BL1 = mk(270, 480); BL2 = mk(135, 240); GRAIN = mk(384, 384);
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = U.rng(3);
      for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      VIG = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.35, W / 2, H * 0.5, H * 0.78);
      VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,0.55)');
    }
    const dark = t < T.virada ? 1 : 1 - prog(t, T.virada, T.virada + 0.3);
    if (dark > 0.01) {
      const a0 = BL0.getContext('2d'), a1 = BL1.getContext('2d'), a2 = BL2.getContext('2d');
      a0.globalCompositeOperation = 'copy'; a0.drawImage(ctx.canvas, 0, 0, 270, 480);
      a1.globalCompositeOperation = 'copy'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
      a1.globalCompositeOperation = 'multiply'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
      a2.globalCompositeOperation = 'copy'; a2.filter = 'blur(6px) brightness(1.3)'; a2.drawImage(BL1, 0, 0, 135, 240); a2.filter = 'none';
      ctx.globalCompositeOperation = 'lighten';
      ctx.globalAlpha = 0.4 * dark; ctx.filter = 'brightness(1.1)'; ctx.drawImage(BL1, 0, 0, W, H); ctx.filter = 'none';
      ctx.globalAlpha = 0.58 * dark; ctx.drawImage(BL2, 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = lerp(0.35, 1, dark); ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
    const f = Math.floor(t * 60 + 1e-6);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = lerp(0.07, 0.15, dark);
    const ox = -Math.floor(hash(f, 1) * 384), oy = -Math.floor(hash(f, 2) * 384);
    for (let y = oy; y < H; y += 384) for (let x = ox; x < W; x += 384) ctx.drawImage(GRAIN, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  FZD.define({
    id: 'reel-01',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [4, 1 / 120],
      ranges: [
        [0, 0.8, 8, 1 / 80],
        [T.split - 0.1, T.split + 0.15, 8, 1 / 80],
        [T.virada - 0.15, T.virada + 0.65, 12, 1 / 60],
        ...[T.forte, T.prof, T.conf, T.marc, T.altura, T.marca].map((b) => [b - 0.32, b + 0.3, 12, 1 / 60]),
        [T.conf + 0.3, T.conf + 1.3, 8, 1 / 80],
        [URL_T - 0.1, URL_T + 0.8, 6, 1 / 90],
      ],
    },
    setup(api) {
      B = api.brand; C = B.color; DISPLAY = B.font.display; TEXT = B.font.text;
      LOGO = api.assets.logo; LOGOD = api.assets.logoDark; PAPER = C.paper; INK = C.inkDark;
      S_NEG = fit('SEU NEGÓCIO', DISPLAY, 900, 860, 130, -0.02);
      S_BOM = fit('JÁ É BOM.', DISPLAY, 900, 920, 230, -0.02);
      S_L = fit('PRECISA PARECER', DISPLAY, 800, 860, 96, -0.01);
      Y_L2 = Y_L1 + S_L * 1.18;
      S_ISSO = fit('ISSO.', DISPLAY, 900, 720, 340, -0.02);
      S_F = fit('FORTE.', DISPLAY, 900, 860, 250, -0.02);
      S_P = fit('PROFISSIONAL.', DISPLAY, 900, 960, 220, -0.02);
      S_C = fit('CONFIÁVEL.', DISPLAY, 900, 850, 220, -0.02);
      S_M = fit('MARCANTE.', DISPLAY, 900, 800, 220, -0.02);
      S_BOM2 = fit('JÁ É BOM.', DISPLAY, 900, 860, 200, -0.02);
      S_A = fit('À ALTURA', DISPLAY, 900, 900, 240, -0.02);
      buildBokeh(); buildDebris(); buildLogo();
    },
    frame(ctx, t) { frame(ctx, t); },
    post,
    cover(ctx) { cover(ctx); },
    cues,
  });
})();
