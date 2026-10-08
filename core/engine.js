/* =====================================================================
   FAZLO Digital — motor de motion graphics (Canvas 2D, 1080x1920)

   Compartilhado por todos os Reels. Cada Reel registra a sua animação com
   FZD.define({...}) e o motor cuida do resto:

     - renderAt(ctx, t)  quadro exato do instante t (determinístico), com
                         motion blur real por subamostragem do obturador e
                         pós-processamento opcional (post) sobre o quadro final;
     - renderCover(ctx)  capa 1080x1920;
     - cues()            eventos de som tirados da animação (audio/cues.json),
                         que a trilha usa para cair no quadro certo.

   O mesmo código serve o preview (core/player.html), o render quadro a
   quadro (tools/render.cjs) e a lista de cues.
   ===================================================================== */
(function () {
  'use strict';

  const W = 1080, H = 1920, FPS = 60;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- matemática
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));           // 0→1 entre a e b
  const remap = (x, a, b, c, d) => lerp(c, d, prog(x, a, b));
  const deg = (d) => (d * Math.PI) / 180;
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

  const ease = {
    linear: (x) => x,
    inQuad: (x) => x * x,
    outQuad: (x) => 1 - (1 - x) * (1 - x),
    inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    inCubic: (x) => x * x * x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: (x) => 1 - Math.pow(1 - x, 4),
    inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
    outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
  };
  // progresso com curva: tw(t, a, b, 'outCubic')
  const tw = (t, a, b, e = 'inOutCubic') => ease[e](prog(t, a, b));

  // mola amortecida (resposta a um impulso em t0): 0 → 1 com overshoot
  function spring(t, t0, { freq = 4.5, damp = 0.35 } = {}) {
    if (t <= t0) return 0;
    const x = t - t0, w = TAU * freq;
    return 1 - Math.exp(-damp * w * x) * Math.cos(w * Math.sqrt(1 - damp * damp) * x);
  }
  // pulso que decai depois de t0 (impactos, flashes, tremores)
  const kick = (t, t0, dur = 0.25) => (t < t0 ? 0 : Math.exp(-((t - t0) / dur) * 4));

  // ---------------------------------------------------------------- aleatoriedade determinística
  function hash(i, j = 0) {
    let h = (i * 374761393 + j * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function rng(seed = 1) {                                       // mulberry32
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const noise1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i; return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, f * f * (3 - 2 * f)); };

  // ---------------------------------------------------------------- tempo musical
  function tempo(bpm) {
    const BT = 60 / bpm, BAR = 4 * BT;
    return { bpm, BT, BAR, S16: BT / 4, bar: (n, beats = 0) => (n - 1) * BAR + beats * BT };
  }

  // ---------------------------------------------------------------- cor
  function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b); t = clamp(t);
    return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
  }
  function rgba(c, a) { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${clamp(a)})`; }

  // ---------------------------------------------------------------- primitivas de desenho
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); }
  function fill(ctx, color) { ctx.fillStyle = color; ctx.fill(); }
  function stroke(ctx, color, lw) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
  function glow(ctx, x, y, r, color, a) {
    if (a <= 0.002 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.45, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // executa fn com save/restore e (opcionalmente) translate/rotate/scale/alpha
  function layer(ctx, { x = 0, y = 0, rot = 0, sx = 1, sy = sx, alpha = 1 } = {}, fn) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.translate(x, y); if (rot) ctx.rotate(rot); if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.globalAlpha *= alpha;
    fn(ctx);
    ctx.restore();
  }

  // ---------------------------------------------------------------- texto
  const fontStr = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(ctx, s, { fam, size, weight = 700, ls = 0 }) {
    ctx.font = fontStr(fam, size, weight); ctx.letterSpacing = `${ls}px`;
    const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
    return w;
  }
  // text(ctx, 'Olá', 540, 900, { fam, size: 96, weight: 800, color, align: 'center', ls: -2, alpha })
  function text(ctx, s, x, y, { fam, size, weight = 700, color = '#fff', align = 'left', base = 'alphabetic', ls = 0, alpha = 1 } = {}) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = fontStr(fam, size, weight); ctx.letterSpacing = `${ls}px`;
    ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color;
    ctx.fillText(s, x, y);
    ctx.restore();
  }

  // ---------------------------------------------------------------- registro de Reels
  const REELS = {};
  let current = null;

  function define(spec) {
    if (!spec.id || !spec.duration || !spec.frame) throw new Error('FZD.define: id, duration e frame são obrigatórios');
    const reel = makeReel(spec);
    REELS[spec.id] = reel; current = reel;
    return reel;
  }

  function makeReel(spec) {
    const DURATION = spec.duration;
    const blur = spec.blur || {};
    const [defN, defDt] = blur.default || [4, 1 / 120];          // obturador padrão: 4 amostras em 1/120 s
    const ranges = blur.ranges || [];                            // [[t0, t1, amostras, abertura]]
    const CUES = [], SHAKES = [];
    let ready = false;

    const api = { W, H, FPS, DURATION, assets: {}, brand: window.FZD_BRAND || {}, cue, shake, shakeAt };

    function cue(t, type, data = {}) { CUES.push({ t: +t.toFixed(4), type, ...data }); }
    // tremor de câmera: shake(t0, amplitude_px, duração_s)
    function shake(t0, amp, dur) { SHAKES.push([t0, amp, dur]); }
    function shakeAt(t) {
      let x = 0, y = 0;
      for (const [t0, amp, dur] of SHAKES) {
        if (t < t0 || t > t0 + dur * 1.5) continue;
        const k = kick(t, t0, dur) * amp;
        x += noise1((t - t0) * 38, 11) * k; y += noise1((t - t0) * 38, 23) * k;
      }
      return { x, y };
    }

    function init(assets = {}) {
      api.assets = assets;
      CUES.length = 0; SHAKES.length = 0;
      if (spec.setup) spec.setup(api);
      if (spec.cues) spec.cues(api);
      CUES.sort((a, b) => a.t - b.t);
      ready = true;
    }

    function frame(ctx, t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      spec.frame(ctx, t, api);
    }

    function shutter(t) {
      for (const [a, b, n, dt] of ranges) if (t >= a && t < b) return { n, dt };
      return { n: defN, dt: defDt };
    }

    let bufS = null, bufA = null;
    function buffers() {
      if (!bufS) { const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }; bufS = mk(); bufA = mk(); }
      return [bufS, bufA];
    }

    // motion blur: média de n subquadros espalhados numa janela dt centrada em t
    function renderAt(ctx, t, o = {}) {
      if (!ready) throw new Error(`${spec.id}: init() ainda não foi chamado`);
      t = clamp(t, 0, DURATION - 1e-4);
      const sh = o.noBlur ? { n: 1 } : shutter(t);
      if (sh.n <= 1) { frame(ctx, t); post(ctx, t); return; }
      const [S, A] = buffers();
      const sctx = S.getContext('2d'), actx = A.getContext('2d');
      actx.setTransform(1, 0, 0, 1, 0, 0); actx.globalCompositeOperation = 'source-over';
      for (let k = 0; k < sh.n; k++) {
        frame(sctx, clamp(t + (k / (sh.n - 1) - 0.5) * sh.dt, 0, DURATION - 1e-4));
        actx.globalAlpha = 1 / (k + 1);                          // média acumulada
        actx.drawImage(S, 0, 0);
      }
      actx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(A, 0, 0);
      post(ctx, t);
    }

    // pós-processamento sobre o quadro final, depois do motion blur (bloom, grão...)
    function post(ctx, t) {
      if (!spec.post) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      spec.post(ctx, t, api);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    }

    function renderCover(ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (spec.cover) spec.cover(ctx, api);
      else frame(ctx, spec.coverAt ?? DURATION * 0.5);
      post(ctx, spec.coverAt ?? DURATION * 0.5);
    }

    return {
      id: spec.id, DURATION, W, H, FPS, api, init, renderAt, renderCover,
      cues: () => ({ id: spec.id, bpm: spec.bpm || null, fps: FPS, duration: DURATION, sections: spec.sections || {}, cues: CUES.slice() }),
    };
  }

  window.FZD = {
    W, H, FPS, TAU, define, get: (id) => REELS[id], current: () => current,
    U: {
      clamp, lerp, prog, remap, deg, smooth, ease, tw, spring, kick, hash, rng, noise1, tempo,
      hex, mix, rgba, rr, circle, fill, stroke, glow, layer, measure, text, fontStr,
    },
  };
})();
