#!/usr/bin/env node
/*
 * Série "Pelos olhos do hóspede": capas v2 (só PNG; os vídeos e a capa do quadro 0 não mudam).
 *
 *   node tools/capas-v2.cjs cafe-incluso aceita-pet ...   -> reels/<id>/output/capa-v2.png (+ caixas no console)
 *
 * O desenho é o do motor da série (motor.js, capaV2): logo do kit no topo, ilustração grande do tema em traço lima,
 * selo "PELOS OLHOS DO HÓSPEDE · EP. 0X" e o título da capa de hoje 15% menor, com o fundo no tom do episódio.
 * Configuração no roteiro: "capa_v2": {"ep": 5, "ilustracao": "cafe", "tom": "#1A1208"}.
 */
const fs = require('fs');
const path = require('path');
const { serve, loadPlaywright, chromiumPath, ROOT } = require('./lib.cjs');

(async () => {
  const ids = process.argv.slice(2);
  const srv = await serve();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  try {
    for (const id of ids) {
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
      page.on('pageerror', (e) => console.error('[page error]', e.message));
      await page.goto(`http://127.0.0.1:${srv.address().port}/core/player.html?reel=${id}&render`);
      await page.evaluate(() => window.ready);
      const r = await page.evaluate(() => { const cv = document.querySelector('canvas'); const c = cv.getContext('2d'); const b = window.FZS_EP.capaV2(c); return { url: cv.toDataURL('image/png'), b }; });
      const out = path.join(ROOT, 'reels', id, 'output', 'capa-v2.png');
      fs.writeFileSync(out, Buffer.from(r.url.split(',')[1], 'base64'));
      console.log(`${id}: ${path.relative(ROOT, out)}  ilustração y ${r.b.ilustracao.map(Math.round).join('–')} · selo y ${r.b.selo.map(Math.round).join('–')} · título y ${r.b.titulo.map(Math.round).join('–')} (${r.b.size.toFixed(0)} px)`);
      await page.close();
    }
  } finally { await browser.close(); srv.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
