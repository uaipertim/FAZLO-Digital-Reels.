#!/usr/bin/env node
/*
 * Render dos Reels FAZLO Digital (Chromium headless -> ffmpeg).
 *
 *   node tools/render.cjs cues    <reel>                     -> reels/<reel>/audio/cues.json
 *   node tools/render.cjs video   <reel> [--fps 60] [--workers 4] [--out arquivo.mp4] [--from 0 --to 5]
 *   node tools/render.cjs preview <reel>                     -> output/preview.mp4 (30 fps, rápido, para revisão)
 *   node tools/render.cjs stills  <reel> 0.5,2,5.2 [--noblur] [--dir output/stills]
 *   node tools/render.cjs cover   <reel>                     -> output/capa.png
 *
 * <reel> aceita 00, reel-00 ou _calibracao. Sobe um servidor estático local,
 * abre core/player.html?reel=<id>&render no Chromium, captura cada quadro do
 * canvas e envia direto ao ffmpeg. Se existir audio/trilha.wav, ela é
 * multiplexada em AAC 48 kHz.
 */
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { resolveReel, parseArgs, serve, loadPlaywright, chromiumPath } = require('./lib.cjs');

const { pos, opt } = parseArgs(process.argv.slice(2));
const mode = pos[0];
const MODES = ['cues', 'video', 'preview', 'stills', 'cover'];
if (!MODES.includes(mode)) { console.error(`uso: node tools/render.cjs <${MODES.join('|')}> <reel> [opções]`); process.exit(2); }
const reel = resolveReel(pos[1]);
const R = (p) => path.resolve(reel.dir, p);
const outputs = reel.cfg.output || {};

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/core/player.html?reel=${reel.id}&render`);
  await page.evaluate(() => window.ready);
  return page;
}
const decode = (url) => Buffer.from(url.split(',')[1], 'base64');
const grab = async (page, t, noBlur = false) => decode(await page.evaluate(([t, nb]) => window.frameAt(t, nb), [t, noBlur]));

async function video(browser, port, preview) {
  const fps = Number(opt.fps || (preview ? 30 : reel.cfg.format?.fps || 60));
  const out = R(opt.out || (preview ? 'output/preview.mp4' : outputs.video || `output/fazlo-digital-${reel.id}.mp4`));
  const silent = R('output/.video-only.mp4');
  const page0 = await openPage(browser, port);
  const dur = await page0.evaluate(() => window.duration());
  await page0.close();
  const from = Number(opt.from || 0), to = Math.min(dur, Number(opt.to || dur));
  const f0 = Math.round(from * fps), total = Math.round(to * fps) - f0;
  const workers = Number(opt.workers || 4);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const enc = preview
    ? ['-preset', 'veryfast', '-crf', '23']
    : ['-preset', 'slow', '-crf', '15', '-profile:v', 'high', '-level', '4.2', '-tune', 'animation'];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', ...enc, '-pix_fmt', 'yuv420p', '-g', String(fps * 2),
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg saiu com ' + c)))));

  const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, port)));
  const pending = new Map();
  let next = 0, written = 0;
  const t0 = Date.now();
  const flush = async () => {
    while (pending.has(written)) {
      const buf = pending.get(written); pending.delete(written);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      written++;
      if (written % fps === 0 || written === total) process.stdout.write(`\r  ${written}/${total} quadros  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
  };
  let flushing = Promise.resolve();
  await Promise.all(pages.map(async (page) => {
    while (true) {
      const i = next++;
      if (i >= total) break;
      while (i - written > 120) await new Promise((r) => setTimeout(r, 5));   // limita a memória em espera
      pending.set(i, await grab(page, (f0 + i) / fps, !!opt.noblur));
      flushing = flushing.then(flush);
    }
  }));
  await flushing; await flush();
  ff.stdin.end();
  await ffDone;
  process.stdout.write('\n');

  const audio = R('audio/trilha.wav');
  if (fs.existsSync(audio)) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-ss', String(from), '-t', String(to - from), '-i', audio,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
    fs.unlinkSync(silent);
  } else {
    console.warn('  aviso: audio/trilha.wav não existe; vídeo sem áudio');
    fs.renameSync(silent, out);
  }
  console.log(`  ${preview ? 'preview' : 'vídeo'}: ${path.relative(process.cwd(), out)}`);
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: ['--disable-gpu-vsync', '--font-render-hinting=none'] });
  try {
    if (mode === 'cues') {
      const page = await openPage(browser, port);
      const data = await page.evaluate(() => window.cues());
      const out = R('audio/cues.json');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(data, null, 1) + '\n');
      console.log(`cues: ${data.cues.length} eventos -> ${path.relative(process.cwd(), out)}`);
    } else if (mode === 'cover') {
      const page = await openPage(browser, port);
      const out = R(opt.out || outputs.cover || 'output/capa.png');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, decode(await page.evaluate(() => window.coverFrame())));
      console.log('capa:', path.relative(process.cwd(), out));
    } else if (mode === 'stills') {
      const times = String(pos[2] || '0').split(',').map(Number);
      const dir = R(opt.dir || 'output/stills');
      fs.mkdirSync(dir, { recursive: true });
      const page = await openPage(browser, port);
      for (const t of times) {
        const f = path.join(dir, `t${t.toFixed(3).padStart(7, '0')}${opt.noblur ? '-noblur' : ''}.png`);
        fs.writeFileSync(f, await grab(page, t, !!opt.noblur));
        console.log('quadro:', path.relative(process.cwd(), f));
      }
    } else {
      await video(browser, port, mode === 'preview');
    }
  } finally {
    await browser.close();
    srv.close();
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
