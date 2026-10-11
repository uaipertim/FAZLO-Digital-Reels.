/* =====================================================================
   FAZLO Digital — "Instagram não é site" — 9:16 (1080x1920, 60 fps), 33,6 s

   100% motion graphics de interface: celular, perfil genérico, balões de
   direct, relógio, site no celular + navegador. Nenhuma pousada real, nenhum
   nome, nenhum número inventado (o "dia 20" vem da própria pergunta).

   100 BPM · 1 tempo = 0,6 s
     1 gancho     0,0–4,2    O HÓSPEDE ACHOU SUA POUSADA NO INSTAGRAM. -> E AGORA?
     2 perguntas  4,2–12,0   perfil no celular; 4 balões se acumulam;
                             AS FOTOS ENCANTAM. / AS RESPOSTAS FICAM NO DIRECT.
     3 espera     12,0–16,8  balões parados, "aguardando", relógio girando;
                             ENQUANTO NINGUÉM RESPONDE, ELE CONTINUA PROCURANDO.
     4 virada     16,8–27,0  a barra lima varre; o celular vira site (+ navegador);
                             cada balão voa até a seção que responde a pergunta
                             (período -> consultar -> reserva);
                             NO SITE, CADA PERGUNTA JÁ TEM LUGAR.
     5 síntese    27,0–30,6  Instagram | site; O INSTAGRAM ATRAI. O SITE RESPONDE.
     6 fechamento 30,6–33,6  logo FAZLO DIGITAL (SVG do kit, montada pelas formas),
                             Sites para pousadas e negócios locais · Fale com a FAZLO · link na bio

   Fontes oficiais: Unbounded (títulos, 800/900) e Sora (textos e telas).
   Verde-limão oficial do kit: #C6FA41.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, spring, hash, rng, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 100;
  const { BT } = U.tempo(BPM);                      // 0,6 s
  const b = (n) => +(n * BT).toFixed(4);            // instante do tempo n (contado a partir de 0)
  const T = { gancho: 0, perguntas: b(7), espera: b(20), virada: b(28), sintese: b(45), fecho: b(51) };
  const DURATION = b(56);                            // 33,6 s
  const BUB_T = [5.4, 6.6, 7.8, 9.0];               // os balões surgem
  const DOCK = [18.6, 20.7, 21.9, 23.1];            // cada balão chega à sua seção
  const FLY = 0.6;                                   // duração do voo
  const PICK = { open: 18.85, day: 19.2, fill: 19.4, close: 19.55, press: 19.8 };
  const TAP = 23.4;                                  // toque no botão Reservar

  // ---------------------------------------------------------------- cores e fontes
  let DISPLAY, TEXT;
  const C = {
    bg: '#050606', black: '#000000', lime: '#C6FA41', white: '#FFFFFF',
    surf: '#0C0E0E', card: '#141717', card2: '#1B1F1F', line: '#2A2F2F', bar: '#353B3B', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C',
  };
  const SK = 0.966;                                   // inclinação da barra da marca (dx/dy)

  // ---------------------------------------------------------------- texto
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, fam, size, weight, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function fit(lines, fam, weight, maxW, maxSize, lsK = 0) { let z = maxSize; while (z > 10 && lines.some((s) => measure(s, fam, z, weight, z * lsK) > maxW)) z -= 1; return z; }
  function text(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save(); c.globalAlpha *= clamp(a);
    c.font = fnt(o.fam || TEXT, o.size, o.weight || 600); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic'; c.fillStyle = o.color || C.white;
    c.fillText(s, x, y); c.restore();
  }
  // bloco de título: palavras sobem de uma fenda (uma por vez); saem para cima em t1
  function titleBlock(c, lines, t, t0, t1, o) {
    if (t < t0 || t > t1 + 0.7) return;
    const size = o.size, lh = size * (o.lh || 1.14), ls = -size * 0.02, wt = o.weight || 900;
    let k = 0;
    lines.forEach((line, li) => {
      const y = o.y + li * lh;
      const words = line.split(' ');
      const total = measure(line, DISPLAY, size, wt, ls);
      let x = (o.x ?? W / 2) - (o.align === 'left' ? 0 : total / 2);
      const sp = measure(' ', DISPLAY, size, wt, ls);
      c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, 3 * W, size * 1.32); c.clip();
      for (const w of words) {
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
      case 'heart':
        c.moveTo(0, 0.38); c.bezierCurveTo(-0.55, 0.0, -0.55, -0.42, -0.2, -0.42); c.bezierCurveTo(-0.08, -0.42, 0, -0.32, 0, -0.24);
        c.bezierCurveTo(0, -0.32, 0.08, -0.42, 0.2, -0.42); c.bezierCurveTo(0.55, -0.42, 0.55, 0.0, 0, 0.38); c.closePath(); break;
      case 'pin':
        c.moveTo(0, 0.45); c.bezierCurveTo(-0.38, 0.05, -0.36, -0.1, -0.36, -0.12); c.arc(0, -0.12, 0.36, Math.PI, 0); c.bezierCurveTo(0.36, -0.1, 0.38, 0.05, 0, 0.45); c.closePath();
        c.moveTo(0.13, -0.12); c.arc(0, -0.12, 0.13, 0, TAU); break;
      case 'plane':
        c.moveTo(-0.42, -0.05); c.lineTo(0.42, -0.36); c.lineTo(0.18, 0.4); c.lineTo(0.02, 0.06); c.closePath(); c.moveTo(0.02, 0.06); c.lineTo(0.42, -0.36); break;
      case 'search':
        c.arc(-0.06, -0.06, 0.28, 0, TAU); c.moveTo(0.14, 0.14); c.lineTo(0.4, 0.4); break;
      case 'check':
        c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'camera':
        c.roundRect(-0.42, -0.42, 0.84, 0.84, 0.22); c.moveTo(0.2, 0); c.arc(0, 0, 0.2, 0, TAU); c.moveTo(0.29, -0.26); c.arc(0.26, -0.26, 0.03, 0, TAU); break;
      case 'child':
        c.arc(0, -0.25, 0.13, 0, TAU); c.moveTo(0, -0.1); c.lineTo(0, 0.18); c.moveTo(-0.22, -0.02); c.lineTo(0.22, -0.02); c.moveTo(0, 0.18); c.lineTo(-0.15, 0.42); c.moveTo(0, 0.18); c.lineTo(0.15, 0.42); break;
      case 'clock':
        c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0, 0); c.lineTo(0, -0.22); c.moveTo(0, 0); c.lineTo(0.15, 0.06); break;
      case 'paw':
        c.ellipse(0, 0.14, 0.17, 0.14, 0, 0, TAU); [[-0.24, -0.08], [-0.09, -0.24], [0.09, -0.24], [0.24, -0.08]].forEach(([px, py]) => { c.moveTo(px + 0.065, py); c.arc(px, py, 0.065, 0, TAU); }); break;
      case 'cal':
        c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'lock':
        c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'menu':
        c.moveTo(-0.32, -0.2); c.lineTo(0.32, -0.2); c.moveTo(-0.32, 0); c.lineTo(0.32, 0); c.moveTo(-0.32, 0.2); c.lineTo(0.32, 0.2); break;
      case 'back':
        c.moveTo(0.12, -0.28); c.lineTo(-0.16, 0); c.lineTo(0.12, 0.28); break;
      case 'dots':
        [-0.25, 0, 0.25].forEach((px) => { c.moveTo(px + 0.05, 0); c.arc(px, 0, 0.05, 0, TAU); }); c.fill(); c.restore(); return;
      case 'arrow':
        c.moveTo(-0.3, 0.3); c.lineTo(0.3, -0.3); c.moveTo(-0.05, -0.3); c.lineTo(0.3, -0.3); c.lineTo(0.3, 0.05); break;
      case 'bed':
        c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'wave':
        for (let k = 0; k < 2; k++) { c.moveTo(-0.4, -0.08 + k * 0.2); c.bezierCurveTo(-0.2, -0.2 + k * 0.2, 0, 0.04 + k * 0.2, 0.2, -0.08 + k * 0.2); c.lineTo(0.4, -0.08 + k * 0.2); } break;
      case 'sun':
        c.arc(0, 0, 0.16, 0, TAU); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; c.moveTo(Math.cos(a) * 0.26, Math.sin(a) * 0.26); c.lineTo(Math.cos(a) * 0.38, Math.sin(a) * 0.38); } break;
      case 'leaf':
        c.moveTo(-0.3, 0.3); c.bezierCurveTo(-0.3, -0.2, 0.0, -0.36, 0.34, -0.34); c.bezierCurveTo(0.32, 0.0, 0.16, 0.3, -0.3, 0.3); c.moveTo(-0.3, 0.3); c.lineTo(0.12, -0.1); break;
      case 'cup':
        c.moveTo(-0.28, -0.12); c.lineTo(-0.22, 0.26); c.lineTo(0.16, 0.26); c.lineTo(0.22, -0.12); c.closePath(); c.moveTo(0.22, -0.04); c.arc(0.28, 0.06, 0.1, -Math.PI / 2, Math.PI / 2); break;
      case 'grid':
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.rect(-0.3 + i * 0.21, -0.3 + j * 0.21, 0.17, 0.17); break;
      case 'signal':
        for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery':
        c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function heartFill(c, x, y, s, color, a = 1) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); c.fillStyle = color; c.beginPath();
    c.moveTo(0, 0.38); c.bezierCurveTo(-0.55, 0.0, -0.55, -0.42, -0.2, -0.42); c.bezierCurveTo(-0.08, -0.42, 0, -0.32, 0, -0.24);
    c.bezierCurveTo(0, -0.32, 0.08, -0.42, 0.2, -0.42); c.bezierCurveTo(0.55, -0.42, 0.55, 0.0, 0, 0.38); c.fill(); c.restore();
  }
  function checkBadge(c, x, y, r, a = 1) {
    if (a <= 0.01 || r <= 0.5) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = C.lime; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    icon(c, 'check', x, y + r * 0.04, r * 1.6, C.ink, 0.13); c.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }

  // ---------------------------------------------------------------- fundo
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    // grade de pontos que respira
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.005) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  // ---------------------------------------------------------------- celular
  const PH = { w: 460, h: 930 };
  function phoneFrame(c, x, y, s, drawScreen, o = {}) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
    rrect(c, 0, 0, PH.w, PH.h, 62); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, 0, 0, PH.w, PH.h, 62); c.lineWidth = 3; c.strokeStyle = o.edge || '#30363A'; c.stroke();
    rrect(c, 5, 5, PH.w - 10, PH.h - 10, 58); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.06)'; c.stroke();
    c.save(); rrect(c, 14, 14, PH.w - 28, PH.h - 28, 50); c.clip(); c.translate(14, 14);
    c.fillStyle = '#070808'; c.fillRect(0, 0, PH.w - 28, PH.h - 28);
    drawScreen(c, PH.w - 28, PH.h - 28);
    c.restore();
    rrect(c, PH.w / 2 - 58, 28, 116, 32, 16); c.fillStyle = '#000'; c.fill();     // ilha
    c.restore();
  }
  function statusBar(c, w) {
    icon(c, 'signal', w - 120, 30, 26, C.white); icon(c, 'battery', w - 52, 30, 34, C.white, 0.07);
  }

  // ---------------------------------------------------------------- "fotos" abstratas (sem lugar real)
  function tile(c, k, x, y, w, h, t) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.translate(x, y);
    const g = (c0, c1) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, 0, w, h); };
    const sh = Math.sin(t * 0.8 + k) * 3;
    switch (k) {
      case 0: g('#F2A36B', '#7A4C8A'); c.fillStyle = '#FFD58C'; c.beginPath(); c.arc(w * 0.5, h * 0.55 + sh, Math.min(w, h * 1.4) * 0.16, 0, TAU); c.fill(); c.fillStyle = '#29425F'; c.fillRect(0, h * 0.62, w, h); c.fillStyle = 'rgba(255,213,140,0.5)'; for (let i = 0; i < 4; i++) c.fillRect(w * (0.32 + 0.03 * i), h * (0.67 + 0.07 * i), w * (0.36 - 0.06 * i), 2); break;
      case 1: g('#5EC2CF', '#2C7E95'); c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); for (let xx = 0; xx <= w; xx += 6) c.lineTo(xx, h * (0.25 + 0.18 * i) + Math.sin(xx * 0.08 + t * 2 + i) * 3); c.stroke(); } c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.86, w, h); break;
      case 2: g('#E9DAC5', '#D7C3A8'); c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.12, h * 0.42, w * 0.76, h * 0.12); c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.12, h * 0.54, w * 0.76, h * 0.22); c.fillStyle = '#F4EFE8'; c.fillRect(w * 0.18, h * 0.47, w * 0.22, h * 0.09); c.fillRect(w * 0.6, h * 0.47, w * 0.22, h * 0.09); c.fillStyle = '#C9B08F'; c.fillRect(0, h * 0.76, w, h); break;
      case 3: g('#A6DBE6', '#E8F3EE'); c.strokeStyle = '#2F6B4F'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.3, h); c.quadraticCurveTo(w * 0.32, h * 0.6, w * 0.45, h * 0.3); c.stroke(); c.fillStyle = '#2F6B4F'; for (let i = 0; i < 5; i++) { c.save(); c.translate(w * 0.45, h * 0.3); c.rotate(-1.2 + i * 0.55 + Math.sin(t + i) * 0.05); c.beginPath(); c.ellipse(w * 0.2, 0, w * 0.22, h * 0.05, 0, 0, TAU); c.fill(); c.restore(); } c.fillStyle = '#E3D2B0'; c.fillRect(0, h * 0.85, w, h); break;
      case 4: g('#D9B48A', '#B98F63'); c.fillStyle = '#F7F2EA'; c.beginPath(); c.ellipse(w * 0.5, h * 0.62, w * 0.3, h * 0.12, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.4, h * 0.38, w * 0.2, h * 0.2); c.fillStyle = '#7B4B2A'; c.fillRect(w * 0.42, h * 0.4, w * 0.16, h * 0.05); break;
      case 5: g('#CFE3EE', '#9DB6C9'); c.fillStyle = '#6F8FAF'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.35, h * 0.35); c.lineTo(w * 0.7, h); c.fill(); c.fillStyle = '#44607E'; c.beginPath(); c.moveTo(w * 0.3, h); c.lineTo(w * 0.7, h * 0.45); c.lineTo(w * 1.1, h); c.fill(); break;
      case 6: g('#4E8A5A', '#2E5E3B'); for (let i = 0; i < 14; i++) { c.fillStyle = i % 3 ? '#F2C14E' : '#F4F1E6'; c.beginPath(); c.arc(w * hash(i, 3), h * (0.3 + 0.65 * hash(i, 5)), 3 + 3 * hash(i, 7), 0, TAU); c.fill(); } break;
      case 7: g('#F1E3CF', '#E6D3B8'); c.fillStyle = '#6B8BA4'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) c.fillRect(w * (0.16 + 0.42 * i), h * (0.18 + 0.32 * j), w * 0.26, h * 0.2); c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.42, h * 0.62, w * 0.16, h * 0.38); break;
      default: g('#1D2440', '#2B3560'); for (let i = 0; i < 10; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`; c.fillRect(w * hash(i, 9), h * 0.5 * hash(i, 11), 2, 2); } c.fillStyle = '#121729'; c.fillRect(0, h * 0.6, w, h); c.fillStyle = '#F7C873'; for (let i = 0; i < 4; i++) c.fillRect(w * (0.12 + 0.22 * i), h * 0.7, w * 0.1, h * 0.08); break;
    }
    c.restore();
  }

  // ---------------------------------------------------------------- tela: perfil genérico do Instagram
  function igScreen(c, w, h, t, o = {}) {
    statusBar(c, w);
    icon(c, 'back', 26, 78, 40); rrect(c, 58, 70, 150, 16, 8); c.fillStyle = C.bar; c.fill(); icon(c, 'dots', w - 34, 78, 40);
    const ax = 72, ay = 168;                                    // avatar com anel lima (genérico: sol sobre o mar)
    c.beginPath(); c.arc(ax, ay, 56, 0, TAU); c.lineWidth = 4; c.strokeStyle = C.lime; c.stroke();
    c.beginPath(); c.arc(ax, ay, 49, 0, TAU); c.fillStyle = '#1C2A3A'; c.fill();
    c.save(); c.beginPath(); c.arc(ax, ay, 49, 0, TAU); c.clip(); c.fillStyle = '#F2A36B'; c.beginPath(); c.arc(ax, ay + 6, 18, 0, TAU); c.fill(); c.fillStyle = '#29425F'; c.fillRect(ax - 50, ay + 10, 100, 50); c.restore();
    ['publicações', 'seguidores', 'seguindo'].forEach((lb, i) => {
      const cx = 196 + i * 92;
      rrect(c, cx - 22, 146, 44, 16, 8); c.fillStyle = '#4A5252'; c.fill();
      text(c, lb, cx, 192, { size: 14, weight: 400, color: C.muted, align: 'center' });
    });
    rrect(c, 20, 240, 160, 14, 7); c.fillStyle = '#5A6262'; c.fill();
    rrect(c, 20, 266, 300, 10, 5); c.fillStyle = C.bar; c.fill(); rrect(c, 20, 284, 230, 10, 5); c.fill();
    rrect(c, 18, 312, 192, 44, 12); c.fillStyle = C.lime; c.fill(); text(c, 'Seguir', 114, 341, { size: 18, weight: 600, color: C.ink, align: 'center' });
    rrect(c, 218, 312, 196, 44, 12); c.fillStyle = '#202525'; c.fill(); text(c, 'Mensagem', 316, 341, { size: 18, weight: 600, color: C.white, align: 'center' });
    if (o.dm > 0) { const r = 9 + 3 * o.dmPulse; c.beginPath(); c.arc(404, 316, r, 0, TAU); c.fillStyle = C.lime; c.fill(); }
    ['bed', 'wave', 'sun', 'leaf', 'cup'].forEach((ic, i) => {
      const cx = 50 + i * 83, cy = 410;
      c.beginPath(); c.arc(cx, cy, 30, 0, TAU); c.lineWidth = 2; c.strokeStyle = '#3A4242'; c.stroke();
      icon(c, ic, cx, cy, 34, C.soft, 0.08);
      rrect(c, cx - 20, 452, 40, 8, 4); c.fillStyle = '#2A3030'; c.fill();
    });
    icon(c, 'grid', w / 6, 492, 30, C.white, 0.07); c.fillStyle = C.white; c.fillRect(0, 512, w / 3, 2);
    icon(c, 'camera', w / 2, 492, 28, C.muted, 0.08); icon(c, 'heart', 5 * w / 6, 492, 28, C.muted, 0.09);
    const gw = (w - 4) / 3, gh = 126, gy = 516;
    for (let i = 0; i < 9; i++) tile(c, i, (i % 3) * (gw + 2), gy + Math.floor(i / 3) * (gh + 2), gw, gh, t);
    if (o.sweep > 0 && o.sweep < 1) {                            // brilho que passa pela grade
      const sx = lerp(-200, w + 200, o.sweep);
      const gr = c.createLinearGradient(sx - 90, 0, sx + 90, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.fillRect(0, gy, w, 3 * gh + 4);
    }
    for (let k = 0; k < 9; k++) {                               // corações saltam das fotos
      const t0 = 5.2 + k * 0.42 + hash(k, 2) * 0.2;
      const p = prog(t, t0, t0 + 0.9);
      if (p <= 0 || p >= 1 || t > 12.0) continue;
      const col = (k * 4) % 3, row = Math.floor(((k * 5) % 9) / 3);
      const hx = col * (gw + 2) + gw * (0.3 + 0.4 * hash(k, 4)), hy = gy + row * (gh + 2) + gh * 0.6 - p * 70;
      heartFill(c, hx, hy, 34 * E.outBack(Math.min(1, p * 3)), k % 3 ? C.white : C.lime, 1 - E.inCubic(p));
    }
    if (o.dim > 0) { c.fillStyle = `rgba(5,6,6,${0.55 * o.dim})`; c.fillRect(0, 0, w, h); }
  }

  // ---------------------------------------------------------------- tela: site genérico (celular)
  const MS = {                                                  // seções (coordenadas na tela do celular, 432 x 902)
    disp: { x: 14, y: 300, w: 404, h: 178 },
    card: { x: 14, y: 492, w: 404, h: 148 },
    rules: { x: 14, y: 654, w: 404, h: 160 },
    book: { x: 14, y: 826, w: 404, h: 62 },
  };
  function section(c, s, hl) {
    rrect(c, s.x, s.y, s.w, s.h, 18); c.fillStyle = C.card; c.fill();
    if (hl > 0) { rrect(c, s.x, s.y, s.w, s.h, 18); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, hl); c.stroke(); }
  }
  function siteScreen(c, w, h, t, st) {
    statusBar(c, w);
    rrect(c, 20, 60, 30, 30, 8); c.fillStyle = C.lime; c.fill();
    rrect(c, 60, 68, 96, 14, 7); c.fillStyle = '#5A6262'; c.fill();
    icon(c, 'menu', w - 36, 75, 40, C.white, 0.07);
    c.save(); rrect(c, 14, 106, w - 28, 180, 20); c.clip();
    { const kb = 1.05 + 0.04 * Math.sin(t * 0.6 + 1); c.save(); c.translate(w / 2, 196); c.scale(kb, kb); c.translate(-w / 2 + Math.sin(t * 0.5) * 10, -196); tile(c, 0, 14, 106, w - 28, 180, t); c.restore(); }
    const gr = c.createLinearGradient(0, 180, 0, 286); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = gr; c.fillRect(14, 106, w - 28, 180);
    rrect(c, 34, 236, 200, 16, 8); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill(); rrect(c, 34, 260, 140, 10, 5); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill();
    c.restore();
    // CONSULTAR DISPONIBILIDADE: só Entrada, Saída e o botão
    const D = MS.disp;
    section(c, D, st.hl[0]);
    const fw = (D.w - 36) / 2;
    [['Entrada', st.entrada], ['Saída', null]].forEach(([lb, val], i) => {
      const fx = D.x + 12 + i * (fw + 12), fy = D.y + 14;
      rrect(c, fx, fy, fw, 74, 12); c.fillStyle = C.card2; c.fill();
      if (i === 0 && st.fieldHl > 0) { rrect(c, fx, fy, fw, 74, 12); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, st.fieldHl); c.stroke(); }
      text(c, lb, fx + 16, fy + 28, { size: 17, weight: 500, color: C.muted });
      icon(c, 'cal', fx + fw - 26, fy + 24, 26, C.muted, 0.08);
      if (val && st.entradaA > 0) text(c, val, fx + 16, fy + 60, { size: 22, weight: 600, color: C.white, alpha: st.entradaA });
      else { rrect(c, fx + 16, fy + 48, 70, 8, 4); c.fillStyle = C.bar; c.fill(); }
    });
    const by = D.y + 100, bh = 62;
    rrect(c, D.x + 12, by, D.w - 24, bh, 14); c.fillStyle = st.press > 0.01 ? U.mix(C.lime, '#9CCB2E', st.press) : C.lime; c.fill();
    text(c, 'Consultar disponibilidade', D.x + D.w / 2, by + 39, { size: 21, weight: 600, color: C.ink, align: 'center' });
    if (st.ripple > 0 && st.ripple < 1) { c.save(); rrect(c, D.x + 12, by, D.w - 24, bh, 14); c.clip(); c.beginPath(); c.arc(D.x + D.w / 2, by + bh / 2, 40 + 260 * st.ripple, 0, TAU); c.fillStyle = `rgba(255,255,255,${0.35 * (1 - st.ripple)})`; c.fill(); c.restore(); }
    // ACOMODAÇÃO: "a partir de"
    const K = MS.card;
    section(c, K, st.hl[1]);
    c.save(); rrect(c, K.x + 12, K.y + 12, 124, K.h - 24, 12); c.clip(); tile(c, 2, K.x + 12, K.y + 12, 124, K.h - 24, t); c.restore();
    text(c, 'Acomodação', K.x + 154, K.y + 42, { size: 21, weight: 600, color: C.white });
    text(c, 'a partir de', K.x + 154, K.y + 78, { size: 18, weight: 500, color: st.hl[1] > 0 ? U.mix(C.muted, C.lime, clamp(st.hl[1])) : C.muted });
    text(c, 'R$', K.x + 154, K.y + 114, { size: 20, weight: 600, color: C.white });
    rrect(c, K.x + 186, K.y + 98, 74, 18, 9); c.fillStyle = '#4A5252'; c.fill();
    text(c, '/ noite', K.x + 270, K.y + 114, { size: 16, weight: 400, color: C.muted });
    if (st.hl[1] > 0) { c.fillStyle = rgba(C.lime, clamp(st.hl[1])); c.fillRect(K.x + 154, K.y + 86, 96 * clamp(st.hl[1] * 1.3), 3); }
    // REGRAS DA HOSPEDAGEM
    const R = MS.rules;
    section(c, R, st.hl[2]);
    text(c, 'Regras da hospedagem', R.x + 16, R.y + 36, { size: 21, weight: 600, color: C.white });
    [['child', 'Crianças'], ['clock', 'Entrada e saída'], ['paw', 'Animais']].forEach(([ic, lb], i) => {
      const ry = R.y + 64 + i * 32;
      const on = i === 0 ? clamp(st.hl[2]) : 0;
      if (on > 0) { rrect(c, R.x + 8, ry - 4, R.w - 16, 30, 8); c.fillStyle = rgba(C.lime, 0.16 * on); c.fill(); }
      icon(c, ic, R.x + 30, ry + 11, 26, on > 0 ? U.mix(C.soft, C.lime, on) : C.soft, 0.09);
      text(c, lb, R.x + 54, ry + 18, { size: 17, weight: 500, color: on > 0 ? U.mix(C.soft, C.white, on) : C.soft });
      rrect(c, R.x + 230, ry + 6, 150 - i * 30, 10, 5); c.fillStyle = on > 0 ? rgba(C.lime, 0.5 + 0.4 * on) : C.bar; c.fill();
    });
    // RESERVAR (barra fixa)
    const Bk = MS.book;
    if (st.hl[3] > 0) { rrect(c, Bk.x - 4, Bk.y - 4, Bk.w + 8, Bk.h + 8, 18); c.lineWidth = 3; c.strokeStyle = rgba(C.white, clamp(st.hl[3])); c.stroke(); }
    rrect(c, Bk.x, Bk.y, Bk.w, Bk.h, 14); c.fillStyle = st.tap > 0.01 ? U.mix(C.lime, '#9CCB2E', st.tap) : C.lime; c.fill();
    text(c, 'Reservar', Bk.x + Bk.w / 2, Bk.y + 40, { size: 22, weight: 700, color: C.ink, align: 'center' });
    if (st.tapR > 0 && st.tapR < 1) { c.save(); rrect(c, Bk.x, Bk.y, Bk.w, Bk.h, 14); c.clip(); c.beginPath(); c.arc(Bk.x + Bk.w * 0.62, Bk.y + 31, 30 + 300 * st.tapR, 0, TAU); c.fillStyle = `rgba(255,255,255,${0.4 * (1 - st.tapR)})`; c.fill(); c.restore(); }
    // fluxo: período -> consultar -> reserva
    if (st.flow > 0) {
      const x = w - 8, y0 = by + bh / 2, y1 = Bk.y + Bk.h / 2, yy = lerp(y0, y1, st.flow);
      c.save(); c.setLineDash([6, 8]); c.lineDashOffset = -t * 40; c.strokeStyle = rgba(C.lime, 0.85); c.lineWidth = 3;
      c.beginPath(); c.moveTo(D.x + D.w - 12, y0); c.lineTo(x, y0); c.lineTo(x, yy); if (st.flow >= 1) c.lineTo(Bk.x + Bk.w - 2, y1); c.stroke(); c.restore();
    }
    if (st.picker > 0) picker(c, D, st, t);                      // seletor compacto de período
  }
  function picker(c, D, st, t) {
    const px = D.x + 6, py = D.y + 96, pw = D.w - 12, ph = 330;
    c.save();
    c.translate(px, py); c.scale(1, st.picker); c.globalAlpha *= clamp(st.picker * 1.5);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    rrect(c, 0, 0, pw, ph, 18); c.fillStyle = '#1E2323'; c.fill(); c.restore();
    rrect(c, 0, 0, pw, ph, 18); c.lineWidth = 2; c.strokeStyle = '#3A4242'; c.stroke();
    text(c, 'Entrada', 20, 36, { size: 17, weight: 600, color: C.lime });
    text(c, '→', 102, 36, { size: 17, weight: 600, color: C.muted });
    text(c, 'Saída', 130, 36, { size: 17, weight: 600, color: C.muted });
    const cw = (pw - 24) / 7;
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach((d, i) => text(c, d, 12 + cw * (i + 0.5), 74, { size: 15, weight: 600, color: C.muted, align: 'center' }));
    const first = 2;                                         // mês genérico (sem nome)
    for (let d = 1; d <= 30; d++) {
      const k = d - 1 + first, col = k % 7, row = Math.floor(k / 7);
      const cx = 12 + cw * (col + 0.5), cy = 108 + row * 44;
      const on = d === 20 && st.day > 0;
      if (on) {
        c.beginPath(); c.arc(cx, cy - 6, 20 * E.outBack(clamp(st.day * 1.4)), 0, TAU); c.fillStyle = C.lime; c.fill();
        const rp = prog(t, PICK.day, PICK.day + 0.45);
        if (rp > 0 && rp < 1) { c.beginPath(); c.arc(cx, cy - 6, 20 + 26 * rp, 0, TAU); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, 1 - rp); c.stroke(); }
      }
      text(c, String(d), cx, cy, { size: 17, weight: on && st.day > 0.5 ? 700 : 500, color: on && st.day > 0.5 ? C.ink : C.soft, align: 'center' });
    }
    c.restore();
  }

  // ---------------------------------------------------------------- navegador (versão desktop do mesmo site)
  const BRW = { x: 36, y: 640, w: 900, h: 640 };
  function browser(c, t, st, a) {
    if (a <= 0.01) return;
    const { x, y, w, h } = BRW;
    c.save(); c.globalAlpha *= a;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
    rrect(c, x, y, w, h, 22); c.fillStyle = '#0D1010'; c.fill(); c.restore();
    rrect(c, x, y, w, h, 22); c.lineWidth = 2; c.strokeStyle = '#2E3434'; c.stroke();
    [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(x + 28 + i * 22, y + 28, 7, 0, TAU); c.fillStyle = '#3A4040'; c.fill(); });
    rrect(c, x + 110, y + 14, w - 140, 30, 15); c.fillStyle = '#1A1F1F'; c.fill();
    icon(c, 'lock', x + 132, y + 28, 22, C.muted, 0.09);
    rrect(c, x + 150, y + 24, 160, 10, 5); c.fillStyle = C.bar; c.fill();
    c.save(); rrect(c, x + 2, y + 58, w - 4, h - 60, 20); c.clip();
    const cx = x + 24, cy = y + 76;
    rrect(c, cx, cy, 30, 30, 8); c.fillStyle = C.lime; c.fill(); rrect(c, cx + 40, cy + 8, 100, 14, 7); c.fillStyle = '#5A6262'; c.fill();
    [0, 1, 2].forEach((i) => { rrect(c, cx + 240 + i * 90, cy + 10, 64, 10, 5); c.fillStyle = C.bar; c.fill(); });
    c.save(); rrect(c, cx, cy + 50, w - 48, 250, 18); c.clip();
    { const kb = 1.06 + 0.04 * Math.sin(t * 0.5); c.save(); c.translate(cx + (w - 48) / 2, cy + 175); c.scale(kb, kb); c.translate(-(cx + (w - 48) / 2) + Math.sin(t * 0.4) * 18, -(cy + 175)); tile(c, 5, cx, cy + 50, w - 48, 250, t); c.restore(); }
    rrect(c, cx + 30, cy + 220, 280, 22, 11); c.fillStyle = 'rgba(255,255,255,0.92)'; c.fill(); rrect(c, cx + 30, cy + 254, 190, 12, 6); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fill(); c.restore();
    const dy = cy + 316;                                          // barra de disponibilidade (desktop)
    rrect(c, cx, dy, w - 48, 90, 16); c.fillStyle = C.card; c.fill();
    if (st.hl[0] > 0) { rrect(c, cx, dy, w - 48, 90, 16); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, clamp(st.hl[0]) * 0.9); c.stroke(); }
    [['Entrada', st.entrada], ['Saída', null]].forEach(([lb, val], i) => {
      const fx = cx + 16 + i * 200;
      rrect(c, fx, dy + 14, 184, 62, 10); c.fillStyle = C.card2; c.fill();
      text(c, lb, fx + 14, dy + 38, { size: 15, weight: 500, color: C.muted });
      if (val && st.entradaA > 0) text(c, val, fx + 14, dy + 64, { size: 18, weight: 600, color: C.white, alpha: st.entradaA }); else { rrect(c, fx + 14, dy + 54, 60, 8, 4); c.fillStyle = C.bar; c.fill(); }
    });
    for (let i = 0; i < 3; i++) {                                // cards de acomodação
      const kx = cx + i * 280, ky = dy + 108;
      rrect(c, kx, ky, 264, 120, 14); c.fillStyle = C.card; c.fill();
      c.save(); rrect(c, kx + 10, ky + 10, 90, 100, 10); c.clip(); tile(c, [2, 7, 3][i], kx + 10, ky + 10, 90, 100, t); c.restore();
      rrect(c, kx + 114, ky + 26, 110, 12, 6); c.fillStyle = '#5A6262'; c.fill();
      rrect(c, kx + 114, ky + 52, 80, 10, 5); c.fillStyle = C.bar; c.fill();
      if (i === 0 && st.hl[1] > 0) { rrect(c, kx, ky, 264, 120, 14); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, clamp(st.hl[1]) * 0.9); c.stroke(); }
    }
    c.restore();
    c.restore();
  }

  // ---------------------------------------------------------------- balões de direct
  const QUESTIONS = ['Tem vaga dia 20?', 'Quanto é a diária?', 'Aceita criança?', 'Como eu reservo?'];
  const BS = 36;                                        // corpo do texto dos balões
  const BPOS = [                                        // na cena 2–3: lado, borda e centro vertical
    { side: 'L', x: 64, y: 790 },
    { side: 'R', x: 1012, y: 930 },
    { side: 'L', x: 64, y: 1070 },
    { side: 'R', x: 936, y: 1210 },
  ];
  const QPOS = [{ x: 522, y: 476 }, { x: 1010, y: 476 }, { x: 522, y: 572 }, { x: 1010, y: 572 }];   // fila no alto, na virada
  const QS = 0.72;
  const bubbleW = (s) => measure(s, TEXT, BS, 600) + 64;
  function bubble(c, s, x, y, o) {
    const sc = o.scale ?? 1;
    if (sc <= 0.01 || (o.alpha ?? 1) <= 0.01) return;
    const bw = bubbleW(s), bh = 82;
    c.save(); c.translate(x, y); c.scale(sc, sc); c.globalAlpha *= clamp(o.alpha ?? 1);
    const left = o.side === 'L';
    const x0 = left ? 0 : -bw;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 26; c.shadowOffsetY = 10;
    rrect(c, x0, -bh / 2, bw, bh, 34); c.fillStyle = o.fill || C.white; c.fill(); c.restore();
    c.beginPath();                                      // rabinho
    if (left) { c.moveTo(x0 + 22, bh / 2 - 8); c.lineTo(x0 + 6, bh / 2 + 14); c.lineTo(x0 + 46, bh / 2 - 6); }
    else { c.moveTo(x0 + bw - 22, bh / 2 - 8); c.lineTo(x0 + bw - 6, bh / 2 + 14); c.lineTo(x0 + bw - 46, bh / 2 - 6); }
    c.fillStyle = o.fill || C.white; c.fill();
    if (o.border > 0) { rrect(c, x0, -bh / 2, bw, bh, 34); c.lineWidth = 4; c.strokeStyle = rgba(C.lime, o.border); c.stroke(); }
    text(c, s, x0 + 32, 13, { size: BS, weight: 600, color: o.ink || C.ink });
    if (o.wait > 0) {                                   // estado "aguardando"
      const wy = bh / 2 + 34, wx = left ? x0 + 14 : x0 + bw - 200;
      c.save(); c.globalAlpha *= o.wait;
      icon(c, 'clock', wx + 12, wy - 7, 26, C.muted, 0.09);
      text(c, 'aguardando', wx + 32, wy, { size: 19, weight: 500, color: C.muted });
      for (let k = 0; k < 3; k++) { const a = 0.3 + 0.7 * Math.max(0, Math.sin(o.t * 6 - k * 0.9)); c.beginPath(); c.arc(wx + 150 + k * 12, wy - 6, 3.5, 0, TAU); c.fillStyle = rgba(C.muted, a); c.fill(); }
      c.restore();
    }
    if (o.check > 0) checkBadge(c, x0 + 2, -bh / 2 + 6, 20 * E.outBack(clamp(o.check)) * (1 + 0.1 * Math.sin(o.t * 4 + (o.ph || 0))), clamp(o.check * 2));
    c.restore();
  }
  function dockSlot(i, ph) {                            // à esquerda do celular, na altura de cada seção
    const sec = [MS.disp, MS.card, MS.rules, MS.book][i];
    const sy = ph.y + 14 + (sec.y + (i === 0 ? 50 : sec.h / 2)) * ph.s;
    return { x: ph.x - 22, y: sy };
  }

  // ---------------------------------------------------------------- relógio (espera)
  function bigClock(c, x, y, r, t, a) {
    if (a <= 0.01 || r <= 1) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#111414'; c.fill(); c.lineWidth = 6; c.strokeStyle = C.white; c.stroke();
    for (let k = 0; k < 12; k++) { const an = k * TAU / 12; c.beginPath(); c.moveTo(Math.cos(an) * r * 0.78, Math.sin(an) * r * 0.78); c.lineTo(Math.cos(an) * r * 0.9, Math.sin(an) * r * 0.9); c.lineWidth = k % 3 ? 2 : 4; c.strokeStyle = C.soft; c.stroke(); }
    const tm = t - T.espera;
    const am = -Math.PI / 2 + tm * TAU * 0.9, ah = -Math.PI / 2 + tm * TAU * 0.075;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ah) * r * 0.45, Math.sin(ah) * r * 0.45); c.lineWidth = 7; c.strokeStyle = C.white; c.stroke();
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(am) * r * 0.7, Math.sin(am) * r * 0.7); c.lineWidth = 4; c.strokeStyle = C.lime; c.stroke();
    c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fillStyle = C.lime; c.fill();
    c.beginPath(); c.arc(0, 0, r + 14, -Math.PI / 2 + tm * 3.2, -Math.PI / 2 + tm * 3.2 + 1.6); c.lineWidth = 5; c.strokeStyle = rgba(C.lime, 0.85); c.stroke();
    c.restore();
  }

  // ---------------------------------------------------------------- chips flutuantes (gancho)
  const CHIPS = [
    { ic: 'heart', x: 170, y: 520, ph: 0.0 }, { ic: 'pin', x: 900, y: 590, ph: 1.3 },
    { ic: 'plane', x: 160, y: 1330, ph: 2.1 }, { ic: 'search', x: 880, y: 1270, ph: 0.7 },
  ];
  function floatChips(c, t, a) {
    if (a <= 0.01) return;
    CHIPS.forEach((ch, i) => {
      const p = E.outBack(prog(t, -0.4 + i * 0.1, -0.4 + i * 0.1 + 0.4));
      if (p <= 0) return;
      const fx = ch.x + Math.sin(t * 1.3 + ch.ph) * 10, fy = ch.y + Math.cos(t * 1.1 + ch.ph) * 12;
      c.save(); c.globalAlpha *= a; c.translate(fx, fy); c.scale(p, p);
      rrect(c, -44, -44, 88, 88, 26); c.fillStyle = '#141818'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#2C3333'; c.stroke();
      if (ch.ic === 'heart') heartFill(c, 0, 2, 50 * (1 + 0.14 * kick(t % 1.2, 0, 0.3)), C.lime);
      else icon(c, ch.ic, 0, 0, 50, ch.ic === 'pin' ? C.lime : C.white, 0.09);
      c.restore();
    });
  }

  // ---------------------------------------------------------------- logo oficial (SVG do kit, animada pelas formas)
  let LOGO = null;
  function loadLogo() {
    const x = new XMLHttpRequest(); x.open('GET', '/brand/logo/kit/FAZLO-DIGITAL-branca-transparente.svg', false); x.send();
    const doc = new DOMParser().parseFromString(x.responseText, 'image/svg+xml');
    const vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    const paths = [...doc.querySelectorAll('path')].map((p) => ({ fill: p.getAttribute('fill'), d: p.getAttribute('d') }));
    // peças das letras brancas: cada subcaminho com a sua caixa; contraformas (o miolo do O) ficam com a letra
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
  // logo com largura w centrada em (cx, cy); montada a partir de t0 (letras sobem, a barra corta, DIGITAL entra)
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
    if (ps > 0) {
      c.save(); c.beginPath(); const yb = 124 - (124 - 26) * ps;    // a barra cresce de baixo para cima
      c.rect(200, yb, 160, 130); c.clip(); c.fillStyle = LOGO.slash.fill; c.fill(LOGO.slash.path, 'evenodd'); c.restore();
    }
    const pd = prog(t, t0 + 0.45, t0 + 0.85);
    if (pd > 0) { c.save(); c.globalAlpha *= pd; c.translate((1 - E.outCubic(pd)) * 30, 0); c.fillStyle = LOGO.digital.fill; c.fill(LOGO.digital.path, 'evenodd'); c.restore(); }
    c.restore();
  }

  // ---------------------------------------------------------------- títulos
  let S_HOOK, S_AGORA, S_T2, S_T3, S_T4, S_T5;
  const L_HOOK = ['O HÓSPEDE ACHOU', 'SUA POUSADA', 'NO INSTAGRAM.'];
  const L_T2a = ['AS FOTOS ENCANTAM.'];
  const L_T2b = ['AS RESPOSTAS FICAM', 'NO DIRECT.'];
  const L_T3 = ['ENQUANTO NINGUÉM', 'RESPONDE, ELE CONTINUA', 'PROCURANDO.'];
  const L_T4 = ['NO SITE, CADA PERGUNTA', 'JÁ TEM LUGAR.'];
  const L_T5 = ['O INSTAGRAM ATRAI.', 'O SITE RESPONDE.'];
  const TY = 330;                                       // linha de base do 1º título (abaixo da faixa de 220 px do topo)
  const HOOK_Y = 790;

  // ---------------------------------------------------------------- estados
  function phonePose(t) {                               // centro (cenas 2–3) -> à direita (site); sobe no gancho
    const rise = E.outExpo(prog(t, 3.9, 4.6));
    const mv = E.inOutCubic(prog(t, T.virada, T.virada + 0.9));
    return { x: lerp(310, 486, mv), y: lerp(610, 600, mv) + (1 - rise) * 1300, s: 1 };
  }
  function siteState(t) {
    return {
      hl: DOCK.map((td) => (t >= td ? 0.6 + 0.4 * kick(t, td, 0.5) : 0)),
      entrada: 'dia 20', entradaA: E.outCubic(prog(t, PICK.fill, PICK.fill + 0.2)),
      fieldHl: prog(t, PICK.open - 0.2, PICK.open) * (1 - prog(t, PICK.close, PICK.close + 0.3)),
      picker: t < PICK.close ? E.outCubic(prog(t, PICK.open, PICK.open + 0.18)) : 1 - E.inCubic(prog(t, PICK.close, PICK.close + 0.16)),
      day: prog(t, PICK.day, PICK.day + 0.12),
      press: kick(t, PICK.press, 0.35), ripple: prog(t, PICK.press, PICK.press + 0.45),
      flow: E.inOutCubic(prog(t, PICK.press + 0.15, PICK.press + 0.65)),
      tap: kick(t, TAP, 0.35), tapR: prog(t, TAP, TAP + 0.5),
    };
  }
  function camAt(t) {                                   // a câmera aproxima no seletor de período
    const z = E.inOutCubic(prog(t, DOCK[0] - 0.2, DOCK[0] + 0.25)) * (1 - E.inOutCubic(prog(t, PICK.press + 0.2, PICK.press + 0.6)));
    if (z <= 0) return null;
    const ph = phonePose(t);
    const fx = ph.x + 14 + (MS.disp.x + MS.disp.w / 2) * ph.s, fy = ph.y + 14 + (MS.disp.y + 210) * ph.s;
    return { s: 1 + 0.3 * z, fx, fy, tx: lerp(fx, 590, z), ty: lerp(fy, 1050, z) };
  }

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);
    const sh = U.noise1(t * 30, 3) * 9 * kick(t, 3.0, 0.25);
    c.save(); c.translate(sh, 0);

    // ===== 1 · GANCHO
    if (t < T.perguntas + 0.6) {
      const out = E.inOutCubic(prog(t, 2.62, 3.02));
      const fade = 1 - prog(t, 3.9, 4.3);
      floatChips(c, t, (1 - out * 0.6) * fade);
      c.save(); c.globalAlpha *= fade;
      c.translate(W / 2, lerp(HOOK_Y, 330, out)); c.scale(lerp(1, 0.62, out), lerp(1, 0.62, out)); c.translate(-W / 2, -HOOK_Y);
      const line = L_HOOK[2], y3 = HOOK_Y + 2 * S_HOOK * 1.16, ls = -S_HOOK * 0.02;
      const lw = measure(line, DISPLAY, S_HOOK, 900, ls), iw = measure('INSTAGRAM.', DISPLAY, S_HOOK, 900, ls), ix = W / 2 - lw / 2 + lw - iw;
      const hp = E.outCubic(prog(t, 0.85, 1.25));
      if (hp > 0) { c.fillStyle = C.lime; c.fillRect(ix - 14, y3 - S_HOOK * 0.86, (iw + 24) * hp, S_HOOK * 1.04); }
      titleBlock(c, L_HOOK, t, -0.32, 99, { size: S_HOOK, y: HOOK_Y, st: 0.06 });
      if (hp > 0) { c.save(); c.beginPath(); c.rect(ix - 14, y3 - S_HOOK * 0.86, (iw + 24) * hp, S_HOOK * 1.04); c.clip(); text(c, 'INSTAGRAM.', ix, y3, { fam: DISPLAY, size: S_HOOK, weight: 900, color: C.ink, ls }); c.restore(); }
      c.restore();
      const ag = E.outBack(prog(t, 3.0, 3.35), 2.2), agOut = E.inCubic(prog(t, 3.9, 4.2));
      if (ag > 0 && agOut < 1) {                                  // E AGORA?
        c.save(); c.globalAlpha *= 1 - agOut;
        c.translate(W / 2, 1010 - agOut * 120); c.scale(lerp(1.3, 1, clamp(ag)), lerp(1.3, 1, clamp(ag)));
        const lsA = -S_AGORA * 0.02, wE = measure('E AGORA', DISPLAY, S_AGORA, 900, lsA), wq = measure('?', DISPLAY, S_AGORA, 900);
        const x0 = -(wE + wq) / 2;
        text(c, 'E AGORA', x0, 0, { fam: DISPLAY, size: S_AGORA, weight: 900, color: C.white, ls: lsA });
        c.save(); c.translate(x0 + wE + wq / 2, -S_AGORA * 0.35); c.rotate(0.25 * (1 - spring(t, 3.05, { freq: 2.2, damp: 0.25 })));
        text(c, '?', -wq / 2, S_AGORA * 0.35, { fam: DISPLAY, size: S_AGORA, weight: 900, color: C.lime }); c.restore();
        const tp = prog(t, 3.25, 3.45);                           // "digitando…"
        if (tp > 0) {
          c.globalAlpha *= tp; rrect(c, -70, 60, 140, 60, 30); c.fillStyle = '#1B2020'; c.fill();
          for (let k = 0; k < 3; k++) { const yy = 90 - 8 * Math.max(0, Math.sin(t * 9 - k * 0.8)); c.beginPath(); c.arc(-30 + k * 30, yy, 8, 0, TAU); c.fillStyle = C.soft; c.fill(); }
        }
        c.restore();
      }
    }

    // ===== 2–4 · PERFIL, BALÕES, ESPERA E SITE
    const ph = phonePose(t);
    const wipeP = prog(t, T.virada, T.virada + 1.0);
    if (t > 3.85 && t < T.sintese + 0.7) {
      const dim = E.outCubic(prog(t, T.espera, T.espera + 0.4)) * (1 - prog(t, T.virada - 0.4, T.virada));
      const dm = BUB_T.filter((tb) => t >= tb).length;
      const dmPulse = Math.max(0, ...BUB_T.map((tb) => kick(t, tb, 0.3)));
      if (t > T.espera && t < T.virada + 0.5) {                   // "ele continua procurando": outros resultados passam
        const ga = prog(t, T.espera + 0.6, T.espera + 1.2) * (1 - prog(t, T.virada - 0.3, T.virada));
        for (let i = 0; i < 7; i++) {
          const gx = ((i * 260 - (t - T.espera) * 300) % 1820 + 1820) % 1820 - 370, gy = 1300 + (i % 2) * 36;
          c.save(); c.globalAlpha *= 0.33 * ga; rrect(c, gx, gy, 230, 200, 20); c.fillStyle = '#161A1A'; c.fill();
          c.save(); rrect(c, gx + 12, gy + 12, 206, 110, 12); c.clip(); tile(c, (i + 3) % 9, gx + 12, gy + 12, 206, 110, t); c.restore();
          rrect(c, gx + 14, gy + 138, 140, 12, 6); c.fillStyle = C.bar; c.fill(); rrect(c, gx + 14, gy + 162, 90, 10, 5); c.fill();
          c.restore();
        }
        const lx = 540 + Math.sin((t - T.espera) * 2.2) * 330, ly = 1290;
        c.save(); c.globalAlpha *= ga; rrect(c, lx - 40, ly - 40, 80, 80, 24); c.fillStyle = '#141818'; c.fill(); icon(c, 'search', lx, ly, 52, C.lime, 0.1); c.restore();
      }
      const site = t >= T.virada;
      const bA = site ? E.outCubic(prog(t, T.virada + 0.3, T.virada + 1.0)) : 0;
      const cam = camAt(t);
      c.save();
      if (t > T.virada + 0.9 && t < T.sintese + 0.7) {             // a cena do site nunca para: aproximação lenta
        const dz = 1 + 0.035 * E.inOutSine(prog(t, T.virada + 0.9, T.sintese + 0.7));
        c.translate(600, 1100); c.scale(dz, dz); c.translate(-600, -1100 - 14 * E.inOutSine(prog(t, T.virada + 0.9, T.sintese + 0.7)));
      }
      if (cam) { c.translate(cam.tx, cam.ty); c.scale(cam.s, cam.s); c.translate(-cam.fx, -cam.fy); }
      const outS = E.inOutCubic(prog(t, T.sintese, T.sintese + 0.6));     // recolhe no ícone do site (síntese)
      if (outS > 0) { c.translate(800, 940); c.scale(lerp(1, 0.3, outS), lerp(1, 0.3, outS)); c.translate(-800, -940); c.globalAlpha *= 1 - outS; }
      if (site) browser(c, t, siteState(t), bA * (t > DOCK[0] ? lerp(1, 0.5, prog(t, DOCK[0], DOCK[0] + 0.6)) : 1));
      const drawIG = (cc, w, h) => igScreen(cc, w, h, t, { dm, dmPulse, dim, sweep: prog(t, 5.0, 5.9) });
      const drawSite = (cc, w, h) => siteScreen(cc, w, h, t, siteState(t));
      if (!site || wipeP >= 1) phoneFrame(c, ph.x, ph.y, ph.s, site ? drawSite : drawIG);
      else {                                                      // a barra diagonal separa o perfil (à frente) do site (atrás)
        const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wipeP));
        const clipSide = (front) => { c.beginPath(); if (front) { c.moveTo(x0 + SK * 1200, -200); c.lineTo(4000, -200); c.lineTo(4000, 2200); c.lineTo(x0 - SK * 1200, 2200); } else { c.moveTo(-3000, -200); c.lineTo(x0 + SK * 1200, -200); c.lineTo(x0 - SK * 1200, 2200); c.lineTo(-3000, 2200); } c.closePath(); c.clip(); };
        c.save(); clipSide(true); phoneFrame(c, ph.x, ph.y, ph.s, drawIG); c.restore();
        c.save(); clipSide(false); phoneFrame(c, ph.x, ph.y, ph.s, drawSite); c.restore();
      }
      const queued = [];
      for (let i = 0; i < 4; i++) {                               // balões
        const tb = BUB_T[i];
        if (t < tb) continue;
        const pop = E.outBack(prog(t, tb, tb + 0.35), 2.0);
        const bp = BPOS[i];
        const wait = E.outCubic(prog(t, T.espera + 0.1 * i, T.espera + 0.1 * i + 0.4)) * (1 - prog(t, T.virada + 0.2, T.virada + 0.5));
        const lift = E.outCubic(prog(t, T.virada - 0.6, T.virada)) * (1 - prog(t, DOCK[i] - FLY, DOCK[i] - FLY + 0.2));
        let x = bp.x, y = bp.y - lift * 16 + Math.sin(t * 1.6 + i) * 4 * (1 - prog(t, DOCK[i] - FLY, DOCK[i])), side = bp.side, scale = pop * (1 + 0.04 * lift);
        let check = 0, border = 0;
        const qm = E.inOutCubic(prog(t, T.virada - 0.1 + i * 0.06, T.virada + 0.75 + i * 0.06));   // na virada, vão para a fila no alto
        if (qm > 0) {
          const xr = side === 'L' ? x + bubbleW(QUESTIONS[i]) * scale : x;
          x = lerp(xr, QPOS[i].x, qm); y = lerp(y, QPOS[i].y, qm); side = 'R'; scale = lerp(scale, QS, qm);
        }
        const tf0 = DOCK[i] - FLY, fp = E.inOutCubic(prog(t, tf0, DOCK[i]));
        if (fp > 0) {                                             // voo em arco até a seção
          const d = dockSlot(i, ph);
          const sx = x;
          const cx2 = (sx + d.x) / 2 + (i % 2 ? 120 : -120), cy2 = (y + d.y) / 2 - 60;
          const q = fp;
          x = (1 - q) * (1 - q) * sx + 2 * (1 - q) * q * cx2 + q * q * d.x;
          y = (1 - q) * (1 - q) * y + 2 * (1 - q) * q * cy2 + q * q * d.y;
          side = 'R'; scale = lerp(QS, 0.74, q);
          border = prog(t, DOCK[i] - 0.05, DOCK[i] + 0.1);
          check = prog(t, DOCK[i], DOCK[i] + 0.25);
        }
        const fill = wait > 0 ? U.mix(C.white, '#2B3030', wait) : C.white;
        const ink = wait > 0 ? U.mix(C.ink, C.soft, wait) : C.ink;
        const args = [QUESTIONS[i], x, y, { side, scale, fill, ink, wait, t, border, check, ph: i * 1.7 }];
        if (cam && t < tf0) queued.push(args);                    // na fila: fica parado na tela enquanto a câmera aproxima
        else bubble(c, ...args);
        if (t >= DOCK[i]) {                                       // conector até a seção
          const d = dockSlot(i, ph), cp = E.outCubic(prog(t, DOCK[i], DOCK[i] + 0.3));
          c.save(); c.strokeStyle = rgba(C.lime, 0.9); c.lineWidth = 3; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + 36 * cp, d.y); c.stroke(); c.restore();
        }
      }
      c.restore();
      queued.forEach((args) => bubble(c, ...args));
      const ca = E.outBack(prog(t, T.espera, T.espera + 0.4)) * (1 - E.inCubic(prog(t, T.virada - 0.3, T.virada + 0.1)));
      if (ca > 0) { bigClock(c, 800, 652, 78 * clamp(ca), t, clamp(ca)); text(c, 'AGUARDANDO', 800, 776, { size: 22, weight: 600, color: C.lime, ls: 5, align: 'center', alpha: clamp(ca) }); }
    }
    if (wipeP > 0 && wipeP < 1) {                                 // a barra lima
      const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wipeP)), bw = 120;
      c.beginPath(); c.moveTo(x0 + SK * 1200 - bw / 2, -200); c.lineTo(x0 + SK * 1200 + bw / 2, -200); c.lineTo(x0 - SK * 1200 + bw / 2, 2200); c.lineTo(x0 - SK * 1200 - bw / 2, 2200); c.closePath();
      c.fillStyle = C.lime; c.fill();
    }

    // títulos
    titleBlock(c, L_T2a, t, 5.0, T.espera - 0.15, { size: S_T2, y: TY });
    titleBlock(c, L_T2b, t, 9.6, T.espera - 0.12, { size: S_T2, y: TY + S_T2 * 1.3, lime: ['DIRECT.'] });
    titleBlock(c, L_T3, t, T.espera + 0.3, T.virada - 0.3, { size: S_T3, y: TY, lime: ['PROCURANDO.'] });
    titleBlock(c, L_T4, t, 24.0, T.sintese - 0.25, { size: S_T4, y: TY, lime: ['LUGAR.'] });
    if (t > T.virada + 0.9 && t < 24.2) {                          // rótulo enquanto as perguntas encontram o seu lugar
      const la = prog(t, T.virada + 0.9, T.virada + 1.3) * (1 - prog(t, 23.8, 24.1)) * (1 - prog(t, DOCK[0] - 0.4, DOCK[0] - 0.15) * (1 - prog(t, PICK.press + 0.5, PICK.press + 0.8)));
      text(c, 'NO SITE', W / 2, TY - 20, { size: 26, weight: 600, color: C.lime, ls: 8, align: 'center', alpha: la });
      text(c, 'cada pergunta encontra a sua seção', W / 2, TY + 36, { size: 32, weight: 500, color: C.soft, align: 'center', alpha: la });
    }

    // ===== 5 · SÍNTESE
    if (t > T.sintese - 0.1 && t < T.fecho + 1.2) {
      const pin = E.outBack(prog(t, T.sintese + 0.2, T.sintese + 0.7));
      const out = E.inCubic(prog(t, T.fecho - 0.15, T.fecho + 0.12));
      const a = clamp(prog(t, T.sintese + 0.1, T.sintese + 0.4)) * (1 - out);
      const dv = E.outCubic(prog(t, T.sintese, T.sintese + 0.5));
      c.save(); c.globalAlpha *= a;
      c.beginPath(); const h2 = 470 * dv; c.moveTo(540 + SK * h2 - 7, 960 - h2); c.lineTo(540 + SK * h2 + 7, 960 - h2); c.lineTo(540 - SK * h2 + 7, 960 + h2); c.lineTo(540 - SK * h2 - 7, 960 + h2); c.closePath(); c.fillStyle = C.lime; c.fill();
      const lx = 280, rx = 800, iy = 980;
      glow(c, lx, iy, 260, 0.08);
      for (let k = 0; k < 10; k++) {                              // o Instagram atrai: corações vêm até o ícone
        const p2 = ((t - T.sintese) * 0.7 + hash(k, 1)) % 1, an = hash(k, 2) * TAU, r = lerp(300, 80, p2);
        heartFill(c, lx + Math.cos(an) * r, iy + Math.sin(an) * r, 30, k % 2 ? C.white : C.lime, Math.sin(p2 * Math.PI) * 0.9);
      }
      const pz = pin * (1 - out);
      c.save(); c.translate(lx, iy); c.scale(pz, pz); rrect(c, -130, -130, 260, 260, 64); c.fillStyle = '#121616'; c.fill(); icon(c, 'camera', 0, 0, 220, C.white, 0.07); c.restore();
      glow(c, rx, iy, 260, 0.1);                                  // o site responde: selos ✓ saem do ícone
      c.save(); c.translate(rx, iy); c.scale(pz, pz); rrect(c, -150, -120, 300, 240, 26); c.fillStyle = '#121616'; c.fill(); c.lineWidth = 4; c.strokeStyle = C.white; c.stroke();
      c.fillStyle = C.white; c.fillRect(-150, -76, 300, 4); [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(-122 + i * 20, -98, 6, 0, TAU); c.fill(); });
      [0, 1, 2].forEach((i) => { const ap = E.outBack(prog(t, T.sintese + 0.6 + i * 0.25, T.sintese + 0.9 + i * 0.25)); if (ap > 0) { checkBadge(c, -96, -30 + i * 48, 15 * ap, 1); rrect(c, -70, -38 + i * 48, 170 - i * 30, 14, 7); c.fillStyle = C.soft; c.fill(); } });
      c.restore();
      for (let k = 0; k < 6; k++) {
        const t0 = T.sintese + 0.8 + k * 0.42, p = prog(t, t0, t0 + 1.1);
        if (p <= 0 || p >= 1) continue;
        const an = -0.6 + k * 0.5, rr = 150 + 150 * E.outCubic(p);
        checkBadge(c, rx + Math.cos(an) * rr, iy + Math.sin(an) * rr, 16, Math.sin(p * Math.PI));
      }
      c.restore();
      titleBlock(c, ['O INSTAGRAM ATRAI.'], t, 27.8, T.fecho + 0.12, { size: S_T5, y: TY });
      titleBlock(c, ['O SITE RESPONDE.'], t, 28.4, T.fecho + 0.16, { size: S_T5, y: TY + S_T5 * 1.25, lime: ['RESPONDE.'] });
    }

    // ===== 6 · FECHAMENTO
    if (t > T.fecho - 0.1) {
      const gp = prog(t, T.fecho, T.fecho + 1.0);
      glow(c, 540, 900, 520, 0.1 * gp + 0.03 * Math.sin(t * 3) * gp);
      drawLogo(c, 540, 900, 720, t, T.fecho + 0.02);
      const s1 = E.outCubic(prog(t, 31.4, 31.85));
      text(c, 'Sites para pousadas e negócios locais', W / 2, 1110 + (1 - s1) * 24, { size: 40, weight: 500, color: C.soft, align: 'center', alpha: s1 });
      const s2 = E.outBack(prog(t, 31.9, 32.3), 1.6);
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

  // ---------------------------------------------------------------- pós: vinheta e grão leves
  let GRAIN, VIG;
  function post(ctx, t) {
    if (!GRAIN) {
      GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 384;
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = rng(4);
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
    id: 'instagram-nao-e-site',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [3, 1 / 120],
      ranges: [[2.6, 3.06, 7, 1 / 120], [3.85, 4.65, 5, 1 / 120], [T.virada, T.virada + 1.0, 5, 1 / 90], [DOCK[0] - FLY, 23.2, 4, 1 / 100], [T.sintese - 0.05, T.sintese + 0.7, 4, 1 / 110], [T.fecho - 0.1, T.fecho + 0.9, 4, 1 / 110]],
    },

    setup() {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      loadLogo();
      S_HOOK = fit(L_HOOK, DISPLAY, 900, 900, 92, -0.02);
      S_AGORA = fit(['E AGORA?'], DISPLAY, 900, 860, 170, -0.02);
      S_T2 = fit([...L_T2a, ...L_T2b], DISPLAY, 900, 900, 64, -0.02);
      S_T3 = fit(L_T3, DISPLAY, 900, 900, 64, -0.02);
      S_T4 = fit(L_T4, DISPLAY, 900, 900, 64, -0.02);
      S_T5 = fit(L_T5, DISPLAY, 900, 900, 64, -0.02);
    },

    frame,
    post,

    cover(ctx) {
      background(ctx, 25.5);
      glow(ctx, 540, 860, 560, 0.08);
      drawLogo(ctx, 540, 360, 380, 99, 0);                           // logo no topo, centralizada
      const sI = fit(['INSTAGRAM'], DISPLAY, 900, 900, 140, -0.02);
      const o = { fam: DISPLAY, weight: 900, align: 'center', ls: -sI * 0.02 };
      text(ctx, 'INSTAGRAM', 540, 640, { ...o, size: sI, color: C.white });
      text(ctx, 'NÃO É', 540, 640 + sI * 1.12, { ...o, size: sI, color: C.white });
      const sS = fit(['SITE'], DISPLAY, 900, 760, 250, -0.02);
      text(ctx, 'SITE', 540, 640 + sI * 1.12 + sS * 1.02, { ...o, size: sS, color: C.lime, ls: -sS * 0.02 });
      const y0 = 1215;                                               // apoio: balões do direct -> site com respostas
      ['Tem vaga?', 'Quanto é?', 'Aceita criança?'].forEach((s, i) => {
        const tw = measure(s, TEXT, 30, 600) + 52;
        rrect(ctx, 80, y0 + i * 92, tw, 70, 30); ctx.fillStyle = '#2B3030'; ctx.fill();
        text(ctx, s, 106, y0 + i * 92 + 46, { size: 30, weight: 600, color: C.soft });
      });
      ctx.save(); ctx.translate(608, 1345); ctx.rotate(Math.PI / 4); icon(ctx, 'arrow', 0, 0, 70, C.lime, 0.12); ctx.restore();   // seta: do direct para o site
      ctx.save(); ctx.translate(690, 1200);
      rrect(ctx, 0, 0, 300, 290, 26); ctx.fillStyle = '#121616'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#3A4242'; ctx.stroke();
      ctx.fillStyle = '#3A4242'; ctx.fillRect(0, 44, 300, 3); [0, 1, 2].forEach((i) => { ctx.beginPath(); ctx.arc(26 + i * 20, 22, 6, 0, TAU); ctx.fill(); });
      [0, 1, 2].forEach((i) => { checkBadge(ctx, 40, 92 + i * 66, 18, 1); rrect(ctx, 72, 84 + i * 66, 190 - i * 30, 16, 8); ctx.fillStyle = C.soft; ctx.fill(); });
      ctx.restore();
    },

    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(0.85, 'mark');
      cue(2.7, 'lift');
      cue(3.0, 'agora');
      cue(3.9, 'phone');
      cue(5.0, 'shimmer');
      BUB_T.forEach((t, k) => cue(t, 'bubble', { k }));
      cue(9.6, 'title');
      cue(T.espera, 'freeze');
      cue(T.espera, 'clock', { d: T.virada - T.espera - 0.3 });
      cue(T.virada - 0.6, 'lift2');
      cue(T.virada, 'slash');
      DOCK.forEach((t, k) => { cue(t - FLY, 'fly', { k, d: FLY }); cue(t, 'dock', { k }); });
      cue(PICK.open, 'pickopen');
      cue(PICK.day, 'day');
      cue(PICK.close, 'pickclose');
      cue(PICK.press, 'press');
      cue(TAP, 'tap');
      cue(24.0, 'title');
      cue(T.sintese, 'split');
      cue(T.fecho, 'logo');
      cue(31.9, 'cta');
    },
  });
})();
