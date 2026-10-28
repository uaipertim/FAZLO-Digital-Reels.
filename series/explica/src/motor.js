/*
 * SÉRIE EXPLICA (FAZLO Digital) — motor de vídeos explicativos em capítulos, 60–90 s, 1080×1920, 60 fps.
 *
 * O episódio vem de episodios/<id>.json, já no tempo da narração (audio/<id>/linha.json, de scripts/linha.py).
 *
 * Recurso de progresso: "a página em construção".
 *   - Um celular em wireframe, pequeno e fixo no canto superior direito, com 7 blocos tracejados (as 7 partes do site).
 *   - Cada capítulo constrói a sua parte em tamanho grande no centro, peça por peça, na palavra da voz.
 *   - No fim do capítulo a parte encolhe, voa e se encaixa no bloco dela, que acende em lima com o número (01…07).
 *   - O cursor de editor (barra lima piscando) vai para o próximo bloco vazio.
 *   - A troca de capítulo é um corte diagonal na inclinação da barra do Z (dx/dy = −0,966), com "o corte" no som.
 *
 * Fixos em todos os quadros: a logo FAZLO DIGITAL do kit oficial + o @ do roteiro no topo, e o celular do canto.
 * Cada capítulo: rótulo (Sora, lima), título de 2 linhas (Unbounded; a 2ª em lima), linha de apoio (Sora, cinza) que
 * muda a cada frase, e o diagrama da parte. O fundo muda levemente de tom por capítulo.
 *
 * Biblioteca de diagramas (CENAS): capa · topo · consulta · quartos · incluso · mapa · mensagem · celular · fecho.
 * Collab ("progresso": "pedidos"): capa_collab · pedido · fecho_collab, com a lista dos pedidos no canto no lugar do
 * celular de 7 blocos e as telas REAIS do site (PNGs em linha.telas) dentro de um celular genérico.
 * Áreas seguras: conteúdo entre y 265 e 1456; nada na coluna de botões (x ≥ 950, y 1060–1560); a capa é o quadro 0.
 * Legenda palavra por palavra (opcional, "legenda": true no roteiro; tools/legenda-palavras/): por cima de tudo, na faixa
 * y 1300–1450, até o corte da logo final. Com ela ligada, a linha de apoio não aparece e os diagramas encolhem para caber
 * até y ≈ 1250 (a mesma escala na parte, no voo dela e no celular do fecho). Prévia sem mexer no roteiro: &legenda=1.
 */
(function () {
  'use strict';

  const W = 1080, H = 1920;
  const DISPLAY = "'FZD Display', sans-serif";      // Unbounded
  const TEXT = "'FZD Text', sans-serif";            // Sora
  const C = {
    lime: '#C6FA41', white: '#FFFFFF', ink: '#0A0C0B', apoio: '#A2A8AD', gray: '#7E858B', dim: '#4C5358',
    line: '#2A3034', panel: '#0C0F11', card: '#12161A', card2: '#181D21', dash: '#4A5157',
  };
  // o fundo de cada capítulo: variações escuras na família da marca (base + onde fica a luz lima, bem fraca)
  const TONS = {
    palco: { bg: '#050606', luz: [0.78, 0.20], k: 0.050 },
    ardosia: { bg: '#05080A', luz: [0.20, 0.30], k: 0.045 },
    musgo: { bg: '#070A06', luz: [0.80, 0.62], k: 0.055 },
    carvao: { bg: '#090908', luz: [0.25, 0.70], k: 0.040 },
    abismo: { bg: '#04090A', luz: [0.70, 0.40], k: 0.045 },
    oliva: { bg: '#080A05', luz: [0.30, 0.45], k: 0.055 },
    noite: { bg: '#06070A', luz: [0.75, 0.75], k: 0.045 },
    grafite: { bg: '#08090A', luz: [0.22, 0.22], k: 0.045 },
  };
  const SLOPE = -0.966;                              // a inclinação da barra do Z: dx/dy (≈ 46°)
  const BTN = { x: 950, y0: 1060, y1: 1560 };
  const L = { x0: 80, rotY: 418, l1max: 700, l2max: 860, tmax: 66, apoioS: 32, apoioMax: 860, diaTop: 750, diaBot: 1440 };
  // o celular do canto (unidades locais; no canto, escala 1)
  const WIRE = { w: 120, h: 228, r: 20, blocos: [[22, 36], [62, 18], [84, 32], [120, 24], [148, 26], [178, 18], [200, 20]] };

  // ---------------------------------------------------------------- utilitários
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const p = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: (x, s = 1.6) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)),
    expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  };
  const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const css = (h, a = 1) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixHex = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const pulse = (t, a, d = 0.6) => (t < a || t > a + d ? 0 : Math.sin(Math.PI * (t - a) / d));
  const blink = (t, t0 = 0) => ((t - t0) * 1.9) % 1 < 0.56;

  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function setFont(c, fam, size, weight, ls = 0) { c.font = `${weight} ${size}px ${fam}`; c.letterSpacing = `${ls}px`; }
  let M = null;                                       // contexto só para medir
  function tw(s, fam, size, weight, ls = 0) { setFont(M, fam, size, weight, ls); return M.measureText(s).width - (s.length ? ls : 0); }
  function txt(c, s, x, y, o = {}) {
    const fam = o.fam || TEXT, size = o.size || 32, weight = o.weight || 500, ls = o.ls || 0;
    const w = tw(s, fam, size, weight, ls);
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const a = o.alpha ?? 1;
    if (a > 0.002) {
      c.save(); setFont(c, fam, size, weight, ls); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.globalAlpha *= a; c.fillStyle = o.color || C.white;
      if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 20; }
      c.fillText(s, x0, y); c.restore();
    }
    if (o.box && a > 0.5) boxHere(c, o.box, x0, y - size * 0.78, x0 + w, y + size * 0.24);
    return w;
  }
  function fit(lines, fam, weight, maxWs, maxS, minS = 30) {
    let s = maxS;
    while (s > minS && lines.some((l, i) => tw(l, fam, s, weight) > maxWs[Math.min(i, maxWs.length - 1)])) s -= 1;
    return s;
  }
  function wrap(s, fam, size, weight, maxW) {
    const ws = s.split(/\s+/), rows = [''];
    ws.forEach((w) => { const cand = rows[rows.length - 1] ? rows[rows.length - 1] + ' ' + w : w; if (tw(cand, fam, size, weight) > maxW && rows[rows.length - 1]) rows.push(w); else rows[rows.length - 1] = cand; });
    return rows;
  }
  const typo = (s) => (s || '').replace(/"([^"]*)"/g, '“$1”').replace(/'([^']*)'/g, '‘$1’');

  // ---------------------------------------------------------------- caixas (para a revisão das áreas seguras)
  let COLLECT = null, CUR_CAP = 0, MINI = 0;            // MINI > 0: desenhando miniaturas (sem caixas próprias)
  function BOX(nome, x0, y0, x1, y1) {
    if (!COLLECT) return;
    const m = COLLECT.m;                               // a transformação atual
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    COLLECT.out.push({ nome, cap: CUR_CAP, x0: Math.min(...pts.map((q) => q[0])), x1: Math.max(...pts.map((q) => q[0])), y0: Math.min(...pts.map((q) => q[1])), y1: Math.max(...pts.map((q) => q[1])) });
  }
  const boxHere = (c, nome, x0, y0, x1, y1) => { if (COLLECT && !MINI) { COLLECT.m = c.getTransform(); BOX(nome, x0, y0, x1, y1); } };

  // ---------------------------------------------------------------- ícones (traço, grade de 24; desenho próprio da FAZLO)
  const ICON = {
    cafe: 'M5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z M16 10.8h1.4a2.4 2.4 0 0 1 0 4.8H16 M8.6 3.6c-.9 1.2.9 1.9 0 3.2 M12.4 3.6c-.9 1.2.9 1.9 0 3.2',
    relogio: 'M12 3.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8z M12 7.6V12l2.9 1.9',
    pino: 'M12 21.2s-6.4-6.1-6.4-11a6.4 6.4 0 0 1 12.8 0c0 4.9-6.4 11-6.4 11z M12 7.7a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z',
    pessoa: 'M12 3.8a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z M4.8 20.4c0-3.8 3.2-6.4 7.2-6.4s7.2 2.6 7.2 6.4',
    calendario: 'M4.6 5.8h14.8v13.8H4.6z M4.6 10h14.8 M8.6 3.4v4.4 M15.4 3.4v4.4',
    mais: 'M12 6.2v11.6 M6.2 12h11.6',
    menos: 'M6.2 12h11.6',
    salvar: 'M7 3.6h10v16.8l-5-3.9-5 3.9z',
    enviar: 'M3.4 11.4 20.6 3.8l-6.2 16.6-3.2-6.6z M11.2 13.8l9.4-10',
    comentar: 'M4 5h16v11.2h-9.6l-4.6 3.6v-3.6H4z',
    lupa: 'M10.4 3.8a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2z M15.2 15.2l5 5 M10.4 7.6v5.6 M7.6 10.4h5.6',
    raio: 'M13.2 3 6.4 13.4h5.2L10.6 21l7-10.6h-5.2z',
    largura: 'M3.6 12h16.8 M7.2 8.4 3.6 12l3.6 3.6 M16.8 8.4l3.6 3.6-3.6 3.6 M3.6 4.5v3 M20.4 4.5v3 M3.6 16.5v3 M20.4 16.5v3',
    check: 'M5 12.6l4.3 4.3L19 7.4',
    casa: 'M4 11.2 12 4.6l8 6.6 M6.4 9.4v10h11.2v-10 M10.2 19.4v-4.6h3.6v4.6',
    menu: 'M4 7h16 M4 12h16 M4 17h10',
    imagem: 'M3.8 5h16.4v14H3.8z M3.8 16l5-5 4 4 2.6-2.6 4.8 4.6 M15.6 8.4a1.4 1.4 0 1 1 0 .01',
  };
  const ICON2D = {};
  function icon(c, name, x, y, s, col, o = {}) {
    if (!ICON2D[name]) ICON2D[name] = new Path2D(ICON[name]);
    c.save(); c.translate(x, y); const k = s / 24; c.scale(k, k); c.translate(-12, -12);
    c.lineWidth = o.lw || 2.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
    c.globalAlpha *= o.alpha ?? 1;
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = (o.glowB || 16) / k; }
    if (o.fill) { c.fillStyle = o.fill; c.fill(ICON2D[name]); }
    c.stroke(ICON2D[name]); c.restore();
  }
  function pata(c, x, y, s, col, a = 1) {                 // a pata do "aceita pet" (elipses)
    c.save(); c.translate(x, y); c.scale(s / 24, s / 24); c.globalAlpha *= a; c.fillStyle = col;
    c.beginPath(); c.ellipse(0, 4, 5.4, 4.4, 0, 0, 7); c.fill();
    [[-6.6, -2.4, -0.4], [-2.4, -6.6, -0.15], [2.4, -6.6, 0.15], [6.6, -2.4, 0.4]].forEach(([px, py, r]) => { c.beginPath(); c.ellipse(px, py, 2.1, 2.7, r, 0, 7); c.fill(); });
    c.restore();
  }

  // ---------------------------------------------------------------- formas da marca
  // a barra do Z: paralelogramo com lados horizontais e laterais na inclinação da marca
  function barraZ(c, x, y, w, h) {                       // (x, y) = canto superior esquerdo da caixa; w = largura de um lado horizontal
    const dx = -SLOPE * h;                               // quanto o topo avança para a direita
    c.beginPath(); c.moveTo(x + dx, y); c.lineTo(x + dx + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath();
  }
  // corte diagonal: x da linha na altura y quando a linha passa por xc em y = H/2
  const linhaX = (xc, y) => xc + SLOPE * (y - H / 2);
  function clipEsquerda(c, xc) {                        // região à esquerda da linha diagonal
    c.beginPath(); c.moveTo(-20, -20); c.lineTo(linhaX(xc, -20), -20); c.lineTo(linhaX(xc, H + 20), H + 20); c.lineTo(-20, H + 20); c.closePath(); c.clip();
  }
  function clipDireita(c, xc) {
    c.beginPath(); c.moveTo(linhaX(xc, -20), -20); c.lineTo(W + 20, -20); c.lineTo(W + 20, H + 20); c.lineTo(linhaX(xc, H + 20), H + 20); c.closePath(); c.clip();
  }
  // revela da esquerda para a direita com a borda na inclinação da marca (texto fatiado, fotos)
  function clipRevela(c, x0, y0, w, h, q) {
    const ext = -SLOPE * h + 4, xc = lerp(x0 - ext, x0 + w + ext, q), yc = y0 + h / 2;
    const xl = (y) => xc + SLOPE * (y - yc);
    c.beginPath(); c.moveTo(x0 - ext - 10, y0 - 4); c.lineTo(xl(y0 - 4), y0 - 4); c.lineTo(xl(y0 + h + 4), y0 + h + 4); c.lineTo(x0 - ext - 10, y0 + h + 4); c.closePath(); c.clip();
  }

  // ---------------------------------------------------------------- logo oficial (SVG do kit, sem redesenho)
  let LOGO = null;
  function parseLogo(svgText) {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    const paths = [...doc.querySelectorAll('path')].map((q) => ({ fill: q.getAttribute('fill'), p: new Path2D(q.getAttribute('d')) }));
    LOGO = { vb, paths, bb: { x0: 14, x1: 586.5, y0: 26, y1: 151.5 } };    // caixa do desenho medida no SVG (sem a margem do viewBox)
  }
  // a logo com a caixa do desenho começando em (x, y) e largura w
  function drawLogo(c, x, y, w, a = 1) {
    if (!LOGO || a <= 0.01) return { w: 0, h: 0 };
    const { bb } = LOGO, s = w / (bb.x1 - bb.x0);
    c.save(); c.globalAlpha *= a; c.translate(x - bb.x0 * s, y - bb.y0 * s); c.scale(s, s);
    LOGO.paths.forEach((q) => { c.fillStyle = q.fill; c.fill(q.p, 'evenodd'); });
    c.restore();
    return { w, h: (bb.y1 - bb.y0) * s };
  }
  const logoH = (w) => (LOGO ? (LOGO.bb.y1 - LOGO.bb.y0) * w / (LOGO.bb.x1 - LOGO.bb.x0) : 0);

  // =====================================================================
  // EPISÓDIO
  // =====================================================================
  let EP = null, CAPS = [], DURATION = 10, CUES = [], WARN = [];
  // legenda ligada: os diagramas (de y ≈ 740–1450) vão para y 650–1250, em escala, centrados em x = 540
  let LEG = null, LEGON = false;
  const DIA = { A: 740, B: 650, k: (1250 - 650) / (1450 - 740) };
  // uma cena pode ter a própria âncora (CENAS.<tipo>.dia): ex. o pedido do collab, cujo cartão fica no lugar (y 446)
  const diaDe = (tipo) => (CENAS[tipo] && CENAS[tipo].dia) || DIA;
  const diaM = (c, D = DIA) => { c.translate(540, D.B); c.scale(D.k, D.k); c.translate(-540, -D.A); };
  const mapR = (R, D = DIA) => ({ ...R, x: 540 + (R.x - 540) * D.k, y: D.B + (R.y - D.A) * D.k, w: R.w * D.k, h: R.h * D.k });
  const mapW = (P, D = DIA) => ({ ...P, x: 540 + (P.x - 540) * D.k, y: D.B + (P.y - D.A) * D.k, s: P.s * D.k });
  const MARCA = { x: 80, y: 287, w: 176 };

  // a palavra da fala que dispara uma peça: "palavra", "palavra#2", "+1.2" (s depois do início do capítulo), "fim"
  function at(cap, spec, def) {
    if (spec == null) return def ?? cap.voz_t0 + 0.6;
    if (typeof spec === 'number') return cap.t0 + spec;
    const s = String(spec);
    if (s[0] === '+') return cap.t0 + parseFloat(s.slice(1));
    if (s === 'fim') return cap.voz_t1;
    const [w, k] = s.split('#'), alvo = norm(w), nth = parseInt(k || '1', 10);
    const hits = cap.palavras.filter((x) => x.n === alvo);
    if (hits.length >= nth) return hits[nth - 1].t0;
    WARN.push(`capítulo ${cap.n}: a palavra "${s}" não está na fala`);
    return def ?? cap.voz_t0 + 0.6;
  }
  const fimDe = (cap, spec) => { const s = norm(String(spec)); const h = cap.palavras.find((x) => x.n === s); return h ? h.t1 : at(cap, spec) + 0.3; };
  const cue = (t, type, extra = {}) => CUES.push({ t: Math.round(t * 1000) / 1000, type, ...extra });

  // ---------------------------------------------------------------- tempo global: quem está na tela
  function capAt(t) {                                   // o capítulo dono do instante (o corte pertence ao capítulo que entra)
    let n = 0;
    for (let i = 1; i < CAPS.length; i++) if (t >= CAPS[i].corte[0]) n = i;
    return n;
  }
  const ULT = () => CAPS[CAPS.length - 1];

  // ---------------------------------------------------------------- o celular em construção (estado no tempo t)
  function wireState(t) {
    const st = { lit: [], building: -1, cursor: null };
    for (let k = 1; k <= 7 && k < CAPS.length; k++) {
      const c = CAPS[k];
      if (c.voo && t >= c.voo[1]) st.lit.push({ i: k - 1, t: c.voo[1] });
      else if (c.voo && t >= (c.corte ? c.corte[0] : 0) && st.building < 0) st.building = k - 1;
    }
    if (st.building < 0 && !st.lit.length && t >= CAPS[0].S.cursorOn) st.building = 0;
    // o cursor: aparece no bloco 01 na palavra "montar" do capítulo 0; anda para o próximo vazio depois de cada encaixe
    const c0 = CAPS[0];
    if (t >= c0.S.cursorOn) {
      let pos = 0, moving = false, tm = 0;
      for (let k = 1; k <= 7 && k < CAPS.length; k++) {
        const c = CAPS[k];
        if (!c.cursor) continue;
        if (t >= c.cursor[1]) pos = k;
        else if (t >= c.cursor[0]) { pos = lerp(k - 1, k, E.io(p(t, c.cursor[0], c.cursor[1]))); moving = true; tm = c.cursor[0]; }
      }
      const a = pos >= 6.5 ? 1 - clamp((pos - 6) / 1) : 1;            // sem bloco vazio: o cursor some (e reaparece no comentário do fecho)
      if (a > 0.01) st.cursor = { pos, moving, t0: moving ? tm : c0.S.cursorOn, a };
    }
    return st;
  }
  // geometria: onde o celular está (canto, centro da capa, centro do fecho)
  function wirePlace(t) {
    const c0 = CAPS[0], f = ULT();
    const capa = c0.S.wire, canto = CANTO;
    if (t < c0.voo[0]) return capa;
    if (t < c0.voo[1]) { const q = E.io(p(t, c0.voo[0], c0.voo[1])); return { x: lerp(capa.x, canto.x, q), y: lerp(capa.y, canto.y, q) - Math.sin(q * Math.PI) * 40, s: lerp(capa.s, canto.s, q) }; }
    if (f.S && f.S.wire && t >= f.S.cresce) {
      const q = E.io(p(t, f.S.cresce, f.S.cresce + 0.7)), g = f.S.wire;
      return { x: lerp(canto.x, g.x, q), y: lerp(canto.y, g.y, q), s: lerp(canto.s, g.s, q) };
    }
    return canto;
  }
  const CANTO = { x: 808, y: 270, s: 1.1 };           // o celular fixo no canto superior direito (x 808–940, y 270–521)
  const blocoRect = (pl, i) => { const [by, bh] = WIRE.blocos[i]; return { x: pl.x + 10 * pl.s, y: pl.y + by * pl.s, w: 100 * pl.s, h: bh * pl.s }; };

  function drawWire(c, t, pl, o = {}) {
    const st = wireState(t), s = pl.s;
    c.save(); c.translate(pl.x, pl.y); c.scale(s, s);
    // o aparelho
    rr(c, 0, 0, WIRE.w, WIRE.h, WIRE.r); c.fillStyle = css('#090C0D', 0.92); c.fill();
    c.lineWidth = 2.4; c.strokeStyle = 'rgba(255,255,255,0.34)'; c.stroke();
    rr(c, WIRE.w / 2 - 15, 8, 30, 5, 2.5); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill();
    // os blocos
    WIRE.blocos.forEach(([by, bh], i) => {
      const lit = st.lit.find((q) => q.i === i), x = 10, w = 100;
      if (lit) {
        const pop = E.back(p(t, lit.t, lit.t + 0.32), 2.2), g = pulse(t, lit.t, 0.7);
        c.save(); c.translate(x + w / 2, by + bh / 2); c.scale(lerp(1.18, 1, pop), lerp(1.18, 1, pop)); c.translate(-(x + w / 2), -(by + bh / 2));
        if (g > 0) { c.shadowColor = css(C.lime, 0.9); c.shadowBlur = 22 * g; }
        rr(c, x, by, w, bh, 4); c.fillStyle = C.lime; c.fill(); c.shadowBlur = 0;
        const fs = Math.min(13, bh * 0.62);
        txt(c, String(i + 1).padStart(2, '0'), x + 7, by + bh / 2 + fs * 0.36, { fam: TEXT, size: fs, weight: 700, color: C.ink, ls: 0.5 });
        c.restore();
      } else {
        const b = st.building === i && !o.semConstrucao;
        c.save(); c.setLineDash([4, 3]); c.lineWidth = 1.4;
        c.strokeStyle = b ? css(C.lime, 0.55 + 0.3 * Math.sin(t * 5)) : css(C.dash, 0.95);
        rr(c, x + 0.7, by + 0.7, w - 1.4, bh - 1.4, 4); c.stroke(); c.restore();
      }
    });
    // o cursor de editor
    if (st.cursor && !o.semCursor) {
      const k = st.cursor.pos, i0 = Math.min(6, Math.floor(k)), i1 = Math.min(6, i0 + 1), f = k - Math.floor(k);
      const [y0, h0] = WIRE.blocos[i0], [y1, h1] = WIRE.blocos[i1];
      const cy = lerp(y0 + h0 / 2, y1 + h1 / 2, k >= 6 ? 0 : f), ch = Math.min(14, lerp(h0, h1, k >= 6 ? 0 : f) - 7);
      if (st.cursor.moving || blink(t, st.cursor.t0)) {
        c.save(); c.globalAlpha *= st.cursor.a; c.fillStyle = C.lime; c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 8;
        c.fillRect(16, cy - ch / 2 + (k >= 6 ? (k - 6) * 18 : 0), 2.6, ch); c.restore();
      }
    }
    c.restore();
    boxHere(c, 'celular do canto', pl.x, pl.y, pl.x + WIRE.w * s, pl.y + WIRE.h * s);
  }

  // ---------------------------------------------------------------- fundo
  function drawBg(c, tom, t, parado) {
    const T = TONS[tom] || TONS.palco;
    c.fillStyle = T.bg; c.fillRect(0, 0, W, H);
    const dx = parado ? 0 : Math.sin(t * 0.21) * 40, dy = parado ? 0 : Math.cos(t * 0.17) * 30;
    let g = c.createRadialGradient(T.luz[0] * W + dx, T.luz[1] * H + dy, 0, T.luz[0] * W + dx, T.luz[1] * H + dy, 900);
    g.addColorStop(0, css(C.lime, T.k)); g.addColorStop(1, css(C.lime, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient((1 - T.luz[0]) * W, (1 - T.luz[1]) * H, 0, (1 - T.luz[0]) * W, (1 - T.luz[1]) * H, 1000);
    g.addColorStop(0, 'rgba(255,255,255,0.022)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // hachura fina na inclinação da barra do Z, deslizando devagar ao longo dela
    c.save(); c.strokeStyle = 'rgba(255,255,255,0.026)'; c.lineWidth = 1.4;
    const gap = 54, off = parado ? 0 : (t * 9) % gap, ext = -SLOPE * H;
    c.beginPath();
    for (let x = -ext - gap + off; x < W + gap; x += gap) { c.moveTo(x + ext, 0); c.lineTo(x, H); }
    c.stroke(); c.restore();
    g = c.createRadialGradient(W / 2, H * 0.52, H * 0.35, W / 2, H * 0.52, H * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- a marca fixa no topo
  function drawMarca(c, a = 1) {
    if (a <= 0.01) return;
    const d = drawLogo(c, MARCA.x, MARCA.y, MARCA.w, a);
    const x = MARCA.x + d.w + 22, base = MARCA.y + d.h * 0.765;
    c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x, MARCA.y + 4, 1.6, d.h - 8); c.restore();
    const w = txt(c, EP.marca, x + 20, base, { size: 24, weight: 500, color: C.apoio, alpha: a });
    boxHere(c, 'marca', MARCA.x, MARCA.y, x + 20 + w, MARCA.y + d.h);
  }

  // ---------------------------------------------------------------- rótulo, título, apoio
  function drawRotulo(c, cap, t) {
    const q = E.out(p(t, cap.t0 - 0.06, cap.t0 + 0.4));
    if (q <= 0) return;
    c.save(); c.globalAlpha *= q; c.translate((1 - q) * -24, 0);
    let x = L.x0;
    barraZ(c, x, L.rotY - 20, 9, 22); c.fillStyle = C.lime; c.fill(); x += 9 + 21 + 14;
    const k = PEDIDOS() ? (cap.diagrama.tipo === 'pedido' ? cap.S.k : 0) : (cap.n >= 1 && cap.n <= 7 ? cap.n : 0);
    const num = k ? String(k).padStart(2, '0') : null;
    if (num) { x += txt(c, num, x, L.rotY, { size: 24, weight: 700, color: C.lime, ls: 2 }) + 16; }
    const w = txt(c, cap.rotulo, x, L.rotY, { size: 24, weight: 600, color: C.lime, ls: 4, alpha: num ? 0.92 : 1 });
    c.restore();
    if (q > 0.6) boxHere(c, 'rótulo', L.x0, L.rotY - 22, x + w, L.rotY + 6);
  }
  function layoutTitulo(cap) {
    if (!cap.titulo) { cap.lay = { tl: null, apoioY: L.rotY + 80 }; return; }
    const [a, b] = cap.titulo.map(typo);
    const s = fit([a, b], DISPLAY, 800, [L.l1max, L.l2max], L.tmax, 36);
    const b1 = L.rotY + 34 + s * 0.92, b2 = b1 + s * 1.13;
    const apoioY = b2 + 72;
    cap.lay = { tl: [a, b], ts: s, b1, b2, apoioY };
  }
  function drawTitulo(c, cap, t) {
    if (!cap.lay.tl) return;
    const { tl, ts, b1, b2 } = cap.lay;
    [b1, b2].forEach((by, i) => {
      const t0 = cap.t0 + 0.02 + 0.1 * i, q = E.out(p(t, t0, t0 + 0.55));
      if (q <= 0) return;
      const w = tw(tl[i], DISPLAY, ts, 800);
      c.save(); clipRevela(c, L.x0, by - ts * 0.95, w, ts * 1.25, Math.min(1, q * 1.05));
      txt(c, tl[i], L.x0 - (1 - q) * 30, by, { fam: DISPLAY, size: ts, weight: 800, color: i ? C.lime : C.white });
      c.restore();
      if (q > 0.6) boxHere(c, `título ${i + 1}`, L.x0, by - ts * 0.78, L.x0 + w, by + ts * 0.24);
    });
  }
  function drawApoio(c, cap, t, y) {
    if (LEGON) return;                                  // com a legenda ligada, a linha de apoio não aparece
    const AP = EP.apoio;
    cap.apoios.forEach((a, i) => {
      if (t < a.t || t > a.ate + 0.5) return;
      const qi = E.out(p(t, a.t, a.t + AP.entra)), qo = a.sai ? 1 - p(t, a.ate - AP.sai, a.ate) : 1;
      const al = qi * qo;
      if (al <= 0.005) return;
      const rows = wrap(typo(a.texto), TEXT, L.apoioS, 400, L.apoioMax);
      rows.forEach((r, k) => txt(c, r, L.x0, y + k * 42 + (1 - qi) * 16, { size: L.apoioS, weight: 400, color: C.apoio, alpha: al, box: 'apoio' }));
    });
  }

  // ---------------------------------------------------------------- peças prontas
  function painel(c, R, a = 1, o = {}) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a;
    rr(c, R.x, R.y, R.w, R.h, o.r ?? 28); c.fillStyle = o.fill || C.panel; c.fill();
    c.lineWidth = 2; c.strokeStyle = o.stroke || 'rgba(255,255,255,0.10)'; c.stroke();
    c.restore();
  }
  // entrada padrão: sobe 36 px, cresce de 0,97 e aparece
  function entra(c, t, t0, cx, cy, d = 0.5) {
    const q = E.out(p(t, t0, t0 + d));
    c.translate(cx, cy + (1 - q) * 36); const s = lerp(0.97, 1, q); c.scale(s, s); c.translate(-cx, -cy);
    c.globalAlpha *= clamp(q * 1.6);
    return q;
  }
  function tracejado(c, x, y, w, h, r, col = C.dash, a = 1) {
    c.save(); c.globalAlpha *= a; c.setLineDash([9, 7]); c.lineWidth = 2; c.strokeStyle = col; rr(c, x, y, w, h, r); c.stroke(); c.restore();
  }
  function barra(c, x, y, w, h, q, col = C.lime, a = 1) {   // o "valor" como barra (sem número)
    if (q <= 0) return;
    c.save(); c.globalAlpha *= a; rr(c, x, y, Math.max(h, w * q), h, h / 2); c.fillStyle = col; c.fill(); c.restore();
  }
  // etiqueta (chip): apagada = tracejada e cinza; acesa = lima com texto escuro
  function chip(c, s, x, y, o = {}) {
    const size = o.size || 22, ls = o.ls ?? 2.5, h = o.h || 50, padX = o.pad || 22;
    const iw = o.icone ? size + 10 : 0;
    const w = tw(s, TEXT, size, 700, ls) + padX * 2 + iw;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const on = o.on ?? 0, a = o.alpha ?? 1;
    if (a <= 0.01) return w;
    c.save(); c.globalAlpha *= a;
    if (on > 0) {
      if (o.glow !== false) { c.shadowColor = css(C.lime, 0.7 * on); c.shadowBlur = 24 * pulse(o.t ?? 0, o.ton ?? -9, 0.9) + 6 * on; }
      rr(c, x0, y, w, h, h / 2); c.fillStyle = css(C.lime, on); c.fill(); c.shadowBlur = 0;
    }
    if (on < 1) { c.save(); c.globalAlpha *= 1 - on; c.setLineDash(o.solido ? [] : [7, 5]); c.lineWidth = 2; c.strokeStyle = o.cor || C.dash; rr(c, x0 + 1, y + 1, w - 2, h - 2, h / 2 - 1); c.stroke(); c.restore(); }
    const col = on > 0.5 ? C.ink : (o.corTexto || C.gray);
    if (o.icone) icon(c, o.icone, x0 + padX + size / 2, y + h / 2, size + 2, col, { lw: 2.4 });
    txt(c, s, x0 + padX + iw, y + h / 2 + size * 0.36, { size, weight: 700, ls, color: col });
    c.restore();
    if (a > 0.6) boxHere(c, 'etiqueta ' + s, x0, y, x0 + w, y + h);
    return w;
  }
  const chipW = (s, o = {}) => tw(s, TEXT, o.size || 22, 700, o.ls ?? 2.5) + (o.pad || 22) * 2 + (o.icone ? (o.size || 22) + 10 : 0);
  function checkMark(c, x, y, s, q, col = C.lime, lw = 4) {   // o check desenhado aos poucos
    if (q <= 0) return;
    const pts = [[-0.42, 0.02], [-0.12, 0.32], [0.44, -0.3]];
    const L1 = Math.hypot(0.3, 0.3), L2 = Math.hypot(0.56, 0.62), d = q * (L1 + L2);
    c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = lw / s; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
    c.beginPath(); c.moveTo(...pts[0]);
    if (d <= L1) c.lineTo(lerp(pts[0][0], pts[1][0], d / L1), lerp(pts[0][1], pts[1][1], d / L1));
    else { c.lineTo(...pts[1]); const f = (d - L1) / L2; c.lineTo(lerp(pts[1][0], pts[2][0], f), lerp(pts[1][1], pts[2][1], f)); }
    c.stroke(); c.restore();
  }
  function selo(c, x, y, r, q, t, t0) {                   // círculo lima com check escuro
    if (q <= 0) return;
    const s = E.back(q, 2);
    c.save(); c.translate(x, y); c.scale(s, s);
    const g = pulse(t, t0, 0.8);
    c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 26 * g;
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = C.lime; c.fill(); c.shadowBlur = 0;
    checkMark(c, 0, 0, r * 1.25, p(q, 0.2, 1), C.ink, r * 0.2);
    c.restore();
  }
  function anel(c, x, y, r0, t, t0, d = 0.6, col = C.lime) {   // onda que se expande (acendeu, chegou)
    const q = p(t, t0, t0 + d);
    if (q <= 0 || q >= 1) return;
    c.save(); c.globalAlpha *= (1 - q) * 0.8; c.lineWidth = 3; c.strokeStyle = col;
    c.beginPath(); c.arc(x, y, r0 + E.out(q) * r0 * 1.4, 0, 7); c.stroke(); c.restore();
  }
  function balao(c, x, y, w, h, o = {}) {                 // balão de fala genérico (sem marca de app); cauda em baixo
    c.save();
    rr(c, x, y, w, h, o.r ?? 22); c.fillStyle = o.fill || C.card2; c.fill();
    if (o.stroke) { c.lineWidth = 2; c.strokeStyle = o.stroke; c.stroke(); }
    const tx = o.cauda === 'dir' ? x + w - 34 : x + 30;
    c.beginPath(); c.moveTo(tx, y + h - 2); c.lineTo(tx + (o.cauda === 'dir' ? 16 : -4), y + h + 16); c.lineTo(tx + (o.cauda === 'dir' ? -2 : 18), y + h - 2); c.closePath();
    c.fillStyle = o.fill || C.card2; c.fill();
    c.restore();
  }

  // ---------------------------------------------------------------- ilustrações genéricas
  function paisagem(c, x, y, w, h, t) {
    c.save(); rr(c, x, y, w, h, 18); c.clip();
    const z = 1 + 0.05 * (1 - clamp(t)); c.translate(x + w / 2, y + h / 2); c.scale(z, z); c.translate(-(x + w / 2), -(y + h / 2));
    let g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0C1813'); g.addColorStop(0.55, '#1C2E1D'); g.addColorStop(1, '#253A20');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    const sx = x + w * 0.72, sy = y + h * 0.33, sr = h * 0.13;
    g = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 4.2); g.addColorStop(0, css(C.lime, 0.35)); g.addColorStop(1, css(C.lime, 0)); c.fillStyle = g; c.fillRect(x, y, w, h);
    c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fillStyle = C.lime; c.fill();
    const morro = (pts, col, rim) => {
      c.beginPath(); c.moveTo(x - 10, y + h + 10);
      pts.forEach(([u, v], i) => { const px = x + u * w, py = y + v * h; if (i === 0) c.lineTo(px, py); else { const [u0, v0] = pts[i - 1]; c.quadraticCurveTo(x + (u0 + u) / 2 * w, y + Math.min(v0, v) * h - h * 0.05, px, py); } });
      c.lineTo(x + w + 10, y + h + 10); c.closePath(); c.fillStyle = col; c.fill();
      if (rim) { c.lineWidth = 2.5; c.strokeStyle = css(C.lime, rim); c.stroke(); }
    };
    morro([[-0.05, 0.55], [0.18, 0.38], [0.42, 0.5], [0.66, 0.36], [0.9, 0.48], [1.05, 0.42]], '#1E3823', 0.22);
    morro([[-0.05, 0.7], [0.2, 0.56], [0.48, 0.66], [0.75, 0.55], [1.05, 0.66]], '#2B4D26', 0.35);
    // a casinha da pousada
    const hx = x + w * 0.3, hy = y + h * 0.66, hw = w * 0.085;
    c.fillStyle = '#E9EEEA'; c.fillRect(hx, hy, hw, hw * 0.7);
    c.beginPath(); c.moveTo(hx - hw * 0.12, hy + 1); c.lineTo(hx + hw / 2, hy - hw * 0.45); c.lineTo(hx + hw * 1.12, hy + 1); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill();
    c.fillStyle = C.lime; c.fillRect(hx + hw * 0.36, hy + hw * 0.24, hw * 0.28, hw * 0.24);
    morro([[-0.05, 0.86], [0.3, 0.76], [0.62, 0.84], [1.05, 0.74]], '#3A6A2A', 0.5);
    // a água
    g = c.createLinearGradient(0, y + h * 0.88, 0, y + h); g.addColorStop(0, '#10241B'); g.addColorStop(1, '#0B1813');
    c.fillStyle = g; c.fillRect(x, y + h * 0.9, w, h * 0.1);
    c.strokeStyle = css(C.lime, 0.5); c.lineWidth = 2;
    [[0.15, 0.94, 0.08], [0.55, 0.96, 0.12], [0.78, 0.93, 0.06]].forEach(([u, v, l]) => { c.beginPath(); c.moveTo(x + u * w, y + v * h); c.lineTo(x + (u + l) * w, y + v * h); c.stroke(); });
    c.restore();
  }
  function quarto(c, x, y, w, h, variante) {
    c.save(); rr(c, x, y, w, h, 14); c.clip();
    c.fillStyle = '#1A1F22'; c.fillRect(x, y, w, h);
    c.fillStyle = '#14181B'; c.fillRect(x, y + h * 0.72, w, h * 0.28);                 // o piso
    // a janela com luz
    const jx = x + w * (variante ? 0.12 : 0.6), jw = w * 0.28, jy = y + h * 0.12, jh = h * 0.36;
    const g = c.createLinearGradient(jx, jy, jx, jy + jh); g.addColorStop(0, css(C.lime, 0.55)); g.addColorStop(1, css(C.lime, 0.18));
    c.fillStyle = g; c.fillRect(jx, jy, jw, jh);
    c.strokeStyle = '#2C3338'; c.lineWidth = 4; c.strokeRect(jx, jy, jw, jh); c.beginPath(); c.moveTo(jx + jw / 2, jy); c.lineTo(jx + jw / 2, jy + jh); c.stroke();
    const cama = (bx, bw, cor) => {
      const by = y + h * 0.5;
      c.fillStyle = '#2B3236'; rr(c, bx, by - h * 0.1, bw, h * 0.2, 8); c.fill();               // cabeceira
      c.fillStyle = '#E6EBE8'; rr(c, bx - 6, by + h * 0.06, bw + 12, h * 0.2, 8); c.fill();      // colchão
      c.fillStyle = cor; rr(c, bx - 6, by + h * 0.14, bw + 12, h * 0.16, 8); c.fill();           // a manta
      c.fillStyle = '#FFFFFF'; const np = bw > w * 0.4 ? 2 : 1;
      for (let k = 0; k < np; k++) { rr(c, bx + 8 + k * (bw / np), by - h * 0.01, bw / np - 16, h * 0.08, 10); c.fill(); }
    };
    if (variante === 0) { cama(x + w * 0.08, w * 0.46, C.lime); cama(x + w * 0.66, w * 0.24, '#8FB33A'); }
    else cama(x + w * 0.42, w * 0.48, C.lime);
    c.restore();
  }

  // =====================================================================
  // CENAS (a biblioteca de diagramas)
  //   setup(cap) -> S: tempos (com at(cap, "palavra")), geometria, cues; S.parte = a caixa que voa até o bloco
  //   parte(c, cap, S, t): desenha a parte (dentro de S.parte);  extra(c, cap, S, t): o que fica fora dela
  // =====================================================================
  const CENAS = {};

  // ---- capa (capítulo 0): rótulo em pílula, título grande, o celular vazio no centro e a faixa "em 7 partes."
  CENAS.capa = {
    setup(cap) {
      const d = cap.diagrama, S = {};
      const lines = cap.titulo.map(typo);
      S.ts = fit(lines, DISPLAY, 800, [920], 84, 40);
      S.chipY = 468;
      S.b1 = S.chipY + 50 + 40 + S.ts * 0.8; S.b2 = S.b1 + S.ts * 1.1;
      S.apoioY = S.b2 + 74;
      S.wire = { x: 540 - WIRE.w * 1.25, y: S.apoioY + 46, s: 2.5 };
      if (LEGON) { const y = S.b2 + 56, s = Math.min(2.5, (1250 - y) / WIRE.h); S.wire = { x: 540 - (WIRE.w * s) / 2, y, s }; }   // sem apoio: sobe e cabe até y 1250
      S.faixaY = S.wire.y + WIRE.h * S.wire.s * 0.7;
      S.conta = at(cap, d.conta && d.conta.em);
      S.cursorOn = at(cap, d.monta && d.monta.em);
      S.faixaSai = cap.voo[0] - 0.4;
      for (let k = 0; k < 7; k++) cue(S.conta + 0.09 * k, 'conta', { k });
      cue(S.cursorOn, 'cursor_on');
      cue(S.faixaSai, 'faixa_sai');
      cue(cap.voo[0], 'encolhe'); cue(cap.voo[1], 'pousa');
      cap.lay = { apoioY: S.apoioY };
      return S;
    },
    draw(c, cap, S, t) {
      // o rótulo em pílula (vale como chip da capa)
      chip(c, cap.rotulo, L.x0, S.chipY, { on: 0, size: 22, ls: 4, h: 50, cor: C.lime, corTexto: C.lime, solido: true });
      const lines = cap.titulo.map(typo);
      [S.b1, S.b2].forEach((by, i) => txt(c, lines[i], L.x0, by, { fam: DISPLAY, size: S.ts, weight: 800, color: i ? C.lime : C.white, box: `título ${i + 1}` }));
      // os blocos acendem em sequência na palavra "sete"
      // (o celular grande é desenhado pelo motor; aqui só o brilho por cima)
    },
    faixa(c, cap, S, t) {
      const q = 1 - E.in(p(t, S.faixaSai, S.faixaSai + 0.35));
      if (q <= 0) return;
      const s = typo(cap.diagrama.faixa), size = 54, w = tw(s, DISPLAY, size, 800) + 70, h = 92;
      const x = 540 - w / 2 - (-SLOPE * h) / 2 + (1 - q) * 700, y = S.faixaY;
      c.save(); c.globalAlpha *= clamp(q * 2);
      c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
      barraZ(c, x, y, w, h); c.fillStyle = C.lime; c.fill(); c.shadowColor = 'transparent';
      txt(c, s, x + (-SLOPE * h) / 2 + w / 2, y + h / 2 + size * 0.36, { fam: DISPLAY, size, weight: 800, color: C.ink, align: 'center' });
      c.restore();
      if (q > 0.6) boxHere(c, 'faixa', x, y, x + w + -SLOPE * h, y + h);
    },
    brilhoBlocos(c, cap, S, t, pl) {                    // "sete partes": os 7 blocos piscam em lima, um depois do outro
      for (let k = 0; k < 7; k++) {
        const a = pulse(t, S.conta + 0.09 * k, 0.55);
        if (a <= 0) continue;
        const R = blocoRect(pl, k);
        c.save(); c.globalAlpha *= a * 0.9; rr(c, R.x, R.y, R.w, R.h, 4 * pl.s); c.fillStyle = C.lime; c.fill();
        txt(c, String(k + 1).padStart(2, '0'), R.x + 7 * pl.s, R.y + R.h / 2 + Math.min(13, R.h / pl.s * 0.62) * pl.s * 0.36, { size: Math.min(13, R.h / pl.s * 0.62) * pl.s, weight: 700, color: C.ink });
        c.restore();
      }
    },
  };

  // ---- topo (cap 1): foto ilustrada, "Sua Pousada" e a cidade; três etiquetas acendem nas palavras
  CENAS.topo = {
    setup(cap) {
      const d = cap.diagrama, S = { parte: { x: 100, y: 770, w: 820, h: 486 } };
      S.ent = at(cap, d.quadro.em);
      S.mostra = at(cap, d.mostra_etiquetas, S.ent + 1.5);
      S.et = d.etiquetas.map((e) => ({ t: e.t, on: at(cap, e.em) }));
      S.foto = at(cap, d.foto.em); S.nome = at(cap, d.nome.em); S.cidade = at(cap, d.cidade.em);
      cue(S.ent, 'monta'); cue(S.mostra, 'etiquetas');
      S.et.forEach((e, i) => cue(e.on, 'acende', { k: i }));
      cue(S.foto, 'foto'); cue(S.nome, 'digita', { d: 0.4 }); cue(S.cidade, 'pino');
      S.pecas = [S.ent, S.foto, S.cidade];
      return S;
    },
    parte(c, cap, S, t) {
      const R = S.parte;
      c.save();
      if (entra(c, t, S.ent, R.x + R.w / 2, R.y + R.h / 2) <= 0) { c.restore(); return; }
      painel(c, R);
      // barra do site: menu e um ponto
      icon(c, 'menu', R.x + 46, R.y + 38, 30, C.gray);
      c.beginPath(); c.arc(R.x + R.w - 46, R.y + 38, 9, 0, 7); c.fillStyle = C.dim; c.fill();
      const F = { x: R.x + 24, y: R.y + 72, w: R.w - 48, h: 298 };
      // QUE LUGAR / POR QUE apontam a foto; ONDE aponta a cidade
      const realce = (i) => pulse(t, S.et[i].on, 0.75);
      const qf = E.io(p(t, S.foto, S.foto + 0.6));
      if (qf < 1) {
        tracejado(c, F.x, F.y, F.w, F.h, 18, C.dash, 1);
        icon(c, 'imagem', F.x + F.w / 2, F.y + F.h / 2, 64, C.dim, { lw: 1.8 });
      }
      if (qf > 0) { c.save(); clipRevela(c, F.x, F.y, F.w, F.h, qf); paisagem(c, F.x, F.y, F.w, F.h, p(t, S.foto, S.foto + 6)); c.restore(); }
      const hl = Math.max(realce(0), realce(2));
      if (hl > 0) { c.save(); c.globalAlpha *= hl; c.lineWidth = 4; c.strokeStyle = C.lime; rr(c, F.x - 3, F.y - 3, F.w + 6, F.h + 6, 20); c.stroke(); c.restore(); }
      boxHere(c, 'foto', F.x, F.y, F.x + F.w, F.y + F.h);
      // o nome (digitado) e a cidade (com o pino)
      const nb = F.y + F.h + 62, cb = nb + 42;
      const nome = cap.diagrama.nome.t, qn = p(t, S.nome, S.nome + 0.42);
      if (qn < 1) { c.fillStyle = C.line; rr(c, R.x + 28, nb - 30, 330 * (1 - qn) + 4, 26, 13); c.fill(); }
      if (qn > 0) txt(c, nome.slice(0, Math.ceil(nome.length * qn)), R.x + 28, nb, { fam: DISPLAY, size: 40, weight: 800, box: 'nome' });
      const qc = E.out(p(t, S.cidade, S.cidade + 0.45));
      const hc = realce(1);
      if (qc < 1) { c.fillStyle = C.line; rr(c, R.x + 28, cb - 20, 210, 18, 9); c.fill(); }
      if (hc > 0) { c.save(); c.globalAlpha *= hc; c.lineWidth = 3; c.strokeStyle = C.lime; rr(c, R.x + 20, cb - 30, 228, 38, 12); c.stroke(); c.restore(); }
      if (qc > 0) {
        c.save(); c.globalAlpha *= qc;
        icon(c, 'pino', R.x + 42, cb - 10 - (1 - E.back(qc)) * 26, 28, C.lime, { lw: 2.4 });
        txt(c, cap.diagrama.cidade.t, R.x + 66, cb, { size: 27, weight: 500, color: C.apoio, box: 'cidade' });
        c.restore();
      }
      c.restore();
    },
    extra(c, cap, S, t) {
      const fora = 1 - p(t, cap.voo[0] - 0.3, cap.voo[0]);
      if (t < S.mostra || fora <= 0) return;
      const ws = S.et.map((e) => chipW(e.t)), gap = 18, tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
      let x = 510 - tot / 2;
      S.et.forEach((e, i) => {
        const q = E.out(p(t, S.mostra + i * 0.08, S.mostra + i * 0.08 + 0.4));
        const on = E.out(p(t, e.on, e.on + 0.25));
        c.save(); c.translate(0, (1 - q) * 20);
        chip(c, e.t, x, S.parte.y + S.parte.h + 34, { on, alpha: q * fora, t, ton: e.on });
        c.restore();
        x += ws[i] + gap;
      });
    },
  };

  // ---- consulta (cap 2): o card de consulta montado campo a campo e o botão "Consultar" acendendo
  CENAS.consulta = {
    setup(cap) {
      const d = cap.diagrama, S = { parte: { x: 100, y: 868, w: 820, h: 452 } };
      S.ent = at(cap, d.cartao.em);
      S.topo = at(cap, d.topo.em);
      S.perg = at(cap, d.balao ? d.balao.em : 'pergunta', S.ent + 1.4);       // o balão "tem vaga?"
      S.campos = d.campos.map((f) => ({ ...f, on: at(cap, f.em), mais: (f.mais || []).map((m) => at(cap, m)) }));
      S.botao = at(cap, d.botao.em) + (d.botao.depois || 0);
      S.esq = fimDe(cap, d.esqueleto || 'datas') + 0.1;            // os campos aparecem vazios (tracejados) no fim da 1ª frase
      cue(S.esq, 'esqueleto');
      cue(S.ent, 'monta'); cue(S.perg, 'balao'); cue(S.topo, 'surge');
      S.campos.forEach((f, i) => { cue(f.on, 'campo', { k: i }); f.mais.forEach((m) => cue(m, 'mais')); });
      cue(S.botao, 'botao');
      S.pecas = [S.ent, S.campos[0].on, S.botao];
      return S;
    },
    parte(c, cap, S, t) {
      const R = S.parte;
      c.save();
      if (entra(c, t, S.ent, R.x + R.w / 2, R.y + R.h / 2) <= 0) { c.restore(); return; }
      painel(c, R);
      txt(c, cap.diagrama.cartao.t, R.x + 36, R.y + 58, { size: 30, weight: 600, box: 'cabeçalho da consulta' });
      const campo = (f, x, y, w, h, i) => {
        const qs = E.out(p(t, S.esq + i * 0.09, S.esq + i * 0.09 + 0.35)), q = E.out(p(t, f.on, f.on + 0.35));
        if (q < 1 && qs > 0) { tracejado(c, x, y, w, h, 18, C.dash, qs * (1 - q)); txt(c, f.t, x + 22, y + 36, { size: 17, weight: 700, ls: 2.5, color: C.dim, alpha: qs * (1 - q) }); }
        if (q <= 0) return;
        c.save(); c.globalAlpha *= q; c.translate(0, (1 - q) * 18);
        rr(c, x, y, w, h, 18); c.fillStyle = C.card; c.fill();
        const cheio = E.out(p(t, f.on + 0.12, f.on + 0.55));
        c.lineWidth = 2; c.strokeStyle = css(C.lime, 0.15 + 0.5 * pulse(t, f.on + 0.1, 0.8)); c.stroke();
        txt(c, f.t, x + 22, y + 36, { size: 17, weight: 700, ls: 2.5, color: C.gray });
        if (f.tipo === 'data') {
          icon(c, 'calendario', x + 38, y + h - 34, 30, C.lime, { lw: 2.2 });
          barra(c, x + 66, y + h - 44, w - 110, 20, cheio);
        } else {
          const n = 1 + f.mais.filter((m) => t >= m).length;
          for (let k = 0; k < n; k++) {
            const qk = k === 0 ? cheio : E.back(p(t, f.mais[k - 1], f.mais[k - 1] + 0.3));
            icon(c, 'pessoa', x + 40 + k * 40, y + h - 36, 32, C.lime, { lw: 2.4, alpha: qk });
          }
          [['menos', w - 116], ['mais', w - 50]].forEach(([ic, dx], k) => {
            const pr = k === 1 ? Math.max(0, ...f.mais.map((m) => pulse(t, m - 0.05, 0.3))) : 0;
            c.beginPath(); c.arc(x + dx, y + h / 2 + 2, 24 - pr * 3, 0, 7); c.fillStyle = pr > 0 ? css(C.lime, 0.25 + 0.6 * pr) : C.card2; c.fill();
            c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();
            icon(c, ic, x + dx, y + h / 2 + 2, 26, C.white, { lw: 2.4 });
          });
        }
        c.restore();
        boxHere(c, 'campo ' + f.t, x, y, x + w, y + h);
      };
      const [f1, f2, f3] = S.campos;
      campo(f1, R.x + 36, R.y + 88, 364, 112, 0);
      campo(f2, R.x + 420, R.y + 88, 364, 112, 1);
      campo(f3, R.x + 36, R.y + 216, 748, 96, 2);
      // o botão Consultar: aparece tracejado com os campos vazios e acende
      const qb = E.out(p(t, S.esq + 0.27, S.esq + 0.62));
      if (qb > 0) {
        const on = E.out(p(t, S.botao, S.botao + 0.22)), B = { x: R.x + 36, y: R.y + 336, w: 748, h: 84 };
        const pr = pulse(t, S.botao, 0.25) * 0.04;
        c.save(); c.globalAlpha *= qb; c.translate(B.x + B.w / 2, B.y + B.h / 2); c.scale(1 - pr, 1 - pr); c.translate(-(B.x + B.w / 2), -(B.y + B.h / 2));
        if (on > 0) { c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 34 * pulse(t, S.botao, 1.0) + 8; rr(c, B.x, B.y, B.w, B.h, 42); c.fillStyle = css(C.lime, on); c.fill(); c.shadowBlur = 0; }
        if (on < 1) tracejado(c, B.x + 1, B.y + 1, B.w - 2, B.h - 2, 41, C.dash, 1 - on);
        txt(c, cap.diagrama.botao.t, B.x + B.w / 2, B.y + B.h / 2 + 11, { size: 31, weight: 700, color: on > 0.5 ? C.ink : C.gray, align: 'center' });
        c.restore();
        boxHere(c, 'botão', B.x, B.y, B.x + B.w, B.y + B.h);
      }
      c.restore();
    },
    extra(c, cap, S, t) {
      const fora = 1 - p(t, cap.voo[0] - 0.3, cap.voo[0]);
      // "tem vaga?": a pergunta de quem quer reservar (sai quando a fala diz onde fica a consulta)
      const qb = E.back(p(t, S.perg, S.perg + 0.35), 2) * (1 - p(t, S.topo - 0.35, S.topo - 0.05));
      if (qb > 0.01) {
        const s = typo(cap.titulo[1]), w = tw(s, TEXT, 32, 600) + 56, x = 900 - w, y = 774;
        c.save(); c.translate(x + w, y + 70); c.scale(qb, qb); c.translate(-(x + w), -(y + 70));
        balao(c, x, y, w, 66, { cauda: 'dir', fill: C.card2, stroke: 'rgba(255,255,255,0.12)' });
        txt(c, s, x + 28, y + 44, { size: 32, weight: 600, box: 'balão tem vaga' });
        c.restore();
      }
      // o topo, já montado, logo acima do card
      const qt = E.out(p(t, S.topo, S.topo + 0.45)) * fora;
      if (qt > 0.01) {
        const R = { x: 100, y: 772, w: 820, h: 70 };
        c.save(); c.globalAlpha *= qt; c.translate(0, (1 - qt) * -16);
        painel(c, R, 0.75, { r: 20 });
        c.save(); rr(c, R.x + 14, R.y + 12, 120, R.h - 24, 10); c.clip(); paisagem(c, R.x + 14, R.y + 12, 120, R.h - 24, 1); c.restore();
        txt(c, 'Sua Pousada', R.x + 156, R.y + 44, { fam: DISPLAY, size: 24, weight: 800, color: C.gray });
        txt(c, String(1).padStart(2, '0'), R.x + R.w - 30, R.y + 44, { size: 20, weight: 700, color: C.lime, align: 'right' });
        // a seta: a consulta vem logo abaixo do topo
        const qa = E.out(p(t, S.topo + 0.25, S.topo + 0.6));
        c.save(); c.globalAlpha *= qa; c.strokeStyle = C.lime; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
        const ax = 510, ay = R.y + R.h + 6;
        c.beginPath(); c.moveTo(ax - 12, ay + 2); c.lineTo(ax, ay + 14); c.lineTo(ax + 12, ay + 2); c.stroke(); c.restore();
        c.restore();
        if (qt > 0.6) boxHere(c, 'topo acima', R.x, R.y, R.x + R.w, R.y + R.h);
      }
    },
  };

  // ---- quartos (cap 3): dois cards de quarto (foto, "ATÉ N PESSOAS", "a partir de R$" com o valor como barra)
  CENAS.quartos = {
    setup(cap) {
      // peças ~15% maiores (altura, fotos e textos; a largura já vai de x 90 a 930) e centralizadas na vertical (y 790–1400)
      const d = cap.diagrama, S = { parte: { x: 90, y: 790, w: 840, h: 610 } };
      S.q = d.quartos.map((q) => ({ ...q, on: at(cap, q.em) + (q.atraso || 0) }));
      S.fotos = at(cap, d.fotos.em); S.cabe = at(cap, d.cabe.em); S.valor = at(cap, d.valor.em);
      S.destaque = at(cap, d.destaque.em); S.bolso = at(cap, d.bolso.em);
      S.q.forEach((q, i) => cue(q.on, 'monta', { k: i }));
      cue(S.fotos, 'foto'); cue(S.cabe, 'acende', { k: 0 }); cue(S.cabe + 0.12, 'acende', { k: 1 }); cue(S.valor, 'campo', { k: 0 });
      cue(S.destaque, 'brilho'); cue(S.bolso, 'check');
      S.pecas = [S.q[0].on, S.valor, S.bolso];
      return S;
    },
    parte(c, cap, S, t) {
      const R = S.parte;
      const qp = E.out(p(t, S.q[0].on, S.q[0].on + 0.5));
      if (qp <= 0) return;
      painel(c, R, qp * 0.9, { fill: css(C.panel, 0.85) });
      S.q.forEach((q, i) => {
        const x = R.x + 22 + i * 408, y = R.y + 22, w = 388, h = R.h - 44;
        c.save();
        if (entra(c, t, q.on, x + w / 2, y + h / 2) <= 0) { c.restore(); return; }
        rr(c, x, y, w, h, 22); c.fillStyle = C.card; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.08)'; c.stroke();
        const F = { x: x + 14, y: y + 14, w: w - 28, h: 284 };
        const qf = E.io(p(t, S.fotos + i * 0.15, S.fotos + i * 0.15 + 0.55));
        if (qf < 1) { tracejado(c, F.x, F.y, F.w, F.h, 14); icon(c, 'imagem', F.x + F.w / 2, F.y + F.h / 2, 62, C.dim, { lw: 1.8 }); }
        if (qf > 0) { c.save(); clipRevela(c, F.x, F.y, F.w, F.h, qf); quarto(c, F.x, F.y, F.w, F.h, i); c.restore(); }
        txt(c, q.t, x + 24, y + 352, { size: 33, weight: 600, box: 'quarto ' + (i + 1) });
        const qc = E.back(p(t, S.cabe + i * 0.12, S.cabe + i * 0.12 + 0.35), 1.8);
        if (qc > 0) {
          c.save(); c.translate(x + 24, y + 403); c.scale(qc, qc); c.translate(-(x + 24), -(y + 403));
          chip(c, q.cabe, x + 24, y + 378, { on: 0, solido: true, cor: css(C.lime, 0.7), corTexto: C.lime, size: 19, ls: 1.5, h: 50, pad: 18, icone: 'pessoa' });
          c.restore();
        }
        const qv = E.out(p(t, S.valor + i * 0.1, S.valor + i * 0.1 + 0.45));
        if (qv > 0) {
          const hi = E.out(p(t, S.destaque, S.destaque + 0.3));
          txt(c, typo(cap.diagrama.valor.t), x + 24, y + 484, { size: 25, weight: 500, color: mixHex(C.gray, C.white, hi), alpha: qv, box: 'preço ' + (i + 1) });
          c.save(); if (hi > 0) { c.shadowColor = css(C.lime, 0.9); c.shadowBlur = 20 * pulse(t, S.destaque, 1) + 4 * hi; }
          barra(c, x + 24, y + 503, 194, 23, qv); c.restore();
        }
        selo(c, x + w - 44, y + 44, 27, p(t, S.bolso + i * 0.12, S.bolso + i * 0.12 + 0.4), t, S.bolso + i * 0.12);
        c.restore();
      });
    },
    extra() {},
  };

  // ---- incluso (cap 4): balões "?" aparecem e somem enquanto os itens entram com check
  CENAS.incluso = {
    setup(cap) {
      // peças ~15% maiores e centralizadas na vertical (y 820–1366)
      const d = cap.diagrama, S = { parte: { x: 90, y: 820, w: 840, h: 546 } };
      S.ent = at(cap, d.lista.em);
      S.itens = d.itens.map((it) => ({ ...it, on: at(cap, it.em) }));
      S.perg = at(cap, d.perguntas.em); S.escrito = at(cap, d.escrito.em);
      cue(S.ent, 'monta');
      S.itens.forEach((it, i) => { cue(it.on - 0.5, 'balao'); cue(it.on, 'campo', { k: i }); cue(it.on + 0.25, 'estoura'); cue(it.on + 0.3, 'check'); });
      [0, 1, 2, 3].forEach((k) => cue(S.perg + 0.07 * k, 'balao'));
      cue(S.escrito, 'estoura'); cue(S.escrito + 0.05, 'brilho');
      S.pecas = [S.ent, S.itens[1].on, S.escrito];
      S.baloes = [[832, 782], [684, 764], [536, 780]];
      S.nuvem = [[150, 792], [330, 768], [872, 1398], [176, 1392]];
      return S;
    },
    parte(c, cap, S, t) {
      const R = S.parte;
      c.save();
      if (entra(c, t, S.ent, R.x + R.w / 2, R.y + R.h / 2) <= 0) { c.restore(); return; }
      const fl = pulse(t, S.escrito + 0.05, 0.9);
      painel(c, R, 1, { stroke: fl > 0 ? css(C.lime, 0.2 + 0.7 * fl) : undefined });
      txt(c, cap.diagrama.lista.t, R.x + 38, R.y + 66, { size: 34, weight: 600, box: 'cabeçalho incluso' });
      const ul = E.out(p(t, S.escrito, S.escrito + 0.5));
      if (ul > 0) { c.fillStyle = C.lime; c.fillRect(R.x + 38, R.y + 84, tw(cap.diagrama.lista.t, TEXT, 34, 600) * ul, 5); }
      S.itens.forEach((it, i) => {
        const x = R.x + 24, y = R.y + 110 + i * 142, w = R.w - 48, h = 126;
        const q = E.out(p(t, it.on, it.on + 0.4));
        if (q <= 0) return;
        c.save(); c.globalAlpha *= q; c.translate((1 - q) * -40, 0);
        rr(c, x, y, w, h, 18); c.fillStyle = C.card; c.fill();
        c.beginPath(); c.arc(x + 64, y + h / 2, 37, 0, 7); c.fillStyle = css(C.lime, 0.12); c.fill();
        if (it.icone === 'pet') pata(c, x + 64, y + h / 2 + 1, 35, C.lime);
        else icon(c, it.icone, x + 64, y + h / 2, 39, C.lime, { lw: 2.3 });
        txt(c, it.t, x + 124, y + h / 2 + 13, { size: 36, weight: 600, box: 'item ' + it.t });
        const qc = p(t, it.on + 0.3, it.on + 0.62);
        const cx = x + w - 58, cy = y + h / 2;
        if (qc < 1) { c.save(); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = C.dash; c.beginPath(); c.arc(cx, cy, 28, 0, 7); c.stroke(); c.restore(); }
        selo(c, cx, cy, 28, qc, t, it.on + 0.3);
        c.restore();
      });
      c.restore();
    },
    extra(c, cap, S, t) {
      const b = (x, y, t0, t1) => {
        const qi = E.back(p(t, t0, t0 + 0.3), 2.2), qo = p(t, t1, t1 + 0.22);
        if (qi <= 0 || qo >= 1) return;
        const s = 1.15 * qi * (1 + qo * 0.5);
        c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= 1 - qo;
        balao(c, -34, -30, 68, 58, { r: 20, fill: C.card2, stroke: 'rgba(255,255,255,0.12)' });
        txt(c, '?', 0, 12, { fam: DISPLAY, size: 34, weight: 800, color: C.lime, align: 'center' });
        c.restore();
        if (qo < 0.4 && qi > 0.6) boxHere(c, 'balão ?', x - 39, y - 35, x + 39, y + 51);
      };
      S.itens.forEach((it, i) => b(...S.baloes[i], it.on - 0.5, it.on + 0.25));
      S.nuvem.forEach(([x, y], k) => b(x, y, S.perg + 0.07 * k, S.escrito + 0.04 * k));
    },
  };

  // ---- mapa (cap 5): mapa abstrato, pino, rota pontilhada desenhando e as referências de quem é da região
  CENAS.mapa = {
    setup(cap) {
      const d = cap.diagrama, S = { parte: { x: 100, y: 772, w: 820, h: 566 } };
      S.ent = at(cap, d.mapa.em); S.pino = at(cap, d.pino.em) + (d.pino.depois || 0);
      S.rota0 = at(cap, d.rota.em); S.rota1 = Math.max(S.rota0 + 1.0, fimDe(cap, d.rota.ate));
      S.chips = d.chips.map((q) => ({ ...q, on: at(cap, q.em) }));
      S.chega = at(cap, 'chega', S.rota1 + 0.5); S.chegou = at(cap, d.chegou.em);
      if (S.chegou < S.chega + 0.6) S.chegou = S.chega + 0.6;
      cue(S.ent, 'monta'); cue(S.pino, 'pino'); cue(S.rota0, 'rota', { d: S.rota1 - S.rota0 });
      S.chips.forEach((q, i) => cue(q.on, 'acende', { k: i })); cue(S.chega, 'anda', { d: S.chegou - S.chega }); cue(S.chegou, 'check');
      // a rota (coordenadas relativas ao painel): sai de baixo à esquerda, cruza a ponte, passa pelo trecho de terra e chega ao pino
      S.rota = [[110, 492], [210, 470], [300, 420], [352, 360], [410, 318], [500, 296], [560, 250], [600, 196], [660, 160], [690, 146]];
      S.terra = [0.62, 0.9];            // fração da rota que é de terra
      // a ponte: onde a rota cruza o rio (o ponto da rota mais perto da curva do rio)
      const rio = (u) => { const P = [[-20, 250], [200, 300], [330, 470], [520, 600]], v = 1 - u; return [0, 1].map((k) => v * v * v * P[0][k] + 3 * v * v * u * P[1][k] + 3 * v * u * u * P[2][k] + u * u * u * P[3][k]); };
      let melhor = [1e9, 0.4];
      for (let i = 0; i <= 200; i++) { const [x, y] = this.ponto(S, i / 200); for (let j = 0; j <= 200; j++) { const [rx, ry] = rio(j / 200), d = Math.hypot(x - rx, y - ry); if (d < melhor[0]) melhor = [d, i / 200]; } }
      S.ponte = melhor[1];
      S.pecas = [S.ent, S.rota0, S.chegou];
      return S;
    },
    ponto(S, u) {                       // ponto na rota pela fração do comprimento
      const pts = S.rota, ls = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = ls.reduce((a, b) => a + b, 0);
      let d = u * tot;
      for (let i = 0; i < ls.length; i++) { if (d <= ls[i]) { const f = d / ls[i]; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), tot]; } d -= ls[i]; }
      return [...pts[pts.length - 1], tot];
    },
    trecho(c, S, R, u0, u1, n = 60) {
      c.beginPath();
      for (let k = 0; k <= n; k++) { const [x, y] = this.ponto(S, lerp(u0, u1, k / n)); if (k) c.lineTo(R.x + x, R.y + y); else c.moveTo(R.x + x, R.y + y); }
    },
    parte(c, cap, S, t) {
      const R = S.parte;
      c.save();
      if (entra(c, t, S.ent, R.x + R.w / 2, R.y + R.h / 2) <= 0) { c.restore(); return; }
      painel(c, R, 1, { fill: '#0B100E' });
      c.save(); rr(c, R.x, R.y, R.w, R.h, 28); c.clip();
      const qm = E.out(p(t, S.ent, S.ent + 0.9));
      // quadras
      c.globalAlpha *= qm;
      [[40, 40, 180, 120], [250, 60, 150, 90], [600, 300, 170, 120], [560, 440, 220, 100], [40, 230, 150, 110], [430, 470, 110, 80]].forEach(([x, y, w, h]) => { rr(c, R.x + x, R.y + y, w, h, 16); c.fillStyle = '#111814'; c.fill(); });
      // o rio
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(R.x - 20, R.y + 250); c.bezierCurveTo(R.x + 200, R.y + 300, R.x + 330, R.y + 470, R.x + 520, R.y + 600);
      c.lineWidth = 46; c.strokeStyle = '#0F2421'; c.stroke(); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.06)'; c.stroke();
      // ruas
      c.strokeStyle = '#242B30'; c.lineWidth = 16;
      [[[0, 520], [820, 380]], [[160, 0], [260, 566]], [[520, 0], [820, 220]]].forEach(([a, b]) => { c.beginPath(); c.moveTo(R.x + a[0], R.y + a[1]); c.lineTo(R.x + b[0], R.y + b[1]); c.stroke(); });
      // a estrada da rota (asfalto) e o trecho de terra (duplo, tracejado)
      c.lineWidth = 22; c.strokeStyle = '#2C343A'; this.trecho(c, S, R, 0, S.terra[0]); c.stroke();
      c.lineWidth = 20; c.strokeStyle = '#3A372C'; this.trecho(c, S, R, S.terra[0], 1); c.stroke();
      c.setLineDash([3, 9]); c.lineWidth = 3; c.strokeStyle = '#7A7460'; this.trecho(c, S, R, S.terra[0], 1); c.stroke(); c.setLineDash([]);
      // a ponte
      const [bx, by] = this.ponto(S, S.ponte);
      c.save(); c.translate(R.x + bx, R.y + by); c.rotate(-0.75); c.fillStyle = '#C9CFCC';
      c.fillRect(-30, -17, 60, 5); c.fillRect(-30, 12, 60, 5); c.restore();
      c.globalAlpha /= qm || 1;
      // a rota pontilhada
      const qr = p(t, S.rota0, S.rota1);
      if (qr > 0) {
        c.save(); c.setLineDash([2, 15]); c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = C.lime; c.shadowColor = css(C.lime, 0.6); c.shadowBlur = 10;
        this.trecho(c, S, R, 0, qr, 90); c.stroke(); c.restore();
        const [sx, sy] = this.ponto(S, 0);
        c.beginPath(); c.arc(R.x + sx, R.y + sy, 10, 0, 7); c.fillStyle = C.white; c.fill();
      }
      // o hóspede andando
      if (t >= S.chega) {
        const u = E.io(p(t, S.chega, S.chegou)), [hx, hy] = this.ponto(S, u);
        c.beginPath(); c.arc(R.x + hx, R.y + hy, 15, 0, 7); c.fillStyle = C.white; c.fill(); c.lineWidth = 5; c.strokeStyle = C.lime; c.stroke();
      }
      c.restore();
      // o pino
      const qp = p(t, S.pino, S.pino + 0.5);
      if (qp > 0) {
        const [px, py] = S.rota[S.rota.length - 1], X = R.x + px, Y = R.y + py, drop = (1 - E.back(qp, 2.4)) * -70;
        c.save(); c.globalAlpha *= clamp(qp * 3);
        c.beginPath(); c.ellipse(X, Y + 4, 16 * clamp(qp * 2), 6, 0, 0, 7); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
        c.translate(X, Y + drop);
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-8, -14, -26, -26, -26, -46); c.arc(0, -46, 26, Math.PI, 0); c.bezierCurveTo(26, -26, 8, -14, 0, 0); c.closePath();
        c.fillStyle = C.lime; c.shadowColor = css(C.lime, 0.7); c.shadowBlur = 16; c.fill(); c.shadowBlur = 0;
        c.beginPath(); c.arc(0, -46, 9, 0, 7); c.fillStyle = C.ink; c.fill();
        c.restore();
        anel(c, X, Y - 46, 30, t, S.chegou, 0.8);
        selo(c, X + 44, Y - 86, 20, p(t, S.chegou, S.chegou + 0.4), t, S.chegou);
        boxHere(c, 'pino', X - 26, Y - 72, X + 26, Y);
      }
      // as referências de quem é da região (dentro do mapa, com fio até o lugar)
      const lugares = [this.ponto(S, (S.terra[0] + S.terra[1]) / 2), this.ponto(S, S.ponte + 0.02)];
      const pos = [[R.x + 300, R.y + 40], [R.x + 40, R.y + 470]];
      S.chips.forEach((q, i) => {
        const qq = E.back(p(t, q.on, q.on + 0.35), 1.8);
        if (qq <= 0) return;
        const [lx, ly] = lugares[i], [cx, cy] = pos[i], w = chipW(q.t, { size: 19, ls: 1.8, pad: 18 });
        c.save(); c.globalAlpha *= clamp(qq);
        c.strokeStyle = css(C.lime, 0.8); c.lineWidth = 2.5; c.setLineDash([5, 5]);
        c.beginPath(); c.moveTo(cx + w / 2, R.y + ly < cy ? cy : cy + 46); c.lineTo(R.x + lx, R.y + ly); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(R.x + lx, R.y + ly, 7, 0, 7); c.fillStyle = C.lime; c.fill();
        c.translate(cx + w / 2, cy + 23); c.scale(qq, qq); c.translate(-(cx + w / 2), -(cy + 23));
        chip(c, q.t, cx, cy, { on: 1, size: 19, ls: 1.8, pad: 18, h: 46, t, ton: q.on });
        c.restore();
      });
      c.restore();
    },
    extra() {},
  };

  // ---- mensagem (cap 6): os dados da consulta voam até um balão de conversa genérico; check duplo no fim
  CENAS.mensagem = {
    setup(cap) {
      const d = cap.diagrama, S = { parte: { x: 100, y: 934, w: 820, h: 500 } };
      S.ent = at(cap, '+0.45'); S.chat = at(cap, 'mensagem', S.ent + 0.4);
      S.consulta = at(cap, d.consulta.em); S.balao = at(cap, d.balao.em);
      S.campos = d.campos.map((f) => ({ ...f, on: at(cap, f.em) }));
      S.visto = at(cap, d.visto.em);
      cue(S.ent, 'monta'); cue(S.chat, 'monta', { k: 1 }); cue(S.consulta, 'botao'); cue(S.balao, 'mensagem');
      S.campos.forEach((f, i) => { cue(f.on, 'voa', { k: i }); cue(f.on + 0.42, 'encaixa', { k: i }); });
      cue(S.visto, 'visto'); cue(S.visto + 0.35, 'digitando');
      S.card = { x: 100, y: 770, w: 820, h: 138 };
      S.pecas = [S.chat, S.campos[0].on, S.visto];
      return S;
    },
    // as três peças de dado, desenhadas em (x, y) com largura w
    dado(c, i, x, y, w, a = 1) {
      c.save(); c.globalAlpha *= a;
      if (i === 0) { icon(c, 'calendario', x + 16, y + 18, 28, C.lime); barra(c, x + 40, y + 9, (w - 60) * 0.44, 18, 1); txt(c, '→', x + 46 + (w - 60) * 0.44, y + 25, { size: 22, weight: 600, color: C.gray }); barra(c, x + 76 + (w - 60) * 0.44, y + 9, (w - 60) * 0.44 - 20, 18, 1); }
      else if (i === 1) { icon(c, 'pessoa', x + 16, y + 18, 30, C.lime, { lw: 2.4 }); icon(c, 'pessoa', x + 52, y + 18, 30, C.lime, { lw: 2.4 }); }
      else chip(c, 'Quarto Casal', x, y - 4, { on: 0, solido: true, cor: css(C.lime, 0.7), corTexto: C.lime, size: 17, ls: 0.5, h: 42, pad: 16 });
      c.restore();
    },
    extra(c, cap, S, t) {
      const fora = 1 - p(t, cap.voo[0] - 0.3, cap.voo[0]);
      if (fora <= 0) return;
      const K = S.card;
      c.save(); c.globalAlpha *= fora;
      if (entra(c, t, S.ent, K.x + K.w / 2, K.y + K.h / 2) > 0) {
        painel(c, K, 1, { r: 24 });
        txt(c, 'Consulte as datas', K.x + 28, K.y + 40, { size: 20, weight: 600, color: C.gray });
        const cols = [[K.x + 28, 236], [K.x + 290, 130], [K.x + 446, 190]];
        S.campos.forEach((f, i) => {
          const [x, w] = cols[i];
          txt(c, f.t, x, K.y + 76, { size: 14, weight: 700, ls: 2, color: C.gray });
          const saiu = t >= f.on;
          this.dado(c, i, x, K.y + 92, w, saiu ? 0.25 : 1);
        });
        const on = pulse(t, S.consulta, 0.7), B = { x: K.x + K.w - 186, y: K.y + 70, w: 158, h: 52 };
        c.save(); if (on > 0) { c.shadowColor = css(C.lime, 0.9); c.shadowBlur = 30 * on; }
        rr(c, B.x, B.y, B.w, B.h, 26); c.fillStyle = C.lime; c.fill(); c.restore();
        txt(c, 'Consultar', B.x + B.w / 2, B.y + 34, { size: 21, weight: 700, color: C.ink, align: 'center' });
        boxHere(c, 'card da consulta', K.x, K.y, K.x + K.w, K.y + K.h);
      }
      c.restore();
      // os dados voando do card para o balão
      const cols = [[K.x + 28, 236], [K.x + 290, 130], [K.x + 446, 190]];
      S.campos.forEach((f, i) => {
        const q = p(t, f.on, f.on + 0.42);
        if (q <= 0 || q >= 1) return;
        const [x0, w0] = cols[i], y0 = K.y + 92, slot = this.slot(S, i);
        const e = E.io(q), x = lerp(x0, slot.x + 12, e), y = lerp(y0, slot.y + 16, e) - Math.sin(e * Math.PI) * 90;
        c.save(); c.shadowColor = css(C.lime, 0.6); c.shadowBlur = 18; this.dado(c, i, x, y, lerp(w0, slot.w - 24, e)); c.restore();
      });
    },
    slot(S, i) { const R = S.parte; return { x: R.x + 330, y: R.y + 170 + i * 72, w: 430, h: 60 }; },
    parte(c, cap, S, t) {
      const R = S.parte;
      c.save();
      if (entra(c, t, S.chat, R.x + R.w / 2, R.y + R.h / 2) <= 0) { c.restore(); return; }
      painel(c, R, 1, { fill: '#0B0E10' });
      // cabeçalho da conversa: avatar genérico + "Sua Pousada"
      c.beginPath(); c.arc(R.x + 54, R.y + 46, 26, 0, 7); c.fillStyle = C.card2; c.fill();
      icon(c, 'casa', R.x + 54, R.y + 46, 28, C.lime);
      txt(c, 'Sua Pousada', R.x + 96, R.y + 56, { size: 28, weight: 600, box: 'cabeçalho da conversa' });
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(R.x, R.y + 92, R.w, 2);
      // o balão do hóspede (à direita), com os campos que se preenchem
      const qb = E.back(p(t, S.balao, S.balao + 0.4), 1.4);
      if (qb > 0) {
        const B = { x: R.x + 300, y: R.y + 112, w: 490, h: 336 };
        c.save(); c.translate(B.x + B.w, B.y + B.h); c.scale(qb, qb); c.translate(-(B.x + B.w), -(B.y + B.h));
        balao(c, B.x, B.y, B.w, B.h, { cauda: 'dir', fill: '#1B2318', stroke: css(C.lime, 0.25) });
        txt(c, cap.diagrama.balao.t, B.x + 30, B.y + 44, { size: 25, weight: 500, box: 'mensagem' });
        S.campos.forEach((f, i) => {
          const sl = this.slot(S, i), dentro = t >= f.on + 0.42;
          txt(c, f.t, B.x + 30, sl.y + 37, { size: 14, weight: 700, ls: 2, color: C.gray });
          const sl2 = { ...sl, x: B.x + 140, w: B.w - 170 };
          if (!dentro) tracejado(c, sl2.x, sl2.y, sl2.w, sl2.h, 14, css(C.white, 0.22));
          else {
            const k = pulse(t, f.on + 0.42, 0.5);
            rr(c, sl2.x, sl2.y, sl2.w, sl2.h, 14); c.fillStyle = css(C.lime, 0.08 + 0.2 * k); c.fill();
            this.dado(c, i, sl2.x + 12, sl2.y + 16, sl2.w - 24);
          }
        });
        // o check duplo
        const qv = p(t, S.visto, S.visto + 0.45);
        if (qv > 0) {
          checkMark(c, B.x + B.w - 66, B.y + B.h - 26, 22, clamp(qv * 2), C.lime, 3.4);
          checkMark(c, B.x + B.w - 52, B.y + B.h - 26, 22, clamp(qv * 2 - 0.6), C.lime, 3.4);
        }
        c.restore();
      }
      // a resposta da pousada começando (três pontos)
      const qd = E.out(p(t, S.visto + 0.35, S.visto + 0.7));
      if (qd > 0) {
        const D = { x: R.x + 34, y: R.y + R.h - 64, w: 118, h: 48 };
        c.save(); c.globalAlpha *= qd; rr(c, D.x, D.y, D.w, D.h, 24); c.fillStyle = C.card2; c.fill();
        for (let k = 0; k < 3; k++) { const b = 0.5 + 0.5 * Math.sin(t * 9 - k * 0.9); c.beginPath(); c.arc(D.x + 34 + k * 25, D.y + 24 - b * 4, 6, 0, 7); c.fillStyle = css(C.white, 0.4 + 0.5 * b); c.fill(); }
        c.restore();
      }
      c.restore();
    },
  };

  // ---- celular (cap 7): o celular rola por todas as partes, carrega rápido, cabe na tela, zoom riscado
  CENAS.celular = {
    setup(cap) {
      const d = cap.diagrama, S = {};
      S.ent = at(cap, d.celular.em);
      S.rola0 = at(cap, d.rola.em); S.rola1 = Math.max(S.rola0 + 1.6, fimDe(cap, d.rola.ate));
      S.carrega = at(cap, d.carrega.em); S.cabe = at(cap, d.cabe.em); S.zoom = at(cap, d.zoom.em);
      S.desloca = at(cap, 'abrir', S.carrega - 0.4) - 0.25;
      S.recarrega = S.carrega - 0.35;
      cue(S.ent, 'monta'); cue(S.rola0, 'rola', { d: S.rola1 - S.rola0 }); cue(S.desloca, 'surge');
      cue(S.recarrega, 'carrega', { d: 0.6 }); cue(S.cabe, 'encaixa', { k: 0 }); cue(S.zoom, 'risca');
      [S.carrega, S.cabe, S.zoom].forEach((tt, i) => cue(tt, 'acende', { k: i }));
      S.fones = [{ x: 370, y: 776, w: 340, h: 650 }, { x: 572, y: 776, w: 340, h: 650 }];
      S.parte = S.fones[1];
      S.pecas = [S.ent, S.rola0, S.zoom];
      return S;
    },
    fone(S, t) { const q = E.io(p(t, S.desloca, S.desloca + 0.5)); const [a, b] = S.fones; return { x: lerp(a.x, b.x, q), y: a.y, w: a.w, h: a.h }; },
    // a página inteira: as partes já montadas, em miniatura
    pagina(c, x, y, w) {
      const s = w / 820;
      let yy = y;
      for (let k = 1; k <= 6; k++) {
        const cap = CAPS[k], S = cap.S, R = S.parte;
        c.save(); c.translate(x, yy); c.scale(s, s); c.translate(-R.x, -R.y);
        MINI++; CENAS[cap.diagrama.tipo].parte(c, cap, S, cap.voo[0] - 0.02); MINI--;
        c.restore();
        yy += R.h * s + 10;
      }
      return yy - y;
    },
    parte(c, cap, S, t) {
      const q = E.out(p(t, S.ent, S.ent + 0.55));
      if (q <= 0) return;
      const F = t >= (cap.voo ? cap.voo[0] : 1e9) ? S.parte : this.fone(S, t);
      c.save(); c.globalAlpha *= clamp(q * 1.5); c.translate(0, (1 - q) * 60);
      rr(c, F.x, F.y, F.w, F.h, 48); c.fillStyle = '#080B0C'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke();
      rr(c, F.x + F.w / 2 - 44, F.y + 16, 88, 14, 7); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fill();
      const T = { x: F.x + 14, y: F.y + 42, w: F.w - 28, h: F.h - 56 };
      c.save(); rr(c, T.x, T.y, T.w, T.h, 30); c.clip(); c.fillStyle = '#050606'; c.fillRect(T.x, T.y, T.w, T.h);
      // recarrega: some, barra curta, volta no topo
      const rec = p(t, S.recarrega, S.recarrega + 0.15) * (1 - p(t, S.carrega + 0.3, S.carrega + 0.5));
      const altura = this.alturaPag || (this.alturaPag = (() => { let h = 0; for (let k = 1; k <= 6; k++) h += CAPS[k].S.parte.h * (T.w - 20) / 820 + 10; return h; })());
      const max = Math.max(0, altura - T.h + 20);
      const rolou = E.io(p(t, S.rola0, S.rola1)), volta = t >= S.recarrega + 0.15 ? 1 : 0;
      const off = max * rolou * (1 - volta);
      // cabe na tela: antes de "caber", a página está larga demais (passa da tela); encaixa na palavra
      const larga = t < S.cabe ? (t >= S.carrega + 0.3 ? 1 : 0) : 1 - E.back(p(t, S.cabe, S.cabe + 0.4), 1.4);
      const lw = (T.w - 20) * (1 + 0.32 * larga);
      c.globalAlpha *= 1 - rec;
      this.pagina(c, T.x + 10 - (lw - (T.w - 20)) / 2, T.y + 10 - off, lw);
      c.globalAlpha /= (1 - rec) || 1;
      const ld = p(t, S.recarrega + 0.1, S.carrega + 0.3);
      if (ld > 0 && ld < 1 || (t > S.recarrega && t < S.carrega + 0.4)) { c.fillStyle = C.lime; c.fillRect(T.x, T.y, T.w * E.out(ld), 7); }
      c.restore();
      // os colchetes de largura acendem quando a página cabe
      const g = pulse(t, S.cabe + 0.2, 0.9);
      if (g > 0) { c.save(); c.globalAlpha *= g; c.strokeStyle = C.lime; c.lineWidth = 5; c.lineCap = 'round';
        [[T.x - 4, 1], [T.x + T.w + 4, -1]].forEach(([x, dir]) => { c.beginPath(); c.moveTo(x + dir * 14, T.y + T.h / 2 - 60); c.lineTo(x, T.y + T.h / 2 - 60); c.lineTo(x, T.y + T.h / 2 + 60); c.lineTo(x + dir * 14, T.y + T.h / 2 + 60); c.stroke(); });
        c.restore(); }
      c.restore();
      if (q > 0.6) boxHere(c, 'celular grande', F.x, F.y + (1 - q) * 60, F.x + F.w, F.y + F.h + (1 - q) * 60);
    },
    extra(c, cap, S, t) {
      const fora = 1 - p(t, cap.voo[0] - 0.3, cap.voo[0]);
      if (fora <= 0) return;
      const linhas = [['raio', 'Abre rápido', S.carrega], ['largura', 'Cabe na tela', S.cabe], ['lupa', 'Sem zoom', S.zoom]];
      linhas.forEach(([ic, s, on], i) => {
        const q = E.out(p(t, on - 0.15, on + 0.3));
        if (q <= 0) return;
        const x = 100, y = 880 + i * 168;
        c.save(); c.globalAlpha *= q * fora; c.translate((1 - q) * -30, 0);
        const g = pulse(t, on, 0.9);
        c.beginPath(); c.arc(x + 44, y + 44, 42, 0, 7); c.fillStyle = css(C.lime, 0.14 + 0.2 * g); c.fill();
        c.lineWidth = 2.5; c.strokeStyle = css(C.lime, 0.6); c.stroke();
        icon(c, ic, x + 44, y + 44, 40, C.lime, { lw: 2.4 });
        if (ic === 'lupa') { const qr = E.out(p(t, on + 0.1, on + 0.45)); if (qr > 0) { c.save(); c.strokeStyle = C.white; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 14, y + 14); c.lineTo(x + 14 + 60 * qr, y + 14 + 60 * qr); c.stroke(); c.restore(); } }
        txt(c, s, x + 108, y + 56, { size: 32, weight: 600, box: 'indicador ' + s });
        if (ic === 'raio') { c.fillStyle = C.line; rr(c, x + 108, y + 76, 200, 10, 5); c.fill(); barra(c, x + 108, y + 76, 200, 10, E.out(p(t, S.recarrega + 0.1, S.carrega + 0.3))); }
        c.restore();
      });
    },
  };

  // ---- fecho: o celular completo cresce no centro, salvar/enviar/comentar acendem, "__ de 7" com o cursor; depois só a logo
  CENAS.fecho = {
    setup(cap) {
      const d = cap.diagrama, S = {};
      S.cresce = at(cap, d.cresce.em);
      S.wire = { x: 112, y: 790, s: 2.2 };
      S.acoes = d.acoes.map((a) => ({ ...a, on: at(cap, a.em) }));
      S.coment = at(cap, d.comentario.em);
      cue(S.cresce, 'cresce');
      S.acoes.forEach((a, i) => cue(a.on, 'acao', { k: i }));
      cue(S.coment, 'digita', { d: 0.45 });
      cue(S.coment + 0.5, 'cursor_on');
      cue(cap.corte_logo[0], 'logo');
      S.pecas = [S.cresce, S.acoes[0].on, S.coment];
      return S;
    },
    extra(c, cap, S, t) {
      S.acoes.forEach((a, i) => {
        const x = 470, y = 800 + i * 150, q = E.out(p(t, S.cresce + 0.3 + i * 0.1, S.cresce + 0.7 + i * 0.1));
        if (q <= 0) return;
        const on = E.out(p(t, a.on, a.on + 0.25)), g = pulse(t, a.on, 0.9);
        c.save(); c.globalAlpha *= q; c.translate((1 - q) * 30, 0);
        c.beginPath(); c.arc(x + 52, y + 52, 50, 0, 7);
        if (on > 0) { c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 30 * g; }
        c.fillStyle = on > 0 ? css(C.lime, on) : C.card; c.fill(); c.shadowBlur = 0;
        c.lineWidth = 2; c.strokeStyle = on > 0 ? css(C.lime, 1) : 'rgba(255,255,255,0.14)'; c.stroke();
        icon(c, a.icone, x + 52, y + 52, 46, on > 0.5 ? C.ink : C.gray, { lw: 2.6 });
        txt(c, a.t, x + 128, y + 66, { fam: DISPLAY, size: 38, weight: 800, color: on > 0.5 ? C.white : C.dim, box: 'ação ' + a.t });
        c.restore();
      });
      // o comentário: "__ de 7" digitado e o cursor de editor piscando
      const qf = E.out(p(t, S.cresce + 0.6, S.cresce + 1.0));
      if (qf > 0) {
        const F = { x: 100, y: 1336, w: 820, h: 96 };
        c.save(); c.globalAlpha *= qf;
        rr(c, F.x, F.y, F.w, F.h, 48); c.fillStyle = C.card; c.fill(); c.lineWidth = 2; c.strokeStyle = css(C.lime, 0.2 + 0.4 * pulse(t, S.coment, 1)); c.stroke();
        c.beginPath(); c.arc(F.x + 50, F.y + 48, 22, 0, 7); c.fillStyle = C.card2; c.fill(); c.lineWidth = 2.5; c.strokeStyle = css(C.lime, 0.7); c.stroke();
        icon(c, 'comentar', F.x + 50, F.y + 48, 22, C.lime, { lw: 2.2 });
        const s = cap.diagrama.comentario.t, n = Math.ceil(s.length * p(t, S.coment, S.coment + 0.45));
        let x = F.x + 96;
        const vis = s.slice(0, n), base = F.y + 61;
        // "__" vira o espaço em branco a preencher (sublinhado lima)
        const m = vis.match(/^_+/);
        if (m) { const bw = 26 * m[0].length; c.fillStyle = C.lime; c.fillRect(x, base + 6, bw, 4); x += bw + 6; }
        const resto = vis.replace(/^_+/, '');
        if (resto) x += txt(c, resto, x, base, { size: 36, weight: 600 }) + 4;
        if (n >= s.length) boxHere(c, 'comentário', F.x, F.y, F.x + F.w, F.y + F.h);
        if (t >= S.coment && (t < S.coment + 0.5 || blink(t, S.coment + 0.5))) { c.fillStyle = C.lime; c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 10; c.fillRect(x + 4, F.y + 26, 4, 44); }
        if (t < S.coment) txt(c, 'Comente…', F.x + 96, base, { size: 30, weight: 400, color: C.dim });
        c.restore();
      }
    },
  };

  // =====================================================================
  // COLLAB · "A POUSADA PEDIU. A GENTE FEZ." (episódio com "progresso": "pedidos")
  //   Recurso de progresso PRÓPRIO: a lista dos pedidos (cartõezinhos 01–04) no canto superior direito. Cada
  //   capítulo de pedido mostra o cartão "O PEDIDO:" (o texto entre aspas, sem nome, sem horário, sem cara de print
  //   de conversa) e, em seguida, a tela REAL do site no celular resolvendo. No fim do capítulo o cartão encolhe, voa
  //   até o cartãozinho dele, que acende em lima com o ✓. Telas: PNGs capturados do site no ar (linha.telas).
  // =====================================================================
  let IMGS = {}, TELAS = null;
  const PEDIDOS = () => EP && EP.progresso === 'pedidos';
  const LISTA = { w: 132, h: 50, gap: 12, n: 4 };
  const LCANTO = { x: 808, y: 270, s: 1 };            // a lista fixa no canto (x 808–940, y 270–506)
  const listaRect = (pl, i) => ({ x: pl.x, y: pl.y + i * (LISTA.h + LISTA.gap) * pl.s, w: LISTA.w * pl.s, h: LISTA.h * pl.s });
  const pedidoCaps = () => CAPS.filter((c) => c.diagrama.tipo === 'pedido');

  function listaState(t) {
    const st = { lit: [], building: -1 };
    pedidoCaps().forEach((c, i) => {
      if (c.voo && t >= c.voo[1]) st.lit.push({ i, t: c.voo[1] });
      else if (st.building < 0 && t >= (c.corte ? c.corte[0] : 0)) st.building = i;
    });
    return st;
  }
  function listaPlace(t) {
    // (28/10) a lista NÃO aparece na capa nem no gancho: entra no fim do corte para o pedido 1, já no canto
    const f = ULT();
    if (t < listaEntra()) return null;
    if (f.S && f.S.listaPl && t >= f.S.lista) {      // fecho: desce primeiro pela coluna da direita, depois vai ao centro (não cruza o título)
      const g = f.S.listaPl, qy = E.io(p(t, f.S.lista, f.S.lista + 0.5)), qx = E.io(p(t, f.S.lista + 0.35, f.S.lista + 0.85));
      return { x: lerp(LCANTO.x, g.x, qx), y: lerp(LCANTO.y, g.y, qy), s: lerp(LCANTO.s, g.s, qy) };
    }
    return LCANTO;
  }
  const listaEntra = () => { const c1 = pedidoCaps()[0]; return c1 && c1.corte ? c1.corte[1] : 0; };
  function drawLista(c, t, pl) {
    const st = listaState(t), s = pl.s, t0 = listaEntra();
    const qe = E.out(p(t, t0, t0 + 0.3));              // entrada curta: fade + deslize de 28 px, sem atravessar a tela
    c.save(); c.globalAlpha *= qe; c.translate((1 - qe) * 28, 0);
    for (let i = 0; i < LISTA.n; i++) {
      const R = listaRect(pl, i), qa = 1;
      if (qa <= 0) continue;
      const lit = st.lit.find((q) => q.i === i), b = st.building === i;
      c.save();
      c.translate(R.x + R.w / 2, R.y + R.h / 2); c.scale(qa, qa); c.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
      c.globalAlpha *= clamp(qa * 1.5);
      const num = String(i + 1).padStart(2, '0'), fs = 21 * s, cx = R.x + R.w - 25 * s, cy = R.y + R.h / 2, r = 12 * s;
      if (lit) {
        const pop = E.back(p(t, lit.t, lit.t + 0.32), 2.2), g = pulse(t, lit.t, 0.8);
        c.translate(R.x + R.w / 2, cy); c.scale(lerp(1.16, 1, pop), lerp(1.16, 1, pop)); c.translate(-(R.x + R.w / 2), -cy);
        if (g > 0) { c.shadowColor = css(C.lime, 0.9); c.shadowBlur = 24 * g * s; }
        rr(c, R.x, R.y, R.w, R.h, 10 * s); c.fillStyle = C.lime; c.fill(); c.shadowBlur = 0;
        txt(c, num, R.x + 16 * s, cy + fs * 0.36, { size: fs, weight: 700, color: C.ink, ls: 1 });
        c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = C.ink; c.fill();
        checkMark(c, cx, cy + 0.5 * s, r * 1.25, p(t, lit.t + 0.05, lit.t + 0.35), C.lime, 3 * s);
      } else {
        rr(c, R.x, R.y, R.w, R.h, 10 * s); c.fillStyle = css('#090C0D', 0.92); c.fill();
        c.save(); c.setLineDash([5 * s, 4 * s]); c.lineWidth = 1.8 * s;
        c.strokeStyle = b ? css(C.lime, 0.55 + 0.3 * Math.sin(t * 5)) : css(C.dash, 0.95);
        rr(c, R.x + 1, R.y + 1, R.w - 2, R.h - 2, 10 * s); c.stroke();
        c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.restore();
        txt(c, num, R.x + 16 * s, cy + fs * 0.36, { size: fs, weight: 700, color: b ? C.lime : C.gray, ls: 1 });
      }
      c.restore();
    }
    c.restore();
    const last = listaRect(pl, LISTA.n - 1);
    if (qe > 0.6) boxHere(c, 'lista de pedidos', pl.x, pl.y, pl.x + LISTA.w * s, last.y + last.h);
  }

  // ---------------------------------------------------------------- traço lima com brilho (ilustração da capa)
  function neon(c, draw, lw = 6, a = 1, fill = null) {
    c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); draw();
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.strokeStyle = C.lime; c.lineWidth = lw; c.shadowColor = css(C.lime, 0.75); c.shadowBlur = 22; c.stroke();
    c.shadowBlur = 0; c.lineWidth = lw * 0.42; c.strokeStyle = 'rgba(240,255,210,0.85)'; c.stroke();
    c.restore();
  }
  // a cachoeira em traço lima, com o balão "O pedido ✓" (origem: o topo da queda, no centro)
  function cachoeira(c, ox, oy, t, a = 1) {
    const F = '#070B07';
    c.save(); c.translate(ox, oy); c.globalAlpha *= a;
    // a serra ao fundo
    neon(c, () => { c.moveTo(-340, 40); c.lineTo(-250, -30); c.lineTo(-180, 12); c.lineTo(-90, -62); c.lineTo(-10, -8); c.lineTo(80, -70); c.lineTo(170, 4); c.lineTo(250, -36); c.lineTo(340, 30); }, 3.5, 0.55);
    // as margens de pedra
    const pedra = (k) => { c.moveTo(-340 * k, 440); c.lineTo(-340 * k, 236); c.lineTo(-306 * k, 196); c.lineTo(-268 * k, 188); c.lineTo(-236 * k, 146);
      c.lineTo(-188 * k, 132); c.lineTo(-150 * k, 96); c.lineTo(-118 * k, 88); c.lineTo(-96 * k, 62); c.lineTo(-84 * k, 372); c.lineTo(-150 * k, 392); c.lineTo(-250 * k, 408); c.closePath(); };
    neon(c, () => pedra(1), 6, 1, F);
    neon(c, () => pedra(-1), 6, 1, F);
    neon(c, () => { c.moveTo(-300, 300); c.lineTo(-210, 270); c.moveTo(-280, 200); c.lineTo(-190, 180); c.moveTo(300, 290); c.lineTo(205, 262); c.moveTo(285, 190); c.lineTo(190, 176); }, 3, 0.6);
    // pinheiros nas margens
    [[-262, 182, 1], [-212, 138, 0.8], [262, 182, 1]].forEach(([x, y, k]) => neon(c, () => { c.moveTo(x, y - 70 * k); c.lineTo(x + 26 * k, y); c.lineTo(x - 26 * k, y); c.closePath(); c.moveTo(x, y); c.lineTo(x, y + 14 * k); }, 4, 0.85, F));
    // o rio chegando na crista
    neon(c, () => { c.moveTo(-96, 62); c.bezierCurveTo(-70, 30, -40, 14, -30, -4); c.moveTo(96, 62); c.bezierCurveTo(70, 30, 40, 14, 30, -4); }, 5);
    // a queda: fios de água descendo (o tracejado corre para baixo)
    const off = -(t * 160) % 46;
    [-62, -34, -6, 22, 50, 72].forEach((x, i) => {
      c.save(); c.setLineDash([30, 16]); c.lineDashOffset = off + i * 9;
      neon(c, () => { c.moveTo(x * 0.9, 66); c.bezierCurveTo(x, 150, x * 1.08, 260, x * 1.12, 370); }, i % 2 ? 4 : 5, 0.95);
      c.restore();
    });
    // o poço com as ondas
    neon(c, () => { c.ellipse(0, 410, 268, 48, 0, 0, Math.PI * 2); }, 6, 1, F);
    [[150, 24, 0.75], [76, 12, 0.6]].forEach(([rx, ry, k], i) => { const w = 1 + 0.05 * Math.sin(t * 2.4 + i); neon(c, () => c.ellipse(0, 404, rx * w, ry * w, 0, Math.PI * 0.05, Math.PI * 0.95), 3.5, k); });
    neon(c, () => { [[-110, 362, -128, 344], [-96, 376, -122, 372], [110, 362, 128, 344], [96, 376, 122, 372]].forEach(([a, b, x, y]) => { c.moveTo(a, b); c.lineTo(x, y); }); }, 3.5, 0.8);
    c.restore();
  }
  function balaoPedido(c, x, y, t) {                    // o balão "O pedido ✓" (traço lima, cauda para a queda)
    const w = 286, h = 88;
    c.save();
    neon(c, () => { rr(c, x, y, w, h, 28); }, 5, 1, '#0A0F09');
    neon(c, () => { c.moveTo(x + 46, y + h - 1); c.lineTo(x + 20, y + h + 34); c.lineTo(x + 86, y + h - 1); }, 5, 1, '#0A0F09');
    c.fillStyle = '#0A0F09'; c.fillRect(x + 48, y + h - 6, 36, 8);
    txt(c, 'O pedido', x + 32, y + 57, { size: 34, weight: 700, color: C.white, box: 'balão o pedido' });
    c.beginPath(); c.arc(x + w - 46, y + h / 2, 24, 0, 7); c.fillStyle = C.lime; c.shadowColor = css(C.lime, 0.8); c.shadowBlur = 18; c.fill(); c.shadowBlur = 0;
    checkMark(c, x + w - 46, y + h / 2 + 1, 30, 1, C.ink, 5);
    c.restore();
  }

  // ---- capa_collab (capítulo 0): a capa ilustrada (quadro 0) + a lista vazia que aparece no centro e vai para o canto
  CENAS.capa_collab = {
    setup(cap) {
      const d = cap.diagrama, S = {};
      S.lista = at(cap, d.lista && d.lista.em);
      S.listaY = 560;
      const lines = cap.titulo.map(typo);
      // o capítulo só encolhe se tiver legenda ("legenda": false no capítulo: sem páginas dele, layout original)
      const comLeg = LEGON && LEG.paginas.some((q) => q.cena === String(cap.n).padStart(2, '0'));
      let s = comLeg ? 68 : 78, rows;
      const quebra = (z) => lines.map((l) => wrap(l, DISPLAY, z, 800, 860));      // até x 940: fora da coluna de botões
      while (s > 40 && ((rows = quebra(s)).flat().length > 4 || rows.flat().some((r) => tw(r, DISPLAY, s, 800) > 860))) s -= 1;
      S.ts = s; S.rows = rows; S.tTop = 1078;
      // legenda ligada: a ilustração encolhe (0,78, a partir do topo) e o título sobe; tudo acaba antes de y 1270
      S.ilu = comLeg ? 0.78 : 1;
      S.seloY = comLeg ? 445 + (994 - 445) * S.ilu : 994;
      if (comLeg) S.tTop = S.seloY + 70;
      // (28/10) sem a lista na capa e no gancho: ela entra no fim do corte para o pedido 1, com um estalo curto
      cue(listaEntra(), 'pousa');
      cap.lay = { apoioY: 1460 };
      S.pecas = [0, S.lista];
      return S;
    },
    draw(c, cap, S, t) {
      chip(c, cap.rotulo, L.x0, 372, { on: 0, size: 22, ls: 4, h: 50, cor: C.lime, corTexto: C.lime, solido: true });
      const a = 1;                                     // a ilustração fica inteira (a lista não passa mais por cima)
      c.save(); c.translate(540, 445); c.scale(S.ilu, S.ilu); c.translate(-540, -445);
      cachoeira(c, 540, 515, t, a);
      boxHere(c, 'ilustração', 200, 445, 880, 975);
      c.save(); c.globalAlpha *= a; balaoPedido(c, 652, 452, t); c.restore();
      c.restore();
      chip(c, cap.diagrama.selo, 540, S.seloY, { on: 1, size: 22, ls: 3.5, h: 52, align: 'center', glow: false });
      let y = S.tTop + S.ts * 0.8;
      S.rows.forEach((rs, i) => rs.forEach((r) => { txt(c, r, L.x0, y, { fam: DISPLAY, size: S.ts, weight: 800, color: i ? C.lime : C.white, box: `título ${i + 1}` }); y += S.ts * 1.1; }));
    },
  };

  // ---- pedido (capítulos 1–4): o cartão "O PEDIDO:" e a tela real do site no celular
  const CARD = { x: 80, y: 446, w: 700, pad: 26, size: 27, lh: 37 };
  const SHOT = 1170;                                  // largura dos PNGs (390 px CSS × 3)
  CENAS.pedido = {
    dia: { A: 446, B: 446, k: (1250 - 446) / (1440 - 446) },      // legenda ligada: o cartão fica, o celular vai até y 1250
    setup(cap) {
      const d = cap.diagrama, S = {};
      S.k = pedidoCaps().indexOf(cap) + 1 || cap.n;
      S.rows = wrap(typo(`"${d.pedido}"`), TEXT, CARD.size, 600, CARD.w - 2 * CARD.pad);
      const h = CARD.pad + 24 + 16 + S.rows.length * CARD.lh + CARD.pad - 10;
      S.parte = { x: CARD.x, y: CARD.y, w: CARD.w, h };
      S.cart = at(cap, d.cartao && d.cartao.em, cap.voz_t0);
      const top = CARD.y + h + 24, bot = 1440, pw = 480;
      S.ph = { x: 540 - pw / 2, y: top, w: pw, h: bot - top };
      S.scr = { x: S.ph.x + 14, y: S.ph.y + 14, w: pw - 28, h: S.ph.h - 28 };
      S.kk = S.scr.w / SHOT;
      const vis = S.scr.h / S.kk;
      const box = (src, nome) => TELAS.telas[src].caixas[nome];
      const rolagem = (src, alvo) => { const H = (IMGS[src] && IMGS[src].height) || 2532; const y = alvo ? (alvo[1] + alvo[3]) / 2 - vis / 2 : 0; return clamp(y, 0, Math.max(0, H - vis)); };
      const lista = d.telas || [d.tela];
      S.telas = lista.map((tl, i) => {
        const T = { src: tl.src, t: at(cap, tl.em), realces: [] };
        if (i === 0 && d.realce) d.realce.forEach((r) => T.realces.push({ box: box(tl.src, r.caixa), t: at(cap, r.em) }));
        if (tl.realce) T.realces.push({ box: box(tl.src, tl.realce), t: T.t + 0.35 });
        const alvos = T.realces.map((r) => r.box);
        const uni = alvos.length ? [Math.min(...alvos.map((b) => b[0])), Math.min(...alvos.map((b) => b[1])), Math.max(...alvos.map((b) => b[2])), Math.max(...alvos.map((b) => b[3]))] : null;
        T.y0 = T.y1 = rolagem(tl.src, uni);
        return T;
      });
      S.tela0 = S.telas[0].t;
      if (d.toque) {
        const b = box(lista[0].src, d.toque.caixa);
        S.toque = { box: b, t: at(cap, d.toque.em), abre: d.toque.abre, ta: at(cap, d.toque.abre_em) };
        const T = S.telas[0];
        T.y1 = rolagem(T.src, b); T.y0 = 0;                // entra no topo da seção e rola até a foto
        T.rola = [S.tela0 + 0.55, Math.max(S.tela0 + 1.0, S.toque.t - 0.25)];
        S.toque.y = T.y1;
        S.toque.yAbre = clamp(((IMGS[d.toque.abre] && IMGS[d.toque.abre].height) || 2532) / 2 - vis / 2, 0, 9999);
        cue(T.rola[0], 'rola', { d: T.rola[1] - T.rola[0] }); cue(S.toque.t, 'toque'); cue(S.toque.ta, 'foto');
      }
      if (d.mensagem) { S.msg = at(cap, d.mensagem.em); S.msgTxt = (TELAS.mensagem || '').split('\n'); cue(S.msg, 'mensagem'); }
      S.res = at(cap, d.resolve && d.resolve.em, cap.voz_t1);
      cue(S.cart, 'monta', { k: S.k });
      S.telas.forEach((T, i) => { cue(T.t, i ? 'foto' : 'surge'); T.realces.forEach((r, j) => cue(r.t, 'acende', { k: j + i })); });
      cue(S.res, 'check');
      S.pecas = [S.cart, S.tela0, S.res];
      return S;
    },
    parte(c, cap, S, t) {                               // o cartão "O PEDIDO:" (grande antes da tela; depois, compacto no topo)
      const R = S.parte, q = E.io(p(t, S.tela0 - 0.05, S.tela0 + 0.45));
      const cx = lerp(540, R.x + R.w / 2, q), cy = lerp(860, R.y + R.h / 2, q), s = lerp(1.3, 1, q);
      c.save();
      c.translate(cx, cy); c.scale(s, s); c.translate(-(R.x + R.w / 2), -(R.y + R.h / 2));
      if (entra(c, t, S.cart, R.x + R.w / 2, R.y + R.h / 2, 0.45) <= 0) { c.restore(); return; }
      c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 36; c.shadowOffsetY = 12;
      rr(c, R.x, R.y, R.w, R.h, 26); c.fillStyle = C.card; c.fill(); c.restore();
      c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.10)'; rr(c, R.x, R.y, R.w, R.h, 26); c.stroke();
      barraZ(c, R.x + CARD.pad, R.y + CARD.pad + 2, 7, 20); c.fillStyle = C.lime; c.fill();
      txt(c, 'O PEDIDO:', R.x + CARD.pad + 30, R.y + CARD.pad + 20, { size: 21, weight: 700, color: C.lime, ls: 3.5 });
      S.rows.forEach((r, i) => txt(c, r, R.x + CARD.pad, R.y + CARD.pad + 24 + 16 + CARD.size * 0.8 + i * CARD.lh, { size: CARD.size, weight: 600, color: C.white }));
      c.restore();
      if (q > 0.98 || t < S.tela0 - 0.05) {
        const bx = q > 0.98 ? R : { x: 540 - R.w * 0.65, y: 860 - R.h * 0.65, w: R.w * 1.3, h: R.h * 1.3 };
        if (t >= S.cart + 0.3) boxHere(c, 'cartão o pedido', bx.x, bx.y, bx.x + bx.w, bx.y + bx.h);
      }
    },
    extra(c, cap, S, t) {
      if (t < S.tela0) return;
      const P = S.ph, Sc = S.scr, k = S.kk;
      const qp = E.out(p(t, S.tela0, S.tela0 + 0.5));
      c.save(); c.globalAlpha *= clamp(qp * 1.4); c.translate(0, (1 - qp) * 90);
      // o celular genérico (sem marca)
      c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 50; c.shadowOffsetY = 18;
      rr(c, P.x, P.y, P.w, P.h, 56); c.fillStyle = '#0B0D0E'; c.fill(); c.restore();
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.30)'; rr(c, P.x, P.y, P.w, P.h, 56); c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.07)'; rr(c, P.x + 6, P.y + 6, P.w - 12, P.h - 12, 50); c.stroke();
      c.save(); rr(c, Sc.x, Sc.y, Sc.w, Sc.h, 42); c.clip();
      c.fillStyle = '#EEE8DC'; c.fillRect(Sc.x, Sc.y, Sc.w, Sc.h);
      const tela = (T, yImg) => { const im = IMGS[T.src]; if (im) c.drawImage(im, 0, yImg, SHOT, Sc.h / k, Sc.x, Sc.y, Sc.w, Sc.h); };
      const rolY = (T) => (T.rola ? lerp(T.y0, T.y1, E.io(p(t, T.rola[0], T.rola[1]))) : T.y1);
      let i = 0; S.telas.forEach((T, j) => { if (t >= T.t) i = j; });
      const T = S.telas[i], qt = E.io(p(t, T.t, T.t + 0.45));
      if (i > 0 && qt < 1) { tela(S.telas[i - 1], rolY(S.telas[i - 1])); c.save(); clipRevela(c, Sc.x, Sc.y, Sc.w, Sc.h, qt); tela(T, rolY(T)); c.restore(); }
      else tela(T, rolY(T));
      const yNow = rolY(T);
      const emTela = (b) => ({ x: Sc.x + b[0] * k, y: Sc.y + (b[1] - yNow) * k, w: (b[2] - b[0]) * k, h: (b[3] - b[1]) * k });
      // realces: contorno lima em volta do que resolve o pedido
      const abriu = S.toque && t >= S.toque.ta;
      if (!abriu) T.realces.forEach((r) => {
        const q = E.out(p(t, r.t, r.t + 0.3));
        if (q <= 0) return;
        const B = emTela(r.box), g = pulse(t, r.t, 0.9), m = 8;
        c.save(); c.globalAlpha *= q; c.shadowColor = css(C.lime, 0.9); c.shadowBlur = 10 + 22 * g;
        c.lineWidth = 5; c.strokeStyle = C.lime; rr(c, B.x - m, B.y - m, B.w + 2 * m, B.h + 2 * m, 16); c.stroke(); c.restore();
      });
      // o toque e a foto abrindo na tela inteira
      if (S.toque) {
        const B = emTela(S.toque.box);
        if (t >= S.toque.ta && IMGS[S.toque.abre]) {
          const q = E.io(p(t, S.toque.ta, S.toque.ta + 0.5));
          const X = lerp(B.x, Sc.x, q), Y = lerp(B.y, Sc.y, q), Wd = lerp(B.w, Sc.w, q), Hd = lerp(B.h, Sc.h, q);
          c.save(); c.globalAlpha *= clamp(q * 3); rr(c, X, Y, Wd, Hd, lerp(16, 0, q)); c.clip();
          const im = IMGS[S.toque.abre];
          c.drawImage(im, 0, S.toque.yAbre, SHOT, Sc.h / k, X, Y, Wd, Hd);
          c.restore();
        }
        const t0 = S.toque.t;
        if (t >= t0 - 0.45 && t < S.toque.ta + 0.35) {
          const cx = B.x + B.w * 0.5, cy = B.y + B.h * 0.55;
          const chega = E.out(p(t, t0 - 0.45, t0 - 0.05)), aperta = pulse(t, t0 - 0.05, 0.3);
          const a = chega * (1 - p(t, S.toque.ta + 0.1, S.toque.ta + 0.35));
          c.save(); c.globalAlpha *= a;
          c.translate(cx + (1 - chega) * 60, cy + (1 - chega) * 80);
          c.beginPath(); c.arc(0, 0, 40 * (1 - 0.18 * aperta), 0, 7); c.fillStyle = 'rgba(255,255,255,0.28)'; c.fill();
          c.lineWidth = 4; c.strokeStyle = C.lime; c.stroke();
          c.beginPath(); c.arc(0, 0, 15, 0, 7); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill();
          c.restore();
          anel(c, cx, cy, 40, t, t0, 0.6);
        }
      }
      c.restore();                                     // fim do recorte da tela
      if (qp > 0.98) boxHere(c, 'celular com a tela real', P.x, P.y, P.x + P.w, P.y + P.h);
      // resolvido: o selo ✓ no canto do celular
      const qr = p(t, S.res, S.res + 0.45);
      if (qr > 0) { selo(c, P.x + P.w - 18, P.y + 18, 34, qr, t, S.res); anel(c, P.x + P.w - 18, P.y + 18, 34, t, S.res, 0.7); }
      c.restore();
      // a consulta chegando pronta: balão de conversa genérico (sem logo de app, sem número)
      if (S.msg != null && t >= S.msg) this.mensagem(c, S, t);
    },
    mensagem(c, S, t) {
      const q = E.out(p(t, S.msg, S.msg + 0.5)), R = { x: 110, y: 1000, w: 660, h: 440 };
      c.save(); c.globalAlpha *= clamp(q * 1.6); c.translate(0, (1 - q) * 120);
      c.save(); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 44; c.shadowOffsetY = 14;
      rr(c, R.x, R.y, R.w, R.h, 30); c.fillStyle = C.panel; c.fill(); c.restore();
      c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.12)'; rr(c, R.x, R.y, R.w, R.h, 30); c.stroke();
      c.beginPath(); c.arc(R.x + 54, R.y + 50, 26, 0, 7); c.fillStyle = C.lime; c.fill();
      icon(c, 'casa', R.x + 54, R.y + 50, 30, C.ink, { lw: 2.4 });
      txt(c, 'Pousada Guardião da Serra', R.x + 96, R.y + 60, { size: 25, weight: 700, color: C.white });
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(R.x + 24, R.y + 96, R.w - 48, 2);
      const B = { x: R.x + 34, y: R.y + 118, w: R.w - 68 };
      const linhas = S.msgTxt.flatMap((l) => wrap(l, TEXT, 22, 500, B.w - 44));
      const bh = 26 + linhas.length * 29 + 18;
      rr(c, B.x, B.y, B.w, bh, 22); c.fillStyle = C.card2; c.fill(); c.lineWidth = 2; c.strokeStyle = css(C.lime, 0.55); c.stroke();
      const n = Math.ceil(linhas.length * p(t, S.msg + 0.25, S.msg + 0.9));
      linhas.slice(0, n).forEach((l, i) => txt(c, l, B.x + 22, B.y + 44 + i * 29, { size: 22, weight: i ? 500 : 600, color: i ? C.apoio : C.white }));
      const qv = p(t, S.msg + 0.95, S.msg + 1.25);
      if (qv > 0) { checkMark(c, B.x + B.w - 52, B.y + bh - 22, 20, qv, C.lime, 3.2); checkMark(c, B.x + B.w - 38, B.y + bh - 22, 20, p(qv, 0.4, 1), C.lime, 3.2); }
      c.restore();
      if (q > 0.6) boxHere(c, 'mensagem pronta', R.x, R.y, R.x + R.w, R.y + R.h);
    },
  };

  // ---- fecho_collab: a lista com os 4 ✓ no centro, "Site por Fazlo Digital" em lima e o site; depois, só a logo
  CENAS.fecho_collab = {
    dia: { A: 0, B: 0, k: 1 },                    // legenda ligada: não encolhe (o crédito e o site já acabam em y 1282)
    setup(cap) {
      const d = cap.diagrama, S = {};
      S.lista = at(cap, d.lista.em);
      S.listaPl = { x: 540 - LISTA.w * 1.4 / 2, y: 672, s: 1.4 };
      S.cred = at(cap, d.credito.em); S.para = at(cap, d.para_em.em);
      S.dS = fit([d.destaque], DISPLAY, 800, [800], 64, 36);
      S.pS = fit([d.para], TEXT, 600, [800], 40, 24);
      cue(S.lista, 'cresce'); cue(S.cred, 'brilho'); cue(S.para, 'surge'); cue(S.para + 0.45, 'acende', { k: 4 });
      cue(cap.corte_logo[0], 'logo');
      S.pecas = [S.lista, S.cred, S.para];
      return S;
    },
    extra(c, cap, S, t) {
      const d = cap.diagrama;
      const q1 = E.out(p(t, S.cred, S.cred + 0.55));
      if (q1 > 0) {
        const w = tw(d.destaque, DISPLAY, S.dS, 800), y = 1112;
        c.save(); clipRevela(c, 540 - w / 2, y - S.dS * 0.95, w, S.dS * 1.25, q1);
        txt(c, d.destaque, 540, y, { fam: DISPLAY, size: S.dS, weight: 800, color: C.lime, align: 'center', glow: css(C.lime, 0.35 * pulse(t, S.cred + 0.3, 1.2)), blur: 26 });
        c.restore();
        if (q1 > 0.6) boxHere(c, 'site por', 540 - w / 2, y - S.dS * 0.78, 540 + w / 2, y + S.dS * 0.24);
      }
      const q2 = E.out(p(t, S.para, S.para + 0.45));
      if (q2 > 0) txt(c, d.para, 540, 1178 + (1 - q2) * 16, { size: S.pS, weight: 600, color: C.white, align: 'center', alpha: q2, box: 'pra pousada' });
      const q3 = E.out(p(t, S.para + 0.45, S.para + 0.85));
      if (q3 > 0) {
        c.save(); c.globalAlpha *= q3; c.translate(0, (1 - q3) * 14);
        const s = d.site, w = tw(s, TEXT, 27, 600) + 64 + 40, x = 540 - w / 2, y = 1222, h = 60;
        rr(c, x, y, w, h, h / 2); c.fillStyle = css(C.lime, 0.08); c.fill(); c.lineWidth = 2; c.strokeStyle = css(C.lime, 0.75); c.stroke();
        icon(c, 'casa', x + 40, y + h / 2, 26, C.lime, { lw: 2.4 });
        txt(c, s, x + 70, y + h / 2 + 27 * 0.36, { size: 27, weight: 600, color: C.white });
        c.restore();
        if (q3 > 0.6) boxHere(c, 'site da pousada', x, y, x + w, y + h);
      }
    },
  };

  // =====================================================================
  // MONTAGEM DO QUADRO
  // =====================================================================
  const flutua = (t) => Math.sin(t * 1.35) * 4;
  function capitulo(c, n, t) {                          // tudo do capítulo n (sem a marca e o celular do canto)
    const cap = CAPS[n], S = cap.S, tipo = cap.diagrama.tipo, cena = CENAS[tipo];
    CUR_CAP = n;
    const parado = (tipo === 'fecho' || tipo === 'fecho_collab') && cap.logo_parada && t >= cap.logo_parada[0];
    drawBg(c, cap.tom, t, parado);
    if (tipo === 'capa' || tipo === 'capa_collab') {
      cena.draw(c, cap, S, t);
      drawApoio(c, cap, t, cap.lay.apoioY);
      return;
    }
    drawRotulo(c, cap, t); drawTitulo(c, cap, t); drawApoio(c, cap, t, cap.lay.apoioY);
    c.save(); c.translate(0, flutua(t));                // a cena nunca fica parada: a parte flutua devagar (±4 px)
    if (LEGON) diaM(c, diaDe(tipo));                    // legenda ligada: o diagrama em escala, até y ≈ 1250
    if (cena.extra) cena.extra(c, cap, S, t);
    if (cena.parte && (!cap.voo || t < cap.voo[0])) cena.parte(c, cap, S, t);
    c.restore();
  }
  // a parte voando até o bloco (encolhe, vira um bloco lima e encaixa)
  function voo(c, n, t) {
    const cap = CAPS[n];
    if (!cap.voo || t < cap.voo[0] || t >= cap.voo[1] || n === 0) return;
    const S = cap.S, R = S.parte, cena = CENAS[cap.diagrama.tipo], R0 = LEGON ? mapR(R) : R;   // R0: onde a parte começa
    if (PEDIDOS()) { vooPedido(c, cap, t); return; }
    // o caminho não cruza o texto: 1) encolhe e anda POR BAIXO do título e do apoio até a coluna do celular do canto
    // (x do bloco, logo abaixo do texto), já do tamanho do bloco e em lima; 2) sobe reto até o bloco
    const u = p(t, cap.voo[0], cap.voo[1]), B = blocoRect(CANTO, n - 1), CUT = 0.62;
    const yBase = Math.max(cap.lay.apoioY + 64, B.y + 260);
    const qa = E.io(clamp(u / CUT)), qb = E.io(clamp((u - CUT) / (1 - CUT)));
    const x = lerp(R0.x, B.x, qa), w = lerp(R0.w, B.w, qa), h = lerp(R0.h, B.h, qa);
    const y = u < CUT ? lerp(R0.y + flutua(cap.voo[0]), yBase, qa) : lerp(yBase, B.y, qb);
    const q = qa;
    const conteudo = 1 - p(qa, 0.3, 0.75), lima = p(qa, 0.4, 0.9);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40 * (1 - q); c.shadowOffsetY = 12 * (1 - q);
    rr(c, x, y, w, h, lerp(28, 4, q)); c.fillStyle = C.panel; c.fill(); c.shadowColor = 'transparent';
    if (conteudo > 0) {
      c.save(); rr(c, x, y, w, h, lerp(28, 4, q)); c.clip(); c.globalAlpha *= conteudo;
      c.translate(x, y); c.scale(w / R.w, h / R.h); c.translate(-R.x, -R.y);
      MINI++; cena.parte(c, cap, S, cap.voo[0] - 0.01); MINI--;
      c.restore();
    }
    if (lima > 0) { rr(c, x, y, w, h, lerp(28, 4, q)); c.fillStyle = css(C.lime, lima); c.fill(); }
    c.restore();
  }
  // collab: o cartão do pedido encolhe e voa até o cartãozinho dele na lista do canto, já em lima
  function vooPedido(c, cap, t) {
    const S = cap.S, R = S.parte, cena = CENAS.pedido, B = listaRect(LCANTO, S.k - 1), R0 = LEGON ? mapR(R, diaDe('pedido')) : R;
    const u = E.io(p(t, cap.voo[0], cap.voo[1]));
    const x = lerp(R0.x, B.x, u), y = lerp(R0.y + flutua(cap.voo[0]), B.y, u) - Math.sin(u * Math.PI) * 60, w = lerp(R0.w, B.w, u), h = lerp(R0.h, B.h, u);
    const conteudo = 1 - p(u, 0.25, 0.7), lima = p(u, 0.35, 0.85);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40 * (1 - u); c.shadowOffsetY = 12 * (1 - u);
    rr(c, x, y, w, h, lerp(26, 10, u)); c.fillStyle = C.card; c.fill(); c.shadowColor = 'transparent';
    if (conteudo > 0) {
      c.save(); rr(c, x, y, w, h, lerp(26, 10, u)); c.clip(); c.globalAlpha *= conteudo;
      c.translate(x, y); c.scale(w / R.w, h / R.h); c.translate(-R.x, -R.y);
      MINI++; cena.parte(c, cap, S, cap.voo[0] - 0.01); MINI--;
      c.restore();
    }
    if (lima > 0) { rr(c, x, y, w, h, lerp(26, 10, u)); c.fillStyle = css(C.lime, lima); c.fill(); }
    c.restore();
  }
  // o corte diagonal entre o capítulo antigo e o novo: a barra lima atravessa na inclinação do Z
  function corte(c, u, antigo, novo) {
    const ext = -SLOPE * H / 2 + 120, xc = lerp(-ext, W + ext, u);
    c.save(); clipDireita(c, xc); antigo(); c.restore();
    c.save(); clipEsquerda(c, xc); novo(); c.restore();
    const bw = 120;
    c.save();
    c.beginPath(); c.moveTo(linhaX(xc - bw * 0.15, -20), -20); c.lineTo(linhaX(xc + bw * 0.85, -20), -20); c.lineTo(linhaX(xc + bw * 0.85, H + 20), H + 20); c.lineTo(linhaX(xc - bw * 0.15, H + 20), H + 20); c.closePath();
    c.shadowColor = css(C.lime, 0.7); c.shadowBlur = 40; c.fillStyle = C.lime; c.fill(); c.restore();
  }

  function frame(c, t) {
    t = clamp(t, 0, DURATION - 1e-6);
    const n = capAt(t), cap = CAPS[n], ult = n === CAPS.length - 1;
    const pl = PEDIDOS() ? listaPlace(t) : wirePlace(t);
    const fixos = () => {
      drawMarca(c);
      if (PEDIDOS()) { if (pl) drawLista(c, t, pl); } else drawWire(c, t, pl);
      if (n === 0 && !PEDIDOS()) { CENAS.capa.brilhoBlocos(c, cap, cap.S, t, pl); CENAS.capa.faixa(c, cap, cap.S, t); }
      for (let k = 1; k < CAPS.length; k++) voo(c, k, t);
    };
    const tudo = (k) => () => capitulo(c, k, t);
    const leg = () => {                                 // a legenda, por cima do capítulo e das peças fixas
      if (!LEG) return;
      LEG.desenha(c, t);
      if (COLLECT) LEG.caixas(t).forEach((b) => COLLECT.out.push({ ...b, cap: CUR_CAP }));
    };
    if (n > 0 && t < cap.corte[1]) {
      const u = E.io(p(t, cap.corte[0], cap.corte[1]));
      corte(c, u, tudo(n - 1), tudo(n));
      fixos(); leg();
      return;
    }
    if (ult && cap.corte_logo && t >= cap.corte_logo[0]) {
      const logo = () => { drawBg(c, 'palco', t, true); const w = 640, h = logoH(w); drawLogo(c, 540 - w / 2, 950 - h / 2, w); boxHere(c, 'logo final', 540 - w / 2, 950 - h / 2, 540 + w / 2, 950 + h / 2); };
      if (t < cap.corte_logo[1]) { const u = E.io(p(t, cap.corte_logo[0], cap.corte_logo[1])); corte(c, u, () => { tudo(n)(); fixos(); leg(); }, logo); }   // a legenda sai com o corte
      else logo();
      return;
    }
    tudo(n)();
    fixos(); leg();
  }

  // ---------------------------------------------------------------- motion blur (só nas passagens rápidas)
  let ACC = null, TMP = null;
  function amostras(t) {
    for (const cap of CAPS) {
      if (cap.corte && t >= cap.corte[0] - 0.02 && t <= cap.corte[1] + 0.02) return 6;
      if (cap.corte_logo && t >= cap.corte_logo[0] - 0.02 && t <= cap.corte_logo[1] + 0.02) return 6;
      if (cap.voo && t >= cap.voo[0] && t <= cap.voo[1]) return 4;
    }
    return 1;
  }
  function renderAt(c, t, o = {}) {
    const n = o.noBlur ? 1 : amostras(t);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    if (n <= 1) { frame(c, t); c.restore(); return; }
    if (!ACC) { ACC = document.createElement('canvas'); ACC.width = W; ACC.height = H; TMP = document.createElement('canvas'); TMP.width = W; TMP.height = H; }
    const a = ACC.getContext('2d'), b = TMP.getContext('2d'), sh = 1 / 120;
    for (let i = 0; i < n; i++) {
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.clearRect(0, 0, W, H);
      frame(b, t + (i / (n - 1) - 0.5) * sh);
      a.globalAlpha = 1 / (i + 1); a.drawImage(TMP, 0, 0);
    }
    a.globalAlpha = 1; c.drawImage(ACC, 0, 0);
    c.restore();
  }

  // =====================================================================
  // INICIALIZAÇÃO E DADOS PARA A REVISÃO
  // =====================================================================
  function init(svgText, linha, extras = {}) {
    M = document.createElement('canvas').getContext('2d');
    IMGS = extras.imgs || {}; TELAS = extras.telas || null;
    parseLogo(svgText);
    EP = linha; CAPS = linha.capitulos; DURATION = linha.duracao; CUES = []; WARN = [];
    LEGON = !!((linha.legenda || extras.forcaLegenda) && extras.legenda);
    if ((linha.legenda || extras.forcaLegenda) && !extras.legenda) throw new Error('legenda ligada, mas falta o legenda.json (rode tools/legenda-palavras/legenda.py explica <id>)');
    LEG = LEGON ? window.LEGENDA.cria(extras.legenda, { fim: extras.legenda.fim }) : null;
    CAPS.forEach((cap) => {
      if (!['capa', 'capa_collab'].includes(cap.diagrama.tipo)) layoutTitulo(cap);
      const cena = CENAS[cap.diagrama.tipo];
      if (!cena) throw new Error('diagrama desconhecido: ' + cap.diagrama.tipo);
      cap.S = cena.setup(cap);
      if (LEGON && cap.S.wire && !['capa', 'capa_collab'].includes(cap.diagrama.tipo)) cap.S.wire = mapW(cap.S.wire);   // o celular do fecho, na escala do diagrama
      if (cap.corte) cue(cap.corte[0], 'corte');
      if (cap.n > 0) cue(cap.t0 + 0.02, 'titulo');
      if (!LEGON) cap.apoios.forEach((a) => cue(a.t, 'apoio'));
      if (cap.voo && cap.n > 0) { cue(cap.voo[0], 'voa_parte'); cue(cap.voo[1], 'bloco', { k: cap.n }); cue(cap.cursor[0], 'cursor'); }
    });
    CUES.sort((a, b) => a.t - b.t);
    WARN.forEach((w) => console.warn(w));
  }

  window.EXPLICA = {
    init, renderAt,
    get DURATION() { return DURATION; },
    cues: () => ({ duracao: DURATION, cues: CUES, avisos: WARN }),
    caixas(c, t) { COLLECT = { out: [], m: new DOMMatrix() }; frame(c, t); const out = COLLECT.out; COLLECT = null; return out; },
    apoios: () => CAPS.flatMap((cap) => cap.apoios.map((a, i) => ({ cap: cap.n, i, texto: a.texto, t: a.t, inteira_de: a.t + EP.apoio.entra, ate: a.sai ? a.ate - EP.apoio.sai : a.ate }))),
    trocas: () => CAPS.filter((c) => c.corte).map((c) => ({ cap: c.n, t0: c.corte[0], t1: c.corte[1] })),
    montagens: () => CAPS.map((c) => ({ cap: c.n, primeira: Math.min(...(c.S.pecas || [c.t0])), ultima: Math.max(...(c.S.pecas || [c.t0])), voo: c.voo || null, cursor: c.cursor || null })),
    legenda: () => (LEG ? { paginas: LEG.paginas.map((q) => ({ cena: q.cena, t0: q.t0, t1: q.t1, texto: q.texto, juntada: q.juntada })), juntadas: LEG.juntadas } : null),
    fecho: () => { const f = CAPS[CAPS.length - 1]; return { t0: f.t0, corte_logo: f.corte_logo, logo_parada: f.logo_parada, fim: DURATION }; },
  };
})();
