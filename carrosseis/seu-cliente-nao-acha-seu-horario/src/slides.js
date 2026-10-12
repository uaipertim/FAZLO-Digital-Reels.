/* =====================================================================
   FAZLO Digital — carrossel "Seu cliente não acha seu horário"
   8 slides 1080x1350 (4:5), estáticos. Público: negócios em geral.

   Mesmo padrão dos carrosséis anteriores: fundo #050606, verde-limão
   #C6FA41, branco; Unbounded (títulos) + Sora (textos e telas); FAZLO
   DIGITAL na capa e no fechamento, FAZLO compacto nos itens; topo abaixo
   do contador nativo do Instagram.

   01 capa       título + subtítulo + os 6 negócios, cada um com a sua informação (1–6)
   02–07 itens   mini tela de site de um tipo de negócio diferente, com a informação
                 do item em destaque; o celular fica na MESMA posição em todos os itens
                 02 padaria (horário) · 03 loja de roupas (endereço com mapa) ·
                 04 clínica (WhatsApp) · 05 restaurante (cardápio) ·
                 06 pousada (preço de referência) · 07 pet shop (formas de pagamento)
   08 fecho      pergunta + checklist dos 6 itens (caixas vazias) + CTA

   Interfaces ilustrativas e genéricas: nenhum negócio real, nenhum nome;
   horários, preços, endereços e números aparecem como BARRAS.
   ===================================================================== */
(function () {
  'use strict';
  const W = 1080, H = 1350, M = 72;
  const TAU = Math.PI * 2;
  const { clamp, rgba } = FZD.U;

  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF',
    card: '#141717', card2: '#1C2121', line: '#2A2F2F', bar: '#3A4141', bar2: '#566060', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C',
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
  // linhas de texto genéricas (barras)
  function bars(c, x, y, ws, h = 10, gap = 20, col = C.bar) { ws.forEach((w, i) => fillR(c, x, y + i * gap, w, h, h / 2, col)); }

  // ---------------------------------------------------------------- ícones (traço, caixa unitária)
  function icon(c, kind, x, y, s, color = C.white, lw = 0.09) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'clock': c.arc(0, 0, 0.38, 0, TAU); c.moveTo(0, 0); c.lineTo(0, -0.22); c.moveTo(0, 0); c.lineTo(0.16, 0.08); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'pin':
        c.moveTo(0, 0.45); c.bezierCurveTo(-0.38, 0.05, -0.36, -0.1, -0.36, -0.12); c.arc(0, -0.12, 0.36, Math.PI, 0); c.bezierCurveTo(0.36, -0.1, 0.38, 0.05, 0, 0.45); c.closePath();
        c.moveTo(0.13, -0.12); c.arc(0, -0.12, 0.13, 0, TAU); break;
      case 'map':
        c.moveTo(-0.42, -0.3); c.lineTo(-0.14, -0.4); c.lineTo(0.14, -0.3); c.lineTo(0.42, -0.4); c.lineTo(0.42, 0.3); c.lineTo(0.14, 0.4); c.lineTo(-0.14, 0.3); c.lineTo(-0.42, 0.4); c.closePath();
        c.moveTo(-0.14, -0.4); c.lineTo(-0.14, 0.3); c.moveTo(0.14, -0.3); c.lineTo(0.14, 0.4); break;
      case 'chat':                                  // conversa (genérico, sem logo)
        c.roundRect(-0.4, -0.34, 0.8, 0.56, 0.14); c.moveTo(-0.2, 0.22); c.lineTo(-0.3, 0.4); c.lineTo(0.02, 0.22);
        c.moveTo(-0.2, -0.06); c.lineTo(0.2, -0.06); c.moveTo(-0.2, 0.06); c.lineTo(0.08, 0.06); break;
      case 'pointer':
        c.moveTo(-0.24, -0.42); c.lineTo(-0.24, 0.26); c.lineTo(-0.07, 0.11); c.lineTo(0.06, 0.4); c.lineTo(0.17, 0.35); c.lineTo(0.04, 0.07); c.lineTo(0.27, 0.06); c.closePath(); break;
      case 'list':
        for (let k = 0; k < 3; k++) { const yy = -0.24 + k * 0.24; c.moveTo(-0.36, yy); c.arc(-0.32, yy, 0.04, 0, TAU); c.moveTo(-0.14, yy); c.lineTo(0.38, yy); } break;
      case 'fork':                                  // talheres
        c.moveTo(-0.18, -0.4); c.lineTo(-0.18, 0.4); c.moveTo(-0.3, -0.4); c.lineTo(-0.3, -0.14); c.quadraticCurveTo(-0.3, -0.02, -0.18, -0.02); c.quadraticCurveTo(-0.06, -0.02, -0.06, -0.14); c.lineTo(-0.06, -0.4);
        c.moveTo(0.22, 0.4); c.lineTo(0.22, -0.4); c.quadraticCurveTo(0.04, -0.3, 0.06, 0.02); c.lineTo(0.22, 0.02); break;
      case 'tag':
        c.moveTo(0.42, -0.42); c.lineTo(0.42, -0.02); c.lineTo(-0.02, 0.42); c.lineTo(-0.42, 0.02); c.lineTo(0.0, -0.42); c.closePath();
        c.moveTo(0.29, -0.22); c.arc(0.22, -0.22, 0.07, 0, TAU); break;
      case 'bed': c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'card': c.roundRect(-0.42, -0.28, 0.84, 0.56, 0.08); c.moveTo(-0.42, -0.1); c.lineTo(0.42, -0.1); c.moveTo(-0.28, 0.14); c.lineTo(-0.06, 0.14); break;
      case 'bolt': c.moveTo(0.08, -0.44); c.lineTo(-0.26, 0.06); c.lineTo(-0.02, 0.06); c.lineTo(-0.1, 0.44); c.lineTo(0.26, -0.08); c.lineTo(0.02, -0.08); c.closePath(); break;
      case 'split':                                 // parcelado: cartões em pilha
        c.roundRect(-0.36, -0.12, 0.72, 0.46, 0.07); c.moveTo(-0.28, -0.22); c.lineTo(0.28, -0.22); c.moveTo(-0.2, -0.32); c.lineTo(0.2, -0.32); break;
      case 'paw': c.ellipse(0, 0.14, 0.17, 0.14, 0, 0, TAU); [[-0.24, -0.08], [-0.09, -0.24], [0.09, -0.24], [0.24, -0.08]].forEach(([px, py]) => { c.moveTo(px + 0.065, py); c.arc(px, py, 0.065, 0, TAU); }); break;
      case 'bread':                                 // pão
        c.moveTo(-0.42, 0.18); c.bezierCurveTo(-0.46, -0.3, 0.46, -0.3, 0.42, 0.18); c.closePath();
        c.moveTo(-0.18, -0.06); c.lineTo(-0.1, 0.06); c.moveTo(0.02, -0.1); c.lineTo(0.1, 0.02); c.moveTo(0.2, -0.04); c.lineTo(0.26, 0.06); break;
      case 'hanger':                                // cabide
        c.moveTo(0, -0.14); c.lineTo(0, -0.22); c.arc(0.06, -0.3, 0.09, Math.PI * 0.95, Math.PI * 2.4);
        c.moveTo(0, -0.14); c.lineTo(-0.44, 0.2); c.lineTo(0.44, 0.2); c.closePath(); break;
      case 'cross': c.moveTo(-0.1, -0.38); c.lineTo(0.1, -0.38); c.lineTo(0.1, -0.1); c.lineTo(0.38, -0.1); c.lineTo(0.38, 0.1); c.lineTo(0.1, 0.1); c.lineTo(0.1, 0.38); c.lineTo(-0.1, 0.38); c.lineTo(-0.1, 0.1); c.lineTo(-0.38, 0.1); c.lineTo(-0.38, -0.1); c.lineTo(-0.1, -0.1); c.closePath(); break;
      case 'menu': c.moveTo(-0.32, -0.2); c.lineTo(0.32, -0.2); c.moveTo(-0.32, 0); c.lineTo(0.32, 0); c.moveTo(-0.32, 0.2); c.lineTo(0.32, 0.2); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'bookmark': c.moveTo(-0.26, -0.42); c.lineTo(0.26, -0.42); c.lineTo(0.26, 0.42); c.lineTo(0, 0.2); c.lineTo(-0.26, 0.42); c.closePath(); break;
      case 'plane': c.moveTo(-0.42, -0.05); c.lineTo(0.42, -0.36); c.lineTo(0.18, 0.4); c.lineTo(0.02, 0.06); c.closePath(); c.moveTo(0.02, 0.06); c.lineTo(0.42, -0.36); break;
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
  function chip(c, ic, x, y, s = 116, lime = false) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    fillR(c, x - s / 2, y - s / 2, s, s, s * 0.3, lime ? C.lime : '#151A1A'); c.restore();
    if (!lime) strokeR(c, x - s / 2, y - s / 2, s, s, s * 0.3, '#2E3636', 2);
    icon(c, ic, x, y, s * 0.5, lime ? C.ink : C.white, 0.085);
  }
  // toque: círculo lima com centro branco e onda
  function touch(c, x, y, s = 1) {
    [44, 30].forEach((r, i) => { c.beginPath(); c.arc(x, y, r * s, 0, TAU); c.strokeStyle = `rgba(255,255,255,${0.35 + i * 0.25})`; c.lineWidth = 3; c.stroke(); });
    c.beginPath(); c.arc(x, y, 16 * s, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
  }

  // ---------------------------------------------------------------- ilustrações planas (genéricas, sem lugar real)
  function photo(c, kind, x, y, w, h, v = 0) {
    c.save(); rrect(c, x, y, w, h, Math.min(16, w * 0.06)); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    const ell = (cx, cy, rx, ry, col, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fill(); };
    switch (kind) {
      case 'bakery': {                                       // balcão com pães, toldo listrado
        g('#F4E6CF', '#EAD6B6', 0, h * 0.62); g('#9B6B45', '#7E5434', h * 0.62, h);
        for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#F7EFE2' : '#C4553A'; c.fillRect(i * w / 9, 0, w / 9 + 1, h * 0.14); }
        c.fillStyle = '#C4553A'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc((i + 0.5) * w / 9, h * 0.14, w / 18, 0, Math.PI); c.fill(); }
        c.fillStyle = '#B98A5A'; c.fillRect(w * 0.06, h * 0.36, w * 0.88, h * 0.03); c.fillRect(w * 0.06, h * 0.56, w * 0.88, h * 0.03);
        for (let i = 0; i < 6; i++) ell(w * (0.14 + i * 0.145), h * 0.31, w * 0.055, h * 0.055, i % 2 ? '#D49A55' : '#C07E3E');
        ell(w * 0.3, h * 0.51, w * 0.16, h * 0.04, '#D8A867', -0.08); ell(w * 0.68, h * 0.51, w * 0.15, h * 0.04, '#C98E4D', 0.06);
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(w * 0.06, h * 0.64, w * 0.88, h * 0.05);
        for (let i = 0; i < 4; i++) ell(w * (0.2 + i * 0.2), h * 0.8, w * 0.07, h * 0.05, i % 2 ? '#E2B676' : '#B9773A');
        break;
      }
      case 'clothes': {                                      // arara com roupas e planta
        g('#EEE7DF', '#E2D8CC', 0, h * 0.8); g('#C9B79F', '#B8A387', h * 0.8, h);
        c.strokeStyle = '#4B4B4B'; c.lineWidth = Math.max(3, h * 0.025);
        c.beginPath(); c.moveTo(w * 0.08, h * 0.2); c.lineTo(w * 0.78, h * 0.2); c.moveTo(w * 0.1, h * 0.2); c.lineTo(w * 0.1, h * 0.82); c.moveTo(w * 0.76, h * 0.2); c.lineTo(w * 0.76, h * 0.82); c.stroke();
        const cols = ['#2F5D7C', '#D9A441', '#B6503F', '#F1EDE6', '#4E7B5B', '#8E6FA8'];
        cols.forEach((col, i) => {
          const cx = w * (0.17 + i * 0.105), top = h * 0.23, len = h * (0.36 + 0.12 * (i % 3 === 1));
          c.fillStyle = col; c.beginPath(); c.moveTo(cx - w * 0.04, top); c.lineTo(cx + w * 0.04, top); c.lineTo(cx + w * 0.055, top + len); c.lineTo(cx - w * 0.055, top + len); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, top - h * 0.03); c.lineTo(cx, top); c.stroke();
        });
        c.fillStyle = '#9C7A58'; c.fillRect(w * 0.84, h * 0.62, w * 0.1, h * 0.2);
        ell(w * 0.89, h * 0.5, w * 0.07, h * 0.14, '#4E8A5A'); ell(w * 0.85, h * 0.56, w * 0.05, h * 0.09, '#3F7350', -0.4);
        break;
      }
      case 'clinic': {                                       // recepção clara, cruz na parede
        g('#E6F0F1', '#D7E6E8', 0, h * 0.72); g('#C8D8DA', '#B7CBCE', h * 0.72, h);
        c.fillStyle = '#5FB3A6'; const cs = h * 0.08;
        c.fillRect(w * 0.5 - cs * 0.35, h * 0.12, cs * 0.7, cs * 2); c.fillRect(w * 0.5 - cs, h * 0.12 + cs * 0.65, cs * 2, cs * 0.7);
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.26);
        c.fillStyle = '#8FC4BC'; c.fillRect(w * 0.18, h * 0.5, w * 0.64, h * 0.04);
        c.fillStyle = '#A9B7B9'; c.fillRect(w * 0.6, h * 0.4, w * 0.12, h * 0.1);
        ell(w * 0.08, h * 0.6, w * 0.05, h * 0.12, '#4E8A5A'); c.fillStyle = '#E2E8E8'; c.fillRect(w * 0.04, h * 0.7, w * 0.08, h * 0.12);
        c.fillStyle = '#7FA8C9'; c.fillRect(w * 0.86, h * 0.56, w * 0.1, h * 0.2); c.fillRect(w * 0.86, h * 0.5, w * 0.025, h * 0.1);
        break;
      }
      case 'restaurant': {                                   // mesa posta, luminárias
        g('#5A3B2C', '#3E281E', 0, h * 0.62); g('#C79B6B', '#A97E52', h * 0.62, h);
        [0.25, 0.5, 0.75].forEach((px) => { c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * px, 0); c.lineTo(w * px, h * 0.16); c.stroke(); glow(c, w * px, h * 0.24, h * 0.22, 0.45, '#FFD58A'); c.fillStyle = '#F2B24B'; c.beginPath(); c.moveTo(w * px - w * 0.04, h * 0.22); c.lineTo(w * px + w * 0.04, h * 0.22); c.lineTo(w * px + w * 0.025, h * 0.16); c.lineTo(w * px - w * 0.025, h * 0.16); c.closePath(); c.fill(); });
        c.fillStyle = '#F4EEE4'; c.fillRect(w * 0.1, h * 0.6, w * 0.8, h * 0.08);
        [[0.28, 0.72], [0.5, 0.74], [0.72, 0.72]].forEach(([px, py], i) => { ell(w * px, h * py, w * 0.09, h * 0.06, '#FFFFFF'); ell(w * px, h * py, w * 0.055, h * 0.035, ['#C9683F', '#7FA35A', '#D9A441'][i]); });
        c.fillStyle = 'rgba(220,235,240,0.7)'; [0.38, 0.62].forEach((px) => c.fillRect(w * px, h * 0.6, w * 0.025, h * 0.08));
        break;
      }
      case 'room': {                                         // quarto
        g('#E9DDCB', '#DCCAB0', 0, h * 0.7); g('#B99772', '#9C7A58', h * 0.7, h);
        c.fillStyle = '#A9C7D6'; c.fillRect(w * 0.64, h * 0.12, w * 0.24, h * 0.34); c.fillStyle = '#F1E8DA'; c.fillRect(w * 0.755, h * 0.12, w * 0.01, h * 0.34);
        c.fillStyle = '#7D5B40'; c.fillRect(w * 0.12, h * 0.36, w * 0.5, h * 0.2);
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.1, h * 0.54, w * 0.54, h * 0.2);
        c.fillStyle = '#F4F7F7'; c.beginPath(); c.roundRect(w * 0.15, h * 0.47, w * 0.18, h * 0.1, 6); c.roundRect(w * 0.39, h * 0.47, w * 0.18, h * 0.1, 6); c.fill();
        c.fillStyle = '#5E7F94'; c.fillRect(w * 0.1, h * 0.64, w * 0.54, h * 0.1);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.68, h * 0.56, w * 0.14, h * 0.16);
        break;
      }
      case 'petshop': {                                      // prateleiras e um cachorro
        g('#F1EBDD', '#E4DAC6', 0, h * 0.78); g('#B8A387', '#A38E72', h * 0.78, h);
        c.fillStyle = '#B98A5A'; [0.3, 0.55].forEach((py) => c.fillRect(w * 0.5, h * py, w * 0.44, h * 0.025));
        ['#6FA3C7', '#E3A54A', '#D46A5A', '#7DB07A', '#B07FB8', '#6FA3C7'].forEach((col, i) => { c.fillStyle = col; const px = w * (0.52 + (i % 3) * 0.14), py = i < 3 ? h * 0.14 : h * 0.39; c.beginPath(); c.roundRect(px, py, w * 0.1, h * 0.16, 4); c.fill(); });
        const dx = w * 0.26, dy = h * 0.7;                    // cachorro
        ell(dx, dy, w * 0.13, h * 0.12, '#C68A4A'); ell(dx + w * 0.11, dy - h * 0.14, w * 0.07, h * 0.1, '#C68A4A');
        ell(dx + w * 0.16, dy - h * 0.2, w * 0.03, h * 0.07, '#8E5A2C', 0.4); ell(dx + w * 0.07, dy - h * 0.21, w * 0.03, h * 0.07, '#8E5A2C', -0.4);
        c.fillStyle = '#C68A4A'; [[-0.08], [0.06]].forEach(([o]) => c.fillRect(dx + w * o, dy + h * 0.06, w * 0.035, h * 0.14));
        ell(dx + w * 0.15, dy - h * 0.13, w * 0.012, h * 0.018, '#2B2B2B');
        c.strokeStyle = '#C68A4A'; c.lineWidth = Math.max(3, w * 0.015); c.beginPath(); c.moveTo(dx - w * 0.12, dy - h * 0.04); c.quadraticCurveTo(dx - w * 0.2, dy - h * 0.16, dx - w * 0.16, dy - h * 0.22); c.stroke();
        break;
      }
      case 'dish': {                                         // prato visto de cima (cardápio)
        g('#3A2A22', '#2A1E18');
        ell(w / 2, h / 2, Math.min(w, h) * 0.42, Math.min(w, h) * 0.42, '#F4EEE4');
        const pal = [['#C9683F', '#7FA35A'], ['#D9A441', '#B6503F'], ['#7FA35A', '#E8D49A']][v % 3];
        ell(w * 0.44, h * 0.46, Math.min(w, h) * 0.2, Math.min(w, h) * 0.16, pal[0]); ell(w * 0.6, h * 0.58, Math.min(w, h) * 0.12, Math.min(w, h) * 0.1, pal[1]);
        break;
      }
      default: break;
    }
    c.restore();
  }
  // mapa abstrato com o pin do endereço
  function mapArt(c, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, 14); c.clip(); c.translate(x, y);
    c.fillStyle = '#182020'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1C3324'; c.beginPath(); c.ellipse(w * 0.16, h * 0.24, w * 0.12, h * 0.18, 0.3, 0, TAU); c.fill();
    c.fillStyle = '#16343C'; c.beginPath(); c.ellipse(w * 0.92, h * 0.86, w * 0.18, h * 0.24, -0.35, 0, TAU); c.fill();
    c.strokeStyle = '#2E3838'; c.lineWidth = 8; c.lineCap = 'round';
    [[0, 0.6, 1, 0.48], [0.3, 0, 0.36, 1], [0.66, 0, 0.6, 1], [0, 0.22, 1, 0.16], [0, 0.9, 1, 0.82]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(w * a, h * b); c.lineTo(w * cc, h * d); c.stroke(); });
    c.strokeStyle = '#263030'; c.lineWidth = 3;
    [[0.12, 0.36, 0.5, 0.42], [0.46, 0.66, 0.9, 0.62], [0.8, 0.2, 0.84, 0.5]].forEach(([a, b, cc, d]) => { c.beginPath(); c.moveTo(w * a, h * b); c.lineTo(w * cc, h * d); c.stroke(); });
    const P = { x: w * 0.48, y: h * 0.5 };
    c.save(); c.setLineDash([8, 8]); c.strokeStyle = rgba(C.lime, 0.85); c.lineWidth = 3;
    c.beginPath(); c.moveTo(w * 0.1, h * 0.92); c.quadraticCurveTo(w * 0.3, h * 0.62, P.x, P.y + 10); c.stroke(); c.restore();
    c.beginPath(); c.arc(w * 0.1, h * 0.92, 9, 0, TAU); c.fillStyle = C.white; c.fill();
    c.beginPath(); c.arc(P.x, P.y, 34, 0, TAU); c.fillStyle = rgba(C.lime, 0.18); c.fill();
    c.save(); c.translate(P.x, P.y - 22); c.fillStyle = C.lime; c.beginPath(); c.moveTo(0, 22); c.bezierCurveTo(-17, 4, -16, -4, -16, -6); c.arc(0, -6, 16, Math.PI, 0); c.bezierCurveTo(16, -4, 17, 4, 0, 22); c.fill();
    c.beginPath(); c.arc(0, -6, 6, 0, TAU); c.fillStyle = C.ink; c.fill(); c.restore();
    c.restore();
  }

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
    // barra de status + barra de endereço (é um site); sem domínio
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
  // topo do mini site: faixa com a ilustração do negócio, o tipo de negócio (sem nome) e o menu
  function banner(c, kind, ic, label) {
    const h = 104;
    photo(c, kind, X, T0, CW, h);
    c.save(); rrect(c, X, T0, CW, h, 16); c.clip();
    const g = c.createLinearGradient(0, T0 + h * 0.35, 0, T0 + h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
    c.fillStyle = g; c.fillRect(X, T0, CW, h); c.restore();
    c.beginPath(); c.arc(X + 30, T0 + h - 28, 18, 0, TAU); c.fillStyle = 'rgba(10,12,12,0.78)'; c.fill();
    icon(c, ic, X + 30, T0 + h - 28, 24, C.white, 0.1);
    text(c, label, X + 56, T0 + h - 20, { size: 21, weight: 700, color: C.white });
    c.beginPath(); c.arc(X + CW - 28, T0 + 26, 18, 0, TAU); c.fillStyle = 'rgba(10,12,12,0.6)'; c.fill();
    icon(c, 'menu', X + CW - 28, T0 + 26, 22, C.white, 0.11);
    return T0 + h + 12;
  }
  function cardTitle(c, s, x, y) { text(c, s, x + 18, y + 38, { size: 22, weight: 700, color: C.white }); }

  // ---------------------------------------------------------------- slide de item (celular fixo)
  let S_ITEM, PHONE_Y;
  function itemSlide(c, n, lines, body, screen, chips) {
    background(c);
    header(c, n);
    const y1 = 200 + S_ITEM * 0.74;
    const yl = title(c, lines, M, y1, S_ITEM, { lime: [lines[0].split(' ')[0]] });
    wrap(body, 35, 500, W - 2 * M).forEach((s, i) => text(c, s, M, yl + 72 + i * 50, { size: 35, weight: 500, color: C.soft }));
    glow(c, 540, PHONE_Y + 380, 560, 0.075);
    phone(c, PHONE_Y, screen);
    chips.forEach((k) => chip(c, k.ic, k.x, k.y, k.s, k.lime));
  }

  // ---------------------------------------------------------------- telas (unidades da tela: 432 de largura)
  const X = 12, CW = SW - 24;
  // 02 padaria: horário de funcionamento
  function scrPadaria(c) {
    const y = banner(c, 'bakery', 'bread', 'Padaria'), h = 300;
    card(c, X, y, CW, h, true);
    cardTitle(c, 'Horário de funcionamento', X, y);
    const pw = measure('Aberto agora', 16, 700) + 44;                      // estado do dia (sem horário)
    fillR(c, X + 18, y + 52, pw, 32, 16, rgba(C.lime, 0.14));
    c.beginPath(); c.arc(X + 36, y + 68, 6, 0, TAU); c.fillStyle = C.lime; c.fill();
    text(c, 'Aberto agora', X + 50, y + 74, { size: 16, weight: 700, color: C.lime });
    [['Segunda a sexta', 120, false], ['Sábado', 104, false], ['Domingo', 96, false], ['Feriados', 112, true]].forEach(([lb, bw, cal], i) => {
      const ry = y + 96 + i * 49;
      fillR(c, X + 12, ry, CW - 24, 42, 12, cal ? rgba(C.lime, 0.1) : C.card2);
      if (cal) icon(c, 'cal', X + 38, ry + 21, 24, C.lime, 0.09); else icon(c, 'clock', X + 38, ry + 21, 24, C.soft, 0.09);
      text(c, lb, X + 62, ry + 28, { size: 18, weight: 600, color: C.white });
      fillR(c, X + CW - 30 - bw, ry + 16, bw, 11, 5.5, C.bar2);           // horário (sem número)
    });
    card(c, X, y + h + 14, CW, 220, false);
    bars(c, X + 18, y + h + 40, [220, 160, 190], 11, 26);
  }
  // 03 loja de roupas: endereço com mapa
  function scrLoja(c) {
    const y = banner(c, 'clothes', 'hanger', 'Loja de roupas'), h = 306;
    card(c, X, y, CW, h, true);
    cardTitle(c, 'Como chegar', X, y);
    mapArt(c, X + 12, y + 54, CW - 24, 126);
    icon(c, 'pin', X + 34, y + 206, 24, C.lime, 0.09);
    bars(c, X + 56, y + 198, [210, 150], 11, 20, C.bar2);                    // endereço (sem texto inventado)
    const by = y + 236, bw = CW - 24;
    c.save(); c.shadowColor = rgba(C.lime, 0.55); c.shadowBlur = 28; fillR(c, X + 12, by, bw, 56, 16, C.lime); c.restore();
    icon(c, 'map', X + 44, by + 28, 28, C.ink, 0.1);
    text(c, 'Abrir no mapa', X + 70, by + 36, { size: 21, weight: 800, color: C.ink });
    touch(c, X + 12 + bw - 40, by + 30, 0.8);
    card(c, X, y + h + 14, CW, 220, false);
    photo(c, 'clothes', X + 14, y + h + 28, CW - 28, 180);
  }
  // 04 clínica: WhatsApp à vista
  function scrClinica(c) {
    const y = banner(c, 'clinic', 'cross', 'Clínica'), h = 274;
    card(c, X, y, CW, h, true);
    cardTitle(c, 'Fale com a gente', X, y);
    bars(c, X + 18, y + 60, [300, 240], 11, 22, C.bar2);
    const by = y + 112, bw = CW - 24;
    c.save(); c.shadowColor = rgba(C.lime, 0.6); c.shadowBlur = 34; fillR(c, X + 12, by, bw, 72, 18, C.lime); c.restore();
    icon(c, 'chat', X + 48, by + 36, 34, C.ink, 0.1);
    text(c, 'Conversar no WhatsApp', X + 76, by + 44, { size: 21, weight: 800, color: C.ink });
    touch(c, X + 12 + bw - 34, by + 36, 0.75);
    // sem precisar copiar número: o número fica só como barra apagada
    fillR(c, X + 12, by + 86, bw, 50, 12, C.card2);
    text(c, 'ou ligue', X + 30, by + 118, { size: 16, weight: 500, color: C.muted });
    fillR(c, X + 110, by + 106, 130, 11, 5.5, C.bar);
    card(c, X, y + h + 14, CW, 240, false);
    photo(c, 'clinic', X + 14, y + h + 28, CW - 28, 190);
  }
  // 05 restaurante: o que você oferece
  function scrRestaurante(c) {
    const y = banner(c, 'restaurant', 'fork', 'Restaurante'), h = 304;
    card(c, X, y, CW, h, true);
    let tx = X + 16;
    [['Cardápio', true], ['Bebidas', false], ['Sobremesas', false]].forEach(([s, on]) => {
      const tw = measure(s, 17, 600) + 30;
      fillR(c, tx, y + 16, tw, 38, 19, on ? C.lime : C.card2);
      text(c, s, tx + 15, y + 41, { size: 17, weight: 600, color: on ? C.ink : C.soft });
      tx += tw + 8;
    });
    for (let i = 0; i < 2; i++) {                                           // pratos: nome, descrição e preço como barras
      const ry = y + 68 + i * 112;
      fillR(c, X + 12, ry, CW - 24, 100, 14, C.card2);
      photo(c, 'dish', X + 22, ry + 10, 80, 80, i);
      fillR(c, X + 118, ry + 22, 150 + 20 * (i % 2), 12, 6, '#DCE2E2');
      bars(c, X + 118, ry + 46, [200 - 24 * i, 150], 9, 18);
      text(c, 'R$', X + CW - 92, ry + 32, { size: 16, weight: 700, color: C.lime });
      fillR(c, X + CW - 64, ry + 21, 40, 12, 6, C.bar2);
    }
    card(c, X, y + h + 14, CW, 200, false);
    for (let i = 0; i < 1; i++) { photo(c, 'dish', X + 22, y + h + 24, 80, 80, 2); fillR(c, X + 118, y + h + 46, 160, 12, 6, '#DCE2E2'); }
  }
  // 06 pousada: um preço de referência
  function scrPousada(c) {
    const y = banner(c, 'room', 'bed', 'Pousada'), h = 196;
    card(c, X, y, CW, h, false);
    text(c, 'Acomodação', X + 18, y + 40, { size: 23, weight: 700, color: C.white });
    fillR(c, X + 18, y + 56, 190, 9, 4.5, C.bar);
    const py = y + 82, ph = 96;                                             // bloco do preço, em destaque
    c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 24; strokeR(c, X + 10, py, CW - 20, ph, 16, C.lime, 3); c.restore();
    fillR(c, X + 10, py, CW - 20, ph, 16, rgba(C.lime, 0.08));
    text(c, 'a partir de', X + 26, py + 36, { size: 19, weight: 600, color: C.lime });
    text(c, 'R$', X + 26, py + 76, { size: 27, weight: 700, color: C.white });
    fillR(c, X + 70, py + 56, 110, 22, 11, C.bar2);
    text(c, '/ noite', X + 192, py + 76, { size: 19, weight: 500, color: C.muted });
    checkBadge(c, X + CW - 18, py + 8, 19);
    card(c, X, y + h + 14, CW, 280, false);
    photo(c, 'room', X + 14, y + h + 28, CW - 28, 200);
  }
  // 07 pet shop: formas de pagamento
  function scrPetshop(c) {
    const y = banner(c, 'petshop', 'paw', 'Pet shop'), h = 300;
    card(c, X, y, CW, h, true);
    cardTitle(c, 'Formas de pagamento', X, y);
    const tw = (CW - 36) / 2, th = 104;
    [['bolt', 'Pix', false], ['card', 'Crédito', false], ['card', 'Débito', false], ['split', 'Parcelado', true]].forEach(([ic, lb, parc], i) => {
      const tx = X + 12 + (i % 2) * (tw + 12), ty = y + 58 + Math.floor(i / 2) * (th + 12);
      fillR(c, tx, ty, tw, th, 14, C.card2);
      icon(c, ic, tx + 34, ty + 34, 38, C.white, 0.08);
      text(c, lb, tx + 16, ty + th - 18, { size: 19, weight: 700, color: C.white });
      if (parc) { text(c, 'em', tx + 64, ty + 40, { size: 16, weight: 500, color: C.muted }); fillR(c, tx + 92, ty + 29, 30, 12, 6, C.bar2); text(c, 'x', tx + 127, ty + 40, { size: 16, weight: 500, color: C.muted }); }   // parcelas (sem número)
      c.beginPath(); c.arc(tx + tw - 24, ty + 24, 13, 0, TAU); c.fillStyle = C.lime; c.fill(); icon(c, 'check', tx + tw - 24, ty + 25, 20, C.ink, 0.15);
    });
    card(c, X, y + h + 14, CW, 220, false);
    photo(c, 'petshop', X + 14, y + h + 28, CW - 28, 180);
  }

  // ---------------------------------------------------------------- slides
  const ITEMS = [
    { lines: ['1. HORÁRIO DE', 'FUNCIONAMENTO'], body: 'Abre hoje? Até que horas? E no feriado?', scr: scrPadaria,
      chips: [{ ic: 'clock', x: 160, y: 800, lime: true }, { ic: 'cal', x: 926, y: 990 }, { ic: 'bread', x: 150, y: 1160 }] },
    { lines: ['2. ENDEREÇO', 'COM MAPA'], body: 'Um toque e o caminho abre no celular.', scr: scrLoja,
      chips: [{ ic: 'pin', x: 160, y: 830, lime: true }, { ic: 'map', x: 926, y: 1080 }, { ic: 'hanger', x: 926, y: 800 }] },
    { lines: ['3. WHATSAPP', 'À VISTA'], body: 'Um botão para tocar, sem precisar copiar número.', scr: scrClinica,
      chips: [{ ic: 'chat', x: 926, y: 980, lime: true }, { ic: 'pointer', x: 160, y: 1120 }, { ic: 'cross', x: 160, y: 820 }] },
    { lines: ['4. O QUE VOCÊ', 'OFERECE'], body: 'Cardápio, serviços ou quartos: o que ele vai encontrar ao chegar.', scr: scrRestaurante,
      chips: [{ ic: 'list', x: 160, y: 860, lime: true }, { ic: 'fork', x: 926, y: 800 }] },
    { lines: ['5. UM PREÇO DE', 'REFERÊNCIA'], body: 'Um “a partir de” já ajuda a decidir.', scr: scrPousada,
      chips: [{ ic: 'tag', x: 160, y: 1010, lime: true }, { ic: 'bed', x: 926, y: 820 }] },
    { lines: ['6. FORMAS DE', 'PAGAMENTO'], body: 'Pix, cartão, parcelado? Ele quer saber antes de sair de casa.', scr: scrPetshop,
      chips: [{ ic: 'card', x: 926, y: 960, lime: true }, { ic: 'paw', x: 160, y: 820 }, { ic: 'bolt', x: 160, y: 1130 }] },
  ];
  const BIZ = [['bakery', 'Padaria', 'clock'], ['clothes', 'Loja de roupas', 'pin'], ['clinic', 'Clínica', 'chat'], ['restaurant', 'Restaurante', 'list'], ['room', 'Pousada', 'tag'], ['petshop', 'Pet shop', 'card']];
  const CHECK = ['Horário de funcionamento', 'Endereço com mapa', 'WhatsApp à vista', 'O que você oferece', 'Um preço de referência', 'Formas de pagamento'];
  const CHECK_IC = ['clock', 'pin', 'chat', 'list', 'tag', 'card'];
  let S_COVER, L_COVER, S_END, L_END;

  function slideCover(c) {
    background(c);
    glow(c, 540, 960, 620, 0.08);
    header(c, 1, true);
    const yl = title(c, L_COVER, M, 266 + S_COVER * 0.74, S_COVER, { lh: 1.06, lime: ['HORÁRIO'] });
    const sub = ['6 informações que todo negócio', 'deixa difíceis de achar'];          // quebra escolhida
    sub.forEach((s, i) => text(c, s, M, yl + 76 + i * 50, { size: 36, weight: 500, color: C.soft }));
    // os 6 negócios, cada um com a informação que o cliente procura (1–6)
    const gy = yl + 76 + (sub.length - 1) * 50 + 52, gw = W - 2 * M, cols = 3, gap = 18;
    const tw = (gw - gap * (cols - 1)) / cols, th = Math.min(300, (1226 - gy - gap) / 2);
    BIZ.forEach(([k, lb, ic], i) => {
      const tx = M + (i % cols) * (tw + gap), ty = gy + Math.floor(i / cols) * (th + gap);
      fillR(c, tx, ty, tw, th, 20, C.card);
      strokeR(c, tx, ty, tw, th, 20, '#252B2B', 2);
      photo(c, k, tx + 10, ty + 10, tw - 20, th - 78);
      text(c, lb, tx + 18, ty + th - 26, { size: 23, weight: 700, color: C.white });
      c.beginPath(); c.arc(tx + tw - 38, ty + th - 34, 22, 0, TAU); c.fillStyle = C.card2; c.fill();
      icon(c, ic, tx + tw - 38, ty + th - 34, 28, C.lime, 0.1);
      const bx = tx + 6, by = ty + 6;                                       // selo numerado
      c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 12; c.beginPath(); c.arc(bx, by, 24, 0, TAU); c.fillStyle = C.lime; c.fill(); c.restore();
      c.beginPath(); c.arc(bx, by, 24, 0, TAU); c.strokeStyle = C.bg; c.lineWidth = 4; c.stroke();
      text(c, String(i + 1), bx, by + 9, { fam: DISPLAY, size: 25, weight: 900, color: C.ink, align: 'center' });
    });
    footer(c, ['bookmark'], 'Salve para revisar o seu', 1278);
  }
  function slideEnd(c) {
    background(c);
    glow(c, 540, 820, 600, 0.07);
    header(c, 8, true);
    const yl = title(c, L_END, M, 248 + S_END * 0.74, S_END, { lh: 1.1, lime: ['PERGUNTAR?'] });
    const x = M, y = yl + 56, w = W - 2 * M, rh = 64, h = CHECK.length * rh + 28;
    fillR(c, x, y, w, h, 24, C.card);
    strokeR(c, x, y, w, h, 24, C.line, 2);
    CHECK.forEach((s, i) => {
      const ry = y + 14 + i * rh;
      if (i) { c.fillStyle = C.line; c.fillRect(x + 24, ry, w - 48, 1.5); }
      text(c, String(i + 1), x + 40, ry + 43, { fam: DISPLAY, size: 26, weight: 900, color: C.lime, align: 'center' });
      icon(c, CHECK_IC[i], x + 92, ry + 32, 32, C.soft, 0.09);
      text(c, s, x + 128, ry + 42, { size: 29, weight: 600, color: C.white });
      strokeR(c, x + w - 64, ry + 15, 34, 34, 9, '#5C6666', 3);
    });
    const cta = 'Se não, fale com a FAZLO · link na bio';
    const fs = 33, pw = measure(cta, fs, 700) + 132, ph = 84, py = Math.round((y + h + 1236) / 2 - ph / 2);
    c.save(); c.shadowColor = rgba(C.lime, 0.35); c.shadowBlur = 30; fillR(c, W / 2 - pw / 2, py, pw, ph, ph / 2, C.lime); c.restore();
    text(c, cta, W / 2 - pw / 2 + 44, py + ph / 2 + 12, { size: fs, weight: 700, color: C.ink });
    icon(c, 'arrow', W / 2 + pw / 2 - 52, py + ph / 2, 36, C.ink, 0.12);
    footer(c, ['bookmark', 'plane'], 'Salve e mande para quem cuida do seu negócio', 1278);
  }

  FZC.define({
    id: 'seu-cliente-nao-acha-seu-horario',
    width: W,
    height: H,
    setup() {
      loadLogo('full', 'FAZLO-DIGITAL-branca-transparente.svg');
      loadLogo('compact', 'FAZLO-logo-branca-transparente.svg');
      S_ITEM = Math.min(84, ...ITEMS.map((it) => fit(it.lines, 900, W - 2 * M, 100)));
      // celular na mesma posição em todos os itens: abaixo do item com mais linhas de texto
      const maxBody = Math.max(...ITEMS.map((it) => wrap(it.body, 35, 500, W - 2 * M).length));
      const yl = 200 + S_ITEM * 0.74 + S_ITEM * 1.1;
      PHONE_Y = Math.round(clamp(yl + 72 + (maxBody - 1) * 50 + 86, 460, 612));
      L_COVER = ['SEU CLIENTE', 'NÃO ACHA SEU', 'HORÁRIO'];
      S_COVER = fit(L_COVER, 900, W - 2 * M, 120);
      L_END = ['SEU CLIENTE ACHA', 'TUDO ISSO SEM', 'PRECISAR TE', 'PERGUNTAR?'];
      S_END = fit(L_END, 900, W - 2 * M, 84);
    },
    slides: [
      slideCover,
      ...ITEMS.map((it, i) => (c) => itemSlide(c, i + 2, it.lines, it.body, it.scr, it.chips)),
      slideEnd,
    ],
  });
})();
