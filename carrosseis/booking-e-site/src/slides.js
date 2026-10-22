/* =====================================================================
   FAZLO Digital — carrossel "Booking traz o hóspede. O site traz ele de volta."
   8 slides 1080x1350 (4:5), estáticos. Público: donos de pousada.

   Mesmo padrão dos carrosséis anteriores: fundo #050606, lima #C6FA41,
   Unbounded (títulos) + Sora (textos); FAZLO DIGITAL na capa e no fecho,
   FAZLO compacto nos internos; topo abaixo do contador nativo do Instagram.
   Títulos com *trechos em lima*. Capa no modelo novo: ilustração grande em
   traço lima (estilo das capas v2 da série "Pelos olhos do hóspede").

   01 capa · 02 a plataforma é uma vitrine · 03 a vitrine não é sua ·
   04 depois da estadia, ele volta onde? · 05 o site é o endereço ·
   06 quem volta reserva direto · 07 quem indica manda o link ·
   08 plataforma pra ser descoberta, site pra ser lembrada

   Ilustrações genéricas e próprias: nenhum logo de marca (Booking, Airbnb,
   WhatsApp, Instagram…), nenhum número, telefone, nome de pessoa ou dado
   real; textos de cards aparecem como BARRAS.
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
  // glue: a pontuação logo depois de um trecho lima cola na palavra anterior (sem espaço); entre palavras o espaço fica
  function titleRich(c, lines, x, y, size, o = {}) {
    const lh = size * (o.lh || 1.1), ls = -size * 0.02, wt = 900, sp = measure(' ', size, wt, DISPLAY, ls);
    let lime = false;
    lines.forEach((line, i) => {
      const words = [];
      line.split('*').forEach((part, k) => { if (k > 0) lime = !lime; part.split(' ').filter(Boolean).forEach((w, q) => words.push({ w, lime, glue: q === 0 && k > 0 && /^[,.:;!?]/.test(part) })); });
      let xx = x;
      words.forEach((wd) => { if (wd.glue && xx > x) xx -= sp; text(c, wd.w, xx, y + i * lh, { fam: DISPLAY, size, weight: wt, color: wd.lime ? C.lime : C.white, ls }); xx += measure(wd.w, size, wt, DISPLAY, ls) + sp; });
    });
    return y + (lines.length - 1) * lh;
  }
  const plain = (lines) => lines.map((s) => s.replace(/\*/g, ''));

  // ---------------------------------------------------------------- ícones deste carrossel
  function iconB(c, kind, x, y, s, color = C.white, lw = 0.09) {
    const draw = {
      search: () => { c.arc(-0.08, -0.08, 0.26, 0, TAU); c.moveTo(0.11, 0.11); c.lineTo(0.38, 0.38); },
      house: () => { c.moveTo(-0.38, -0.02); c.lineTo(0, -0.38); c.lineTo(0.38, -0.02); c.moveTo(-0.28, -0.1); c.lineTo(-0.28, 0.36); c.lineTo(0.28, 0.36); c.lineTo(0.28, -0.1); c.moveTo(-0.08, 0.36); c.lineTo(-0.08, 0.12); c.lineTo(0.08, 0.12); c.lineTo(0.08, 0.36); },
      grid: () => { [[-0.36, -0.36], [0.06, -0.36], [-0.36, 0.06], [0.06, 0.06]].forEach(([a, b]) => c.roundRect(a, b, 0.3, 0.3, 0.06)); },
      user: () => { c.arc(0, -0.16, 0.18, 0, TAU); c.moveTo(-0.34, 0.4); c.quadraticCurveTo(-0.34, 0.08, 0, 0.08); c.quadraticCurveTo(0.34, 0.08, 0.34, 0.4); },
      link: () => { c.roundRect(-0.44, -0.16, 0.5, 0.32, 0.16); c.roundRect(-0.06, -0.16, 0.5, 0.32, 0.16); },
      ret: () => {                                       // seta de retorno (↻): arco aberto à direita, ponta no fim
        const r = 0.3, a1 = 1.75 * Math.PI, px = r * Math.cos(a1), py = r * Math.sin(a1);
        c.arc(0, 0, r, 0.3 * Math.PI, a1); c.stroke(); c.beginPath();
        const t = [0.707, 0.707], n = [-0.707, 0.707], tx = px + t[0] * 0.06, ty = py + t[1] * 0.06;
        c.moveTo(tx, ty); c.lineTo(px - t[0] * 0.1 + n[0] * 0.11, py - t[1] * 0.1 + n[1] * 0.11); c.lineTo(px - t[0] * 0.1 - n[0] * 0.11, py - t[1] * 0.1 - n[1] * 0.11); c.closePath(); c.fillStyle = c.strokeStyle; c.fill();
      },
      star: () => { for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.17 : 0.4; k ? c.lineTo(r * Math.cos(a), r * Math.sin(a)) : c.moveTo(r * Math.cos(a), r * Math.sin(a)); } c.closePath(); },
    }[kind];
    if (!draw) { iconX(c, kind, x, y, s, color, lw); return; }
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); draw(); c.stroke(); c.restore();
  }
  // traço lima com brilho (capa, no estilo das capas v2)
  function neon(c, draw, lw = 6, a = 1) {
    c.save(); c.globalAlpha = a; c.strokeStyle = C.lime; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.shadowColor = rgba(C.lime, 0.75); c.shadowBlur = 24; c.beginPath(); draw(); c.stroke(); c.restore();
  }
  function nbox(c, x, y, w, h, r, lw = 6) { fillR(c, x, y, w, h, r, '#0A0E09'); neon(c, () => c.roundRect(x, y, w, h, r), lw); }
  const limeBar = (c, x, y, w, h = 12, a = 0.55) => fillR(c, x, y, w, h, h / 2, rgba(C.lime, a));

  // lista genérica de plataforma: linhas com foto + barras (+ estrelas em barra)
  function listRow(c, x, y, w, h, hl, dim) {
    c.save(); c.globalAlpha = dim ? 0.38 : 1;
    fillR(c, x, y, w, h, 18, hl ? rgba(C.lime, 0.1) : C.card2); strokeR(c, x, y, w, h, 18, hl ? C.lime : C.line, hl ? 3 : 2);
    photoX(c, 'room', x + 12, y + 12, h - 24, h - 24);
    fillR(c, x + h + 6, y + h * 0.3, w * 0.42, 13, 6.5, C.soft);
    fillR(c, x + h + 6, y + h * 0.3 + 28, w * 0.3, 10, 5, C.bar);
    for (let k = 0; k < 5; k++) iconB(c, 'star', x + h + 16 + k * 26, y + h * 0.3 + 62, 22, hl ? C.lime : C.bar2, 0.12);
    c.restore();
  }
  function searchBar(c, x, y, w, h = 76) {
    fillR(c, x, y, w, h, h / 2, C.card2); strokeR(c, x, y, w, h, h / 2, C.line, 2);
    iconB(c, 'search', x + h / 2 + 4, y + h / 2, 38, C.lime, 0.1); fillR(c, x + h + 10, y + h / 2 - 6, 220, 12, 6, C.bar2);
  }
  function urlBar(c, x, y, w, h = 76, hl = true) {
    if (hl) { c.save(); c.shadowColor = rgba(C.lime, 0.45); c.shadowBlur = 24; }
    fillR(c, x, y, w, h, h / 2, hl ? C.lime : C.card2); if (hl) c.restore();
    iconX(c, 'lock', x + h / 2 + 4, y + h / 2, 34, hl ? C.ink : C.muted, 0.12);
    fillR(c, x + h + 6, y + h / 2 - 7, Math.min(300, w - h - 40), 14, 7, hl ? rgba(C.ink, 0.55) : C.bar2);
  }
  function retBadge(c, x, y, r) {
    c.save(); c.shadowColor = rgba(C.lime, 0.6); c.shadowBlur = 28; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = C.lime; c.fill(); c.restore();
    iconB(c, 'ret', x, y, r * 1.4, C.ink, 0.13);
  }
  function arrowR(c, x0, x1, y) {
    c.save(); c.strokeStyle = C.lime; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x1 - 24, y - 24); c.lineTo(x1, y); c.lineTo(x1 - 24, y + 24); c.stroke(); c.restore();
  }

  const ART = {
    cover: { nat: 520, draw(c, x, y, w) {                 // plataforma genérica → site da pousada, com retorno
      const cw = 390, ch = 500;
      nbox(c, x, y + 10, cw, ch, 34);                       // card da plataforma: lista de pousadas
      neon(c, () => { c.roundRect(x + 30, y + 40, cw - 60, 60, 30); }, 4);
      neon(c, () => { c.arc(x + 62, y + 68, 13, 0, TAU); c.moveTo(x + 72, y + 78); c.lineTo(x + 82, y + 88); }, 4);
      for (let i = 0; i < 4; i++) {
        const ry = y + 128 + i * 92, a = i === 1 ? 1 : 0.5;
        neon(c, () => c.roundRect(x + 30, ry, 68, 68, 12), 4, a);
        neon(c, () => { c.moveTo(x + 40, ry + 56); c.lineTo(x + 58, ry + 36); c.lineTo(x + 70, ry + 48); c.lineTo(x + 78, ry + 40); c.lineTo(x + 88, ry + 56); }, 3, a);
        limeBar(c, x + 118, ry + 14, 180 - (i % 2) * 40, 13, 0.75 * a);
        limeBar(c, x + 118, ry + 42, 120 + (i % 3) * 20, 10, 0.4 * a);
      }
      const sx = x + w - cw, sy = y + 40, sh = ch - 30;      // card do site da pousada
      nbox(c, sx, sy, cw, sh, 34);
      neon(c, () => c.roundRect(sx + 30, sy + 30, cw - 130, 56, 28), 4);
      neon(c, () => { c.roundRect(sx + 50, sy + 52, 16, 14, 3); c.moveTo(sx + 53, sy + 52); c.arc(sx + 58, sy + 52, 5, Math.PI, 0); }, 3);
      limeBar(c, sx + 84, sy + 52, 120, 12, 0.7);
      neon(c, () => c.roundRect(sx + 30, sy + 108, cw - 60, 170, 18), 5);
      neon(c, () => { c.moveTo(sx + 44, sy + 262); c.lineTo(sx + 130, sy + 170); c.lineTo(sx + 190, sy + 230); c.lineTo(sx + 240, sy + 190); c.lineTo(sx + 316, sy + 262); }, 4);
      neon(c, () => c.arc(sx + 270, sy + 150, 18, 0, TAU), 4);
      neon(c, () => { c.moveTo(sx + 160, sy + 322); c.lineTo(sx + 195, sy + 296); c.lineTo(sx + 230, sy + 322); c.moveTo(sx + 170, sy + 316); c.lineTo(sx + 170, sy + 346); c.lineTo(sx + 220, sy + 346); c.lineTo(sx + 220, sy + 316); }, 4);
      limeBar(c, sx + 60, sy + 366, cw - 120, 14, 0.75); limeBar(c, sx + 100, sy + 394, cw - 200, 10, 0.4);
      c.save(); c.shadowColor = rgba(C.lime, 0.6); c.shadowBlur = 24; fillR(c, sx + 30, sy + sh - 66, cw - 60, 40, 20, C.lime); c.restore();
      // seta de retorno: do site, por cima, de volta ao site
      const ax = (x + cw + sx) / 2;
      neon(c, () => { c.moveTo(x + cw + 14, y + 300); c.lineTo(sx - 18, y + 300); c.moveTo(sx - 44, y + 276); c.lineTo(sx - 18, y + 300); c.lineTo(sx - 44, y + 324); }, 7);
      retBadge(c, sx + cw - 46, sy + 46, 50);
      void ax;
    } },
    vitrine: { nat: 640, draw(c, x, y, w) {                // 02 vitrine: lista de pousadas, uma é a sua
      panel(c, x, y, w, 640);
      searchBar(c, x + 30, y + 30, w - 60);
      for (let i = 0; i < 4; i++) listRow(c, x + 30, y + 132 + i * 124, w - 60, 108, i === 1, false);
      checkBadge(c, x + w - 44, y + 132 + 124 + 14, 22);
    } },
    nao: { nat: 600, draw(c, x, y, w) {                    // 03 regras, comissão e contato ficam com a plataforma
      panel(c, x, y, w, 600);
      c.beginPath(); c.arc(x + 76, y + 76, 40, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill();
      iconB(c, 'grid', x + 76, y + 76, 44, C.lime, 0.09);
      text(c, 'Plataforma', x + 136, y + 88, { size: 32, weight: 700, color: C.white });
      [['list', 'Regras'], ['tag', 'Comissão'], ['user', 'Contato com o hóspede']].forEach(([ic, lb], i) => {
        const ry = y + 150 + i * 144;
        fillR(c, x + 30, ry, w - 60, 120, 24, C.card2); strokeR(c, x + 30, ry, w - 60, 120, 24, C.line, 2);
        iconB(c, ic, x + 92, ry + 60, 46, C.soft, 0.09);
        text(c, lb, x + 144, ry + 70, { size: 30, weight: 700, color: C.white });
        c.beginPath(); c.arc(x + w - 100, ry + 60, 36, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill();
        iconX(c, 'lock', x + w - 100, ry + 56, 44, C.lime, 0.1);
      });
    } },
    onde: { nat: 620, draw(c, x, y, w) {                   // 04 dezenas de opções, e a sua no meio
      searchBar(c, x, y, w - 140);
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 24; c.beginPath(); c.arc(x + w - 50, y + 38, 50, 0, TAU); c.fillStyle = C.lime; c.fill(); c.restore();
      text(c, '?', x + w - 50, y + 58, { fam: DISPLAY, size: 56, weight: 900, color: C.ink, align: 'center' });
      const cols = 4, rows = 3, gw = (w - (cols - 1) * 20) / cols, gh = 150;
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        const gx = x + k * (gw + 20), gy = y + 120 + r * (gh + 20);
        c.save(); c.globalAlpha = 0.45;
        fillR(c, gx, gy, gw, gh, 18, C.card2); strokeR(c, gx, gy, gw, gh, 18, C.line, 2);
        photoX(c, ['room', 'view', 'pool', 'bath'][(r + k) % 4], gx + 10, gy + 10, gw - 20, 80);
        fillR(c, gx + 14, gy + 106, gw * 0.6, 11, 5.5, C.soft); fillR(c, gx + 14, gy + 126, gw * 0.4, 9, 4.5, C.bar);
        c.restore();
      }
    } },
    endereco: { nat: 640, draw(c, x, y, w) {               // 05 o site: nome, fotos, regras
      panel(c, x, y, w, 640);
      urlBar(c, x + 30, y + 30, w - 60);
      photoX(c, 'view', x + 30, y + 130, w - 60, 250);
      c.beginPath(); c.arc(x + 90, y + 440, 34, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill(); iconB(c, 'house', x + 90, y + 440, 40, C.lime, 0.1);
      fillR(c, x + 144, y + 424, 320, 16, 8, C.soft); fillR(c, x + 144, y + 452, 220, 11, 5.5, C.bar);
      const pw = (w - 60 - 40) / 3;
      [['mark', 'Nome'], ['image', 'Fotos'], ['list', 'Regras']].forEach(([ic, lb], i) => pill(c, x + 30 + i * (pw + 20), y + 520, pw, 78, lb, ic, true, 28));
    } },
    direto: { nat: 580, draw(c, x, y, w) {                 // 06 consulta pelo site → mensagem na pousada
      const cw = Math.floor((w - 100) / 2), ch = 580;
      panel(c, x, y, cw, ch);
      text(c, 'Consulta de datas', x + 28, y + 58, { size: 26, weight: 700, color: C.white });
      [['cal', 150], ['kid', 110], ['bed', 130]].forEach(([ic, bw], i) => {
        const fy = y + 90 + i * 96;
        fillR(c, x + 28, fy, cw - 56, 78, 16, C.card2); iconX(c, ic, x + 70, fy + 39, 32, C.lime, 0.1); fillR(c, x + 108, fy + 33, bw, 12, 6, C.bar2);
      });
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 24; fillR(c, x + 28, y + ch - 118, cw - 56, 70, 20, C.lime); c.restore();
      text(c, 'Enviar', x + 56, y + ch - 73, { size: 26, weight: 800, color: C.ink });
      arrowR(c, x + cw + 16, x + w - cw - 16, y + ch / 2);
      const rx = x + w - cw;
      panel(c, rx, y, cw, ch);
      c.beginPath(); c.arc(rx + 58, y + 62, 30, 0, TAU); c.fillStyle = C.lime; c.fill(); iconB(c, 'house', rx + 58, y + 62, 34, C.ink, 0.11);
      fillR(c, rx + 104, y + 52, 150, 12, 6, C.soft);
      fillR(c, rx + 26, y + 118, cw - 60, 290, 24, C.card2); strokeR(c, rx + 26, y + 118, cw - 60, 290, 24, rgba(C.lime, 0.6), 2);
      text(c, 'Consulta pelo site', rx + 50, y + 166, { size: 23, weight: 700, color: C.lime });
      [['cal', 150], ['kid', 110], ['bed', 130]].forEach(([ic, bw], i) => { const fy = y + 196 + i * 66; iconX(c, ic, rx + 66, fy + 20, 30, C.soft, 0.1); fillR(c, rx + 100, fy + 14, bw, 12, 6, C.bar2); });
      fillR(c, rx + 26, y + 440, cw - 150, 64, 24, C.lime); bars(c, rx + 54, y + 466, [cw - 220], 11, 20, rgba(C.ink, 0.5));
      checkBadge(c, rx + cw - 44, y + ch - 44, 22);
    } },
    indica: { nat: 580, draw(c, x, y, w) {                 // 07 o link vai na conversa e abre o site
      const cw = Math.floor((w - 100) / 2), ch = 580;
      panel(c, x, y, cw, ch);
      c.beginPath(); c.arc(x + 58, y + 62, 30, 0, TAU); c.fillStyle = C.card2; c.fill(); iconB(c, 'user', x + 58, y + 62, 36, C.soft, 0.1);
      fillR(c, x + 104, y + 52, 140, 12, 6, C.soft);
      fillR(c, x + 26, y + 120, cw - 90, 70, 22, C.card2); bars(c, x + 50, y + 142, [cw - 170, cw - 230], 10, 20);
      const bx = x + 50, by = y + 220, bw = cw - 76;
      fillR(c, bx, by, bw, 300, 24, rgba(C.lime, 0.14)); strokeR(c, bx, by, bw, 300, 24, C.lime, 3);
      photoX(c, 'view', bx + 16, by + 16, bw - 32, 150);
      iconB(c, 'link', bx + 44, by + 206, 40, C.lime, 0.11); fillR(c, bx + 80, by + 200, bw - 120, 12, 6, C.soft);
      fillR(c, bx + 20, by + 240, bw - 90, 10, 5, C.bar2);
      arrowR(c, x + cw + 16, x + w - cw - 16, y + ch / 2);
      const rx = x + w - cw;
      panel(c, rx, y, cw, ch);
      urlBar(c, rx + 20, y + 24, cw - 40, 60);
      photoX(c, 'view', rx + 20, y + 104, cw - 40, 190);
      c.beginPath(); c.arc(rx + 60, y + 340, 28, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill(); iconB(c, 'house', rx + 60, y + 340, 32, C.lime, 0.1);
      fillR(c, rx + 104, y + 330, cw - 150, 14, 7, C.soft); bars(c, rx + 28, y + 390, [cw - 60, cw - 110], 10, 22);
      c.save(); c.shadowColor = rgba(C.lime, 0.5); c.shadowBlur = 24; fillR(c, rx + 20, y + ch - 110, cw - 40, 66, 20, C.lime); c.restore();
      iconX(c, 'cal', rx + 60, y + ch - 77, 32, C.ink, 0.11); fillR(c, rx + 94, y + ch - 83, 140, 12, 6, rgba(C.ink, 0.55));
      checkBadge(c, rx + cw - 20, y + 20, 22);
    } },
    dois: { nat: 470, draw(c, x, y, w) {                   // 08 plataforma (descoberta) + site (lembrada)
      const cw = (w - 40) / 2, ch = 470;
      [[0, 'search', 'Plataforma', 'Descoberta'], [1, 'house', 'Site', 'Lembrada']].forEach(([i, ic, lb, tg]) => {
        const px = x + i * (cw + 40);
        panel(c, px, y, cw, ch); if (i) strokeR(c, px, y, cw, ch, 28, C.lime, 3);
        c.beginPath(); c.arc(px + 66, y + 66, 36, 0, TAU); c.fillStyle = rgba(C.lime, 0.14); c.fill(); iconB(c, ic, px + 66, y + 66, 42, C.lime, 0.1);
        text(c, lb, px + 118, y + 78, { size: 32, weight: 700, color: C.white });
        if (!i) for (let k = 0; k < 3; k++) { const ry = y + 130 + k * 82; fillR(c, px + 26, ry, cw - 52, 68, 16, C.card2); photoX(c, 'room', px + 34, ry + 8, 52, 52); fillR(c, px + 100, ry + 28, cw - 170 - k * 30, 11, 5.5, C.bar2); }
        else { photoX(c, 'view', px + 26, y + 130, cw - 52, 150); bars(c, px + 30, y + 304, [cw - 110, cw - 170], 11, 24); retBadge(c, px + cw - 22, y + 22, 34); }
        pill(c, px + 26, y + ch - 98, cw - 52, 72, tg, i ? 'bookmark' : 'search', true, 28);
      });
    } },
  };

  // ---------------------------------------------------------------- slides
  const ITEMS = [
    { n: 2, lines: ['A PLATAFORMA É', 'UMA *VITRINE*'], body: 'Muita gente descobre a sua pousada lá. E isso é ótimo.', art: 'vitrine' },
    { n: 3, lines: ['MAS A VITRINE', '*NÃO É SUA*'], body: 'As regras, a comissão e o contato com o hóspede ficam com a plataforma.', art: 'nao' },
    { n: 4, lines: ['DEPOIS DA ESTADIA,', '*ELE VOLTA ONDE?*'], body: 'Se não lembra do seu nome, ele procura de novo na plataforma, no meio de dezenas de opções.', art: 'onde' },
    { n: 5, lines: ['O SITE É O *ENDEREÇO*', 'DA POUSADA'], body: 'Seu nome, suas fotos, suas regras. Fácil de lembrar e de indicar.', art: 'endereco' },
    { n: 6, lines: ['QUEM VOLTA', '*RESERVA DIRETO*'], body: 'Consulta pelo site e a mensagem chega no WhatsApp da pousada, sem intermediário.', art: 'direto' },
    { n: 7, lines: ['QUEM INDICA', '*MANDA O LINK*'], body: 'O amigo do hóspede chega no seu site, não numa lista cheia de concorrentes.', art: 'indica' },
  ];
  const L_COVER = ['BOOKING TRAZ', 'O HÓSPEDE.', '*O SITE TRAZ ELE*', '*DE VOLTA.*'];
  const L_END = ['PLATAFORMA PRA SER', '*DESCOBERTA*.', 'SITE PRA SER', '*LEMBRADA*.'];
  let S_ITEM, S_COVER, S_END;

  function itemSlide(c, it) {
    background(c);
    header(c, it.n);
    const yl = titleRich(c, it.lines, M, 200 + S_ITEM * 0.74, S_ITEM);
    const bl = wrap(it.body, 35, 500, W - 2 * M);
    bl.forEach((s, i) => text(c, s, M, yl + 72 + i * 50, { size: 35, weight: 500, color: C.soft }));
    const art = ART[it.art], top = yl + 72 + (bl.length - 1) * 50 + 56, bot = 1270;
    const ay = top + Math.max(0, (bot - top - art.nat) / 2);
    glow(c, 540, ay + art.nat / 2, 600, 0.07);
    art.draw(c, M, ay, W - 2 * M);
  }
  function slideCover(c) {
    background(c);
    glow(c, 540, 1000, 640, 0.1);
    header(c, 1, true);
    const yl = titleRich(c, L_COVER, M, 236 + S_COVER * 0.74, S_COVER, { lh: 1.04 });
    const sub = wrap('O papel de cada um, e por que a pousada precisa dos dois.', 34, 500, W - 2 * M);
    sub.forEach((s, i) => text(c, s, M, yl + 66 + i * 48, { size: 34, weight: 500, color: C.soft }));
    const ty = yl + 66 + (sub.length - 1) * 48 + 50;
    const ay = ty + Math.max(0, (1290 - ty - ART.cover.nat) / 2);
    ART.cover.draw(c, M, ay, W - 2 * M);
  }
  function slideEnd(c) {
    background(c);
    glow(c, 540, 860, 600, 0.07);
    header(c, 8, true);
    const yl = titleRich(c, L_END, M, 248 + S_END * 0.74, S_END, { lh: 1.08 });
    text(c, 'Manda pra pousada que depende só da plataforma.', M, yl + 66, { size: 33, weight: 500, color: C.soft });
    const top = yl + 66 + 60, ay = top + Math.max(0, (1270 - top - ART.dois.nat) / 2);
    ART.dois.draw(c, M, ay, W - 2 * M);
  }

  FZC.define({
    id: 'booking-e-site',
    width: W,
    height: H,
    setup() {
      loadLogo('full', 'FAZLO-DIGITAL-branca-transparente.svg');
      loadLogo('compact', 'FAZLO-logo-branca-transparente.svg');
      S_ITEM = Math.min(80, ...ITEMS.map((it) => fit(plain(it.lines), 900, W - 2 * M, 100)));
      S_COVER = fit(plain(L_COVER), 900, W - 2 * M, 96);
      S_END = fit(plain(L_END), 900, W - 2 * M, 84);
    },
    slides: [slideCover, ...ITEMS.map((it) => (c) => itemSlide(c, it)), slideEnd],
  });
})();
