#!/usr/bin/env node
/*
 * Pipeline completo de um Reel, na ordem certa:
 *
 *   cues -> audio -> video -> cover -> storyboard -> qa
 *
 *   node tools/build.cjs 00                       (tudo)
 *   node tools/build.cjs 00 --steps audio,video   (só alguns passos)
 *   node tools/build.cjs 00 --skip qa
 *
 * cues:        eventos de som tirados da animação  (render.cjs cues)
 * audio:       trilha + efeitos sincronizados       (reels/<id>/scripts/audio.py)
 * video:       MP4 1080x1920 60 fps + áudio          (render.cjs video)
 * cover:       capa 1080x1920                        (render.cjs cover)
 * storyboard:  folha de quadros-chave                (tools/storyboard.py)
 * qa:          revisão técnica e de sincronização    (tools/qa.py)
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { resolveReel, parseArgs } = require('./lib.cjs');

const ALL = ['cues', 'audio', 'video', 'cover', 'storyboard', 'qa'];
const { pos, opt } = parseArgs(process.argv.slice(2));
const reel = resolveReel(pos[0]);
const PY = process.env.PYTHON || 'python3';
let steps = opt.steps ? String(opt.steps).split(',') : ALL.slice();
if (opt.skip) steps = steps.filter((s) => !String(opt.skip).split(',').includes(s));
for (const s of steps) if (!ALL.includes(s)) { console.error(`passo desconhecido: ${s} (${ALL.join(', ')})`); process.exit(2); }

const T = (f) => path.join(__dirname, f);
const CMD = {
  cues: ['node', [T('render.cjs'), 'cues', reel.id]],
  audio: [PY, [path.join(reel.dir, 'scripts', 'audio.py')]],
  video: ['node', [T('render.cjs'), 'video', reel.id, ...(opt.workers ? ['--workers', opt.workers] : [])]],
  cover: ['node', [T('render.cjs'), 'cover', reel.id]],
  storyboard: [PY, [T('storyboard.py'), reel.id]],
  qa: [PY, [T('qa.py'), reel.id]],
};

const t0 = Date.now();
for (const s of steps) {
  console.log(`\n=== ${reel.id} · ${s}`);
  const [cmd, args] = CMD[s];
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`\n${reel.id}: o passo "${s}" falhou (código ${r.status})`); process.exit(r.status || 1); }
}
console.log(`\n${reel.id}: ${steps.join(' -> ')} concluído em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
