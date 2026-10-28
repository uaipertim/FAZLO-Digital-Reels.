/*
 * Legenda palavra por palavra (FAZLO Digital) — páginas e desenho. Independente de motor: o motor chama
 *
 *   const leg = LEGENDA.cria(dados, { ancora: (cena) => s, fim: s, faixa: [y0, y1] });
 *   leg.desenha(ctx, t);           // no frame(), por cima do resto
 *   leg.caixas(t);                 // as caixas das palavras na tela (revisão das áreas seguras)
 *   leg.paginas / leg.juntadas;    // para a revisão (confere.cjs)
 *
 * dados = o legenda.json do legenda.py: cenas > frases > palavras {w, t0, t1, chave}, no tempo do vídeo
 * ("tempo": "video") ou relativas à âncora de cada cena ("tempo": "ancora": o motor diz onde a fala da cena começa).
 *
 * Padrão aprovado da série FALA do Hospeda, na identidade FAZLO (Unbounded, branco, destaque em limão):
 *   - páginas de até 2 linhas, o máximo de palavras que cabe em 820 px, sem passar de uma cena para outra; com 2 linhas,
 *     o corte que equilibra as larguras (de preferência na troca de frase); a última página de uma cena nunca fica
 *     com 1 palavra só; cada frase começa página nova, e a frase que ficaria < 1,5 s na tela é juntada com a seguinte;
 *   - cada palavra entra quando começa a ser falada (90 ms, sobe 10 px) e as já ditas ficam; a página sai em corte seco
 *     quando a próxima começa (a última, em `fim`); a palavra-chave dá um "pulo" de 7% por 0,18 s ao entrar;
 *   - sem painel atrás, só sombra suave (preto 70%, desfoque 14 px); centralizada em x = 540, entre x 130 e 950.
 */
(function (root) {
  const EST = {
    fam: "'FZD Display', sans-serif", peso: 800, size: 50, lh: 68, ls: -0.01,   // ls em em
    maxW: 820, cx: 540, faixa: [1300, 1450],
    branco: '#FFFFFF', lima: '#C6FA41', sombra: 'rgba(0,0,0,0.7)', blur: 14, sombraY: 2,
    entra: 0.09, sobe: 10, pulo: 0.07, puloD: 0.18, minPagina: 1.5,
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const outCubic = (u) => 1 - Math.pow(1 - u, 3);
  const SOLTAS = new Set('o a os as e um uma de da do das dos no na nos nas em pra pro por que se com ao à'.split(' '));
  const solta = (w) => SOLTAS.has(w.toLocaleLowerCase('pt-BR'));                    // sem pontuação: "o", "de"… (não "de',")

  function cria(dados, o = {}) {
    const S = { ...EST, ...(o.estilo || {}), faixa: o.faixa || EST.faixa };
    const M = document.createElement('canvas').getContext('2d');
    const fonte = (c, size) => { c.font = `${S.peso} ${size}px ${S.fam}`; c.letterSpacing = `${S.ls * size}px`; };
    const mede = (s, size = S.size) => { fonte(M, size); return M.measureText(s).width - (s.length ? S.ls * size : 0); };
    const ancora = (cena) => (dados.tempo === 'video' || !o.ancora ? 0 : o.ancora(cena.id));

    // as palavras de cada cena no tempo do vídeo, com a frase de cada uma
    const cenas = dados.cenas.map((cena) => {
      const a0 = ancora(cena), ws = [], frases = [];
      cena.frases.forEach((f, fi) => {
        const ini = ws.length;
        f.palavras.forEach((w) => ws.push({ w: w.w, t0: w.t0 + a0, t1: w.t1 + a0, chave: !!w.chave, frase: fi }));
        if (ws.length > ini) frases.push([ini, ws.length]);
      });
      return { id: cena.id, ws, frases, ate: cena.ate == null ? null : cena.ate + ancora(cena) };   // ate: as páginas da cena acabam aqui
    });

    let juntadas = 0;
    const paginas = [], ultimas = [];
    cenas.forEach((cena, ci) => {
      const ws = cena.ws;
      if (!ws.length) return;
      const wid = (a, b) => mede(ws.slice(a, b).map((x) => x.w).join(' '));
      const folga = (k) => (ws[k].chave ? (S.pulo / 2) * mede(ws[k].w) : 0);          // o pulo da palavra-chave na ponta da linha
      const widP = (a, b) => wid(a, b) + folga(a) + folga(b - 1);
      // o corte em 2 linhas: b = 1 linha; senão o que equilibra (preferindo a troca de frase); null = não cabe
      const quebra = (a, b) => {
        if (widP(a, b) <= S.maxW) return b;
        let best = null, bs = 1e9, bf = null, bfs = 1e9;
        for (let k = a + 1; k < b; k++) {
          const l = widP(a, k), r = widP(k, b);
          if (l > S.maxW || r > S.maxW) continue;
          const m = Math.max(l, r) + (solta(ws[k - 1].w) ? 300 : 0);              // evita a linha terminar num "o", "de"…
          if (m < bs) { bs = m; best = k; }
          if (ws[k].frase !== ws[k - 1].frase && m < bfs) { bfs = m; bf = k; }
        }
        return bf ?? best;
      };
      const cabe = (a, b) => b - a === 1 || quebra(a, b) !== null;
      const prox = cenas.slice(ci + 1).find((c) => c.ws.length);
      const fimCena = Math.min(prox ? prox.ws[0].t0 : o.fim, cena.ate ?? Infinity);
      let unidades = cena.frases.map((f) => f.slice());
      let pags;
      for (;;) {
        pags = [];
        unidades.forEach(([a, b], ui) => {
          let i = a;
          while (i < b) {
            let j = i + 1;
            while (j < b && cabe(i, j + 1)) j++;
            while (j < b && j - i > 2 && solta(ws[j - 1].w) && ws[j - 1].t0 - ws[i].t0 >= S.minPagina) j--;   // nem a página (se ela ainda dura ≥ 1,5 s)
            pags.push({ a: i, b: j, u: ui }); i = j;
          }
        });
        // a última página da cena nunca com 1 palavra: puxa uma da anterior (ou junta as duas)
        const L = pags[pags.length - 1], P = pags[pags.length - 2];
        if (P && L.b - L.a === 1) {
          if (P.b - P.a > 2 && cabe(P.b - 1, L.b)) {
            do { P.b--; L.a--; } while (P.b - P.a > 2 && solta(ws[P.b - 1].w) && cabe(P.b - 1, L.b) && ws[P.b - 1].t0 - ws[P.a].t0 >= S.minPagina);
          } else if (cabe(P.a, L.b)) { P.b = L.b; pags.pop(); }
        }
        const dur = (k) => (k + 1 < pags.length ? ws[pags[k + 1].a].t0 : fimCena) - ws[pags[k].a].t0;
        // a última página da cena, curta, puxa palavras da anterior (da mesma frase) enquanto couber e a anterior seguir ≥ 1,5 s
        for (let Lq = pags[pags.length - 1], Pq = pags[pags.length - 2];
          Pq && Pq.u === Lq.u && dur(pags.length - 1) < S.minPagina && Pq.b - Pq.a > 2 && cabe(Pq.b - 1, Lq.b)
          && ws[Pq.b - 1].t0 - ws[Pq.a].t0 >= S.minPagina;) { Pq.b--; Lq.a--; }
        // a frase que fica < 1,5 s na tela (a última página dela) é juntada com a seguinte
        // (a última frase da cena, sem seguinte, é juntada com a anterior)
        const k = pags.findIndex((q, n) => dur(n) < S.minPagina && unidades.length > 1 && (n + 1 === pags.length || pags[n + 1].u !== q.u));
        if (k < 0) break;
        const u = Math.min(pags[k].u, unidades.length - 2);
        unidades.splice(u, 2, [unidades[u][0], unidades[u + 1][1]]);
        unidades.juntou = (unidades.juntou || new Set()).add(unidades[u][0]);
        juntadas++;
      }
      const juntou = unidades.juntou || new Set();
      pags.forEach((q) => {
        const k = q.b - q.a === 1 ? q.b : quebra(q.a, q.b);
        const larg = wid(q.a, q.b), esc = q.b - q.a === 1 && larg > S.maxW ? S.maxW / larg : 1;   // palavra sozinha larga demais
        const size = S.size * esc, lh = S.lh * esc;
        const rows = k >= q.b ? [[q.a, q.b]] : [[q.a, k], [k, q.b]];
        const yc = (S.faixa[0] + S.faixa[1]) / 2;
        const linhas = rows.map(([r0, r1], ri) => {
          const base = yc + (ri - (rows.length - 1) / 2) * lh + 0.365 * size;          // a linha da base (altura das maiúsculas ≈ 0,73)
          let x = S.cx - mede(ws.slice(r0, r1).map((x) => x.w).join(' '), size) / 2;
          const x0 = x;
          return ws.slice(r0, r1).map((w, n) => {
            const xx = n ? x0 + mede(ws.slice(r0, r0 + n).map((x) => x.w).join(' ') + ' ', size) : x0;
            const wpx = mede(w.w, size);
            return { w: w.w, chave: w.chave, t0: w.t0, x: xx, y: base, wpx, size };
          });
        });
        paginas.push({ cena: cena.id, t0: ws[q.a].t0, t1: null, n: q.b - q.a, juntada: juntou.has(unidades[q.u][0]),
          texto: ws.slice(q.a, q.b).map((x) => x.w).join(' '), linhas });
      });
      ultimas.push({ cena: cena.id, n: pags[pags.length - 1].b - pags[pags.length - 1].a });
    });
    paginas.forEach((q, i) => { q.t1 = i + 1 < paginas.length ? paginas[i + 1].t0 : o.fim; });   // corte seco na próxima
    paginas.forEach((q) => { const c = cenas.find((z) => z.id === q.cena); if (c && c.ate != null) q.t1 = Math.min(q.t1, c.ate); });   // a cena seguinte sem legenda
    const caixaDe = (w) => {                                                             // com o pulo no máximo, na palavra-chave
      const e = w.chave ? S.pulo / 2 : 0, cy = w.y - 0.365 * w.size;
      return { nome: 'legenda', x0: w.x - e * w.wpx, x1: w.x + w.wpx * (1 + e), y0: cy - (0.95 - 0.365) * w.size * (1 + 2 * e), y1: cy + (0.25 + 0.365) * w.size * (1 + 2 * e) };
    };
    paginas.forEach((q) => { q.caixas = q.linhas.flat().map(caixaDe); });

    const naTela = (t) => paginas.find((q) => t >= q.t0 && t < q.t1);
    return {
      paginas, juntadas, ultimas, estilo: S,
      desenha(c, t) {
        const q = naTela(t);
        if (!q) return;
        c.save();
        c.shadowColor = S.sombra; c.shadowBlur = S.blur; c.shadowOffsetY = S.sombraY;
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        for (const w of q.linhas.flat()) {
          if (t < w.t0) continue;
          const u = outCubic(clamp((t - w.t0) / S.entra));
          fonte(c, w.size);
          c.globalAlpha = u; c.fillStyle = w.chave ? S.lima : S.branco;
          const y = w.y + (1 - u) * S.sobe;
          if (w.chave) {
            const pulo = 1 + S.pulo * Math.sin(Math.PI * clamp((t - w.t0) / S.puloD));
            c.save(); c.translate(w.x + w.wpx / 2, y - 0.365 * w.size); c.scale(pulo, pulo);
            c.fillText(w.w, -w.wpx / 2, 0.365 * w.size); c.restore();
          } else c.fillText(w.w, w.x, y);
        }
        c.restore();
      },
      caixas(t) {
        const q = naTela(t);
        return q ? q.linhas.flat().filter((w) => t >= w.t0).map(caixaDe) : [];
      },
    };
  }

  root.LEGENDA = { cria, EST };
})(typeof window !== 'undefined' ? window : globalThis);
