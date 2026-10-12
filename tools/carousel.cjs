#!/usr/bin/env node
/*
 * Render dos carrosséis FAZLO Digital (Chromium headless -> PNG).
 *
 *   node tools/carousel.cjs <carrossel> [--slides 1,3] [--skip-qa]
 *     -> carrosseis/<pasta>/output/01.png ... NN.png
 *     -> prévia e revisão (tools/carousel_qa.py): output/previa.jpg, output/revisao/
 *
 * <carrossel> é o nome da pasta em carrosseis/ (ex.: o-que-o-hospede-procura).
 * Sobe um servidor estático local, abre core/carousel.html?c=<id>&render e
 * grava cada slide do canvas em PNG.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, parseArgs, serve, loadPlaywright, chromiumPath } = require('./lib.cjs');

function resolveCarousel(arg) {
  if (!arg) throw new Error('informe o carrossel: ex. o-que-o-hospede-procura');
  const id = path.basename(String(arg).replace(/\/+$/, ''));
  const dir = path.join(ROOT, 'carrosseis', id);
  const cfgPath = path.join(dir, 'carrossel.json');
  if (!fs.existsSync(cfgPath)) throw new Error(`carrossel não encontrado: ${path.relative(ROOT, cfgPath)}`);
  return { id, dir, cfg: JSON.parse(fs.readFileSync(cfgPath, 'utf8')) };
}

const { pos, opt } = parseArgs(process.argv.slice(2));
const car = resolveCarousel(pos[0]);

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  try {
    const { width = 1080, height = 1350 } = car.cfg.format || {};
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error('[page error]', e.message));
    page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
    await page.goto(`http://127.0.0.1:${port}/core/carousel.html?c=${car.id}&render`);
    await page.evaluate(() => window.ready);
    const count = await page.evaluate(() => window.count());
    const want = opt.slides ? String(opt.slides).split(',').map(Number) : Array.from({ length: count }, (_, i) => i + 1);
    const outDir = path.join(car.dir, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    for (const n of want) {
      const url = await page.evaluate((i) => window.slide(i), n - 1);
      const f = path.join(outDir, `${String(n).padStart(2, '0')}.png`);
      fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
      console.log('slide:', path.relative(process.cwd(), f));
    }
  } finally {
    await browser.close();
    srv.close();
  }
  if (!opt['skip-qa']) execFileSync('python3', [path.join(ROOT, 'tools', 'carousel_qa.py'), car.id], { stdio: 'inherit' });
})().catch((e) => { console.error(e.message || e); process.exit(1); });
