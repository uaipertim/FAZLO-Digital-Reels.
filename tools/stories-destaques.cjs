#!/usr/bin/env node
/*
 * Stories estáticos dos DESTAQUES do @fazlodigital (Chromium headless -> PNG).
 *
 *   node tools/stories-destaques.cjs
 *     -> stories/destaques/<destaque>/01.png, 02.png…   (1080x1920)
 *     -> stories/destaques/previa.jpg                    todos lado a lado (tools/stories_destaques_previa.py)
 *
 * Identidade FAZLO Digital: Unbounded (títulos) + Sora (apoio), lima #C6FA41, fundo #050606, logo do kit no topo.
 * Faixas livres: y < 250 (barra do Story) e y > 1650 (área de resposta) — o script confere que nada passa delas.
 * Ilustrações em traço lima com brilho (o estilo das capas v2 e das capas do Explica). Título: até 2 linhas, com
 * *trecho em lima*; apoio: até 2 linhas. Ícones genéricos e próprios: nenhum logo de WhatsApp, Instagram ou Booking.
 * Cases: telas REAIS dos sites (capturas do repositório) num celular genérico; os topos usados não têm telefone.
 */
const fs = require('fs');
const path = require('path');
const { ROOT, loadPlaywright, chromiumPath } = require('./lib.cjs');

const OUT = path.join(ROOT, 'stories', 'destaques');
const SRC = path.join(OUT, 'src');
const W = 1080, H = 1920, TOPO = 250, BASE = 1650;
const LIMA = '#C6FA41';

// ---------------------------------------------------------------- desenho: traço lima com brilho
const neon = (body, w = 7) => `<g fill="none" stroke="${LIMA}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#brilho)">${body}</g>`;
const cheio = (body) => `<g fill="${LIMA}" stroke="none" filter="url(#brilho)">${body}</g>`;
const svg = (h, body, top = 0) => `<svg class="ilu" style="top:${top}px" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <defs><filter id="brilho" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${body}</svg>`;

// ícones de traço (grade de 100, centrados em 0,0) — os mesmos das capas, mais os da lista
const IC = {
  logo: `<rect x="-42" y="-42" width="84" height="84" rx="20"/><path d="M -16 -18 H 18 L -18 18 H 16"/>`,
  fotos: `<rect x="-46" y="-36" width="92" height="72" rx="10"/><circle cx="20" cy="-12" r="8"/><path d="M -46 26 L -14 -4 L 10 18 L 22 8 L 46 30"/>`,
  incluso: `<path d="M -36 -6 H 26 V 18 A 22 22 0 0 1 4 40 H -14 A 22 22 0 0 1 -36 18 Z"/><path d="M 26 2 H 34 A 12 12 0 0 1 34 26 H 26"/><path d="M -16 -38 C -24 -28 -8 -26 -16 -16 M 4 -38 C -4 -28 12 -26 4 -16"/>`,
  regras: `<rect x="-34" y="-44" width="68" height="88" rx="10"/><path d="M -18 -22 H 18 M -18 -4 H 18 M -18 14 H 6"/><path d="M -14 -50 H 14"/>`,
  chegar: `<path d="M 0 46 C -30 14 -34 -2 -34 -12 A 34 34 0 0 1 34 -12 C 34 -2 30 14 0 46 Z"/><circle cx="0" cy="-12" r="12"/>`,
  mensagem: `<path d="M -12 28 L 32 28 A 18 18 0 0 0 50 10 L 50 -22 A 18 18 0 0 0 32 -40 L -32 -40 A 18 18 0 0 0 -50 -22 L -50 10 A 18 18 0 0 0 -32 28 L -36 46 Z"/>`,
  scan: `<rect x="-36" y="-50" width="72" height="100" rx="10"/><path d="M -20 -32 H 20 M -20 -18 H 6 M -20 22 H 20 M -20 36 H 2 M -54 2 H 54"/>`,
  navegador: `<rect x="-50" y="-40" width="100" height="80" rx="12"/><path d="M -50 -16 H 50"/><rect x="-34" y="0" width="68" height="24" rx="6"/>`,
};
const pontos = (cx, cy, s) => cheio(`<circle cx="${cx - 22 * s}" cy="${cy - 6 * s}" r="${6 * s}"/><circle cx="${cx}" cy="${cy - 6 * s}" r="${6 * s}"/><circle cx="${cx + 22 * s}" cy="${cy - 6 * s}" r="${6 * s}"/>`);
const icone = (k, x, y, s, w = 7) => `<g transform="translate(${x} ${y}) scale(${s})">${neon(IC[k], w / s)}</g>`;

// ---------------------------------------------------------------- ilustrações
const ILU = {
  // a ficha atravessada pela linha de scan, com as linhas lidas acendendo
  raioX: () => svg(700, `
    ${neon(`<rect x="370" y="90" width="340" height="470" rx="40"/>`, 8)}
    ${neon(`<path d="M 430 170 H 650 M 430 230 H 590 M 430 290 H 640"/>`, 7)}
    <g opacity="0.45">${neon(`<path d="M 430 410 H 650 M 430 470 H 560"/>`, 7)}</g>
    ${neon(`<path d="M 250 345 H 830"/>`, 10)}
    <rect x="250" y="345" width="580" height="80" fill="url(#rastro)" opacity="0.35"/>
    <defs><linearGradient id="rastro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${LIMA}" stop-opacity="0.6"/><stop offset="1" stop-color="${LIMA}" stop-opacity="0"/></linearGradient></defs>
    ${cheio(`<circle cx="250" cy="345" r="9"/><circle cx="830" cy="345" r="9"/>`)}`),
  // duas perguntas: dois balões com "?"
  perguntas: () => svg(330, `
    ${neon(`<path d="M 300 250 L 300 270 L 330 250 H 470 A 30 30 0 0 0 500 220 V 90 A 30 30 0 0 0 470 60 H 210 A 30 30 0 0 0 180 90 V 220 A 30 30 0 0 0 210 250 Z"/>`, 8)}
    ${neon(`<path d="M 780 280 L 780 300 L 750 280 H 610 A 30 30 0 0 1 580 250 V 120 A 30 30 0 0 1 610 90 H 870 A 30 30 0 0 1 900 120 V 250 A 30 30 0 0 1 870 280 Z"/>`, 8)}
    ${neon(`<path d="M 312 120 A 28 28 0 1 1 352 146 C 340 154 340 162 340 176"/>`, 8)}${cheio(`<circle cx="340" cy="208" r="8"/>`)}
    ${neon(`<path d="M 712 150 A 28 28 0 1 1 752 176 C 740 184 740 192 740 206"/>`, 8)}${cheio(`<circle cx="740" cy="238" r="8"/>`)}`),
  // a ficha vira o site: ficha → seta → celular com o site e o check
  nasce: () => svg(720, `
    <g opacity="0.55">${neon(`<rect x="150" y="230" width="210" height="290" rx="28"/><path d="M 190 290 H 320 M 190 330 H 280 M 190 450 H 310"/><path d="M 120 390 H 390"/>`, 7)}</g>
    ${neon(`<path d="M 420 375 H 540 M 505 340 L 540 375 L 505 410"/>`, 9)}
    ${neon(`<rect x="600" y="60" width="330" height="640" rx="54"/><path d="M 720 96 H 810"/>`, 8)}
    ${neon(`<rect x="640" y="140" width="250" height="170" rx="18"/><path d="M 640 270 L 705 215 L 750 255 L 785 225 L 890 300"/><path d="M 650 350 H 830 M 650 390 H 770"/><rect x="640" y="440" width="250" height="70" rx="35"/>`, 6)}
    ${cheio(`<circle cx="905" cy="85" r="48"/>`)}<path d="M 882 86 L 899 103 L 930 70" fill="none" stroke="#050606" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`),
  // celular vazio, montando: blocos tracejados e o cursor (o próximo site)
  proximo: () => svg(720, `
    ${neon(`<rect x="375" y="40" width="330" height="660" rx="54"/><path d="M 495 76 H 585"/>`, 8)}
    <g stroke-dasharray="16 12">${neon(`<rect x="415" y="130" width="250" height="160" rx="18"/><rect x="415" y="320" width="250" height="60" rx="14"/><rect x="415" y="410" width="250" height="60" rx="14"/><rect x="415" y="500" width="250" height="110" rx="18"/>`, 5)}</g>
    ${cheio(`<rect x="440" y="335" width="7" height="30" rx="3"/>`)}
    ${neon(`<path d="M 800 140 V 220 M 760 180 H 840"/>`, 9)}`),
  // calendário com o check (o Hospeda, ícone FAZLO)
  hospeda: () => svg(720, `
    ${neon(`<rect x="300" y="130" width="480" height="440" rx="54"/><path d="M 300 250 H 780 M 420 70 V 180 M 660 70 V 180"/>`, 9)}
    <g opacity="0.5">${neon(`<path d="M 360 320 H 400 M 460 320 H 500 M 560 320 H 600 M 660 320 H 700 M 360 400 H 400 M 460 400 H 500 M 360 480 H 400"/>`, 9)}</g>
    ${neon(`<path d="M 545 430 L 600 485 L 715 370"/>`, 14)}`),
  // painel genérico: reservas (calendário) + caixa (barras e R$), nada de tela real
  painel: () => svg(700, `
    ${neon(`<rect x="90" y="60" width="900" height="600" rx="44"/><path d="M 90 150 H 990"/>`, 8)}
    ${cheio(`<circle cx="140" cy="105" r="10"/><circle cx="175" cy="105" r="10"/><circle cx="210" cy="105" r="10"/>`)}
    ${neon(`<rect x="140" y="200" width="380" height="410" rx="26"/><path d="M 140 270 H 520"/>`, 6)}
    <g opacity="0.45">${neon(`<path d="M 180 330 H 210 M 255 330 H 285 M 330 330 H 360 M 405 330 H 435 M 180 400 H 210 M 255 400 H 285 M 405 400 H 435 M 180 470 H 210 M 330 470 H 360 M 405 470 H 435 M 180 540 H 210 M 255 540 H 285"/>`, 8)}</g>
    ${cheio(`<rect x="317" y="380" width="56" height="40" rx="10"/><rect x="242" y="520" width="56" height="40" rx="10"/>`)}
    ${neon(`<rect x="570" y="200" width="370" height="410" rx="26"/>`, 6)}
    <text x="610" y="285" font-family="FZD Display" font-weight="800" font-size="54" fill="${LIMA}" filter="url(#brilho)">R$</text>
    ${cheio(`<rect x="620" y="440" width="44" height="120" rx="10"/><rect x="690" y="390" width="44" height="170" rx="10"/><rect x="760" y="470" width="44" height="90" rx="10"/><rect x="830" y="350" width="44" height="210" rx="10"/>`)}
    <g opacity="0.5">${neon(`<path d="M 610 330 H 900"/>`, 6)}</g>`),
  // um perfil genérico com o @ e o toque (sem logo do app)
  perfil: () => svg(640, `
    ${neon(`<rect x="200" y="80" width="680" height="440" rx="48"/>`, 8)}
    ${neon(`<circle cx="340" cy="230" r="86"/>`, 8)}${icone('navegador', 340, 230, 0.9, 6)}
    ${neon(`<path d="M 470 190 H 790 M 470 250 H 700"/>`, 9)}
    ${cheio(`<rect x="250" y="370" width="580" height="90" rx="45"/>`)}
    ${neon(`<circle cx="760" cy="430" r="52"/><circle cx="760" cy="430" r="34"/>`, 5)}`),
  // o balão de mensagem com os três pontinhos e pinos espalhados (todo o Brasil)
  mensagem: () => svg(680, `
    <g transform="translate(540 330) scale(4.4)">${neon(IC.mensagem, 8 / 4.4)}</g>${pontos(540, 330, 4.4)}
    <g opacity="0.75">${icone('chegar', 175, 170, 0.9, 6)}${icone('chegar', 905, 230, 0.8, 6)}${icone('chegar', 150, 520, 0.7, 6)}${icone('chegar', 930, 560, 0.95, 6)}</g>`),
  contato: () => svg(300, `<g transform="translate(540 150) scale(2.6)">${neon(IC.mensagem, 8 / 2.6)}</g>${pontos(540, 150, 2.6)}`),
};

// ---------------------------------------------------------------- celular genérico com uma tela real
const celular = (src, top = 380, h = 980) => {
  const w = Math.round(h * 0.49), x = (W - w) / 2, pad = 16;
  return `<div class="cel" style="left:${x}px;top:${top}px;width:${w}px;height:${h}px">
    <div class="tela" style="inset:${pad + 52}px ${pad}px ${pad}px"><img src="${src}"></div><div class="falante"></div></div>`;
};
const lista = (itens, top, passo = 150) => `<div class="lista" style="top:${top}px">${itens.map(([ic, t], i) =>
  `<div class="item" style="top:${i * passo}px"><div class="ic">${svg(120, icone(ic, 60, 60, 0.82, 7)).replace('class="ilu"', 'class="mini"').replace(`width="${W}"`, 'width="120"').replace(`viewBox="0 0 ${W} 120"`, 'viewBox="0 0 120 120"')}</div><div class="rot">${t}</div></div>`).join('')}</div>`;

// ---------------------------------------------------------------- os stories
const STORIES = {
  'raio-x': [
    { ilu: ILU.raioX(), titulo: ['Todo site começa', 'pelo *raio-x*'], apoio: ['Antes de desenhar qualquer tela.'] },
    { topo: true, titulo: ['O que a gente pede'], extra: lista([['logo', 'Logo'], ['fotos', 'Fotos de cada quarto'], ['incluso', 'O que está incluso'], ['regras', 'Regras'], ['chegar', 'Como chegar'], ['mensagem', 'WhatsApp']], 610, 160) },
    { topo: true, titulo: ['Duas perguntas'], extra: `<div class="ilu-wrap" style="top:560px">${ILU.perguntas()}</div>
        <div class="perg" style="top:930px">O que só a sua pousada tem?</div>
        <div class="perg" style="top:1190px">O que o hóspede precisa saber antes de consultar?</div>` },
    { ilu: ILU.nasce(), titulo: ['Daí nasce o *site*'], apoio: ['Feito para o hóspede reservar.'] },
  ],
  cases: [
    { cel: 'telas/vale-topo.jpg', titulo: ['Pousada Vale', 'dos Canteiros'], apoio: ['Serra da Canastra', 'pousadavaledoscanteiros.com.br'] },
    { cel: 'telas/guardiao-topo.png', titulo: ['Pousada Guardião', 'da Serra'], apoio: ['Serra da Canastra', 'pousadaguardiaodaserra.com.br'] },
    { ilu: ILU.proximo(), titulo: ['Seu site pode', 'ser o *próximo*'], apoio: ['Fale com a gente por mensagem.'] },
  ],
  hospeda: [
    { ilu: ILU.hospeda(), titulo: ['O *FAZLO Hospeda*'], apoio: ['O sistema de reservas da FAZLO', 'para pousadas.'] },
    { ilu: ILU.painel(), titulo: ['Reservas on-line e', '*controle de caixa*'], apoio: ['Num só lugar.'] },
    { ilu: ILU.perfil(), titulo: ['Conheça no', '*@fazlohospeda*'] },
  ],
  contato: [
    { ilu: ILU.mensagem(), titulo: ['Atendimento só', 'por *mensagem*'], apoio: ['Para pousadas de todo o Brasil.'] },
    { topo: true, titulo: ['Como funciona'], extra: lista([['mensagem', '1. Você manda mensagem'], ['scan', '2. A gente faz o raio-x'], ['navegador', '3. Seu site sai do papel']], 680, 250) },
    { contato: true },
  ],
};

const rico = (s) => s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
function pagina(st) {
  const titulo = (st.titulo || []).map((l) => `<div class="tl">${rico(l)}</div>`).join('');
  const apoio = (st.apoio || []).map((l) => `<div class="al">${l}</div>`).join('');
  let corpo;
  if (st.contato) {
    corpo = `<div class="bloco topo" style="top:400px"><div class="titulo">${'<div class="tl">Fale com a <em>gente</em></div>'}</div></div>
      <div class="ilu-wrap" style="top:560px">${ILU.contato()}</div>
      <div class="livre" data-livre="sticker de link"></div>
      <div class="info" style="top:1330px"><div class="i1">WhatsApp (11) 92586-8870</div><div class="i2">fazlodigital.com.br</div></div>`;
  } else if (st.topo) {
    corpo = `<div class="bloco topo" style="top:400px"><div class="titulo">${titulo}</div></div>${st.extra}`;
  } else if (st.cel) {
    corpo = `${celular(st.cel, 410, 830)}<div class="bloco" style="top:1282px"><div class="titulo">${titulo}</div><div class="apoio">${apoio}</div></div>`;
  } else {
    corpo = `<div class="ilu-wrap" style="top:380px">${st.ilu}</div><div class="bloco" style="top:1170px"><div class="titulo">${titulo}</div><div class="apoio">${apoio}</div></div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../../../brand/fonts/fonts.css"><style>
    html, body { margin: 0; width: ${W}px; height: ${H}px; background: #050606; overflow: hidden; }
    body { position: relative; font-family: 'FZD Text'; color: #fff; }
    .fundo { position: absolute; inset: 0; background: radial-gradient(900px 700px at 50% 46%, rgba(198,250,65,0.07), rgba(198,250,65,0) 70%); }
    .logo { position: absolute; left: 50%; top: 286px; width: 300px; transform: translateX(-50%); }
    .ilu-wrap { position: absolute; left: 0; width: ${W}px; } .ilu { position: relative; display: block; }
    .bloco { position: absolute; left: 80px; right: 80px; text-align: center; }
    .titulo { font-family: 'FZD Display'; font-weight: 800; font-size: 80px; line-height: 1.12; letter-spacing: -1px; }
    .tl { white-space: nowrap; } em { font-style: normal; color: ${LIMA}; }
    .apoio { margin-top: 30px; font-size: 40px; line-height: 1.35; color: #B4BABE; font-weight: 400; } .al { white-space: nowrap; }
    .cel { position: absolute; border-radius: 64px; background: #0B0D0E; border: 4px solid rgba(255,255,255,0.32); box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(198,250,65,0.10); }
    .tela { position: absolute; border-radius: 10px 10px 50px 50px; overflow: hidden; background: #EEE8DC; } .tela img { width: 100%; display: block; }
    .falante { position: absolute; left: 50%; top: 30px; width: 110px; height: 30px; margin-left: -55px; border-radius: 15px; background: #000; }
    .lista { position: absolute; left: 130px; right: 130px; } .item { position: absolute; left: 0; right: 0; height: 120px; display: flex; align-items: center; gap: 34px; }
    .ic { width: 120px; height: 120px; flex: none; border-radius: 30px; background: rgba(198,250,65,0.07); border: 2px solid rgba(198,250,65,0.25); }
    .rot { font-size: 46px; font-weight: 600; white-space: nowrap; }
    .perg { position: absolute; left: 80px; right: 80px; padding: 44px 40px; border-radius: 40px; background: #12161A; border: 2px solid rgba(255,255,255,0.10);
            font-family: 'FZD Display'; font-weight: 600; font-size: 44px; line-height: 1.25; text-align: center; }
    .livre { position: absolute; left: 140px; right: 140px; top: 900px; height: 360px; }
    .info { position: absolute; left: 80px; right: 80px; text-align: center; } .i1 { font-family: 'FZD Display'; font-weight: 800; font-size: 56px; color: ${LIMA}; white-space: nowrap; }
    .i2 { margin-top: 26px; font-size: 46px; font-weight: 600; color: #fff; }
  </style></head><body><div class="fundo"></div><img class="logo" src="../../../brand/logo/kit/FAZLO-DIGITAL-branca-transparente.svg">${corpo}</body></html>`;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const tmp = path.join(SRC, '.render.html');
  const falhas = [];
  try {
    for (const [dest, lista_] of Object.entries(STORIES)) {
      fs.mkdirSync(path.join(OUT, dest), { recursive: true });
      for (let i = 0; i < lista_.length; i++) {
        fs.writeFileSync(tmp, pagina(lista_[i]));
        await page.goto('file://' + tmp);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        // o título e o apoio cabem na largura (diminui a fonte até caber; nunca quebra em mais linhas)
        const conf = await page.evaluate(({ TOPO, BASE }) => {
          const encolhe = (sel, max) => document.querySelectorAll(sel).forEach((el) => {
            let s = parseFloat(getComputedStyle(el).fontSize);
            while (s > 24 && [...el.children].concat(el.children.length ? [] : [el]).some((c) => c.scrollWidth > max)) { s -= 1; el.style.fontSize = s + 'px'; }
          });
          document.querySelectorAll('.titulo, .apoio, .info .i1').forEach((el) => {
            let s = parseFloat(getComputedStyle(el).fontSize);
            const linhas = el.classList.contains('i1') ? [el] : [...el.children];
            while (s > 24 && linhas.some((c) => c.getBoundingClientRect().width > 920 || c.scrollWidth > 920)) { s -= 1; el.style.fontSize = s + 'px'; }
          });
          encolhe('.rot', 700);
          const caixas = [...document.querySelectorAll('.logo, .ilu, .bloco, .cel, .item, .perg, .info, .titulo, .apoio')].map((e) => { const r = e.getBoundingClientRect(); return { c: e.className.baseVal ?? e.className, y0: r.top, y1: r.bottom, x0: r.left, x1: r.right }; });
          const fora = caixas.filter((b) => b.y0 < TOPO - 0.5 || b.y1 > BASE + 0.5 || b.x0 < 0 || b.x1 > 1080);
          const livre = document.querySelector('.livre');
          let ocupado = [];
          if (livre) { const L = livre.getBoundingClientRect(); ocupado = caixas.filter((b) => b.y1 > L.top && b.y0 < L.bottom && b.c !== 'ilu' || false).filter((b) => !(b.y1 <= L.top || b.y0 >= L.bottom)); }
          return { fora, livre: livre ? livre.getBoundingClientRect().toJSON() : null, ocupado, y: [Math.min(...caixas.map((b) => b.y0)), Math.max(...caixas.map((b) => b.y1))] };
        }, { TOPO, BASE });
        const nome = `${String(i + 1).padStart(2, '0')}.png`;
        await page.screenshot({ path: path.join(OUT, dest, nome), clip: { x: 0, y: 0, width: W, height: H } });
        const msg = `stories/destaques/${dest}/${nome}  conteúdo em y ${conf.y[0].toFixed(0)}–${conf.y[1].toFixed(0)}` + (conf.livre ? ` · área livre para o sticker: y ${conf.livre.y.toFixed(0)}–${(conf.livre.y + conf.livre.height).toFixed(0)}` : '');
        if (conf.fora.length) falhas.push(`${dest}/${nome}: fora das faixas livres: ${JSON.stringify(conf.fora)}`);
        if (conf.ocupado.length) falhas.push(`${dest}/${nome}: área do sticker ocupada: ${JSON.stringify(conf.ocupado)}`);
        console.log(msg);
      }
    }
  } finally {
    fs.rmSync(tmp, { force: true });
    await browser.close();
  }
  if (falhas.length) { console.error('FALHA\n' + falhas.join('\n')); process.exit(1); }
  console.log(`ok: nada em y < ${TOPO} nem em y > ${BASE}`);
})();
