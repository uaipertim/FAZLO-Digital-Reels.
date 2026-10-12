/* =====================================================================
   FAZLO Digital + FAZLO Hospeda (collab) — "Mandou mensagem e ninguém respondeu"
   9:16 (1080x1920, 60 fps), 35,4 s

   100% motion graphics. Mecânica: um FIO lima conecta as duas pontas. Ele nasce na consulta
   do site, passa pelo WhatsApp e termina na reserva registrada no Hospeda: é a própria
   mensagem viajando sem se perder. Em cada ponto importante, o fio fecha um contorno.

   Fluxo real (nada automático): consulta pelo site -> chega no WhatsApp -> a pousada confere a
   ocupação no Hospeda -> lança a reserva à mão (canal WhatsApp) -> reserva registrada.

   100 BPM · 1 tempo = 0,6 s · 59 tempos
     1 gancho        0,0–4,2   "Tem vaga de 5 a 8 de novembro?" ✓✓ entregue; "…" aparece e some.
                               MANDOU / MENSAGEM E / NINGUÉM / RESPONDEU.
     2 a rotina      4,2–9,0   em volta do balão: café da manhã · check-in · limpeza · chaves
                               NÃO É DESCASO. / É A ROTINA / DA POUSADA.
     3 o site        9,0–15,0  o balão vira o formulário do site genérico; campos (9,6 · 10,2 · 10,8);
                               "Enviar consulta" (11,4: o fio nasce); chega no WhatsApp (12,0)
                               O SITE ORGANIZA / A PERGUNTA.
     4 o Hospeda     15,0–27,0 painel (cards do topo) · calendário antes (livre(s), dias 5–8) ·
                               Etapa 4 (canal WhatsApp, CONFIRMADA) · revisão (Pronto para salvar!,
                               toque em Confirmar reserva, 25,8)
                               A POUSADA VÊ / NA HORA O QUE / ESTÁ LIVRE.  ·  E LANÇA A RESERVA / NO SISTEMA.
     5 o ciclo fecha 27,0–31,2 detalhes (Origem / Canal: WhatsApp; sem zoom) · calendário antes -> depois
                               (29,4) · DA MENSAGEM À RESERVA, / SEM PERDER NADA.
     6 CTA           31,2–35,4 FAZLO DIGITAL + FAZLO HOSPEDA ligados pelo fio · Site para ser encontrada. /
                               Sistema para se organizar. · Fale com a FAZLO · link na bio

   Telas do Hospeda: só os recortes dos prints reais (src/assets/hospeda/, tratados por
   scripts/prints.py: telefone coberto por barra neutra; painel só com os cards do topo).
   Os recortes aparecem como cartões ampliados (~1,4x a tela do celular); o 05 sem zoom.
   Site e conversa: recriações genéricas (sem nome de pousada, sem número, sem logo do WhatsApp).
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog, ease: E, kick, hash, rgba } = U;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- tempo
  const BPM = 100;
  const { BT } = U.tempo(BPM);                      // 0,6 s
  const b = (n) => +(n * BT).toFixed(4);
  const T = { gancho: 0, rotina: b(7), site: b(15), hospeda: b(25), ciclo: b(45), cta: b(52) };
  const DURATION = b(59);                            // 35,4 s
  const ICON_T = [b(8), b(9), b(10), b(11)];         // café · check-in · limpeza · chaves (4,8 · 5,4 · 6,0 · 6,6)
  const FILL_T = [b(16), b(17), b(18)];              // datas · hóspedes · acomodação (9,6 · 10,2 · 10,8)
  const ENVIAR = b(19);                              // 11,4: toque em "Enviar consulta" — o fio nasce
  const CHEGA = b(20);                               // 12,0: a mensagem chega no WhatsApp
  const CONFIRMA = b(43);                            // 25,8: toque em "Confirmar reserva"
  const VIRA = b(49);                                // 29,4: calendário antes -> depois
  const ACOMOD = 'Chalé Serra 01';                   // a acomodação da reserva nos prints do Hospeda

  // ---------------------------------------------------------------- cores e texto
  let DISPLAY, TEXT, IMG = {};
  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', card: '#141717', card2: '#1C2121', line: '#2A2F2F',
    bar: '#3A4141', bar2: '#566060', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C', dim: '#3A4444',
    bubble: '#F1F4F3', gray: '#9AA3A3',
  };
  const MEAS = document.createElement('canvas').getContext('2d');
  const fnt = (fam, size, weight) => `${weight} ${size}px ${fam}`;
  function measure(s, fam, size, weight, ls = 0) { MEAS.font = fnt(fam, size, weight); MEAS.letterSpacing = `${ls}px`; return MEAS.measureText(s).width; }
  function fit(lines, fam, weight, maxW, maxSize, lsK = 0) { let z = maxSize; while (z > 10 && lines.some((s) => measure(s, fam, z, weight, z * lsK) > maxW)) z -= 1; return z; }
  function text(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save(); c.globalAlpha *= clamp(a);
    c.font = fnt(o.fam || TEXT, o.size, o.weight || 600); c.letterSpacing = `${o.ls || 0}px`;
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = o.color || C.white; c.fillText(s, x, y);
    c.restore();
  }
  // título: palavras sobem de uma fenda (uma por vez) e saem para cima em t1
  function titleBlock(c, lines, t, t0, t1, o) {
    if (t < t0 || t > t1 + 0.7) return;
    const size = o.size, lh = size * (o.lh || 1.12), ls = -size * 0.02, wt = o.weight || 900;
    let k = 0;
    lines.forEach((line, li) => {
      const y = o.y + li * lh;
      const total = measure(line, DISPLAY, size, wt, ls), sp = measure(' ', DISPLAY, size, wt, ls);
      let x = W / 2 - total / 2;
      c.save(); c.beginPath(); c.rect(-W, y - size * 1.05, 3 * W, size * 1.32); c.clip();
      for (const w of line.split(' ')) {
        const ww = measure(w, DISPLAY, size, wt, ls);
        const ti = t0 + k * (o.st ?? 0.07), p = E.outExpo(prog(t, ti, ti + 0.5));
        const q = E.inCubic(prog(t, t1 + k * 0.025, t1 + k * 0.025 + 0.28));
        const lime = o.lime && o.lime.includes(w);
        if (p > 0 && q < 1) text(c, w, x, y + (1 - p) * size * 1.35 - q * size * 1.2, { fam: DISPLAY, size, weight: wt, color: lime ? C.lime : C.white, ls });
        x += ww + sp; k++;
      }
      c.restore();
    });
  }

  // ---------------------------------------------------------------- formas e ícones
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function fillR(c, x, y, w, h, r, col) { rrect(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
  function strokeR(c, x, y, w, h, r, col, lw) { rrect(c, x, y, w, h, r); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
  function bars(c, x, y, ws, h = 10, gap = 20, col = C.bar) { ws.forEach((w, i) => fillR(c, x, y + i * gap, w, h, h / 2, col)); }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.005) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function icon(c, kind, x, y, s, color = C.white, lw = 0.09) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'chat':                                  // conversa (genérico, sem logo)
        c.roundRect(-0.4, -0.34, 0.8, 0.56, 0.14); c.moveTo(-0.2, 0.22); c.lineTo(-0.3, 0.4); c.lineTo(0.02, 0.22);
        c.moveTo(-0.2, -0.06); c.lineTo(0.2, -0.06); c.moveTo(-0.2, 0.06); c.lineTo(0.08, 0.06); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'menu': c.moveTo(-0.32, -0.2); c.lineTo(0.32, -0.2); c.moveTo(-0.32, 0); c.lineTo(0.32, 0); c.moveTo(-0.32, 0.2); c.lineTo(0.32, 0.2); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'signal': for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery': c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      case 'globe': c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0.15, 0); c.ellipse(0, 0, 0.15, 0.36, 0, 0, TAU); c.moveTo(-0.36, 0); c.lineTo(0.36, 0); break;
      case 'back': c.moveTo(0.1, -0.28); c.lineTo(-0.16, 0); c.lineTo(0.1, 0.28); break;
      case 'checks': c.moveTo(-0.42, 0.02); c.lineTo(-0.24, 0.2); c.lineTo(0.08, -0.18); c.moveTo(-0.06, 0.12); c.lineTo(0.02, 0.2); c.lineTo(0.36, -0.18); break;
      case 'send': c.moveTo(-0.3, -0.3); c.lineTo(0.34, 0); c.lineTo(-0.3, 0.3); c.lineTo(-0.18, 0); c.closePath(); c.fill(); c.restore(); return;
      case 'globe': c.arc(0, 0, 0.36, 0, TAU); c.moveTo(0.15, 0); c.ellipse(0, 0, 0.15, 0.36, 0, 0, TAU); c.moveTo(-0.36, 0); c.lineTo(0.36, 0); break;
      case 'back': c.moveTo(0.1, -0.28); c.lineTo(-0.16, 0); c.lineTo(0.1, 0.28); break;
      case 'checks': c.moveTo(-0.42, 0.02); c.lineTo(-0.24, 0.2); c.lineTo(0.08, -0.18); c.moveTo(-0.06, 0.12); c.lineTo(0.02, 0.2); c.lineTo(0.36, -0.18); break;
      case 'send': c.moveTo(-0.3, -0.3); c.lineTo(0.34, 0); c.lineTo(-0.3, 0.3); c.lineTo(-0.18, 0); c.closePath(); c.fill(); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }

  // ---------------------------------------------------------------- ilustrações planas (site genérico)
  function photo(c, kind, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, Math.min(14, w * 0.06)); c.clip(); c.translate(x, y);
    const g = (c0, c1, y0 = 0, y1 = h) => { const gr = c.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); c.fillStyle = gr; c.fillRect(0, y0, w, y1 - y0); };
    switch (kind) {
      case 'room':
        g('#E9DDCB', '#DCCAB0', 0, h * 0.7); g('#B99772', '#9C7A58', h * 0.7, h);
        c.fillStyle = '#A9C7D6'; c.fillRect(w * 0.64, h * 0.12, w * 0.24, h * 0.34); c.fillStyle = '#F1E8DA'; c.fillRect(w * 0.755, h * 0.12, w * 0.01, h * 0.34);
        c.fillStyle = '#7D5B40'; c.fillRect(w * 0.12, h * 0.36, w * 0.5, h * 0.2);
        c.fillStyle = '#FFFFFF'; c.fillRect(w * 0.1, h * 0.54, w * 0.54, h * 0.2);
        c.fillStyle = '#F4F7F7'; c.beginPath(); c.roundRect(w * 0.15, h * 0.47, w * 0.18, h * 0.1, 6); c.roundRect(w * 0.39, h * 0.47, w * 0.18, h * 0.1, 6); c.fill();
        c.fillStyle = '#5E7F94'; c.fillRect(w * 0.1, h * 0.64, w * 0.54, h * 0.1);
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.68, h * 0.56, w * 0.14, h * 0.16);
        break;
      case 'bath':
        g('#E4ECEC', '#D2DEDE');
        c.fillStyle = '#BFD6DE'; c.beginPath(); c.roundRect(w * 0.3, h * 0.1, w * 0.4, h * 0.36, w * 0.06); c.fill();
        c.fillStyle = '#8B6A4E'; c.fillRect(w * 0.2, h * 0.58, w * 0.6, h * 0.42);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(w * 0.5, h * 0.58, w * 0.18, h * 0.05, 0, 0, TAU); c.fill();
        break;
      case 'view':
        g('#F3C38F', '#F6E3C4', 0, h * 0.6);
        c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(w * 0.7, h * 0.36, Math.min(w, h) * 0.1, 0, TAU); c.fill();
        c.fillStyle = '#8FA7B8'; c.beginPath(); c.moveTo(0, h * 0.62); c.lineTo(w * 0.22, h * 0.34); c.lineTo(w * 0.45, h * 0.6); c.lineTo(w * 0.62, h * 0.42); c.lineTo(w, h * 0.66); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        c.fillStyle = '#5F7E6A'; c.beginPath(); c.moveTo(0, h * 0.78); c.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.8); c.lineTo(w, h); c.lineTo(0, h); c.fill();
        break;
      case 'pool':
        g('#A6DBE6', '#E8F3EE', 0, h * 0.45);
        c.fillStyle = '#E9DCC6'; c.fillRect(0, h * 0.45, w, h * 0.55);
        c.fillStyle = '#4FB6C8'; c.beginPath(); c.roundRect(w * 0.12, h * 0.55, w * 0.76, h * 0.32, 8); c.fill();
        c.fillStyle = '#3F7350'; [[0.86, 0.2, 0.07], [0.93, 0.17, 0.065]].forEach(([a1, b1, r1]) => { c.beginPath(); c.arc(w * a1, h * b1, Math.min(w, h * 2) * r1, 0, TAU); c.fill(); });
        break;
      default: break;
    }
    c.restore();
  }

  // ---------------------------------------------------------------- ícones da rotina (traço branco)
  function routineIcon(c, kind, x, y, s, color = C.white) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 0.075; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    switch (kind) {
      case 'cafe':                                    // xícara com fumaça
        c.moveTo(-0.32, -0.06); c.lineTo(-0.28, 0.2); c.quadraticCurveTo(-0.26, 0.3, -0.14, 0.3); c.lineTo(0.12, 0.3); c.quadraticCurveTo(0.24, 0.3, 0.26, 0.2); c.lineTo(0.3, -0.06); c.closePath();
        c.moveTo(0.29, 0.0); c.quadraticCurveTo(0.46, 0.0, 0.42, 0.12); c.quadraticCurveTo(0.38, 0.22, 0.26, 0.18);
        c.moveTo(-0.42, 0.38); c.lineTo(0.42, 0.38);
        c.moveTo(-0.12, -0.18); c.quadraticCurveTo(-0.2, -0.28, -0.12, -0.36); c.quadraticCurveTo(-0.04, -0.44, -0.12, -0.52);
        c.moveTo(0.08, -0.18); c.quadraticCurveTo(0.0, -0.28, 0.08, -0.36); c.quadraticCurveTo(0.16, -0.44, 0.08, -0.52);
        break;
      case 'checkin':                                 // campainha de recepção
        c.moveTo(-0.4, 0.22); c.lineTo(0.4, 0.22); c.moveTo(-0.46, 0.34); c.lineTo(0.46, 0.34);
        c.moveTo(-0.34, 0.22); c.quadraticCurveTo(-0.34, -0.22, 0, -0.22); c.quadraticCurveTo(0.34, -0.22, 0.34, 0.22);
        c.moveTo(0, -0.22); c.lineTo(0, -0.32); c.moveTo(-0.08, -0.34); c.lineTo(0.08, -0.34);
        break;
      case 'limpeza':                                 // borrifador
        c.moveTo(-0.16, -0.06); c.lineTo(0.16, -0.06); c.lineTo(0.22, 0.42); c.lineTo(-0.22, 0.42); c.closePath();
        c.moveTo(-0.1, -0.06); c.lineTo(-0.1, -0.2); c.lineTo(0.06, -0.2); c.lineTo(0.06, -0.06);
        c.moveTo(-0.14, -0.2); c.lineTo(-0.14, -0.34); c.lineTo(0.24, -0.34); c.lineTo(0.18, -0.2); c.lineTo(-0.14, -0.2);
        c.moveTo(0.36, -0.42); c.lineTo(0.38, -0.42); c.moveTo(0.42, -0.3); c.lineTo(0.44, -0.3); c.moveTo(0.36, -0.2); c.lineTo(0.38, -0.2);
        break;
      case 'chaves':                                  // chave
        c.arc(-0.2, -0.16, 0.2, 0, TAU);
        c.moveTo(-0.06, -0.02); c.lineTo(0.38, 0.42); c.moveTo(0.18, 0.22); c.lineTo(0.28, 0.12); c.moveTo(0.28, 0.32); c.lineTo(0.38, 0.22);
        break;
      case 'chevron': c.moveTo(-0.22, -0.1); c.lineTo(0, 0.12); c.lineTo(0.22, -0.1); break;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function checkBadge(c, x, y, r, col = C.lime) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); icon(c, 'check', x, y, r * 1.6, C.ink, 0.13); }

  // ---------------------------------------------------------------- 1 · o balão do hóspede
  const Q = ['Tem vaga de 5 a 8', 'de novembro?'];
  const BAL = { w: 780, h: 236, r: 46, fs: 56 };
  // balão centrado em (cx, cy); typing: 0..1 (reticências da pousada); status: 0..1
  function guestBalloon(c, t, cx, cy, s, a, typing = 0, status = 1) {
    if (a <= 0.003 || s <= 0.01) return;
    const { w, h, r, fs } = BAL, x = -w / 2, y = -h / 2;
    c.save(); c.globalAlpha *= a; c.translate(cx, cy); c.scale(s, s);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 44; c.shadowOffsetY = 16;
    rrect(c, x, y, w, h, r); c.fillStyle = C.bubble; c.fill();
    c.beginPath(); c.moveTo(x + w - 64, y + h - 1); c.lineTo(x + w + 20, y + h + 26); c.lineTo(x + w - 14, y + h - 40); c.closePath(); c.fill();   // biquinho: mensagem enviada
    c.restore();
    Q.forEach((ln, k) => text(c, ln, x + 50, y + 98 + k * 72, { size: fs, weight: 600, color: C.ink }));
    if (status > 0.01) {                              // ✓✓ entregue (cinza)
      const sw = measure('entregue', TEXT, 30, 500);
      c.save(); c.globalAlpha *= status;
      icon(c, 'checks', x + w - sw - 40, y + h + 54, 40, C.gray, 0.1);
      text(c, 'entregue', x + w, y + h + 64, { size: 30, weight: 500, color: C.gray, align: 'right' });
      c.restore();
    }
    if (typing > 0.01) {                              // "…": a pousada começa a responder e para
      const tx = x - 6, ty = y + h + 104, tw = 170, th = 88;
      c.save(); c.globalAlpha *= clamp(typing); c.translate(tx + tw / 2, ty + th / 2); c.scale(lerp(0.6, 1, clamp(typing)), lerp(0.6, 1, clamp(typing))); c.translate(-(tx + tw / 2), -(ty + th / 2));
      rrect(c, tx, ty, tw, th, 44); c.fillStyle = '#1C2222'; c.fill();
      for (let k = 0; k < 3; k++) {
        const j = Math.max(0, Math.sin(t * 9 - k * 0.9));
        c.beginPath(); c.arc(tx + 50 + k * 35, ty + th / 2 - j * 8, 9, 0, TAU); c.fillStyle = rgba(C.white, 0.45 + 0.4 * j); c.fill();
      }
      c.restore();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- 2 · a rotina em volta do balão
  const ROT = [['cafe', 'café da manhã'], ['checkin', 'check-in'], ['limpeza', 'limpeza'], ['chaves', 'chaves']];
  const ORB = { x: W / 2, y: 990, rx: 290, ry: 330 };
  function routine(c, t) {
    const out = E.inCubic(prog(t, T.site - 0.3, T.site + 0.1));
    if (t < ICON_T[0] - 0.05 || out >= 1) return;
    ROT.forEach(([kind, label], k) => {
      const p = E.outBack(prog(t, ICON_T[k], ICON_T[k] + 0.4), 1.7);
      if (p <= 0) return;
      const ang = -2.36 + k * (TAU / 4) + 0.07 * Math.sin(t * 0.8 + k * 1.7);       // balançam em volta do balão
      const rr = 1 + out * 0.9;
      const x = ORB.x + Math.cos(ang) * ORB.rx * rr, y = ORB.y + Math.sin(ang) * ORB.ry * rr + Math.sin(t * 1.6 + k) * 6;
      c.save(); c.globalAlpha *= clamp(p) * (1 - out); c.translate(x, y); c.scale(p, p);
      glow(c, 0, 0, 120, 0.12 * kick(t, ICON_T[k], 0.6));
      c.beginPath(); c.arc(0, 0, 66, 0, TAU); c.fillStyle = '#121515'; c.fill(); c.lineWidth = 3; c.strokeStyle = C.lime; c.stroke();
      routineIcon(c, kind, 0, 2, 80);
      text(c, label, 0, 112, { size: 30, weight: 600, color: C.white, align: 'center' });
      c.restore();
    });
  }

  // ---------------------------------------------------------------- celular (660 px) e site genérico
  const BZ = 16, PW = 660, PHH = 1350, PR = 84;
  const PX = W / 2 - PW / 2, PY = 470;                // x 210–870: fora da coluna da direita (x 950–1080)
  const SW = PW - 2 * BZ, SH = PHH - 2 * BZ, SRD = PR - BZ;
  const SCR = { x: PX + BZ, y: PY + BZ };
  const SB = 52;                                      // barra de status
  const WEB = { x: SCR.x, y: SCR.y + SB, w: SW, h: SH - SB };
  const SX = WEB.x + 16, SWD = SW - 32;               // coluna do site (596 px)
  const CORTE_Y = 1560;                               // rodapé seguro: nada abaixo daqui
  // desenha num layer e apaga a parte de baixo (degradê em y 1516–1560; nada abaixo de 1560)
  let LAYER = null;
  function faded(c, draw) {
    if (!LAYER) { LAYER = document.createElement('canvas'); LAYER.width = W; LAYER.height = H; }
    const g = LAYER.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.clearRect(0, 0, W, H);
    g.setTransform(c.getTransform());
    g.save(); draw(g); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-out';
    const gr = g.createLinearGradient(0, CORTE_Y - 44, 0, CORTE_Y);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gr; g.fillRect(0, CORTE_Y - 44, W, 44); g.fillStyle = '#000'; g.fillRect(0, CORTE_Y, W, H - CORTE_Y);
    g.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(LAYER, 0, 0); c.restore();
  }
  function phone(c, inner) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.65)'; c.shadowBlur = 70; c.shadowOffsetY = 30;
    rrect(c, PX, PY, PW, PHH, PR); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, PX, PY, PW, PHH, PR); c.lineWidth = 3; c.strokeStyle = '#30363A'; c.stroke();
    c.fillStyle = '#1A1E20'; c.fillRect(PX - 3, PY + 240, 4, 90); c.fillRect(PX - 3, PY + 350, 4, 90); c.fillRect(PX + PW - 1, PY + 300, 4, 140);
    c.save(); rrect(c, SCR.x, SCR.y, SW, SH, SRD); c.clip();
    c.fillStyle = '#070808'; c.fillRect(SCR.x, SCR.y, SW, SH);
    inner(c);
    c.restore();
    icon(c, 'signal', SCR.x + SW - 112, SCR.y + 27, 26, '#F2F4F3'); icon(c, 'battery', SCR.x + SW - 58, SCR.y + 27, 34, '#F2F4F3', 0.07);
    rrect(c, W / 2 - 66, SCR.y + 11, 132, 34, 17); c.fillStyle = '#000'; c.fill();
  }
  // o formulário de consulta do site genérico
  const FORM = { x: SX, y: 864, w: SWD, h: 466 };
  const FIELDS = [
    { k: 0, x: SX + 20, y: 940, w: 270, label: 'Entrada', value: '05/11/2026', cal: true },
    { k: 0, x: SX + 306, y: 940, w: 270, label: 'Saída', value: '08/11/2026', cal: true },
    { k: 1, x: SX + 20, y: 1036, w: 270, label: 'Adultos', value: '2' },
    { k: 1, x: SX + 306, y: 1036, w: 270, label: 'Crianças', value: '1' },
    { k: 2, x: SX + 20, y: 1132, w: 556, label: 'Acomodação', value: ACOMOD, sel: true },
  ];
  const BTN = { x: SX + 20, y: 1230, w: 556, h: 78 };
  function siteScreen(c, t) {
    c.fillStyle = '#080A0A'; c.fillRect(SCR.x, SCR.y, SW, SH);
    fillR(c, SX, WEB.y + 10, SWD, 42, 21, '#1A1F1F');
    icon(c, 'lock', SX + 28, WEB.y + 31, 24, C.muted, 0.09); fillR(c, SX + 50, WEB.y + 26, 170, 10, 5, C.bar);
    const hy = WEB.y + 94;
    c.beginPath(); c.arc(SX + 26, hy, 24, 0, TAU); c.fillStyle = C.lime; c.fill();
    fillR(c, SX + 64, hy - 16, 190, 14, 7, '#DCE2E2'); fillR(c, SX + 64, hy + 6, 120, 10, 5, C.bar2);
    icon(c, 'menu', SX + SWD - 26, hy, 34, C.soft, 0.1);
    photo(c, 'room', SX, 676, SWD, 170);
    const lit = kick(t, T.site + 0.5, 0.8);           // o balão acabou de virar o formulário
    c.save(); if (lit > 0.02) { c.shadowColor = C.lime; c.shadowBlur = 40 * lit; }
    fillR(c, FORM.x, FORM.y, FORM.w, FORM.h, 26, C.card); c.restore();
    if (lit > 0.02) strokeR(c, FORM.x, FORM.y, FORM.w, FORM.h, 26, rgba(C.lime, lit), 3);
    text(c, 'Consulte sua estadia', FORM.x + 24, FORM.y + 52, { size: 30, weight: 700, color: C.white });
    FIELDS.forEach((f) => {
      const p = E.outBack(prog(t, FILL_T[f.k], FILL_T[f.k] + 0.35), 1.6), on = t >= FILL_T[f.k];
      fillR(c, f.x, f.y, f.w, 82, 14, C.card2);
      strokeR(c, f.x, f.y, f.w, 82, 14, on ? rgba(C.lime, 0.85) : C.line, 2);
      text(c, f.label, f.x + 18, f.y + 30, { size: 20, weight: 500, color: C.muted });
      if (f.cal) icon(c, 'cal', f.x + f.w - 30, f.y + 30, 26, on ? C.lime : C.muted, 0.08);
      if (f.sel) routineIcon(c, 'chevron', f.x + f.w - 30, f.y + 44, 34, C.soft);
      if (p > 0) {
        c.save(); c.globalAlpha *= clamp(p); const vy = f.y + 66 + (1 - clamp(p)) * 10;
        text(c, f.value, f.x + 18, vy, { size: 27, weight: 600, color: C.white });
        c.restore();
      } else fillR(c, f.x + 18, f.y + 52, f.sel ? 160 : 90, 10, 5, C.bar);
    });
    const press = 1 - 0.04 * kick(t, ENVIAR, 0.3);
    c.save(); c.translate(BTN.x + BTN.w / 2, BTN.y + BTN.h / 2); c.scale(press, press); c.translate(-(BTN.x + BTN.w / 2), -(BTN.y + BTN.h / 2));
    fillR(c, BTN.x, BTN.y, BTN.w, BTN.h, 20, C.lime);
    const bl = 'Enviar consulta', bw = measure(bl, TEXT, 28, 700);
    icon(c, 'chat', BTN.x + BTN.w / 2 - bw / 2 - 26, BTN.y + BTN.h / 2, 40, C.ink, 0.1);
    text(c, bl, BTN.x + BTN.w / 2 - bw / 2 + 4, BTN.y + BTN.h / 2 + 10, { size: 28, weight: 700, color: C.ink });
    c.restore();
  }
  // a conversa recriada (o WhatsApp da pousada): genérica, sem número, sem logo
  function avatar(c, x, y, r) {
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#2A3236'; c.fill(); c.clip();
    c.fillStyle = '#8A9292'; c.beginPath(); c.arc(x, y - r * 0.18, r * 0.36, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x, y + r * 0.78, r * 0.66, r * 0.5, 0, 0, TAU); c.fill();
    c.restore();
  }
  const MSG = [`Entrada: 05/11/2026`, `Saída: 08/11/2026`, `Hóspedes: 2 adultos · 1 criança`, `Acomodação: ${ACOMOD}`];
  const BUB = { x: SX, y: WEB.y + 140, w: 568, h: 318 };
  function chatScreen(c, t) {
    c.fillStyle = '#0A0D0E'; c.fillRect(SCR.x, SCR.y, SW, SH);
    const hy = WEB.y;
    c.fillStyle = '#131819'; c.fillRect(SCR.x, SCR.y, SW, SB + 100);
    icon(c, 'back', SX + 16, hy + 50, 40, C.soft, 0.11);
    avatar(c, SX + 82, hy + 50, 32);
    fillR(c, SX + 130, hy + 32, 210, 16, 8, '#DCE2E2'); fillR(c, SX + 130, hy + 60, 130, 11, 5.5, C.bar2);
    const p = E.outBack(prog(t, CHEGA, CHEGA + 0.35), 1.5);
    if (p > 0) {
      const { x, y, w, h } = BUB;
      c.save(); c.globalAlpha *= clamp(p * 1.5); c.translate(x, y); c.scale(p, p); c.translate(-x, -y);
      fillR(c, x, y, w, h, 28, '#1B2224');
      c.beginPath(); c.moveTo(x, y + 22); c.lineTo(x - 12, y + 4); c.lineTo(x + 26, y); c.closePath(); c.fillStyle = '#1B2224'; c.fill();
      icon(c, 'globe', x + 42, y + 46, 34, C.lime, 0.09);
      text(c, 'Consulta pelo site', x + 70, y + 56, { size: 28, weight: 700, color: C.white });
      MSG.forEach((ln, k) => text(c, ln, x + 30, y + 118 + k * 50, { size: 27, weight: 500, color: C.soft }));
      c.restore();
    }
    const iy = 1422;
    fillR(c, SX, iy, SWD - 86, 70, 35, '#1B2224'); fillR(c, SX + 28, iy + 30, 140, 11, 5.5, C.bar);
    c.beginPath(); c.arc(SX + SWD - 35, iy + 35, 35, 0, TAU); c.fillStyle = C.lime; c.fill();
    icon(c, 'send', SX + SWD - 33, iy + 35, 34, C.ink, 0.09);
  }
  // posição do celular: sobe com o site (8,85–9,45) e desce quando o Hospeda entra (15,0–15,45)
  const phoneY = (t) => (1 - E.outCubic(prog(t, 8.85, 9.45))) * 1300 + E.inCubic(prog(t, T.hospeda, T.hospeda + 0.45)) * 900
    + (Math.sin(t * 0.9) * 4 + Math.sin(t * 0.37 + 1) * 3) * prog(t, 9.5, 10.2);   // respira devagar: a imagem nunca congela
  const phoneA = (t) => 1 - prog(t, T.hospeda, T.hospeda + 0.3);
  const chatK = (t) => E.inOutCubic(prog(t, ENVIAR + 0.15, ENVIAR + 0.5));
  function phoneScreen(c, t) {
    const k = chatK(t);
    if (k < 1) { c.save(); c.translate(-k * SW * 0.4, 0); c.globalAlpha *= 1 - k; siteScreen(c, t); c.restore(); }
    if (k > 0) { c.save(); c.translate((1 - k) * SW * 0.6, 0); chatScreen(c, t); c.restore(); }
  }

  // ---------------------------------------------------------------- 4–5 · os recortes do Hospeda
  // cada recorte vira um cartão (o fundo claro do próprio app), ~1,4x a tela do celular; o 05 sem zoom (1x)
  const FR = {
    painel: { key: '01-painel', w: 880, x: 100, y: 470, full: true, t0: T.hospeda + 0.05, t1: b(27) },
    antes: { key: '02-calendario-antes', w: 880, x: 100, y: 470, vh: 1070, t0: b(27), t1: b(33), scroll: [b(29), b(29) + 0.5, 0, 'fim'], chip: 'Calendário de ocupação' },
    etapa: { key: '03-etapa4', sx: [96, 1194], w: 920, x: 80, y: 700, full: true, t0: b(33), t1: b(38), chip: 'Nova reserva' },
    revisao: { key: '04-revisao', w: 880, x: 100, y: 470, vh: 1070, t0: b(38), t1: T.ciclo, scroll: [b(38) + 0.25, b(38) + 0.6, 0, 'fim'], chip: 'Nova reserva' },
    detalhes: { key: '05-detalhes', w: SW, x: SCR.x, y: 640, full: true, t0: T.ciclo, t1: b(48), chip: 'Detalhes da reserva' },   // sem zoom: a largura da tela do celular
    ciclo: { key: '02-calendario-antes', key2: '06-calendario-depois', fit: 1070, y: 470, vh: 1070, t0: b(48), t1: T.cta - 0.15, chip: 'Calendário de ocupação' },
  };
  // medidas que dependem do recorte (altura de cada print): definidas no setup
  function layoutFrames() {
    Object.values(FR).forEach((fr) => {
      const img = IMG[fr.key];
      fr.ok = !!img;
      if (!img) { fr.vh = fr.vh || 600; if (fr.scroll) fr.scroll[3] = 0; return; }
      fr.sx = fr.sx || [0, img.width];
      if (fr.w) fr.s = fr.w / (fr.sx[1] - fr.sx[0]);
      if (fr.fit) { fr.s = fr.fit / img.height; fr.x = (W - img.width * fr.s) / 2; }
      if (fr.full) fr.vh = img.height * fr.s;
      if (fr.scroll) fr.scroll[3] = Math.max(0, img.height - fr.vh / fr.s);
    });
  }
  function frState(fr, t) {
    // o próximo cartão entra opaco, de baixo, por cima do anterior (que recua e se apaga por trás)
    const a = clamp(prog(t, fr.t0, fr.t0 + 0.08)) * (1 - prog(t, fr.t1, fr.t1 + 0.3));
    const dy = (1 - E.outCubic(prog(t, fr.t0, fr.t0 + 0.42))) * 320 - E.inCubic(prog(t, fr.t1, fr.t1 + 0.3)) * 80;
    const z = 1 + 0.014 * prog(t, fr.t0, fr.t1 + 0.3);          // aproximação lenta: a imagem nunca congela
    const sc = fr.scroll ? lerp(fr.scroll[2], fr.scroll[3], E.inOutCubic(prog(t, fr.scroll[0], fr.scroll[1]))) : 0;
    const sx = fr.sx || [0, 1290];
    return { a, dy, z, sc, sx, w: (sx[1] - sx[0]) * fr.s };
  }
  // ponto do recorte (px do print) -> quadro
  function frMap(fr, st, px, py) {
    const cx = fr.x + st.w / 2, cy = fr.y + fr.vh / 2 + st.dy;
    const x = fr.x + (px - st.sx[0]) * fr.s, y = fr.y + (py - st.sc) * fr.s + st.dy;
    return { x: cx + (x - cx) * st.z, y: cy + (y - cy) * st.z };
  }
  function drawFrag(c, fr, t) {
    const st = frState(fr, t);
    if (st.a <= 0.002) return;
    const img = IMG[fr.key];
    if (!img || !fr.ok) return;
    c.save(); c.globalAlpha *= st.a;
    const cx = fr.x + st.w / 2, cy = fr.y + fr.vh / 2 + st.dy;
    c.translate(cx, cy); c.scale(st.z, st.z); c.translate(-cx, -cy + st.dy);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 50; c.shadowOffsetY = 18;
    rrect(c, fr.x, fr.y, st.w, fr.vh, 34); c.fillStyle = '#F8F8F8'; c.fill(); c.restore();
    c.save(); rrect(c, fr.x, fr.y, st.w, fr.vh, 34); c.clip();
    c.drawImage(img, st.sx[0], 0, st.sx[1] - st.sx[0], img.height, fr.x, fr.y - st.sc * fr.s, st.w, img.height * fr.s);
    if (fr.key2 && IMG[fr.key2]) {                    // depois: revelado pelo fio, da esquerda para a direita
      const wx = lerp(fr.x - 20, fr.x + st.w + 20, E.inOutSine(prog(t, VIRA, VIRA + 0.5)));
      if (wx > fr.x) { c.save(); c.beginPath(); c.rect(fr.x, fr.y, wx - fr.x, fr.vh); c.clip(); c.drawImage(IMG[fr.key2], fr.x, fr.y - st.sc * fr.s, st.w, IMG[fr.key2].height * fr.s); c.restore(); }
      const wp = prog(t, VIRA, VIRA + 0.5);
      if (wp > 0 && wp < 1) {                       // a faixa lima da troca antes -> depois
        const band = c.createLinearGradient(wx - 150, 0, wx + 10, 0);
        band.addColorStop(0, rgba(C.lime, 0)); band.addColorStop(0.8, rgba(C.lime, 0.45)); band.addColorStop(1, rgba(C.lime, 0.95));
        c.fillStyle = band; c.fillRect(wx - 150, fr.y, 160, fr.vh);
      }
    }
    c.restore();
    if (fr.chip) {                                    // o título da tela no app, como etiqueta
      const cw = measure(fr.chip, TEXT, 24, 600) + 64;
      fillR(c, fr.x + 22, fr.y - 24, cw, 48, 24, '#1A1E20');
      c.beginPath(); c.arc(fr.x + 46, fr.y, 7, 0, TAU); c.fillStyle = C.lime; c.fill();
      text(c, fr.chip, fr.x + 64, fr.y + 9, { size: 24, weight: 600, color: C.white });
    }
    c.restore();
  }

  // ---------------------------------------------------------------- o fio
  // cada passo: um contorno (rect no quadro, no instante t) percorrido de t0 a t1; o contorno fica
  // enquanto a sua tela estiver à vista. Entre um passo e outro, a cabeça viaja (no máximo 0,5 s).
  const phoneRect = (x, y, w, h) => (t) => ({ x, y: y + phoneY(t), w, h, a: phoneA(t), clip: { x: SCR.x, y: SCR.y + phoneY(t), w: SW, h: SH } });
  const frRect = (name, x0, y0, x1, y1, pad = 8) => (t) => {
    const fr = FR[name], st = frState(fr, t), p0 = frMap(fr, st, x0, y0), p1 = frMap(fr, st, x1, y1);
    const v0 = frMap(fr, st, st.sx[0], st.sc), v1 = frMap(fr, st, st.sx[1], st.sc + fr.vh / fr.s);
    const a = (fr.ok ? st.a : 0) * (1 - prog(t, fr.t1, fr.t1 + 0.08));   // some assim que o próximo cartão entra por cima
    return { x: p0.x - pad, y: p0.y - pad, w: p1.x - p0.x + 2 * pad, h: p1.y - p0.y + 2 * pad, a, clip: { x: v0.x, y: v0.y, w: v1.x - v0.x, h: v1.y - v0.y } };
  };
  const FIO = [
    { t0: ENVIAR + 0.02, t1: ENVIAR + 0.3, r: 26, rect: (t) => { const r = phoneRect(BTN.x - 8, BTN.y - 8, BTN.w + 16, BTN.h + 16)(t); r.a *= 1 - chatK(t); return r; } },
    { t0: CHEGA + 0.05, t1: CHEGA + 0.5, r: 34, until: T.hospeda, rect: phoneRect(BUB.x - 10, BUB.y - 10, BUB.w + 20, BUB.h + 20) },
    { t0: T.hospeda + 0.45, t1: T.hospeda + 0.8, r: 30, rect: frRect('painel', 36, 36, 469, 108, 10) },
    { t0: 16.75, t1: 17.15, r: 16, until: 17.4, rect: frRect('antes', 124, 252, 540, 310, 8) },
    { t0: 18.0, t1: 18.35, r: 16, rect: frRect('antes', 728, 1455, 1237, 1729, 4) },
    { t0: 18.38, t1: 18.62, r: 16, rect: frRect('antes', 50, 1729, 219, 1950, 4) },
    { t0: 20.4, t1: 20.72, r: 22, rect: frRect('etapa', 110, 40, 1180, 230, 8) },
    { t0: 21.0, t1: 21.32, r: 22, rect: frRect('etapa', 110, 262, 1180, 455, 8) },
    { t0: 23.4, t1: 23.78, r: 26, rect: frRect('revisao', 83, 920, 775, 1111, 8) },
    { t0: CONFIRMA, t1: CONFIRMA + 0.3, r: 34, rect: frRect('revisao', 420, 1213, 776, 1282, 8) },
    { t0: 27.4, t1: 27.65, r: 18, rect: frRect('detalhes', 473, 23, 638, 53, 7) },          // selo CONFIRMADA
    { t0: 27.85, t1: 28.15, r: 14, rect: frRect('detalhes', 362, 575, 590, 642, 6) },       // Origem / Canal: WhatsApp
    { t0: VIRA, t1: VIRA + 0.5, sweep: true, rect: frRect('ciclo', 0, 1592, 1290, 1594, 0) },
    { t0: 29.95, t1: 30.2, r: 14, rect: frRect('ciclo', 124, 252, 540, 310, 6) },           // 4 livre(s) no período
    { t0: 30.3, t1: 30.6, r: 14, rect: frRect('ciclo', 728, 1455, 1237, 1729, 4) },         // 5 chegada · 6 e 7 reservados
    { t0: 30.62, t1: 30.82, r: 14, rect: frRect('ciclo', 50, 1729, 219, 1950, 4) },         // 8 saída
  ];
  function rrPoly(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    const P = [], arc = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); P.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); } };
    P.push({ x: x + r, y }); P.push({ x: x + w - r, y }); arc(x + w - r, y + r, -Math.PI / 2);
    P.push({ x: x + w, y: y + h - r }); arc(x + w - r, y + h - r, 0);
    P.push({ x: x + r, y: y + h }); arc(x + r, y + h - r, Math.PI / 2);
    P.push({ x, y: y + r }); arc(x + r, y + r, Math.PI);
    return P;
  }
  function stepPoly(st, t) {
    const r = st.rect(t);
    const a = r.a * (st.until ? 1 - prog(t, st.until, st.until + 0.25) : 1);
    if (st.sweep) return { P: [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }], a, clip: r.clip };
    return { P: rrPoly(r.x, r.y, r.w, r.h, st.r), a, clip: r.clip };
  }
  function polyAt(P, f) {
    let L = 0; const seg = [];
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); seg.push(d); L += d; }
    let s = clamp(f) * L;
    for (let i = 1; i < P.length; i++) { if (s <= seg[i - 1] || i === P.length - 1) { const u = seg[i - 1] ? Math.min(1, s / seg[i - 1]) : 0; return { x: lerp(P[i - 1].x, P[i].x, u), y: lerp(P[i - 1].y, P[i].y, u) }; } s -= seg[i - 1]; }
    return P[0];
  }
  // o fio no CTA: passa por baixo das duas logos, com um laço entre elas
  const LINK = { y: 975, t0: T.cta + 0.4, t1: T.cta + 1.0 };
  function linkPoly() {
    const P = [{ x: 96, y: LINK.y }];
    for (let k = 0; k <= 24; k++) { const a = Math.PI / 2 - (k / 24) * TAU; P.push({ x: 540 + Math.cos(a) * 34, y: LINK.y - 34 + Math.sin(a) * 34 }); }
    P.push({ x: 984, y: LINK.y });
    return P;
  }
  // posição da cabeça do fio no instante t (null antes de nascer)
  function headAt(t) {
    if (t < FIO[0].t0) return null;
    for (let i = 0; i < FIO.length; i++) {
      const st = FIO[i], nx = FIO[i + 1];
      if (t <= st.t1) return t >= st.t0 ? polyAt(stepPoly(st, t).P, (t - st.t0) / (st.t1 - st.t0)) : null;
      const endP = (tt) => (st.sweep ? polyAt(stepPoly(st, tt).P, 1) : stepPoly(st, tt).P[0]);
      const nextT0 = nx ? nx.t0 : LINK.t0;
      if (t < nextT0) {
        const dep = Math.max(st.t1, nextT0 - 0.5), a = endP(t);
        if (t < dep) return a;
        const bP = nx ? stepPoly(nx, t).P[0] : linkPoly()[0];
        const u = E.inOutCubic((t - dep) / (nextT0 - dep)), mx = (a.x + bP.x) / 2, my = (a.y + bP.y) / 2;
        const dx = bP.x - a.x, dy = bP.y - a.y, bend = 0.22;
        const cx = mx - dy * bend, cy = my + dx * bend;
        return { x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * cx + u * u * bP.x, y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * cy + u * u * bP.y };
      }
    }
    if (t <= LINK.t1) return polyAt(linkPoly(), (t - LINK.t0) / (LINK.t1 - LINK.t0));
    return polyAt(linkPoly(), 1);
  }
  function strokePoly(c, P, f) {
    if (f <= 0) return;
    let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
    let left = clamp(f) * L;
    c.beginPath(); c.moveTo(P[0].x, P[0].y);
    for (let i = 1; i < P.length && left > 0; i++) {
      const d = Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y), u = Math.min(1, left / d);
      c.lineTo(lerp(P[i - 1].x, P[i].x, u), lerp(P[i - 1].y, P[i].y, u)); left -= d;
    }
    c.stroke();
  }
  function drawFio(c, t) {
    if (t < FIO[0].t0) return;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = C.lime; c.shadowColor = C.lime;
    // os contornos que ficam
    FIO.forEach((st) => {
      if (st.sweep || t < st.t0) return;
      const { P, a, clip } = stepPoly(st, t);
      if (a <= 0.01) return;
      c.save(); c.globalAlpha *= a;
      if (clip) { c.beginPath(); c.rect(clip.x - 12, clip.y - 12, clip.w + 24, clip.h + 24); c.clip(); } c.lineWidth = 5; c.shadowBlur = 14 + 16 * kick(t, st.t1, 0.5);
      strokePoly(c, P, (t - st.t0) / (st.t1 - st.t0)); c.restore();
    });
    if (t >= LINK.t0) { c.save(); c.lineWidth = 6; c.shadowBlur = 16; strokePoly(c, linkPoly(), (t - LINK.t0) / (LINK.t1 - LINK.t0)); c.restore(); }
    // o rastro e a cabeça
    const N = 26, pts = [];
    for (let k = 0; k <= N; k++) { const p = headAt(t - k * 0.011); if (p) pts.push(p); }
    for (let k = 1; k < pts.length; k++) {
      c.globalAlpha = 1 - k / N; c.lineWidth = 7 * (1 - k / N) + 1.5; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(pts[k - 1].x, pts[k - 1].y); c.lineTo(pts[k].x, pts[k].y); c.stroke();
    }
    const h = pts[0];
    if (h) {
      c.globalAlpha = 1;
      glow(c, h.x, h.y, 46, 0.5);
      c.shadowBlur = 20; c.beginPath(); c.arc(h.x, h.y, 9 + 1.5 * Math.sin(t * 9), 0, TAU); c.fillStyle = C.lime; c.fill();
      c.shadowBlur = 0; c.beginPath(); c.arc(h.x, h.y, 4, 0, TAU); c.fillStyle = '#F4FFD6'; c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- toques (o dedo da pousada / do hóspede)
  function touchDot(c, t, t0, x, y, fromX = 120, fromY = 240) {
    const a = prog(t, t0 - 0.45, t0 - 0.25) * (1 - prog(t, t0 + 0.2, t0 + 0.45));
    if (a <= 0.01) return;
    const ap = E.outCubic(prog(t, t0 - 0.45, t0)), px = lerp(x + fromX, x, ap), py = lerp(y + fromY, y, ap), r = 36 * (1 - 0.18 * kick(t, t0, 0.25));
    c.save(); c.globalAlpha *= a;
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    const rp = prog(t, t0, t0 + 0.45);
    if (rp > 0 && rp < 1) { c.beginPath(); c.arc(px, py, r + 54 * E.outCubic(rp), 0, TAU); c.globalAlpha *= 1 - rp; c.strokeStyle = C.white; c.stroke(); }
    c.restore();
  }

  // ---------------------------------------------------------------- 6 · CTA: as duas marcas ligadas pelo fio
  // ---------------------------------------------------------------- logo oficial (SVG do kit, montada pelas formas)
  let LOGO = null;
  function loadLogo() {
    const x = new XMLHttpRequest(); x.open('GET', '/brand/logo/kit/FAZLO-DIGITAL-branca-transparente.svg', false); x.send();
    const doc = new DOMParser().parseFromString(x.responseText, 'image/svg+xml');
    const vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    const paths = [...doc.querySelectorAll('path')].map((p) => ({ fill: p.getAttribute('fill'), d: p.getAttribute('d') }));
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
    if (ps > 0) { c.save(); c.beginPath(); const yb = 124 - (124 - 26) * ps; c.rect(200, yb, 160, 130); c.clip(); c.fillStyle = LOGO.slash.fill; c.fill(LOGO.slash.path, 'evenodd'); c.restore(); }
    const pd = prog(t, t0 + 0.45, t0 + 0.85);
    if (pd > 0) { c.save(); c.globalAlpha *= pd; c.translate((1 - E.outCubic(pd)) * 30, 0); c.fillStyle = LOGO.digital.fill; c.fill(LOGO.digital.path, 'evenodd'); c.restore(); }
    c.restore();
  }
  const SK = 0.966;                                   // inclinação da barra da logo
  function cta(c, t) {
    const wp = prog(t, T.cta - 0.12, T.cta + 0.4);     // "o corte": a barra lima varre na diagonal
    if (wp > 0 && wp < 1) {
      const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wp)), bw = 120;
      c.beginPath(); c.moveTo(x0 + SK * 1200 - bw / 2, -200); c.lineTo(x0 + SK * 1200 + bw / 2, -200); c.lineTo(x0 - SK * 1200 + bw / 2, 2200); c.lineTo(x0 - SK * 1200 - bw / 2, 2200); c.closePath();
      c.fillStyle = C.lime; c.fill();
    }
    if (t < T.cta - 0.1) return;
    const gp = prog(t, T.cta, T.cta + 1.0);
    glow(c, 540, 900, 560, 0.09 * gp + 0.03 * Math.sin(t * 3) * gp);
    drawLogo(c, 292, 880, 400, t, T.cta + 0.02);
    const hp = E.outBack(prog(t, T.cta + 0.25, T.cta + 0.6), 1.5);   // FAZLO HOSPEDA (provisória: a marca do app)
    const pill = IMG['hospeda-pilula'];
    if (hp > 0 && pill) {
      const w = 392, h = w * pill.height / pill.width;
      c.save(); c.globalAlpha *= clamp(hp); c.translate(786, 880); c.scale(hp, hp);
      c.drawImage(pill, -w / 2, -h / 2, w, h); c.restore();
    }
    const s1 = E.outCubic(prog(t, T.cta + 0.9, T.cta + 1.3)), s2 = E.outCubic(prog(t, T.cta + 1.1, T.cta + 1.5));
    text(c, 'Site para ser encontrada.', W / 2, 1100 + (1 - s1) * 24, { size: 40, weight: 500, color: C.soft, align: 'center', alpha: s1 });
    text(c, 'Sistema para se organizar.', W / 2, 1156 + (1 - s2) * 24, { size: 40, weight: 500, color: C.soft, align: 'center', alpha: s2 });
    const s3 = E.outBack(prog(t, T.cta + 1.6, T.cta + 2.0), 1.6);
    if (s3 > 0) {
      const lbl = 'Fale com a FAZLO · link na bio', fw = measure(lbl, TEXT, 34, 600) + 120;
      c.save(); c.translate(W / 2, 1282); c.scale(s3, s3);
      rrect(c, -fw / 2, -38, fw, 76, 38); c.fillStyle = C.lime; c.fill();
      text(c, lbl, -fw / 2 + 40, 12, { size: 34, weight: 600, color: C.ink });
      icon(c, 'arrow', fw / 2 - 44, -2 - 4 * Math.sin(t * 6), 34, C.ink, 0.12);
      c.restore();
    }
    const fl = kick(t, T.cta, 0.3);
    if (fl > 0.01) { c.fillStyle = rgba(C.lime, 0.16 * fl); c.fillRect(0, 0, W, H); }
  }

  // ---------------------------------------------------------------- textos
  const L_HOOK = ['MANDOU', 'MENSAGEM E', 'NINGUÉM', 'RESPONDEU.'];
  const L_ROTINA = ['NÃO É DESCASO.', 'É A ROTINA', 'DA POUSADA.'];
  const L_SITE = ['O SITE ORGANIZA', 'A PERGUNTA.'];
  const L_LIVRE = ['A POUSADA VÊ', 'NA HORA O QUE', 'ESTÁ LIVRE.'];
  const L_LANCA = ['E LANÇA A RESERVA', 'NO SISTEMA.'];
  const L_CICLO = ['DA MENSAGEM À RESERVA,', 'SEM PERDER NADA.'];
  let SZ = {};

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);

    // ===== 1 e 2 · o balão do hóspede, esperando
    const hz = 1 + 0.04 * E.inOutSine(prog(t, 0.2, T.rotina));                      // aproximação lenta no gancho
    const mv = E.inOutCubic(prog(t, T.rotina, T.rotina + 0.5));                       // vai para o centro da rotina
    const fly = E.inOutCubic(prog(t, T.site + 0.05, T.site + 0.55));                  // e voa para dentro do site
    const bx = W / 2, by = lerp(lerp(SZ.balY, ORB.y, mv), FORM.y + FORM.h / 2 + phoneY(t), fly);
    const bs = lerp(lerp(hz, 0.55, mv), 0.22, fly), ba = (1 - 0.12 * mv) * (1 - prog(t, T.site + 0.3, T.site + 0.55));
    const typing = prog(t, 1.2, 1.45) * (1 - prog(t, 2.55, 2.8));
    if (t < T.site + 0.6) guestBalloon(c, t, bx, by, bs, ba, typing, 1 - prog(t, T.site, T.site + 0.2));
    c.save(); c.translate(W / 2, 520); c.scale(hz, hz); c.translate(-W / 2, -520);
    titleBlock(c, L_HOOK, t, -0.32, 3.95, { size: SZ.hook, y: SZ.hookY, lh: 1.06, lime: ['NINGUÉM', 'RESPONDEU.'] });
    c.restore();
    routine(c, t);
    titleBlock(c, L_ROTINA, t, 6.0, 8.75, { size: SZ.rotina, y: SZ.rotinaY, lime: ['ROTINA'] });

    // ===== 3 · o site organiza a pergunta (celular) · 4 e 5 · os recortes do Hospeda (somem antes de y 1560)
    const pa = phoneA(t);
    if (t > 8.8 && pa > 0.002) {
      faded(c, (g) => { g.globalAlpha *= pa; g.translate(0, phoneY(t)); phone(g, (cc) => phoneScreen(cc, t)); });
    }
    if (t >= T.site && t < T.site + 0.6) guestBalloon(c, t, bx, by, bs, ba, 0, 1 - prog(t, T.site, T.site + 0.2));   // entrando no formulário
    if (t > T.hospeda) faded(c, (g) => Object.values(FR).forEach((fr) => drawFrag(g, fr, t)));
    touchDot(c, t, ENVIAR, BTN.x + BTN.w * 0.72, BTN.y + BTN.h / 2 + phoneY(t));
    const cb = frRect('revisao', 420, 1213, 776, 1282, 0)(t);
    if (FR.revisao.ok) touchDot(c, t, CONFIRMA, cb.x + cb.w * 0.62, cb.y + cb.h / 2);
    drawFio(c, t);
    titleBlock(c, L_SITE, t, CHEGA, 14.75, { size: SZ.site, y: SZ.siteY, lime: ['ORGANIZA'] });
    titleBlock(c, L_LIVRE, t, 16.8, 19.55, { size: SZ.livre, y: SZ.livreY, lime: ['LIVRE.'] });
    titleBlock(c, L_LANCA, t, 23.4, 26.75, { size: SZ.lanca, y: SZ.lancaY, lime: ['RESERVA'] });
    titleBlock(c, L_CICLO, t, 28.2, 30.95, { size: SZ.ciclo, y: SZ.cicloY, lime: ['SEM', 'PERDER', 'NADA.'] });

    // ===== 6 · CTA
    cta(c, t);
  }

  // ---------------------------------------------------------------- pós: vinheta e grão leves
  let GRAIN, VIG;
  function post(ctx, t) {
    if (!GRAIN) {
      GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 384;
      const g = GRAIN.getContext('2d'), id = g.createImageData(384, 384), r = U.rng(4);
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
    id: 'mandou-mensagem',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: { default: [3, 1 / 120], ranges: [[T.site, T.site + 0.6, 5, 1 / 110], [T.cta - 0.3, T.cta + 0.2, 5, 1 / 110]] },
    setup(api) {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      IMG = api.assets || {};
      layoutFrames();
      loadLogo();
      const f = (L, max) => fit(L, DISPLAY, 900, 940, max, -0.02);
      const ty = (n, s) => 240 + (196 - (0.74 * s + 1.12 * s * (n - 1))) / 2 + 0.74 * s;   // títulos na faixa y 240–436
      SZ = { hook: f(L_HOOK, 88), rotina: f(L_ROTINA, 64), site: f(L_SITE, 84), livre: f(L_LIVRE, 64), lanca: f(L_LANCA, 84), ciclo: f(L_CICLO, 84) };
      SZ.hookY = 330 + 0.74 * SZ.hook;
      SZ.balY = SZ.hookY + 3 * 1.06 * SZ.hook + 70 + BAL.h / 2;
      SZ.rotinaY = ty(3, SZ.rotina); SZ.siteY = ty(2, SZ.site); SZ.livreY = ty(3, SZ.livre); SZ.lancaY = ty(2, SZ.lanca); SZ.cicloY = ty(2, SZ.ciclo);
    },
    frame,
    post,
    cover(ctx) {
      background(ctx, 20);
      glow(ctx, 540, 1100, 640, 0.07);
      drawLogo(ctx, 540, 352, 560, 99, 0);                           // logo no topo, centralizada
      const L = ['MANDOU', 'MENSAGEM E', 'NINGUÉM', 'RESPONDEU'], s = fit(L, DISPLAY, 900, 900, 112, -0.02), lh = s * 1.04;
      const y0 = 540 + 0.74 * s;
      L.forEach((ln, k) => text(ctx, ln, 540, y0 + k * lh, { fam: DISPLAY, size: s, weight: 900, color: k >= 2 ? C.lime : C.white, align: 'center', ls: -s * 0.02 }));
      const bs = 0.8;
      guestBalloon(ctx, 0.35, 560, y0 + 3 * lh + 64 + (BAL.h * bs) / 2, bs, 1, 1, 1);
    },
    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(0, 'title');
      cue(1.2, 'typing', { d: 1.4 });
      ICON_T.forEach((t, k) => cue(t, 'icon', { k }));
      cue(6.0, 'title');
      cue(8.85, 'rise', { d: 0.6 });
      cue(T.site + 0.05, 'fly', { d: 0.5 });
      FILL_T.forEach((t, k) => cue(t, 'fill', { k }));
      cue(ENVIAR, 'tap');
      cue(ENVIAR + 0.02, 'fio');
      cue(ENVIAR + 0.15, 'switch');
      cue(CHEGA, 'notif');
      cue(CHEGA, 'title');
      FIO.forEach((st, k) => { if (k >= 2 && !st.sweep && st.t0 !== CONFIRMA) cue(st.t0, 'wrap', { k }); });
      FIO.forEach((st, i) => {
        const nx = FIO[i + 1], n0 = nx ? nx.t0 : LINK.t0, dep = Math.max(st.t1, n0 - 0.5);
        if (n0 - dep > 0.15) cue(dep, 'travel', { d: +(n0 - dep).toFixed(3) });
      });
      Object.values(FR).forEach((fr) => cue(fr.t0, 'slide'));
      [16.8, 23.4, 28.2].forEach((t) => cue(t, 'title'));
      cue(FR.antes.scroll[0], 'scroll', { d: 0.5 }); cue(FR.revisao.scroll[0], 'scroll', { d: 0.35 });
      cue(CONFIRMA, 'confirm');
      cue(VIRA, 'vira', { d: 0.5 });
      cue(T.cta, 'logo');
      cue(LINK.t0, 'link', { d: +(LINK.t1 - LINK.t0).toFixed(3) });
      cue(T.cta + 1.6, 'cta');
    },
  });
})();
