#!/usr/bin/env node
/* Verifica o ambiente de produção: Node, ffmpeg (libx264 + AAC), Python (numpy, scipy, Pillow) e Chromium via Playwright. */
const { spawnSync } = require('child_process');
const { loadPlaywright, chromiumPath } = require('./lib.cjs');

const PY = process.env.PYTHON || 'python3';
let bad = 0;
const line = (ok, name, info) => { if (!ok) bad++; console.log(`${ok ? 'OK   ' : 'FALTA'}  ${name.padEnd(22)} ${info}`); };
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });

const major = +process.versions.node.split('.')[0];
line(major >= 18, 'Node >= 18', process.version);

const ff = run('ffmpeg', ['-hide_banner', '-encoders']);
line(ff.status === 0, 'ffmpeg', ff.status === 0 ? run('ffmpeg', ['-version']).stdout.split('\n')[0] : 'não encontrado no PATH');
if (ff.status === 0) {
  line(/libx264/.test(ff.stdout), 'ffmpeg: libx264', /libx264/.test(ff.stdout) ? 'H.264' : 'encoder ausente');
  line(/\baac\b/.test(ff.stdout), 'ffmpeg: aac', /\baac\b/.test(ff.stdout) ? 'AAC' : 'encoder ausente');
}
line(run('ffprobe', ['-version']).status === 0, 'ffprobe', '');

const py = run(PY, ['-c', 'import sys, numpy, scipy, PIL; print(sys.version.split()[0], "numpy", numpy.__version__, "scipy", scipy.__version__, "Pillow", PIL.__version__)']);
line(py.status === 0, 'Python + numpy/scipy/Pillow', py.status === 0 ? py.stdout.trim() : `rode: ${PY} -m pip install -r requirements.txt`);

(async () => {
  try {
    const { chromium } = loadPlaywright();
    const b = await chromium.launch({ executablePath: chromiumPath() });
    line(true, 'Chromium (Playwright)', b.version());
    await b.close();
  } catch (e) {
    line(false, 'Chromium (Playwright)', `npm install && npx playwright install chromium  (${String(e.message).split('\n')[0]})`);
  }
  console.log(bad ? `\n${bad} pendência(s)` : '\nambiente pronto');
  process.exit(bad ? 1 : 0);
})();
