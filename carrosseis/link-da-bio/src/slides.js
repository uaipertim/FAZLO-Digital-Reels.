/* =====================================================================
   FAZLO Digital — carrossel "O que colocar no link da bio da sua pousada"
   8 slides 1080x1350 (4:5), estáticos. Público: donos de pousada.

   Mesmo padrão dos carrosséis anteriores: fundo #050606, lima #C6FA41,
   Unbounded (títulos) + Sora (textos); FAZLO DIGITAL na capa e no fecho,
   FAZLO compacto nos itens; topo abaixo do contador nativo do Instagram.
   Títulos com *trechos em lima*.

   01 capa · 02 quem toca quer resolver · 03 nove botões não resolvem ·
   04 consulta de datas · 05 quartos com valor de referência · 06 como
   chegar · 07 WhatsApp com mensagem pronta · 08 um link só: o site

   Ilustrações genéricas e próprias: nenhum logo de marca (WhatsApp,
   Instagram, Linktree…), nenhum telefone, nome de pessoa ou dado real;
   valores e endereços aparecem como BARRAS.
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

  // ---------------------------------------------------------------- ícones novos (mesma linguagem de traço)
  function iconX(c, kind, x, y, s, color = C.white, lw = 0.09) {
    const draw = {
      coffee: () => { c.roundRect(-0.32, -0.08, 0.5, 0.46, 0.1); c.moveTo(0.18, 0); c.arc(0.18, 0.14, 0.14, -Math.PI / 2, Math.PI / 2); c.moveTo(-0.18, -0.2); c.quadraticCurveTo(-0.08, -0.28, -0.18, -0.4); c.moveTo(0, -0.2); c.quadraticCurveTo(0.1, -0.28, 0, -0.4); },
      parking: () => { c.roundRect(-0.38, -0.38, 0.76, 0.76, 0.14); c.moveTo(-0.1, 0.24); c.lineTo(-0.1, -0.22); c.lineTo(0.06, -0.22); c.arc(0.06, -0.1, 0.12, -Math.PI / 2, Math.PI / 2); c.lineTo(-0.1, 0.02); },
      wifi: () => { [0.2, 0.36, 0.52].forEach((r) => { c.moveTo(Math.cos(1.25 * Math.PI) * r, 0.26 + Math.sin(1.25 * Math.PI) * r); c.arc(0, 0.26, r, 1.25 * Math.PI, 1.75 * Math.PI); }); c.moveTo(0.04, 0.3); c.arc(0, 0.3, 0.04, 0, TAU); },
      snow: () => { for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.moveTo(-0.42 * Math.cos(a), -0.42 * Math.sin(a)); c.lineTo(0.42 * Math.cos(a), 0.42 * Math.sin(a)); } },
      login: () => { c.moveTo(0.1, -0.38); c.lineTo(0.38, -0.38); c.lineTo(0.38, 0.38); c.lineTo(0.1, 0.38); c.moveTo(-0.4, 0); c.lineTo(0.12, 0); c.moveTo(-0.1, -0.2); c.lineTo(0.12, 0); c.lineTo(-0.1, 0.2); },
      logout: () => { c.moveTo(-0.1, -0.38); c.lineTo(-0.38, -0.38); c.lineTo(-0.38, 0.38); c.lineTo(-0.1, 0.38); c.moveTo(-0.12, 0); c.lineTo(0.4, 0); c.moveTo(0.18, -0.2); c.lineTo(0.4, 0); c.lineTo(0.18, 0.2); },
      kid: () => { c.arc(0, 0, 0.4, 0, TAU); c.moveTo(0.2, 0.08); c.arc(0, 0.04, 0.2, 0.2 * Math.PI, 0.8 * Math.PI); },
      flag: () => { c.moveTo(-0.25, 0.42); c.lineTo(-0.25, -0.4); c.lineTo(0.32, -0.24); c.lineTo(-0.25, -0.04); },
      tree: () => { c.moveTo(0, -0.42); c.lineTo(0.3, 0.1); c.lineTo(-0.3, 0.1); c.closePath(); c.moveTo(0, 0.1); c.lineTo(0, 0.42); },
      wave: () => { [-0.24, 0, 0.24].forEach((yy) => { c.moveTo(-0.42, yy); c.bezierCurveTo(-0.24, yy - 0.14, -0.12, yy + 0.14, 0.02, yy); c.bezierCurveTo(0.16, yy - 0.14, 0.28, yy + 0.14, 0.42, yy); }); },
      mountain: () => { c.moveTo(-0.45, 0.35); c.lineTo(-0.12, -0.2); c.lineTo(0.08, 0.1); c.lineTo(0.2, -0.08); c.lineTo(0.45, 0.35); c.closePath(); },
      image: () => { c.roundRect(-0.4, -0.32, 0.8, 0.64, 0.08); c.moveTo(0.27, -0.12); c.arc(0.2, -0.12, 0.07, 0, TAU); c.moveTo(-0.4, 0.25); c.lineTo(-0.1, -0.05); c.lineTo(0.1, 0.15); c.lineTo(0.22, 0.05); c.lineTo(0.4, 0.25); },
      mark: () => { c.arc(0, 0, 0.4, 0, TAU); c.moveTo(0.16, 0); c.arc(0, 0, 0.16, 0, TAU); },
      clipboard: () => { c.roundRect(-0.3, -0.36, 0.6, 0.78, 0.08); c.roundRect(-0.14, -0.46, 0.28, 0.14, 0.05); c.moveTo(-0.16, -0.06); c.lineTo(0.16, -0.06); c.moveTo(-0.16, 0.1); c.lineTo(0.16, 0.1); c.moveTo(-0.16, 0.26); c.lineTo(0.04, 0.26); },
    }[kind];
    if (!draw) { icon(c, kind, x, y, s, color, lw); return; }
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); draw(); c.stroke();
    if (kind === 'kid') { [[-0.12, -0.08], [0.12, -0.08]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 0.035, 0, TAU); c.fill(); }); }
    c.restore();
  }
  // fotos genéricas que faltam (banheiro, vista da janela, piscina)
  function photoX(c, kind, x, y, w, h) {
    if (!['bath', 'view', 'pool'].includes(kind)) { photo(c, kind, x, y, w, h); return; }
    c.save(); rrect(c, x, y, w, h, 18); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    if (kind === 'bath') {
      g('#E4ECEC', '#D2DEDE');
      c.fillStyle = '#BFD6DE'; c.beginPath(); c.roundRect(w * 0.3, h * 0.1, w * 0.4, h * 0.36, w * 0.06); c.fill();
      c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.2, h * 0.58, w * 0.6, h * 0.42);
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(w * 0.5, h * 0.58, w * 0.18, h * 0.05, 0, 0, TAU); c.fill();
    } else if (kind === 'view') {
      g('#F3C38F', '#F6E3C4', 0, h * 0.6);
      c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(w * 0.7, h * 0.36, Math.min(w, h) * 0.1, 0, TAU); c.fill();
      c.fillStyle = '#8FA7B8'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w * 0.22, h * 0.34); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w, h * 0.66); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#5F7E6A'; c.beginPath(); c.moveTo(0, h * 0.78); c.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.8); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    } else {
      g('#A6DBE6', '#E8F3EE', 0, h * 0.45);
      c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.45, w, h * 0.55);
      c.fillStyle = '#4FB6C8'; c.beginPath(); c.roundRect(w * 0.12, h * 0.55, w * 0.76, h * 0.32, 8); c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- blocos de desenho
  function pill(c, x, y, w, h, label, ic, lime, size = 28) {
    fillR(c, x, y, w, h, h / 2, lime ? rgba(C.lime, 0.14) : C.card2);
    strokeR(c, x, y, w, h, h / 2, lime ? rgba(C.lime, 0.7) : C.line, 2);
    if (ic) iconX(c, ic, x + h / 2, y + h / 2, h * 0.46, lime ? C.lime : C.soft, 0.1);
    text(c, label, x + (ic ? h : h * 0.5), y + h / 2 + size * 0.36, { size, weight: 700, color: C.white });
  }
  function dashed(c, x, y, w, h, r, col) { c.save(); c.setLineDash([12, 10]); strokeR(c, x, y, w, h, r, col, 3); c.restore(); }
  function tag(c, label, x, y) {                           // legenda sobre a foto
    const w = measure(label, 24, 700) + 64, h = 46;
    fillR(c, x, y, w, h, h / 2, 'rgba(8,10,10,0.82)');
    c.beginPath(); c.arc(x + 25, y + 23, 13, 0, TAU); c.fillStyle = C.lime; c.fill(); iconX(c, 'check', x + 25, y + 24, 20, C.ink, 0.15);
    text(c, label, x + 48, y + 31, { size: 24, weight: 700, color: C.white });
  }
  function panel(c, x, y, w, h) { fillR(c, x, y, w, h, 28, C.card); strokeR(c, x, y, w, h, 28, C.line, 2); }

  // ---------------------------------------------------------------- título com *trechos em lima* (o estado do * passa de uma linha à outra)
  function titleRich(c, lines, x, y, size, o = {}) {
    const lh = size * (o.lh || 1.1), ls = -size * 0.02, wt = 900, sp = measure(' ', size, wt, DISPLAY, ls);
    let lime = false;
    lines.forEach((line, i) => {
      const words = [];
      line.split('*').forEach((part, k) => { if (k > 0) lime = !lime; part.split(' ').filter(Boolean).forEach((w, q) => words.push({ w, lime, glue: q === 0 && k > 0 && part[0] !== ' ' })); });
      let xx = x;
      words.forEach((wd) => { if (wd.glue && xx > x) xx -= sp; text(c, wd.w, xx, y + i * lh, { fam: DISPLAY, size, weight: wt, color: wd.lime ? C.lime : C.white, ls }); xx += measure(wd.w, size, wt, DISPLAY, ls) + sp; });
    });
    return y + (lines.length - 1) * lh;
  }
  const plain = (lines) => lines.map((s) => s.replace(/\*/g, ''));

  // ---------------------------------------------------------------- ilustrações (x, y, w: caixa; nat = altura)
  function profile(c, x, y, w) {                           // perfil genérico com o link da bio em destaque
    panel(c, x, y, w, 300);
    c.beginPath(); c.arc(x + 96, y + 96, 56, 0, TAU); c.fillStyle = C.card2; c.fill(); c.strokeStyle = C.lime; c.lineWidth = 5; c.stroke();
    iconX(c, 'mark', x + 96, y + 96, 56, C.lime, 0.09);
    fillR(c, x + 184, y + 64, 260, 16, 8, C.soft); fillR(c, x + 184, y + 98, 360, 11, 5.5, C.bar); fillR(c, x + 184, y + 124, 300, 11, 5.5, C.bar);
    c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 26; fillR(c, x + 36, y + 184, w - 72, 84, 42, C.lime); c.restore();
    iconX(c, 'arrow', x + 86, y + 226, 40, C.ink, 0.12);
    fillR(c, x + 124, y + 218, 220, 14, 7, rgba(C.ink, 0.55));
    touch(c, x + w - 110, y + 232, 1.15);
  }
  const BTN_IC = ['tag', 'list', 'pin', 'chat', 'bolt', 'card', 'cal', 'bed', 'image'];
  const ART = {
    cover: { nat: 375, draw(c, x, y, w) { c.save(); c.translate(x, y); c.scale(1.25, 1.25); profile(c, 0, 0, w / 1.25); c.restore(); } },
    quer: { nat: 560, draw(c, x, y, w) {                   // 02 quem toca quer resolver
      profile(c, x, y, w);
      const tw = (w - 48) / 3;
      [['cal', 'Tem vaga nas minhas datas?'], ['tag', 'Quanto custa?'], ['chat', 'Como eu reservo?']].forEach(([ic, lb], i) => {
        const tx = x + i * (tw + 24), ty = y + 340;
        panel(c, tx, ty, tw, 220);
        c.beginPath(); c.arc(tx + 56, ty + 60, 34, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill();
        iconX(c, ic, tx + 56, ty + 60, 40, C.lime, 0.09);
        wrap(lb, 25, 700, tw - 40).forEach((s, j) => text(c, s, tx + 24, ty + 134 + j * 32, { size: 25, weight: 700, color: C.white }));
      });
    } },
    nove: { nat: 690, draw(c, x, y, w) {                   // 03 nove botões
      const bw = Math.min(w, 820), bx = x + (w - bw) / 2, dim = [2, 5, 7];
      BTN_IC.forEach((ic, i) => {
        const by = y + i * 78, a = dim.includes(i) ? 0.32 : 1;
        c.save(); c.globalAlpha = a;
        fillR(c, bx, by, bw, 66, 33, C.card2); strokeR(c, bx, by, bw, 66, 33, C.line, 2);
        c.beginPath(); c.arc(bx + 40, by + 33, 22, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill();
        iconX(c, ic, bx + 40, by + 33, 28, C.lime, 0.1);
        fillR(c, bx + 84, by + 27, 150 + (i * 47) % 150, 12, 6, C.soft);
        c.restore();
      });
    } },
    datas: { nat: 610, draw(c, x, y, w) {                  // 04 consulta de datas
      panel(c, x, y, w, 610);
      text(c, 'Consulta de datas', x + 40, y + 70, { size: 32, weight: 700, color: C.white });
      const fw = (w - 80 - 24) / 2;
      [['Entrada', 0], ['Saída', 1]].forEach(([lb, i]) => {
        const fx = x + 40 + i * (fw + 24);
        text(c, lb, fx, y + 128, { size: 22, weight: 600, color: C.muted });
        fillR(c, fx, y + 146, fw, 92, 20, C.card2); iconX(c, 'cal', fx + 46, y + 192, 38, C.lime, 0.1); fillR(c, fx + 88, y + 186, fw - 130, 12, 6, C.bar2);
      });
      text(c, 'Hóspedes', x + 40, y + 284, { size: 22, weight: 600, color: C.muted });
      fillR(c, x + 40, y + 302, w - 80, 92, 20, C.card2); iconX(c, 'kid', x + 86, y + 348, 38, C.lime, 0.1); fillR(c, x + 128, y + 342, 200, 12, 6, C.bar2);
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 30; fillR(c, x + 40, y + 450, w - 80, 100, 28, C.lime); c.restore();
      text(c, 'Consultar', x + 84, y + 515, { size: 34, weight: 800, color: C.ink });
      touch(c, x + w - 120, y + 500, 1.1);
    } },
    quartos: { nat: 620, draw(c, x, y, w) {                // 05 quartos + valor de referência
      [['room', true], ['view', false]].forEach(([k, hl], i) => {
        const ty = y + i * 330, th = 290;
        panel(c, x, ty, w, th);
        photoX(c, k, x + 22, ty + 22, 330, th - 44);
        const tx = x + 384;
        fillR(c, tx, ty + 52, 300, 16, 8, C.soft); bars(c, tx, ty + 90, [380, 300], 11, 22);
        text(c, 'a partir de', tx, ty + 190, { size: 26, weight: 600, color: C.lime });
        text(c, 'R$', tx, ty + 244, { size: 38, weight: 700, color: C.white });
        fillR(c, tx + 64, ty + 222, 150, 24, 12, C.bar2);
        if (hl) { strokeR(c, x, ty, w, th, 28, C.lime, 3); checkBadge(c, x + w - 30, ty + 30, 20); }
      });
    } },
    chegar: { nat: 650, draw(c, x, y, w) {                 // 06 como chegar
      mapArt(c, x, y, w, 380); strokeR(c, x, y, w, 380, 14, rgba(C.lime, 0.8), 3);
      const hw = (w - 24) / 2;
      [['pin', 'Endereço'], ['flag', 'Referências']].forEach(([ic, lb], i) => {
        const tx = x + i * (hw + 24), ty = y + 404;
        panel(c, tx, ty, hw, 120);
        iconX(c, ic, tx + 50, ty + 42, 36, C.lime, 0.1);
        text(c, lb, tx + 92, ty + 52, { size: 28, weight: 700, color: C.white });
        bars(c, tx + 30, ty + 76, [hw - 90, hw - 170], 10, 20);
      });
      panel(c, x, y + 548, w, 102);
      iconX(c, 'map', x + 56, y + 599, 40, C.lime, 0.1);
      text(c, 'Caminho da estrada', x + 104, y + 610, { size: 28, weight: 700, color: C.white });
      fillR(c, x + w - 270, y + 593, 220, 12, 6, C.bar2);
    } },
    zap: { nat: 580, draw(c, x, y, w) {                    // 07 mensagem pronta
      const cw = Math.floor((w - 100) / 2), ch = 580;
      panel(c, x, y, cw, ch);
      text(c, 'Consulta de datas', x + 28, y + 58, { size: 26, weight: 700, color: C.white });
      [['cal', 150], ['kid', 110], ['bed', 130]].forEach(([ic, bw], i) => {
        const fy = y + 90 + i * 96;
        fillR(c, x + 28, fy, cw - 56, 78, 16, C.card2); iconX(c, ic, x + 70, fy + 39, 32, C.lime, 0.1); fillR(c, x + 108, fy + 33, bw, 12, 6, C.bar2);
        checkBadge(c, x + cw - 58, fy + 39, 17);
      });
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 24; fillR(c, x + 28, y + ch - 118, cw - 56, 70, 20, C.lime); c.restore();
      text(c, 'Enviar', x + 56, y + ch - 73, { size: 26, weight: 800, color: C.ink });
      const ax = x + cw + 14, aw = w - 2 * cw - 28;
      c.strokeStyle = C.lime; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(ax + 2, y + ch / 2); c.lineTo(ax + aw - 4, y + ch / 2); c.moveTo(ax + aw - 28, y + ch / 2 - 26); c.lineTo(ax + aw - 4, y + ch / 2); c.lineTo(ax + aw - 28, y + ch / 2 + 26); c.stroke();
      const rx = x + w - cw;
      panel(c, rx, y, cw, ch);
      c.beginPath(); c.arc(rx + 58, y + 62, 30, 0, TAU); c.fillStyle = C.lime; c.fill(); iconX(c, 'chat', rx + 58, y + 62, 34, C.ink, 0.1);
      fillR(c, rx + 104, y + 40, 150, 12, 6, C.soft); fillR(c, rx + 104, y + 66, 96, 9, 4.5, C.bar);
      fillR(c, rx + 26, y + 118, cw - 60, 290, 24, C.card2); strokeR(c, rx + 26, y + 118, cw - 60, 290, 24, rgba(C.lime, 0.6), 2);
      text(c, 'Consulta pelo site', rx + 50, y + 166, { size: 23, weight: 700, color: C.lime });
      [['cal', 150], ['kid', 110], ['bed', 130]].forEach(([ic, bw], i) => { const fy = y + 196 + i * 66; iconX(c, ic, rx + 66, fy + 20, 30, C.soft, 0.1); fillR(c, rx + 100, fy + 14, bw, 12, 6, C.bar2); });
      fillR(c, rx + 26, y + 440, cw - 150, 64, 24, C.lime); bars(c, rx + 54, y + 466, [cw - 220], 11, 20, rgba(C.ink, 0.5));
      checkBadge(c, rx + cw - 44, y + ch - 44, 22);
    } },
    um: { nat: 560, draw(c, x, y, w) {                     // 08 um link só
      c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 28; fillR(c, x, y, w, 96, 48, C.lime); c.restore();
      iconX(c, 'lock', x + 60, y + 48, 38, C.ink, 0.12); fillR(c, x + 100, y + 41, 260, 14, 7, rgba(C.ink, 0.55));
      c.strokeStyle = C.lime; c.lineWidth = 6; c.setLineDash([2, 14]); c.lineCap = 'round';
      c.beginPath(); c.moveTo(x + w / 2, y + 108); c.lineTo(x + w / 2, y + 168); c.stroke(); c.setLineDash([]);
      const tw = (w - 24) / 2, th = 170;
      [['cal', 'Consulta de datas'], ['bed', 'Quartos e valores'], ['pin', 'Como chegar'], ['chat', 'WhatsApp']].forEach(([ic, lb], i) => {
        const tx = x + (i % 2) * (tw + 24), ty = y + 184 + Math.floor(i / 2) * (th + 24);
        panel(c, tx, ty, tw, th);
        c.beginPath(); c.arc(tx + 58, ty + 62, 36, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill();
        iconX(c, ic, tx + 58, ty + 62, 42, C.lime, 0.09);
        text(c, lb, tx + 30, ty + 140, { size: 28, weight: 700, color: C.white });
        checkBadge(c, tx + tw - 40, ty + 40, 19);
      });
    } },
  };

  // ---------------------------------------------------------------- slides
  const ITEMS = [
    { n: 2, lines: ['QUEM TOCA NO LINK', '*QUER RESOLVER*'], body: 'Tem vaga nas minhas datas? Quanto custa? Como eu reservo?', art: 'quer' },
    { n: 3, lines: ['UMA LISTA COM', '*9 BOTÕES*', 'NÃO RESOLVE'], body: 'Promoção, cardápio, Facebook, localização, Instagram… Cada botão a mais é uma escolha a mais. E o hóspede se perde.', art: 'nove' },
    { n: 4, rot: '1', lines: ['*CONSULTA DE DATAS*', 'PRIMEIRO'], body: 'Entrada, saída e hóspedes. É a primeira pergunta de quem quer reservar.', art: 'datas' },
    { n: 5, rot: '2', lines: ['OS QUARTOS, COM', 'FOTOS E *VALOR DE*', '*REFERÊNCIA*'], body: 'Um "a partir de" já responde se cabe no bolso.', art: 'quartos' },
    { n: 6, rot: '3', lines: ['*COMO CHEGAR*, SEM', 'PRECISAR PERGUNTAR'], body: 'O mapa e o caminho, com as referências da estrada.', art: 'chegar' },
    { n: 7, rot: '4', lines: ['UM WHATSAPP QUE', 'CHEGA COM A', '*MENSAGEM PRONTA*'], body: 'Datas, hóspedes e quarto já preenchidos. A pousada só responde.', art: 'zap' },
  ];
  const L_COVER = ['O QUE COLOCAR NO', '*LINK DA BIO*', 'DA SUA POUSADA'];
  const L_END = ['TUDO ISSO CABE EM', '*UM LINK SÓ*: O SITE', 'DA POUSADA'];
  let S_ITEM, S_COVER, S_END;

  function itemSlide(c, it) {
    background(c);
    header(c, it.n);
    let y0 = 200;
    if (it.rot) {                                          // rótulo: o número do item
      c.save(); c.shadowColor = rgba(C.lime, 0.4); c.shadowBlur = 20; c.beginPath(); c.arc(M + 36, 222, 36, 0, TAU); c.fillStyle = C.lime; c.fill(); c.restore();
      text(c, it.rot, M + 36, 222 + 14, { fam: DISPLAY, size: 40, weight: 900, color: C.ink, align: 'center' });
      y0 = 290;
    }
    const yl = titleRich(c, it.lines, M, y0 + S_ITEM * 0.74, S_ITEM);
    const bl = wrap(it.body, 35, 500, W - 2 * M);
    bl.forEach((s, i) => text(c, s, M, yl + 72 + i * 50, { size: 35, weight: 500, color: C.soft }));
    const art = ART[it.art], top = yl + 72 + (bl.length - 1) * 50 + 56, bot = 1270;
    const ay = top + Math.max(0, (bot - top - art.nat) / 2);
    glow(c, 540, ay + art.nat / 2, 600, 0.07);
    art.draw(c, M, ay, W - 2 * M);
  }
  function slideCover(c) {
    background(c);
    glow(c, 540, 960, 620, 0.08);
    header(c, 1, true);
    const yl = titleRich(c, L_COVER, M, 266 + S_COVER * 0.74, S_COVER, { lh: 1.06 });
    const sub = wrap('Quem toca ali já se interessou. E chega com uma pergunta.', 36, 500, W - 2 * M);
    sub.forEach((s, i) => text(c, s, M, yl + 76 + i * 50, { size: 36, weight: 500, color: C.soft }));
    const ty = yl + 76 + (sub.length - 1) * 50 + 90;
    const ay = ty + Math.max(0, (1270 - ty - 375) / 2);
    ART.cover.draw(c, M, ay, W - 2 * M);
  }
  function slideEnd(c) {
    background(c);
    glow(c, 540, 820, 600, 0.07);
    header(c, 8, true);
    const yl = titleRich(c, L_END, M, 248 + S_END * 0.74, S_END, { lh: 1.1 });
    text(c, 'Manda pra pousada que tem 9 botões na bio.', M, yl + 66, { size: 35, weight: 500, color: C.soft });
    const top = yl + 66 + 70, ay = top + Math.max(0, (1250 - top - ART.um.nat) / 2);
    ART.um.draw(c, M, ay, W - 2 * M);
  }

  FZC.define({
    id: 'link-da-bio',
    width: W,
    height: H,
    setup() {
      loadLogo('full', 'FAZLO-DIGITAL-branca-transparente.svg');
      loadLogo('compact', 'FAZLO-logo-branca-transparente.svg');
      S_ITEM = Math.min(80, ...ITEMS.map((it) => fit(plain(it.lines), 900, W - 2 * M, 100)));
      S_COVER = fit(plain(L_COVER), 900, W - 2 * M, 120);
      S_END = fit(plain(L_END), 900, W - 2 * M, 84);
    },
    slides: [slideCover, ...ITEMS.map((it) => (c) => itemSlide(c, it)), slideEnd],
  });
})();
