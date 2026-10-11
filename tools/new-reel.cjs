#!/usr/bin/env node
/*
 * Cria a pasta de um novo Reel a partir de templates/reel.
 *
 *   node tools/new-reel.cjs 03 "Título provisório"                    -> reels/reel-03/
 *   node tools/new-reel.cjs instagram-nao-e-site "Instagram não é site" -> reels/instagram-nao-e-site/
 *
 * Não sobrescreve um Reel existente.
 */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib.cjs');

const [numArg, ...titleParts] = process.argv.slice(2);
// número (03 -> reel-03) ou nome da pasta pelo título (minúsculas, sem acento, com hífens)
if (!numArg || !/^(\d+|[a-z0-9]+(-[a-z0-9]+)*)$/.test(numArg)) { console.error('uso: node tools/new-reel.cjs <número | nome-da-pasta> ["título"]'); process.exit(2); }
const isNum = /^\d+$/.test(numArg);
const num = isNum ? numArg.padStart(2, '0') : numArg;
const id = isNum ? `reel-${num}` : numArg;
const title = titleParts.join(' ') || 'A definir';
const dest = path.join(ROOT, 'reels', id);
if (fs.existsSync(dest)) { console.error(`já existe: reels/${id}`); process.exit(1); }

const vars = { '{{ID}}': id, '{{NUM}}': num, '{{TITLE}}': title };
const fill = (s) => Object.entries(vars).reduce((acc, [k, v]) => acc.split(k).join(v), s);
(function copy(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) copy(a, b);
    else if (/\.(js|json|md|py|html|css)$/.test(e.name)) fs.writeFileSync(b, fill(fs.readFileSync(a, 'utf8')));
    else fs.copyFileSync(a, b);
  }
})(path.join(ROOT, 'templates', 'reel'), dest);
fs.chmodSync(path.join(dest, 'scripts', 'audio.py'), 0o755);
console.log(`criado: reels/${id}  ("${title}")`);
console.log(`preview: npm run dev  ->  /core/player.html?reel=${id}`);
