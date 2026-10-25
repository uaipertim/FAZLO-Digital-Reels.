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

   LEGENDA (opcional, "legenda": true no roteiro; padrão false, os publicados ficam sem): a legenda
   palavra por palavra de tools/legenda-palavras/ (reels/<id>/audio/voz/legenda.json, do legenda.py),
   por cima de tudo, na faixa y 1300–1450. O layout dos cards não muda. Para uma prévia sem mexer
   no roteiro: &legenda=1 na URL (tools/render.cjs --legenda).
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
  // a linha sobe pela fenda palavra a palavra (cada palavra com o seu instante)
  function riseWords(c, row, cx, y, size, pins) {
    if (pins.every((q) => q <= 0)) return;
    const ls = LS_D * size, w = rowW100(row) * size / 100;
    c.save(); c.beginPath(); c.rect(cx - w / 2 - 60, y - size * 1.05, w + 120, size * 1.32); c.clip();
    setFont(c, DISPLAY, size, 900, 'left', ls);
    let x = cx - w / 2;
    row.forEach((wd, i) => {
      const adv = c.measureText(wd.s + (i < row.length - 1 ? ' ' : '')).width;
      if (pins[i] > 0) { c.fillStyle = wd.c; c.fillText(wd.s, x, y + (1 - E.outExpo(clamp(pins[i]))) * size * 1.25); }
      x += adv;
    });
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
    logo: 0.4,           // a logo começa a se montar 0,4 s depois do início da fala do fecho
    logoNaTela: 1.4,     // depois de pronta, a logo fica pelo menos 1,2 s na tela antes do fade (ajuste de 16/10; 1,4 s com folga)
    cauda: 1.2,          // depois da fala do fecho, a assinatura (duas notas) soa inteira antes do fim
    min: 25,             // abaixo disso, a diferença vai para os respiros (os cards ficam mais tempo)
  };
  let VZ = null;         // durações das falas (reels/<id>/audio/voz/voz.json)
  // LEITURA LONGA (padrão a partir do ep. 7; os eps. 1–6 têm "leitura": "curta" no roteiro e ficam como eram):
  // cada card fica >= 2,0 s inteiro e parado depois da sua fala; o carimbo >= 1,5 s parado; a virada >= 2,5 s inteira
  // depois da fala; "Manda pra…" 1,0 s parado depois da fala (era 3,0 s até 23/10); e a logo sozinha, centralizada e parada >= 3,0 s até
  // o fim. O texto dos cards cresce até 10% quando isso não quebra mais linhas. Limite do episódio: 38 s.
  const LEIT = { card: 2.0, carimbo: 1.5, virada: 2.5, fecho: 1.0, logo: 3.0, logoW: 560, texto: 1.10 };   // fecho: 1,0 s parado depois da fala (23/10; era 3,0 s)
  let LONGA = false;
  let LEG = null, LEG_DADOS = null;   // a legenda palavra por palavra (tools/legenda-palavras), só se ligada

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
    if (LONGA) {                                     // até +10%, sem quebrar mais linhas
      for (let z = Math.floor(size * LEIT.texto); z > size; z -= 1) {
        const r = wrap(s, TEXT, z, 600, -0.01 * z, maxW);
        if (r.length <= rows.length) { size = z; rows = r; break; }
      }
    }
    k.size = size; k.rows = rows; k.w = CARD.w;
    k.lh = Math.round(CARD.lh * Math.max(1, size / CARD.text));
    k.h = (k.kind === 'rotulo' ? 176 : 124) + (rows.length - 1) * k.lh;
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
    const total = vb.h + FECHO.gap + fH + (LONGA ? 0 : LOCK.before + lh);
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
      cards.forEach((_, k) => { t.cards.push(x); t.voz[`card${k + 1}`] = x + V.entra; x = x + V.entra + d(`card${k + 1}`) + (LONGA ? Math.max(r, LEIT.card) : r); });
      t.cut = x;
      t.stamp = x + CUT;
      t.voz.carimbo = t.stamp + 0.15;
      t.exit = LONGA ? Math.max(t.stamp + 0.4 + LEIT.carimbo, t.voz.carimbo + d('carimbo') + LEIT.carimbo)   // 0,4 s: o tremor do baque
        : Math.max(t.stamp + 1.6, t.voz.carimbo + d('carimbo') + r);
      t.virada = t.exit + 0.35;
      t.voz.virada = t.virada + V.virada;
      t.viradaFim = t.voz.virada + d('virada');
      t.fecho = t.viradaFim + (LONGA ? LEIT.virada : r);
      t.voz.fecho = t.fecho + 0.2;
      if (LONGA) {                                                     // o fecho parado; depois só a logo, parada até o fim
        t.sai = t.voz.fecho + d('fecho') + LEIT.fecho;
        t.logo = t.sai + 0.15;                                         // começa a se montar enquanto o texto sai (sem tela vazia)
        t.logoPronta = t.logo + 0.85;
        t.som = t.logo + 0.2;
        t.end = t.logoPronta + LEIT.logo;
        return t;
      }
      t.logo = t.voz.fecho + V.logo;                                   // a logo se monta durante "Manda pra quem…"
      t.logoPronta = t.logo + 0.85;                                    // letras, barra e DIGITAL no lugar
      t.som = Math.max(t.logo + 0.2, t.voz.fecho + d('fecho') + 0.05);  // a assinatura sonora soa depois da fala
      t.end = Math.max(t.fecho + FECHO_D, t.logoPronta + V.logoNaTela + 0.3, t.som + V.cauda);
      return t;
    };
    let t = build(0);
    if (t.end < V.min) t = build((V.min - t.end) / (cards.length + 2));   // respiros: depois de cada card, do carimbo e da virada
    DURATION = Math.ceil(t.end * 60) / 60;
    t.fade = LONGA ? DURATION : DURATION - 0.3;                         // na leitura longa a logo fica até o fim (sem fade)
    // a virada: as linhas antes da 1ª palavra lima entram juntas; dali em diante, cada palavra entra quando
    // a voz chega nela (procura em ordem; sem achar, entra logo depois da anterior)
    const norm = (w) => w.toLocaleLowerCase('pt-BR').replace(/[^a-zà-ú0-9]/g, '');
    const pal = VZ.virada.palavras || [];
    const lime0 = L.virada.rows.findIndex((r) => r.some((w) => w.c === C.lime));
    let j = 0, prev = t.virada;
    t.viradaWords = L.virada.rows.map((row, i) => row.map((w) => {
      let at = t.virada + i * 0.08;
      if (lime0 >= 0 && i >= lime0) {
        at = prev + 0.06;
        const k = pal.findIndex((q, n) => n >= j && norm(q[0]) === norm(w.s));
        if (k >= 0) { at = Math.max(at, t.voz.virada + pal[k][1] - 0.1); j = k + 1; }
      } else {
        const k = pal.findIndex((q, n) => n >= j && norm(q[0]) === norm(w.s));
        if (k >= 0) j = k + 1;                       // acompanha a fala, para a busca seguir dali
      }
      prev = at;
      return at;
    }));
    T = t;
  }

  // =====================================================================
  // CENAS
  // =====================================================================
  function background(c, t) {
    c.fillStyle = C.bg; c.fillRect(0, 0, W, H);
    // a grade de pontos da FAZLO Digital, respirando devagar
    const vel = LONGA ? 3 : 1;                         // leitura longa: o texto fica parado, o fundo segue vivo
    const ox = (t * 6 * vel) % 44, oy = (t * 10 * vel) % 44;
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let y = -44 + oy; y < H + 44; y += 44) for (let x = -44 + ox; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); }
    const g = c.createRadialGradient(540, 980, 0, 540, 980, 1150);
    g.addColorStop(0, 'rgba(18,22,22,0.0)'); g.addColorStop(1, 'rgba(5,6,6,0.75)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (LONGA) {                                       // uma luz lima larga passeia devagar pelo fundo (o texto fica parado)
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, 540 + 420 * Math.sin(t * 0.55), 960 + 520 * Math.sin(t * 0.41 + 1.2), 900, 0.06);
      glow(c, 540 + 420 * Math.sin(t * 0.55 + Math.PI / 2), 960 - 520 * Math.sin(t * 0.41 + 1.2 + Math.PI / 2), 800, 0.05);   // defasada: uma das duas sempre anda
      c.restore();
    }
    // a luz lima cresce com a pilha
    let n = 0;
    T.cards.forEach((m) => { n += p(t, m, m + 0.4); });
    const on = (n / T.cards.length) * (1 - p(t, T.exit, T.exit + 0.5));
    if (on > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 540 + (LONGA ? 90 * Math.sin(t * 0.9) : 0), L.CY + 120 + (LONGA ? 60 * Math.cos(t * 0.7) : 0), 720, 0.05 * on * (LONGA ? 1 + 0.35 * Math.sin(t * 1.3) : 1)); c.restore(); }
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
  const groupDrift = (t) => (LONGA ? 0 : -(VZ ? 90 : DRIFT) * E.inOutSine(p(t, T.cards[0], T.exit)));
  // com voz os cards ficam mais tempo: cada um flutua de leve (fase própria), já assentado
  const floatY = (i, t) => (VZ && !LONGA ? 6 * Math.sin(TAU * (t - T.cards[i]) / 3.4 + i * 1.9) * p(t, T.cards[i] + 0.3, T.cards[i] + 1.0) : 0);
  const floatR = (i, t) => (VZ && !LONGA ? 0.45 * DEG * Math.sin(TAU * (t - T.cards[i]) / 4.6 + i * 2.7) * p(t, T.cards[i] + 0.3, T.cards[i] + 1.0) : 0);
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
      k.rows.forEach((s, j) => txt(c, s, x + 40, 134 + j * k.lh, { size: k.size, weight: 600, color: C.white, ls: -0.01 * k.size }));
    } else {
      const b0 = h / 2 - (k.rows.length - 1) * k.lh / 2 + 0.36 * k.size;
      k.rows.forEach((s, j) => txt(c, s, x + 76, b0 + j * k.lh, { size: k.size, weight: 600, color: C.white, ls: -0.01 * k.size }));
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
    const drift = viradaZoom(t);
    const sai = LONGA ? E.inCubic(p(t, T.sai, T.sai + 0.4)) : 0;         // a virada e o fecho saem; depois, só a logo
    if (LONGA && t >= T.logo) logoSozinha(c, t);
    if (sai >= 1) return;
    c.save(); c.globalAlpha *= 1 - sai; c.translate(0, -70 * sai);
    c.translate(CX, 960); c.scale(drift, drift); c.translate(-CX, -960);
    virada.rows.forEach((row, i) => {
      if (T.viradaWords) riseWords(c, row, CX, vTop + vb.base[i], virada.size, T.viradaWords[i].map((t0) => p(t, t0, t0 + 0.36)));
      else riseRow(c, row, CX, vTop + vb.base[i], virada.size, p(t, T.virada + i * 0.08, T.virada + i * 0.08 + 0.36));
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
      if (t >= T.logo && !LONGA) {
        c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, fin.logoCy, 300, 0.06 + 0.16 * kick(t, T.logo + 0.2, 0.6)); c.restore();
        drawLogo(c, CX, fin.logoCy, LOCK.w, t, T.logo);
      }
    }
    c.restore();
  }

  // a virada se aproxima 6% enquanto é falada (na leitura longa, para quando a fala termina)
  const viradaZoom = (t) => (LONGA ? 1 + 0.06 * p(t, T.virada, T.viradaFim)
    : VZ ? 1 + 0.06 * p(t, T.virada, T.fecho) - 0.02 * E.inOutSine(p(t, T.fecho, DURATION))
      : 1 + 0.025 * E.inOutSine(p(t, T.virada + 0.3, DURATION)));
  function logoSozinha(c, t) {                        // a logo oficial, sozinha e centralizada; pronta, não se mexe mais
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, CX, 960, 420, 0.06 + 0.16 * kick(t, T.logo + 0.2, 0.6)); c.restore();
    drawLogo(c, CX, 960, LEIT.logoW, t, T.logo);
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
    if (LEG) LEG.desenha(c, t);
    const f = LONGA ? 0 : E.inOutSine(p(t, T.fade, DURATION));
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

  // ---------------------------------------------------------------- capa v2 (23/10): ilustração própria do tema
  // Só PNG (tools/capas-v2.cjs); a capa do quadro 0 dos vídeos continua a de cima. Roteiro: "capa_v2": {"ep": 5,
  // "ilustracao": "cafe" | "pet" | "caminhos" | "relogio" | "familia", "tom": "#0B0907"}.
  function neon(c, path, o = {}) {                   // traço lima com brilho suave e preenchimento escuro
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (o.fill !== null) { c.fillStyle = o.fill || '#111816'; c.fill(path); }
    c.lineWidth = o.lw || 12; c.strokeStyle = o.cor || C.lime; c.globalAlpha *= o.a ?? 1;
    if (o.dash) c.setLineDash(o.dash);
    c.shadowColor = rgba(C.lime, 0.55); c.shadowBlur = o.glow ?? 34; c.stroke(path);
    c.shadowBlur = 0; c.stroke(path); c.restore();
  }
  function cheio(c, path, cor = C.lime) { c.save(); c.fillStyle = cor; c.shadowColor = rgba(C.lime, 0.6); c.shadowBlur = 30; c.fill(path); c.shadowBlur = 0; c.fill(path); c.restore(); }
  const P = (f) => { const q = new Path2D(); f(q); return q; };
  const elipse = (x, y, rx, ry, r = 0) => P((q) => q.ellipse(x, y, rx, ry, r, 0, TAU));
  const caixa = (x, y, w, h, r) => P((q) => q.roundRect(x, y, w, h, r));
  function letra(c, s, x, y, size, cor) { setFont(c, DISPLAY, size, 900, 'center'); c.fillStyle = cor; c.fillText(s, x, y + size * 0.36); }
  // as ilustrações, numa caixa de 600 × 560 (origem no canto de cima à esquerda)
  const ILUSTRA = {
    cafe(c) {                                        // xícara com um "?" desenhado no vapor
      neon(c, elipse(300, 478, 240, 40), { fill: '#0E1412' });
      neon(c, P((q) => { q.moveTo(140, 262); q.lineTo(460, 262); q.lineTo(428, 430); q.quadraticCurveTo(418, 470, 372, 470); q.lineTo(228, 470); q.quadraticCurveTo(182, 470, 172, 430); q.closePath(); }));
      neon(c, P((q) => q.arc(470, 345, 58, -1.25, 1.25)), { fill: null });
      neon(c, elipse(300, 262, 160, 24), { fill: '#1C2A1A' });
      cheio(c, elipse(300, 264, 128, 15), rgba(C.lime, 0.35));
      neon(c, P((q) => { q.moveTo(232, 112); q.bezierCurveTo(232, 30, 368, 30, 368, 112); q.bezierCurveTo(368, 168, 300, 164, 300, 214); }), { fill: null, lw: 15 });
      cheio(c, elipse(300, 240, 11, 11));
      [[188, 1], [412, -1]].forEach(([x, d]) => neon(c, P((q) => { q.moveTo(x, 232); q.bezierCurveTo(x - 24 * d, 196, x + 24 * d, 170, x, 132); }), { fill: null, lw: 9, a: 0.6, glow: 20 }));
    },
    pet(c) {                                         // pata dentro de um balão de pergunta
      neon(c, P((q) => { q.roundRect(50, 40, 500, 390, 80); q.moveTo(170, 425); q.lineTo(120, 525); q.lineTo(255, 425); }));
      c.save(); c.fillStyle = '#111816'; c.fillRect(176, 418, 72, 16); c.restore();
      cheio(c, elipse(300, 290, 92, 74));
      [[188, 200, -0.45], [250, 135, -0.15], [350, 135, 0.15], [412, 200, 0.45]].forEach(([x, y, r]) => cheio(c, elipse(x, y, 34, 44, r)));
      cheio(c, elipse(520, 60, 52, 52)); letra(c, '?', 520, 60, 64, C.ink);
    },
    caminhos(c) {                                    // três caminhos que se separam, com um "?" no cruzamento
      const vias = [[[300, 300], [300, 160], [300, 40]], [[300, 300], [150, 250], [80, 70]], [[300, 300], [450, 250], [520, 70]]];
      const via = (pts) => P((q) => { q.moveTo(...pts[0]); q.quadraticCurveTo(...pts[1], ...pts[2]); });
      const tronco = P((q) => { q.moveTo(300, 540); q.lineTo(300, 300); });
      [tronco, ...vias.map(via)].forEach((v) => { c.save(); c.lineWidth = 56; c.lineCap = 'round'; c.strokeStyle = '#16211C'; c.stroke(v); c.restore(); });
      [tronco, ...vias.map(via)].forEach((v) => neon(c, v, { fill: null, lw: 13, dash: [2, 30], glow: 22 }));
      vias.forEach((v) => { cheio(c, elipse(v[2][0], v[2][1], 20, 20)); });
      neon(c, elipse(300, 540, 18, 18), { fill: C.white, cor: C.white });
      neon(c, elipse(300, 300, 74, 74), { lw: 13 });
      letra(c, '?', 300, 300, 92, C.lime);
    },
    relogio(c) {                                     // relógio grande com uma chave de quarto pendurada
      const X = 235, Y = 205, R = 190;
      neon(c, elipse(X, Y, R, R), { lw: 15 });
      for (let k = 0; k < 12; k++) {
        const a = k * TAU / 12, r0 = k % 3 ? R - 36 : R - 54;
        neon(c, P((q) => { q.moveTo(X + Math.sin(a) * r0, Y - Math.cos(a) * r0); q.lineTo(X + Math.sin(a) * (R - 20), Y - Math.cos(a) * (R - 20)); }), { fill: null, lw: k % 3 ? 7 : 12, glow: 12 });
      }
      neon(c, P((q) => { q.moveTo(X, Y); q.lineTo(X, Y - 128); }), { fill: null, lw: 13 });
      neon(c, P((q) => { q.moveTo(X, Y); q.lineTo(X + Math.sin(TAU / 6) * 92, Y - Math.cos(TAU / 6) * 92); }), { fill: null, lw: 16 });
      cheio(c, elipse(X, Y, 17, 17));
      // o fio sai do relógio, passa por uma argola e segura a chave e a etiqueta
      const hx = X + R * Math.cos(Math.PI / 4), hy = Y + R * Math.sin(Math.PI / 4);
      neon(c, P((q) => { q.moveTo(hx, hy); q.quadraticCurveTo(hx + 40, hy + 10, 430, 392); }), { fill: null, lw: 7, glow: 10 });
      neon(c, elipse(430, 404, 16, 16), { fill: null, lw: 9 });
      neon(c, P((q) => { q.arc(430, 462, 38, 0, TAU); q.moveTo(430, 500); q.lineTo(430, 556); q.moveTo(430, 524); q.lineTo(458, 524); q.moveTo(430, 548); q.lineTo(452, 548); }), { lw: 11 });
      cheio(c, elipse(430, 462, 13, 13), '#111816');
      neon(c, P((q) => { q.moveTo(444, 412); q.lineTo(500, 430); }), { fill: null, lw: 7, glow: 10 });
      c.save(); c.translate(530, 486); c.rotate(0.2); neon(c, caixa(-42, -58, 84, 124, 20), { lw: 10 }); cheio(c, elipse(0, -36, 9, 9), '#111816'); c.restore();
    },
    preco(c) {                                       // etiqueta de preço pendurada, com "R$ ?" no lugar do valor
      neon(c, P((q) => { q.moveTo(300, 20); q.quadraticCurveTo(250, 60, 268, 118); }), { fill: null, lw: 7, glow: 10 });
      c.save(); c.translate(300, 300); c.rotate(-0.12);
      neon(c, P((q) => { q.moveTo(0, -190); q.lineTo(170, -110); q.lineTo(170, 230); q.quadraticCurveTo(170, 250, 150, 250); q.lineTo(-150, 250); q.quadraticCurveTo(-170, 250, -170, 230); q.lineTo(-170, -110); q.closePath(); }), { lw: 14 });
      neon(c, elipse(0, -110, 22, 22), { fill: '#050606', lw: 9 });
      letra(c, 'R$', 0, 20, 92, C.white); letra(c, '?', 0, 150, 120, C.lime);
      c.restore();
    },
    estrada(c) {                                     // pino no fim de uma estrada sinuosa, com um "?" no caminho
      const via = P((q) => { q.moveTo(80, 545); q.bezierCurveTo(420, 520, 520, 420, 330, 360); q.bezierCurveTo(140, 300, 160, 210, 330, 175); });
      c.save(); c.lineWidth = 64; c.lineCap = 'round'; c.strokeStyle = '#16211C'; c.stroke(via); c.restore();
      neon(c, via, { fill: null, lw: 12, dash: [2, 30], glow: 22 });
      neon(c, P((q) => { q.moveTo(330, 170); q.bezierCurveTo(318, 145, 270, 118, 270, 70); q.arc(330, 70, 60, Math.PI, 0); q.bezierCurveTo(390, 118, 342, 145, 330, 170); q.closePath(); }), { lw: 12 });
      cheio(c, elipse(330, 70, 20, 20));
      neon(c, elipse(190, 300, 52, 52), { lw: 11 }); letra(c, '?', 190, 300, 68, C.lime);
    },
    calendario(c) {                                  // calendário com uma data marcada e um "?" em cima dela
      neon(c, caixa(40, 90, 520, 450, 36), { lw: 14 });
      cheio(c, caixa(40, 90, 520, 90, 36), rgba(C.lime, 0.25)); neon(c, P((q) => { q.moveTo(40, 180); q.lineTo(560, 180); }), { fill: null, lw: 10 });
      neon(c, P((q) => { q.moveTo(160, 60); q.lineTo(160, 125); q.moveTo(440, 60); q.lineTo(440, 125); }), { fill: null, lw: 14 });
      for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
        const x = 95 + k * 82, y = 230 + r * 80;
        if (r === 2 && k === 3) { neon(c, elipse(x, y, 40, 40), { fill: rgba(C.lime, 0.3), lw: 10 }); letra(c, '?', x, y - 92, 72, C.lime); }
        else { c.save(); c.fillStyle = rgba(C.white, 0.25); c.beginPath(); c.roundRect(x - 18, y - 12, 36, 24, 8); c.fill(); c.restore(); }
      }
    },
    piscina(c) {                                     // escada de piscina com água à esquerda e uma porta fechada com "?" à direita
      neon(c, caixa(0, 330, 290, 220, 26), { fill: '#0F2A26', lw: 10 });
      for (let k = 0; k < 3; k++) neon(c, P((q) => { q.moveTo(30 + k * 10, 380 + k * 55); q.bezierCurveTo(80, 365 + k * 55, 120, 395 + k * 55, 170 + k * 15, 380 + k * 55); q.bezierCurveTo(210, 365 + k * 55, 240, 395 + k * 55, 265, 380 + k * 55); }), { fill: null, lw: 7, a: 0.7, glow: 14 });
      neon(c, P((q) => { q.moveTo(90, 470); q.lineTo(90, 230); q.arc(140, 230, 50, Math.PI, 0); q.moveTo(170, 470); q.lineTo(170, 250); q.arc(210, 250, 40, Math.PI, 0); q.moveTo(90, 300); q.lineTo(170, 300); q.moveTo(90, 360); q.lineTo(170, 360); }), { fill: null, lw: 12 });
      neon(c, caixa(360, 70, 210, 400, 16), { lw: 14 });
      neon(c, caixa(385, 100, 160, 150, 10), { fill: null, lw: 7, glow: 10 }); neon(c, caixa(385, 280, 160, 160, 10), { fill: null, lw: 7, glow: 10 });
      cheio(c, elipse(530, 290, 12, 12));
      neon(c, elipse(465, 175, 46, 46), { fill: '#050606', lw: 10 }); letra(c, '?', 465, 175, 62, C.lime);
      neon(c, P((q) => { q.moveTo(330, 470); q.lineTo(600, 470); }), { fill: null, lw: 9, glow: 10 });
    },
    familia(c) {                                     // cama de casal e berço lado a lado, com pessoas contando
      neon(c, caixa(30, 300, 300, 90, 20));
      neon(c, caixa(12, 378, 336, 96, 18));
      cheio(c, caixa(12, 418, 336, 56, 16), rgba(C.lime, 0.3));
      neon(c, caixa(56, 336, 104, 40, 14), { lw: 9 }); neon(c, caixa(198, 336, 104, 40, 14), { lw: 9 });
      neon(c, P((q) => { q.moveTo(30, 474); q.lineTo(30, 520); q.moveTo(330, 474); q.lineTo(330, 520); }), { fill: null, lw: 11 });
      neon(c, caixa(392, 330, 190, 140, 14), { lw: 11 });
      for (let x = 420; x < 570; x += 27) neon(c, P((q) => { q.moveTo(x, 344); q.lineTo(x, 456); }), { fill: null, lw: 7, glow: 10 });
      neon(c, P((q) => { q.moveTo(400, 470); q.lineTo(400, 520); q.moveTo(574, 470); q.lineTo(574, 520); }), { fill: null, lw: 11 });
      const gente = [[60, 1.0], [150, 1.0], [235, 0.72], [305, 0.72], [375, 0.72], [470, 0.92]];
      gente.forEach(([x, k], i) => {
        const yb = 240, h = 150 * k;
        neon(c, P((q) => { q.arc(x, yb - h + 30 * k, 28 * k, 0, TAU); q.moveTo(x - 44 * k, yb); q.quadraticCurveTo(x - 44 * k, yb - h * 0.52, x, yb - h * 0.52); q.quadraticCurveTo(x + 44 * k, yb - h * 0.52, x + 44 * k, yb); }), { fill: null, lw: 9, glow: 18 });
        cheio(c, elipse(x, yb + 34, 20, 20)); setFont(c, TEXT, 24, 700, 'center'); c.fillStyle = C.ink; c.fillText(String(i + 1), x, yb + 43);
      });
    },
  };
  function capaV2(c) {
    const cfg = EP.capa_v2 || {};
    c.setTransform(1, 0, 0, 1, 0, 0);
    background(c, 0);
    if (cfg.tom) { c.save(); c.globalAlpha = 0.9; c.globalCompositeOperation = 'source-over'; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cfg.tom); g.addColorStop(1, '#050606'); c.fillStyle = g; c.globalAlpha = 0.85; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < H + 44; y += 44) for (let x = 0; x < W + 44; x += 44) { c.beginPath(); c.arc(x, y, 1.3, 0, TAU); c.fill(); } }
    drawLogo(c, 540, 356, 220, Infinity, 0);         // a logo pequena no topo, como na capa de hoje
    // o título: as mesmas linhas da capa de hoje, 15% menor
    const marked = EP.titulo.some((s) => s.includes('*'));
    const lines = EP.titulo.map((ln, i) => rich(ln, marked || i === 0 ? C.white : C.lime));
    const title = fitRows(lines, { maxW: 860, maxH: 700, max: 150, pref: 96, lead: 1.1 });
    const IH = 560, G1 = 56, G2 = 40, BASE = 1540;     // o título termina até y 1540 (a faixa de baixo do recorte fica livre)
    const tb = blockOf(title), k = Math.min(0.85, (BASE - 430 - IH - G1 - CHIP.h - G2) / tb.h), size = title.size * k;
    const total = IH + G1 + CHIP.h + G2 + tb.h * k;
    const top = Math.max(430, 960 - total / 2);
    // a ilustração, com uma luz lima suave atrás
    c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 540, top + IH / 2, 520, 0.10); c.restore();
    c.save(); c.translate(240, top); ILUSTRA[cfg.ilustracao](c); c.restore();
    // o selo com o número do episódio
    const selo = upper(`Pelos olhos do hóspede · EP. ${String(cfg.ep).padStart(2, '0')}`);
    setFont(c, TEXT, CHIP.size, 700, 'left', CHIP.ls);
    const sw = c.measureText(selo).width - CHIP.ls + 46 + 28, sy = top + IH + G1;
    rr(c, 540 - sw / 2, sy, sw, CHIP.h, CHIP.h / 2); c.fillStyle = C.card; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    circle(c, 540 - sw / 2 + 28, sy + CHIP.h / 2, 7); c.fillStyle = C.lime; c.fill();
    txt(c, selo, 540 - sw / 2 + 46, sy + CHIP.h / 2 + 0.36 * CHIP.size, { size: CHIP.size, weight: 700, color: C.soft, ls: CHIP.ls });
    const ty = sy + CHIP.h + G2;
    title.rows.forEach((row, i) => drawRow(c, row, 540, ty + tb.base[i] * k, size));
    return { top, ilustracao: [top, top + IH], selo: [sy, sy + CHIP.h], titulo: [ty, ty + tb.h * k], size };
  }

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
    const dr = viradaZoom;
    const Dz = (t, x0, x1, y0, y1) => { const g = dr(t); return { t, x0: CX + (x0 - CX) * g, x1: CX + (x1 - CX) * g, y0: 960 + (y0 - 960) * g, y1: 960 + (y1 - 960) * g }; };
    const tv = T.fecho - 0.1, tf = LONGA ? T.sai - 0.05 : DURATION - 0.35, vs = L.virada.size;
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
    if (LEG) LEG.paginas.forEach((q, i) => q.caixas.forEach((b) => out.push({ el: `legenda ${i + 1}`, t: Math.max(q.t0, q.t1 - 0.05), ...b })));
    if (LONGA) { const lw = LEIT.logoW, lh2 = logoH(lw); out.push({ el: 'logo sozinha', t: DURATION - 0.05, x0: CX - lw / 2, x1: CX + lw / 2, y0: 960 - lh2 / 2, y1: 960 + lh2 / 2 }); return out; }
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
    LONGA = !!EP.voz && EP.leitura !== 'curta';
    if (EP.voz) {
      const v = new XMLHttpRequest(); v.open('GET', `/reels/${id}/audio/voz/voz.json`, false); v.send();
      if (v.status !== 200) throw new Error(`o roteiro tem voz, mas falta reels/${id}/audio/voz/voz.json (rode o voz.py da série)`);
      VZ = {}; JSON.parse(v.responseText).cenas.forEach((c) => { VZ[c.cena] = c; });
    }
    loadLogo();
    layout(EP);
    LEG = null; LEG_DADOS = null;
    const pede = typeof location !== 'undefined' && new URLSearchParams(location.search).get('legenda');
    if ((EP.legenda || pede === '1') && pede !== '0') {
      if (!VZ) throw new Error('a legenda precisa da voz (o campo "voz" do roteiro)');
      const get = (u) => { const r = new XMLHttpRequest(); r.open('GET', u, false); r.send(); if (r.status !== 200) throw new Error(`falta ${u} (rode tools/legenda-palavras/legenda.py pelos ${id})`); return r.responseText; };
      if (!window.LEGENDA) (0, eval)(get('/tools/legenda-palavras/legenda.js'));
      LEG_DADOS = JSON.parse(get(`/reels/${id}/audio/voz/legenda.json`));
    }
    const legenda = () => { LEG = LEG_DADOS && window.LEGENDA.cria(LEG_DADOS, { ancora: (cena) => T.voz[cena], fim: LONGA ? T.sai : DURATION }); };
    legenda();
    const fast = [[T.rise, T.rise + 0.5, 8, 1 / 60]]
      .concat(T.cards.map((m) => [m, m + 0.4, 4, 1 / 120]))
      .concat([[T.cut, T.stamp + 0.3, 8, 1 / 60], [T.exit, T.exit + 0.7, 10, 1 / 50],
        [T.virada, T.virada + 0.5, 4, 1 / 120], [T.fecho, T.fecho + 0.5, 4, 1 / 120], [T.logo, T.logo + 0.6, 6, 1 / 60]]);
    const reel = FZD.define({
      id, duration: DURATION,
      sections: { gancho: 0, situacao: T.cards[0], corte: T.cut, virada: T.virada, fecho: T.fecho },
      blur: { default: [1, 0], ranges: fast },
      setup() { layout(EP); legenda(); },             // a legenda mede as palavras com a fonte já carregada
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
        cue(VZ ? T.som - 0.2 : T.logo, 'logo');                      // com voz: a assinatura depois da fala
        cue(T.logo + 0.2, 'slash');
        cue(T.fade, 'fade', { d: DURATION - T.fade });
        if (VZ) Object.entries(T.voz).forEach(([cena, tv]) => cue(tv, 'voz', { cena, d: VZ[cena].dur }));
      },
    });
    window.FZS_EP = {
      boxes, roteiro: EP, T: () => ({ ...T, duration: DURATION }), voz: () => VZ,
      layout: () => ({ titulo: { size: L.title.size, linhas: L.title.rows.map(rowText) }, cabecalho: L.head.s, virada: { size: L.virada.size, linhas: L.virada.rows.map(rowText) }, fecho: [L.fs, ...L.fRows], carimbo: L.ss, duracao: DURATION }),
      capa: () => COVER,
      capaV2: (c) => capaV2(c),
    };
    return reel;
  }

  window.FZS = { episodio };
})();
