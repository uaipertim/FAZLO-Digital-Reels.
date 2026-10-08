/* =====================================================================
   FAZLO Digital — REEL 00 · "Da ideia ao digital." — 9:16 (1080x1920, 60 fps)

   Apresentação oficial da marca. A protagonista é a barra verde-lima da
   logo (a diagonal do "Z"): o traço que corta, organiza e transforma.

     c.1–2   IDEIA      uma faísca; a poeira em órbita vira a palavra IDEIA
     c.3–4   FORMA      a barra corta a ideia; a poeira vira uma malha 3D; FORMA ganha volume
     c.5–6   CÓDIGO     "<" e ">" chegam, a barra completa o "</>"; a barra vira um portal
     c.7–8   SITES      painéis voam e montam uma composição em camadas: SITES PROFISSIONAIS
     c.9–10  EXPERIÊNC. os mesmos painéis giram e se reorganizam a cada golpe: PERSONALIZADAS
     c.11    CONVERGE   tudo vira barra e espirala para um único ponto
     c.12–14 MARCA      a barra volta ao seu lugar na logo, a logo se revela; fazlodigital.com.br

   Motor em core/engine.js (Canvas 2D, determinístico): frame(ctx, t) desenha
   o quadro exato do instante t. A lista de cues (audio/cues.json) alimenta a
   trilha em scripts/audio.py, que cai exatamente nos golpes da imagem.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, hash, noise1, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  // 128 BPM: 1 tempo = 0,469 s, 1 compasso = 1,875 s
  const BPM = 128;
  const { BT, S16, bar } = U.tempo(BPM);
  const DURATION = 26.8;
  const T = {
    hook: 0,            // c.1–2   faísca, poeira, IDEIA
    forma: bar(3),      // c.3–4   o corte: FORMA
    codigo: bar(5),     // c.5–6   </> e portal
    sites: bar(7),      // c.7–8   SITES PROFISSIONAIS
    exp: bar(9),        // c.9–10  EXPERIÊNCIAS DIGITAIS PERSONALIZADAS
    conv: bar(11),      // c.11    convergência
    marca: bar(12),     // c.12–14 logo + endereço
  };
  const DIVE = [bar(6, 2), bar(6, 3.3)];             // mergulho no portal
  const WIPE = [T.codigo - 0.24, T.codigo + 0.22];   // cortina diagonal FORMA -> CÓDIGO
  const MORPH = [T.exp, T.exp + 2 * BT, bar(10), bar(10, 2)];
  const COLLAPSE = T.marca - 0.3;
  const URL_T = bar(13);

  // ---------------------------------------------------------------- marca
  let B, C, DISPLAY, TEXT, LOGO;
  // barra da logo: lados inclinados com dx/dy = -SK; largura horizontal = SW x altura
  const SK = 0.966, SW = 0.438;
  const DL = Math.hypot(SK, 1);
  const DIR = { x: SK / DL, y: -1 / DL };            // ao longo da barra, subindo para a direita
  const NRM = { x: 1 / DL, y: SK / DL };             // perpendicular à barra
  const uOf = (x, y) => x + SK * y;                  // coordenada "inclinada": constante ao longo da barra

  // ---------------------------------------------------------------- utilitários de desenho
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  function slashPts(cx, cy, h, w = SW * h) {
    const k = SK * h / 2;
    return [[cx - w / 2 + k, cy - h / 2], [cx + w / 2 + k, cy - h / 2], [cx + w / 2 - k, cy + h / 2], [cx - w / 2 - k, cy + h / 2]];
  }
  function slash(ctx, cx, cy, h, color, alpha = 1, w) {
    if (alpha <= 0.002 || h <= 0.5) return;
    poly(ctx, slashPts(cx, cy, h, w)); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
  }
  // faixa da tela entre as retas inclinadas u0 e u1
  function band(ctx, u0, u1, y0 = -200, y1 = H + 200) {
    poly(ctx, [[u0 - SK * y0, y0], [u1 - SK * y0, y0], [u1 - SK * y1, y1], [u0 - SK * y1, y1]]);
  }
  function rot2(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
  function glow(ctx, x, y, r, color, a) {
    if (a <= 0.002 || r <= 1) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.3, rgba(color, a * 0.42)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // clarão de tela inteira: soma luz quase branca, com um toque de lima
  function flash(ctx, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('#F3FFDC', clamp(a)); ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  // reflexo anamórfico (faísca)
  function flare(ctx, x, y, len, thick, color, a) {
    if (a <= 0.002) return;
    const g = ctx.createLinearGradient(x - len, y, x + len, y);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.5, rgba(color, clamp(a))); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - len, y - thick / 2, 2 * len, thick);
  }
  // faixa de luz na inclinação da barra (feixes, varreduras, brilhos)
  function slantLight(ctx, u, half, color, a) {
    if (a <= 0.002) return;
    const g = ctx.createLinearGradient(u - half, 0, u + half, 0);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(0.5, rgba(color, clamp(a))); g.addColorStop(1, rgba(color, 0));
    ctx.save(); ctx.transform(1, 0, -SK, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(u - half, -200, 2 * half, H + 400); ctx.restore();
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
  function text(ctx, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    ctx.save();
    ctx.globalAlpha *= clamp(a);
    ctx.font = fnt(o.fam, o.size, o.weight); ctx.letterSpacing = `${o.ls || 0}px`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = o.color || C.ink;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  // apoio letra a letra: cada letra sobe e acende em sequência
  function cascade(ctx, s, x, y, o, t, t0, st = 0.022, dur = 0.32) {
    if (t < t0) return;
    const w = measure(s, o.fam, o.size, o.weight, o.ls || 0);
    let cx = o.align === 'center' ? x - w / 2 : x;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      const cw = measure(ch, o.fam, o.size, o.weight, o.ls || 0);
      const p = E.outCubic(prog(t, t0 + i * st, t0 + i * st + dur));
      if (p > 0 && ch !== ' ') text(ctx, ch, cx, y + (1 - p) * o.size * 0.7, { ...o, align: 'left', alpha: (o.alpha ?? 1) * p });
      cx += cw;
    }
  }
  // palavra fatiada na inclinação da barra: cada fatia desliza pelo próprio trilho e trava
  function sliced(ctx, s, x, y, o, t, t0, opt = {}) {
    if (t < t0) return;
    const { n = 6, dur = 0.5, st = 0.03, spread = 650, out = null, edge = true } = opt;
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
      ctx.save();
      band(ctx, ua + i * du, ua + (i + 1) * du + 0.6, top - 1600, bot + 1600); ctx.clip();   // trilho longo: a fatia desliza por ele
      ctx.translate(DIR.x * d, DIR.y * d);
      text(ctx, s, x, y, { ...o, alpha: (o.alpha ?? 1) * clamp(pin * 2.2) * (1 - pout * 0.6) });
      ctx.restore();
      const m = Math.max(1 - pin, pout);
      if (edge && m > 0.01 && m < 0.999) {                     // fio de luz no trilho da fatia em movimento
        const u = ua + (i + (sg > 0 ? 1 : 0)) * du;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(C.accent, 0.9 * Math.sin(m * Math.PI) * (o.alpha ?? 1)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(u - SK * (top - 60), top - 60); ctx.lineTo(u - SK * (bot + 60), bot + 60); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------- 3D
  function rot3(x, y, z, rx, ry, rz) {
    let c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c];
    c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ry); s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c];
    return [x, y, z];
  }
  // câmera em órbita do ponto (0,0,0): gira o mundo (yaw, pitch), afasta em z e projeta
  function orbit({ yaw = 0, pitch = 0, roll = 0, dist = 2400, f = 1500, cx = W / 2, cy = H / 2 }) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    return (x, y, z) => {
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp + dist;
      if (z2 < 40) return null;
      const x3 = x1 * cr - y2 * sr, y3 = x1 * sr + y2 * cr, s = f / z2;
      return { x: cx + x3 * s, y: cy + y3 * s, s, z: z2 };
    };
  }
  // câmera livre (piso de pontos): posição, inclinação para baixo (pitch > 0), guinada
  function fly({ x: px = 0, y: py = 0, z: pz = 0, yaw = 0, pitch = 0, roll = 0, f = 1100, cx = W / 2, cy = H / 2 }) {
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    return (x, y, z) => {
      x -= px; y -= py; z -= pz;
      const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      if (z2 < 30) return null;
      const x3 = x1 * cr - y2 * sr, y3 = x1 * sr + y2 * cr, s = f / z2;
      return { x: cx + x3 * s, y: cy + y3 * s, s, z: z2 };
    };
  }

  // ================================================================ fundo comum
  function stage(ctx, t, { glowA = 0.0, cy = 900 } = {}) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, 1250);
    g.addColorStop(0, '#17191E'); g.addColorStop(0.55, '#0B0C0F'); g.addColorStop(1, C.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (glowA > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, cy, 900, C.accent, glowA); ctx.restore(); }
  }
  // feixes de luz diagonais (na inclinação da barra), suaves, em movimento lento
  function beams(ctx, t, a, seed = 0) {
    if (a <= 0.003) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const u = (hash(i, 7 + seed) * 2600 + t * (40 + 30 * hash(i, 9 + seed))) % 3200 - 150;
      const wd = 70 + 220 * hash(i, 11 + seed);
      slantLight(ctx, u, wd, C.accent, a * (0.35 + 0.65 * hash(i, 13 + seed)) * (0.7 + 0.3 * Math.sin(t * 0.8 + i * 2)));
    }
    ctx.restore();
  }

  // ================================================================ poeira (IDEIA -> malha)
  const P = { n: 0 };
  const WORD = { y: 980, cx: W / 2 };
  function buildParticles() {
    const cw = W, ch = 560;
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d', { willReadFrequently: true });
    const size = fit('IDEIA', DISPLAY, 900, 900, 360, -0.02);
    g.font = fnt(DISPLAY, size, 900); g.letterSpacing = `${-size * 0.02}px`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText('IDEIA', cw / 2, ch / 2);
    const d = g.getImageData(0, 0, cw, ch).data;
    const step = 6, pts = [];
    for (let y = 0; y < ch; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < cw; x += step) if (d[(y * cw + Math.floor(x)) * 4 + 3] > 140) pts.push([x, y]);
    let y0 = 1e9, y1 = -1e9, minx = 1e9, maxx = -1e9;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); }
    const n = pts.length;
    const F = () => new Float32Array(n);
    Object.assign(P, { n, tx: F(), ty: F(), r: F(), th: F(), om: F(), yv: F(), born: F(), del: F(), lime: new Uint8Array(n), sz: F(), gx: F(), gz: F(), bx: F(), by: F(), ph: F(), gd: F() });
    const r = U.rng(42);
    const cols = 52;
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (let i = 0; i < n; i++) {
      P.tx[i] = pts[i][0]; P.ty[i] = pts[i][1] - (y0 + y1) / 2 + WORD.y;
      P.r[i] = 90 + Math.pow(r(), 0.7) * 760;
      P.th[i] = r() * TAU;
      P.om[i] = (0.55 + 1.5 * 260 / (P.r[i] + 260)) * (r() < 0.9 ? 1 : -1);
      P.yv[i] = (r() - 0.5) * 120;
      P.born[i] = 0.04 + r() * 0.75;
      P.del[i] = ((P.tx[i] - minx) / (maxx - minx)) * 0.45 + r() * 0.3;
      P.lime[i] = r() < 0.16 ? 1 : 0;
      P.sz[i] = 3.4 + r() * 1.8;
      P.ph[i] = r() * TAU;
      const k = order[i], gi = k % cols, gj = Math.floor(k / cols);
      P.gx[i] = (gi - (cols - 1) / 2) * 64; P.gz[i] = 260 + gj * 66;
      P.gd[i] = r() * 0.4;
      // explosão no corte: para fora da barra, dos dois lados
      const side = Math.sign(uOf(P.tx[i], P.ty[i]) - uOf(WORD.cx, WORD.y)) || 1;
      const dist = 160 + r() * 520;
      P.bx[i] = P.tx[i] + NRM.x * side * dist + (r() - 0.5) * 160;
      P.by[i] = P.ty[i] + NRM.y * side * dist + (r() - 0.5) * 160;
    }
  }
  // câmera do piso de pontos (FORMA)
  function floorCam(t) {
    const s = t - T.forma;
    return fly({ x: 60 * Math.sin(s * 0.5), y: -560, z: -250 + s * 70, yaw: 0.10 * Math.sin(s * 0.45 + 0.6), pitch: 0.37, roll: -0.05 + 0.03 * Math.sin(s * 0.3), f: 1150, cy: 980 });
  }
  // a cada tempo, uma onda de luz percorre a malha a partir do centro
  function beatWave(i, t) {
    if (t < T.forma + 0.3) return 0;
    const bt = Math.floor((t - T.forma) / BT) * BT + T.forma;
    const dt = t - bt;
    const dist = Math.hypot(P.gx[i], P.gz[i] - 1300);
    return Math.exp(-Math.pow((dist - dt * 2600) / 180, 2)) * Math.exp(-dt * 2.2);
  }
  function drawDust(ctx, t) {
    if (t > T.codigo + 0.3) return;
    const cx = WORD.cx, cy = WORD.y;
    const drop = T.forma;
    const cam = t >= drop ? floorCam(t) : null;
    const build = E.inQuad(prog(t, 2.75, 3.72));                // tensão antes do drop
    const squeeze = t < drop ? 1 - 0.05 * E.inCubic(prog(t, 3.45, 3.75)) : 1;
    const tilt = -0.32;
    ctx.save();
    for (let pass = 0; pass < 2; pass++) {
      ctx.fillStyle = pass ? C.accent : C.ink;
      for (let i = 0; i < P.n; i++) {
        if (P.lime[i] !== pass) continue;
        let x, y, a = 1, s = P.sz[i];
        if (t < drop) {
          // órbita em vórtice em volta da faísca (pseudo-3D)
          const e = E.outCubic(prog(t, P.born[i], P.born[i] + 0.9));
          if (e <= 0) continue;
          const th = P.th[i] + P.om[i] * t;
          const rr = P.r[i] * e;
          const dz = Math.sin(th);
          let ox = rr * Math.cos(th), oy = rr * dz * 0.36 + P.yv[i] * e;
          [ox, oy] = rot2(ox, oy, tilt);
          const ds = 1 + 0.35 * dz;
          const fx = cx + ox * ds, fy = cy - 40 + oy;
          const f = E.inOutCubic(prog(t, 0.94 + P.del[i], 0.94 + P.del[i] + 0.8));
          const arc = Math.sin(f * Math.PI) * 90 * (hash(i, 3) - 0.5);
          x = lerp(fx, P.tx[i], f) + arc * NRM.x; y = lerp(fy, P.ty[i], f) + arc * NRM.y;
          a = lerp(0.35 + 0.65 * (0.5 + 0.5 * dz), 1, f) * Math.min(1, e * 2);
          s *= lerp(ds, 1, f);
          const j = 0.6 + 7 * build;                            // respiração e tremor crescente
          x += noise1(t * 9 + i, 1) * j * f; y += noise1(t * 9 + i, 2) * j * f;
          if (f >= 1) { x = cx + (x - cx) * squeeze; y = cy + (y - cy) * squeeze; }
          a *= 0.82 + 0.18 * Math.sin(t * 6 + P.ph[i]);
        } else {
          // corte: explode para fora da barra e pousa na malha 3D
          const pa = E.outCubic(prog(t, drop, drop + 0.32));
          const pb = E.inOutCubic(prog(t, drop + 0.22 + P.gd[i], drop + 0.95 + P.gd[i]));
          const g = cam(P.gx[i], 0, P.gz[i]);
          if (!g) continue;
          const bx = lerp(P.tx[i], P.bx[i], pa), by = lerp(P.ty[i], P.by[i], pa);
          x = lerp(bx, g.x, pb); y = lerp(by, g.y, pb);
          const depthA = clamp(1.25 - g.z / 4200);
          const wv = beatWave(i, t);
          s = lerp(s, clamp(9.5 * g.s, 1.6, 8.5) * (1 + 1.4 * wv), pb);
          a = lerp(1, depthA * (0.38 + 0.62 * wv + (P.lime[i] ? 0.25 : 0)), pb);
          if (t > T.codigo - 0.3) a *= 1 - prog(t, T.codigo - 0.3, T.codigo + 0.3);
        }
        if (a <= 0.01) continue;
        ctx.globalAlpha = clamp(a);
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }
    ctx.restore();
  }

  // ================================================================ cena 1 · IDEIA
  function sceneIdeia(ctx, t) {
    const build = E.inQuad(prog(t, 2.75, 3.72));
    stage(ctx, t, { glowA: 0.05 + 0.10 * build, cy: WORD.y });
    const cx = WORD.cx, cy = WORD.y - 40;
    const ign = E.outExpo(prog(t, 0, 0.25));
    const pulse = kick(t, 0, 0.5) + 0.5 * kick(t, bar(1, 2), 0.3) + 0.5 * kick(t, bar(2), 0.3) + 0.5 * kick(t, bar(2, 2), 0.3);
    const form = E.inOutCubic(prog(t, 1.1, 2.1));
    // faísca
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, 520 + 200 * build, C.accent, (0.16 + 0.22 * pulse + 0.3 * build) * ign * (1 - 0.55 * form));
    glow(ctx, cx, cy, 90, C.accentHi, (0.7 + 0.3 * pulse) * ign * (1 - 0.7 * form) + build * 0.4);
    flare(ctx, cx, cy, 520 + 260 * pulse, 3, C.accentHi, (0.55 + 0.45 * pulse) * ign * (1 - 0.6 * form) + 0.5 * build);
    flare(ctx, cx, cy, 240, 1.5, '#FFFFFF', 0.6 * ign * (1 - form));
    ctx.restore();
    drawDust(ctx, t);
    // o corte de abertura: uma lâmina atravessa a tela e se recolhe na faísca
    const bl = prog(t, 0, 0.42);
    if (bl < 1) {
      const len = lerp(3000, 0, E.inOutCubic(bl)), th = lerp(26, 2, E.outCubic(bl));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, cy); ctx.rotate(Math.atan2(DIR.y, DIR.x));
      const g = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
      g.addColorStop(0, rgba(C.accent, 0)); g.addColorStop(0.5, rgba(C.accentHi, 1)); g.addColorStop(1, rgba(C.accent, 0));
      ctx.fillStyle = g; ctx.fillRect(-len / 2, -th / 2, len, th);
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, cx, cy, 1100, C.accent, 0.35 * Math.pow(1 - prog(t, 0, 0.3), 2)); ctx.restore();
    }
    const kk = { fam: TEXT, size: 34, weight: 600, color: C.ink, ls: 9, align: 'center', alpha: 0.88 };
    cascade(ctx, 'TUDO COMEÇA COM UMA', W / 2, WORD.y - 250, kk, t, bar(1, 1), 0.026, 0.4);
    if (build > 0) { ctx.fillStyle = rgba('#000000', 0.25 * build); ctx.fillRect(0, 0, W, H); }
  }

  // ================================================================ cena 2 · FORMA
  const FORMA = { y: 1010 };
  function sceneForma(ctx, t) {
    const s = t - T.forma;
    stage(ctx, t, { glowA: 0.04, cy: 1000 });
    beams(ctx, t, 0.05 * prog(s, 0.3, 1.2), 1);
    drawDust(ctx, t);
    const ksz = fit('FORMA', DISPLAY, 900, 900, 260, -0.02);
    const o = { fam: DISPLAY, size: ksz, weight: 900, color: C.ink, ls: -ksz * 0.02, align: 'center' };
    const w = measure('FORMA', DISPLAY, ksz, 900, o.ls), x0 = W / 2 - w / 2, x1 = W / 2 + w / 2;
    const top = FORMA.y - ksz * 0.73, base = FORMA.y;
    // guias de construção, desenhadas a cada tempo
    ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(C.ink, 0.5);
    const g1 = E.outExpo(prog(t, bar(3, 1), bar(3, 1) + 0.5));
    if (g1 > 0) for (const y of [top, base]) { ctx.beginPath(); ctx.moveTo(W / 2 - 700 * g1, y); ctx.lineTo(W / 2 + 700 * g1, y); ctx.stroke(); }
    const g2 = E.outExpo(prog(t, bar(3, 2), bar(3, 2) + 0.5));
    if (g2 > 0) for (const [x, y] of [[x0 - 30, base], [x1 + 30, base]]) {
      const L = 900 * g2;
      ctx.beginPath(); ctx.moveTo(x - DIR.x * L * 0.4, y - DIR.y * L * 0.4); ctx.lineTo(x + DIR.x * L, y + DIR.y * L); ctx.stroke();
    }
    const g3 = prog(t, bar(3, 3), bar(3, 3) + 0.25);
    if (g3 > 0) {
      ctx.lineWidth = 3; ctx.strokeStyle = rgba(C.accent, 0.95 * g3);
      for (const [x, y] of [[x0 - 30, top], [x1 + 30, top], [x0 - 30, base], [x1 + 30, base]]) {
        const k = 18 * E.outBack(g3);
        ctx.beginPath(); ctx.moveTo(x - k, y); ctx.lineTo(x + k, y); ctx.moveTo(x, y - k); ctx.lineTo(x, y + k); ctx.stroke();
      }
    }
    ctx.restore();
    // volume: FORMA ganha profundidade na inclinação da barra (c.4)
    const ex = E.outExpo(prog(t, bar(4), bar(4) + 0.7)) * (1 - 0.15 * kick(t, bar(4, 2), 0.3));
    if (ex > 0.001) {
      const N = 30, depth = 70 * ex;
      for (let k = N; k >= 1; k--) {
        const d = depth * k / N;
        const c = k > N * 0.92 ? '#050506' : U.mix(C.accentLo, '#0B0D08', k / N);
        text(ctx, 'FORMA', W / 2 - DIR.x * d, FORMA.y - DIR.y * d, { ...o, color: c });
      }
    }
    sliced(ctx, 'FORMA', W / 2, FORMA.y, o, t, T.forma + 0.06, { n: 7, dur: 0.55, st: 0.035, spread: 1150 });
    // aresta de luz que varre a palavra quando ela ganha volume
    if (ex > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const sw = (t - bar(4)) * 1400 - 300;
      band(ctx, uOf(x0, top) + sw, uOf(x0, top) + sw + 120, top - 20, base + 30); ctx.clip();
      text(ctx, 'FORMA', W / 2, FORMA.y, { ...o, color: C.accentHi, alpha: 0.55 });
      ctx.restore();
    }
    cascade(ctx, 'QUE GANHA', W / 2, top - 120, { fam: TEXT, size: 34, weight: 600, color: C.ink, ls: 9, align: 'center', alpha: 0.88 }, t, T.forma + 0.1, 0.03, 0.35);
    // o corte: a barra gigante atravessa a palavra
    const c = prog(t, T.forma - 0.04, T.forma + 0.34);
    if (c > 0 && c < 1) {
      const p = E.inOutCubic(c);
      const d = lerp(-1800, 1800, p);
      const hx = W / 2 - DIR.x * d, hy = WORD.y - DIR.y * d;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, hx, hy, 900, C.accent, 0.5); ctx.restore();
      poly(ctx, slashPts(hx, hy, 3000, 150)); ctx.fillStyle = C.accent; ctx.fill();
    }
    const fl = kick(t, T.forma, 0.22);
    flash(ctx, 0.55 * fl);
  }

  // ================================================================ cena 3 · CÓDIGO
  const CODE = [];
  function buildCode() {
    const r = U.rng(7);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 77; row++) {
        const y = -1500 + row * 40;
        let z = 160 + Math.floor(r() * 4) * 70;
        const nTok = 1 + Math.floor(r() * 4);
        for (let k = 0; k < nTok && z < 5200; k++) {
          const len = 70 + r() * 330;
          const q = r();
          CODE.push({ side, y, z0: z, len, c: q < 0.09 ? 'lime' : q < 0.22 ? 'white' : 'gray' });
          z += len + 36 + r() * 40;
        }
      }
    }
  }
  // corredor de "código" abstrato: linhas de comprimentos e recuos variados nas paredes
  function codeWalls(ctx, t, camZ, alpha) {
    if (alpha <= 0.01) return;
    const f = 900, cx = W / 2, cy = 900, X = 600;
    const scroll = (t - T.codigo) * 70;
    for (const b of CODE) {
      let y = b.y - scroll; y = ((y + 1500) % 3080 + 3080) % 3080 - 1500;
      let z0 = b.z0 - camZ, z1 = b.z0 + b.len - camZ;
      while (z1 < 60) { z0 += 5400; z1 += 5400; }               // reaparece no fundo enquanto a câmera avança
      z0 = Math.max(z0, 60);
      const xs = b.side * X;
      const fog = clamp(1.15 - z0 / 4600) * alpha;
      if (fog <= 0.01) continue;
      poly(ctx, [[cx + xs * f / z0, cy + (y - 8) * f / z0], [cx + xs * f / z1, cy + (y - 8) * f / z1], [cx + xs * f / z1, cy + (y + 8) * f / z1], [cx + xs * f / z0, cy + (y + 8) * f / z0]]);
      ctx.fillStyle = b.c === 'lime' ? rgba(C.accent, 0.95 * fog) : b.c === 'white' ? rgba(C.ink, 0.7 * fog) : rgba('#6A6F7A', 0.7 * fog);
      ctx.fill();
    }
  }
  // chevron "<" (dir = 1) ou ">" (dir = -1), braços na inclinação da barra
  function chevron(ctx, cx, cy, h, dir, color, alpha = 1) {
    if (alpha <= 0.01) return;
    const th = h * 0.24, hw = h / 2 / 1.035;
    const tip = cx - dir * hw * 0.5, back = cx + dir * hw * 0.5;
    const pts = [[back, cy - h / 2], [back + dir * th * 1.39, cy - h / 2], [tip + dir * th * 1.39, cy], [back + dir * th * 1.39, cy + h / 2], [back, cy + h / 2], [tip, cy]];
    poly(ctx, pts); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fill(); ctx.globalAlpha = 1;
  }
  const CODEY = 880;
  function glyphGroup(ctx, t, { portal = false } = {}) {
    const h = 400;
    const tl = bar(5, 1), tr = bar(5, 2), ts = bar(5, 3);
    // "<" vem da esquerda girando, ">" da direita, "/" cai de cima
    const pl = E.outQuart(prog(t, tl - 0.45, tl)), pr = E.outQuart(prog(t, tr - 0.45, tr)), ps = E.outExpo(prog(t, ts - 0.3, ts));
    const kl = kick(t, tl, 0.25), kr = kick(t, tr, 0.25), ks = kick(t, ts, 0.3);
    const gx = 330;
    const q = Math.floor(t / S16);
    const glitch = (t > bar(6, 1) && t < DIVE[0] && hash(q, 5) > 0.45) ? (hash(q, 6) - 0.5) * 60 : 0;
    const lx = W / 2 - gx - (1 - pl) * 900 + glitch, rx = W / 2 + gx + (1 - pr) * 900 - glitch;
    ctx.save();
    ctx.translate(lx, CODEY); ctx.scale(Math.cos((1 - pl) * 1.4) * (1 + 0.08 * kl), 1 + 0.08 * kl);
    chevron(ctx, 0, 0, h * 0.82, 1, C.ink, clamp(pl * 2));
    ctx.restore();
    ctx.save();
    ctx.translate(rx, CODEY); ctx.scale(Math.cos((1 - pr) * 1.4) * (1 + 0.08 * kr), 1 + 0.08 * kr);
    chevron(ctx, 0, 0, h * 0.82, -1, C.ink, clamp(pr * 2));
    ctx.restore();
    if (ps > 0) {
      const sy = CODEY - (1 - ps) * 1300;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, W / 2, sy, 420, C.accent, 0.35 * ps + 0.4 * ks);
      ctx.restore();
      if (!portal) slash(ctx, W / 2, sy, h * (1 + 0.1 * ks), C.accent, 1);
    }
    if (glitch) {                                              // fatia de luz do glitch
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const y = CODEY + (hash(q, 8) - 0.5) * 300;
      ctx.fillStyle = rgba(C.accent, 0.35); ctx.fillRect(0, y, W, 10 + 40 * hash(q, 9));
      ctx.restore();
    }
  }
  function sceneCodigo(ctx, t) {
    const s = t - T.codigo;
    stage(ctx, t, { glowA: 0.03, cy: CODEY });
    const dv = E.inExpo(prog(t, DIVE[0], DIVE[1]));
    codeWalls(ctx, t, s * 120 + dv * 2600, clamp(s * 3 + 0.2));
    if (t < DIVE[0] + 0.25) {
      const fade = 1 - prog(t, DIVE[0], DIVE[0] + 0.2);
      cascade(ctx, 'VIRA', W / 2, CODEY - 330, { fam: TEXT, size: 34, weight: 600, color: C.ink, ls: 9, align: 'center', alpha: 0.88 * fade }, t, T.codigo + 0.12, 0.05, 0.35);
      const sz = fit('CÓDIGO', DISPLAY, 900, 760, 170, -0.02);
      sliced(ctx, 'CÓDIGO', W / 2, CODEY + 450, { fam: DISPLAY, size: sz, weight: 900, color: C.ink, ls: -sz * 0.02, align: 'center', alpha: fade }, t, bar(6), { n: 6, dur: 0.5 });
    }
    // mergulho: a barra cresce e vira um portal para o túnel
    const portalOpen = prog(t, DIVE[0] + 0.05, DIVE[0] + 0.3);
    const sc = Math.exp(Math.log(40) * dv);
    ctx.save();
    ctx.translate(W / 2, CODEY); ctx.scale(sc, sc); ctx.translate(-W / 2, -CODEY);
    glyphGroup(ctx, t, { portal: portalOpen > 0 });
    ctx.restore();
    if (portalOpen > 0) {
      const pts = slashPts(W / 2, CODEY, 400 * sc);
      ctx.save(); poly(ctx, pts); ctx.clip();
      tunnel(ctx, t);
      ctx.fillStyle = rgba(C.accent, 1 - portalOpen); ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.save(); poly(ctx, pts); ctx.strokeStyle = C.accent; ctx.lineWidth = 4 + 2 * sc; ctx.stroke(); ctx.restore();
    }
  }
  // túnel de barras: molduras na forma da barra correndo em direção à câmera
  function tunnel(ctx, t) {
    stage(ctx, t, { glowA: 0.12, cy: CODEY });
    const v = 5200, sp = 260, N = 22;
    const camZ = (t - DIVE[0]) * v * (0.4 + 0.6 * prog(t, DIVE[0], DIVE[1]));
    const f = 700, cx = W / 2, cy = CODEY;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, 380, C.accentHi, 0.5);
    for (let i = 0; i < 140; i++) {                            // rastros de velocidade
      const a = hash(i, 21) * TAU, R = 500 + hash(i, 22) * 1600;
      let z = (hash(i, 23) * 6000 - camZ * 1.2) % 6000; if (z < 0) z += 6000; z += 60;
      const z2 = z + 420;
      ctx.strokeStyle = rgba(hash(i, 24) < 0.3 ? C.accent : C.ink, 0.5 * clamp(1.3 - z / 6000));
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * f / z, cy + Math.sin(a) * R * f / z); ctx.lineTo(cx + Math.cos(a) * R * f / z2, cy + Math.sin(a) * R * f / z2); ctx.stroke();
    }
    for (let k = N - 1; k >= 0; k--) {
      let z = (k * sp - camZ) % (N * sp); if (z < 0) z += N * sp; z += 40;
      const s = f / z, h = 900 * s;
      const a = clamp(1.4 - z / (N * sp)) * clamp(z / 120);
      const roll = (t * 0.5 + k * 0.11) * 0.25;
      poly(ctx, slashPts(0, 0, h).map(([x, y]) => { const [rx, ry] = rot2(x, y, roll); return [cx + rx, cy + ry]; }));
      ctx.globalCompositeOperation = k % 3 ? 'lighter' : 'source-over';
      ctx.strokeStyle = rgba((k % 3) ? C.ink : C.accent, (k % 3 ? 0.5 : 0.95) * a);
      ctx.lineWidth = Math.max(1.5, (k % 3 ? 4 : 14) * s);
      ctx.stroke();
    }
    ctx.restore();
  }
  function sceneTunnel(ctx, t) {
    tunnel(ctx, t);
    const fl = E.inQuad(prog(t, T.sites - 0.16, T.sites));
    flash(ctx, 0.95 * fl);
  }

  // ================================================================ cenas 4–5 · painéis
  // painéis abstratos (sem interface): cada um é uma pequena composição gráfica
  const PANELS = [
    { w: 820, h: 520 }, { w: 400, h: 280 }, { w: 400, h: 280 }, { w: 370, h: 250 }, { w: 370, h: 250 },
    { w: 300, h: 300 }, { w: 420, h: 260 }, { w: 300, h: 210 }, { w: 330, h: 230 },
  ];
  const NP = PANELS.length;
  // formações: [x, y, z, rx, ry, rz, escala]
  const L_STACK = [
    [0, -40, 420, 0, 0, 0, 1], [-430, -330, 40, 0, 0, 0, 1], [450, -300, -60, 0, 0, 0, 1], [-470, 200, -200, 0, 0, 0, 1],
    [470, 240, -150, 0, 0, 0, 1], [-60, 360, -420, 0, 0, 0, 1], [150, -470, -320, 0, 0, 0, 1], [-560, -60, -520, 0, 0, 0, 1], [560, -20, -560, 0, 0, 0, 1],
  ];
  const L_GRID = Array.from({ length: NP }, (_, i) => [((i % 3) - 1) * 480, (Math.floor(i / 3) - 1) * 340, 0, 0, 0, 0, Math.min(440 / PANELS[i].w, 300 / PANELS[i].h)]);
  const L_RING = Array.from({ length: NP }, (_, i) => { const a = i / NP * TAU; return [Math.sin(a) * 900, (i % 3 - 1) * 110, Math.cos(a) * 900 - 350, 0, a + Math.PI, 0, 0.9]; });
  const L_STAIR = Array.from({ length: NP }, (_, i) => [-880 + i * 220, 620 - i * 165, -200 + i * 40, 0, 0.38, -0.05, 0.8]);
  const L_DECK = Array.from({ length: NP }, (_, i) => [(i - 4) * 70, (i - 4) * -24, (i - 4) * -60, 0, -0.15, (i - 4) * 0.12, 1.25]);
  const LAYOUTS = [L_STACK, L_GRID, L_RING, L_STAIR, L_DECK];

  function panelContent(ctx, kind, w, h, t, i) {
    const m = 26;
    switch (kind % 9) {
      case 0: { // barra + fios
        slash(ctx, w * 0.68, h / 2, h * 0.78, C.accent, 1);
        ctx.fillStyle = rgba(C.ink, 0.92); ctx.fillRect(m, m + 10, w * 0.36, 30); ctx.fillRect(m, m + 56, w * 0.24, 30);
        ctx.fillStyle = rgba(C.ink, 0.25); for (let k = 0; k < 4; k++) ctx.fillRect(m, h - m - 20 - k * 22, w * (0.3 - k * 0.04), 7);
        break;
      }
      case 1: { // esfera
        const g = ctx.createRadialGradient(w * 0.42, h * 0.4, 6, w / 2, h / 2, h * 0.42);
        g.addColorStop(0, C.accentHi); g.addColorStop(0.45, C.accent); g.addColorStop(1, '#1E2A08');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.36, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(C.ink, 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, h * 0.62, h * 0.16, -0.5 + t * 0.4, 0, TAU); ctx.stroke();
        break;
      }
      case 2: { // grade de módulos
        const cw = (w - m * 2 - 2 * 14) / 3, chh = (h - m * 2 - 14) / 2;
        for (let k = 0; k < 6; k++) {
          U.rr(ctx, m + (k % 3) * (cw + 14), m + Math.floor(k / 3) * (chh + 14), cw, chh, 10);
          ctx.fillStyle = k === 1 ? C.accent : k === 3 ? rgba(C.ink, 0.9) : rgba(C.ink, 0.1); ctx.fill();
        }
        break;
      }
      case 3: { // ritmo tipográfico
        const lw = [0.75, 0.55, 0.85, 0.4, 0.65];
        ctx.fillStyle = rgba(C.ink, 0.92); ctx.fillRect(m, m, (w - 2 * m) * lw[0], 26);
        ctx.fillStyle = rgba(C.ink, 0.22); for (let k = 1; k < 5; k++) ctx.fillRect(m, m + 34 + k * 26, (w - 2 * m) * lw[k], 9);
        ctx.fillStyle = C.accent; ctx.fillRect(m, h - m - 12, 60, 12);
        break;
      }
      case 4: { // ondas
        for (let L = 0; L < 2; L++) {
          ctx.beginPath();
          for (let x = m; x <= w - m; x += 6) { const y = h / 2 + Math.sin(x / (w - 2 * m) * TAU * 1.5 + t * 3 + L * 1.4) * h * (0.22 - L * 0.08); if (x === m) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
          ctx.strokeStyle = L ? rgba(C.ink, 0.5) : C.accent; ctx.lineWidth = L ? 3 : 6; ctx.stroke();
        }
        break;
      }
      case 5: { // espécime tipográfico
        ctx.font = fnt(DISPLAY, h * 0.42, 900); ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = C.ink; ctx.fillText('Aa', w / 2, h * 0.62);
        ctx.fillStyle = C.accent; ctx.fillRect(w / 2 - 40, h * 0.74, 80, 8);
        break;
      }
      case 6: { // imagem abstrata em faixas diagonais
        ctx.save(); U.rr(ctx, m, m, w - 2 * m, h - 2 * m, 12); ctx.clip();
        for (let k = 0; k < 9; k++) {
          ctx.fillStyle = k % 3 === 0 ? C.accent : k % 3 === 1 ? '#1C2410' : '#2C3A12';
          poly(ctx, [[k * 70 - 120, h], [k * 70 - 120 + SK * h, 0], [k * 70 - 50 + SK * h, 0], [k * 70 - 50, h]]); ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 7: { // matriz de pontos
        for (let a = 0; a < 7; a++) for (let b = 0; b < 4; b++) {
          const on = hash(a + b * 7, i) > 0.62;
          ctx.fillStyle = on ? C.accent : rgba(C.ink, 0.22);
          ctx.beginPath(); ctx.arc(m + 10 + a * ((w - 2 * m - 20) / 6), m + 14 + b * ((h - 2 * m - 28) / 3), on ? 9 : 6, 0, TAU); ctx.fill();
        }
        break;
      }
      default: { // arcos concêntricos
        for (let k = 0; k < 4; k++) {
          ctx.beginPath(); ctx.arc(m, h - m, 50 + k * 42, -Math.PI / 2, 0);
          ctx.strokeStyle = k === 1 ? C.accent : rgba(C.ink, 0.35); ctx.lineWidth = k === 1 ? 14 : 5; ctx.stroke();
        }
        ctx.fillStyle = rgba(C.ink, 0.9); ctx.fillRect(w - m - 110, m, 110, 18);
      }
    }
  }
  // um painel em 3D: base com os 4 cantos projetados; conteúdo por mapeamento afim
  function drawPanel(ctx, cam, pz, i, kind, t, hl) {
    const { w, h } = PANELS[i];
    const [x, y, z, rx, ry, rz, sc] = pz;
    const c = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => {
      const [X, Y, Z] = rot3(a * sc, b * sc, 0, rx, ry, rz);
      return cam(X + x, Y + y, Z + z);
    });
    if (c.some((p) => !p)) return;
    const q = c.map((p) => [p.x, p.y]);
    const front = ((q[1][0] - q[0][0]) * (q[3][1] - q[0][1]) - (q[1][1] - q[0][1]) * (q[3][0] - q[0][0])) > 0;
    const fog = clamp(1.25 - (c[0].z + c[2].z) / 2 / 5200);
    const aff = [(q[1][0] - q[0][0]) / w, (q[1][1] - q[0][1]) / w, (q[3][0] - q[0][0]) / h, (q[3][1] - q[0][1]) / h, q[0][0], q[0][1]];
    ctx.save();
    ctx.globalAlpha = fog;
    poly(ctx, q);
    ctx.fillStyle = front ? 'rgba(17,18,22,0.95)' : 'rgba(10,11,13,0.96)'; ctx.fill();
    ctx.strokeStyle = rgba(hl > 0.02 ? C.accent : C.ink, hl > 0.02 ? 0.4 + 0.6 * hl : 0.2); ctx.lineWidth = 2 + 3 * hl; ctx.stroke();
    ctx.clip();
    ctx.transform(...aff);
    if (front) {
      panelContent(ctx, kind, w, h, t, i);
      ctx.fillStyle = C.accent; ctx.fillRect(0, 0, 34, 5); ctx.fillRect(0, 0, 5, 34);   // marca de canto
    } else slash(ctx, w / 2, h / 2, h * 0.5, C.accent, 0.5);
    ctx.restore();
  }
  // estado de cada painel no instante t
  function panelState(i, t) {
    let pz, kind = i;
    if (t < MORPH[0]) {
      pz = L_STACK[i].slice();
      // chegada: do fundo, girando, em semicolcheias
      const ta = T.sites + 0.04 + i * S16;
      const p = E.outExpo(prog(t, ta - 0.55, ta));
      if (p <= 0) return null;
      const r = hash(i, 31), r2 = hash(i, 32);
      pz[0] += (1 - p) * (r - 0.5) * 3000; pz[1] += (1 - p) * (r2 - 0.5) * 2600; pz[2] += (1 - p) * 7000;
      pz[3] += (1 - p) * (r - 0.5) * 3; pz[4] += (1 - p) * (r2 - 0.5) * 4; pz[5] += (1 - p) * (r - 0.5) * 2;
      pz[1] += Math.sin(t * 1.3 + i) * 12; pz[3] += Math.sin(t * 0.9 + i * 2) * 0.05; pz[4] += Math.sin(t * 0.7 + i) * 0.06;
    } else {
      let k = 0; while (k < MORPH.length - 1 && t >= MORPH[k + 1]) k++;
      const A = LAYOUTS[k], Bz = LAYOUTS[k + 1];
      const tm = MORPH[k] + i * 0.012;
      const p = E.outQuart(prog(t, tm, tm + 0.55));
      pz = A[i].map((v, j) => lerp(v, Bz[i][j], p));
      pz[4] += TAU * p;                                         // giro completo revela o novo conteúdo
      kind = i + (p >= 0.35 ? k + 1 : k) * 4;
      pz[1] += Math.sin(t * 1.3 + i) * 10;
    }
    return { pz, kind };
  }
  function panelCam(t) {
    const a = E.inOutSine(prog(t, T.sites, T.exp));
    let yaw = lerp(-0.42, 0.22, a);
    if (t > T.exp) yaw += 0.18 * Math.sin((t - T.exp) * 0.9);
    yaw += 0.9 * E.inOutSine(prog(t, MORPH[1], MORPH[2] + 0.4)) - 0.9 * E.inOutSine(prog(t, MORPH[2], MORPH[2] + 0.46));   // o anel gira
    const punch = MORPH.reduce((a, m) => a + kick(t, m, 0.28), 0);   // soco de câmera em cada giro
    const dist = (lerp(3400, 2050, E.outExpo(prog(t, T.sites, T.sites + 1.4))) + 100 * Math.sin(t * 0.6)) * (1 - 0.14 * punch);
    return orbit({ yaw, pitch: 0.12 + 0.04 * Math.sin(t * 0.5), roll: -0.03, dist, f: 1500, cy: 690 });
  }
  function drawPanels(ctx, t) {
    const cam = panelCam(t);
    const list = [];
    for (let i = 0; i < NP; i++) {
      const st = panelState(i, t);
      if (!st) continue;
      const p = cam(st.pz[0], st.pz[1], st.pz[2]);
      if (p) list.push({ i, st, z: p.z });
    }
    list.sort((a, b) => b.z - a.z);
    for (const { i, st } of list) {
      // destaque: na chegada, a cada tempo do c.8 e ao fim de cada giro
      let hl = t < T.exp ? kick(t, T.sites + 0.04 + i * S16, 0.3) : 0;
      if (t > bar(8) && t < T.exp) { const b = Math.floor((t - bar(8)) / BT); if (b % NP === (i * 4) % NP || (b + 4) % NP === (i * 4) % NP) hl = Math.max(hl, kick(t, bar(8) + b * BT, 0.4)); }
      if (t >= MORPH[0]) { let k = 0; while (k < MORPH.length - 1 && t >= MORPH[k + 1]) k++; hl = Math.max(hl, kick(t, MORPH[k] + i * 0.012, 0.35)); }
      drawPanel(ctx, cam, st.pz, i, st.kind, t, hl);
    }
  }
  // varredura de luz sobre a composição
  function sheen(ctx, t, t0, dur) {
    const p = prog(t, t0, t0 + dur);
    if (p <= 0 || p >= 1) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    slantLight(ctx, lerp(-600, 3200, E.inOutSine(p)), 260, C.accentHi, 0.22);
    ctx.restore();
  }
  function bottomScrim(ctx, a = 1) {
    if (a <= 0.01) return;
    const g = ctx.createLinearGradient(0, 1020, 0, 1600);
    g.addColorStop(0, 'rgba(5,5,6,0)'); g.addColorStop(0.45, `rgba(5,5,6,${0.82 * a})`); g.addColorStop(1, `rgba(5,5,6,${0.92 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, 1020, W, 900);
  }
  const TX = 84;                                                // margem esquerda dos textos (fora da coluna de ações)
  function scenePaineis(ctx, t) {
    stage(ctx, t, { glowA: 0.05, cy: 760 });
    beams(ctx, t, 0.06, 2);
    drawPanels(ctx, t);
    sheen(ctx, t, bar(8), 1.2);
    sheen(ctx, t, bar(10, 3), 0.9);
    const fl = kick(t, T.sites, 0.35);                          // flash da saída do túnel
    flash(ctx, 0.9 * fl);
    flash(ctx, 0.2 * MORPH.reduce((a, m) => a + kick(t, m, 0.16), 0));   // clarão curto em cada giro
    bottomScrim(ctx, clamp((t - T.sites) * 3));
    textosPaineis(ctx, t);
  }
  // blocos de texto justificados: cada linha ocupa a largura útil (fora da coluna de ações)
  const TW_ = 815;
  function block(lines, y0) {
    let y = y0;
    return lines.map(([s, color]) => {
      const size = fit(s, DISPLAY, 900, TW_, 230, -0.02);
      y += size * 0.74;
      const o = { s, y, o: { fam: DISPLAY, size, weight: 900, color, ls: -size * 0.02, align: 'left' } };
      y += size * 0.26 + 8;
      return o;
    });
  }
  let BLK1, BLK2;
  function textosPaineis(ctx, t) {
    const out1 = T.exp - 0.2, out2 = T.conv;
    const k0 = { fam: TEXT, size: 30, weight: 600, color: C.accent, ls: 8, align: 'left' };
    cascade(ctx, 'E SE TRANSFORMA EM', TX, 1150, { ...k0, alpha: 1 - prog(t, out2, out2 + 0.25) }, t, T.sites + 0.2, 0.025, 0.35);
    if (!BLK1) {
      BLK1 = block([['SITES', C.ink], ['PROFISSIONAIS.', C.accent]], 1180);
      BLK2 = block([['EXPERIÊNCIAS', C.ink], ['DIGITAIS', C.ink], ['PERSONALIZADAS.', C.accent]], 1180);
    }
    const t1 = [bar(7, 2), bar(7, 3)], t2 = [T.exp + 0.04, T.exp + BT + 0.04, T.exp + 2 * BT + 0.04];
    BLK1.forEach((L, i) => sliced(ctx, L.s, TX, L.y, L.o, t, t1[i], { n: 4 + i * 3, out: out1 }));
    BLK2.forEach((L, i) => sliced(ctx, L.s, TX, L.y, L.o, t, t2[i], { n: [7, 5, 8][i], out: out2 }));
  }

  // ================================================================ cena 6 · CONVERGÊNCIA
  const SWARM = [];
  function buildSwarm() {
    const r = U.rng(99);
    for (let i = 0; i < 110; i++) SWARM.push({ a: r() * TAU, R: 520 + r() * 800, t0: T.conv - 0.1 + r() * 0.8, h: 40 + r() * 120, spin: (r() < 0.5 ? -1 : 1) * (1.6 + r() * 2.2), lime: r() < 0.6 });
  }
  const CONV_C = { x: W / 2, y: 860 };
  function sceneConv(ctx, t) {
    const s = t - T.conv;
    const amp = E.inQuad(prog(t, T.conv, COLLAPSE));
    stage(ctx, t, { glowA: 0.05 + 0.25 * amp, cy: CONV_C.y });
    // linhas de velocidade radiais
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 120; i++) {
      const a = hash(i, 51) * TAU;
      const sp = 1 - ((hash(i, 52) + s * (0.8 + 1.6 * amp)) % 1);
      const r1 = 60 + sp * 1300, r2 = r1 + 80 + 260 * amp;
      ctx.strokeStyle = rgba(hash(i, 53) < 0.35 ? C.accent : C.ink, (0.12 + 0.4 * amp) * sp);
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(CONV_C.x + Math.cos(a) * r1, CONV_C.y + Math.sin(a) * r1); ctx.lineTo(CONV_C.x + Math.cos(a) * r2, CONV_C.y + Math.sin(a) * r2); ctx.stroke();
    }
    ctx.restore();
    // painéis: saem da formação e espiralam virando barras
    const cam0 = panelCam(T.conv);
    textosPaineis(ctx, t);
    for (let i = 0; i < NP; i++) {
      const st = panelState(i, T.conv - 1e-3);
      const p0 = cam0(st.pz[0], st.pz[1], st.pz[2]);
      if (!p0) continue;
      const ti = T.conv + i * 0.035;
      const op = E.outCubic(prog(t, ti, ti + 0.5));
      const p = E.inCubic(prog(t, ti + 0.35, COLLAPSE - 0.05 + i * 0.01));
      if (p >= 1) continue;
      const dx = p0.x - CONV_C.x, dy = p0.y - CONV_C.y;
      const r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx) || i;
      const a = a0 + op * 0.9 + p * (3 + i * 0.2), r = lerp(r0, 330 + 160 * hash(i, 71), op) * (1 - p);
      const x = CONV_C.x + Math.cos(a) * r, y = CONV_C.y + Math.sin(a) * r;
      const morph = E.inOutCubic(prog(t, ti + 0.1, ti + 0.6));
      const w = lerp(PANELS[i].w * p0.s * 0.92, 60, morph) * (1 - p * 0.8), hh = lerp(PANELS[i].h * p0.s * 0.92, 140, morph) * (1 - p * 0.8);
      const sl = slashPts(0, 0, hh, w);
      const pts = [[-w / 2, -hh / 2], [w / 2, -hh / 2], [w / 2, hh / 2], [-w / 2, hh / 2]].map(([px, py], j) => {
        const [rx, ry] = rot2(lerp(px, sl[j][0], morph), lerp(py, sl[j][1], morph), p * 2.2); return [x + rx, y + ry];
      });
      poly(ctx, pts);
      ctx.fillStyle = morph < 0.5 ? U.mix('#121317', C.accent, morph * 2) : C.accent; ctx.fill();
      ctx.strokeStyle = rgba(C.ink, 0.25 * (1 - morph)); ctx.lineWidth = 2; ctx.stroke();
    }
    // enxame de barras que vem de fora, com rastro
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of SWARM) {
      for (let g = 3; g >= 0; g--) {
        if (t - g * 0.025 < b.t0) continue;
        const p = E.inCubic(prog(t - g * 0.025, b.t0, COLLAPSE));
        if (p >= 1) continue;
        const a = b.a + p * b.spin, r = b.R * (1 - p);
        slash(ctx, CONV_C.x + Math.cos(a) * r, CONV_C.y + Math.sin(a) * r, b.h * (1 - 0.7 * p), b.lime ? C.accent : C.ink, (g ? 0.16 : 0.8) * clamp(prog(t, b.t0, b.t0 + 0.25)));
      }
    }
    // poeira espiralando
    for (let i = 0; i < 260; i++) {
      const p = ((hash(i, 81) + (t - T.conv) * (0.45 + 0.5 * amp + 0.3 * hash(i, 82))) % 1);
      const r = 1300 * (1 - p) * (0.4 + 0.6 * hash(i, 83)), a = hash(i, 84) * TAU + p * 4;
      ctx.fillStyle = hash(i, 85) < 0.4 ? C.accent : C.ink; ctx.globalAlpha = 0.55 * Math.sin(p * Math.PI) * clamp((t - T.conv) * 3);
      ctx.fillRect(CONV_C.x + Math.cos(a) * r, CONV_C.y + Math.sin(a) * r, 3, 3);
    }
    ctx.globalAlpha = 1;
    // núcleo
    const core = E.inQuad(prog(t, T.conv + 0.6, T.marca));
    glow(ctx, CONV_C.x, CONV_C.y, 260 + 500 * core, C.accent, 0.35 + 0.45 * core);
    glow(ctx, CONV_C.x, CONV_C.y, 70 + 60 * core, C.accentHi, 0.6 + 0.4 * core);
    flare(ctx, CONV_C.x, CONV_C.y, 300 + 700 * core, 3 + 4 * core, C.accentHi, 0.4 + 0.6 * core);
    ctx.restore();
    // o colapso: tudo é puxado para o ponto
    const col = prog(t, COLLAPSE, T.marca);
    if (col > 0) {
      ctx.fillStyle = rgba('#000000', 0.5 * E.inQuad(col)); ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, CONV_C.x, CONV_C.y, 700 * (1 - col) + 120, C.accentHi, 0.9); ctx.restore();
    }
  }

  // ================================================================ cena 7 · MARCA
  let LG;                                                       // geometria da logo na tela
  function buildLogo() {
    const sl = B.slash, iw = LOGO.naturalWidth, ih = LOGO.naturalHeight;
    const kx = iw / sl.imgW, ky = ih / sl.imgH;                  // caso a imagem venha em outra resolução
    const bx0 = 46 * kx, by0 = 85 * ky, bx1 = 1916 * kx, by1 = 494 * ky;   // contorno visível da logo
    const s = 900 / (bx1 - bx0);
    const cx = W / 2, cy = 860;
    const x0 = cx - ((bx0 + bx1) / 2) * s, y0 = cy - ((by0 + by1) / 2) * s;
    const P_ = (x, y) => [x0 + x * kx * s, y0 + y * ky * s];
    const corners = [P_(sl.tl, sl.top), P_(sl.tr, sl.top), P_(sl.br, sl.bottom), P_(sl.bl, sl.bottom)];
    LG = {
      s, x0, y0, w: iw * s, h: ih * s, cx, cy, slash: corners,
      scx: corners.reduce((a, c) => a + c[0], 0) / 4, scy: corners.reduce((a, c) => a + c[1], 0) / 4,
      sh: (sl.bottom - sl.top) * ky * s, top: y0 + by0 * s, bot: y0 + by1 * s, left: x0 + bx0 * s, right: x0 + bx1 * s,
    };
  }
  let LOGOBUF = null;
  function drawLogo(ctx, t, { push = 1, glints = [] } = {}) {
    // a logo é sempre o arquivo oficial: só máscara, escala e brilho por cima
    const m0 = T.marca;
    const rv = E.outCubic(prog(t, m0 + 0.28, m0 + 0.86));
    if (rv <= 0) return;
    if (!LOGOBUF) { LOGOBUF = document.createElement('canvas'); LOGOBUF.width = W; LOGOBUF.height = H; }
    const b = LOGOBUF.getContext('2d');
    const ucen = uOf(LG.scx, LG.scy);
    const left = rv * (ucen - uOf(LG.left - 60, LG.top - 60)), right = rv * (uOf(LG.right + 60, LG.bot + 60) - ucen);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1;
    b.clearRect(0, 0, W, H);
    b.save();
    b.translate(LG.cx, LG.cy); b.scale(push, push); b.translate(-LG.cx, -LG.cy);
    if (rv < 1) { band(b, ucen - left, ucen + right, LG.top - 300, LG.bot + 300); b.clip(); }
    b.drawImage(LOGO, LG.x0, LG.y0, LG.w, LG.h);
    // brilho especular restrito ao desenho da logo
    for (const [g0, dur] of glints) {
      const p = prog(t, g0, g0 + dur);
      if (p <= 0 || p >= 1) continue;
      b.globalCompositeOperation = 'source-atop';
      slantLight(b, lerp(uOf(LG.left, LG.top) - 300, uOf(LG.right, LG.bot) + 300, E.inOutSine(p)), 150, '#FFFFFF', 0.9);
      b.globalCompositeOperation = 'source-over';
    }
    b.restore();
    ctx.drawImage(LOGOBUF, 0, 0);
    // fios de luz nas bordas da revelação
    if (rv < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(C.accent, Math.sin(rv * Math.PI)); ctx.lineWidth = 4;
      for (const u of [ucen - left, ucen + right]) { ctx.beginPath(); ctx.moveTo(u - SK * (LG.top - 120), LG.top - 120); ctx.lineTo(u - SK * (LG.bot + 120), LG.bot + 120); ctx.stroke(); }
      ctx.restore();
    }
  }
  function floorDots(ctx, t, a) {
    if (a <= 0.01) return;
    const cam = fly({ x: 40 * Math.sin(t * 0.3), y: -520, z: -200 + (t - T.marca) * 60, yaw: 0.05 * Math.sin(t * 0.25), pitch: 0.24, f: 1150, cy: 1060 });
    ctx.save(); ctx.fillStyle = C.ink;
    for (let gj = 0; gj < 34; gj++) for (let gi = -24; gi <= 24; gi++) {
      const p = cam(gi * 70, 0, 300 + gj * 80);
      if (!p || p.y < 0 || p.y > H) continue;
      const da = clamp(1.2 - p.z / 3200) * a;
      if (da <= 0.02) continue;
      ctx.globalAlpha = da * 0.5;
      const s = Math.max(1.2, 8 * p.s);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.restore();
  }
  function sceneMarca(ctx, t) {
    const m0 = T.marca, s = t - m0;
    stage(ctx, t, { glowA: 0.06 + 0.12 * kick(t, m0, 0.8), cy: LG.cy });
    beams(ctx, t, 0.05, 3);
    floorDots(ctx, t, 0.5 * prog(s, 0.4, 1.6));
    // poeira subindo
    ctx.save();
    for (let i = 0; i < 160; i++) {
      const y = (H + 100) - ((hash(i, 61) * 2200 + s * (30 + 60 * hash(i, 62))) % 2200);
      const x = hash(i, 63) * W + Math.sin(s * 0.7 + i) * 20;
      const z = 1.5 + 2.5 * hash(i, 65);
      ctx.globalAlpha = (0.12 + 0.3 * hash(i, 64)) * clamp(s * 2);
      ctx.fillStyle = hash(i, 66) < 0.3 ? C.accent : C.ink;
      ctx.fillRect(x, y, z, z);
    }
    ctx.restore();
    // halo atrás da logo, pulsando com o groove
    const pulse = t > bar(13) ? kick(t, Math.floor((t - bar(13)) / BT) * BT + bar(13), 0.35) : 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, LG.scx, LG.scy, 700, C.accent, 0.10 + 0.05 * pulse + 0.25 * kick(t, m0, 0.6));
    ctx.restore();
    // onda de choque inclinada
    const sw = prog(t, m0, m0 + 0.7);
    if (sw > 0 && sw < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      poly(ctx, slashPts(LG.scx, LG.scy, lerp(LG.sh, 3600, E.outCubic(sw)))); ctx.strokeStyle = rgba(C.accent, 0.9 * (1 - sw)); ctx.lineWidth = 10 * (1 - sw) + 2; ctx.stroke();
      ctx.restore();
    }
    // a cada 2 tempos, uma onda na forma da barra se expande a partir da logo
    if (t > bar(13)) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) {
        const t0 = bar(13) + (Math.floor((t - bar(13)) / (2 * BT)) - k) * 2 * BT;
        const q = (t - t0) / 1.9;
        if (t0 < bar(13) || q < 0 || q > 1) continue;
        poly(ctx, slashPts(LG.scx, LG.scy, LG.sh * lerp(1.6, 16, E.outCubic(q))));
        ctx.strokeStyle = rgba(C.accent, 0.3 * (1 - q)); ctx.lineWidth = 2.5; ctx.stroke();
      }
      ctx.restore();
    }
    const push = 1 + 0.035 * E.inOutSine(prog(t, m0 + 0.8, DURATION));
    drawLogo(ctx, t, { push, glints: [[m0 + 1.0, 0.65], [bar(14, 1.5), 0.6]] });
    // a barra: chega gigante e encolhe até o lugar exato da barra da logo
    const sp = E.outExpo(prog(t, m0, m0 + 0.5));
    const fade = 1 - prog(t, m0 + 0.7, m0 + 1.0);
    if (fade > 0) {
      const sc = lerp(4200, LG.sh, sp) / LG.sh;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, LG.scx, LG.scy, 500, C.accent, 0.6 * fade * (1 - sp * 0.5)); ctx.restore();
      poly(ctx, LG.slash.map(([x, y]) => [LG.scx + (x - LG.scx) * sc, LG.scy + (y - LG.scy) * sc]));
      ctx.fillStyle = rgba(C.accent, fade); ctx.fill();
    }
    // apoio + endereço
    cascade(ctx, 'SOLUÇÕES DIGITAIS PARA EMPRESAS', W / 2, LG.bot + 150, { fam: TEXT, size: 29, weight: 500, color: C.ink, ls: 7.5, align: 'center', alpha: 0.82 }, t, bar(12, 3), 0.018, 0.4);
    const usz = fit('fazlodigital.com.br', DISPLAY, 600, 680, 54, 0);
    urlLine(ctx, t, W / 2, LG.bot + 330, { fam: DISPLAY, size: usz, weight: 600, color: C.ink, ls: 0, align: 'center' });
    const fl = kick(t, m0, 0.25);
    flash(ctx, 0.85 * fl);
  }
  function urlLine(ctx, t, x, y, o) {
    if (t < URL_T) return;
    const s = 'fazlodigital.com.br';
    const w = measure(s, o.fam, o.size, o.weight, 0);
    let cx = x - w / 2;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], cw = measure(ch, o.fam, o.size, o.weight, 0);
      const t0 = URL_T + i * 0.03;
      const p = E.outBack(prog(t, t0, t0 + 0.3), 2.2), a = prog(t, t0, t0 + 0.12);
      if (a > 0) text(ctx, ch, cx, y + (1 - p) * 40, { ...o, align: 'left', alpha: a, color: i >= 12 ? C.muted : C.ink });
      cx += cw;
    }
    // moldura que se desenha em volta do endereço
    const pp = E.inOutCubic(prog(t, URL_T + 0.62, URL_T + 1.15));
    if (pp > 0) {
      const bw = w + 90, bh = o.size * 1.9, bx = x - bw / 2, by = y - o.size * 1.25;
      const per = 2 * (bw + bh);
      ctx.save();
      U.rr(ctx, bx, by, bw, bh, bh / 2);
      ctx.setLineDash([per * pp, per]);
      ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      const pulse = t > URL_T + 1.2 ? kick(t, Math.floor((t - URL_T) / (2 * BT)) * 2 * BT + URL_T, 0.4) : 0;
      if (pulse > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y - o.size * 0.35, bw * 0.6, C.accent, 0.12 * pulse); ctx.restore(); }
    }
  }

  // ================================================================ montagem
  // cortina: uma barra lima larga atravessa a tela; atrás dela já está a cena nova
  function wipe(ctx, t, A, Bs) {
    const p = prog(t, WIPE[0], WIPE[1]);
    const lead = lerp(-20, 3700, p), trail = lead - 650;
    ctx.save(); band(ctx, lead, 5000); ctx.clip(); A(ctx, t); ctx.restore();
    ctx.save(); band(ctx, -3000, trail); ctx.clip(); Bs(ctx, t); ctx.restore();
    ctx.save(); band(ctx, trail, lead); ctx.fillStyle = C.accent; ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; band(ctx, lead - 40, lead); ctx.fillStyle = rgba(C.accentHi, 0.8); ctx.fill();
    ctx.restore();
  }
  const SHAKE = [[0, 14, 0.3], [T.forma, 26, 0.45], [bar(5, 3), 12, 0.3], [T.sites, 16, 0.35], [T.marca, 30, 0.5]];
  function shakeAt(t) {
    let x = 0, y = 0;
    for (const [t0, amp, dur] of SHAKE) {
      if (t < t0 || t > t0 + dur * 1.5) continue;
      const k = kick(t, t0, dur) * amp;
      x += noise1((t - t0) * 40, 11) * k; y += noise1((t - t0) * 40, 23) * k;
    }
    const conv = E.inQuad(prog(t, T.conv + 0.5, COLLAPSE)) * 8;
    if (conv > 0 && t < T.marca) { x += noise1(t * 30, 31) * conv; y += noise1(t * 30, 37) * conv; }
    return { x, y };
  }
  function frame(ctx, t) {
    if (t < T.forma - 0.04) sceneIdeia(ctx, t);
    else if (t < WIPE[0]) sceneForma(ctx, t);
    else if (t < WIPE[1]) wipe(ctx, t, sceneForma, sceneCodigo);
    else if (t < DIVE[1]) sceneCodigo(ctx, t);
    else if (t < T.sites) sceneTunnel(ctx, t);
    else if (t < T.conv) scenePaineis(ctx, t);
    else if (t < T.marca) sceneConv(ctx, t);
    else sceneMarca(ctx, t);
    // tremor de câmera: reposiciona o quadro (com leve zoom para não mostrar bordas)
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
    const t = T.marca + 4;
    stage(ctx, t, { glowA: 0.06, cy: 1000 });
    beams(ctx, 3.2, 0.07, 3);
    floorDots(ctx, t, 0.55);
    // a barra gigante como gesto de fundo, com estilhaços
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, 980, 700, C.accent, 0.22); ctx.restore();
    slash(ctx, W / 2 + 40, 960, 1500, C.accent, 0.14);
    poly(ctx, slashPts(W / 2 + 40, 960, 1500)); ctx.strokeStyle = rgba(C.accent, 0.3); ctx.lineWidth = 3; ctx.stroke();
    const r = U.rng(5);
    for (let i = 0; i < 30; i++) {
      const side = r() < 0.5 ? -1 : 1, d = 300 + r() * 380;
      const x = W / 2 + 40 + NRM.x * side * d + DIR.x * (r() - 0.5) * 1400, y = 960 + NRM.y * side * d + DIR.y * (r() - 0.5) * 1400;
      const h = 12 + r() * 46, c = r() < 0.65 ? C.accent : C.ink, a = 0.3 + r() * 0.55;
      if ((y > 330 && y < 720) || (y > 1000 && y < 1560)) continue;   // nada cruza títulos, logo e endereço
      slash(ctx, x, y, h, c, a);
    }
    text(ctx, 'APRESENTAÇÃO', W / 2, 400, { fam: TEXT, size: 32, weight: 600, color: C.accent, ls: 10, align: 'center' });
    const sz = fit('AO DIGITAL.', DISPLAY, 900, 900, 150, -0.02);
    const o = { fam: DISPLAY, size: sz, weight: 900, color: C.ink, ls: -sz * 0.02, align: 'center' };
    text(ctx, 'DA IDEIA', W / 2, 440 + sz * 0.78, o);
    text(ctx, 'AO DIGITAL.', W / 2, 440 + sz * 1.84, o);
    // logo oficial como protagonista + endereço
    ctx.drawImage(LOGO, LG.x0, LG.y0 + 230, LG.w, LG.h);
    text(ctx, 'SOLUÇÕES DIGITAIS PARA EMPRESAS', W / 2, LG.bot + 230 + 130, { fam: TEXT, size: 28, weight: 500, color: C.ink, ls: 7, align: 'center', alpha: 0.85 });
    const usz = 46, uw = measure('fazlodigital.com.br', DISPLAY, usz, 600, 0), uy = LG.bot + 230 + 270;
    U.rr(ctx, W / 2 - uw / 2 - 45, uy - usz * 1.25, uw + 90, usz * 1.9, usz * 0.95); ctx.strokeStyle = C.accent; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, 'fazlodigital.com.br', W / 2, uy, { fam: DISPLAY, size: usz, weight: 600, color: C.ink, align: 'center' });
  }

  // ================================================================ cues (som)
  function cues(api) {
    const c = api.cue;
    // IDEIA
    c(0, 'blade', { v: 1 }); c(0.02, 'spark', { v: 1 });
    c(0.05, 'dust', { d: 0.8 });
    c(bar(1, 1), 'kicker', { n: 19, d: 0.5 });
    c(0.94, 'gather', { d: 1.3 });
    c(bar(2), 'lock', { v: 0.8 });
    c(2.75, 'tension', { d: T.forma - 2.75 });
    c(T.forma - 0.32, 'suck', { d: 0.32 });
    // FORMA
    c(T.forma, 'drop', { v: 1 }); c(T.forma, 'slash', { v: 1, dir: 1 });
    c(T.forma + 0.02, 'shatter', { v: 1 });
    for (let i = 0; i < 7; i++) c(T.forma + 0.18 + i * 0.035, 'slice', { k: i, pan: (i - 3) / 4 });
    c(T.forma + 0.25, 'settle', { d: 0.9 });
    c(T.forma + 0.1, 'kicker', { n: 9, d: 0.3 });
    c(bar(3, 1), 'guide', { k: 0 }); c(bar(3, 2), 'guide', { k: 1 }); c(bar(3, 3), 'guide', { k: 2 });
    c(bar(4), 'extrude', { d: 0.7 });
    c(WIPE[0], 'wipe', { d: WIPE[1] - WIPE[0] });
    c(T.codigo, 'slash', { v: 0.8, dir: 1 });
    // CÓDIGO
    c(T.codigo + 0.12, 'kicker', { n: 4, d: 0.2 });
    c(bar(5, 1), 'chev', { k: 0, pan: -0.6 }); c(bar(5, 2), 'chev', { k: 1, pan: 0.6 });
    c(bar(5, 3), 'slash', { v: 1, dir: -1, big: true });
    c(bar(6), 'word', { n: 6 });
    for (let k = 0; k < 8; k++) { const tt = bar(6, 1) + k * S16 + 1e-4; if (hash(Math.floor(tt / S16), 5) > 0.45) c(tt, 'glitch', { k }); }
    c(DIVE[0], 'dive', { d: DIVE[1] - DIVE[0] });
    c(DIVE[1], 'warp', { d: T.sites - DIVE[1] });
    // SITES
    c(T.sites, 'exit', { v: 1 });
    for (let i = 0; i < NP; i++) c(T.sites + 0.04 + i * S16, 'panel', { k: i, pan: clamp(L_STACK[i][0] / 600, -1, 1) });
    c(T.sites + 0.2, 'kicker', { n: 18, d: 0.45 });
    c(bar(7, 2), 'word', { n: 4 }); c(bar(7, 3), 'word', { n: 7 });
    c(bar(8), 'sheen', { d: 1.2 });
    for (let b = 0; b < 8; b++) c(bar(8) + b * BT, 'tick', { k: b });
    // EXPERIÊNCIAS
    c(T.exp - 0.2, 'cut', { v: 0.8 });
    MORPH.forEach((tm, k) => c(tm, 'morph', { k }));
    c(T.exp + 0.04, 'word', { n: 7 }); c(T.exp + BT + 0.04, 'word', { n: 5 }); c(T.exp + 2 * BT + 0.04, 'word', { n: 8 });
    c(bar(10, 3), 'sheen', { d: 0.9 });
    // CONVERGÊNCIA
    c(T.conv, 'cut', { v: 1 });
    c(T.conv, 'vortex', { d: COLLAPSE - T.conv });
    for (let i = 0; i < 10; i++) c(T.conv + 0.25 + i * 0.13, 'pass', { k: i, pan: (hash(i, 77) - 0.5) * 1.6 });
    c(COLLAPSE, 'suck', { d: T.marca - COLLAPSE });
    // MARCA
    c(T.marca, 'logo', { v: 1 });
    c(T.marca + 0.28, 'reveal', { d: 0.58 });
    c(T.marca + 1.0, 'glint', { d: 0.65 });
    c(bar(12, 3), 'kicker', { n: 31, d: 0.6 });
    c(URL_T, 'url', { n: 19, st: 0.03 });
    c(URL_T + 0.62, 'frame', { d: 0.53 });
    c(bar(14, 1.5), 'glint', { d: 0.6 });
  }

  // ================================================================ pós: bloom, vinheta e grão
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
    // bloom: o quadro reduzido multiplicado por ele mesmo (limiar suave que mantém o matiz),
    // desfocado e composto por "lighten": acende o entorno dos brilhos sem desbotar a cor deles
    const a0 = BL0.getContext('2d'), a1 = BL1.getContext('2d'), a2 = BL2.getContext('2d');
    a0.globalCompositeOperation = 'copy'; a0.drawImage(ctx.canvas, 0, 0, 270, 480);
    a1.globalCompositeOperation = 'copy'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
    a1.globalCompositeOperation = 'multiply'; a1.filter = 'blur(3px)'; a1.drawImage(BL0, 0, 0); a1.filter = 'none';
    a2.globalCompositeOperation = 'copy'; a2.filter = 'blur(6px) brightness(1.3)'; a2.drawImage(BL1, 0, 0, 135, 240); a2.filter = 'none';
    ctx.globalCompositeOperation = 'lighten';
    ctx.globalAlpha = 0.4; ctx.filter = 'brightness(1.1)'; ctx.drawImage(BL1, 0, 0, W, H); ctx.filter = 'none';
    ctx.globalAlpha = 0.58; ctx.drawImage(BL2, 0, 0, W, H);
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.12; ctx.drawImage(BL2, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = VIG; ctx.fillRect(0, 0, W, H);
    // grão de filme (determinístico por quadro)
    const f = Math.floor(t * 60 + 1e-6);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.16;
    const ox = -Math.floor(hash(f, 1) * 384), oy = -Math.floor(hash(f, 2) * 384);
    for (let y = oy; y < H; y += 384) for (let x = ox; x < W; x += 384) ctx.drawImage(GRAIN, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  FZD.define({
    id: 'reel-00',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    // obturador: 4 amostras em 1/120 s; mais amostras nas passagens rápidas
    blur: {
      default: [4, 1 / 120],
      ranges: [
        [0, 0.45, 10, 1 / 60],
        [T.forma - 0.1, T.forma + 1.0, 10, 1 / 60],
        [WIPE[0], WIPE[1], 18, 1 / 60],
        [bar(5, 1) - 0.4, bar(5, 3) + 0.3, 8, 1 / 70],
        [DIVE[0], T.sites + 0.7, 10, 1 / 60],
        ...MORPH.map((m) => [m - 0.05, m + 0.55, 8, 1 / 70]),
        [T.conv, T.marca + 0.6, 10, 1 / 60],
        [URL_T, URL_T + 0.9, 6, 1 / 90],
      ],
    },
    setup(api) {
      B = api.brand; C = B.color; DISPLAY = B.font.display; TEXT = B.font.text; LOGO = api.assets.logo;
      buildParticles(); buildCode(); buildSwarm(); buildLogo();
    },
    frame(ctx, t) { frame(ctx, t); },
    post,
    cover(ctx) { cover(ctx); },
    cues,
  });
})();
