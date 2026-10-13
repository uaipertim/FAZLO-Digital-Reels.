#!/usr/bin/env node
/*
 * Capas de destaques do perfil (Chromium headless -> PNG).
 *
 *   node tools/destaques.cjs        (ou: npm run destaques)
 *     -> destaques/svg/<id>.svg        fonte vetorial de cada capa (1080x1920)
 *     -> destaques/<id>.png            capa final
 *     -> destaques/previa-perfil.png   os 4 círculos como aparecem no perfil (~64 px), tema escuro e claro
 *     -> destaques/revisao/            capas com o círculo seguro + relatório (tools/destaques_qa.py)
 *
 * Lê destaques/destaques.json (cores, círculo seguro, escala e traço) e os ícones de
 * destaques/src/icones.cjs. Cada ícone é centrado pelo seu contorno no centro do círculo seguro.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, parseArgs, loadPlaywright, chromiumPath } = require('./lib.cjs');

const DIR = path.join(ROOT, 'destaques');
const CFG = JSON.parse(fs.readFileSync(path.join(DIR, 'destaques.json'), 'utf8'));
const { ICONES } = require(path.join(DIR, 'src', 'icones.cjs'));
const { width: W, height: H } = CFG.format;
const { fundo, icone: lima } = CFG.cores;
const { cx, cy, d: D } = CFG.circuloSeguro;
const { escala: S, traco } = CFG.icone;
const { opt } = parseArgs(process.argv.slice(2));

const corpo = (kind) => {
  if (!ICONES[kind]) throw new Error(`ícone desconhecido: ${kind}`);
  return ICONES[kind].replace(/<g class="cheio">/g, `<g fill="${lima}" stroke="none">`);
};
const svgCapa = (kind, tx, ty) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${fundo}"/>
  <g id="icone" transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${S})" fill="none" stroke="${lima}" stroke-width="${traco}" stroke-linecap="round" stroke-linejoin="round">${corpo(kind)}
  </g>
</svg>
`;

function previaPerfil(capas) {
  // como no app: anel cinza fino, respiro e a capa recortada no círculo (o círculo seguro de 720 px vira 56 px)
  const IMG = 56, k = IMG / D, bw = W * k, bh = H * k;
  const item = (c) => `
    <div class="item">
      <div class="anel"><div class="foto"><img src="data:image/png;base64,${c.png}" style="width:${bw}px;height:${bh}px;left:${(IMG / 2 - cx * k).toFixed(2)}px;top:${(IMG / 2 - cy * k).toFixed(2)}px"></div></div>
      <div class="nome">${c.nome}</div>
    </div>`;
  const painel = (tema, rotulo) => `
    <div class="bloco"><div class="rotulo">${rotulo}</div>
      <div class="perfil ${tema}"><div class="linha">${capas.map(item).join('')}</div></div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #1A1B1D; font-family: Inter, 'Liberation Sans', sans-serif; }
    .folha { display: flex; gap: 24px; padding: 24px; width: max-content; }
    .rotulo { color: #9AA0A6; font-size: 11px; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 8px 2px; }
    .perfil { width: 390px; padding: 18px 0 16px; border-radius: 14px; }
    .escuro { background: #000000; --anel: #3A3A3C; --texto: #F5F5F5; }
    .claro { background: #FFFFFF; --anel: #DBDBDB; --texto: #000000; }
    .linha { display: flex; gap: 14px; padding: 0 16px; }
    .item { width: 72px; display: flex; flex-direction: column; align-items: center; }
    .anel { width: 64px; height: 64px; border-radius: 50%; box-sizing: border-box; border: 1px solid var(--anel);
            display: flex; align-items: center; justify-content: center; }
    .foto { position: relative; width: ${IMG}px; height: ${IMG}px; border-radius: 50%; overflow: hidden; }
    .foto img { position: absolute; }
    .nome { margin-top: 6px; max-width: 72px; font-size: 12px; line-height: 15px; color: var(--texto);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  </style></head><body><div class="folha">${painel('escuro', 'Tema escuro')}${painel('claro', 'Tema claro')}</div></body></html>`;
}

function revisao(capas) {
  // as 4 capas inteiras, com o círculo seguro (720 px) tracejado e o diâmetro-alvo do ícone (45%)
  const k = 0.25, w = W * k, h = H * k;
  const cartao = (c) => `
    <figure><div class="capa" style="width:${w}px;height:${h}px">
      <img src="data:image/png;base64,${c.png}" width="${w}" height="${h}">
      <svg width="${w}" height="${h}"><circle cx="${cx * k}" cy="${cy * k}" r="${(D / 2) * k}" fill="none" stroke="#FF2850" stroke-width="1.5" stroke-dasharray="6 5"/>
      <circle cx="${cx * k}" cy="${cy * k}" r="${(D * CFG.icone.fracao / 2) * k}" fill="none" stroke="#3AA0FF" stroke-width="1" stroke-dasharray="3 4"/></svg>
    </div><figcaption>${c.id}.png</figcaption></figure>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #1A1B1D; font: 12px Inter, sans-serif; color: #C9CFCF; }
    .folha { display: flex; gap: 16px; padding: 20px; width: max-content; }
    figure { margin: 0; } .capa { position: relative; } .capa > * { position: absolute; left: 0; top: 0; }
    figcaption { margin-top: 6px; }
  </style></head><body><div class="folha">${capas.map(cartao).join('')}</div></body></html>`;
}

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  const capas = [];
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    fs.mkdirSync(path.join(DIR, 'svg'), { recursive: true });
    for (const c of CFG.capas) {
      // 1ª passada: contorno do ícone (na grade dele) para centrar no círculo seguro
      await page.setContent(`<body style="margin:0">${svgCapa(c.icone, 0, 0)}</body>`);
      const bb = await page.evaluate(() => { const b = document.getElementById('icone').getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
      const tx = cx - (bb.x + bb.w / 2) * S, ty = cy - (bb.y + bb.h / 2) * S;
      const svg = svgCapa(c.icone, tx, ty);
      fs.writeFileSync(path.join(DIR, 'svg', `${c.id}.svg`), svg);
      await page.setContent(`<body style="margin:0">${svg}</body>`);
      const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
      fs.writeFileSync(path.join(DIR, `${c.id}.png`), png);
      const ext = Math.max(bb.w, bb.h) * S + traco * S;
      console.log(`capa: destaques/${c.id}.png  ícone ${(bb.w * S + traco * S).toFixed(0)}x${(bb.h * S + traco * S).toFixed(0)} px (${(ext / D * 100).toFixed(1)}% do círculo)`);
      capas.push({ ...c, png: png.toString('base64') });
    }
    // prévia do perfil, na densidade de um celular (3x)
    const p2 = await browser.newPage({ viewport: { width: 900, height: 300 }, deviceScaleFactor: 3 });
    await p2.setContent(previaPerfil(capas));
    await p2.evaluate(() => document.fonts.ready);
    const f = await p2.$('.folha');
    await f.screenshot({ path: path.join(DIR, 'previa-perfil.png') });
    console.log('prévia: destaques/previa-perfil.png');
    const p3 = await browser.newPage({ viewport: { width: 1200, height: 600 }, deviceScaleFactor: 2 });
    await p3.setContent(revisao(capas));
    fs.mkdirSync(path.join(DIR, 'revisao'), { recursive: true });
    await (await p3.$('.folha')).screenshot({ path: path.join(DIR, 'revisao', 'capas-com-guias.png') });
    console.log('revisão: destaques/revisao/capas-com-guias.png');
  } finally {
    await browser.close();
  }
  if (!opt['skip-qa']) execFileSync('python3', [path.join(ROOT, 'tools', 'destaques_qa.py')], { stdio: 'inherit' });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
