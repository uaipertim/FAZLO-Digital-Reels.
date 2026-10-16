/* =====================================================================
   FAZLO Digital — série "PELOS OLHOS DO HÓSPEDE" · o modelo
   9:16 (1080x1920), 60 fps · sem voz: 10–14 s · com voz: 25–30 s

   Um motion só. Cada episódio troca apenas o roteiro, um JSON em
   series/pelos-olhos-do-hospede/episodios/<id>.json, e a pasta do Reel
   (reels/<id>/) é gerada por tools/episodio.cjs. O src/anim.js de cada
   episódio é uma linha: FZS.episodio('<id>').

   Estrutura fixa (os tempos se ajustam ao número de cards e ao texto):
     1. quadro 0 (vale como capa): chip "PELOS OLHOS DO HÓSPEDE" e o
        título-dor em Unbounded 900, linha 1 branca e linha 2 lima, no maior
        tamanho que cabe; em 1,8 s ele sobe e vira cabeçalho;
     2. a situação: 2 a 4 cards entram um a um, com um toque, e se empilham;
     3. o corte: a barra lima da marca (46°) atravessa a pilha e deixa o
        carimbo lima;
     4. a virada: frase branca com um trecho lima, parada ≥ 1,8 s;
     5. últimos 2,0 s: "Manda pra quem…" + logo FAZLO DIGITAL (kit oficial),
        montada pelas formas, com a assinatura sonora.

   Identidade da FAZLO Digital: fundo #050606 com a grade de pontos, lima
   #C6FA41, branco; Unbounded nos títulos e Sora nos textos (brand/).
   Áreas seguras: conteúdo em y 265–1456; nada em x ≥ 950 entre y 1060 e
   1560 (coluna de botões); título do quadro 0 dentro do recorte 3:4.
   Sem telas inventadas, números, logos de apps ou emojis.

   COM VOZ (roteiro com o campo "voz" e reels/<id>/audio/voz/voz.json, gerado por voz.py):
   a voz manda no tempo. Cada cena dura a sua fala + um respiro curto; a fala do título começa
   no quadro 0 e a batida lima cai na palavra da parte lima. Os cards ficam o tempo da sua fala,
   flutuam de leve e o card da vez ganha um contorno lima enquanto é falado. Se o total ficar
   abaixo de 25 s, a diferença vai para os respiros; acima de 30 s, tools/episodio.cjs avisa
   antes de renderizar (nada é acelerado nem cortado).
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { clamp, lerp, prog: p, ease: E, kick, hash, rgba } = U;
  const TAU = Math.PI * 2, DEG = Math.PI / 180;

  const DISPLAY = "'FZD Display'", TEXT = "'FZD Text'";
  const C = {
    bg: '#050606', lime: '#C6FA41', white: '#FFFFFF', card: '#141717', card2: '#1B1F1F',
    line: '#2A2F2F', muted: '#8A9292', soft: '#C9CFCF', ink: '#0A0C0C',
  };
  const SERIE_BASE = '/series/pelos-olhos-do-hospede';
  const CX = 525;                                   // eixo dos textos: com largura ≤ 840 eles terminam em x ≤ 945
  const SK = 0.966;                                 // inclinação da barra da marca (dx/dy)

  // ---------------------------------------------------------------- texto
  const M = document.createElement('canvas').getContext('2d');
  function setFont(c, fam, size, weight, align = 'left', ls = 0) {
    c.font = `${weight} ${size}px ${fam}`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.letterSpacing = `${ls}px`;
  }
  // largura visível (o letterSpacing soma espaço também depois da última letra)
  function tw(s, fam, size, weight, ls = 0) { setFont(M, fam, size, weight, 'left', ls); return M.measureText(s).width - ls; }
  function txt(c, s, x, y, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.002) return;
    c.save(); c.globalAlpha *= clamp(a);
    setFont(c, o.fam || TEXT, o.size, o.weight || 600, o.align || 'left', o.ls || 0);
    c.fillStyle = o.color || C.white; c.fillText(s, x, y); c.restore();
  }
  // aspas retas -> tipográficas
  const smart = (s) => s.replace(/(^|[\s(\[—–-])'/g, '$1‘').replace(/'/g, '’').replace(/(^|[\s(\[—–-])"/g, '$1“').replace(/"/g, '”');
  const upper = (s) => s.toLocaleUpperCase('pt-BR');
  // palavras com cor: trechos entre *asteriscos* ficam em lima
  function rich(line, base) {
    const words = []; let lime = false;
    upper(smart(line)).split('*').forEach((part, i) => {
      if (i > 0) lime = !lime;
      part.split(/\s+/).filter(Boolean).forEach((w) => words.push({ s: w, c: lime ? C.lime : base }));
    });
    return words;
  }
  const rowText = (row) => row.map((w) => w.s).join(' ');
  const LS_D = -0.02;                               // entreletra dos títulos (Unbounded), em fração do tamanho
  const W100 = new Map();
  function rowW100(row) {
    const s = rowText(row);
    if (!W100.has(s)) W100.set(s, tw(s, DISPLAY, 100, 900, LS_D * 100));
    return W100.get(s);
  }
  let CAP = 0.73;                                   // altura das maiúsculas da Unbounded (medida no setup)
  /* o maior tamanho que cabe: cada linha do roteiro fica inteira ou, se o tamanho ficar abaixo de `pref`,
     pode quebrar em duas no ponto mais equilibrado. */
  function fitRows(lines, o) {
    const opts = lines.map((ln) => {
      const out = [[ln]];
      if (ln.length > 1) {
        let best = null;
        for (let k = 1; k < ln.length; k++) {
          const a = ln.slice(0, k), b = ln.slice(k), m = Math.max(rowW100(a), rowW100(b));
          if (!best || m < best.m) best = { m, rows: [a, b] };
        }
        out.push(best.rows);
      }
      return out;
    });
    const sizeOf = (rows) => Math.min(o.max, o.maxW * 100 / Math.max(...rows.map(rowW100)), o.maxH / (CAP + (rows.length - 1) * o.lead + 0.05));
    let combos = [[]];
    opts.forEach((op) => { combos = combos.flatMap((c) => op.map((rows) => c.concat(rows))); });
    const whole = combos[0], sw = sizeOf(whole);
    if (sw >= o.pref) return { rows: whole, size: Math.floor(sw), lead: o.lead };
    let best = { rows: whole, size: sw };
    combos.forEach((rows) => { const s = sizeOf(rows); if (s > best.size * 1.02) best = { rows, size: s }; });
    return { rows: best.rows, size: Math.floor(best.size), lead: o.lead };
  }
  // bases das linhas a partir do topo das maiúsculas; altura do bloco (maiúsculas: sem descendentes, só a cedilha/vírgula)
  function blockOf(f) {
    const s = f.size, base = f.rows.map((_, i) => CAP * s + i * s * f.lead);
    return { base, h: base[base.length - 1] + 0.06 * s };
  }
  function drawRow(c, row, cx, y, size, alpha = 1) {
    const ls = LS_D * size, w = rowW100(row) * size / 100;
    let x = cx - w / 2;
    c.save(); c.globalAlpha *= alpha;
    setFont(c, DISPLAY, size, 900, 'left', ls);
    row.forEach((wd, i) => {
      c.fillStyle = wd.c; c.fillText(wd.s, x, y);
      x += c.measureText(wd.s + (i < row.length - 1 ? ' ' : '')).width;
    });
    c.restore();
    return w;
  }
  // a linha sobe por uma fenda
  function riseRow(c, row, cx, y, size, pin) {
    if (pin <= 0) return;
    const w = rowW100(row) * size / 100, off = (1 - E.outExpo(clamp(pin))) * size * 1.25;
    c.save(); c.beginPath(); c.rect(cx - w / 2 - 60, y - size * 1.05, w + 120, size * 1.32); c.clip();
    drawRow(c, row, cx, y + off, size);
    c.restore();
  }
  function wrap(s, fam, size, weight, ls, maxW) {
    const out = []; let cur = '';
    s.split(/\s+/).forEach((w) => {
      const t = cur ? cur + ' ' + w : w;
      if (cur && tw(t, fam, size, weight, ls) > maxW) { out.push(cur); cur = w; } else cur = t;
    });
    if (cur) out.push(cur);
    return out;
  }
  // quebra equilibrada em duas linhas (o fecho)
  function balance(s, fam, size, weight, ls, maxW) {
    if (tw(s, fam, size, weight, ls) <= maxW) return [s];
    const words = s.split(/\s+/); let best = null;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
      const m = Math.max(tw(a, fam, size, weight, ls), tw(b, fam, size, weight, ls));
      if (m <= maxW && (!best || m < best.m)) best = { m, rows: [a, b] };
    }
    return best ? best.rows : wrap(s, fam, size, weight, ls, maxW);
  }

  // ---------------------------------------------------------------- desenho
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))); }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); }
  function glow(c, x, y, r, a, color = C.lime) {
    if (a <= 0.004 || r <= 1) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.45, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // a barra da marca: paralelogramo inclinado (46°), centro (x, y), altura h, largura w
  function slashPath(c, x, y, h, w) {
    const dx = SK * h / 2;
    c.beginPath();
    c.moveTo(x + dx - w / 2, y - h / 2); c.lineTo(x + dx + w / 2, y - h / 2);
    c.lineTo(x - dx + w / 2, y + h / 2); c.lineTo(x - dx - w / 2, y + h / 2); c.closePath();
  }

  // ---------------------------------------------------------------- logo oficial (SVG do kit, montada pelas formas)
  let LOGO = null;
  function loadLogo() {
    const x = new XMLHttpRequest(); x.open('GET', '/brand/logo/kit/FAZLO-DIGITAL-branca-transparente.svg', false); x.send();
    const doc = new DOMParser().parseFromString(x.responseText, 'image/svg+xml');
    const vb = doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number);
    const paths = [...doc.querySelectorAll('path')].map((q) => ({ fill: q.getAttribute('fill'), d: q.getAttribute('d') }));
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
    pieces.sort((a, b) => a.x0 - b.x0);
    LOGO = { vb, pieces, slash: { path: new Path2D(paths[1].d), fill: paths[1].fill }, digital: { path: new Path2D(paths[2].d), fill: paths[2].fill } };
  }
  const logoH = (w) => w * LOGO.vb[3] / LOGO.vb[2];
  // logo com largura w centrada em (cx, cy); montada a partir de t0 (t = Infinity: pronta)
  function drawLogo(c, cx, cy, w, t, t0, a = 1) {
    if (!LOGO || a <= 0.01) return;
    const [vx, vy, vw, vh] = LOGO.vb, s = w / vw;
    c.save(); c.globalAlpha *= a;
    c.translate(cx - (vw / 2) * s, cy - (vh / 2) * s); c.scale(s, s); c.translate(-vx, -vy);
    LOGO.pieces.forEach((pc, i) => {
      const q = E.outExpo(p(t, t0 + i * 0.05, t0 + i * 0.05 + 0.5));
      if (q <= 0) return;
      c.save(); c.beginPath(); c.rect(pc.x0 - 4, pc.y0 - 4, pc.x1 - pc.x0 + 8, pc.y1 - pc.y0 + 8); c.clip();
      c.translate(0, (1 - q) * (pc.y1 - pc.y0 + 10));
      c.fillStyle = '#FFFFFF'; c.fill(pc.path, 'evenodd'); c.restore();
    });
    const ps = E.outCubic(p(t, t0 + 0.18, t0 + 0.55));
    if (ps > 0) {
      c.save(); c.beginPath(); const yb = 124 - (124 - 26) * ps;    // a barra cresce de baixo para cima
      c.rect(200, yb, 160, 130); c.clip(); c.fillStyle = LOGO.slash.fill; c.fill(LOGO.slash.path, 'evenodd'); c.restore();
    }
    const pd = p(t, t0 + 0.45, t0 + 0.85);
    if (pd > 0) { c.save(); c.globalAlpha *= pd; c.translate((1 - E.outCubic(pd)) * 30, 0); c.fillStyle = LOGO.digital.fill; c.fill(LOGO.digital.path, 'evenodd'); c.restore(); }
    c.restore();
  }

  // =====================================================================
  // EPISÓDIO: roteiro -> layout + linha do tempo
  // =====================================================================
  const TITLE = { maxW: 840, maxH: 600, max: 130, pref: 84, lead: 1.1, cy: 900 };
  const CHIP = { size: 25, h: 56, gap: 46, ls: 4 };
  const HEAD = { top: 285, maxH: 200, maxW: 780, maxS: 0.5 };
  const CARD = { x: 80, w: 860, r: 32, gap: 24, text: 50, label: 27, chip: 40, lh: 62 };
  const STAMP = { size: 46, h: 112, maxW: 840, cx: 515, rot: -4 };
  const VIRADA = { maxW: 840, maxH: 470, max: 96, pref: 70, lead: 1.14, cy: 880 };
  const FECHO = { size: 52, weight: 700, maxW: 820, lead: 1.24, gap: 70 };
  const LOCK = { w: 330, before: 70 };
  const CUT = 0.2;                                  // a barra atravessa a pilha antes do carimbo
  const FECHO_D = 2.0;                              // "Manda pra quem…" + logo (pedido de 16/10: 2,0 s em todos os episódios)
  const DMIN = 10 + (FECHO_D - 1.6), DMAX = 14 + (FECHO_D - 1.6);   // o fecho maior não encurta a situação
  // com voz
  const V = {
    resp: 0.55,          // respiro depois de cada fala
    head: 0.35,          // fim da fala do título -> o título vira cabeçalho
    entra: 0.25,         // o card entra (toque de vidro) e a fala começa depois que o toque baixa
    virada: 0.35,        // idem para o acorde da virada
    cauda: 1.7,          // a logo se monta no fim da fala do fecho; depois, a assinatura soa sozinha
    min: 25,             // abaixo disso, a diferença vai para os respiros (os cards ficam mais tempo)
  };
  let VZ = null;         // durações das falas (reels/<id>/audio/voz/voz.json)

  function measureCard(c) {
    const k = { ...c };
    if (c.chip !== undefined) {
      k.kind = 'chip'; k.chipS = upper(smart(c.chip));
      k.h = 108; k.w = Math.max(300, tw(k.chipS, TEXT, CARD.chip, 700, 3) + 72 + 44);
      k.chars = k.chipS.length;
      return k;
    }
    const s = smart(c.texto || '');
    k.kind = c.rotulo ? 'rotulo' : 'texto';
    const maxW = k.kind === 'rotulo' ? CARD.w - 80 : CARD.w - 76 - 40;
    // numa linha só, se couber até 42 px; senão em duas (até três, diminuindo)
    let size = CARD.text, rows = wrap(s, TEXT, size, 600, -0.01 * size, maxW);
    for (let z = CARD.text; z >= 42 && rows.length > 1; z -= 1) {
      const one = wrap(s, TEXT, z, 600, -0.01 * z, maxW);
      if (one.length === 1) { size = z; rows = one; }
    }
    while (rows.length > 2 && size > 38) { size -= 2; rows = wrap(s, TEXT, size, 600, -0.01 * size, maxW); }
    k.size = size; k.rows = rows; k.w = CARD.w;
    k.h = (k.kind === 'rotulo' ? 176 : 124) + (rows.length - 1) * CARD.lh;
    k.chars = s.length + (c.rotulo ? c.rotulo.length : 0);
    return k;
  }

  let EP, L, T, DURATION;
  function layout(ep) {
    W100.clear();
    setFont(M, DISPLAY, 100, 900); CAP = M.measureText('H').actualBoundingBoxAscent / 100;
    // ---- título (quadro 0) e cabeçalho
    let tLines = ep.titulo.map((ln, i) => rich(ln, i === 0 ? C.white : C.lime));
    if (ep.titulo.some((ln) => ln.includes('*'))) tLines = ep.titulo.map((ln) => rich(ln, C.white));
    const title = fitRows(tLines, TITLE), tb = blockOf(title);
    const serie = upper(ep.serie || 'Pelos olhos do hóspede');
    const chipW = tw(serie, TEXT, CHIP.size, 700, CHIP.ls) + 46 + 28;
    const blockH = CHIP.h + CHIP.gap + tb.h, top = TITLE.cy - blockH / 2, rowsTop = top + CHIP.h + CHIP.gap;
    const maxRowW = Math.max(...title.rows.map((r) => rowW100(r) * title.size / 100));
    const hs = Math.min(HEAD.maxS, HEAD.maxH / tb.h, HEAD.maxW / maxRowW);
    const head = { s: hs, cy: HEAD.top + tb.h * hs / 2, bottom: HEAD.top + tb.h * hs };
    // ---- cards
    const cards = ep.cards.map(measureCard);
    const zoneTop = head.bottom + 64, zoneBot = 1440;
    const groupH = cards.reduce((a, k) => a + k.h, 0) + CARD.gap * (cards.length - 1);
    const CY = (zoneTop + zoneBot) / 2;
    // ---- carimbo
    const stampS = upper(smart(ep.carimbo));
    let ss = STAMP.size;
    while (tw(stampS, DISPLAY, ss, 800, 0) + 2 * 0.95 * ss > STAMP.maxW && ss > 30) ss -= 1;
    const stampW = tw(stampS, DISPLAY, ss, 800, 0) + 2 * 0.95 * ss, stampH = STAMP.h * ss / STAMP.size;
    // ---- virada + fecho + logo
    const virada = fitRows(ep.virada.map((ln) => rich(ln, C.white)), VIRADA), vb = blockOf(virada);
    const fechoS = smart(ep.fecho);
    let fs = FECHO.size, fRows = balance(fechoS, TEXT, fs, FECHO.weight, -0.01 * fs, FECHO.maxW);
    while (fRows.length > 2 && fs > 42) { fs -= 1; fRows = balance(fechoS, TEXT, fs, FECHO.weight, -0.01 * fs, FECHO.maxW); }
    const fH = 0.73 * fs + (fRows.length - 1) * fs * FECHO.lead + 0.24 * fs;
    const lh = logoH(LOCK.w);
    const total = vb.h + FECHO.gap + fH + LOCK.before + lh;
    let fTop = VIRADA.cy - total / 2;
    fTop -= Math.max(0, fTop + total - 1440);
    const fin = { vTop0: VIRADA.cy - vb.h / 2, vTop: fTop, fTop: fTop + vb.h + FECHO.gap, logoCy: fTop + total - lh / 2 };
    L = { title, tb, serie, chipW, top, rowsTop, head, cards, CY, groupH, zoneTop, zoneBot, stampS, ss, stampW, stampH, virada, vb, fRows, fs, fin };

    if (VZ) { timelineVoz(cards); return; }
    // ---- linha do tempo: cada card fica o tempo de leitura do seu texto
    const gapOf = (k) => clamp(0.5 + 0.036 * k.chars, 0.85, 1.7);
    const vRead = clamp(1.9 + 0.012 * ep.virada.join(' ').replace(/\*/g, '').length, 2.3, 2.7);
    const t = { knock: 0.7, rise: 1.8, cards: [] };
    let x = 2.25;
    cards.forEach((k) => { t.cards.push(x); x += gapOf(k); });
    const tail = CUT + 2.1 + 0.35 + vRead + FECHO_D;
    let end = x + tail;
    if (end > DMAX || end < DMIN) {                 // a duração fica entre 10,4 e 14,4 s
      const target = clamp(end, DMIN, DMAX), span = x - 2.25, f = (target - tail - 2.25) / span;
      t.cards = t.cards.map((c) => 2.25 + (c - 2.25) * f); x = 2.25 + span * f;
    }
    t.cut = x;
    t.stamp = x + CUT;
    t.exit = t.stamp + 2.1;
    t.virada = t.exit + 0.35;
    t.fecho = t.virada + vRead;
    t.logo = t.fecho + 0.32;
    DURATION = Math.round((t.fecho + FECHO_D) * 60) / 60;
    t.fade = DURATION - 0.3;
    T = t;
  }

  // a voz manda no tempo: cada cena = a sua fala + um respiro (fala do título a partir do quadro 0)
  function timelineVoz(cards) {
    const d = (c) => VZ[c].dur;
    const build = (extra) => {
      const r = V.resp + extra, t = { knock: VZ.titulo.marca ?? 0.7, cards: [], voz: { titulo: 0 } };
      t.rise = d('titulo') + V.head;
      let x = t.rise + 0.45;
      cards.forEach((_, k) => { t.cards.push(x); t.voz[`card${k + 1}`] = x + V.entra; x = x + V.entra + d(`card${k + 1}`) + r; });
      t.cut = x;
      t.stamp = x + CUT;
      t.voz.carimbo = t.stamp + 0.15;
      t.exit = Math.max(t.stamp + 1.6, t.voz.carimbo + d('carimbo') + r);
      t.virada = t.exit + 0.35;
      t.voz.virada = t.virada + V.virada;
      t.fecho = t.voz.virada + d('virada') + r;
      t.voz.fecho = t.fecho + 0.2;
      t.logo = Math.max(t.fecho + 0.32, t.voz.fecho + d('fecho') - 0.25);   // a assinatura não cobre a fala
      t.end = Math.max(t.fecho + FECHO_D, t.logo + V.cauda);
      return t;
    };
    let t = build(0);
    if (t.end < V.min) t = build((V.min - t.end) / (cards.length + 2));   // respiros: depois de cada card, do carimbo e da virada
    DURATION = Math.ceil(t.end * 60) / 60;
    t.fade = DURATION - 0.3;
    // a virada: as linhas brancas entram juntas; cada linha lima entra quando a voz chega na 1ª palavra dela
    // (procura em ordem; sem achar, segue a anterior)
    const norm = (w) => w.toLocaleLowerCase('pt-BR').replace(/[^a-zà-ú0-9]/g, '');
    const pal = VZ.virada.palavras || [];
    const lime0 = L.virada.rows.findIndex((r) => r.some((w) => w.c === C.lime));
    let j = 0, prev = t.virada;
    t.viradaRows = L.virada.rows.map((row, i) => {
      let at = t.virada + i * 0.08;
      if (lime0 >= 0 && i >= lime0) {
        at = prev + 0.08;
        const k = pal.findIndex((w, q) => q >= j && norm(w[0]) === norm(row[0].s));
        if (k >= 0) { at = Math.max(at, t.voz.virada + pal[k][1] - 0.12); j = k + 1; }
      }
      prev = at;
      return at;
    });
    T = t;
  }

  // =====================================================================
  // CENAS
  // =====================================================================
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    // a grade de pontos da FAZLO Digital, respirando devagar
    const ox = (t * 6) % 44, oy = (t * 10) % 44;
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
    const g = c.createRadialGradient(540, 980, 0, 540, 980, 1150);
    g.addColorStop(0, 'rgba(18,22,22,0.0)'); g.addColorStop(1, 'rgba(5,6,6,0.75)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // a luz lima cresce com a pilha
    let n = 0;
    T.cards.forEach((m) => { n += p(t, m, m + 0.4); });
    const on = (n / T.cards.length) * (1 - p(t, T.exit, T.exit + 0.5));
    if (on > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 540, L.CY + 120, 720, 0.05 * on); c.restore(); }
  }

  function seriesChip(c, x, y, a) {
    if (a <= 0.002) return;
    const w = L.chipW, h = CHIP.h;
    c.save(); c.globalAlpha *= a;
    rr(c, x - w / 2, y, w, h, h / 2); c.fillStyle = C.card; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    circle(c, x - w / 2 + 28, y + h / 2, 7); c.fillStyle = C.lime; c.fill();
    txt(c, L.serie, x - w / 2 + 46, y + h / 2 + 0.36 * CHIP.size, { size: CHIP.size, weight: 700, color: C.soft, ls: CHIP.ls });
    c.restore();
  }

  function hook(c, t) {
    const exitY = -820 * E.inCubic(p(t, T.exit, T.exit + 0.4));
    if (exitY < -800) return;
    const e = E.inOutCubic(p(t, T.rise, T.rise + 0.5));
    const push = 1 + 0.025 * p(t, 0, T.rise);
    const { title, tb, rowsTop, head } = L;
    const rcy = rowsTop + tb.h / 2;
    seriesChip(c, CX, L.top + exitY, 1 - p(t, T.rise, T.rise + 0.22));
    const sc = lerp(push, head.s, e);
    c.save();
    c.translate(lerp(CX, W / 2, e), lerp(rcy, head.cy, e) + exitY); c.scale(sc, sc); c.translate(-CX, -rcy);
    const lime0 = title.rows.findIndex((r) => r.some((w) => w.c === C.lime));
    title.rows.forEach((row, i) => {
      const y = rowsTop + tb.base[i];
      c.save();
      if (lime0 >= 0 && i >= lime0) {             // a parte lima leva uma batida seca em 0,7 s
        const k = 0.045 * kick(t, T.knock, 0.35) * Math.cos((t - T.knock) * 38);
        c.translate(CX, y - 0.36 * title.size); c.scale(1 + k, 1 + k); c.translate(-CX, -(y - 0.36 * title.size));
      }
      drawRow(c, row, CX, y, title.size);
      c.restore();
    });
    c.restore();
  }

  // ---------------------------------------------------------------- cards
  const DRIFT = 50;                                 // a pilha sobe devagar até a saída: a cena nunca fica parada
  const groupDrift = (t) => -(VZ ? 90 : DRIFT) * E.inOutSine(p(t, T.cards[0], T.exit));
  // com voz os cards ficam mais tempo: cada um flutua de leve (fase própria), já assentado
  const floatY = (i, t) => (VZ ? 6 * Math.sin(TAU * (t - T.cards[i]) / 3.4 + i * 1.9) * p(t, T.cards[i] + 0.3, T.cards[i] + 1.0) : 0);
  const floatR = (i, t) => (VZ ? 0.45 * DEG * Math.sin(TAU * (t - T.cards[i]) / 4.6 + i * 2.7) * p(t, T.cards[i] + 0.3, T.cards[i] + 1.0) : 0);
  // o card da vez: contorno lima enquanto a sua fala soa
  function falando(i, t) {
    if (!VZ) return 0;
    const t0 = T.voz[`card${i + 1}`], t1 = t0 + VZ[`card${i + 1}`].dur;
    return p(t, t0 - 0.1, t0 + 0.2) * (1 - p(t, t1 + 0.1, t1 + 0.5));
  }
  const arrive = (j, t) => E.outBack(p(t, T.cards[j], T.cards[j] + 0.45), 1.3);
  function pileJolt(t) {
    const x = t - T.stamp;
    return x < 0 ? 0 : 18 * (1 - Math.exp(-x / 0.012)) * Math.exp(-x / 0.1) * Math.cos(TAU * 6 * x);
  }
  function cardTops(t) {
    let sum = 0;
    const acc = L.cards.map((k, j) => { const a = t >= T.cards[j] ? arrive(j, t) : 0; const o = sum; sum += a * (k.h + CARD.gap); return o; });
    const top = L.CY - (sum - CARD.gap * Math.min(1, t >= T.cards[0] ? arrive(0, t) : 0)) / 2;
    return acc.map((o) => top + o);
  }
  function cardBody(c, k, i, x, t, dim) {
    const h = k.h, w = k.w, r = k.kind === 'chip' ? h / 2 : CARD.r;
    rr(c, x, 0, w, h, r); c.fillStyle = C.card; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    const dy = k.kind === 'rotulo' ? 49 : h / 2;
    const next = i + 1 < T.cards.length ? T.cards[i + 1] : T.cut;
    const pulse = t < next ? ((t - T.cards[i]) % 0.9) / 0.6 : p(t, T.cards[i], T.cards[i] + 0.6);
    if (pulse > 0 && pulse < 1) { c.strokeStyle = rgba(C.lime, 0.7 * (1 - pulse)); c.lineWidth = 3; circle(c, x + 44, dy, 9 + 26 * E.outCubic(pulse)); c.stroke(); }
    circle(c, x + 44, dy, 9); c.fillStyle = C.lime; c.fill();
    if (k.kind === 'chip') {
      txt(c, k.chipS, x + 72, h / 2 + 0.36 * CARD.chip, { size: CARD.chip, weight: 700, color: C.white, ls: 3 });
    } else if (k.kind === 'rotulo') {
      txt(c, upper(smart(k.rotulo)), x + 70, 58, { size: CARD.label, weight: 700, color: C.muted, ls: 3 });
      k.rows.forEach((s, j) => txt(c, s, x + 40, 134 + j * CARD.lh, { size: k.size, weight: 600, color: C.white, ls: -0.01 * k.size }));
    } else {
      const b0 = h / 2 - (k.rows.length - 1) * CARD.lh / 2 + 0.36 * k.size;
      k.rows.forEach((s, j) => txt(c, s, x + 76, b0 + j * CARD.lh, { size: k.size, weight: 600, color: C.white, ls: -0.01 * k.size }));
    }
    if (dim > 0.005) { rr(c, x, 0, w, h, r); c.fillStyle = rgba(C.bg, dim); c.fill(); }
  }
  function cards(c, t) {
    const n = L.cards.length, jolt = pileJolt(t), tops = cardTops(t);
    const stampDim = 0.4 * E.outCubic(p(t, T.stamp, T.stamp + 0.25));
    L.cards.forEach((k, i) => {
      if (t < T.cards[i]) return;
      const inP = p(t, T.cards[i], T.cards[i] + 0.4), inE = E.outBack(inP, 1.4);
      let after = 0;
      for (let j = i + 1; j < n; j++) after += p(t, T.cards[j], T.cards[j] + 0.4);
      const dim = clamp(after * 0.12, 0, 0.36) + stampDim;
      let y = tops[i] + (1 - inE) * 150 + jolt * (1 - 0.1 * (n - 1 - i)) + floatY(i, t);
      const sc = lerp(0.96, 1, inE);
      let rot = floatR(i, t);
      const d = 0.04 * (n - 1 - i), ex = p(t, T.exit + d, T.exit + d + 0.42);
      if (ex > 0) { y += 1500 * E.inCubic(ex); rot = (hash(i, 7) - 0.5) * 14 * DEG * ex; }
      if (y > H + 40) return;
      const x = CARD.x;
      c.save();
      c.globalAlpha = p(inP, 0, 0.35);
      c.translate(x + k.w / 2, y + k.h / 2); c.rotate(rot); c.scale(sc, sc); c.translate(-(x + k.w / 2), -k.h / 2);
      c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
      rr(c, x, 0, k.w, k.h, k.kind === 'chip' ? k.h / 2 : CARD.r); c.fillStyle = C.card; c.fill();
      c.shadowColor = 'transparent';
      cardBody(c, k, i, x, t, dim * (1 - 0.6 * falando(i, t)));
      const fa = falando(i, t) * (1 - stampDim / 0.4);
      if (fa > 0.01) {
        rr(c, x, 0, k.w, k.h, k.kind === 'chip' ? k.h / 2 : CARD.r);
        c.strokeStyle = rgba(C.lime, 0.75 * fa); c.lineWidth = 3; c.stroke();
      }
      c.restore();
    });
  }

  // ---------------------------------------------------------------- o corte (a barra da marca) e o carimbo
  function slashCut(c, t) {
    const u = p(t, T.cut, T.stamp + 0.12);
    if (u <= 0 || u >= 1) return;
    const e = E.inOutCubic(u), h = 1300, w = 64;
    const x = lerp(-420, W + 420, e), y = L.CY + 10;
    c.save();
    c.globalCompositeOperation = 'lighter'; glow(c, x, y, 360, 0.18 * Math.sin(Math.PI * u)); c.globalCompositeOperation = 'source-over';
    slashPath(c, x, y, h, w); c.fillStyle = C.lime; c.fill();
    c.restore();
  }
  function stampChip(c, t) {
    if (t < T.stamp - 0.06) return;
    const x = t - T.stamp, u = p(t, T.stamp - 0.06, T.stamp);
    const ex = p(t, T.exit, T.exit + 0.42);
    if (ex >= 1) return;
    let sc = lerp(1.35, 1, E.inCubic(u));
    if (x >= 0) sc = 1 - 0.05 * Math.exp(-x / 0.05) * Math.cos(x * 60);
    const w = L.stampW, h = L.stampH, cx = STAMP.cx, cy = L.CY + 10 + pileJolt(t) + 1500 * E.inCubic(ex);
    if (x > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, cy, 380, (0.05 + 0.035 * Math.sin(TAU * (x - 0.3) / 1.4 - Math.PI / 2)) * p(x, 0.3, 0.6) * (1 - ex)); c.restore(); }
    c.save();
    c.globalAlpha = p(u, 0, 0.5);
    c.translate(cx, cy); c.rotate((STAMP.rot + 6 * ex) * DEG); c.scale(sc, sc);
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    rr(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = C.lime; c.fill();
    c.shadowColor = 'transparent';
    txt(c, L.stampS, 0, CAP * L.ss / 2, { fam: DISPLAY, size: L.ss, weight: 800, color: C.ink, align: 'center' });
    c.restore();
    if (x >= 0 && x < 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, cy, 420, 0.22 * kick(t, T.stamp, 0.4)); c.restore(); }
  }

  // ---------------------------------------------------------------- virada + fecho
  function closing(c, t) {
    if (t < T.virada) return;
    const { virada, vb, fin, fRows } = L;
    const up = E.inOutCubic(p(t, T.fecho, T.fecho + 0.5));
    const vTop = lerp(fin.vTop0, fin.vTop, up);
    const drift = VZ ? 1 + 0.06 * E.inOutSine(p(t, T.virada, T.fecho)) - 0.02 * E.inOutSine(p(t, T.fecho, DURATION))
      : 1 + 0.025 * E.inOutSine(p(t, T.virada + 0.3, DURATION));
    c.save(); c.translate(CX, 960); c.scale(drift, drift); c.translate(-CX, -960);
    virada.rows.forEach((row, i) => {
      const t0 = T.viradaRows ? T.viradaRows[i] : T.virada + i * 0.08;
      riseRow(c, row, CX, vTop + vb.base[i], virada.size, p(t, t0, t0 + 0.36));
    });
    if (t >= T.fecho) {
      const s = L.fs, ls = -0.01 * s;
      fRows.forEach((r, i) => {
        const pin = p(t, T.fecho + 0.08 + i * 0.07, T.fecho + 0.08 + i * 0.07 + 0.32);
        if (pin <= 0) return;
        const y = fin.fTop + 0.73 * s + i * s * FECHO.lead, off = (1 - E.outExpo(pin)) * s * 1.3;
        const w = tw(r, TEXT, s, FECHO.weight, ls);
        c.save(); c.beginPath(); c.rect(CX - w / 2 - 40, y - s * 1.05, w + 80, s * 1.45); c.clip();
        txt(c, r, CX - w / 2, y + off, { size: s, weight: FECHO.weight, color: C.soft, ls });
        c.restore();
      });
      if (t >= T.logo) {
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, fin.logoCy, 300, 0.06 + 0.16 * kick(t, T.logo + 0.2, 0.6)); c.restore();
        drawLogo(c, CX, fin.logoCy, LOCK.w, t, T.logo);
      }
    }
    c.restore();
  }

  function shake(t) {
    const x = t - T.stamp;
    if (x < 0 || x > 0.4) return [0, 0];
    const a = 7 * (1 - Math.exp(-x / 0.01)) * Math.exp(-x / 0.08);
    return [a * Math.sin(TAU * 23 * x + 0.6), a * (0.5 * Math.cos(TAU * 29 * x) + 0.3)];
  }
  function frame(c, t) {
    background(c, t);
    const [sx, sy] = shake(t);
    c.save(); c.translate(sx, sy);
    c.save(); c.translate(0, groupDrift(t));
    cards(c, t);
    slashCut(c, t);
    stampChip(c, t);
    c.restore();
    hook(c, t);
    closing(c, t);
    c.restore();
    const f = E.inOutSine(p(t, T.fade, DURATION));
    if (f > 0) { c.fillStyle = `rgba(0,0,0,${f})`; c.fillRect(0, 0, W, H); }
  }

  // ---------------------------------------------------------------- capa
  function cover(c) {
    background(c, 0);
    drawLogo(c, 540, 356, 220, Infinity, 0);         // logo pequena no topo, ao centro (y ≈ 322–390)
    const marked = EP.titulo.some((s) => s.includes('*'));
    const lines = EP.titulo.map((ln, i) => rich(ln, marked || i === 0 ? C.white : C.lime));
    const title = fitRows(lines, { maxW: 860, maxH: 700, max: 150, pref: 96, lead: 1.1 });
    const tb = blockOf(title);
    const blockH = CHIP.h + CHIP.gap + tb.h, top = 960 - blockH / 2;
    seriesChip(c, 540, top, 1);
    title.rows.forEach((row, i) => drawRow(c, row, 540, top + CHIP.h + CHIP.gap + tb.base[i], title.size));
    COVER = { top, bottom: top + blockH, size: title.size, rows: title.rows.map(rowText) };
  }
  let COVER = null;

  // ---------------------------------------------------------------- caixas para a revisão de áreas seguras
  function boxes() {
    const out = [];
    const { title, tb, rowsTop } = L;
    out.push({ el: 'chip da série', t: 0, x0: CX - L.chipW / 2, x1: CX + L.chipW / 2, y0: L.top, y1: L.top + CHIP.h });
    title.rows.forEach((r, i) => { const w = rowW100(r) * title.size / 100; out.push({ el: `título ${i + 1}`, t: 0, x0: CX - w / 2, x1: CX + w / 2, y0: rowsTop + tb.base[i] - CAP * title.size, y1: rowsTop + tb.base[i] + 0.06 * title.size }); });
    const hw = Math.max(...title.rows.map((r) => rowW100(r) * title.size / 100)) * L.head.s;
    out.push({ el: 'cabeçalho', t: T.stamp, x0: W / 2 - hw / 2, x1: W / 2 + hw / 2, y0: HEAD.top, y1: L.head.bottom });
    const G = (t, x0, x1, y0, y1) => { const d = groupDrift(t); return { x0, x1, y0: y0 + d, y1: y1 + d }; };
    const tc = T.cut - 0.05, tops = cardTops(tc);
    const fl = VZ ? 8 : 0;                          // flutuação (±6 px) e giro (±0,45°) no pior caso
    L.cards.forEach((k, i) => out.push({ el: `card ${i + 1}`, t: tc, ...G(tc, CARD.x - 2, CARD.x + k.w + 2, tops[i] - fl, tops[i] + k.h + fl) }));
    const a = STAMP.rot * DEG, ex = (Math.abs(Math.cos(a)) * L.stampW + Math.abs(Math.sin(a)) * L.stampH) / 2, ey = (Math.abs(Math.sin(a)) * L.stampW + Math.abs(Math.cos(a)) * L.stampH) / 2;
    out.push({ el: 'carimbo', t: T.stamp + 0.5, ...G(T.stamp + 0.5, STAMP.cx - ex, STAMP.cx + ex, L.CY + 10 - ey, L.CY + 10 + ey) });
    const dr = (t) => (VZ ? 1 + 0.06 * E.inOutSine(p(t, T.virada, T.fecho)) - 0.02 * E.inOutSine(p(t, T.fecho, DURATION))
      : 1 + 0.025 * E.inOutSine(p(t, T.virada + 0.3, DURATION)));
    const Dz = (t, x0, x1, y0, y1) => { const g = dr(t); return { t, x0: CX + (x0 - CX) * g, x1: CX + (x1 - CX) * g, y0: 960 + (y0 - 960) * g, y1: 960 + (y1 - 960) * g }; };
    const tv = T.fecho - 0.1, tf = DURATION - 0.35, vs = L.virada.size;
    L.virada.rows.forEach((r, i) => {
      const w = rowW100(r) * vs / 100;
      out.push({ el: `virada ${i + 1}`, ...Dz(tv, CX - w / 2, CX + w / 2, L.fin.vTop0 + L.vb.base[i] - CAP * vs, L.fin.vTop0 + L.vb.base[i] + 0.06 * vs) });
      out.push({ el: `virada ${i + 1} (no fecho)`, ...Dz(tf, CX - w / 2, CX + w / 2, L.fin.vTop + L.vb.base[i] - CAP * vs, L.fin.vTop + L.vb.base[i] + 0.06 * vs) });
    });
    const fs = L.fs;
    L.fRows.forEach((r, i) => {
      const w = tw(r, TEXT, fs, FECHO.weight, -0.01 * fs), b = L.fin.fTop + 0.73 * fs + i * fs * FECHO.lead;
      out.push({ el: `fecho ${i + 1}`, ...Dz(tf, CX - w / 2, CX + w / 2, b - 0.73 * fs, b + 0.24 * fs) });
    });
    const lh = logoH(LOCK.w);
    out.push({ el: 'logo', ...Dz(tf, CX - LOCK.w / 2, CX + LOCK.w / 2, L.fin.logoCy - lh / 2, L.fin.logoCy + lh / 2) });
    return out;
  }

  // ---------------------------------------------------------------- registro do episódio
  function episodio(id) {
    const x = new XMLHttpRequest(); x.open('GET', `${SERIE_BASE}/episodios/${id}.json`, false); x.send();
    if (x.status !== 200) throw new Error(`roteiro não encontrado: ${SERIE_BASE}/episodios/${id}.json`);
    EP = JSON.parse(x.responseText);
    VZ = null;
    if (EP.voz) {
      const v = new XMLHttpRequest(); v.open('GET', `/reels/${id}/audio/voz/voz.json`, false); v.send();
      if (v.status !== 200) throw new Error(`o roteiro tem voz, mas falta reels/${id}/audio/voz/voz.json (rode o voz.py da série)`);
      VZ = {}; JSON.parse(v.responseText).cenas.forEach((c) => { VZ[c.cena] = c; });
    }
    loadLogo();
    layout(EP);
    const fast = [[T.rise, T.rise + 0.5, 8, 1 / 60]]
      .concat(T.cards.map((m) => [m, m + 0.4, 4, 1 / 120]))
      .concat([[T.cut, T.stamp + 0.3, 8, 1 / 60], [T.exit, T.exit + 0.7, 10, 1 / 50],
        [T.virada, T.virada + 0.5, 4, 1 / 120], [T.fecho, T.fecho + 0.5, 4, 1 / 120], [T.logo, T.logo + 0.6, 6, 1 / 60]]);
    const reel = FZD.define({
      id, duration: DURATION,
      sections: { gancho: 0, situacao: T.cards[0], corte: T.cut, virada: T.virada, fecho: T.fecho },
      blur: { default: [1, 0], ranges: fast },
      setup() { layout(EP); },
      frame,
      cover,
      cues(api) {
        const cue = api.cue;
        cue(0, 'hook');
        cue(T.knock, 'knock');
        cue(T.rise, 'rise', { d: 0.5 });
        T.cards.forEach((m, k) => cue(m, 'ping', { k, n: T.cards.length }));
        cue(T.cut, 'cut', { d: CUT });
        cue(T.stamp, 'stamp');
        cue(T.exit, 'exit', { d: 0.5 });
        cue(T.virada, 'virada');
        cue(T.fecho, 'fecho');
        cue(T.logo, 'logo');
        cue(T.logo + 0.2, 'slash');
        cue(T.fade, 'fade', { d: DURATION - T.fade });
        if (VZ) Object.entries(T.voz).forEach(([cena, tv]) => cue(tv, 'voz', { cena, d: VZ[cena].dur }));
      },
    });
    window.FZS_EP = {
      boxes, roteiro: EP, T: () => ({ ...T, duration: DURATION }), voz: () => VZ,
      layout: () => ({ titulo: { size: L.title.size, linhas: L.title.rows.map(rowText) }, cabecalho: L.head.s, virada: { size: L.virada.size, linhas: L.virada.rows.map(rowText) }, fecho: [L.fs, ...L.fRows], carimbo: L.ss, duracao: DURATION }),
      capa: () => COVER,
    };
    return reel;
  }

  window.FZS = { episodio };
})();
