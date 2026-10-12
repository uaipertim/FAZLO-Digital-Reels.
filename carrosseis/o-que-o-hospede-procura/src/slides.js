/* =====================================================================
   FAZLO Digital — carrossel "O que o hóspede procura antes de reservar"
   9 slides 1080x1350 (4:5), estáticos.

   Identidade do Reel "Instagram não é site": fundo #050606, verde-limão
   #C6FA41, branco; Unbounded (títulos) + Sora (textos e telas); logo do kit
   oficial (SVG) pequena no topo e o contador "01/09" no canto.

   01 capa       título + navegador com as 7 respostas numeradas
   02–08 itens   uma mini tela de site no celular mostrando aquela informação;
                 o celular fica no mesmo lugar em todos os itens, então passar
                 os slides é como rolar o mesmo site
   09 fecho      pergunta + checklist dos 7 itens para revisar + CTA

   Interfaces ilustrativas e genéricas: nenhuma pousada real, nenhum nome,
   nenhum número inventado (preços, horários e distâncias são barras).
   Disponibilidade é sempre Entrada/Saída + botão, nunca calendário aberto.
   ===================================================================== */
(function () {
  'use strict';
  const W = 1080, H = 1350, M = 72;                  // margem do conteúdo
  const TAU = Math.PI * 2;
  const { clamp, lerp, hash, rgba } = FZD.U;

  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF',
    card: '#141717', card2: '#1C2121', line: '#2A2F2F', bar: '#3A4141', bar2: '#566060', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C',
  };
  const DISPLAY = "'FZD Display'", TEXT = "'FZD Text'";
  const N = 9;

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
  // maior corpo (até max) em que todas as linhas cabem em maxW
  function fit(lines, weight, maxW, max, fam = DISPLAY, lsK = -0.02) {
    let z = max;
    while (z > 10 && lines.some((s) => measure(s, z, weight, fam, z * lsK) > maxW)) z -= 1;
    return z;
  }
  // título em Unbounded: palavras em lima conforme a lista (por prefixo)
  function title(c, lines, x, y, size, o = {}) {
    const lh = size * (o.lh || 1.1), ls = -size * 0.02, wt = o.weight || 900;
    const sp = measure(' ', size, wt, DISPLAY, ls);
    lines.forEach((line, i) => {
      let xx = x;
      if (o.align === 'center') xx = x - measure(line, size, wt, DISPLAY, ls) / 2;
      for (const w of line.split(' ')) {
        const lime = (o.lime || []).some((p) => w.startsWith(p));
        text(c, w, xx, y + i * lh, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : C.white, ls });
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
      case 'pin':
        c.moveTo(0, 0.45); c.bezierCurveTo(-0.38, 0.05, -0.36, -0.1, -0.36, -0.12); c.arc(0, -0.12, 0.36, Math.PI, 0); c.bezierCurveTo(0.36, -0.1, 0.38, 0.05, 0, 0.45); c.closePath();
        c.moveTo(0.13, -0.12); c.arc(0, -0.12, 0.13, 0, TAU); break;
      case 'clock': c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0, 0); c.lineTo(0, -0.22); c.moveTo(0, 0); c.lineTo(0.15, 0.06); break;
      case 'child': c.arc(0, -0.25, 0.13, 0, TAU); c.moveTo(0, -0.1); c.lineTo(0, 0.18); c.moveTo(-0.22, -0.02); c.lineTo(0.22, -0.02); c.moveTo(0, 0.18); c.lineTo(-0.15, 0.42); c.moveTo(0, 0.18); c.lineTo(0.15, 0.42); break;
      case 'paw': c.ellipse(0, 0.14, 0.17, 0.14, 0, 0, TAU); [[-0.24, -0.08], [-0.09, -0.24], [0.09, -0.24], [0.24, -0.08]].forEach(([px, py]) => { c.moveTo(px + 0.065, py); c.arc(px, py, 0.065, 0, TAU); }); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'menu': c.moveTo(-0.32, -0.2); c.lineTo(0.32, -0.2); c.moveTo(-0.32, 0); c.lineTo(0.32, 0); c.moveTo(-0.32, 0.2); c.lineTo(0.32, 0.2); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'bed': c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'wave': for (let k = 0; k < 2; k++) { c.moveTo(-0.4, -0.08 + k * 0.2); c.bezierCurveTo(-0.2, -0.2 + k * 0.2, 0, 0.04 + k * 0.2, 0.2, -0.08 + k * 0.2); c.lineTo(0.4, -0.08 + k * 0.2); } break;
      case 'leaf': c.moveTo(-0.3, 0.3); c.bezierCurveTo(-0.3, -0.2, 0.0, -0.36, 0.34, -0.34); c.bezierCurveTo(0.32, 0.0, 0.16, 0.3, -0.3, 0.3); c.moveTo(-0.3, 0.3); c.lineTo(0.12, -0.1); break;
      case 'cup': c.moveTo(-0.28, -0.12); c.lineTo(-0.22, 0.26); c.lineTo(0.16, 0.26); c.lineTo(0.22, -0.12); c.closePath(); c.moveTo(0.22, -0.04); c.arc(0.28, 0.06, 0.1, -Math.PI / 2, Math.PI / 2); c.moveTo(-0.1, -0.42); c.quadraticCurveTo(-0.16, -0.32, -0.08, -0.24); c.moveTo(0.06, -0.42); c.quadraticCurveTo(0.0, -0.32, 0.08, -0.24); break;
      case 'bath':
        c.moveTo(-0.44, 0); c.lineTo(0.44, 0); c.moveTo(-0.38, 0); c.lineTo(-0.34, 0.2); c.quadraticCurveTo(-0.32, 0.3, -0.22, 0.3); c.lineTo(0.22, 0.3); c.quadraticCurveTo(0.32, 0.3, 0.34, 0.2); c.lineTo(0.38, 0);
        c.moveTo(-0.28, 0); c.lineTo(-0.28, -0.3); c.quadraticCurveTo(-0.28, -0.42, -0.16, -0.42); c.quadraticCurveTo(-0.05, -0.42, -0.05, -0.32);
        c.moveTo(-0.22, 0.3); c.lineTo(-0.27, 0.4); c.moveTo(0.22, 0.3); c.lineTo(0.27, 0.4); break;
      case 'view':
        c.moveTo(-0.44, 0.32); c.lineTo(-0.14, -0.12); c.lineTo(0.04, 0.12); c.lineTo(0.18, -0.04); c.lineTo(0.44, 0.32); c.closePath();
        c.moveTo(0.29, -0.3); c.arc(0.2, -0.3, 0.09, 0, TAU); break;
      case 'tag':
        c.moveTo(0.42, -0.42); c.lineTo(0.42, -0.02); c.lineTo(-0.02, 0.42); c.lineTo(-0.42, 0.02); c.lineTo(0.0, -0.42); c.closePath();
        c.moveTo(0.29, -0.22); c.arc(0.22, -0.22, 0.07, 0, TAU); break;
      case 'car':
        c.roundRect(-0.44, -0.04, 0.88, 0.28, 0.08); c.moveTo(-0.3, -0.04); c.lineTo(-0.2, -0.3); c.lineTo(0.2, -0.3); c.lineTo(0.3, -0.04);
        c.moveTo(-0.15, 0.3); c.arc(-0.24, 0.3, 0.09, 0, TAU); c.moveTo(0.33, 0.3); c.arc(0.24, 0.3, 0.09, 0, TAU); break;
      case 'wifi':
        [0.2, 0.38, 0.56].forEach((r) => { c.moveTo(Math.cos(-2.36) * r, 0.3 + Math.sin(-2.36) * r); c.arc(0, 0.3, r, -2.36, -0.78); });
        c.stroke(); c.beginPath(); c.arc(0, 0.3, 0.06, 0, TAU); c.fill(); c.restore(); return;
      case 'snow':
        for (let k = 0; k < 6; k++) {
          const a = -Math.PI / 2 + k * Math.PI / 3, P = [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
          c.moveTo(0, 0); c.lineTo(Math.cos(a) * 0.44, Math.sin(a) * 0.44);
          c.moveTo(P[0] + Math.cos(a + 0.75) * 0.14, P[1] + Math.sin(a + 0.75) * 0.14); c.lineTo(P[0], P[1]); c.lineTo(P[0] + Math.cos(a - 0.75) * 0.14, P[1] + Math.sin(a - 0.75) * 0.14);
        } break;
      case 'map':
        c.moveTo(-0.42, -0.3); c.lineTo(-0.14, -0.4); c.lineTo(0.14, -0.3); c.lineTo(0.42, -0.4); c.lineTo(0.42, 0.3); c.lineTo(0.14, 0.4); c.lineTo(-0.14, 0.3); c.lineTo(-0.42, 0.4); c.closePath();
        c.moveTo(-0.14, -0.4); c.lineTo(-0.14, 0.3); c.moveTo(0.14, -0.3); c.lineTo(0.14, 0.4); break;
      case 'drop':
        c.moveTo(0, -0.42); c.bezierCurveTo(0.12, -0.24, 0.32, -0.04, 0.32, 0.14); c.arc(0, 0.14, 0.32, 0, Math.PI); c.bezierCurveTo(-0.32, -0.04, -0.12, -0.24, 0, -0.42); c.closePath(); break;
      case 'in':
        c.moveTo(0.06, -0.4); c.lineTo(0.38, -0.4); c.lineTo(0.38, 0.4); c.lineTo(0.06, 0.4); c.moveTo(-0.42, 0); c.lineTo(0.18, 0); c.moveTo(0.0, -0.18); c.lineTo(0.18, 0); c.lineTo(0.0, 0.18); break;
      case 'out':
        c.moveTo(-0.06, -0.4); c.lineTo(-0.38, -0.4); c.lineTo(-0.38, 0.4); c.lineTo(-0.06, 0.4); c.moveTo(-0.18, 0); c.lineTo(0.42, 0); c.moveTo(0.24, -0.18); c.lineTo(0.42, 0); c.lineTo(0.24, 0.18); break;
      case 'pointer':
        c.moveTo(-0.24, -0.42); c.lineTo(-0.24, 0.26); c.lineTo(-0.07, 0.11); c.lineTo(0.06, 0.4); c.lineTo(0.17, 0.35); c.lineTo(0.04, 0.07); c.lineTo(0.27, 0.06); c.closePath(); break;
      case 'bookmark': c.moveTo(-0.26, -0.42); c.lineTo(0.26, -0.42); c.lineTo(0.26, 0.42); c.lineTo(0, 0.2); c.lineTo(-0.26, 0.42); c.closePath(); break;
      case 'plane': c.moveTo(-0.42, -0.05); c.lineTo(0.42, -0.36); c.lineTo(0.18, 0.4); c.lineTo(0.02, 0.06); c.closePath(); c.moveTo(0.02, 0.06); c.lineTo(0.42, -0.36); break;
      case 'camera': c.roundRect(-0.42, -0.42, 0.84, 0.84, 0.22); c.moveTo(0.2, 0); c.arc(0, 0, 0.2, 0, TAU); c.moveTo(0.29, -0.26); c.arc(0.26, -0.26, 0.03, 0, TAU); break;
      case 'tap':
        c.arc(0, 0, 0.14, 0, TAU); c.fill(); c.beginPath(); c.arc(0, 0, 0.28, 0, TAU); c.moveTo(0.42, 0); c.arc(0, 0, 0.42, 0, TAU); c.globalAlpha *= 0.6; break;
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
  // chip flutuante: quadrado arredondado com ícone (elementos vivos da identidade)
  function chip(c, ic, x, y, s = 116, lime = false) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    fillR(c, x - s / 2, y - s / 2, s, s, s * 0.3, lime ? C.lime : '#151A1A'); c.restore();
    if (!lime) strokeR(c, x - s / 2, y - s / 2, s, s, s * 0.3, '#2E3636', 2);
    icon(c, ic, x, y, s * 0.5, lime ? C.ink : C.white, 0.085);
  }

  // ---------------------------------------------------------------- ilustrações ("fotos" genéricas, sem lugar real)
  function photo(c, kind, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, Math.min(16, w * 0.06)); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    switch (kind) {
      case 'room': {                                         // quarto: cama, criado-mudo, luminária, janela
        g('#E9DDCB', '#DCCAB0', 0, h * 0.7); g('#B99772', '#9C7A58', h * 0.7, h);
        c.fillStyle = '#A9C7D6'; c.fillRect(w * 0.64, h * 0.12, w * 0.24, h * 0.34); c.fillStyle = '#F1E8DA'; c.fillRect(w * 0.755, h * 0.12, w * 0.01, h * 0.34); c.fillRect(w * 0.64, h * 0.285, w * 0.24, h * 0.012);
        c.fillStyle = '#C8D9C2'; c.beginPath(); c.ellipse(w * 0.72, h * 0.42, w * 0.06, h * 0.04, 0, 0, TAU); c.fill();
        c.fillStyle = '#7D5B40'; c.fillRect(w * 0.12, h * 0.36, w * 0.5, h * 0.2);           // cabeceira
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.1, h * 0.54, w * 0.54, h * 0.2);             // colchão
        c.fillStyle = '#F4F7F7'; c.beginPath(); c.roundRect(w * 0.15, h * 0.47, w * 0.18, h * 0.1, 6); c.roundRect(w * 0.39, h * 0.47, w * 0.18, h * 0.1, 6); c.fill();
        c.fillStyle = '#5E7F94'; c.fillRect(w * 0.1, h * 0.64, w * 0.54, h * 0.1);             // manta
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.68, h * 0.56, w * 0.14, h * 0.16);           // criado-mudo
        c.fillStyle = '#F6D58B'; c.beginPath(); c.moveTo(w * 0.71, h * 0.5); c.lineTo(w * 0.79, h * 0.5); c.lineTo(w * 0.77, h * 0.43); c.lineTo(w * 0.73, h * 0.43); c.closePath(); c.fill();
        c.fillStyle = '#6E5440'; c.fillRect(w * 0.745, h * 0.5, w * 0.01, h * 0.06);
        break;
      }
      case 'bath': {                                         // banheiro: azulejo, espelho, pia, toalha
        g('#E4ECEC', '#D2DEDE');
        c.strokeStyle = 'rgba(150,170,170,0.35)'; c.lineWidth = 1;
        for (let yy = 0; yy < h; yy += h / 7) { c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke(); }
        for (let xx = 0; xx < w; xx += w / 6) { c.beginPath(); c.moveTo(xx, 0); c.lineTo(xx, h); c.stroke(); }
        c.fillStyle = '#BFD6DE'; c.beginPath(); c.roundRect(w * 0.3, h * 0.1, w * 0.4, h * 0.36, w * 0.06); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(w * 0.36, h * 0.14, w * 0.04, h * 0.28);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.2, h * 0.58, w * 0.6, h * 0.42);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(w * 0.5, h * 0.58, w * 0.18, h * 0.05, 0, 0, TAU); c.fill();
        c.fillStyle = '#9AA6A6'; c.fillRect(w * 0.49, h * 0.48, w * 0.02, h * 0.08);
        c.fillStyle = '#F2EBDD'; c.fillRect(w * 0.82, h * 0.3, w * 0.1, h * 0.36);
        c.fillStyle = '#4E8A5A'; c.beginPath(); c.ellipse(w * 0.12, h * 0.5, w * 0.05, h * 0.1, -0.3, 0, TAU); c.fill();
        break;
      }
      case 'view': {                                         // vista: serra e vale ao entardecer
        g('#F3C38F', '#F6E3C4', 0, h * 0.6);
        c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(w * 0.7, h * 0.36, Math.min(w, h) * 0.1, 0, TAU); c.fill();
        c.fillStyle = '#8FA7B8'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w * 0.22, h * 0.34); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w, h * 0.66); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#5F7E6A'; c.beginPath(); c.moveTo(0, h * 0.78); c.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.8); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#7A5C44'; c.fillRect(0, h * 0.9, w, h * 0.1);
        break;
      }
      case 'pool': {                                         // área externa com piscina e árvore
        g('#A6DBE6', '#E8F3EE', 0, h * 0.45);
        c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.45, w, h * 0.55);
        c.fillStyle = '#4FB6C8'; c.beginPath(); c.roundRect(w * 0.12, h * 0.55, w * 0.76, h * 0.32, 10); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) { c.beginPath(); for (let xx = w * 0.16; xx <= w * 0.84; xx += 6) c.lineTo(xx, h * (0.63 + 0.08 * i) + Math.sin(xx * 0.08 + i) * 2); c.stroke(); }
        c.strokeStyle = '#6B5340'; c.lineWidth = Math.max(3, w * 0.012); c.beginPath(); c.moveTo(w * 0.9, h * 0.52); c.quadraticCurveTo(w * 0.86, h * 0.36, w * 0.91, h * 0.24); c.stroke();   // árvore de copa redonda (serra, não praia)
        c.fillStyle = '#3F7350'; [[0.86, 0.2, 0.07], [0.93, 0.17, 0.065], [0.9, 0.1, 0.06]].forEach(([a1, b1, r1]) => { c.beginPath(); c.arc(w * a1, h * b1, Math.min(w, h * 2) * r1, 0, TAU); c.fill(); });
        break;
      }
      default: {                                             // fachada / área comum
        g('#CFE3EE', '#E9F1F4', 0, h * 0.5); c.fillStyle = '#F1E3CF'; c.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.6);
        c.fillStyle = '#9C6B4E'; c.beginPath(); c.moveTo(w * 0.04, h * 0.32); c.lineTo(w * 0.5, h * 0.1); c.lineTo(w * 0.96, h * 0.32); c.fill();
        c.fillStyle = '#6B8BA4'; for (let i = 0; i < 3; i++) c.fillRect(w * (0.18 + 0.24 * i), h * 0.42, w * 0.14, h * 0.16);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.44, h * 0.64, w * 0.12, h * 0.26); c.fillStyle = '#5F8A5A'; c.fillRect(0, h * 0.88, w, h * 0.12);
      }
    }
    c.restore();
  }
  // mapa abstrato: ruas, rio, represa, mata, o pin da pousada e as rotas até os passeios
  function mapArt(c, x, y, w, h, pois) {
    c.save(); rrect(c, x, y, w, h, 14); c.clip(); c.translate(x, y);
    c.fillStyle = '#182020'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#16343C'; c.lineWidth = Math.max(10, h * 0.08); c.lineCap = 'round';
    c.beginPath(); c.moveTo(w * 0.6, -12); c.bezierCurveTo(w * 0.8, h * 0.22, w * 0.62, h * 0.48, w * 0.84, h * 0.72); c.stroke();
    c.fillStyle = '#16343C'; c.beginPath(); c.ellipse(w * 0.9, h * 0.88, w * 0.2, h * 0.24, -0.35, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,190,205,0.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(w * 0.9, h * 0.88, w * (0.06 + 0.045 * i), h * (0.07 + 0.05 * i), -0.35, Math.PI * 1.05, Math.PI * 1.6); c.stroke(); }
    c.fillStyle = '#1C3324'; c.beginPath(); c.ellipse(w * 0.2, h * 0.24, w * 0.12, h * 0.16, 0.3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(w * 0.36, h * 0.84, w * 0.1, h * 0.12, -0.2, 0, TAU); c.fill();
    c.strokeStyle = '#2E3838'; c.lineWidth = 7; c.lineCap = 'round';
    [[0, 0.55, 0.7, 0.42], [0.18, 0, 0.3, 1], [0.48, 0, 0.56, 1], [0, 0.2, 0.64, 0.12], [0.05, 0.9, 0.7, 0.78]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(w * a, h * b); c.lineTo(w * cc, h * d); c.stroke(); });
    c.strokeStyle = '#263030'; c.lineWidth = 3;
    [[0.3, 0.3, 0.48, 0.72], [0.6, 0.2, 0.66, 0.6], [0.08, 0.38, 0.18, 0.7]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(w * a, h * b); c.lineTo(w * cc, h * d); c.stroke(); });
    const P = { x: w * 0.4, y: h * 0.5 };
    c.save(); c.setLineDash([8, 8]); c.strokeStyle = rgba(C.lime, 0.9); c.lineWidth = 3;
    pois.forEach((p) => { c.beginPath(); c.moveTo(P.x, P.y); c.quadraticCurveTo((P.x + p.x * w) / 2, Math.min(P.y, p.y * h) - h * 0.08, p.x * w, p.y * h); c.stroke(); });
    c.restore();
    pois.forEach((p) => { c.beginPath(); c.arc(p.x * w, p.y * h, 17, 0, TAU); c.fillStyle = C.white; c.fill(); icon(c, p.ic, p.x * w, p.y * h, 22, C.ink, 0.11); });
    c.beginPath(); c.arc(P.x, P.y, 34, 0, TAU); c.fillStyle = rgba(C.lime, 0.18); c.fill();
    c.beginPath(); c.arc(P.x, P.y, 34, 0, TAU); c.strokeStyle = rgba(C.lime, 0.5); c.lineWidth = 2; c.stroke();
    c.save(); c.translate(P.x, P.y - 22); c.fillStyle = C.lime; c.beginPath(); c.moveTo(0, 22); c.bezierCurveTo(-17, 4, -16, -4, -16, -6); c.arc(0, -6, 16, Math.PI, 0); c.bezierCurveTo(16, -4, 17, 4, 0, 22); c.fill();
    c.beginPath(); c.arc(0, -6, 6, 0, TAU); c.fillStyle = C.ink; c.fill(); c.restore();
    c.restore();
  }

  // ---------------------------------------------------------------- logo oficial (SVGs do kit, intactos)
  // full = FAZLO DIGITAL (capa e fechamento); compact = FAZLO sem "DIGITAL" (aplicações pequenas, itens)
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
    LOGOS[key] = { paths, all: box(paths), letters: box(paths.slice(0, 2)) };    // 1º traçado = letras, 2º = barra lima
  }
  // logo com largura w (do desenho, sem as margens do arquivo) a partir do canto superior esquerdo (x, y)
  function drawLogo(c, key, x, y, w) {
    const L = LOGOS[key], s = w / (L.all.x1 - L.all.x0);
    c.save(); c.translate(x - L.all.x0 * s, y - L.all.y0 * s); c.scale(s, s);
    L.paths.forEach((p) => { c.fillStyle = p.fill; c.fill(p.path, 'evenodd'); });
    c.restore();
    return { h: (L.all.y1 - L.all.y0) * s, letters: (L.letters.y1 - L.letters.y0) * s };
  }

  // ---------------------------------------------------------------- estrutura comum
  const HEAD_Y = 100;                                  // topo abaixo do contador nativo do Instagram
  const LOGO_FULL_W = 360, LOGO_COMPACT_W = 200;      // FAZLO DIGITAL legível na capa e no fecho; FAZLO nos itens
  function background(c) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = 22; y < H; y += 44) for (let x = 22; x < W; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }
  function header(c, n, full = false) {
    const lg = full ? drawLogo(c, 'full', M, HEAD_Y, LOGO_FULL_W) : drawLogo(c, 'compact', M, HEAD_Y, LOGO_COMPACT_W);
    const by = HEAD_Y + lg.letters / 2 + 10;            // contador alinhado ao miolo das letras FAZLO
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

  // ---------------------------------------------------------------- celular (mesma posição em todos os itens)
  const PH = { w: 460, h: 930 };
  const PS = 620 / PH.w, PX = W / 2 - 310;
  const SW = PH.w - 28;                                // largura da tela, em unidades da tela (432)
  function phone(c, PY, drawScreen) {
    c.save(); c.translate(PX, PY); c.scale(PS, PS);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 60; c.shadowOffsetY = 24;
    rrect(c, 0, 0, PH.w, PH.h, 62); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    strokeR(c, 0, 0, PH.w, PH.h, 62, '#30363A', 3);
    strokeR(c, 5, 5, PH.w - 10, PH.h - 10, 58, 'rgba(255,255,255,0.06)', 2);
    c.save(); rrect(c, 14, 14, PH.w - 28, PH.h - 28, 50); c.clip(); c.translate(14, 14);
    c.fillStyle = '#070808'; c.fillRect(0, 0, SW, PH.h - 28);
    // barra de status + barra de endereço (é um site, não um app); sem domínio
    icon(c, 'signal', SW - 120, 30, 26, C.white); icon(c, 'battery', SW - 52, 30, 34, C.white, 0.07);
    fillR(c, 16, 50, SW - 32, 38, 19, '#1A1F1F');
    icon(c, 'lock', 40, 69, 22, C.muted, 0.09);
    fillR(c, 58, 64, 150, 10, 5, C.bar);
    drawScreen(c);
    c.restore();
    fillR(c, PH.w / 2 - 58, 28, 116, 32, 16, '#000');
    c.restore();
  }
  // cartão de seção na tela; destaque = contorno lima + selo ✓
  function card(c, x, y, w, h, hl) {
    fillR(c, x, y, w, h, 20, C.card);
    if (hl) {
      c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 24;
      strokeR(c, x, y, w, h, 20, C.lime, 3); c.restore();
      checkBadge(c, x + w - 8, y + 8, 19);
    }
  }
  const T0 = 104;                                      // topo do conteúdo na tela

  // ---------------------------------------------------------------- slide de item
  let S_ITEM;
  function itemSlide(c, n, lines, body, screen, chips) {
    background(c);
    header(c, n);
    const y1 = 200 + S_ITEM * 0.74;                    // linha de base do título
    const yl = title(c, lines, M, y1, S_ITEM, { lime: [lines[0].split(' ')[0]] });
    const bl = body.split('\n').flatMap((part) => wrap(part, 35, 500, W - 2 * M));   // \n = quebra escolhida
    bl.forEach((s, i) => text(c, s, M, yl + 72 + i * 50, { size: 35, weight: 500, color: C.soft }));
    // o celular sobe quando o texto é curto (sem faixa vazia); chips acompanham
    const py = clamp(yl + 72 + (bl.length - 1) * 50 + 112, 460, 612), dy = py - 612;
    glow(c, 540, py + 380, 560, 0.075);
    phone(c, py, screen);
    chips.forEach((k) => chip(c, k.ic, k.x, k.y + dy, k.s, k.lime));
  }

  // ---------------------------------------------------------------- telas dos itens (unidades da tela: 432 de largura)
  function scrFotos(c) {
    const x = 12, y = T0, w = SW - 24, h = 394;
    card(c, x, y, w, h, true);
    let tx = x + 16;
    [['Quartos', true], ['Piscina', false], ['Área comum', false]].forEach(([s, on]) => {
      const tw = measure(s, 17, 600) + 30;
      fillR(c, tx, y + 18, tw, 38, 19, on ? C.lime : C.card2);
      text(c, s, tx + 15, y + 43, { size: 17, weight: 600, color: on ? C.ink : C.soft });
      tx += tw + 8;
    });
    photo(c, 'room', x + 14, y + 70, w - 28, 196);
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x + w / 2 - 32 + i * 16, y + 248, 4.5, 0, TAU); c.fillStyle = i ? 'rgba(255,255,255,0.55)' : C.white; c.fill(); }
    const th = 98, tw3 = (w - 28 - 16) / 3;
    [['room', 'Cama'], ['bath', 'Banheiro'], ['view', 'Vista']].forEach(([k, lb], i) => {
      const px = x + 14 + i * (tw3 + 8), py = y + 280;
      photo(c, k, px, py, tw3, th);
      const gr = c.createLinearGradient(0, py + th * 0.45, 0, py + th); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)');
      c.save(); rrect(c, px, py, tw3, th, 8); c.clip(); c.fillStyle = gr; c.fillRect(px, py, tw3, th); c.restore();
      text(c, lb, px + 10, py + th - 12, { size: 16, weight: 700, color: C.white });
      if (i === 0) strokeR(c, px, py, tw3, th, 8, C.lime, 3);
    });
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'pool', x + 14, y + h + 28, w - 28, 200);
  }
  function scrValor(c) {
    const x = 12, y = T0, w = SW - 24, h = 364;
    card(c, x, y, w, h, false);
    photo(c, 'room', x + 14, y + 14, w - 28, 172);
    text(c, 'Acomodação', x + 18, y + 226, { size: 23, weight: 700, color: C.white });
    fillR(c, x + 18, y + 242, 190, 9, 4.5, C.bar);
    const py = y + 266, ph = 84;                        // bloco do preço, em destaque
    c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 24; strokeR(c, x + 10, py, w - 20, ph, 16, C.lime, 3); c.restore();
    fillR(c, x + 10, py, w - 20, ph, 16, rgba(C.lime, 0.08));
    text(c, 'a partir de', x + 26, py + 32, { size: 19, weight: 600, color: C.lime });
    text(c, 'R$', x + 26, py + 68, { size: 27, weight: 700, color: C.white });
    fillR(c, x + 70, py + 48, 110, 22, 11, C.bar2);
    text(c, '/ noite', x + 192, py + 68, { size: 19, weight: 500, color: C.muted });
    checkBadge(c, x + w - 18, py + 8, 19);
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'view', x + 14, y + h + 28, w - 28, 200);
  }
  function scrVaga(c) {
    const x = 12, y = T0, w = SW - 24, h = 300;
    card(c, x, y, w, h, true);
    const fw = (w - 36) / 2;
    ['Entrada', 'Saída'].forEach((lb, i) => {
      const fx = x + 12 + i * (fw + 12), fy = y + 16;
      fillR(c, fx, fy, fw, 80, 12, C.card2);
      strokeR(c, fx, fy, fw, 80, 12, rgba(C.lime, 0.75), 2);
      text(c, lb, fx + 16, fy + 30, { size: 17, weight: 500, color: C.muted });
      icon(c, 'cal', fx + fw - 26, fy + 25, 26, C.lime, 0.08);
      fillR(c, fx + 16, fy + 50, 96, 12, 6, '#DCE2E2');     // data escolhida (sem número)
    });
    const by = y + 110;
    fillR(c, x + 12, by, w - 24, 64, 14, C.lime);
    text(c, 'Consultar disponibilidade', x + w / 2, by + 41, { size: 21, weight: 700, color: C.ink, align: 'center' });
    const ry = by + 80;                                 // resposta na hora
    fillR(c, x + 12, ry, w - 24, 84, 14, rgba(C.lime, 0.12));
    c.beginPath(); c.arc(x + 50, ry + 42, 20, 0, TAU); c.fillStyle = C.lime; c.fill(); icon(c, 'check', x + 50, ry + 43, 30, C.ink, 0.14);
    text(c, 'Disponível', x + 84, ry + 38, { size: 22, weight: 700, color: C.white });
    text(c, 'para as datas escolhidas', x + 84, ry + 64, { size: 16, weight: 500, color: C.soft });
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'room', x + 14, y + h + 28, w - 28, 200);
  }
  function scrLocal(c) {
    const x = 12, y = T0, w = SW - 24, h = 430;
    card(c, x, y, w, h, true);
    text(c, 'Localização', x + 18, y + 38, { size: 22, weight: 700, color: C.white });
    mapArt(c, x + 12, y + 54, w - 24, 196, [{ x: 0.72, y: 0.2, ic: 'drop' }, { x: 0.12, y: 0.18, ic: 'leaf' }, { x: 0.22, y: 0.84, ic: 'view' }]);
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'pool', x + 14, y + h + 28, w - 28, 200);
    [['drop', 'Cachoeira'], ['leaf', 'Trilha'], ['view', 'Mirante']].forEach(([ic, lb], i) => {
      const ry = y + 266 + i * 52;
      c.beginPath(); c.arc(x + 36, ry + 18, 18, 0, TAU); c.fillStyle = C.card2; c.fill();
      icon(c, ic, x + 36, ry + 18, 24, C.soft, 0.1);
      text(c, lb, x + 66, ry + 25, { size: 19, weight: 600, color: C.white });
      fillR(c, x + w - 150, ry + 12, 56 + 14 * i, 12, 6, C.bar2);      // distância (sem número)
      text(c, 'km', x + w - 18, ry + 25, { size: 17, weight: 500, color: C.muted, align: 'right' });
    });
  }
  function scrIncluso(c) {
    const x = 12, y = T0, w = SW - 24, h = 334;
    card(c, x, y, w, h, true);
    text(c, 'O que está incluso', x + 18, y + 38, { size: 22, weight: 700, color: C.white });
    const tw = (w - 36) / 2, th = 126;
    [['cup', 'Café da manhã'], ['car', 'Estacionamento'], ['wifi', 'Wi-Fi'], ['snow', 'Ar-condicionado']].forEach(([ic, lb], i) => {
      const tx = x + 12 + (i % 2) * (tw + 12), ty = y + 58 + Math.floor(i / 2) * (th + 12);
      fillR(c, tx, ty, tw, th, 14, C.card2);
      icon(c, ic, tx + 38, ty + 42, 44, C.white, 0.08);
      const fs = Math.min(18, Math.floor(18 * (tw - 28) / measure(lb, 18, 600)));
      text(c, lb, tx + 16, ty + th - 22, { size: fs, weight: 600, color: C.white });
      c.beginPath(); c.arc(tx + tw - 24, ty + 26, 13, 0, TAU); c.fillStyle = C.lime; c.fill(); icon(c, 'check', tx + tw - 24, ty + 27, 20, C.ink, 0.15);
    });
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'pool', x + 14, y + h + 28, w - 28, 200);
  }
  function scrRegras(c) {
    const x = 12, y = T0, w = SW - 24, h = 330;
    card(c, x, y, w, h, true);
    text(c, 'Regras da hospedagem', x + 18, y + 38, { size: 22, weight: 700, color: C.white });
    [['in', 'Check-in', 92], ['out', 'Check-out', 92], ['child', 'Crianças', 130], ['paw', 'Pets', 112]].forEach(([ic, lb, bw], i) => {
      const ry = y + 58 + i * 66;
      fillR(c, x + 12, ry, w - 24, 56, 12, C.card2);
      icon(c, ic, x + 42, ry + 28, 28, C.lime, 0.1);
      text(c, lb, x + 72, ry + 35, { size: 20, weight: 600, color: C.white });
      fillR(c, x + w - 30 - bw, ry + 22, bw, 12, 6, C.bar2);            // regra (sem horário inventado)
    });
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'room', x + 14, y + h + 28, w - 28, 200);
  }
  function scrReservar(c) {
    const x = 12, y = T0, w = SW - 24, h = 372;
    card(c, x, y, w, h, false);
    photo(c, 'room', x + 14, y + 14, w - 28, 160);
    text(c, 'Acomodação', x + 18, y + 212, { size: 23, weight: 700, color: C.white });
    fillR(c, x + 18, y + 230, 160, 9, 4.5, C.bar);
    fillR(c, x + 18, y + 248, 110, 9, 4.5, C.bar);
    const by = y + 276, bh = 76;                        // o botão claro
    c.save(); c.shadowColor = rgba(C.lime, 0.6); c.shadowBlur = 36; fillR(c, x + 12, by, w - 24, bh, 18, C.lime); c.restore();
    text(c, 'Reservar', x + w / 2, by + 49, { size: 28, weight: 800, color: C.ink, align: 'center' });
    const tx = x + w * 0.86, ty = by + bh * 0.6;        // toque
    [44, 30].forEach((r, i) => { c.beginPath(); c.arc(tx, ty, r, 0, TAU); c.strokeStyle = `rgba(255,255,255,${0.35 + i * 0.25})`; c.lineWidth = 3; c.stroke(); });
    c.beginPath(); c.arc(tx, ty, 16, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
    card(c, x, y + h + 14, w, 260, false);
    photo(c, 'view', x + 14, y + h + 28, w - 28, 200);
  }

  // ---------------------------------------------------------------- capa: o site com as 7 respostas
  function coverBrowser(c, y) {
    const x = M, w = W - 2 * M, h = 1200 - y;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 50; c.shadowOffsetY = 20; fillR(c, x, y, w, h, 24, '#0D1010'); c.restore();
    strokeR(c, x, y, w, h, 24, '#2E3434', 2);
    [0, 1, 2].forEach((i) => { c.beginPath(); c.arc(x + 30 + i * 24, y + 30, 7.5, 0, TAU); c.fillStyle = '#3A4040'; c.fill(); });
    fillR(c, x + 116, y + 14, w - 150, 32, 16, '#1A1F1F');
    icon(c, 'lock', x + 140, y + 30, 22, C.muted, 0.09);
    fillR(c, x + 160, y + 25, 170, 10, 5, C.bar);
    const cx = x + 22, cy = y + 66, cw = w - 44, CH = h - 66 - 22;
    const lw = 486, rx = cx + lw + 18, rw = cw - lw - 18, G = 12;
    const B = [];                                        // posições dos selos numerados (1..7)
    // 1 fotos de cada quarto: foto grande + banheiro, vista, piscina
    const ph1 = Math.round(CH * 0.44), th = Math.round(CH * 0.17);
    photo(c, 'room', cx, cy, lw, ph1);
    ['bath', 'view', 'pool'].forEach((k, i) => photo(c, k, cx + i * ((lw - 16) / 3 + 8), cy + ph1 + 10, (lw - 16) / 3, th));
    B[0] = [cx, cy];
    // 4 onde fica
    const my = cy + ph1 + 10 + th + G;
    mapArt(c, cx, my, lw, cy + CH - my, [{ x: 0.72, y: 0.24, ic: 'drop' }, { x: 0.14, y: 0.24, ic: 'leaf' }, { x: 0.3, y: 0.82, ic: 'view' }]);
    B[3] = [cx, my];
    // coluna da direita: 2 valor, 3 vaga, 5 incluso, 6 regras, 7 reservar
    const hs = [0.205, 0.285, 0.145, 0.145], hk = CH - 4 * G - hs.reduce((a, v) => a + Math.round(CH * v), 0);
    let ry = cy;
    const hP = Math.round(CH * hs[0]);
    fillR(c, rx, ry, rw, hP, 14, C.card);
    text(c, 'a partir de', rx + 20, ry + hP * 0.42, { size: 18, weight: 600, color: C.lime });
    text(c, 'R$', rx + 20, ry + hP * 0.8, { size: 24, weight: 700, color: C.white });
    fillR(c, rx + 60, ry + hP * 0.8 - 18, 96, 18, 9, C.bar2);
    text(c, '/ noite', rx + 168, ry + hP * 0.8, { size: 17, weight: 500, color: C.muted });
    B[1] = [rx, ry]; ry += hP + G;
    const hV = Math.round(CH * hs[1]), fw = (rw - 30) / 2, fh = Math.round(hV * 0.46);
    fillR(c, rx, ry, rw, hV, 14, C.card);
    ['Entrada', 'Saída'].forEach((lb, i) => {
      const fx = rx + 10 + i * (fw + 10);
      fillR(c, fx, ry + 10, fw, fh, 10, C.card2);
      text(c, lb, fx + 14, ry + 10 + fh * 0.42, { size: 15, weight: 500, color: C.muted });
      fillR(c, fx + 14, ry + 10 + fh * 0.64, 58, 8, 4, C.bar);
    });
    const bh = hV - fh - 30;
    fillR(c, rx + 10, ry + fh + 20, rw - 20, bh, 10, C.lime);
    text(c, 'Consultar disponibilidade', rx + rw / 2, ry + fh + 20 + bh / 2 + 6, { size: 16, weight: 700, color: C.ink, align: 'center' });
    B[2] = [rx, ry]; ry += hV + G;
    const hI = Math.round(CH * hs[2]);
    fillR(c, rx, ry, rw, hI, 14, C.card);
    ['cup', 'car', 'wifi', 'snow'].forEach((ic, i) => icon(c, ic, rx + 44 + i * ((rw - 60) / 4 + 2), ry + hI / 2, 32, C.white, 0.09));
    B[4] = [rx, ry]; ry += hI + G;
    const hR = Math.round(CH * hs[3]);
    fillR(c, rx, ry, rw, hR, 14, C.card);
    ['in', 'child', 'paw'].forEach((ic, i) => { icon(c, ic, rx + 32 + i * 116, ry + hR / 2, 26, C.lime, 0.1); fillR(c, rx + 54 + i * 116, ry + hR / 2 - 4, 46, 9, 4.5, C.bar2); });
    B[5] = [rx, ry]; ry += hR + G;
    fillR(c, rx, ry, rw, hk, 14, C.lime);
    text(c, 'Reservar', rx + rw / 2, ry + hk / 2 + 9, { size: 24, weight: 800, color: C.ink, align: 'center' });
    B[6] = [rx, ry];
    // selos numerados
    B.forEach(([bx, by], i) => {
      const r = 23, px = bx + 2, py = by + 2;
      c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 12; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fillStyle = C.lime; c.fill(); c.restore();
      c.beginPath(); c.arc(px, py, r, 0, TAU); c.strokeStyle = C.bg; c.lineWidth = 4; c.stroke();
      text(c, String(i + 1), px, py + 9, { fam: DISPLAY, size: 25, weight: 900, color: C.ink, align: 'center' });
    });
  }

  // ---------------------------------------------------------------- slides
  const ITEMS = [
    { lines: ['1. FOTOS DE', 'CADA QUARTO'], body: 'Não só a piscina. Ele quer ver onde vai dormir: cama, banheiro, vista.', scr: scrFotos,
      chips: [{ ic: 'bed', x: 168, y: 790 }, { ic: 'bath', x: 930, y: 930 }, { ic: 'view', x: 150, y: 1150 }] },
    { lines: ['2. UM VALOR DE', 'REFERÊNCIA'], body: 'Um “a partir de” já ajuda a decidir. Sem nenhum valor, ele precisa perguntar antes de seguir.', scr: scrValor,
      chips: [{ ic: 'tag', x: 160, y: 1010, lime: true }, { ic: 'check', x: 924, y: 820 }] },
    { lines: ['3. SE TEM VAGA'], body: 'Escolher entrada e saída sem depender\nde resposta no direct.', scr: scrVaga,
      chips: [{ ic: 'cal', x: 160, y: 800 }, { ic: 'clock', x: 926, y: 1010, lime: true }] },
    { lines: ['4. ONDE FICA'], body: 'Mapa e distância até os passeios que ele veio fazer.', scr: scrLocal,
      chips: [{ ic: 'pin', x: 160, y: 820, lime: true }, { ic: 'map', x: 926, y: 1080 }] },
    { lines: ['5. O QUE ESTÁ', 'INCLUSO'], body: 'Café da manhã, estacionamento, Wi-Fi, ar-condicionado: tudo à vista.', scr: scrIncluso,
      chips: [{ ic: 'cup', x: 160, y: 800 }, { ic: 'wifi', x: 926, y: 960, lime: true }, { ic: 'car', x: 150, y: 1170 }] },
    { lines: ['6. AS REGRAS'], body: 'Check-in, check-out, crianças, pets. O que ele pergunta antes de fechar.', scr: scrRegras,
      chips: [{ ic: 'child', x: 160, y: 900 }, { ic: 'paw', x: 926, y: 790, lime: true }] },
    { lines: ['7. COMO', 'RESERVAR'], body: 'Um botão claro. Sem precisar caçar o WhatsApp.', scr: scrReservar,
      chips: [{ ic: 'pointer', x: 926, y: 800, lime: true }, { ic: 'check', x: 160, y: 1010 }] },
  ];
  const CHECK = ['Fotos de cada quarto', 'Um valor de referência', 'Se tem vaga', 'Onde fica', 'O que está incluso', 'As regras', 'Como reservar'];
  const CHECK_IC = ['bed', 'tag', 'cal', 'pin', 'cup', 'child', 'pointer'];
  let S_COVER, L_COVER, S_END, L_END;

  function slideCover(c) {
    background(c);
    glow(c, 540, 900, 620, 0.08);
    header(c, 1, true);
    const yl = title(c, L_COVER, M, 266 + S_COVER * 0.74, S_COVER, { lh: 1.08, lime: ['ANTES', 'DE', 'RESERVAR'] });
    coverBrowser(c, Math.round(yl + 86));
    footer(c, ['bookmark'], 'Salve para revisar a sua pousada', 1278);
  }
  function slideEnd(c) {
    background(c);
    glow(c, 540, 820, 600, 0.07);
    header(c, 9, true);
    const yl = title(c, L_END, M, 248 + S_END * 0.74, S_END, { lh: 1.1, lime: ['ONLINE?'] });
    // checklist para revisar a própria pousada
    const x = M, y = yl + 56, w = W - 2 * M, rh = 60, h = CHECK.length * rh + 28;
    fillR(c, x, y, w, h, 24, C.card);
    strokeR(c, x, y, w, h, 24, C.line, 2);
    CHECK.forEach((s, i) => {
      const ry = y + 14 + i * rh;
      if (i) { c.fillStyle = C.line; c.fillRect(x + 24, ry, w - 48, 1.5); }
      text(c, String(i + 1), x + 40, ry + 41, { fam: DISPLAY, size: 26, weight: 900, color: C.lime, align: 'center' });
      icon(c, CHECK_IC[i], x + 92, ry + 30, 32, C.soft, 0.09);
      text(c, s, x + 128, ry + 40, { size: 29, weight: 600, color: C.white });
      strokeR(c, x + w - 64, ry + 13, 34, 34, 9, '#5C6666', 3);
    });
    // CTA
    const cta = 'Se não, fale com a FAZLO · link na bio';
    const fs = 33, pw = measure(cta, fs, 700) + 132, ph = 84, py = Math.round((y + h + 1236) / 2 - ph / 2);
    c.save(); c.shadowColor = rgba(C.lime, 0.35); c.shadowBlur = 30; fillR(c, W / 2 - pw / 2, py, pw, ph, ph / 2, C.lime); c.restore();
    text(c, cta, W / 2 - pw / 2 + 44, py + ph / 2 + 12, { size: fs, weight: 700, color: C.ink });
    icon(c, 'arrow', W / 2 + pw / 2 - 52, py + ph / 2, 36, C.ink, 0.12);
    footer(c, ['bookmark', 'plane'], 'Salve e mande para quem cuida das reservas', 1278);
  }

  FZC.define({
    id: 'o-que-o-hospede-procura',
    width: W,
    height: H,
    setup() {
      loadLogo('full', 'FAZLO-DIGITAL-branca-transparente.svg');
      loadLogo('compact', 'FAZLO-logo-branca-transparente.svg');
      S_ITEM = Math.min(84, ...ITEMS.map((it) => fit(it.lines, 900, W - 2 * M, 100)));
      L_COVER = ['O QUE O HÓSPEDE', 'PROCURA ANTES', 'DE RESERVAR'];
      S_COVER = fit(L_COVER, 900, W - 2 * M, 120);
      L_END = ['SUA POUSADA', 'RESPONDE TUDO ISSO', 'SEM VOCÊ PRECISAR', 'ESTAR ONLINE?'];
      S_END = fit(L_END, 900, W - 2 * M, 80);
    },
    slides: [
      slideCover,
      ...ITEMS.map((it, i) => (c) => itemSlide(c, i + 2, it.lines, it.body, it.scr, it.chips)),
      slideEnd,
    ],
  });
})();
