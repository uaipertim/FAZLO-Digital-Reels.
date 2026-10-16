/* =====================================================================
   FAZLO Digital — "Instagram não é site" · corte curto (15 s)

   Versão curta do Reel "Instagram não é site", para a estratégia de volume:
   um gancho novo no quadro 0 (vale como capa) e três trechos do Reel
   original, sem redesenhar nada. O motion vem do próprio Reel
   (reels/instagram-nao-e-site/src/anim.js, carregado antes deste arquivo).

     0,0–1,8    gancho novo: TEM VAGA? QUANTO É? / FICOU NO DIRECT.
     1,8–4,8    original 6,6–9,6: os balões chegam no direct
     4,8–9,0    original 16,8–21,0: a barra lima varre, o celular vira site
     9,0–15,0   original 27,0–33,0: O INSTAGRAM ATRAI. O SITE RESPONDE. + logo e CTA
   Nos cortes de 1,8 s e 9,0 s, a barra lima da marca atravessa a tela.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog: p, ease: E, kick } = U;
  const TAU = Math.PI * 2, SK = 0.966;
  const DISPLAY = "'FZD Display'";
  const C = { bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', ink: '#0A0C0C' };
  const SEG = [                                   // [início no corte, início no original, fim no corte]
    [1.8, 6.6, 4.8],
    [4.8, 16.8, 9.0],
    [9.0, 27.0, 15.0],
  ];
  const WIPES = [1.8, 9.0], WIPE_D = 0.3;
  const HOOK = { a: ['TEM VAGA?', 'QUANTO É?'], b1: 'FICOU NO', b2: 'DIRECT.', knock: 0.6 };
  const DURATION = 15.0;
  let ORIG = null, S = 0;

  const M = document.createElement('canvas').getContext('2d');
  function measure(s, size, ls = 0) { M.font = `900 ${size}px ${DISPLAY}`; M.letterSpacing = `${ls}px`; return M.measureText(s).width - ls; }
  function text(c, s, x, y, size, color) {
    c.font = `900 ${size}px ${DISPLAY}`; c.letterSpacing = `${-0.02 * size}px`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = color; c.fillText(s, x, y);
  }
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }
  // o título do gancho em três linhas: TEM VAGA? / QUANTO É? / FICOU NO [DIRECT.] (DIRECT. num bloco lima, como o INSTAGRAM. do original)
  function hookTitle(c, cx, cy, size, hl, sc = 1) {
    const ls = -0.02 * size, lh = size * 1.14, sp = measure(' ', size, ls);
    const w1 = measure(HOOK.b1, size, ls), w2 = measure(HOOK.b2, size, ls);
    c.save(); c.translate(cx, cy); c.scale(sc, sc);
    const y0 = -lh + size * 0.36;
    HOOK.a.forEach((s, i) => text(c, s, -measure(s, size, ls) / 2, y0 + i * lh, size, C.white));
    const y2 = y0 + 2 * lh, x0 = -(w1 + sp + w2) / 2, bx = x0 + w1 + sp;
    text(c, HOOK.b1, x0, y2, size, C.white);
    if (hl > 0) { c.fillStyle = C.lime; c.fillRect(bx - 14, y2 - size * 0.86, (w2 + 24) * hl, size * 1.04); }
    text(c, HOOK.b2, bx, y2, size, C.white);
    if (hl > 0) { c.save(); c.beginPath(); c.rect(bx - 14, y2 - size * 0.86, (w2 + 24) * hl, size * 1.04); c.clip(); text(c, HOOK.b2, bx, y2, size, C.ink); c.restore(); }
    c.restore();
  }
  const fitHook = (maxW, max) => { let z = max; while (z > 40 && Math.max(...HOOK.a.map((s) => measure(s, z, -0.02 * z)), measure(HOOK.b1 + ' ' + HOOK.b2, z, -0.02 * z) + 24) > maxW) z -= 1; return z; };
  function hook(c, t) {
    background(c, t);
    const push = 1 + 0.03 * p(t, 0, 1.8);
    const k = 0.04 * kick(t, HOOK.knock, 0.35) * Math.cos((t - HOOK.knock) * 38);
    hookTitle(c, 525, 900, S, E.outCubic(p(t, HOOK.knock, HOOK.knock + 0.3)), push * (1 + k));
  }
  function wipe(c, t) {
    for (const w0 of WIPES) {
      const u = p(t, w0 - WIPE_D / 2, w0 + WIPE_D / 2);
      if (u <= 0 || u >= 1) continue;
      const e = E.inOutCubic(u), h = 2400, bw = lerp(120, 900, Math.sin(Math.PI * u)), x = lerp(-1400, W + 1400, e), y = H / 2, dx = SK * h / 2;
      c.save();
      c.beginPath(); c.moveTo(x + dx - bw / 2, y - h / 2); c.lineTo(x + dx + bw / 2, y - h / 2); c.lineTo(x - dx + bw / 2, y + h / 2); c.lineTo(x - dx - bw / 2, y + h / 2); c.closePath();
      c.fillStyle = C.lime; c.fill();
      c.restore();
    }
  }
  const src = (t) => { for (const [a, o, b] of SEG) if (t >= a && t < b) return o + (t - a); return null; };

  FZD.define({
    id: 'instagram-nao-e-site-corte',
    duration: DURATION,
    sections: { gancho: 0, baloes: 1.8, site: 4.8, sintese: 9.0 },
    blur: { default: [1, 0], ranges: [[1.55, 2.05, 12, 1 / 90], [8.75, 9.25, 12, 1 / 90]] },
    setup(api) {
      ORIG = FZD.get('instagram-nao-e-site');
      ORIG.init({});
      S = fitHook(820, 118);
    },
    frame(c, t) {
      const ts = src(t);
      if (ts === null) hook(c, t);
      else ORIG.renderAt(c, ts);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      wipe(c, t);
    },
    cover(c, api) {
      background(c, 0);
      const lg = api.assets.logo, lw = 380, lh = lw * lg.naturalHeight / lg.naturalWidth;
      c.drawImage(lg, 540 - lw / 2, 360 - lh / 2, lw, lh);           // logo no topo, ao centro (como a capa do original)
      hookTitle(c, 540, 960, fitHook(860, 124), 1);
    },
    cues(api) {
      api.cue(HOOK.knock, 'knock');
      WIPES.forEach((w) => api.cue(w, 'wipe'));
    },
  });
})();
