#!/usr/bin/env node
/*
 * Série "Pelos olhos do hóspede": um episódio inteiro, do roteiro à revisão.
 *
 *   npm run episodio -- nao-achou-o-preco
 *
 * Lê series/pelos-olhos-do-hospede/episodios/<id>.json e:
 *   0. se o roteiro tem o campo "voz": gera a narração (series/pelos-olhos-do-hospede/voz.py,
 *      ElevenLabs; só refaz as falas que mudaram) e guarda o vídeo curto sem voz que já existir
 *      como output/fazlo-digital-<id>-curto.mp4;
 *   1. cria (ou atualiza) a pasta do Reel reels/<id>/ (reel.json, src/anim.js
 *      de uma linha, scripts/audio.py que chama o som da série);
 *   2. exporta os cues e completa o reel.json com os instantes de revisão e
 *      do storyboard (a duração depende do roteiro);
 *   3. roda o pipeline normal: áudio -> vídeo -> capa -> storyboard -> QA;
 *   4. confere as áreas seguras elemento a elemento
 *      (output/revisao/areas-seguras.txt; sai com erro se algo ficar de fora).
 *
 * Com voz, a duração vem das falas (25–48 s com a leitura longa, padrão a partir do ep. 7; 25–30 s nos eps. 1–6,
 * "leitura": "curta"). Se passar do limite, o comando para antes do
 * render e avisa: nada é acelerado nem cortado sem aprovação (--forcar renderiza assim mesmo).
 *
 * Opções: --steps audio,video,...  (só alguns passos do pipeline do item 3) · --forcar
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, parseArgs, serve, loadPlaywright, chromiumPath } = require('./lib.cjs');

const { pos, opt } = parseArgs(process.argv.slice(2));
const id = pos[0];
if (!id) { console.error('uso: npm run episodio -- <id do roteiro>'); process.exit(2); }
const SERIE = path.join(ROOT, 'series', 'pelos-olhos-do-hospede');
const epPath = path.join(SERIE, 'episodios', `${id}.json`);
if (!fs.existsSync(epPath)) { console.error(`roteiro não encontrado: ${path.relative(ROOT, epPath)}`); process.exit(2); }
const ep = JSON.parse(fs.readFileSync(epPath, 'utf8'));
const dir = path.join(ROOT, 'reels', id);
const W = (rel, s) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const titulo = ep.titulo.map((s) => s.replace(/\*/g, '')).join(' ');
const comVoz = !!ep.voz;
const longa = comVoz && ep.leitura !== 'curta';      // leitura longa (padrão a partir do ep. 7): até 42 s
const LIMITE = longa ? 48 : 30;                  // leitura longa: 48 s desde 24/10 (era 42; o eleven_v4 fala com mais pausas)
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) { console.error(`\n${id}: falhou: ${cmd} ${args.join(' ')}`); process.exit(r.status || 1); }
};

// ---------------------------------------------------------------- 0. voz (e a versão curta sem voz guardada)
if (comVoz) {
  const v = path.join(dir, 'output', `fazlo-digital-${id}.mp4`), curto = path.join(dir, 'output', `fazlo-digital-${id}-curto.mp4`);
  // o vídeo que já existe é a versão curta sem voz só se este Reel ainda não foi gerado com voz (reel.json: "voz": true)
  const jaTinhaVoz = fs.existsSync(path.join(dir, 'reel.json')) && JSON.parse(fs.readFileSync(path.join(dir, 'reel.json'), 'utf8')).voz === true;
  if (fs.existsSync(v) && !fs.existsSync(curto) && !jaTinhaVoz) { fs.renameSync(v, curto); console.log(`versão curta sem voz guardada: ${path.relative(ROOT, curto)}`); }
  run(process.env.PYTHON || 'python3', [path.join(SERIE, 'voz.py'), id]);
}

// ---------------------------------------------------------------- 1. pasta do Reel
const cfgPath = path.join(dir, 'reel.json');
const old = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : {};
const cfg = {
  id, title: titulo, serie: 'Pelos olhos do hóspede', ...(comVoz ? { voz: true } : {}),
  status: old.status || 'em produção',
  format: { width: 1080, height: 1920, fps: 60 },
  output: { video: `output/fazlo-digital-${id}.mp4`, cover: 'output/capa.png', ...(comVoz && fs.existsSync(path.join(dir, 'output', `fazlo-digital-${id}-curto.mp4`)) ? { curto: `output/fazlo-digital-${id}-curto.mp4` } : {}) },
  fonts: ["900 100px 'FZD Display'", "800 100px 'FZD Display'", "600 100px 'FZD Text'", "700 100px 'FZD Text'"],
  scripts: ['../../series/pelos-olhos-do-hospede/motor.js'],
  assets: {},
  qa: {
    duration: comVoz ? [25, LIMITE + 0.05] : [10.4, 14.5], lufs: comVoz ? -14 : -16,
    syncCues: ['ping', 'stamp'], visualCues: ['ping', 'stamp'],
    checkTimes: old.qa?.checkTimes || [],
    coverClear: [[860, 240, 1080, 440], [0, 1560, 1080, 1680]],
  },
  storyboard: old.storyboard || [],
};
W('reel.json', JSON.stringify(cfg, null, 2) + '\n');
W('src/anim.js', `/* FAZLO Digital — série "Pelos olhos do hóspede" · ${titulo}\n   Roteiro: series/pelos-olhos-do-hospede/episodios/${id}.json (motor: series/pelos-olhos-do-hospede/motor.js). */\nFZS.episodio('${id}');\n`);
W('scripts/audio.py', `#!/usr/bin/env python3
"""Efeitos do episódio "${titulo}": o som é o da série (series/pelos-olhos-do-hospede/audio.py)."""
import os
import runpy
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.argv = [sys.argv[0], ROOT]
runpy.run_path(os.path.join(ROOT, '..', '..', 'series', 'pelos-olhos-do-hospede', 'audio.py'), run_name='__main__')
`);

// ---------------------------------------------------------------- 2. cues -> instantes de revisão e do storyboard
run('node', [path.join(__dirname, 'render.cjs'), 'cues', id]);
const cues = JSON.parse(fs.readFileSync(path.join(dir, 'audio', 'cues.json'), 'utf8'));
const at = (type) => cues.cues.filter((c) => c.type === type).map((c) => c.t);
const r2 = (x) => Math.round(x * 100) / 100;
const [stamp] = at('stamp'), [virada] = at('virada'), [fecho] = at('fecho'), [rise] = at('rise');
const D = cues.duration;
cfg.qa.checkTimes = [0, r2(rise + 0.7), ...at('ping').map((t) => r2(t + 0.5)), r2(stamp + 0.6), r2(virada + 1.2), r2(fecho + 1.3), r2(D - 0.35)];
cfg.storyboard = [[0, 'TÍTULO-DOR'], [r2(rise + 0.7), 'CABEÇALHO'], ...at('ping').map((t, k) => [r2(t + 0.5), `CARD ${k + 1}`]),
  [r2(stamp - 0.08), 'O CORTE'], [r2(stamp + 0.6), 'CARIMBO'], [r2(virada + 1.2), 'VIRADA'], [r2(fecho + 1.3), 'MANDA PRA QUEM…'], [r2(D - 0.35), 'LOGO']];
W('reel.json', JSON.stringify(cfg, null, 2) + '\n');
console.log(`${id}: ${D.toFixed(2)} s`);
if (comVoz && D > LIMITE && !opt.forcar) {
  console.error(`\n${id}: com as falas, o episódio fica com ${D.toFixed(2)} s (mais de ${LIMITE} s).`);
  console.error('Nada foi acelerado nem cortado. Encurte as falas no roteiro ou rode com --forcar para renderizar assim.');
  process.exit(3);
}

// ---------------------------------------------------------------- 3. pipeline
const steps = opt.steps ? String(opt.steps) : 'audio,video,cover,storyboard,qa';
const qaFirst = spawnSync('node', [path.join(__dirname, 'build.cjs'), id, '--steps', steps], { stdio: 'inherit', cwd: ROOT });

// ---------------------------------------------------------------- 4. áreas seguras, elemento a elemento
(async () => {
  const srv = await serve();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let bad = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', (e) => console.error('[page error]', e.message));
    await page.goto(`http://127.0.0.1:${srv.address().port}/core/player.html?reel=${id}&render`);
    await page.evaluate(() => window.ready);
    await page.evaluate(() => window.coverFrame());
    const { boxes, layout, capa } = await page.evaluate(() => ({ boxes: window.FZS_EP.boxes(), layout: window.FZS_EP.layout(), capa: window.FZS_EP.capa() }));
    const lines = [`${id.toUpperCase()} — áreas seguras, elemento a elemento`, '',
      'Regras: conteúdo entre y 265 e 1456; nada em x ≥ 950 entre y 1060 e 1560 (coluna de botões);',
      'título do quadro 0 dentro do recorte 3:4 (y 240–1680).', ''];
    for (const b of boxes) {
      const inY = b.y0 >= 265 && b.y1 <= 1456;
      const col = b.x1 > 950 && b.y1 > 1060 && b.y0 < 1560;
      const inX = b.x0 >= 0 && b.x1 <= 1080;
      const ok = inY && !col && inX;
      if (!ok) bad++;
      lines.push(`${ok ? 'OK   ' : 'FALHA'}  ${b.el.padEnd(24)} t=${b.t.toFixed(2).padStart(5)} s   x ${b.x0.toFixed(0).padStart(4)}–${b.x1.toFixed(0).padEnd(4)}  y ${b.y0.toFixed(0).padStart(4)}–${b.y1.toFixed(0)}`);
    }
    const cy = (capa.top + capa.bottom) / 2;
    const capaOk = capa.top >= 300 && capa.bottom <= 1540 && Math.abs(cy - 960) < 1;
    if (!capaOk) bad++;
    lines.push('', `${capaOk ? 'OK   ' : 'FALHA'}  capa: bloco (chip + título) em y ${capa.top.toFixed(0)}–${capa.bottom.toFixed(0)}, centro em y = ${cy.toFixed(1)} (recorte 3:4: 960)`);
    lines.push('', 'Layout calculado:', JSON.stringify(layout, null, 1), '', bad ? `RESULTADO: ${bad} falha(s)` : 'RESULTADO: aprovado');
    const out = path.join(dir, 'output', 'revisao', 'areas-seguras.txt');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, lines.join('\n') + '\n');
    console.log('\n' + lines.join('\n'));
  } finally {
    await browser.close(); srv.close();
  }
  if (bad || qaFirst.status !== 0) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
