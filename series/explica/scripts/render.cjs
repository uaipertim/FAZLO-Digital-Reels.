#!/usr/bin/env node
/*
 * Série Explica (FAZLO Digital) — render quadro a quadro no Chromium headless (Playwright) -> ffmpeg.
 *
 *   node series/explica/scripts/render.cjs cues   --ep explica-01   -> audio/explica-01/cues.json (os sons tirados da animação)
 *   node series/explica/scripts/render.cjs info   --ep explica-01   -> output/explica-01/revisao/motor.json + caixas.json
 *   node series/explica/scripts/render.cjs capa   --ep explica-01   -> output/explica-01/capa.png (o quadro 0)
 *   node series/explica/scripts/render.cjs video  --ep explica-01 [--workers 4] [--previa]
 *                                                                   -> output/explica-01/fazlo-digital-explica-01.mp4
 *   node series/explica/scripts/render.cjs stills 0.5,2,5.2 --ep explica-01 [--dir output/explica-01/stills] [--noblur]
 *
 * Sobe um servidor local na raiz do repositório (para /brand/fonts e /brand/logo/kit), abre
 * series/explica/src/index.html?render, captura cada quadro do canvas e envia em ordem ao ffmpeg
 * (x264 CRF 15, preset slow, yuv420p, bt709, +faststart); depois junta a mixagem em AAC 256 kb/s, 48 kHz.
 * Com a linha do tempo provisória (linha.py --estimativa, sem voz) o vídeo final não é feito: só --previa.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { chromium } = require('playwright');

const SERIE = path.resolve(__dirname, '..');
const REPO = path.resolve(SERIE, '..', '..');
const args = process.argv.slice(2);
const mode = args[0] || 'video';
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes('--' + name);
const EP = opt('ep', 'explica-01');
const LINHA = path.join(SERIE, 'audio', EP, 'linha.json');
if (!fs.existsSync(LINHA)) { console.error(`${path.relative(REPO, LINHA)} não existe: rode antes scripts/linha.py ${EP}`); process.exit(1); }
const OUT = path.join(SERIE, 'output', EP);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.png': 'image/png' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const file = path.join(REPO, decodeURIComponent(req.url.split('?')[0]));
      if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[erro na página]', e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/series/explica/src/index.html?render&ep=${EP}`);
  await page.evaluate(() => window.ready);
  return page;
}
const decode = (url) => Buffer.from(url.split(',')[1], 'base64');
const grab = async (page, t, o) => decode(await page.evaluate(([t, o]) => window.frameAt(t, o), [t, o || {}]));

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    if (mode === 'cues') {
      const page = await openPage(browser, port);
      const data = await page.evaluate(() => window.cues());
      fs.writeFileSync(path.join(SERIE, 'audio', EP, 'cues.json'), JSON.stringify(data, null, 1));
      console.log(`cues: ${data.cues.length} eventos` + (data.avisos.length ? ` · avisos: ${data.avisos.join(' | ')}` : ''));
    } else if (mode === 'info') {
      const page = await openPage(browser, port);
      const dir = path.join(OUT, 'revisao');
      fs.mkdirSync(dir, { recursive: true });
      const info = await page.evaluate(() => ({ duracao: EXPLICA.DURATION, apoios: EXPLICA.apoios(), trocas: EXPLICA.trocas(), montagens: EXPLICA.montagens(), fecho: EXPLICA.fecho() }));
      fs.writeFileSync(path.join(dir, 'motor.json'), JSON.stringify(info, null, 1));
      const caixas = [];
      for (let t = 0; t < info.duracao; t += 0.25) caixas.push({ t: Math.round(t * 100) / 100, caixas: await page.evaluate((t) => window.caixas(t), t) });
      fs.writeFileSync(path.join(dir, 'caixas.json'), JSON.stringify(caixas));
      console.log('motor.json + caixas.json ->', path.relative(REPO, dir));
    } else if (mode === 'capa') {
      const page = await openPage(browser, port);
      fs.mkdirSync(path.join(OUT, 'revisao'), { recursive: true });
      fs.writeFileSync(path.join(OUT, 'capa.png'), await grab(page, 0, { noBlur: true }));
      const bx = (await page.evaluate(() => window.caixas(0)));
      fs.writeFileSync(path.join(OUT, 'revisao', 'capa-caixas.json'), JSON.stringify(bx, null, 1));
      console.log('capa ->', path.relative(REPO, path.join(OUT, 'capa.png')));
    } else if (mode === 'stills') {
      const times = (args[1] || '0').split(',').map(Number);
      const dir = path.resolve(REPO, opt('dir', path.relative(REPO, path.join(OUT, 'stills'))));
      fs.mkdirSync(dir, { recursive: true });
      const page = await openPage(browser, port);
      for (const t of times) {
        const f = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
        fs.writeFileSync(f, await grab(page, t, flag('noblur') ? { noBlur: true } : {}));
        console.log('still', path.relative(REPO, f));
      }
    } else {
      const linha = JSON.parse(fs.readFileSync(LINHA));
      if (linha.provisorio && !flag('previa')) throw new Error('a linha do tempo é provisória (sem voz): o vídeo final só sai com a narração. Use --previa para um teste.');
      const fps = Number(opt('fps', 60));
      const out = path.resolve(REPO, opt('out', path.relative(REPO, path.join(OUT, flag('previa') ? 'previa.mp4' : `fazlo-digital-${EP}.mp4`))));
      const silent = path.join(OUT, '.video-only.mp4');
      const dur = Number(opt('duration', linha.duracao));
      const total = Math.round(dur * fps);
      const workers = Number(opt('workers', 4));
      fs.mkdirSync(path.dirname(out), { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
        '-c:v', 'libx264', '-preset', flag('previa') ? 'veryfast' : 'slow', '-crf', flag('previa') ? '22' : '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
      const ffDone = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
      const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, port)));
      const pending = new Map();
      let next = 0, written = 0;
      const t0 = Date.now();
      const flush = async () => {
        while (pending.has(written)) {
          const buf = pending.get(written); pending.delete(written);
          if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
          written++;
          if (written % fps === 0) process.stdout.write(`\r  ${written}/${total} quadros  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
        }
      };
      let flushing = Promise.resolve();
      await Promise.all(pages.map(async (page) => {
        while (true) {
          const i = next++;
          if (i >= total) break;
          while (i - written > 120) await new Promise((r) => setTimeout(r, 5));
          pending.set(i, await grab(page, i / fps));
          flushing = flushing.then(flush);
        }
      }));
      await flushing; await flush();
      ff.stdin.end();
      await ffDone;
      const audio = path.join(SERIE, 'audio', EP, 'mix.wav');
      if (fs.existsSync(audio) && !linha.provisorio) {
        execSync(`ffmpeg -y -loglevel error -i "${silent}" -i "${audio}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -ac 2 -shortest -movflags +faststart "${out}"`);
        fs.unlinkSync(silent);
      } else fs.renameSync(silent, out);
      console.log(`\n  vídeo: ${path.relative(REPO, out)}`);
    }
  } finally {
    await browser.close();
    srv.close();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
