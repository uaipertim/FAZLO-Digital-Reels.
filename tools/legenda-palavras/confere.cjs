#!/usr/bin/env node
/*
 * Legenda palavra por palavra — as páginas de um legenda.json, montadas pelo legenda.js no Chromium headless, com a
 * Unbounded da marca (as mesmas larguras do vídeo). Chamado pelo legenda.py; imprime JSON no stdout.
 *
 *   node tools/legenda-palavras/confere.cjs <legenda.json com "tempo": "video"> --fim <s>
 */
const fs = require('fs');
const path = require('path');
const { ROOT, loadPlaywright, chromiumPath } = require('../lib.cjs');

const args = process.argv.slice(2);
const arq = args[0];
const fim = Number(args[args.indexOf('--fim') + 1]);
if (!arq || !Number.isFinite(fim)) { console.error('uso: confere.cjs <legenda.json> --fim <s>'); process.exit(2); }

(async () => {
  const dados = JSON.parse(fs.readFileSync(arq, 'utf8'));
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--font-render-hinting=none'] });
  try {
    const page = await browser.newPage();
    const fonte = fs.readFileSync(path.join(ROOT, 'brand', 'fonts', 'unbounded-latin-800-normal.woff2')).toString('base64');
    await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'legenda.js'), 'utf8') });
    const out = await page.evaluate(async ([fonte, dados, fim]) => {
      const f = new FontFace('FZD Display', `url(data:font/woff2;base64,${fonte})`, { weight: '800' });
      document.fonts.add(await f.load());
      const leg = LEGENDA.cria(dados, { fim });
      return { paginas: leg.paginas, juntadas: leg.juntadas, ultimas: leg.ultimas, faixa: leg.estilo.faixa };
    }, [fonte, dados, fim]);
    process.stdout.write(JSON.stringify(out));
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
