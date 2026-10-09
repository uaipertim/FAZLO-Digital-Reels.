/* =====================================================================
   FAZLO Digital — Reel 003 · "Ideias que ganham forma" — 9:16 (1080x1920, 60 fps)

   CONCEITO: A MATÉRIA DAS IDEIAS
   Uma substância lima, viva, com três estados (src/matter.js):
     LÍQUIDO  a ideia: brilha, ondula, se funde e se divide;
     PROJETO  o desenvolvimento: só as curvas de nível, linhas técnicas;
     SÓLIDO   a forma: relevo com chanfro nítido, reflexo duro.
   O vídeo inteiro é essa matéria mudando de estado, num plano no espaço que
   a câmera vê de cima (chão em perspectiva) ou de frente. Não há cortes.

   112 BPM · 1 compasso = 2,143 s
     c.1  gênese        uma gota cai no plano escuro: respingo, anel, ondas nas
                        curvas de nível; outras gotas caem no ritmo
     c.2  IDEIA         a câmera sobe; a gota escorre para dentro das letras
     c.3  potencial     a palavra estoura em gotas que giram num vórtice
     c.4  projeto       as gotas convergem; o projeto de REAL. se desenha em linhas
     c.5  FORMA         o líquido enche o projeto e solidifica no golpe: REAL.
     c.6  SITES         REAL. vira projeto, as linhas se rearranjam e SITES é
                        construído em 8 camadas (profissionais)
     c.7  EXPERIÊNCIAS  o sólido derrete e flui em onda (digitais)
     c.8  SOLUÇÕES      a forma se parte em módulos que se encaixam um a um
                        (personalizadas)
     c.9  propósito     a matéria vira poça; bem desenvolvidos (linhas),
                        funcionais (sólido), visualmente marcantes (respingo)
     c.10 a barra       as gotas se alinham e viram a barra da logo; as letras
                        condensam em volta dela
     c.11 a marca       um brilho revela a logo oficial; IDEIAS QUE GANHAM FORMA.
     c.12 endereço      fazlodigital.com.br
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, spring, hash, rng, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 112;
  const { BT, S16, bar } = U.tempo(BPM);            // 0,536 s · 0,134 s
  const T = {
    gota: 0, ideia: bar(2), burst: bar(3), conv: bar(4), forma: bar(5),
    sites: bar(6), exp: bar(7), sol: bar(8), prop: bar(9), barra: bar(10), marca: bar(11), url: bar(12),
  };
  const DURATION = +bar(13).toFixed(3);              // 25,714 s
  const DROPS = [bar(1, 1), bar(1, 2), bar(1, 3)];   // gotas que caem no c.1
  const DROP_P = [[-230, -170], [250, -70], [-90, 230]];
  const LAYERS = Array.from({ length: 8 }, (_, k) => bar(6, 1.5) + k * S16);
  const QUAL = [bar(9, 0.5), bar(9, 1.5), bar(9, 2.5)];

  // ---------------------------------------------------------------- marca
  let B, C, DISPLAY, TEXT, LOGO, M;
  const SK = 0.966;
  const WORD_Y = 0;                                  // centro das palavras no plano (tela y = 960 de frente)
  const LOGO_W = 780, LOGO_Y = 80;
  const LG = {};                                      // a barra da logo no plano

  // ---------------------------------------------------------------- utilidades
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, fam, size, weight, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function fit(s, fam, weight, maxW, maxSize, lsK = 0) { let z = maxSize; while (z > 10 && measure(s, fam, z, weight, z * lsK) > maxW) z -= 1; return z; }
  function text(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save(); c.globalAlpha *= clamp(a);
    c.font = fnt(o.fam, o.size, o.weight); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = o.color || '#fff';
    c.fillText(s, x, y); c.restore();
  }
  function charXs(s, o, x) {
    const w = measure(s, o.fam, o.size, o.weight, o.ls || 0);
    let cx = o.align === 'center' ? x - w / 2 : x;
    const xs = [];
    for (const ch of s) { xs.push(cx); cx += measure(ch, o.fam, o.size, o.weight, o.ls || 0); }
    return { xs, w };
  }
  // letras sobem de uma fenda na linha de base; saem para cima depois de t1
  function riseLine(c, s, x, y, o, t, t0, t1 = 1e9, st = 0.018, dur = 0.42) {
    if (t < t0) return;
    if (t > t1 + 0.6) return;
    const { xs } = charXs(s, o, x);
    c.save(); c.beginPath(); c.rect(-W, y - o.size * 1.15, 3 * W, o.size * 1.45); c.clip();
    [...s].forEach((ch, i) => {
      if (ch === ' ') return;
      const p = E.outExpo(prog(t, t0 + i * st, t0 + i * st + dur));
      const q = E.inCubic(prog(t, t1 + i * st * 0.5, t1 + i * st * 0.5 + 0.22));
      if (p > 0 && q < 1) text(c, ch, xs[i], y + (1 - p) * o.size * 1.2 - q * o.size * 1.2, { ...o, align: 'left', color: o.colorAt ? o.colorAt(i) : o.color });
    });
    c.restore();
  }
  function flash(c, a, color = '#FFFFFF') {
    if (a <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = rgba(color, clamp(a)); c.fillRect(0, 0, W, H); c.restore();
  }
  const pulseAt = (t, times, dur = 0.2) => times.reduce((m, t0) => Math.max(m, kick(t, t0, dur)), 0);

  // ---------------------------------------------------------------- palavras (matéria)
  const WORDS = {};
  function addWord(key, s, maxW, maxSize) {
    const size = fit(s, DISPLAY, 900, maxW, maxSize, -0.025);
    const slot = M.addText(key, [s], { font: { fam: DISPLAY, weight: 900 }, size, ls: -size * 0.025, pad: 150 });
    WORDS[key] = { key, size, slot, bevel: size * 0.15, chamfer: Math.max(4, size * 0.036) };
  }
  // ponto (no plano) de uma amostra interna da palavra: x, y, profundidade (raio que cabe no traço)
  const wordPt = (key, i, x = 0, y = WORD_Y) => { const p = WORDS[key].slot.pts[i % WORDS[key].slot.pts.length]; return [x + p[0], y + p[1], Math.min(p[2], WORDS[key].size * 0.14)]; };

  // ---------------------------------------------------------------- gotas
  const NDROP = 30;
  const DR = [];                                      // parâmetros fixos de cada gota
  function buildDrops() {
    const r = rng(31);
    for (let i = 0; i < NDROP; i++) DR.push({ orb: 170 + 430 * r(), sz: 15 + 22 * r(), w: 0.75 + 0.5 * r(), ph: r() * TAU, k: r() });
  }
  // vórtice do c.3–c.4: sai das letras de IDEIA, gira e converge no centro; no golpe, entra nas letras de REAL.
  function vortexDrops(t) {
    const out = [];
    const tb = t - T.burst;
    const phi = 1.5 * tb + 0.42 * tb * tb;           // giro que acelera
    const eOut = E.outExpo(prog(t, T.burst, T.burst + 0.75));
    const conv = E.inCubic(prog(t, T.conv, T.forma - 0.28));
    const shoot = E.inExpo(prog(t, T.forma - 0.24, T.forma));
    const fade = 1 - E.outCubic(prog(t, T.forma + 0.02, T.forma + 0.24));
    if (fade <= 0) return out;
    for (let i = 0; i < NDROP; i++) {
      const d = DR[i];
      const [x0, y0, r0] = wordPt('ideia', i);
      const a0 = Math.atan2(y0 - WORD_Y, x0), rr0 = Math.hypot(x0, y0 - WORD_Y);
      const rad = lerp(rr0, d.orb, eOut) * (1 - conv);
      const a = a0 + phi * d.w * Math.pow(300 / d.orb, 0.7);
      let x = Math.cos(a) * rad, y = WORD_Y + Math.sin(a) * rad;
      let rd = lerp(r0, d.sz, eOut) * lerp(1, 1.5, conv);
      if (shoot > 0) { const [tx, ty, tr] = wordPt('real', i); x = lerp(x, tx, shoot); y = lerp(y, ty, shoot); rd = lerp(rd, tr * 1.1, shoot); }
      out.push([x, y, rd * fade]);
    }
    return out;
  }
  // c.9–c.10: saem de SOLUÇÕES, giram num anel e se alinham no eixo da barra
  function poolDrops(t) {
    const out = [];
    const e = E.outCubic(prog(t, T.prop + 0.1, T.prop + 0.8));
    const al = E.inOutCubic(prog(t, bar(9, 2.9), T.barra + 0.05));
    const absorb = 1 - E.inCubic(prog(t, T.barra + 0.05, T.barra + 0.45));
    if (absorb <= 0) return out;
    const tp = t - T.prop;
    const ax = SK / Math.hypot(SK, 1), ay = -1 / Math.hypot(SK, 1);
    for (let i = 0; i < NDROP; i++) {
      const d = DR[i];
      const [x0, y0, r0] = wordPt('sol', i);
      const a0 = Math.atan2(y0 - WORD_Y, x0);
      const ring = 200 + 110 * d.k;
      const a = a0 + tp * (1.1 + 0.5 * d.w);
      let x = lerp(x0, Math.cos(a) * ring, e), y = lerp(y0, WORD_Y + Math.sin(a) * ring, e);
      const s = (i / (NDROP - 1) - 0.5) * 820;      // posição no eixo da barra
      x = lerp(x, s * ax, al); y = lerp(y, WORD_Y + s * ay, al);
      const rd = lerp(r0, d.sz * 1.35, e) * lerp(1, 1.15, al) * absorb;
      out.push([x, y, rd]);
    }
    return out;
  }

  // ---------------------------------------------------------------- câmera
  function camRaw(t) {
    let pitch = 0, yaw = 0, roll = 0, zoom = 1;
    const px = 0, py = 0;
    if (t < T.ideia) {
      const p = E.inOutSine(prog(t, 0, T.ideia));
      pitch = lerp(-1.1, -0.84, p); zoom = lerp(1.45, 1.0, E.outCubic(prog(t, 0, T.ideia)));
    } else if (t < T.burst) {
      const p = E.outQuart(prog(t, T.ideia, T.ideia + 0.65));
      pitch = lerp(-0.84, -0.1, p); yaw = 0.08 * Math.sin((t - T.ideia) * 1.7) * p;
    } else if (t < T.forma) {
      const p = E.inOutCubic(prog(t, T.burst, T.burst + 0.8)), q = E.inCubic(prog(t, T.conv, T.forma));
      pitch = lerp(lerp(-0.1, -0.98, p), -0.42, q);
      yaw = 0.08 * Math.sin((t - T.ideia) * 1.7) * (1 - p);
      roll = -0.5 * Math.sin(Math.PI * prog(t, T.burst, T.forma));
      zoom = lerp(lerp(1, 0.84, p), 1.08, q);
    } else if (t < T.prop) {
      const sp = spring(t, T.forma, { freq: 2.6, damp: 0.42 });
      const drift = (t - T.forma) / (T.prop - T.forma);
      pitch = lerp(-0.42, -0.07 - 0.05 * Math.sin(drift * Math.PI * 3), clamp(sp, 0, 1.3));
      yaw = 0.1 * Math.sin(drift * Math.PI * 2.0 + 0.3) * clamp(sp, 0, 1);
      roll = 0.03 * Math.sin(drift * Math.PI * 4) * clamp(sp, 0, 1);
      zoom = lerp(1.08, 1.0, clamp(sp, 0, 1.2)) + 0.12 * kick(t, T.forma, 0.35);
      if (t > T.exp && t < T.sol) pitch -= 0.18 * Math.sin(Math.PI * prog(t, T.exp, T.sol));      // a onda do líquido
    } else if (t < T.barra) {
      const f = camRaw(T.prop - 1e-4), p = E.inOutCubic(prog(t, T.prop, T.prop + 0.75));
      pitch = lerp(f.pitch, -0.95, p); yaw = lerp(f.yaw, 0, p); roll = lerp(f.roll, 0, p) - 0.16 * (t - T.prop) * p; zoom = lerp(f.zoom, 0.8, p);
    } else {
      const f = camRaw(T.barra - 1e-4), p = E.inOutCubic(prog(t, T.barra, T.barra + 1.35));
      pitch = lerp(f.pitch, 0, p); roll = lerp(f.roll, 0, p); zoom = lerp(f.zoom, 1.0, p) + 0.03 * E.inOutSine(prog(t, T.marca, DURATION)) + 0.08 * kick(t, T.barra, 0.3);
    }
    return { pitch, yaw, roll, zoom, px, py };
  }
  const SHAKES = [[0, 16, 0.3], [T.burst, 10, 0.25], [T.forma, 22, 0.35], [T.sol, 8, 0.2], [QUAL[2], 8, 0.2], [T.barra, 10, 0.25], [T.marca, 8, 0.2]];
  function shakeAt(t) {
    let x = 0, y = 0;
    for (const [t0, amp, dur] of SHAKES) {
      if (t < t0 || t > t0 + dur * 1.5) continue;
      const k = kick(t, t0, dur) * amp;
      x += U.noise1((t - t0) * 40, 11) * k; y += U.noise1((t - t0) * 40, 23) * k;
    }
    return { x, y };
  }

  // ---------------------------------------------------------------- estado da matéria em t
  function sweepAt(t, t0, dur = 0.5, dir = [1, 0.45], a = 1.1) {
    if (t < t0 || t > t0 + dur) return null;
    return [dir[0], dir[1], lerp(-760, 760, E.inOutSine(prog(t, t0, t0 + dur))), a];
  }
  const revealPos = (t) => lerp(-760, 760, E.inOutSine(prog(t, T.marca, T.marca + 0.5)));
  function matterAt(t) {
    const c = camRaw(t);
    const sh = shakeAt(t);
    const st = {
      cam: M.camera({ pitch: c.pitch, yaw: c.yaw, roll: c.roll, zoom: c.zoom, pan: [c.px - sh.x / c.zoom, c.py - sh.y / c.zoom], time: t }),
      noise: [7, 0.0016, 0.7], blobK: 46, wordBlobK: 60,
      mat: { gloss: 1, bevel: 38, chamfer: 9, exposure: 1 },
      proj: { lines: 0, spacing: 20, fill: 1, outside: 0.8 },
      glow: { halo: 0.75, inner: 0.5, contact: 0.5 },
    };
    const W_ = (key, x = 0, y = WORD_Y) => ({ key, x, y, s: 1 });

    if (t < T.ideia) {                                                         // c.1 gênese
      const landed = DROPS.reduce((n, td) => n + E.outCubic(prog(t, td + 0.12, td + 0.4)), 0);
      const rMain = (t < 0.14 ? lerp(46, 66, E.outBack(t / 0.14)) : 66) + 9 * landed + 5 * pulseAt(t, [0, ...DROPS], 0.18);
      const bl = [[0, 0, rMain]];
      const r = rng(9);
      for (let i = 0; i < 9; i++) {                                           // respingo inicial
        const a = i * TAU / 9 + r() * 0.5, e = E.outCubic(prog(t, 0, 0.8)), d0 = 260 + 220 * r(), rr = (1 - prog(t, 0.05, 0.85)) * (10 + 9 * r());
        if (rr > 0.5) bl.push([Math.cos(a) * (80 + d0 * e), Math.sin(a) * (80 + d0 * e), rr]);
      }
      DROPS.forEach((td, k) => {                                              // gotas que caem no ritmo e escorrem para o centro
        if (t < td - 0.1) return;
        const g = E.outBack(prog(t, td - 0.1, td + 0.02)), m = E.inOutCubic(prog(t, td + 0.08, td + 0.42));
        const [x, y] = DROP_P[k];
        bl.push([x * (1 - m), y * (1 - m), 30 * g * (1 - 0.6 * m)]);
      });
      st.blobs = bl;
      const lastDrop = DROPS.filter((td) => t >= td).pop();
      if (t < 0.55) st.ring = [0, 0, 70 + 560 * E.outCubic(t / 0.55), lerp(13, 1, t / 0.55)];
      else if (lastDrop !== undefined && t < lastDrop + 0.45) { const k = DROPS.indexOf(lastDrop), e = prog(t, lastDrop, lastDrop + 0.45); st.ring = [DROP_P[k][0] * 0.85, DROP_P[k][1] * 0.85, 30 + 200 * E.outCubic(e), lerp(6, 0.5, e)]; }
      const w0 = lastDrop ?? 0;
      st.wave = [40 + 820 * (t - w0), 40 + 820 * (t - w0) - 260, 26, 1.4 * Math.exp(-(t - w0) * 1.6)];
      st.proj = { lines: 0, spacing: 24, fill: 1, outside: 1.0 };
      st.noise = [6, 0.0018, 0.8];
    } else if (t < T.burst) {                                                  // c.2 IDEIA
      const m = E.inOutCubic(prog(t, T.ideia - 0.04, T.ideia + 0.5));
      st.wordA = W_('ideia'); st.wordOn = m;
      st.blobs = [[0, WORD_Y * m, 92 * (1 - E.inCubic(prog(t, T.ideia + 0.05, T.ideia + 0.5)))]];
      st.noise = [lerp(14, 8, prog(t, T.ideia + 0.3, T.ideia + 1.1)), 0.0016, 0.75];
      st.mat.bevel = WORDS.ideia.bevel;
      st.sweep = sweepAt(t, bar(2, 2), 0.55);
      st.proj = { lines: 0, spacing: 20, fill: 1, outside: lerp(1.0, 0.6, m) };
      st.wave = [500 * (t - T.ideia), 500 * (t - T.ideia) - 220, 24, 1.0 * Math.exp(-(t - T.ideia) * 1.5)];
    } else if (t < T.forma) {                                                  // c.3–c.4 potencial e projeto
      const early = t < T.burst + 0.2;
      st.wordA = W_(early ? 'ideia' : 'real');
      st.wordOn = early ? 1 - E.outCubic(prog(t, T.burst, T.burst + 0.12)) : E.outCubic(prog(t, T.conv + 0.3, T.conv + 1.15));   // o projeto cresce do esqueleto das letras
      st.blobs = vortexDrops(t);
      st.blobK = 42; st.wordBlobK = early ? 40 : 6;
      const lines = early ? 0 : E.outCubic(prog(t, T.conv + 0.35, T.conv + 1.2));
      st.proj = { lines, spacing: 18, fill: early ? 1 : 0, outside: 0.5 + 0.6 * lines };
      st.noise = [lerp(6, 13, prog(t, T.conv, T.forma)), 0.0022, 1.0];
      st.mat.bevel = 30;
      const tb = t - T.burst;
      st.wave = [60 + 900 * tb, 60 + 900 * tb - 300, 30, 1.3 * Math.exp(-tb * 1.4)];
      if (t > T.conv + 0.35) { const tl = (t - T.conv - 0.35) % (2 * BT); st.wave = [700 * tl, -1e4, 22, 0.7 * lines * Math.exp(-tl * 2)]; }
    } else if (t < T.sites) {                                                  // c.5 FORMA: REAL.
      st.wordA = W_('real');
      const pos = lerp(-560, 620, E.outCubic(prog(t, T.forma - 0.03, T.forma + 0.17)));
      st.build = [1, 0, pos, 1]; st.front = [1, 0, pos - 30, 40];
      st.wordSolid = prog(t, T.forma + 0.17, T.forma + 0.2);
      st.blobs = vortexDrops(t); st.wordBlobK = 10;
      st.proj = { lines: 1 - prog(t, T.forma, T.forma + 0.3), spacing: 18, fill: 0, outside: 1.0 };
      st.noise = [12, 0.0022, 1.0];
      st.mat.chamfer = WORDS.real.chamfer;
      const tf = t - T.forma;
      st.wave = [40 + 1100 * tf, 40 + 1100 * tf - 320, 34, 2.0 * Math.exp(-tf * 1.4)];
      st.sweep = sweepAt(t, bar(5, 2), 0.5);
      st.glow = { halo: 0.75 * (1 - prog(t, T.forma, T.forma + 0.2)), inner: 0.5, contact: 0.65 };
    } else if (t < T.exp) {                                                    // c.6 SITES: projeto -> camadas
      const m = E.inOutCubic(prog(t, T.sites + 0.15, T.sites + 0.62));
      st.wordA = W_('real'); st.wordB = W_('sites'); st.morph = m;
      st.wordSolid = 1; st.blobs = [];
      const hh = 125;
      const un = E.inCubic(prog(t, T.sites - 0.02, T.sites + 0.16));
      let pos = lerp(hh - 40, -hh, un);
      const step = LAYERS.reduce((n, tl) => n + E.outCubic(prog(t, tl, tl + 0.07)), 0);
      if (t >= LAYERS[0]) pos = lerp(-hh, hh - 40, step / LAYERS.length);
      st.build = [0, -1, pos, 1];
      const built = prog(t, LAYERS[7], LAYERS[7] + 0.3);
      st.proj = { lines: 1 - 0.85 * built, spacing: 16, fill: 0, outside: 0.75 };
      st.mat.chamfer = lerp(WORDS.real.chamfer, WORDS.sites.chamfer, m);
      st.glow = { halo: 0, inner: 0.5, contact: 0.6 };
      st.sweep = sweepAt(t, bar(6, 3.4), 0.45);
      const tl = (t - LAYERS[0]);
      if (tl > 0) st.wave = [600 * (tl % S16), -1e4, 16, 0.5 * (1 - built)];
    } else if (t < T.sol) {                                                    // c.7 EXPERIÊNCIAS: o sólido derrete e flui
      const m = E.inOutCubic(prog(t, T.exp + 0.02, T.exp + 0.6));
      st.wordA = W_('sites'); st.wordB = W_('exp'); st.morph = m;
      const shat = E.inCubic(prog(t, bar(7, 3.55), T.sol));                 // fim do compasso: congela e se parte
      st.wordSolid = Math.max(1 - E.outCubic(prog(t, T.exp - 0.04, T.exp + 0.28)), E.outCubic(prog(t, bar(7, 3.4), bar(7, 3.62))));
      st.blobs = [];
      st.noise = [lerp(14, 5, prog(t, T.exp + 0.2, T.exp + 0.9)), 0.0022, 0.9];
      st.mat.bevel = lerp(WORDS.sites.bevel, WORDS.exp.bevel * 1.25, m); st.mat.chamfer = WORDS.exp.chamfer;
      st.proj = { lines: 0, spacing: 14, fill: 1, outside: 0.6 };
      st.glow = { halo: 0.6, inner: 0.55, contact: 0.45 };
      st.sweep = sweepAt(t, bar(7, 1.5), 0.6, [1, 0.2], 1.2) || sweepAt(t, bar(7, 2.5), 0.6, [1, -0.3], 1.2);
      const tw = (t - T.exp) % (2 * BT);
      st.wave = [520 * tw, 520 * tw - 180, 20, 0.9 * Math.exp(-tw * 2.2)];
      if (shat > 0) { st.cells = shat; st.cellOff = [26, 170]; st.cellT = 1 - shat; }
    } else if (t < T.prop) {                                                   // c.8 SOLUÇÕES: módulos que se encaixam
      const m = E.inOutCubic(prog(t, T.sol - 0.02, T.sol + 0.1));
      st.wordA = W_('exp'); st.wordB = W_('sol'); st.morph = m;
      st.wordSolid = 1; st.blobs = [];
      const cellT = E.outCubic(prog(t, T.sol + 0.04, bar(8, 2.6)));
      const close = E.inOutCubic(prog(t, bar(8, 2.65), bar(8, 3.0)));
      st.cells = 1 - close; st.cellOff = [26, 170]; st.cellT = cellT;
      st.mat.chamfer = WORDS.sol.chamfer;
      st.proj = { lines: 0, spacing: 16, fill: 1, outside: 0.7 };
      st.glow = { halo: 0, inner: 0.5, contact: 0.6 };
      st.sweep = sweepAt(t, bar(8, 3.05), 0.45);
      const tl = t - bar(8, 3.0);
      if (tl > 0) st.wave = [40 + 900 * tl, 40 + 900 * tl - 260, 26, 1.2 * Math.exp(-tl * 1.8)];
    } else if (t < T.barra) {                                                  // c.9 propósito
      st.wordA = W_('sol');
      st.wordSolid = 1 - E.outCubic(prog(t, T.prop - 0.02, T.prop + 0.2));
      st.wordOn = 1 - E.inOutCubic(prog(t, T.prop + 0.08, T.prop + 0.45));
      st.blobs = poolDrops(t); st.blobK = 44; st.wordBlobK = 50;
      st.noise = [8, 0.002, 0.9];
      st.mat.bevel = 26;
      const q1 = kick(t, QUAL[0], 0.5), q2 = kick(t, QUAL[1], 0.4), q3 = kick(t, QUAL[2], 0.45);
      st.proj = { lines: 0, spacing: 22, fill: 1, outside: 0.8 + 1.6 * q1 };
      st.solid = q2 > 0.05 ? Math.min(1, q2 * 1.4) : 0;
      st.glow = { halo: 0.7 + 1.2 * q3, inner: 0.5 + 0.4 * q3, contact: 0.45 };
      if (t > QUAL[2] && t < QUAL[2] + 0.5) { const e = prog(t, QUAL[2], QUAL[2] + 0.5); st.ring = [0, WORD_Y, 120 + 520 * E.outCubic(e), lerp(10, 0.5, e)]; }
      const tw = t - QUAL[0];
      st.wave = [tw > 0 ? 900 * tw : -1e4, t > QUAL[2] ? 900 * (t - QUAL[2]) : -1e4, 28, tw > 0 ? 1.2 : 0];
    } else {                                                                    // c.10–c.12 a barra e a marca
      const g = E.outExpo(prog(t, T.barra, T.barra + 0.16));                 // a barra se materializa de uma vez no golpe
      const sz = E.inOutCubic(prog(t, T.barra + 0.4, bar(10, 2.6)));
      st.slash = { x: lerp(0, LG.cx, sz), y: lerp(WORD_Y, LG.cy, sz), h: lerp(900, LG.h, sz), wr: LG.wr, on: g, k: 36 };
      st.blobs = poolDrops(t); st.blobK = 44; st.wordBlobK = 40;
      const ax = SK / Math.hypot(SK, 1), ay = -1 / Math.hypot(SK, 1);
      const fp = lerp(-700, 700, E.inOutCubic(prog(t, bar(10, 1), bar(10, 1.7))));
      st.front = [ax, ay, fp, 60];
      st.wordA = W_('logo', 0, LOGO_Y);
      st.wordOn = E.outCubic(prog(t, bar(10, 1.9), bar(10, 3.2))); st.erode = 70;     // as letras crescem do esqueleto em volta da barra
      st.wordSolid = E.inOutCubic(prog(t, bar(10, 2.9), bar(10, 3.7)));
      st.noise = [lerp(14, 4, prog(t, bar(10, 1.9), bar(10, 3.4))), 0.0022, 1.0];
      st.mat.bevel = 26; st.mat.chamfer = 4.5;
      st.proj = { lines: 0, spacing: 18, fill: 1, outside: 0.8 };
      st.glow = { halo: 0.5 * (1 - prog(t, bar(10, 2), bar(10, 3))), inner: 0.5, contact: 0.5 };
      st.sweep = sweepAt(t, bar(10, 1.2), 0.5, [ax, ay], 0.6);
      // revelação da logo oficial: atrás do brilho, a matéria some e fica só a aura de curvas de nível
      if (t >= T.marca) {
        const rp = revealPos(t);
        st.build = [-1, -0.45, -rp, 1]; st.proj = { lines: 0, spacing: 18, fill: 0, outside: 0.85 };
        st.sweep = sweepAt(t, T.marca, 0.5, [1, 0.45], 1.4);
        st.glow = { halo: 0, inner: 0.5, contact: 0.5 * (1 - prog(t, T.marca, T.marca + 0.5)) };
        const tw = (t - T.marca) % (2 * BT);
        st.wave = [30 + 520 * tw, 30 + 520 * tw - 200, 22, 1.0 * Math.exp(-tw * 1.8)];
      }
    }
    return st;
  }

  // ---------------------------------------------------------------- textos de apoio (tela)
  let S_ST, S_LBL, S_SUB, S_Q, S_TIT, S_URL;
  function statements(c, t) {
    const o = { fam: TEXT, size: S_ST, weight: 700, color: '#FFFFFF', ls: -0.5, align: 'center' };
    const L1 = 640, L2 = 640 + S_ST * 1.22;
    riseLine(c, 'TODA SOLUÇÃO DIGITAL', W / 2, L1, o, t, 0.3, T.burst - 0.32);
    riseLine(c, 'COMEÇA COM UMA', W / 2, L2, o, t, 1.15, T.burst - 0.28);
    riseLine(c, 'MAS UMA IDEIA SÓ REVELA', W / 2, L1, o, t, T.burst + 0.12, T.conv - 0.3);
    riseLine(c, 'SEU POTENCIAL', W / 2, L2, { ...o, color: C.accent }, t, T.burst + 0.6, T.conv - 0.26);
    riseLine(c, 'QUANDO SE TRANSFORMA', W / 2, L1, o, t, T.conv + 0.05, T.sites - 0.3);
    riseLine(c, 'EM ALGO', W / 2, L2, o, t, T.conv + 0.55, T.sites - 0.26);
    // c.6–c.8: rótulo e complementos
    riseLine(c, 'A FAZLO DIGITAL DESENVOLVE', W / 2, 700, { fam: TEXT, size: S_LBL, weight: 600, color: '#C9CCD2', ls: 6, align: 'center' }, t, T.sites + 0.05, T.prop - 0.3, 0.012);
    const sub = { fam: TEXT, size: S_SUB, weight: 700, color: C.accent, ls: 9, align: 'center' };
    riseLine(c, 'PROFISSIONAIS', W / 2, 1180, sub, t, bar(6, 3.05), T.exp - 0.22, 0.014);
    riseLine(c, 'DIGITAIS', W / 2, 1180, sub, t, bar(7, 2.0), T.sol - 0.3, 0.02);
    riseLine(c, 'PERSONALIZADAS', W / 2, 1180, sub, t, bar(8, 3.05), T.prop - 0.2, 0.014);
    // c.9: as três qualidades, cada uma no seu tempo
    const q = { fam: DISPLAY, size: S_Q, weight: 800, color: '#FFFFFF', ls: -S_Q * 0.02, align: 'center' };
    riseLine(c, 'BEM DESENVOLVIDOS.', W / 2, 560, q, t, QUAL[0] - 0.05, T.barra - 0.25, 0.012, 0.35);
    riseLine(c, 'FUNCIONAIS.', W / 2, 560 + S_Q * 1.3, q, t, QUAL[1] - 0.05, T.barra - 0.22, 0.014, 0.35);
    riseLine(c, 'VISUALMENTE MARCANTES.', W / 2, 560 + S_Q * 2.6, { ...q, color: C.accent }, t, QUAL[2] - 0.05, T.barra - 0.18, 0.01, 0.35);
  }

  // ---------------------------------------------------------------- logo oficial, título e endereço
  // logo em coordenadas de tela (câmera de frente nesta parte: pitch/yaw/roll = 0)
  function logoRect(t) {
    const c = camRaw(t), sh = shakeAt(t);
    const z = c.zoom, cx = W / 2 + (0 - c.px) * z + sh.x, cy = H / 2 + (LOGO_Y - c.py) * z + sh.y;
    const w = LOGO_W * z, h = w * LOGO.naturalHeight / LOGO.naturalWidth;
    return { x: cx - w / 2, y: cy - h / 2, w, h, z, cx, cy, ox: W / 2 - c.px * z + sh.x, oy: H / 2 - c.py * z + sh.y };
  }
  function brand(c, t) {
    if (t < T.marca) return;
    const r = logoRect(t);
    // a logo oficial aparece atrás do brilho (meio-plano que avança na diagonal)
    const rp = revealPos(t) * r.z, dx = 1 / Math.hypot(1, 0.45), dy = 0.45 / Math.hypot(1, 0.45);
    c.save();
    if (revealPos(t) < 759) {
      const ox = r.ox + dx * rp, oy = r.oy + dy * rp;            // linha do brilho; região revelada: dot(p - o, dir) < 0
      c.beginPath();
      c.moveTo(ox + dy * 3000, oy - dx * 3000);
      c.lineTo(ox - dy * 3000, oy + dx * 3000);
      c.lineTo(ox - dy * 3000 - dx * 3000, oy + dx * 3000 - dy * 3000);
      c.lineTo(ox + dy * 3000 - dx * 3000, oy - dx * 3000 - dy * 3000);
      c.closePath(); c.clip();
    }
    c.drawImage(LOGO, r.x, r.y, r.w, r.h);
    c.restore();
    // título
    const o = { fam: DISPLAY, size: S_TIT, weight: 900, color: '#FFFFFF', ls: -S_TIT * 0.025, align: 'center' };
    const ty = r.y - 120 * r.z;
    riseLine(c, 'IDEIAS QUE', W / 2, ty - S_TIT * 1.08, o, t, bar(11, 1.0), 1e9, 0.02, 0.5);
    riseLine(c, 'GANHAM FORMA.', W / 2, ty, { ...o, colorAt: (i) => (i >= 7 ? C.accent : '#FFFFFF') }, t, bar(11, 1.5), 1e9, 0.02, 0.5);
    // endereço: pílula com contorno lima
    const pf = E.outExpo(prog(t, T.url, T.url + 0.5));
    if (pf <= 0) return;
    const uw = measure('fazlodigital.com.br', DISPLAY, S_URL, 600, 0), uy = r.y + r.h + 150 * r.z;
    const pw = (uw + 120) * pf, ph = S_URL * 2.0, px = W / 2 - pw / 2, py = uy - S_URL * 1.32;
    c.save();
    U.rr(c, px, py, pw, ph, ph / 2); c.fillStyle = 'rgba(10,11,13,0.85)'; c.fill();
    c.lineWidth = 3; c.strokeStyle = rgba(C.accent, 0.95 * pf); c.stroke();
    c.restore();
    const { xs } = charXs('fazlodigital.com.br', { fam: DISPLAY, size: S_URL, weight: 600, align: 'center' }, W / 2);
    [...'fazlodigital.com.br'].forEach((ch, i) => {
      const t0 = T.url + 0.12 + i * 0.022, a = prog(t, t0, t0 + 0.1), p = E.outBack(prog(t, t0, t0 + 0.3), 2);
      if (a > 0) text(c, ch, xs[i], uy + (1 - p) * 22, { fam: DISPLAY, size: S_URL, weight: 600, color: i >= 12 ? '#9EA3AB' : '#FFFFFF', alpha: a });
    });
  }

  // ---------------------------------------------------------------- pós: bloom (preserva o matiz), vinheta, grão
  let BL0, BL1, BL2, GRAIN, VIG;
  function post(ctx, t) {
    if (!BL1) {
      const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
      BL0 = mk(270, 480); BL1 = mk(270, 480); BL2 = mk(135, 240); GRAIN = mk(384, 384);
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = rng(3);
      for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      g.putImageData(id, 0, 0);
      VIG = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.32, W / 2, H * 0.5, H * 0.8);
      VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(1, 'rgba(0,0,0,0.55)');
    }
    const a0 = BL0.getContext('2d'), a1 = BL1.getContext('2d'), a2 = BL2.getContext('2d');
    a0.globalCompositeOperation = 'copy'; a0.drawImage(ctx.canvas, 0, 0, 270, 480);
    a1.globalCompositeOperation = 'copy'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
    a1.globalCompositeOperation = 'multiply'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
    a2.globalCompositeOperation = 'copy'; a2.filter = 'blur(7px) brightness(1.25)'; a2.drawImage(BL1, 0, 0, 135, 240); a2.filter = 'none';
    ctx.globalCompositeOperation = 'lighten';
    ctx.globalAlpha = 0.35; ctx.drawImage(BL1, 0, 0, W, H);
    ctx.globalAlpha = 0.5; ctx.drawImage(BL2, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.85; ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
    const f = Math.floor(t * 60 + 1e-6);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.09;
    const ox = -Math.floor(hash(f, 1) * 384), oy = -Math.floor(hash(f, 2) * 384);
    for (let y = oy; y < H; y += 384) for (let x = ox; x < W; x += 384) ctx.drawImage(GRAIN, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- quadro
  function frame(ctx, t) {
    const st = matterAt(t);
    ctx.drawImage(M.render(st), 0, 0);
    const sh = shakeAt(t);
    ctx.save(); ctx.translate(sh.x * 0.6, sh.y * 0.6);
    statements(ctx, t);
    ctx.restore();
    brand(ctx, t);
    flash(ctx, 0.2 * kick(t, T.forma, 0.1));
    flash(ctx, 0.25 * kick(t, T.burst, 0.14));
    flash(ctx, 0.08 * kick(t, T.marca, 0.12));
    flash(ctx, 0.14 * kick(t, T.barra, 0.12));
  }

  FZD.define({
    id: 'reel-03',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [2, 1 / 120],
      ranges: [
        [0, 0.6, 4, 1 / 90], [T.ideia - 0.05, T.ideia + 0.6, 3, 1 / 100], [T.burst - 0.05, T.burst + 0.8, 4, 1 / 90],
        [T.forma - 0.3, T.forma + 0.45, 4, 1 / 90], [T.sites, T.sites + 0.7, 3, 1 / 100], [bar(7, 3.4), T.sol + 0.5, 4, 1 / 90],
        [T.prop, T.prop + 0.8, 3, 1 / 100], [T.barra - 0.1, T.barra + 1.4, 3, 1 / 100], [T.marca - 0.05, T.marca + 0.55, 3, 1 / 100],
      ],
    },

    setup(api) {
      B = api.brand; C = B.color; DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      LOGO = api.assets.logo;
      M = FZD_MATTER.create(W, H, { seed: 3 });
      addWord('ideia', 'IDEIA', 860, 300);
      addWord('real', 'REAL.', 860, 300);
      addWord('sites', 'SITES', 800, 300);
      addWord('exp', 'EXPERIÊNCIAS', 930, 200);
      addWord('sol', 'SOLUÇÕES', 880, 260);
      addWord('ideias', 'IDEIAS', 900, 300);
      addWord('forma', 'FORMA.', 900, 300);
      M.addImage('logo', LOGO, { width: LOGO_W, pad: 150 });
      WORDS.logo = { key: 'logo', size: 120, slot: M.slots.logo };
      // a barra da logo no plano (medida no arquivo oficial; brand/tokens.js)
      const sl = B.slash, s = LOGO_W / sl.imgW;
      LG.cx = (((sl.tl + sl.tr + sl.bl + sl.br) / 4) - sl.imgW / 2) * s;
      LG.cy = LOGO_Y + (((sl.top + sl.bottom) / 2) - sl.imgH / 2) * s;
      LG.h = (sl.bottom - sl.top) * s; LG.wr = (sl.tr - sl.tl) / (sl.bottom - sl.top);
      buildDrops();
      S_ST = fit('MAS UMA IDEIA SÓ REVELA', TEXT, 700, 860, 60, -0.01);
      S_LBL = 34; S_SUB = fit('PERSONALIZADAS', TEXT, 700, 700, 50, 0.18);
      S_Q = fit('VISUALMENTE MARCANTES.', DISPLAY, 800, 880, 64, -0.02);
      S_TIT = fit('GANHAM FORMA.', DISPLAY, 900, 860, 110, -0.025);
      S_URL = 46;
    },

    frame,
    post,

    cover(ctx, api) {
      // capa: IDEIAS (líquido, em cima) -> FORMA. (sólido, embaixo), as duas no mesmo campo
      const st = {
        cam: M.camera({ pitch: -0.12, yaw: 0.06, zoom: 1, time: 3.1 }),
        wordA: { key: 'ideias', x: 0, y: -330, s: 1 }, wordB: { key: 'forma', x: 0, y: 170, s: 1 }, union: true,
        front: [0, -1, 80, 40], noise: [8, 0.0016, 0.7], blobs: [[-260, -120, 22], [150, -90, 16], [330, -150, 12], [-20, -100, 10]], blobK: 50, wordBlobK: 50,
        mat: { gloss: 1, bevel: WORDS.ideias.bevel, chamfer: WORDS.forma.chamfer, exposure: 1 },
        proj: { lines: 0, spacing: 20, fill: 1, outside: 0.9 }, glow: { halo: 0.7, inner: 0.5, contact: 0.55 },
        wave: [180, 420, 26, 0.8],
      };
      ctx.drawImage(M.render(st), 0, 0);
      const q = { fam: TEXT, size: 52, weight: 700, color: '#FFFFFF', ls: 10, align: 'center' };
      text(ctx, 'QUE GANHAM', W / 2, 960 - 60 + 24, q);
      const lw = 520, lh = lw * LOGO.naturalHeight / LOGO.naturalWidth;
      ctx.drawImage(LOGO, W / 2 - lw / 2, 1440, lw, lh);
      post(ctx, 4.0);
    },

    cues(api) {
      const cue = api.cue;
      cue(0, 'hit');
      DROPS.forEach((t, k) => cue(t, 'drop', { k }));
      cue(T.ideia, 'morph', { k: 'ideia' });
      cue(bar(2, 2), 'gleam');
      cue(T.burst, 'burst');
      cue(T.conv + 0.35, 'blueprint');
      cue(T.conv, 'charge', { d: T.forma - T.conv });
      cue(T.forma, 'slam');
      cue(bar(5, 2), 'gleam');
      cue(T.sites, 'unbuild');
      cue(T.sites + 0.15, 'redraw', { d: 0.47 });
      LAYERS.forEach((t, k) => cue(t, 'layer', { k }));
      cue(T.exp, 'melt');
      cue(bar(7, 1.5), 'flow'); cue(bar(7, 2.5), 'flow');
      cue(bar(7, 3.55), 'shatter');
      for (let k = 0; k < 9; k++) cue(T.sol + 0.1 + k * (bar(8, 2.6) - T.sol - 0.1) / 9 * (0.55 + 0.45 * k / 8), 'piece', { k });
      cue(bar(8, 2.65), 'lock');
      cue(T.prop, 'pool');
      QUAL.forEach((t, k) => cue(t, 'quality', { k }));
      cue(bar(9, 2.9), 'align');
      cue(T.barra, 'barra');
      cue(bar(10, 1), 'solidify');
      cue(bar(10, 1.9), 'condense', { d: bar(10, 3.2) - bar(10, 1.9) });
      cue(T.marca, 'logo');
      cue(bar(11, 1), 'title'); cue(bar(11, 1.5), 'title');
      cue(T.url, 'url');
      for (let k = 1; k < 8; k++) cue(T.marca + k * 2 * BT, 'pulse', { k });
    },
  });
})();
