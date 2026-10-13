#!/usr/bin/env node
/*
 * Peças estáticas de Stories (Chromium headless -> PNG).
 *
 *   node tools/stories.cjs fundos        (ou: npm run stories -- fundos)
 *     -> stories/<pasta>/svg/<id>.svg      fonte vetorial (1080x1920)
 *     -> stories/<pasta>/<id>.png          peça final
 *     -> stories/<pasta>/revisao/          zonas do app e simulação com uma figurinha + relatório (tools/stories_qa.py)
 *
 * Lê stories/<pasta>/<pasta>.json: cores, zonas que ficam livres, logo oficial do kit (SVG, embutida
 * como vetor) e as barras lima, desenhadas com a geometria da barra do Z (inclinação e proporção).
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, parseArgs, loadPlaywright, chromiumPath } = require('./lib.cjs');

const { pos, opt } = parseArgs(process.argv.slice(2));
const ID = pos[0];
if (!ID) { console.error('informe a pasta: ex. node tools/stories.cjs fundos'); process.exit(2); }
const DIR = path.join(ROOT, 'stories', ID);
const CFG = JSON.parse(fs.readFileSync(path.join(DIR, `${ID}.json`), 'utf8'));
const { width: W, height: H } = CFG.format;

// logo do kit: o SVG oficial vai inteiro, como <svg> aninhado (sem redesenhar)
function logo() {
  const src = fs.readFileSync(path.join(ROOT, CFG.logo.arquivo), 'utf8');
  const vb = src.match(/viewBox="([^"]+)"/)[1];
  const [, , vw, vh] = vb.split(/\s+/).map(Number);
  const inner = src.slice(src.indexOf('>', src.indexOf('<svg')) + 1, src.lastIndexOf('</svg>'));
  const w = CFG.logo.largura, h = (w * vh) / vw, x = (W - w) / 2, y = CFG.logo.topo;
  return { svg: `<svg x="${x}" y="${y}" width="${w}" height="${h.toFixed(2)}" viewBox="${vb}">${inner}</svg>`, box: [x, y, x + w, y + h] };
}

// barra do Z: topo e base horizontais, laterais com a inclinação da marca, largura = proporção × altura
function barra({ x, topo, altura }) {
  const k = CFG.barra.inclinacao, w = CFG.barra.proporcao * altura, b = topo + altura, dx = k * altura;
  const p = [[x, topo], [x + w, topo], [x + w + dx, b], [x + dx, b]];
  return `<polygon points="${p.map(([a, c]) => `${a.toFixed(1)},${c.toFixed(1)}`).join(' ')}" fill="${CFG.cores.detalhe}"/>`;
}

const peca = (p, L) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CFG.cores.fundo}"/>
  ${p.barras.map(barra).join('\n  ')}
  ${L.svg}
</svg>
`;

function revisao(pecas) {
  const k = 0.3, w = W * k, h = H * k, Z = CFG.zonas;
  const faixa = (y0, y1, cor, rot) => `<rect x="0" y="${y0 * k}" width="${w}" height="${(y1 - y0) * k}" fill="${cor}" fill-opacity=".16" stroke="${cor}" stroke-dasharray="5 4"/>
    <text x="8" y="${y0 * k + 16}" fill="${cor}" font-size="11">${rot}</text>`;
  const guias = `<svg width="${w}" height="${h}">${faixa(...Z.app, '#FF2850', `app ${Z.app[0]}–${Z.app[1]}`)}${faixa(...Z.centro, '#3AA0FF', `centro livre ${Z.centro[0]}–${Z.centro[1]}`)}${faixa(...Z.rodape, '#FFB020', `rodapé livre ${Z.rodape[0]}–${Z.rodape[1]}`)}</svg>`;
  // simulação: uma pergunta e uma figurinha genéricas no centro (só para ver o equilíbrio; não vai na peça)
  const fig = (uso) => `<div class="fig" style="top:${(Z.centro[0] + Z.centro[1]) / 2 * k}px">
      <div class="q">${uso === 'enquete' ? 'Seu site mostra o preço?' : 'Pergunte sobre o seu site'}</div>
      ${uso === 'enquete' ? '<div class="op"><span>SIM</span><span>NÃO</span></div>' : '<div class="cx">Escreva sua pergunta…</div>'}</div>`;
  const cartao = (p, conteudo, rot) => `<figure><div class="peca" style="width:${w}px;height:${h}px">
      <img src="data:image/png;base64,${p.png}" width="${w}" height="${h}">${conteudo}</div><figcaption>${rot}</figcaption></figure>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #1A1B1D; font: 12px Inter, sans-serif; color: #C9CFCF; }
    .folha { display: flex; gap: 16px; padding: 20px; width: max-content; }
    figure { margin: 0; } .peca { position: relative; overflow: hidden; } .peca > img, .peca > svg { position: absolute; left: 0; top: 0; }
    svg text { font-family: Inter, sans-serif; }
    figcaption { margin-top: 6px; }
    .fig { position: absolute; left: 50%; transform: translate(-50%, -50%); width: 230px; background: #FFFFFF; border-radius: 14px;
           padding: 14px 12px 12px; box-shadow: 0 6px 18px rgba(0,0,0,.35); color: #111; text-align: center; }
    .q { font-weight: 700; font-size: 13px; margin-bottom: 10px; }
    .op { display: flex; gap: 8px; } .op span { flex: 1; border: 1px solid #DDD; border-radius: 10px; padding: 8px 0; font-weight: 700; color: #3B82F6; }
    .cx { background: #F1F1F1; border-radius: 10px; padding: 10px; color: #8A8A8A; font-size: 11px; }
  </style></head><body><div class="folha">
    ${pecas.map((p) => cartao(p, guias, `${p.id}.png · zonas`)).join('')}
    ${pecas.map((p) => cartao(p, fig(p.uso), `${p.id}.png · simulação com figurinha`)).join('')}
  </div></body></html>`;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  const L = logo(), feitas = [];
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    fs.mkdirSync(path.join(DIR, 'svg'), { recursive: true });
    for (const p of CFG.pecas) {
      const svg = peca(p, L);
      fs.writeFileSync(path.join(DIR, 'svg', `${p.id}.svg`), svg);
      await page.setContent(`<body style="margin:0">${svg}</body>`);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
      fs.writeFileSync(path.join(DIR, `${p.id}.png`), png);
      console.log(`peça: stories/${ID}/${p.id}.png`);
      feitas.push({ ...p, png: png.toString('base64') });
    }
    const p2 = await browser.newPage({ viewport: { width: 1600, height: 700 }, deviceScaleFactor: 2 });
    await p2.setContent(revisao(feitas));
    fs.mkdirSync(path.join(DIR, 'revisao'), { recursive: true });
    await (await p2.$('.folha')).screenshot({ path: path.join(DIR, 'revisao', 'zonas-e-simulacao.png') });
    console.log(`revisão: stories/${ID}/revisao/zonas-e-simulacao.png`);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(DIR, 'revisao', 'logo.json'), JSON.stringify({ caixa: L.box.map((v) => +v.toFixed(1)) }) + '\n');
  if (!opt['skip-qa']) execFileSync('python3', [path.join(ROOT, 'tools', 'stories_qa.py'), ID], { stdio: 'inherit' });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
