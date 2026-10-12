/* =====================================================================
   FAZLO Digital — "Conheça o site da Pousada Vale dos Canteiros" — 9:16 (1080x1920, 60 fps), 35,4 s

   100% motion graphics. Gesto central: o TOQUE do hóspede, um círculo lima com
   centro branco que rola, toca e abre as telas reais do site (capturas autorizadas,
   src/assets/site/ + faixas do Reel do raio-x; sem a seção de depoimentos).

   100 BPM · 1 tempo = 0,6 s
     1 gancho       0,0–4,2   POUSADA DE FAMÍLIA / NA SERRA DA CANASTRA. -> (o corte) SITE NOVO / NO AR.
                              o celular sobe com o topo real do site (carrossel: foto 1 -> foto 2)
     2 a consulta   4,2–13,8  o toque rola até "Consulte sua estadia" e preenche o formulário real:
                              Entrada -> calendário do site -> próximo mês -> 5 -> 8 -> + criança ->
                              Acomodação -> Chalé de Pedra 6 -> pausa com tudo preenchido -> Enviar;
                              chat recriado (genérico) com a mensagem real montada pelo site -> enviada ✓
                              A CONSULTA CHEGA NO / WHATSAPP JÁ ORGANIZADA.
     3 chalés       13,8–19,8 rolagem pelos cartões até o Chalé de Pedra 6 -> "Ver detalhes" -> modal real;
                              Comodidades e Alimentação acendem. CADA CHALÉ COM / SEUS DETALHES.
     4 passeios     19,8–24,0 "Viver a Canastra": as distâncias reais acendem ao passar.
                              OS PASSEIOS QUE O / HÓSPEDE VEIO FAZER.
     5 day use      24,0–27,0 MENU -> "Reservar Day Use" -> modal real (10h às 17h · 04 cachoeiras · almoço).
                              ATÉ O DAY USE, COM / TUDO EXPLICADO.
     6 como chegar  27,0–30,0 "Onde estamos": 22 km · estrada de terra e o mapa real; o toque pousa no pino.
                              E COMO CHEGAR / ATÉ LÁ.
     7 assinatura   30,0–32,4 rolagem até o rodapé real; zoom em "Site por [FAZLO]"
     8 CTA          32,4–35,4 logo FAZLO DIGITAL (SVG do kit) · Sua pousada também pode ter o seu ·
                              Fale com a FAZLO · link na bio

   Fontes oficiais: Unbounded (títulos) e Sora (textos). Lima #C6FA41.
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
  const T = { gancho: 0, consulta: b(7), chales: b(23), viver: b(33), dayuse: b(40), chegar: b(45), assinatura: b(50), cta: b(54) };
  const DURATION = b(59);                            // 35,4 s
  const CORTE = b(4);                                // 2,4: SITE NOVO NO AR.
  // instantes dos toques (um por tempo; pausa de 2 tempos com o formulário completo antes de Enviar)
  const TP = {
    entrada: 4.8, proximo: 5.4, dia5: 6.0, dia8: 6.6, crianca: 7.2, acomod: 7.8, chale: 8.4, enviar: 10.2, send: 11.0,
    ver: 16.2, fora: 19.4, menu: 24.0, reservar: 24.6, fechar: 26.5,
  };

  // ---------------------------------------------------------------- cores e texto
  let DISPLAY, TEXT;
  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', card: '#0E1212', line: '#263030',
    muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C', dim: '#3A4444', site: '#F4F0E8', green: '#1C2E26',
  };
  const SK = 0.966;
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
        const lime = o.lime && o.lime.some((s) => w === s);
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
      case 'check': c.moveTo(-0.3, 0.02); c.lineTo(-0.08, 0.24); c.lineTo(0.32, -0.2); break;
      case 'cal': c.roundRect(-0.36, -0.32, 0.72, 0.66, 0.08); c.moveTo(-0.36, -0.12); c.lineTo(0.36, -0.12); c.moveTo(-0.16, -0.42); c.lineTo(-0.16, -0.24); c.moveTo(0.16, -0.42); c.lineTo(0.16, -0.24); break;
      case 'bed': c.moveTo(-0.4, 0.25); c.lineTo(-0.4, -0.25); c.moveTo(-0.4, 0.05); c.lineTo(0.4, 0.05); c.lineTo(0.4, 0.25); c.moveTo(-0.4, -0.05); c.lineTo(0.4, -0.05); c.moveTo(-0.32, -0.05); c.roundRect(-0.32, -0.2, 0.22, 0.15, 0.04); break;
      case 'people':
        c.moveTo(-0.02, -0.16); c.arc(-0.14, -0.16, 0.12, 0, TAU); c.moveTo(-0.4, 0.34); c.bezierCurveTo(-0.4, 0.06, -0.3, 0.02, -0.14, 0.02); c.bezierCurveTo(0.02, 0.02, 0.12, 0.06, 0.12, 0.34);
        c.moveTo(0.3, -0.12); c.arc(0.2, -0.12, 0.1, 0, TAU); c.moveTo(0.2, 0.06); c.bezierCurveTo(0.34, 0.06, 0.42, 0.12, 0.42, 0.34); break;
      case 'user':                                  // avatar genérico de contato (silhueta)
        c.arc(0, -0.15, 0.17, 0, TAU); c.moveTo(-0.33, 0.4); c.bezierCurveTo(-0.33, 0.1, -0.18, 0.06, 0, 0.06); c.bezierCurveTo(0.18, 0.06, 0.33, 0.1, 0.33, 0.4); c.closePath(); c.fill(); c.restore(); return;
      case 'send': c.moveTo(-0.32, -0.3); c.lineTo(0.36, 0); c.lineTo(-0.32, 0.3); c.lineTo(-0.2, 0); c.closePath(); c.fill(); break;
      case 'back': c.moveTo(0.12, -0.3); c.lineTo(-0.16, 0); c.lineTo(0.12, 0.3); break;
      case 'lock': c.roundRect(-0.26, -0.04, 0.52, 0.42, 0.06); c.moveTo(-0.16, -0.04); c.arc(0, -0.04, 0.16, Math.PI, 0); break;
      case 'arrow': c.moveTo(-0.34, 0); c.lineTo(0.3, 0); c.moveTo(0.06, -0.24); c.lineTo(0.3, 0); c.lineTo(0.06, 0.24); break;
      case 'signal': for (let k = 0; k < 4; k++) c.rect(-0.3 + k * 0.17, 0.2 - k * 0.13, 0.1, 0.13 + k * 0.13); c.fill(); c.restore(); return;
      case 'battery': c.roundRect(-0.4, -0.18, 0.72, 0.36, 0.08); c.stroke(); c.beginPath(); c.roundRect(-0.34, -0.12, 0.5, 0.24, 0.04); c.fill(); c.fillRect(0.34, -0.07, 0.06, 0.14); c.restore(); return;
      default: break;
    }
    c.stroke(); c.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function checkBadge(c, x, y, r, a = 1) {
    if (a <= 0.01 || r <= 0.3) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = C.lime; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    icon(c, 'check', x, y + r * 0.04, r * 1.6, C.ink, 0.13); c.restore();
  }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.005) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.055)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
  }

  // ---------------------------------------------------------------- capturas do site
  let MAN, IMG, CHUNKS, MSG;
  const VW = 390, VH = 844;                          // área visível do celular (px CSS)
  function loadManifest() {
    const x = new XMLHttpRequest(); x.open('GET', '/reels/case-vale-dos-canteiros/src/assets/site/manifest.json', false); x.send();
    MAN = JSON.parse(x.responseText);
    CHUNKS = [...MAN.reuse.chunks, ...MAN.tail].map((ch) => ({ key: ch.file.replace(/\.jpg$/, ''), y: ch.y, h: ch.h }));
    MSG = MAN.form.message.text.split('\n');
  }
  const img = (key) => IMG[key.replace(/\.(jpg|png)$/, '')];
  const ctr = (r) => [r.x + r.w / 2, r.y + r.h / 2];
  const SCRIM = { page: [27, 44, 38, 0.546], list: [48, 64, 57, 0.607], modal: [27, 46, 38, 0.618] };   // medidos nas capturas
  const scrim = (c, kind, a) => { if (a <= 0) return; const [r, g, bb, al] = SCRIM[kind]; c.fillStyle = `rgba(${r},${g},${bb},${al * a})`; c.fillRect(0, 0, VW, VH); };
  // captura da área visível (2x) desenhada na área visível
  const full = (c, key, a = 1, dx = 0, dy = 0) => { if (a <= 0) return; c.save(); c.globalAlpha *= clamp(a); c.drawImage(img(key), dx, dy, VW, VH); c.restore(); };
  // recorte (px CSS da área visível) de uma captura, deslocado
  function cropV(c, key, r, dy = 0, a = 1, radius = 0) {
    if (a <= 0) return;
    const im = img(key), q = im.width / VW;
    c.save(); c.globalAlpha *= clamp(a);
    if (radius) { rrect(c, r.x, r.y + dy, r.w, r.h, radius); c.clip(); }
    c.drawImage(im, r.x * q, r.y * q, r.w * q, r.h * q, r.x, r.y + dy, r.w, r.h);
    c.restore();
  }

  // página rolada em s (px CSS), desenhada em px CSS (0..VW x 0..VH)
  function drawPage(c, s, t) {
    c.fillStyle = C.site; c.fillRect(0, 0, VW, VH);
    const s1 = s + VH;
    for (const ch of CHUNKS) {
      const a0 = Math.max(ch.y, s), a1 = Math.min(ch.y + ch.h, s1);
      if (a1 <= a0) continue;
      const im = img(ch.key), q = im.height / ch.h;
      c.drawImage(im, 0, (a0 - ch.y) * q, im.width, (a1 - a0) * q, 0, a0 - s, VW, a1 - a0 + 0.5);
    }
    const mp = MAN.reuse.map;                         // o mapa (iframe) capturado à parte
    if (mp && mp.y < s1 && mp.y + mp.h > s) c.drawImage(img('m-map'), mp.x, mp.y - s, mp.w, mp.h);
    const hr = MAN.hero.rect;                         // topo: a foto do carrossel em cada instante (sem cabeçalho)
    if (s < hr.h) {
      const f = heroFade(t);
      c.drawImage(img('hero-1'), 0, -s, VW, hr.h);
      if (f > 0) { c.save(); c.globalAlpha *= f; c.drawImage(img('hero-2'), 0, -s, VW, hr.h); c.restore(); }
    }
    const F = MAN.form, fy = F.scroll + 76;           // o formulário no estado do instante t (sem o cabeçalho)
    if (s < F.scroll + VH && s1 > fy) {
      const st = formState(t);
      const draw = (key, a) => { const ii = img(key), q = ii.width / VW; c.save(); c.globalAlpha *= a; c.drawImage(ii, 0, 76 * q, ii.width, (VH - 76) * q, 0, fy - s, VW, VH - 76); c.restore(); };
      if (st.prev) draw(st.prev, 1);
      draw(st.key, st.prev ? st.mix : 1);
    }
    const ft = MAN.footer;                            // rodapé em 4x (nítido no zoom)
    if (ft.y < s1 && ft.y + ft.h > s) c.drawImage(img('footer-4x'), 0, ft.y - s, VW, ft.h);
  }
  const heroFade = (t) => prog(t, 1.9, 2.38);         // o site troca as fotos com fade de 480 ms
  function formState(t) {
    const S = [[0, 'form-0'], [TP.dia8 + 0.05, 'form-1'], [TP.crianca + 0.04, 'form-2'], [TP.chale + 0.08, 'form-3']];
    let i = 0; while (i + 1 < S.length && t >= S[i + 1][0]) i++;
    const mix = clamp((t - S[i][0]) / 0.07);
    return { key: S[i][1], prev: i > 0 && mix < 1 ? S[i - 1][1] : null, mix };
  }
  function header(c, s) {
    const k = clamp((s - 25) / 45);                   // o site troca o cabeçalho depois de ~60 px de rolagem
    if (k < 1) { c.save(); c.globalAlpha *= 1 - k; c.drawImage(img('header-top'), 0, 0, VW, 76); c.restore(); }
    if (k > 0) { c.save(); c.globalAlpha *= k; c.drawImage(img('header-scrolled'), 0, 0, VW, 76); c.restore(); }
  }

  // ---------------------------------------------------------------- rolagem da página (px CSS) no tempo
  let SCROLL;                                         // [t0, t1, s0, s1, curva]
  const SCR_KEYS = {};
  function buildScroll() {
    const F = MAN.form, P = MAN.page;
    const S6 = MAN.chalet6.scroll, SD = MAN.dayuse.scroll;
    const SV = Math.max(0, P.anchors.viver.y - 110);
    const SO0 = P.anchors.onde.y - 110, map = MAN.reuse.map, SO1 = Math.round(map.y + map.h - VH + 12);
    const SEND = P.H - VH;
    SCROLL = [
      [4.0, 4.62, 0, F.scroll, 'inOutCubic'],
      [14.15, 15.55, F.scroll, S6, 'inOutCubic'],
      [19.72, 20.72, S6, SV, 'inOutCubic'],
      [20.85, 23.3, SV, SD, 'outQuad'],               // arrasto e embalo pelos passeios
      [26.85, 27.75, SD, SO0, 'inOutCubic'],
      [27.85, 28.75, SO0, SO1, 'inOutSine'],
      [29.95, 30.85, SO1, SEND, 'inOutCubic'],
    ];
    Object.assign(SCR_KEYS, { S6, SD, SV, SO0, SO1, SEND });
  }
  function scrollAt(t) {
    let s = 0;
    for (const [t0, t1, s0, s1, ez] of SCROLL) { if (t < t0) break; s = lerp(s0, s1, E[ez](prog(t, t0, t1))); }
    return s;
  }

  // ---------------------------------------------------------------- o toque (px CSS da área visível)
  // segmentos: at (aparece num ponto) · glide (desliza até um ponto) · drag (pressionado, acompanha a página/modal)
  let TOUCH, TAPS, VIS;
  function buildTouch() {
    const F = MAN.form.taps, M6 = MAN.chalet6, DU = MAN.dayuse;
    const pin = pinPage();
    const seg = [];
    const at = (t0, x, y) => seg.push({ k: 'at', t0, t1: t0, x, y });
    const glide = (t0, t1, [x, y]) => seg.push({ k: 'glide', t0, t1, x, y });
    const drag = (t0, t1, x, y0, src = 'page') => seg.push({ k: 'drag', t0, t1, x, y0, src });
    TAPS = [];
    const tap = (t, p) => TAPS.push({ t, x: p[0], y: p[1] });
    // 2 · consulta
    at(3.85, 285, 700); drag(4.0, 4.34, 285, 700);
    glide(4.4, 4.72, ctr(F.entrada)); tap(TP.entrada, ctr(F.entrada));
    glide(4.95, 5.3, ctr(F.proximo)); tap(TP.proximo, ctr(F.proximo));
    glide(5.5, 5.9, ctr(F.dia5)); tap(TP.dia5, ctr(F.dia5));
    glide(6.1, 6.5, ctr(F.dia8)); tap(TP.dia8, ctr(F.dia8));
    glide(6.75, 7.1, ctr(F.maisCriancas)); tap(TP.crianca, ctr(F.maisCriancas));
    glide(7.3, 7.7, ctr(F.acomodacao)); tap(TP.acomod, ctr(F.acomodacao));
    glide(7.95, 8.3, ctr(F.chale6)); tap(TP.chale, ctr(F.chale6));
    glide(8.6, 9.2, [352, 500]);                      // pausa: o formulário completo fica à vista
    glide(9.72, 10.1, ctr(F.enviar)); tap(TP.enviar, ctr(F.enviar));
    glide(10.55, 10.9, CHAT.send); tap(TP.send, CHAT.send);
    // 3 · chalés
    at(14.0, 300, 610); drag(14.15, 14.5, 300, 610);
    at(15.45, 250, 560); glide(15.6, 16.05, ctr(M6.taps.ver)); tap(TP.ver, ctr(M6.taps.ver));
    glide(16.26, 16.62, [220, 640]); drag(16.75, 17.25, 220, 640, 'modal');
    at(18.85, 262, 600); glide(18.95, 19.3, [195, 816]); tap(TP.fora, [195, 816]);
    // 4 · passeios
    glide(19.48, 19.68, [300, 700]); drag(19.72, 20.02, 300, 700);
    at(20.7, 300, 740); drag(20.85, 21.2, 300, 740);
    // 5 · day use
    at(23.45, 262, 560); glide(23.5, 23.9, ctr(DU.taps.menu)); tap(TP.menu, ctr(DU.taps.menu));
    glide(24.1, 24.45, ctr(DU.taps.reservar)); tap(TP.reservar, ctr(DU.taps.reservar));
    glide(24.66, 24.9, [362, 740]);                   // sai de cena durante a leitura do Day Use
    at(25.8, 300, 560); glide(26.0, 26.4, ctr(DU.taps.close)); tap(TP.fechar, ctr(DU.taps.close));
    // 6 · como chegar
    glide(26.58, 26.8, [300, 620]); drag(26.85, 27.1, 300, 620);
    glide(27.35, 27.8, [364, 640]); drag(27.85, 28.75, 364, 640);
    glide(28.85, 29.25, [pin.x, pin.y - SCR_KEYS.SO1]);
    // 7 · assinatura: rolagem até o fim
    glide(29.7, 29.92, [300, 700]); drag(29.95, 30.2, 300, 700);
    // posição inicial de cada segmento = fim do anterior
    let px = 285, py = 700;
    for (const sg of seg) { sg.fx = px; sg.fy = py; if (sg.k === 'drag') { px = sg.x; py = sg.y0 - dragDelta(sg, sg.t1); } else { px = sg.x; py = sg.y; } }
    TOUCH = seg;
    VIS = [[3.85, 11.3], [14.0, 14.62], [15.45, 17.4], [18.85, 20.12], [20.7, 21.35], [23.45, 24.92], [25.8, 30.3]];
  }
  function dragDelta(sg, t) {
    const tt = Math.min(t, sg.t1);
    if (sg.src === 'modal') return m6Scroll(tt) - m6Scroll(sg.t0);
    return scrollAt(tt) - scrollAt(sg.t0);
  }
  function touchAt(t) {
    let x = 285, y = 700, pressed = 0;
    for (const sg of TOUCH) {
      if (t < sg.t0) break;
      if (sg.k === 'at') { x = sg.x; y = sg.y; }
      else if (sg.k === 'glide') { const p = E.inOutCubic(prog(t, sg.t0, sg.t1)); x = lerp(sg.fx, sg.x, p); y = lerp(sg.fy, sg.y, p); }
      else { x = sg.x; y = sg.y0 - dragDelta(sg, t); if (t <= sg.t1 + 0.04) pressed = Math.max(pressed, prog(t, sg.t0 - 0.06, sg.t0)); }
    }
    for (const tp of TAPS) pressed = Math.max(pressed, prog(t, tp.t - 0.09, tp.t - 0.02) * (1 - prog(t, tp.t + 0.04, tp.t + 0.14)));
    let a = 0;
    for (const [a0, a1] of VIS) a = Math.max(a, prog(t, a0, a0 + 0.14) * (1 - prog(t, a1 - 0.14, a1)));
    return { x, y, pressed, a };
  }
  function drawTouch(c, t) {
    const tc = touchAt(t);
    for (const tp of TAPS) {                          // onda de cada toque
      const p = prog(t, tp.t, tp.t + 0.5);
      if (p <= 0 || p >= 1) continue;
      c.save(); c.globalAlpha *= (1 - p) * 0.95;
      c.beginPath(); c.arc(tp.x, tp.y, 14 + 34 * E.outCubic(p), 0, TAU); c.lineWidth = 3.2 * (1 - p) + 0.8; c.strokeStyle = C.lime; c.stroke();
      c.restore();
    }
    if (tc.a <= 0.01) return;
    c.save(); c.globalAlpha *= tc.a;
    if (tc.pressed > 0.5) for (let i = 1; i <= 5; i++) {   // rastro ao arrastar
      const q = touchAt(t - i * 0.022);
      if (Math.hypot(q.x - tc.x, q.y - tc.y) < 2) continue;
      c.beginPath(); c.arc(q.x, q.y, 15 - i * 1.6, 0, TAU); c.fillStyle = rgba(C.lime, 0.22 - i * 0.035); c.fill();
    }
    const s = 1 - 0.18 * tc.pressed;
    glow(c, tc.x, tc.y, 40 * s, 0.32 + 0.2 * tc.pressed);
    c.beginPath(); c.arc(tc.x, tc.y, 21 * s, 0, TAU); c.fillStyle = rgba(C.lime, 0.86); c.fill();
    c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.beginPath(); c.arc(tc.x, tc.y, 8.5 * s, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- camadas por cima da página
  const calP = (t) => E.outCubic(prog(t, TP.entrada + 0.05, TP.entrada + 0.33)) * (1 - E.inCubic(prog(t, TP.dia8 + 0.06, TP.dia8 + 0.32)));
  const listP = (t) => E.outCubic(prog(t, TP.acomod + 0.05, TP.acomod + 0.33)) * (1 - E.inCubic(prog(t, TP.chale + 0.1, TP.chale + 0.36)));
  const m6P = (t) => E.outCubic(prog(t, TP.ver + 0.05, TP.ver + 0.3)) * (1 - E.inCubic(prog(t, TP.fora + 0.05, TP.fora + 0.28)));
  const m6Scroll = (t) => 560 * E.outCubic(prog(t, 16.75, 17.5));
  const menuP = (t) => E.outCubic(prog(t, TP.menu + 0.05, TP.menu + 0.3)) * (1 - prog(t, TP.reservar + 0.05, TP.reservar + 0.25));
  const duScrim = (t) => E.outCubic(prog(t, TP.reservar + 0.05, TP.reservar + 0.3)) * (1 - E.inCubic(prog(t, TP.fechar + 0.05, TP.fechar + 0.3)));
  const duPanel = (t) => E.outCubic(prog(t, TP.reservar + 0.1, TP.reservar + 0.4)) * (1 - E.inCubic(prog(t, TP.fechar + 0.05, TP.fechar + 0.25)));
  const chatIn = (t) => E.inOutCubic(prog(t, TP.enviar + 0.1, TP.enviar + 0.42)) * (1 - E.inOutCubic(prog(t, T.chales, T.chales + 0.32)));

  function sheetCal(c, t) {
    const p = calP(t);
    if (p <= 0) return;
    const F = MAN.form, r = F.cal.sheet, dy = (1 - p) * r.h;
    const k1 = prog(t, TP.proximo + 0.05, TP.proximo + 0.16), k2 = prog(t, TP.dia5 + 0.04, TP.dia5 + 0.12);
    cropV(c, 'cal-oct', r, dy, 1, 20);
    if (k1 > 0) cropV(c, 'cal-nov', r, dy, k1, 20);
    if (k2 > 0) cropV(c, 'cal-d5', r, dy, k2, 20);
    // o 8 marcado no toque (o calendário do site fecha sozinho ao escolher a saída)
    const k8 = prog(t, TP.dia8 - 0.02, TP.dia8 + 0.05);
    if (k8 > 0) {
      const d = F.taps.dia8, [x, y] = ctr(d);
      c.save(); c.globalAlpha *= k8; c.beginPath(); c.arc(x, y + dy, d.w / 2 - 0.5, 0, TAU); c.fillStyle = C.green; c.fill();
      text(c, '8', x, y + dy + 5.5, { size: 15, weight: 600, color: '#FFFFFF', align: 'center' }); c.restore();
    }
  }
  function sheetList(c, t) {
    const p = listP(t);
    if (p <= 0) return;
    const r = MAN.form.list.sheet, dy = (1 - p) * r.h;
    cropV(c, 'list', r, dy, 1, 20);
    const o = MAN.form.taps.chale6, k = kick(t, TP.chale, 0.35);
    if (k > 0.01) { c.save(); c.globalAlpha *= k; rrect(c, o.x, o.y + dy, o.w, o.h, 10); c.fillStyle = 'rgba(28,46,38,0.12)'; c.fill(); c.restore(); }
  }
  // modal "Ver detalhes" do Chalé de Pedra 6: conteúdo rolável emendado (topo + fim) + botão fixo
  function modal6(c, t) {
    const p = m6P(t);
    if (p <= 0) return;
    const M = MAN.chalet6, r = M.rect, q = m6Scroll(t), dy = (1 - p) * 36;
    scrim(c, 'modal', p);
    c.save(); c.globalAlpha *= clamp(p * 1.3); c.translate(0, dy);
    rrect(c, r.x, r.y, r.w, r.h, M.radius); c.clip();
    c.fillStyle = '#FBF9F4'; c.fillRect(r.x, r.y, r.w, r.h);
    const s0 = img(M.files.s0), s1 = img(M.files.s1), k = s0.width / r.w, CUTY = 700, off = M.s1Scroll;
    if (q < CUTY) { const a0 = q, a1 = Math.min(CUTY, q + r.h); c.drawImage(s0, 0, a0 * k, s0.width, (a1 - a0) * k, r.x, r.y + a0 - q, r.w, a1 - a0 + 0.5); }
    const b0 = Math.max(CUTY, q), b1 = Math.min(q + r.h, M.scrollH);
    if (b1 > b0) c.drawImage(s1, 0, (b0 - off) * k, s1.width, (b1 - b0) * k, r.x, r.y + b0 - q, r.w, b1 - b0);
    // Comodidades e Alimentação acendem
    [['comodidades', 17.55], ['alimentacao', 17.85]].forEach(([key, t0]) => {
      const bl = M.blocks[key];
      if (t >= t0) ring(c, { x: bl.x - 8, y: r.y + bl.y - q - 8, w: bl.w + 16, h: bl.h + 16 }, t, t0, 1);
    });
    cropV(c, M.files.top, M.cta);                     // o botão fixo "Consultar este chalé"
    c.restore();
  }
  function menu(c, t) {
    const p = menuP(t);
    if (p <= 0) return;
    full(c, MAN.dayuse.files.menu, clamp(p * 1.2), (1 - E.outCubic(prog(t, TP.menu + 0.05, TP.menu + 0.32))) * 26, 0);
  }
  function dayuse(c, t) {
    const a = duScrim(t), p = duPanel(t);
    if (a <= 0 && p <= 0) return;
    const D = MAN.dayuse;
    scrim(c, 'modal', a);
    if (p <= 0) return;
    const r = D.panel, dy = (1 - p) * 40;
    c.save(); c.globalAlpha *= clamp(p * 1.3);
    cropV(c, D.files.modal, r, dy, 1, MAN.chalet6.radius);
    [['horario', 25.2], ['cachoeiras', 25.45], ['almoco', 25.7]].forEach(([key, t0]) => {
      const bl = D.bullets[key];
      if (t >= t0) ring(c, { x: bl.x - 10, y: bl.y - 6 + dy, w: bl.w + 4, h: bl.h + 12 }, t, t0, 1);
    });
    c.restore();
  }
  // destaque lima: contorno que se fecha, preenchimento leve e ✓
  function ring(c, r, t, t0, a = 1) {
    if (a <= 0.01) return;
    const p = E.outCubic(prog(t, t0, t0 + 0.3)), pulse = kick(t, t0 + 0.25, 0.5);
    const per = 2 * (r.w + r.h);
    c.save(); c.globalAlpha *= a;
    rrect(c, r.x, r.y, r.w, r.h, 9); c.fillStyle = rgba(C.lime, (0.1 + 0.12 * pulse) * p); c.fill();
    c.shadowColor = C.lime; c.shadowBlur = 8 + 10 * pulse;
    c.setLineDash([per * p, per]); rrect(c, r.x, r.y, r.w, r.h, 9); c.lineWidth = 2.6 + 1.4 * pulse; c.strokeStyle = C.lime; c.stroke(); c.setLineDash([]);
    c.restore();
    checkBadge(c, r.x + r.w - 4, r.y + 4, 10 * E.outBack(prog(t, t0 + 0.15, t0 + 0.45)), a);
  }
  // passeios e "22 km": destaques presos à página (acendem quando passam pela tela)
  let PAGE_RINGS;
  function buildRings() {
    const P = MAN.page, out = [];
    const union = (rs) => { const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y)), x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h)); return { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + 12 }; };
    P.passeios.slice(0, 3).forEach((ps, i) => {
      const r = union(ps.tags);
      let t0 = 23.3;                                  // quando a etiqueta passa pela linha y=735 da tela
      for (let t = 20.6; t <= 23.3; t += 1 / 120) if (r.y + r.h / 2 - scrollAt(t) <= 735) { t0 = Math.max(20.9, t); break; }
      out.push({ r, t0, until: 24.2 });
    });
    const km = P.onde.km;
    out.push({ r: { x: km.x - 8, y: km.y - 8, w: km.w + 16, h: km.h + 16 }, t0: 28.3, until: 30.0 });
    PAGE_RINGS = out;
  }
  function pageRings(c, s, t) {
    for (const pr of PAGE_RINGS) {
      if (t < pr.t0 || t > pr.until) continue;
      ring(c, { ...pr.r, y: pr.r.y - s }, t, pr.t0, 1 - prog(t, pr.until - 0.2, pr.until));
    }
  }
  // pino do mapa (px CSS da página): no mapa capturado, o pino fica em (174, 109) de 348x261
  const pinPage = () => { const m = MAN.reuse.map; return { x: m.x + m.w * 0.5, y: m.y + m.h * (109 / 261) }; };
  function pinPulse(c, s, t) {
    if (t < 29.0 || t > 30.2) return;
    const p = pinPage();
    for (const t0 of [29.25, 29.65]) {
      const q = prog(t, t0, t0 + 0.7);
      if (q <= 0 || q >= 1) continue;
      c.save(); c.globalAlpha *= (1 - q); c.beginPath(); c.arc(p.x, p.y - s - 6, 10 + 40 * E.outCubic(q), 0, TAU); c.lineWidth = 3; c.strokeStyle = C.lime; c.stroke(); c.restore();
    }
  }

  // ---------------------------------------------------------------- chat recriado (genérico: sem logo, sem número)
  const CHAT = { fs: 15.5, lh: 22, pad: 13, maxW: 262, send: [360, 810] };
  let MSG_LINES;
  function layoutMessage() {
    MEAS.font = fnt(TEXT, CHAT.fs, 400); MEAS.letterSpacing = '0px';
    MSG_LINES = [];
    for (const para of MSG) {
      if (!para) { MSG_LINES.push(''); continue; }
      let line = '';
      for (const w of para.split(' ')) {
        const tryL = line ? `${line} ${w}` : w;
        if (MEAS.measureText(tryL).width > CHAT.maxW && line) { MSG_LINES.push(line); line = w; } else line = tryL;
      }
      MSG_LINES.push(line);
    }
    CHAT.textW = Math.max(...MSG_LINES.map((l) => MEAS.measureText(l).width));
  }
  function chat(c, t) {
    const p = chatIn(t);
    if (p <= 0) return;
    c.save(); c.translate((1 - p) * VW, 0);
    c.fillStyle = '#0D1311'; c.fillRect(0, 0, VW, VH);
    c.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 80; y < VH; y += 26) for (let x = 10 + ((y / 26) % 2) * 13; x < VW; x += 26) { c.beginPath(); c.arc(x, y, 1, 0, TAU); c.fill(); }
    // cabeçalho: voltar, avatar genérico (silhueta), nome da pousada (só o nome; sem número, sem logo)
    c.fillStyle = '#151D1A'; c.fillRect(0, 0, VW, 64);
    icon(c, 'back', 20, 32, 26, C.soft, 0.11);
    c.save(); c.beginPath(); c.arc(56, 32, 19, 0, TAU); c.fillStyle = '#2A3531'; c.fill(); c.clip();
    icon(c, 'user', 56, 34, 34, '#7F8C87'); c.restore();
    text(c, 'Pousada Vale dos Canteiros', 85, 38, { size: 15.5, weight: 600, color: '#F1F3F2' });
    // mensagem: no campo de digitação -> enviada (balão) ✓
    const sp = E.inOutCubic(prog(t, TP.send + 0.06, TP.send + 0.34));
    const boxH = MSG_LINES.length * CHAT.lh + 2 * CHAT.pad;
    const emptyH = 44, bottom = VH - 12;
    const fieldH = lerp(boxH, emptyH, sp);
    rrect(c, 10, bottom - fieldH, 318, fieldH, 22); c.fillStyle = '#1E2724'; c.fill();
    if (sp > 0.6) text(c, 'Mensagem', 26, bottom - 16, { size: 15, weight: 400, color: '#7E8985', alpha: prog(sp, 0.6, 1) });
    const kb = kick(t, TP.send, 0.3);
    c.beginPath(); c.arc(CHAT.send[0], CHAT.send[1], 22 * (1 - 0.1 * kb), 0, TAU); c.fillStyle = C.lime; c.fill();
    icon(c, 'send', CHAT.send[0] + 1, CHAT.send[1], 22, C.ink, 0.1);
    const bw = CHAT.textW + 2 * CHAT.pad;
    const fx = 10, fy = bottom - boxH, tx = VW - 10 - bw, ty = bottom - emptyH - 14 - boxH;
    const mx = lerp(fx, tx, sp), my = lerp(fy, ty, sp), bh = boxH + 16 * sp;
    if (sp > 0) {
      c.save(); c.globalAlpha *= clamp(sp * 1.6);
      rrect(c, mx, my, bw, bh, 16); c.fillStyle = C.lime; c.fill();
      c.beginPath(); c.moveTo(mx + bw - 4, my + bh - 14); c.lineTo(mx + bw + 6, my + bh); c.lineTo(mx + bw - 18, my + bh - 2); c.closePath(); c.fill();
      c.restore();
    }
    const col = sp < 0.5 ? '#EEF1EF' : C.ink;
    MSG_LINES.forEach((l, i) => { if (l) text(c, l, mx + CHAT.pad, my + CHAT.pad + 16 + i * CHAT.lh, { size: CHAT.fs, weight: 400, color: col, alpha: sp > 0.35 && sp < 0.6 ? 0.4 : 1 }); });
    const ck = E.outBack(prog(t, TP.send + 0.34, TP.send + 0.54));
    if (ck > 0) { c.save(); c.globalAlpha *= clamp(ck); icon(c, 'check', mx + bw - 16, my + boxH + 2, 18 * ck, C.ink, 0.15); c.restore(); }
    c.restore();
  }

  // barra de endereço (gancho): o site no ar, no domínio real
  function urlBar(c, t) {
    const p = E.outBack(prog(t, CORTE + 0.12, CORTE + 0.45), 1.4) * (1 - E.inCubic(prog(t, 3.75, 3.98)));
    if (p <= 0) return;
    const y = 780 + (1 - p) * 70;
    c.save(); c.globalAlpha *= clamp(p);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 16; c.shadowOffsetY = 4;
    rrect(c, 22, y, VW - 44, 46, 23); c.fillStyle = 'rgba(250,248,243,0.96)'; c.fill(); c.restore();
    icon(c, 'lock', 88, y + 23, 16, '#4A514E', 0.11);
    text(c, 'pousadavaledoscanteiros.com.br', 101, y + 28.5, { size: 14, weight: 500, color: '#1D2421' });
    c.restore();
  }

  // ---------------------------------------------------------------- celular e câmera
  const K = 480 / VW;                                 // px do quadro por px CSS
  const SB = 40, BZ = 13;
  const PW = 480 + 2 * BZ, PH = BZ + SB + VH * K + BZ;
  const PX = W / 2 - PW / 2, PY = 448;
  const SCR = { x: PX + BZ, y: PY + BZ, w: 480, h: SB + VH * K };
  const WEB = { x: SCR.x, y: SCR.y + SB, w: 480, h: VH * K };
  const statusDark = (t, s) => Math.max(1 - clamp((s - 25) / 45), menuP(t), chatIn(t));
  function phone(c, t, inner, s) {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 60; c.shadowOffsetY = 26;
    rrect(c, PX, PY, PW, PH, 66); c.fillStyle = '#0B0D0D'; c.fill(); c.restore();
    rrect(c, PX, PY, PW, PH, 66); c.lineWidth = 3; c.strokeStyle = '#30363A'; c.stroke();
    c.fillStyle = '#1A1E20'; c.fillRect(PX - 3, PY + 190, 4, 70); c.fillRect(PX - 3, PY + 280, 4, 70); c.fillRect(PX + PW - 1, PY + 240, 4, 110);
    c.save(); rrect(c, SCR.x, SCR.y, SCR.w, SCR.h, 54); c.clip();
    const dk = statusDark(t, s);
    c.fillStyle = U.mix('#F6F3EC', '#17201C', dk); c.fillRect(SCR.x, SCR.y, SCR.w, SB + 1);
    const ic = U.mix('#1A1F1D', '#F2F4F3', dk);
    icon(c, 'signal', SCR.x + SCR.w - 96, SCR.y + 21, 22, ic); icon(c, 'battery', SCR.x + SCR.w - 46, SCR.y + 21, 28, ic, 0.07);
    c.save(); c.beginPath(); c.rect(WEB.x, WEB.y, WEB.w, WEB.h); c.clip();
    c.translate(WEB.x, WEB.y); c.scale(K, K);
    inner(c);
    c.restore();
    c.restore();
    rrect(c, W / 2 - 54, SCR.y + 8, 108, 26, 13); c.fillStyle = '#000'; c.fill();
  }
  // o que está na tela do celular no instante t (px CSS)
  function screen(c, t) {
    const s = scrollAt(t), ci = chatIn(t);
    c.save();
    if (ci > 0) c.translate(-ci * VW * 0.28, 0);       // troca de app: o site recua para a esquerda
    drawPage(c, s, t);
    pageRings(c, s, t);
    pinPulse(c, s, t);
    scrim(c, 'page', calP(t));
    scrim(c, 'list', listP(t));
    header(c, s);
    sheetCal(c, t);
    sheetList(c, t);
    modal6(c, t);
    menu(c, t);
    dayuse(c, t);
    urlBar(c, t);
    if (ci > 0) { c.fillStyle = `rgba(0,0,0,${0.35 * ci})`; c.fillRect(0, 0, VW, VH); }
    c.restore();
    chat(c, t);
    drawTouch(c, t);
  }
  // câmera: [t, zoom, fx, fy, tx, ty] -> o ponto f (quadro em z=1) vai para t
  let CAM;
  function buildCamera() {
    const ft = MAN.footer.link, s = SCR_KEYS.SEND;
    const lx = WEB.x + (ft.x + ft.w / 2) * K, ly = WEB.y + (ft.y + ft.h / 2 - s) * K;
    const mid = [540, 1000, 540, 1000], chatF = [540, 1180, 540, 1180];
    CAM = [[0, 1, ...mid], [TP.send, 1, ...chatF], [T.chales, 1.05, ...chatF], [T.chales + 0.5, 1, ...mid],
      [30.9, 1, lx, ly, lx, ly], [31.85, 3.0, lx, ly, 540, 1010], [32.5, 3.35, lx, ly, 540, 1010]];
  }
  function camAt(t) {
    let k = 0; while (k + 1 < CAM.length && t >= CAM[k + 1][0]) k++;
    const a = CAM[k], bb = CAM[k + 1];
    if (!bb) return a.slice(1);
    const p = E.inOutCubic(prog(t, a[0], bb[0]));
    const z = Math.exp(lerp(Math.log(a[1]), Math.log(bb[1]), p));
    return [z, lerp(a[2], bb[2], p), lerp(a[3], bb[3], p), lerp(a[4], bb[4], p), lerp(a[5], bb[5], p)];
  }

  // ---------------------------------------------------------------- etiquetas da consulta (acima do celular)
  // vazias no início (Datas · Hóspedes · Chalé) e preenchidas com o que o toque escolheu no formulário
  const VAL = [
    { ic: 'cal', empty: 'Datas', full: '05/11 a 08/11/2026', t: TP.dia8 + 0.2 },
    { ic: 'people', empty: 'Hóspedes', full: '2 adultos · 1 criança', t: TP.crianca + 0.12 },
    { ic: 'bed', empty: 'Chalé', full: 'Chalé de Pedra 6', t: TP.chale + 0.42 },
  ];
  const VCH = 62, VFS = 27;
  function valueChips(c, t) {
    if (t < 4.2 || t > TP.enviar + 0.7) return;
    const ws = VAL.map((v) => lerp(measure(v.empty, TEXT, VFS, 600), measure(v.full, TEXT, VFS, 600), E.inOutCubic(prog(t, v.t, v.t + 0.3))) + 104);
    const rows = [[0, 1], [2]], ys = [292, 370];
    rows.forEach((row, ri) => {
      const tot = row.reduce((a, i) => a + ws[i], 0) + 14 * (row.length - 1);
      let x = W / 2 - tot / 2;
      row.forEach((i) => {
        const v = VAL[i], w = ws[i], cx = x + w / 2, y = ys[ri];
        x += w + 14;
        const ap = E.outBack(prog(t, 4.3 + i * 0.1, 4.75 + i * 0.1), 1.6);
        if (ap <= 0) return;
        const filled = prog(t, v.t, v.t + 0.12), pop = kick(t, v.t, 0.35);
        const fly = E.inCubic(prog(t, TP.enviar + 0.05 + i * 0.05, TP.enviar + 0.4 + i * 0.05));   // vão para o celular no envio
        const X = lerp(cx, 540, fly), Y = lerp(y, 1300, fly), S = ap * (1 + 0.07 * pop) * lerp(1, 0.35, fly);
        c.save(); c.translate(X, Y); c.scale(S, S); c.globalAlpha *= clamp(ap) * (1 - fly);
        c.save(); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
        rrect(c, -w / 2, -VCH / 2, w, VCH, VCH / 2); c.fillStyle = C.card; c.fill(); c.restore();
        rrect(c, -w / 2, -VCH / 2, w, VCH, VCH / 2); c.lineWidth = 2.5; c.strokeStyle = U.mix(C.dim, C.lime, filled); c.stroke();
        if (pop > 0.02) { c.save(); c.shadowColor = C.lime; c.shadowBlur = 26 * pop; rrect(c, -w / 2, -VCH / 2, w, VCH, VCH / 2); c.lineWidth = 3; c.strokeStyle = rgba(C.lime, pop); c.stroke(); c.restore(); }
        const ix = -w / 2 + 38;
        if (filled > 0.5) checkBadge(c, ix, 0, 21 * E.outBack(prog(t, v.t, v.t + 0.3)), 1);
        else { c.beginPath(); c.arc(ix, 0, 21, 0, TAU); c.lineWidth = 2; c.strokeStyle = rgba(C.lime, 0.45); c.stroke(); icon(c, v.ic, ix, 0, 28, rgba(C.lime, 0.8), 0.1); }
        const lbl = filled > 0.5 ? v.full : v.empty;
        text(c, lbl, ix + 34, 9.5, { size: VFS, weight: 600, color: filled > 0.5 ? C.white : C.muted, alpha: filled > 0.5 ? prog(filled, 0.5, 1) : 1 - filled * 2 });
        c.restore();
      });
    });
  }

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

  // ---------------------------------------------------------------- textos
  const L_H1 = ['POUSADA DE FAMÍLIA', 'NA SERRA DA CANASTRA.'];
  const L_H2 = ['SITE NOVO', 'NO AR.'];
  const L_CONSULTA = ['A CONSULTA CHEGA NO', 'WHATSAPP JÁ ORGANIZADA.'];
  const L_CHALE = ['CADA CHALÉ COM', 'SEUS DETALHES.'];
  const L_PASSEIOS = ['OS PASSEIOS QUE O', 'HÓSPEDE VEIO FAZER.'];
  const L_DAY = ['ATÉ O DAY USE, COM', 'TUDO EXPLICADO.'];
  const L_CHEGAR = ['E COMO CHEGAR', 'ATÉ LÁ.'];
  let SZ = {};
  const TY = 312;                                     // linha de base da 1ª linha dos títulos (zona y 240–440)

  // ---------------------------------------------------------------- quadro
  function frame(c, t) {
    background(c, t);
    // celular: sobe no gancho, respira devagar (nunca congela), some no zoom final
    const rise = (1 - E.outCubic(prog(t, -0.12, 0.95))) * 760;
    const float = (Math.sin(t * 0.9) * 4 + Math.sin(t * 0.37 + 1) * 3) * (1 - prog(t, 30.5, 30.9));
    // some enquanto a logo se monta: cai rápido para 45% (a logo fica nítida por cima) e depois se apaga (sem intervalo escuro)
    const out = 1 - lerp(1, 0.45, E.outCubic(prog(t, 32.2, 32.5))) * (1 - prog(t, 32.75, 32.95));
    if (out < 1) {
      const [z, fx, fy, tx, ty] = camAt(t);
      const zb = z * (1 + 0.012 * Math.sin(t * 0.55) * (1 - prog(t, 30.5, 30.9)));
      c.save(); c.globalAlpha *= 1 - out;
      c.translate(tx, ty + rise + float); c.scale(zb, zb); c.translate(-fx, -fy);
      glow(c, 540, 1000, 700, 0.06);
      phone(c, t, (cc) => screen(cc, t), scrollAt(t));
      c.restore();
      if (t > 31.3) {                                 // "Site por [FAZLO]": o anel lima se fecha no zoom
        const rr = { x: 540 - 330, y: 1010 - 60, w: 660, h: 120 };
        const p = E.inOutCubic(prog(t, 31.35, 31.75)), per = 2 * (rr.w + rr.h);
        c.save(); c.globalAlpha *= 1 - out; c.shadowColor = C.lime; c.shadowBlur = 24;
        c.setLineDash([per * p, per]); rrect(c, rr.x, rr.y, rr.w, rr.h, 60); c.lineWidth = 6; c.strokeStyle = C.lime; c.stroke(); c.setLineDash([]);
        c.restore();
      }
    }
    // faixa escura onde a logo se monta (o rodapé não aparece por baixo dela)
    const band = E.outCubic(prog(t, 32.12, 32.42)) * (1 - prog(t, 32.8, 33.0));
    if (band > 0) {
      const g = c.createLinearGradient(0, 600, 0, 1160);
      g.addColorStop(0, rgba(C.bg, 0)); g.addColorStop(0.28, rgba(C.bg, 0.94 * band)); g.addColorStop(0.72, rgba(C.bg, 0.94 * band)); g.addColorStop(1, rgba(C.bg, 0));
      c.fillStyle = g; c.fillRect(0, 600, W, 560);
    }
    valueChips(c, t);
    // títulos
    titleBlock(c, L_H1, t, -0.32, CORTE - 0.16, { size: SZ.h1, y: TY });
    titleBlock(c, L_H2, t, CORTE + 0.04, 4.02, { size: SZ.h2, y: TY + 8, lime: ['NO', 'AR.'] });
    titleBlock(c, L_CONSULTA, t, TP.enviar + 0.28, T.chales - 0.22, { size: SZ.consulta, y: TY, lime: ['ORGANIZADA.'] });
    titleBlock(c, L_CHALE, t, T.chales + 0.4, T.viver - 0.25, { size: SZ.chale, y: TY, lime: ['DETALHES.'] });
    titleBlock(c, L_PASSEIOS, t, T.viver + 0.2, T.dayuse - 0.25, { size: SZ.passeios, y: TY, lime: ['PASSEIOS'] });
    titleBlock(c, L_DAY, t, T.dayuse + 0.15, T.chegar - 0.12, { size: SZ.day, y: TY, lime: ['DAY', 'USE,'] });
    titleBlock(c, L_CHEGAR, t, T.chegar + 0.15, T.assinatura - 0.15, { size: SZ.chegar, y: TY, lime: ['CHEGAR'] });
    // "o corte": a barra lima varre na diagonal
    const wp = prog(t, CORTE - 0.12, CORTE + 0.4);
    if (wp > 0 && wp < 1) {
      const x0 = 540 + lerp(-1400, 1400, E.inOutCubic(wp)), bw = 120;
      c.beginPath(); c.moveTo(x0 + SK * 1200 - bw / 2, -200); c.lineTo(x0 + SK * 1200 + bw / 2, -200); c.lineTo(x0 - SK * 1200 + bw / 2, 2200); c.lineTo(x0 - SK * 1200 - bw / 2, 2200); c.closePath();
      c.fillStyle = C.lime; c.fill();
    }
    // ===== CTA
    if (t > T.cta - 0.1) {
      const gp = prog(t, T.cta, T.cta + 1.0);
      glow(c, 540, 900, 520, 0.1 * gp + 0.03 * Math.sin(t * 3) * gp);
      drawLogo(c, 540, 880, 720, t, T.cta + 0.02);
      const s1 = E.outCubic(prog(t, T.cta + 0.85, T.cta + 1.3));
      text(c, 'Sua pousada também pode ter o seu', W / 2, 1100 + (1 - s1) * 24, { size: 42, weight: 500, color: C.soft, align: 'center', alpha: s1 });
      const s2 = E.outBack(prog(t, T.cta + 1.4, T.cta + 1.8), 1.6);
      if (s2 > 0) {
        const lbl = 'Fale com a FAZLO · link na bio', fw = measure(lbl, TEXT, 34, 600) + 120;
        c.save(); c.translate(W / 2, 1222); c.scale(s2, s2);
        rrect(c, -fw / 2, -38, fw, 76, 38); c.fillStyle = C.lime; c.fill();
        text(c, lbl, -fw / 2 + 40, 12, { size: 34, weight: 600, color: C.ink });
        icon(c, 'arrow', fw / 2 - 44, -2 - 4 * Math.sin(t * 6), 34, C.ink, 0.12);
        c.restore();
      }
      const fl = kick(t, T.cta, 0.3);                 // clarão lima na virada
      if (fl > 0.01) { c.fillStyle = rgba(C.lime, 0.16 * fl); c.fillRect(0, 0, W, H); }
    }
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
    id: 'case-vale-dos-canteiros',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: {
      default: [3, 1 / 120],
      ranges: [[0, 1.0, 5, 1 / 120], [2.25, 2.85, 5, 1 / 120], [4.0, 4.65, 5, 1 / 110], [14.15, 15.6, 5, 1 / 100], [19.7, 20.8, 5, 1 / 100], [26.85, 27.8, 5, 1 / 100], [29.95, 31.9, 5, 1 / 110]],
    },

    setup(api) {
      DISPLAY = "'FZD Display'"; TEXT = "'FZD Text'";
      IMG = api.assets;
      loadLogo(); loadManifest(); layoutMessage();
      buildScroll(); buildTouch(); buildRings(); buildCamera();
      const f = (L, max) => fit(L, DISPLAY, 900, 940, max, -0.02);
      SZ = { h1: f(L_H1, 72), h2: f(L_H2, 92), consulta: f(L_CONSULTA, 66), chale: f(L_CHALE, 72), passeios: f(L_PASSEIOS, 66), day: f(L_DAY, 66), chegar: f(L_CHEGAR, 76) };
    },

    frame,
    post,

    cover(ctx) {
      background(ctx, 20);
      glow(ctx, 540, 1200, 620, 0.08);
      drawLogo(ctx, 540, 352, 560, 99, 0);                           // logo no topo, centralizada
      const s1 = fit(['CONHEÇA O SITE DA'], DISPLAY, 900, 900, 76, -0.02);
      text(ctx, 'CONHEÇA O SITE DA', 540, 590, { fam: DISPLAY, size: s1, weight: 900, align: 'center', ls: -s1 * 0.02 });
      const s2 = fit(['VALE DOS', 'CANTEIROS'], DISPLAY, 900, 900, 116, -0.02);
      text(ctx, 'VALE DOS', 540, 590 + s2 * 1.08, { fam: DISPLAY, size: s2, weight: 900, color: C.lime, align: 'center', ls: -s2 * 0.02 });
      text(ctx, 'CANTEIROS', 540, 590 + s2 * 2.08, { fam: DISPLAY, size: s2, weight: 900, color: C.lime, align: 'center', ls: -s2 * 0.02 });
      // celular com o topo real do site, que se apaga antes do rodapé da capa
      ctx.save(); ctx.translate(0, 920 - PY);
      phone(ctx, 0, (cc) => { drawPage(cc, 0, 0); header(cc, 0); }, 0);
      ctx.restore();
      const fg = ctx.createLinearGradient(0, 1250, 0, 1545);
      fg.addColorStop(0, 'rgba(5,6,6,0)'); fg.addColorStop(1, 'rgba(5,6,6,1)');
      ctx.fillStyle = fg; ctx.fillRect(0, 1250, W, 296); ctx.fillStyle = C.bg; ctx.fillRect(0, 1545, W, H - 1545);
    },

    cues(api) {
      const cue = api.cue;
      cue(0, 'open');
      cue(0.05, 'rise', { d: 0.9 });
      cue(1.9, 'slide');
      cue(CORTE, 'slash');
      cue(CORTE + 0.15, 'pop');                                          // barra de endereço
      [0, CORTE + 0.04, TP.enviar + 0.28, T.chales + 0.4, T.viver + 0.2, T.dayuse + 0.15, T.chegar + 0.15].forEach((t) => cue(t, 'title'));
      SCROLL.forEach(([t0, t1], k) => cue(t0, 'swish', { d: +(t1 - t0).toFixed(3), k }));
      Object.entries(TP).forEach(([name, t], k) => cue(t, name === 'send' ? 'sendtap' : 'tap', { k, name }));
      cue(TP.send + 0.1, 'sent');                                      // no 8º de tempo da música (11,1 s)
      cue(TP.entrada + 0.05, 'sheet', { dir: 1 }); cue(TP.dia8 + 0.06, 'sheet', { dir: -1 });
      cue(TP.acomod + 0.05, 'sheet', { dir: 1 }); cue(TP.chale + 0.1, 'sheet', { dir: -1 });
      VAL.forEach((v, k) => cue(v.t, 'chip', { k }));
      cue(TP.enviar + 0.1, 'switch'); cue(T.chales, 'switch');
      cue(TP.ver + 0.05, 'modal'); cue(TP.fora + 0.05, 'modalclose');
      cue(TP.menu + 0.05, 'modal'); cue(TP.reservar + 0.05, 'modal'); cue(TP.fechar + 0.05, 'modalclose');
      let k = 0;
      [17.55, 17.85].forEach((t) => cue(t, 'ring', { k: k++ }));
      PAGE_RINGS.forEach((pr) => cue(pr.t0, 'ring', { k: k++ }));
      [25.2, 25.45, 25.7].forEach((t) => cue(t, 'ring', { k: k++ }));
      [29.25, 29.65].forEach((t) => cue(t, 'pin'));
      [T.chales, T.viver, T.dayuse, T.chegar, T.assinatura].forEach((t, i) => cue(t, 'section', { k: i }));
      cue(30.9, 'zoom', { d: 0.95 });
      cue(31.35, 'ring', { k: k++ });
      cue(T.cta, 'logo');
      cue(T.cta + 1.4, 'cta');
    },
  });
})();
