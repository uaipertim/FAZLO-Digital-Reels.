/* Utilitários comuns das ferramentas Node: localizar Reels, servidor estático, Playwright. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// "00", "reel-00", "reels/reel-00" ou "_calibracao" -> { id, dir, cfg }
function resolveReel(arg) {
  if (!arg) throw new Error('informe o Reel: ex. 00, reel-01 ou _calibracao');
  let id = path.basename(String(arg).replace(/\/+$/, ''));
  if (/^\d+$/.test(id)) id = `reel-${id.padStart(2, '0')}`;
  const dir = path.join(ROOT, 'reels', id);
  const cfgPath = path.join(dir, 'reel.json');
  if (!fs.existsSync(cfgPath)) throw new Error(`Reel não encontrado: ${path.relative(ROOT, cfgPath)}`);
  return { id, dir, cfg: JSON.parse(fs.readFileSync(cfgPath, 'utf8')) };
}

// argumentos: posicionais + --chave valor / --flag
function parseArgs(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2), v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) opt[k] = true; else { opt[k] = v; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.cjs': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4', '.md': 'text/plain; charset=utf-8',
};

// servidor estático da raiz do repositório (porta 0 = livre). Suporta Range (seek de áudio no preview).
// `extra(req, res)` pode responder rotas próprias (retorna true quando respondeu).
function serve(port = 0, host = '127.0.0.1', extra = null) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      if (extra && extra(req, res)) return;
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
      const size = fs.statSync(file).size;
      const headers = { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (m) {
        const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1;
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Content-Length': b - a + 1 });
        return fs.createReadStream(file, { start: a, end: b }).pipe(res);
      }
      res.writeHead(200, { ...headers, 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    });
    srv.on('error', reject);
    srv.listen(port, host, () => resolve(srv));
  });
}

function loadPlaywright() {
  try { return require('playwright'); } catch (_) {
    const root = execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  }
}

// Chromium: CHROMIUM_PATH, se definido; senão, o do próprio Playwright
const chromiumPath = () => process.env.CHROMIUM_PATH || undefined;

module.exports = { ROOT, resolveReel, parseArgs, serve, loadPlaywright, chromiumPath, MIME };
