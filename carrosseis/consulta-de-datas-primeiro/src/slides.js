/* =====================================================================
   FAZLO Digital — carrossel "Por que a consulta de datas vem primeiro"
   8 slides 1080x1350 (4:5), estáticos.

   Mesmo padrão do carrossel "O que o hóspede procura antes de reservar":
   fundo #050606, verde-limão #C6FA41, branco; Unbounded (títulos) + Sora
   (textos); FAZLO DIGITAL na capa e no fechamento, FAZLO compacto nos
   internos; topo abaixo do contador nativo do Instagram.

   01 capa       título + uma página genérica com a consulta de datas em 1º
   02            o hóspede chega com uma pergunta (balão; ilustração genérica)
   03            se precisa procurar, pode desistir (página longa genérica, sem formulário)
   04–07         CAPTURAS REAIS do site da Pousada Vale dos Canteiros (as mesmas dos
                 Reels "Como funciona o raio-x" e "Conheça o site…"; sem depoimentos):
     04          o topo e o bloco "Consulte sua estadia" logo abaixo
     05          o calendário do site aberto (só depois do toque em Entrada)
     06          "Enviar consulta pelo WhatsApp" + a conversa recriada do Reel do case
                 (genérica: sem logo, sem número), com a mensagem real que o site monta
     07          "Nossos chalés"
   08 fecho      pergunta + pílula + crédito do site
   ===================================================================== */
(function () {
  'use strict';
  const W = 1080, H = 1350, M = 72;
  const TAU = Math.PI * 2;
  const { clamp, rgba } = FZD.U;

  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF',
    card: '#141717', card2: '#1C2121', line: '#2A2F2F', bar: '#3A4141', bar2: '#566060', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C',
    site: '#F4F0E8', green: '#1C2E26',
  };
  const DISPLAY = "'FZD Display'", TEXT = "'FZD Text'";
  const N = 8;

  // ---------------------------------------------------------------- texto
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, size, weight = 600, fam = TEXT, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function text(c, s, x, y, o = {}) {
    c.save();
    c.font = fnt(o.fam || TEXT, o.size || 30, o.weight || 600); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = o.color || C.white;
    c.fillText(s, x, y); c.restore();
  }
  function wrap(s, size, weight, maxW, fam = TEXT) {
    const out = []; let line = '';
    for (const w of s.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (line && measure(t, size, weight, fam) > maxW) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }
  function fit(lines, weight, maxW, max, fam = DISPLAY, lsK = -0.02) {
    let z = max;
    while (z > 10 && lines.some((s) => measure(s, z, weight, fam, z * lsK) > maxW)) z -= 1;
    return z;
  }
  // título em Unbounded: palavras em lima conforme a lista (palavra inteira)
  function title(c, lines, x, y, size, o = {}) {
    const lh = size * (o.lh || 1.1), ls = -size * 0.02, wt = o.weight || 900;
    const sp = measure(' ', size, wt, DISPLAY, ls);
    lines.forEach((line, i) => {
      let xx = x;
      if (o.align === 'center') xx = x - measure(line, size, wt, DISPLAY, ls) / 2;
      for (const w of line.split(' ')) {
        const lime = (o.lime || []).includes(w);
        text(c, w, xx, y + i * lh, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : (o.color || C.white), ls });
        xx += measure(w, size, wt, DISPLAY, ls) + sp;
      }
    });
    return y + (lines.length - 1) * lh;
  }

  // ---------------------------------------------------------------- formas
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function fillR(c, x, y, w, h, r, col) { rrect(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function strokeR(c, x, y, w, h, r, col, lw) { rrect(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function glow(c, x, y, r, a, color = C.lime) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }

  // ---------------------------------------------------------------- ícones (traço, caixa unitária)
  function icon(c, kind, x, y, s, color = C.white, lw = 0.09) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'up': c.moveTo(0, 0.36); c.lineTo(0, -0.3); c.moveTo(-0.24, -0.06); c.lineTo(0, -0.3); c.lineTo(0.24, -0.06); break;
      case 'bed': c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'out':
        c.moveTo(-0.06, -0.4); c.lineTo(-0.38, -0.4); c.lineTo(-0.38, 0.4); c.lineTo(-0.06, 0.4); c.moveTo(-0.18, 0); c.lineTo(0.42, 0); c.moveTo(0.24, -0.18); c.lineTo(0.42, 0); c.lineTo(0.24, 0.18); break;
      case 'search': c.arc(-0.07, -0.07, 0.26, 0, TAU); c.moveTo(0.12, 0.12); c.lineTo(0.38, 0.38); break;
      case 'pencil':
        c.moveTo(-0.36, 0.36); c.lineTo(-0.3, 0.14); c.lineTo(0.18, -0.34); c.lineTo(0.34, -0.18); c.lineTo(-0.14, 0.3); c.closePath(); c.moveTo(0.06, -0.22); c.lineTo(0.22, -0.06); break;
      case 'tap':
        c.arc(0, 0, 0.14, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 0, 0.28, 0, TAU); c.moveTo(0.42, 0); c.arc(0, 0, 0.42, 0, TAU); c.globalAlpha *= 0.6; break;
      case 'clock': c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0, 0); c.lineTo(0, -0.22); c.moveTo(0, 0); c.lineTo(0.15, 0.06); break;
      case 'back': c.moveTo(0.12, -0.3); c.lineTo(-0.16, 0); c.lineTo(0.12, 0.3); break;
      case 'send': c.moveTo(-0.32, -0.3); c.lineTo(0.36, 0); c.lineTo(-0.32, 0.3); c.lineTo(-0.2, 0); c.closePath(); c.fill(); break;
      case 'user':                                  // avatar genérico de contato (silhueta)
        c.arc(0, -0.15, 0.17, 0, TAU); c.moveTo(-0.33, 0.4); c.bezierCurveTo(-0.33, 0.1, -0.18, 0.06, 0, 0.06); c.bezierCurveTo(0.18, 0.06, 0.33, 0.1, 0.33, 0.4); c.closePath(); c.fill(); c.restore(); return;
      case 'signal': for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery': c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function checkBadge(c, x, y, r) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = r * 0.8; c.shadowOffsetY = r * 0.2;
    c.fillStyle = C.lime; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
    icon(c, 'check', x, y + r * 0.04, r * 1.6, C.ink, 0.13);
  }
  // chip flutuante: quadrado arredondado com ícone
  function chip(c, ic, x, y, s = 116, lime = false) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    fillR(c, x - s / 2, y - s / 2, s, s, s * 0.3, lime ? C.lime : '#151A1A'); c.restore();
    if (!lime) strokeR(c, x - s / 2, y - s / 2, s, s, s * 0.3, '#2E3636', 2);
    icon(c, ic, x, y, s * 0.5, lime ? C.ink : C.white, 0.085);
  }
  // o toque (mesmo gesto do Reel do case): círculo lima com centro branco e onda
  function touch(c, x, y, s = 1, ring = true) {
    if (ring) [56, 40].forEach((r, i) => { c.beginPath(); c.arc(x, y, r * s, 0, TAU); c.strokeStyle = rgba(C.lime, 0.35 + 0.3 * i); c.lineWidth = 3 * s; c.stroke(); });
    glow(c, x, y, 50 * s, 0.35);
    c.beginPath(); c.arc(x, y, 25 * s, 0, TAU); c.fillStyle = rgba(C.lime, 0.92); c.fill();
    c.lineWidth = 2 * s; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
    c.beginPath(); c.arc(x, y, 10 * s, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill();
  }

  // ---------------------------------------------------------------- ilustrações genéricas (slides 01 e 03; sem lugar real)
  function photo(c, kind, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, Math.min(16, w * 0.06)); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    switch (kind) {
      case 'room': {
        g('#E9DDCB', '#DCCAB0', 0, h * 0.7); g('#B99772', '#9C7A58', h * 0.7, h);
        c.fillStyle = '#A9C7D6'; c.fillRect(w * 0.64, h * 0.12, w * 0.24, h * 0.34); c.fillStyle = '#F1E8DA'; c.fillRect(w * 0.755, h * 0.12, w * 0.01, h * 0.34);
        c.fillStyle = '#7D5B40'; c.fillRect(w * 0.12, h * 0.36, w * 0.5, h * 0.2);
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.1, h * 0.54, w * 0.54, h * 0.2);
        c.fillStyle = '#F4F7F7'; c.beginPath(); c.roundRect(w * 0.15, h * 0.47, w * 0.18, h * 0.1, 6); c.roundRect(w * 0.39, h * 0.47, w * 0.18, h * 0.1, 6); c.fill();
        c.fillStyle = '#5E7F94'; c.fillRect(w * 0.1, h * 0.64, w * 0.54, h * 0.1);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.68, h * 0.56, w * 0.14, h * 0.16);
        break;
      }
      case 'view': {
        g('#F3C38F', '#F6E3C4', 0, h * 0.6);
        c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(w * 0.7, h * 0.36, Math.min(w, h) * 0.1, 0, TAU); c.fill();
        c.fillStyle = '#8FA7B8'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w * 0.22, h * 0.34); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w, h * 0.66); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#5F7E6A'; c.beginPath(); c.moveTo(0, h * 0.78); c.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.8); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        break;
      }
      case 'pool': {
        g('#A6DBE6', '#E8F3EE', 0, h * 0.45);
        c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.45, w, h * 0.55);
        c.fillStyle = '#4FB6C8'; c.beginPath(); c.roundRect(w * 0.12, h * 0.55, w * 0.76, h * 0.32, 10); c.fill();
        c.fillStyle = '#3F7350'; [[0.86, 0.2, 0.07], [0.93, 0.17, 0.065], [0.9, 0.1, 0.06]].forEach(([a1, b1, r1]) => { c.beginPath(); c.arc(w * a1, h * b1, Math.min(w, h * 2) * r1, 0, TAU); c.fill(); });
        break;
      }
      default: {                                             // fachada
        g('#CFE3EE', '#E9F1F4', 0, h * 0.5); c.fillStyle = '#F1E3CF'; c.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.6);
        c.fillStyle = '#9C6B4E'; c.beginPath(); c.moveTo(w * 0.04, h * 0.32); c.lineTo(w * 0.5, h * 0.1); c.lineTo(w * 0.96, h * 0.32); c.fill();
        c.fillStyle = '#6B8BA4'; for (let i = 0; i < 3; i++) c.fillRect(w * (0.18 + 0.24 * i), h * 0.42, w * 0.14, h * 0.16);
        c.fillStyle = '#5F8A5A'; c.fillRect(0, h * 0.88, w, h * 0.12);
      }
    }
    c.restore();
  }
  // linhas de texto genéricas (barras)
  function bars(c, x, y, ws, h = 10, gap = 20, col = C.bar) { ws.forEach((w, i) => fillR(c, x, y + i * gap, w, h, h / 2, col)); }

  // ---------------------------------------------------------------- logo oficial (SVGs do kit, intactos)
  const LOGOS = {};
  function loadLogo(key, file) {
    const x = new XMLHttpRequest(); x.open('GET', `/brand/logo/kit/${file}`, false); x.send();
    const doc = new DOMParser().parseFromString(x.responseText, 'image/svg+xml');
    const paths = [...doc.querySelectorAll('path')].map((p) => {
      const d = p.getAttribute('d'), n = d.match(/-?\d+\.?\d*/g).map(Number);
      const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
      return { fill: p.getAttribute('fill'), path: new Path2D(d), x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    });
    const box = (ps) => ({ x0: Math.min(...ps.map((p) => p.x0)), x1: Math.max(...ps.map((p) => p.x1)), y0: Math.min(...ps.map((p) => p.y0)), y1: Math.max(...ps.map((p) => p.y1)) });
    LOGOS[key] = { paths, all: box(paths), letters: box(paths.slice(0, 2)) };
  }
  function drawLogo(c, key, x, y, w) {
    const L = LOGOS[key], s = w / (L.all.x1 - L.all.x0);
    c.save(); c.translate(x - L.all.x0 * s, y - L.all.y0 * s); c.scale(s, s);
    L.paths.forEach((p) => { c.fillStyle = p.fill; c.fill(p.path, 'evenodd'); });
    c.restore();
    return { h: (L.all.y1 - L.all.y0) * s, letters: (L.letters.y1 - L.letters.y0) * s };
  }

  // ---------------------------------------------------------------- estrutura comum
  const HEAD_Y = 100;                                  // topo abaixo do contador nativo do Instagram
  const LOGO_FULL_W = 360, LOGO_COMPACT_W = 200;
  function background(c) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 22; y < H; y += 44) for (let x = 22; x < W; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }
  function header(c, n, full = false) {
    const lg = full ? drawLogo(c, 'full', M, HEAD_Y, LOGO_FULL_W) : drawLogo(c, 'compact', M, HEAD_Y, LOGO_COMPACT_W);
    const by = HEAD_Y + lg.letters / 2 + 10;
    const tot = `/${String(N).padStart(2, '0')}`;
    const wt = measure(tot, 28, 500);
    text(c, tot, W - M, by, { size: 28, weight: 500, color: C.muted, align: 'right' });
    text(c, String(n).padStart(2, '0'), W - M - wt, by, { size: 28, weight: 700, color: C.white, align: 'right' });
  }
  function footer(c, icons, s, y) {
    const size = 30, gap = 14, iw = 34;
    const tw = measure(s, size, 500);
    const total = icons.length * (iw + gap) + tw;
    let x = W / 2 - total / 2;
    icons.forEach((ic) => { icon(c, ic, x + iw / 2, y - 10, iw, C.lime, 0.1); x += iw + gap; });
    text(c, s, x, y, { size, weight: 500, color: C.soft });
  }
  // título dos slides internos + linha de apoio; devolve o y onde o visual pode começar
  let S_ITEM;
  function itemHead(c, n, lines, lime, sub = []) {
    background(c);
    header(c, n);
    const y1 = 200 + S_ITEM * 0.74;
    const yl = title(c, lines, M, y1, S_ITEM, { lime });
    let y = yl + 64;
    sub.forEach((s) => {
      if (s.tag) {                                     // etiqueta "site real"
        c.beginPath(); c.arc(M + 8, y - 9, 8, 0, TAU); c.fillStyle = C.lime; c.fill();
        text(c, s.text, M + 28, y, { size: 27, weight: 600, color: C.soft });
        y += 48;
      } else {
        wrap(s.text, 34, 500, W - 2 * M).forEach((ln) => { text(c, ln, M, y, { size: 34, weight: 500, color: C.soft }); y += 48; });
      }
    });
    return y - 48 + 50;
  }

  // ---------------------------------------------------------------- celular genérico (UI escura; slides 01 e 03)
  const GP = { w: 460, h: 930 }, GSW = GP.w - 28, GT0 = 104;
  function genericPhone(c, x, y, s, drawScreen) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 60; c.shadowOffsetY = 24;
    rrect(c, 0, 0, GP.w, GP.h, 62); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    strokeR(c, 0, 0, GP.w, GP.h, 62, '#30363A', 3);
    strokeR(c, 5, 5, GP.w - 10, GP.h - 10, 58, 'rgba(255,255,255,0.06)', 2);
    c.save(); rrect(c, 14, 14, GP.w - 28, GP.h - 28, 50); c.clip(); c.translate(14, 14);
    c.fillStyle = '#070808'; c.fillRect(0, 0, GSW, GP.h - 28);
    drawScreen(c);
    // barra de status + barra de endereço (é um site); sem domínio
    c.fillStyle = '#070808'; c.fillRect(0, 0, GSW, 96);
    icon(c, 'signal', GSW - 120, 30, 26, C.white); icon(c, 'battery', GSW - 52, 30, 34, C.white, 0.07);
    fillR(c, 16, 50, GSW - 32, 38, 19, '#1A1F1F');
    icon(c, 'lock', 40, 69, 22, C.muted, 0.09);
    fillR(c, 58, 64, 150, 10, 5, C.bar);
    c.restore();
    fillR(c, GP.w / 2 - 58, 28, 116, 32, 16, '#000');
    c.restore();
  }

  // ---------------------------------------------------------------- site real (capturas dos Reels)
  let IMG, MAN, MSG_LINES = [], MSG_W = 0;
  const VW = 390, VH = 844;
  function loadManifest() {
    const x = new XMLHttpRequest(); x.open('GET', '/reels/case-vale-dos-canteiros/src/assets/site/manifest.json', false); x.send();
    MAN = JSON.parse(x.responseText);
  }
  // página rolada em s (px CSS), em px CSS: faixas reais + a foto do topo + o cabeçalho fixo
  function drawPage(c, s) {
    c.fillStyle = C.site; c.fillRect(0, 0, VW, VH);
    for (const ch of MAN.reuse.chunks) {
      const im = IMG[ch.file.replace(/\.jpg$/, '')];
      if (!im) continue;
      const a0 = Math.max(ch.y, s), a1 = Math.min(ch.y + ch.h, s + VH);
      if (a1 <= a0) continue;
      const q = im.height / ch.h;
      c.drawImage(im, 0, (a0 - ch.y) * q, im.width, (a1 - a0) * q, 0, a0 - s, VW, a1 - a0 + 0.5);
    }
    const hr = MAN.hero.rect;
    if (s < hr.h) c.drawImage(IMG['hero-1'], 0, -s, VW, hr.h);
    c.drawImage(IMG[s > 60 ? 'header-scrolled' : 'header-top'], 0, 0, VW, 76);
  }
  // celular com a tela real: k = px do slide por px CSS; draw desenha em px CSS (390x844)
  function realPhone(c, x, y, k, dark, draw) {
    const bz = 12, sb = 30 * k, sw = VW * k, sh = sb + VH * k;
    const P = { x, y, w: sw + 2 * bz, h: sh + 2 * bz, sx: x + bz, sy: y + bz + sb, k };
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 60; c.shadowOffsetY = 24;
    rrect(c, x, y, P.w, P.h, 58 * k + bz); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    strokeR(c, x, y, P.w, P.h, 58 * k + bz, '#30363A', 3);
    c.save(); rrect(c, x + bz, y + bz, sw, sh, 52 * k); c.clip();
    c.fillStyle = dark ? '#17201C' : '#F6F3EC'; c.fillRect(x + bz, y + bz, sw, sb + 1);
    const ic = dark ? '#F2F4F3' : '#1A1F1D';
    icon(c, 'signal', x + bz + sw - 86 * k, y + bz + sb / 2 + 1, 20 * k, ic); icon(c, 'battery', x + bz + sw - 42 * k, y + bz + sb / 2 + 1, 25 * k, ic, 0.07);
    c.save(); c.beginPath(); c.rect(P.sx, P.sy, sw, VH * k); c.clip(); c.translate(P.sx, P.sy); c.scale(k, k);
    draw(c);
    c.restore(); c.restore();
    fillR(c, x + P.w / 2 - 46 * k, y + bz + 6 * k, 92 * k, 21 * k, 10.5 * k, '#000');
    return P;
  }
  const at = (P, cx, cy) => [P.sx + cx * P.k, P.sy + cy * P.k];
  // conversa recriada do Reel do case (genérica: seta, avatar silhueta, só o nome; mensagem real, enviada ✓)
  function chatScreen(c) {
    c.fillStyle = '#0D1311'; c.fillRect(0, 0, VW, VH);
    c.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 80; y < VH; y += 26) for (let x = 10 + ((y / 26) % 2) * 13; x < VW; x += 26) { c.beginPath(); c.arc(x, y, 1, 0, TAU); c.fill(); }
    c.fillStyle = '#151D1A'; c.fillRect(0, 0, VW, 64);
    icon(c, 'back', 20, 32, 26, C.soft, 0.11);
    c.save(); c.beginPath(); c.arc(56, 32, 19, 0, TAU); c.fillStyle = '#2A3531'; c.fill(); c.clip(); icon(c, 'user', 56, 34, 34, '#7F8C87'); c.restore();
    text(c, 'Pousada Vale dos Canteiros', 85, 38, { size: 15.5, weight: 600, color: '#F1F3F2' });
    const fs = 15.5, lh = 22, pad = 13, bottom = VH - 12, emptyH = 44;
    const boxH = MSG_LINES.length * lh + 2 * pad, bw = MSG_W + 2 * pad;
    rrect(c, 10, bottom - emptyH, 318, emptyH, 22); c.fillStyle = '#1E2724'; c.fill();
    text(c, 'Mensagem', 26, bottom - 16, { size: 15, weight: 400, color: '#7E8985' });
    c.beginPath(); c.arc(360, bottom - 22, 22, 0, TAU); c.fillStyle = C.lime; c.fill();
    icon(c, 'send', 361, bottom - 22, 22, C.ink, 0.1);
    const mx = VW - 10 - bw, my = bottom - emptyH - 14 - boxH - 16, bh = boxH + 16;
    rrect(c, mx, my, bw, bh, 16); c.fillStyle = C.lime; c.fill();
    c.beginPath(); c.moveTo(mx + bw - 4, my + bh - 14); c.lineTo(mx + bw + 6, my + bh); c.lineTo(mx + bw - 18, my + bh - 2); c.closePath(); c.fill();
    MSG_LINES.forEach((l, i) => { if (l) text(c, l, mx + pad, my + pad + 16 + i * lh, { size: fs, weight: 400, color: C.ink }); });
    icon(c, 'check', mx + bw - 16, my + boxH + 2, 18, C.ink, 0.15);
  }
  function layoutMessage() {
    MEAS.font = fnt(TEXT, 15.5, 400); MEAS.letterSpacing = '0px';
    MSG_LINES = [];
    for (const para of MAN.form.message.text.split('\n')) {
      if (!para) { MSG_LINES.push(''); continue; }
      let line = '';
      for (const w of para.split(' ')) {
        const t = line ? `${line} ${w}` : w;
        if (MEAS.measureText(t).width > 262 && line) { MSG_LINES.push(line); line = w; } else line = t;
      }
      MSG_LINES.push(line);
    }
    MSG_W = Math.max(...MSG_LINES.map((l) => MEAS.measureText(l).width));
  }
  // contorno lima com selo ✓ (destaque de uma área real)
  function highlight(c, x, y, w, h, r = 18, badge = true) {
    c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 22; strokeR(c, x, y, w, h, r, C.lime, 4); c.restore();
    if (badge) checkBadge(c, x + w - 6, y + 6, 20);
  }

  // ---------------------------------------------------------------- slides
  let S_COVER, L_COVER, S_END, L_END;
  const SITE_TAG = { tag: true, text: 'Site da Pousada Vale dos Canteiros' };

  // 01 — capa: a ordem da página (1 = consulta de datas) ao lado de uma página genérica
  const ORDER = ['Consulta de datas', 'Acomodações', 'Passeios', 'Como chegar'];
  function slideCover(c) {
    background(c);
    glow(c, 760, 960, 600, 0.08);
    header(c, 1, true);
    const yl = title(c, L_COVER, M, 268 + S_COVER * 0.74, S_COVER, { lh: 1.06, lime: ['PRIMEIRO'] });
    const top = Math.round(yl + 64), s = 0.9, pw = GP.w * s, px = W - M - pw;
    const dateY = GT0 + 150, dateH = 214;
    c.save(); c.beginPath(); c.rect(0, top - 40, W, 1236 - top + 40); c.clip();
    genericPhone(c, px, top, s, (sc) => {
      photo(sc, 'view', 12, GT0, GSW - 24, 136);                                 // topo (foto + título)
      bars(sc, 30, GT0 + 82, [200, 140], 13, 22, 'rgba(255,255,255,0.85)');
      const y = dateY, w = GSW - 24;                                            // a consulta de datas
      fillR(sc, 12, y, w, dateH, 20, C.card);
      const fw = (w - 36) / 2;
      ['Entrada', 'Saída'].forEach((lb, i) => {
        const fx = 24 + i * (fw + 12);
        fillR(sc, fx, y + 16, fw, 74, 12, C.card2); strokeR(sc, fx, y + 16, fw, 74, 12, rgba(C.lime, 0.75), 2);
        text(sc, lb, fx + 16, y + 44, { size: 17, weight: 500, color: C.muted });
        icon(sc, 'cal', fx + fw - 26, y + 40, 26, C.lime, 0.08);
        fillR(sc, fx + 16, y + 62, 92, 11, 5.5, C.bar2);
      });
      fillR(sc, 24, y + 104, w - 24, 34, 10, C.card2);
      text(sc, 'Hóspedes', 40, y + 127, { size: 16, weight: 500, color: C.muted });
      fillR(sc, 24, y + 150, w - 24, 50, 14, C.lime);
      text(sc, 'Consultar datas', 12 + w / 2, y + 182, { size: 19, weight: 700, color: C.ink, align: 'center' });
      [['room', 0], ['pool', 1]].forEach(([k, i]) => {                          // depois: o resto da página
        const yy = y + dateH + 14 + i * 250;
        fillR(sc, 12, yy, w, 236, 20, C.card); photo(sc, k, 24, yy + 12, w - 24, 150); bars(sc, 30, yy + 182, [180, 120], 12, 22);
      });
    });
    c.restore();
    const sx = px + 14 * s, hy = top + (14 + dateY) * s, hh = dateH * s;
    highlight(c, sx + 12 * s, hy, (GSW - 24) * s, hh, 20 * s, false);
    const fg = c.createLinearGradient(0, 1090, 0, 1236);                       // a página continua, some antes do rodapé
    fg.addColorStop(0, 'rgba(5,6,6,0)'); fg.addColorStop(1, 'rgba(5,6,6,1)');
    c.fillStyle = fg; c.fillRect(0, 1090, W, 150);
    // a ordem da página, à esquerda: 1 em lima, o resto depois
    const y1 = hy + hh / 2, gap = 72;
    ORDER.forEach((lb, i) => {
      const yy = y1 + i * gap, on = i === 0, bx = M + 34;
      c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 14; c.beginPath(); c.arc(bx, yy, 32, 0, TAU); c.fillStyle = on ? C.lime : '#1D2323'; c.fill(); c.restore();
      if (!on) strokeR(c, bx - 32, yy - 32, 64, 64, 32, '#2E3636', 2);
      text(c, String(i + 1), bx, yy + 12, { fam: DISPLAY, size: 31, weight: 900, color: on ? C.ink : C.muted, align: 'center' });
      text(c, lb, bx + 54, yy + 11, { size: on ? 33 : 29, weight: on ? 700 : 500, color: on ? C.white : C.muted });
    });
    c.save(); c.setLineDash([9, 9]); c.strokeStyle = rgba(C.lime, 0.85); c.lineWidth = 3;
    const lx0 = M + 88 + measure(ORDER[0], 33, 700) + 18;
    c.beginPath(); c.moveTo(lx0, y1); c.lineTo(sx + 4, y1); c.stroke(); c.restore();
    footer(c, ['pencil'], 'O que a gente decide antes de desenhar', 1278);
  }

  // 02 — a pergunta
  function slide02(c) {
    const y0 = itemHead(c, 2, ['O HÓSPEDE CHEGA', 'COM UMA PERGUNTA'], ['PERGUNTA']);
    glow(c, 540, 820, 560, 0.09);
    const bx = M + 10, bw = W - 2 * M - 20, by = Math.max(y0 + 110, 600), bh = 400;
    c.save(); c.shadowColor = rgba(C.lime, 0.35); c.shadowBlur = 50;
    fillR(c, bx, by, bw, bh, 56, C.lime);
    c.beginPath(); c.moveTo(bx + 120, by + bh - 4); c.lineTo(bx + 40, by + bh + 92); c.lineTo(bx + 230, by + bh - 4); c.closePath(); c.fillStyle = C.lime; c.fill();
    c.restore();
    const L = ['Tem vaga nas', 'minhas datas?'], s = fit(L, 900, bw - 110, 104);
    title(c, L, bx + bw / 2, by + bh / 2 - s * 0.55 + s * 0.74 - 6, s, { align: 'center', color: C.ink, lh: 1.12 });
    // quem pergunta: avatar genérico
    const ax = bx + 40, ay = by + bh + 168;
    c.save(); c.beginPath(); c.arc(ax, ay, 58, 0, TAU); c.fillStyle = '#232A28'; c.fill(); c.clip(); icon(c, 'user', ax, ay + 6, 104, '#8A9692'); c.restore();
    strokeR(c, ax - 58, ay - 58, 116, 116, 58, '#30383A', 2);
    // reticências de quem espera resposta + calendário
    [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(ax + 110 + i * 34, ay, 9, 0, TAU); c.fillStyle = i === 2 ? C.lime : 'rgba(255,255,255,0.35)'; c.fill(); });
    chip(c, 'cal', W - M - 70, by + bh + 150, 120, false);
  }

  // 03 — página longa, sem formulário à vista: minimapa da página inteira + o celular no meio dela
  const LONG = [['view', 170], ['bars', 70], ['room', 190], ['bars', 90], ['pool', 170], ['bars', 70], ['facade', 180], ['bars', 90], ['room', 170], ['bars', 70], ['view', 170], ['bars', 90], ['pool', 170], ['bars', 70], ['room', 170]];
  function longPage(c, y) {
    const w = GSW - 24;
    let yy = y;
    LONG.forEach(([k, h]) => {
      if (k === 'bars') bars(c, 24, yy + 16, [w - 60, w - 120, w - 180], 10, 22);
      else { fillR(c, 12, yy, w, h, 18, C.card); photo(c, k, 24, yy + 12, w - 24, h - 24); }
      yy += h + 16;
    });
  }
  function slide03(c) {
    const y0 = itemHead(c, 3, ['SE ELE PRECISA', 'PROCURAR, PODE', 'DESISTIR ANTES'], ['DESISTIR']);
    const s = 0.95, pw = GP.w * s, px = W - M - pw - 24, top = y0 + 70;
    const SCROLL = 820;                                                        // a tela está no meio da página
    genericPhone(c, px, top, s, (sc) => {
      longPage(sc, GT0 - SCROLL);
      fillR(sc, GSW - 9, GT0 + 10, 4, 700, 2, 'rgba(255,255,255,0.08)');      // barra de rolagem: polegar pequeno
      fillR(sc, GSW - 10, GT0 + 200, 6, 46, 3, C.lime);
    });
    // o toque rolando (rastro para cima)
    const tx = px + (14 + 300) * s, ty = top + (14 + 600) * s;
    for (let i = 4; i >= 1; i--) { c.beginPath(); c.arc(tx, ty + i * 34, 22 - i * 3, 0, TAU); c.fillStyle = rgba(C.lime, 0.28 - i * 0.05); c.fill(); }
    touch(c, tx, ty, 1, false);
    icon(c, 'up', tx, ty - 74, 48, C.lime, 0.1);
    // minimapa: a página inteira, e a janela do que cabe na tela
    const total = LONG.reduce((a, [, h]) => a + h + 16, 0);
    const mx = M, my = top + 20, mh = H - 40 - my, mk = mh / total, mw = GSW * mk;
    c.save(); c.translate(mx, my); c.scale(mk, mk); c.globalAlpha = 0.55; longPage(c, 0); c.restore();
    const vy = my + (SCROLL - GT0 + 96) * mk, vh = (GP.h - 28 - 96) * mk;
    c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 16; strokeR(c, mx - 6, vy, mw + 12, vh, 10, C.lime, 3); c.restore();
    text(c, 'a tela', mx + mw + 22, vy + 30, { size: 26, weight: 600, color: C.lime });
    text(c, 'a página', mx + mw + 22, my + mh - 12, { size: 26, weight: 500, color: C.muted });
    c.save(); c.strokeStyle = C.bar2; c.lineWidth = 2; c.setLineDash([6, 8]);
    c.beginPath(); c.moveTo(mx + mw + 34, vy + vh + 14); c.lineTo(mx + mw + 34, my + mh - 50); c.stroke(); c.restore();
    chip(c, 'search', mx + mw + 92, vy + vh * 0.55, 104, false);
    chip(c, 'out', px + pw - 10, top + 140, 104, true);
  }

  // 04 — topo + "Consulte sua estadia" (captura real)
  function slide04(c) {
    const y0 = itemHead(c, 4, ['POR ISSO, LOGO', 'ABAIXO DO TOPO'], ['ABAIXO', 'DO', 'TOPO'], [SITE_TAG]);
    const k = 1.0, top = y0 + 26;
    const P = realPhone(c, M, top, k, true, (sc) => drawPage(sc, 0));
    // o bloco real no celular (logo abaixo do topo)
    const card = MAN.form.card;                                              // na tela rolada (form.scroll); na página: + scroll
    const cy = card.y + MAN.form.scroll;                                     // y do cartão na página
    const [hx, hy] = at(P, card.x - 6, cy - 6);
    c.save(); c.beginPath(); c.rect(P.sx, P.sy, VW * k, VH * k); c.clip();
    highlight(c, hx, hy, (card.w + 12) * k, (VH - cy + 40) * k, 16, false);
    c.restore();
    // ampliação: o mesmo bloco, da captura com o formulário à vista (Entrada, Saída, Adultos, Crianças)
    const src = { x: card.x, y: card.y, w: card.w, h: MAN.form.taps.maisCriancas.y + 53 - card.y };
    const zx = P.x + P.w + 36, zw = W - M - zx, zk = zw / src.w, zh = src.h * zk, zy = Math.min(H - 44 - zh, top + 120);
    const im = IMG['form-0'], q = im.width / VW;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.shadowOffsetY = 16; fillR(c, zx, zy, zw, zh, 22, C.site); c.restore();
    c.save(); rrect(c, zx, zy, zw, zh, 22); c.clip(); c.drawImage(im, src.x * q, src.y * q, src.w * q, src.h * q, zx, zy, zw, zh); c.restore();
    highlight(c, zx, zy, zw, zh, 22, true);
    // ligação entre o bloco no celular e a ampliação
    c.save(); c.setLineDash([10, 10]); c.strokeStyle = rgba(C.lime, 0.85); c.lineWidth = 3;
    c.beginPath(); c.moveTo(hx + (card.w + 12) * k, Math.min(hy + 60, P.sy + VH * k - 30)); c.lineTo(zx, zy + 70); c.stroke(); c.restore();
  }

  // 05 — o calendário aberto (captura real)
  function slide05(c) {
    const y0 = itemHead(c, 5, ['O CALENDÁRIO SÓ', 'ABRE QUANDO', 'ELE TOCA'], ['TOCA'], [{ text: 'Nada de calendário gigante ocupando a página.' }, SITE_TAG]);
    const top = y0 + 24, k = 1.0;                                              // pode sangrar pelo pé (o calendário fica à vista)
    const pw = VW * k + 24, px = W / 2 - pw / 2;
    glow(c, 540, top + 520, 560, 0.07);
    const P = realPhone(c, px, top, k, false, (sc) => { sc.drawImage(IMG['cal-d5'], 0, 0, VW, VH); });
    const d8 = MAN.form.taps.dia8, [tx, ty] = at(P, d8.x + d8.w / 2, d8.y + d8.h / 2);
    touch(c, tx, ty, 0.85);
    const sheet = MAN.form.cal.sheet, [sx, sy] = at(P, 0, sheet.y);
    c.save(); c.beginPath(); c.rect(P.sx - 4, P.sy, VW * k + 8, VH * k + 4); c.clip();
    highlight(c, sx + 3, sy + 3, VW * k - 6, (VH - sheet.y) * k - 6, 26 * k, true);
    c.restore();
    chip(c, 'cal', px - 80, top + 300, 116, true);
    chip(c, 'tap', px + pw + 80, top + 560, 116, false);
  }

  // 06 — Enviar + a conversa recriada (captura real + recriação do Reel do case)
  function slide06(c) {
    const y0 = itemHead(c, 6, ['UM TOQUE, E A', 'CONSULTA CHEGA', 'ORGANIZADA'], ['ORGANIZADA'], [SITE_TAG]);
    const top = y0 + 26, k = Math.min(0.98, (H + 30 - top - 12 - 30) / VH);
    const pw = VW * k + 24;
    const A = realPhone(c, M, top, k, false, (sc) => { sc.drawImage(IMG['form-3'], 0, 0, VW, VH); });
    const en = MAN.form.taps.enviar, [ex, ey] = at(A, en.x, en.y);
    highlight(c, ex - 6, ey - 6, (en.w + 12) * k, (en.h + 12) * k, 32 * k, false);
    touch(c, ex + (en.w - 13) * k, ey + en.h * k / 2, 0.55, false);             // na ponta do botão: o texto fica legível
    const B = realPhone(c, W - M - pw, top, k, true, chatScreen);
    // de um para o outro
    const ax0 = A.x + A.w + 10, ax1 = B.x - 10, ay = ey + en.h * k / 2;
    c.save(); c.strokeStyle = C.lime; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax0, ay); c.lineTo(ax1 - 6, ay); c.stroke();
    c.beginPath(); c.moveTo(ax1 - 22, ay - 16); c.lineTo(ax1 - 4, ay); c.lineTo(ax1 - 22, ay + 16); c.stroke(); c.restore();
  }

  // 07 — "Nossos chalés" (captura real)
  function slide07(c) {
    const y0 = itemHead(c, 7, ['DEPOIS,', 'OS CHALÉS'], ['CHALÉS'], [{ text: 'Com as datas resolvidas, ele escolhe onde ficar.' }, SITE_TAG]);
    const top = y0 + 24, k = 1.0, pw = VW * k + 24, px = W / 2 - pw / 2;
    glow(c, 540, top + 520, 560, 0.07);
    const sc0 = MAN.page.anchors.chales.y - 110;
    const P = realPhone(c, px, top, k, false, (sc) => drawPage(sc, sc0));
    const ch = MAN.page.anchors.chales, [hx, hy] = at(P, ch.x - 8, ch.y - sc0 - 8);
    highlight(c, hx, hy, (ch.w + 16) * k, (ch.h + 16) * k, 14, true);
    chip(c, 'bed', px - 80, top + 360, 116, true);
    chip(c, 'cal', px + pw + 80, top + 200, 116, false);
    checkBadge(c, px + pw + 80 + 44, top + 200 - 44, 20);
  }

  // 08 — fechamento
  function slideEnd(c) {
    background(c);
    glow(c, 540, 860, 600, 0.07);
    header(c, 8, true);
    const yl = title(c, L_END, M, 248 + S_END * 0.74, S_END, { lh: 1.08, lime: ['QUANTOS', 'TOQUES'] });
    // toques até a pergunta: 1 · 2 · 3 · … -> "Tem vaga?"
    const ry = yl + 150, xs = [M + 60, M + 220, M + 380];
    c.save(); c.setLineDash([10, 12]); c.strokeStyle = rgba(C.lime, 0.7); c.lineWidth = 3;
    c.beginPath(); c.moveTo(xs[0], ry); c.lineTo(W - M - 330, ry); c.stroke(); c.restore();
    xs.forEach((x, i) => {
      c.beginPath(); c.arc(x, ry, 46, 0, TAU); c.fillStyle = '#121616'; c.fill(); c.strokeStyle = rgba(C.lime, 0.8); c.lineWidth = 3; c.stroke();
      text(c, String(i + 1), x, ry + 13, { fam: DISPLAY, size: 36, weight: 900, color: C.lime, align: 'center' });
    });
    [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(M + 478 + i * 22, ry, 6, 0, TAU); c.fillStyle = C.muted; c.fill(); });
    const bw = 300, bh = 120, bx = W - M - bw, by = ry - bh / 2 - 6;
    fillR(c, bx, by, bw, bh, 30, C.lime);
    c.beginPath(); c.moveTo(bx + 40, by + bh - 2); c.lineTo(bx + 10, by + bh + 34); c.lineTo(bx + 96, by + bh - 2); c.closePath(); c.fillStyle = C.lime; c.fill();
    title(c, ['Tem vaga?'], bx + bw / 2, by + bh / 2 + 15, 38, { align: 'center', color: C.ink });
    // CTA
    const cta = 'Fale com a FAZLO · link na bio';
    const fs = 34, pw = measure(cta, fs, 700) + 132, ph = 86, py = Math.round((ry + bh / 2 + 34 + 1236) / 2 - ph / 2);
    c.save(); c.shadowColor = rgba(C.lime, 0.35); c.shadowBlur = 30; fillR(c, W / 2 - pw / 2, py, pw, ph, ph / 2, C.lime); c.restore();
    text(c, cta, W / 2 - pw / 2 + 44, py + ph / 2 + 12, { size: fs, weight: 700, color: C.ink });
    icon(c, 'arrow', W / 2 + pw / 2 - 52, py + ph / 2, 36, C.ink, 0.12);
    footer(c, [], 'Site da @pousadavaledoscanteiros por FAZLO Digital', 1278);
  }

  FZC.define({
    id: 'consulta-de-datas-primeiro',
    width: W,
    height: H,
    setup(api) {
      IMG = api.assets;
      loadLogo('full', 'FAZLO-DIGITAL-branca-transparente.svg');
      loadLogo('compact', 'FAZLO-logo-branca-transparente.svg');
      loadManifest(); layoutMessage();
      const ITEM_TITLES = [['O HÓSPEDE CHEGA', 'COM UMA PERGUNTA'], ['SE ELE PRECISA', 'PROCURAR, PODE', 'DESISTIR ANTES'], ['POR ISSO, LOGO', 'ABAIXO DO TOPO'],
        ['O CALENDÁRIO SÓ', 'ABRE QUANDO', 'ELE TOCA'], ['UM TOQUE, E A', 'CONSULTA CHEGA', 'ORGANIZADA'], ['DEPOIS,', 'OS CHALÉS']];
      S_ITEM = Math.min(84, ...ITEM_TITLES.map((L) => fit(L, 900, W - 2 * M, 100)));
      L_COVER = ['POR QUE A', 'CONSULTA DE DATAS', 'VEM PRIMEIRO', 'NO SITE'];
      S_COVER = fit(L_COVER, 900, W - 2 * M, 112);
      L_END = ['NO SEU SITE,', 'QUANTOS TOQUES', 'ATÉ O HÓSPEDE', 'PERGUNTAR SE', 'TEM VAGA?'];
      S_END = fit(L_END, 900, W - 2 * M, 84);
    },
    slides: [slideCover, slide02, slide03, slide04, slide05, slide06, slide07, slideEnd],
  });
})();
