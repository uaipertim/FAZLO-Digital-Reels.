#!/usr/bin/env node
/*
 * Servidor de desenvolvimento: preview interativo de todos os Reels.
 *
 *   npm run dev                 -> http://127.0.0.1:5173
 *   npm run dev -- --port 8080 --host 0.0.0.0
 *
 * A página inicial lista os Reels; cada um abre em core/player.html?reel=<id>
 * (play/scrub com áudio, quadro a quadro, zonas seguras, capa).
 */
const fs = require('fs');
const path = require('path');
const { ROOT, parseArgs, serve } = require('./lib.cjs');

const { opt } = parseArgs(process.argv.slice(2));
const port = Number(opt.port || process.env.PORT || 5173);
const host = opt.host || '127.0.0.1';

function reels() {
  const dir = path.join(ROOT, 'reels');
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'reel.json')))
    .map((d) => ({ dir: d, ...JSON.parse(fs.readFileSync(path.join(dir, d, 'reel.json'), 'utf8')) }));
}

function index(req, res) {
  if (req.url.split('?')[0] !== '/') return false;
  const rows = reels().map((r) => `<li><a href="/core/player.html?reel=${r.id}">${r.id}</a> · ${r.title || ''} <em>${r.status || ''}</em>
    · <a href="/core/player.html?reel=${r.id}&cover">capa</a> · <a href="/core/player.html?reel=${r.id}&zones">zonas</a></li>`).join('\n');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><meta charset="utf-8"><title>FAZLO Digital — Reels</title>
<style>body{background:#0B0B0B;color:#EDEDED;font:15px/1.7 ui-monospace,monospace;padding:32px}a{color:#EDEDED}em{opacity:.5}</style>
<h1>FAZLO Digital — Reels</h1><ul>${rows}</ul>`);
  return true;
}

serve(port, host, index).then(() => {
  console.log(`FAZLO Digital — preview em http://${host}:${port}`);
  for (const r of reels()) console.log(`  ${r.id.padEnd(12)} http://${host}:${port}/core/player.html?reel=${r.id}`);
});
