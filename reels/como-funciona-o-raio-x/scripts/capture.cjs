#!/usr/bin/env node
/*
 * Capturas reais do site da Pousada Vale dos Canteiros (uso autorizado pelo cliente)
 * e checagem, no site ao vivo, de cada dado usado no Reel.
 *
 *   node reels/como-funciona-o-raio-x/scripts/capture.cjs
 *
 * Gera em src/assets/site/:
 *   m-NN.jpg            celular (390 pt, 2x), página inteira em faixas de 1600 pt
 *   d-NN.jpg            desktop (1440 px, 1x), página inteira em faixas de 1600 px
 *   m-modal-1.jpg/-2    modal "Ver detalhes" do 1º chalé (topo e comodidades/alimentação)
 *   m-dayuse.jpg        modal do Day Use no celular; d-dayuse.jpg no desktop
 *   m-map.jpg/d-map.jpg o mapa de "Onde estamos" (iframe do Google Maps), capturado à parte:
 *                       a captura de página inteira não desenha iframes de outro domínio; o Reel
 *                       sobrepõe esta imagem às faixas na posição do iframe (manifest: map)
 *   manifest.json       faixas, altura da página e caixa de cada seção/título (para rolar e acender)
 *   checagem.txt        cada dado do roteiro com o trecho do site onde ele aparece
 *
 * - A seção de depoimentos ("Quem passou por aqui conta melhor") é REMOVIDA da página antes
 *   de medir e capturar: não aparece em nenhuma imagem, nem na rolagem.
 * - O site carrega React, ReactDOM e Babel do unpkg.com; se o unpkg estiver bloqueado na rede,
 *   as mesmas versões vêm do registro do npm (arquivos idênticos).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadPlaywright, chromiumPath } = require('../../../tools/lib.cjs');

const URL0 = 'https://pousadavaledoscanteiros.com.br/';
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'assets', 'site');
const CHUNK = 1600;

// ---------------------------------------------------------------- dependências que o site busca no unpkg
const VENDOR = [
  ['react', '18.3.1', 'umd/react.production.min.js'],
  ['react-dom', '18.3.1', 'umd/react-dom.production.min.js'],
  ['@babel/standalone', '7.29.0', 'babel.min.js'],
];
function vendorFiles() {
  const dir = path.join(os.tmpdir(), 'fzd-vendor');
  fs.mkdirSync(dir, { recursive: true });
  const map = {};
  for (const [name, ver, file] of VENDOR) {
    const sub = path.join(dir, `${name.replace('/', '__')}-${ver}`);
    const f = path.join(sub, 'package', file);
    if (!fs.existsSync(f)) {
      fs.mkdirSync(sub, { recursive: true });
      const tgz = execFileSync('npm', ['pack', `${name}@${ver}`, '--silent'], { cwd: sub }).toString().trim().split('\n').pop();
      execFileSync('tar', ['-xzf', tgz], { cwd: sub });
    }
    map[`https://unpkg.com/${name}@${ver}/${file}`] = f;
  }
  return map;
}

async function openPage(browser, device, local) {
  const ctx = await browser.newContext(device);
  await ctx.route('https://unpkg.com/**', async (r) => {
    const f = local[r.request().url()];
    if (!f) return r.continue();
    return r.fulfill({ path: f, contentType: 'text/javascript' });
  });
  const page = await ctx.newPage();
  const failed = new Set();
  page.on('requestfailed', (q) => failed.add(new URL(q.url()).host));
  page.on('pageerror', (e) => console.error('[site]', e.message));
  await page.goto(URL0, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1500);
  return { page, ctx, failed };
}

// remove os depoimentos, desliga animações e passa pela página inteira (imagens e entradas)
async function prepare(page) {
  const removed = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h2')].find((e) => /Quem passou por aqui/i.test(e.innerText));
    const sec = h && h.closest('section');
    if (sec) sec.remove();
    return !!sec;
  });
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;scroll-behavior:auto!important}' });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(90); }
  // o mapa de "Onde estamos" é um iframe do Google Maps: trazê-lo à vista e esperar os blocos
  await page.evaluate(() => { const f = document.querySelector('iframe[src*="google.com/maps"]'); if (f) f.scrollIntoView({ block: 'center' }); });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  const still = await page.evaluate(() => /Quem passou por aqui/i.test(document.body.innerText));
  return { removed, stillThere: still };
}

// caixas (coordenadas da página) das seções e dos títulos usados no Reel
async function measure(page) {
  return page.evaluate(() => {
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
    const sections = {};
    const hero = document.querySelector('section.vc-hero'); if (hero) sections.hero = box(hero);
    for (const id of ['disponibilidade', 'pousada', 'acomodacoes', 'experiencias', 'mesa', 'historia', 'serra', 'contato']) {
      const e = document.getElementById(id); if (e) sections[id] = box(e);
    }
    const head = (re) => { const e = [...document.querySelectorAll('h1,h2,h3,p,span,div')].find((x) => x.children.length === 0 && re.test(x.innerText || '')); return e ? box(e) : null; };
    const anchors = {
      consulte: head(/^Consulte sua estadia$/i),
      chales: (() => { const e = [...document.querySelectorAll('h2')].find((x) => /^Nossos chalés/i.test(x.innerText)); return e ? box(e) : null; })(),
      verDetalhes: (() => { const e = [...document.querySelectorAll('button,a')].find((x) => /^Ver detalhes$/i.test(x.innerText.trim()) && x.getBoundingClientRect().width > 0); return e ? box(e) : null; })(),
      viver: head(/Viver a Canastra/i),
      sabores: head(/Sabores da fazenda/i),
      historia: head(/Nossa história/i),
      onde: head(/^Onde estamos$/i),
      logo: (() => { const e = document.querySelector('header a'); return e ? box(e) : null; })(),
    };
    const ifr = document.querySelector('iframe[src*="google.com/maps"]');
    const firstImg = (sel) => { const e = [...document.querySelectorAll(`${sel} img`)].find((i) => i.getBoundingClientRect().width > 60 && getComputedStyle(i).opacity !== '0'); return e ? box(e) : null; };
    const images = { hero: firstImg('section.vc-hero'), chales: firstImg('#acomodacoes'), passeios: firstImg('#experiencias'), cafe: firstImg('#mesa'), historia: firstImg('#historia') };
    const name = [...document.querySelectorAll('#acomodacoes h3')].find((x) => x.getBoundingClientRect().width > 0);
    let card = name; while (card && card.parentElement && card.getBoundingClientRect().height < 420) card = card.parentElement;
    // foto do 1º chalé: o bloco logo acima do texto do cartão
    let ph = card && card.previousElementSibling;
    if (!ph && card) { let up = card; while (up.parentElement && !up.previousElementSibling) up = up.parentElement; ph = up.previousElementSibling; }
    if (ph) images.chales = box(ph);
    return { H: document.documentElement.scrollHeight, W: document.documentElement.clientWidth, sections, anchors, images, firstCard: card ? box(card) : null, map: ifr ? box(ifr) : null };
  });
}

// o iframe do mapa só aparece numa captura da área visível: centralizar, esperar os blocos e recortar
async function mapShot(page, map, file) {
  if (!map) return null;
  await page.evaluate((m) => window.scrollTo(0, Math.max(0, m.y + m.h / 2 - window.innerHeight / 2)), map);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(5000);
  const sy = await page.evaluate(() => window.scrollY);
  await page.screenshot({ path: path.join(OUT, file), clip: { x: map.x, y: map.y - sy, width: map.w, height: map.h }, type: 'jpeg', quality: 90 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  return { file, ...map };
}

// modal do Day Use aberto: caixas (na área visível) do título, do item "Acesso às 04 cachoeiras" e do painel
function dayRects(page) {
  return page.evaluate(() => {
    const bx = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
    const h = [...document.querySelectorAll('h2')].find((e) => /dia inteiro na serra/i.test(e.innerText) && e.getBoundingClientRect().width > 0);
    const li = [...document.querySelectorAll('li, p, span, div')].filter((e) => /Acesso às 04 cachoeiras/i.test(e.innerText) && e.getBoundingClientRect().width > 0)
      .sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0];
    let panel = h; while (panel && panel.parentElement && !/Reservar no WhatsApp/i.test(panel.innerText)) panel = panel.parentElement;
    return { title: h ? bx(h) : null, cachoeiras: li ? bx(li) : null, panel: panel ? bx(panel) : null };
  });
}

async function chunks(page, prefix, H, W, upTo) {
  const files = [];
  const end = Math.min(H, upTo);
  for (let y = 0, i = 0; y < end; y += CHUNK, i++) {
    const h = Math.min(CHUNK, H - y);
    const file = `${prefix}-${String(i).padStart(2, '0')}.jpg`;
    await page.screenshot({ path: path.join(OUT, file), clip: { x: 0, y, width: W, height: h }, fullPage: true, type: 'jpeg', quality: 88 });
    files.push({ file, y, h });
  }
  return files;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const local = vendorFiles();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const manifest = { url: URL0, capturedAt: new Date().toISOString(), removed: 'seção de depoimentos ("Quem passou por aqui conta melhor")' };
  const facts = [];
  try {
    // ---------------- celular
    const M = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
    let { page, ctx, failed } = await openPage(browser, M, local);
    const prepM = await prepare(page);
    const mm = await measure(page);
    const text = await page.evaluate(() => `${document.body.innerText}\n${[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' | ')}`);
    const upTo = mm.sections.contato ? mm.sections.contato.y + mm.sections.contato.h + 200 : mm.H;
    manifest.mobile = { dpr: 2, W: mm.W, H: mm.H, ...mm, chunks: await chunks(page, 'm', mm.H, mm.W, upTo), testimonialsRemoved: prepM.removed && !prepM.stillThere };
    manifest.mobile.map = await mapShot(page, mm.map, 'm-map.jpg');
    manifest.mobile.failedHosts = [...failed];
    manifest.mobile.mapLoaded = ![...failed].some((h) => /google|gstatic/.test(h));
    // modal "Ver detalhes" do 1º chalé
    await page.locator('button:visible, a:visible').filter({ hasText: /^\s*Ver detalhes\s*$/ }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'm-modal-1.jpg'), type: 'jpeg', quality: 90 });
    const modal = await page.evaluate(() => {
      // títulos internos do modal aparecem em caixa alta (CSS): comparar sem diferenciar maiúsculas
      const h = [...document.querySelectorAll('h3')].find((e) => /comodidades/i.test(e.innerText) && e.getBoundingClientRect().width > 0);
      if (!h) return null;
      h.scrollIntoView({ block: 'start' });
      let dlg = h; while (dlg.parentElement && !/Consultar este chalé/i.test(dlg.innerText)) dlg = dlg.parentElement;
      return { name: (dlg.querySelector('h2') || {}).innerText || '', text: dlg.innerText.replace(/\s+/g, ' ') };
    });
    await page.waitForTimeout(400);
    const inclusoRect = await page.evaluate(() => {   // "o que está incluso": blocos Comodidades e Alimentação, na área visível
      const parts = [];
      for (const re of [/comodidades/i, /alimenta/i]) {
        const h = [...document.querySelectorAll('h3')].find((e) => re.test(e.innerText) && e.getBoundingClientRect().width > 0);
        if (!h) return null;
        parts.push(h.getBoundingClientRect());
        if (h.nextElementSibling) parts.push(h.nextElementSibling.getBoundingClientRect());
      }
      const x0 = Math.min(...parts.map((r) => r.left)), y0 = Math.min(...parts.map((r) => r.top)), x1 = Math.max(...parts.map((r) => r.right)), y1 = Math.max(...parts.map((r) => r.bottom));
      return { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'm-modal-2.jpg'), type: 'jpeg', quality: 90 });
    manifest.mobile.modal = { files: ['m-modal-1.jpg', 'm-modal-2.jpg'], chalet: modal && modal.name, incluso: inclusoRect };
    await ctx.close();
    // Day Use (celular: menu -> "Reservar Day Use")
    ({ page, ctx } = await openPage(browser, M, local));
    await page.locator('button:visible').filter({ hasText: /menu/i }).first().click();
    await page.waitForTimeout(700);
    await page.locator('button:visible, a:visible').filter({ hasText: /Day Use/i }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'm-dayuse.jpg'), type: 'jpeg', quality: 90 });
    manifest.mobile.dayuse = { file: 'm-dayuse.jpg', ...(await dayRects(page)) };
    const dayuse = await page.evaluate(() => { const h = [...document.querySelectorAll('h2')].find((e) => /dia inteiro na serra/i.test(e.innerText)); if (!h) return ''; let el = h; for (let i = 0; i < 3 && el.parentElement; i++) el = el.parentElement; return el.innerText.replace(/\s+/g, ' '); });
    await ctx.close();

    // ---------------- desktop
    const D = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
    ({ page, ctx, failed } = await openPage(browser, D, local));
    const prepD = await prepare(page);
    const dm = await measure(page);
    const upD = dm.sections.contato ? dm.sections.contato.y + dm.sections.contato.h + 200 : dm.H;
    manifest.desktop = { dpr: 1, W: dm.W, H: dm.H, ...dm, chunks: await chunks(page, 'd', dm.H, dm.W, upD), testimonialsRemoved: prepD.removed && !prepD.stillThere };
    manifest.desktop.map = await mapShot(page, dm.map, 'd-map.jpg');
    manifest.desktop.failedHosts = [...failed];
    manifest.desktop.mapLoaded = ![...failed].some((h) => /google|gstatic/.test(h));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.locator('header button:visible').filter({ hasText: /Day Use/i }).first().click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'd-dayuse.jpg'), type: 'jpeg', quality: 90 });
    manifest.desktop.dayuse = { file: 'd-dayuse.jpg', ...(await dayRects(page)) };
    await ctx.close();

    // ---------------- checagem dos dados do roteiro (texto do site ao vivo)
    const all = `${text}\n${modal ? modal.text : ''}\n${dayuse}`;
    const find = (re) => { const m = all.match(re); return m ? all.slice(Math.max(0, m.index - 40), m.index + m[0].length + 60).replace(/\s+/g, ' ').trim() : null; };
    const check = (item, re) => facts.push({ item, found: find(re) });
    // ficha (cena 2)
    check('ficha · LOGO', /Vale dos Canteiros/);
    check('ficha · FOTOS', /Foto 1 de 5/);                     // galeria do topo (5 fotos)
    check('ficha · CHALÉS', /conta com 9 chalés/);
    check('ficha · CAFÉ', /Café da manhã/);
    check('ficha · PASSEIOS', /Encontro das Águas/);
    check('ficha · HISTÓRIA', /Nossa história/i);
    check('ficha · CONTATOS (só ícones)', /WhatsApp/);
    // chips do "único" (cena 3)
    check('chip · Fazenda de tropeiros', /recebiam os tropeiros|parada dos tropeiros/);
    check('chip · Desde 2009', /abriu as portas em 2009/);
    check('chip · Cachoeiras na fazenda', /Cachoeiras na fazenda|quatro cachoeiras/i);
    check('chip · Fogão a lenha', /fogão a lenha/i);
    check('chip · Day Use', /Um dia inteiro na serra/);
    // chips do hóspede (cena 4) e seções (cena 5)
    check('chip · Datas e hóspedes → Consulte sua estadia', /Consulte sua estadia[\s\S]{0,200}Adultos/i);
    check('chip · Qual chalé → Nossos chalés', /Nossos chalés/);
    check('chip · O que está incluso → modal Ver detalhes', /Comodidades[\s\S]{0,600}Alimenta[çc][ãa]o/i);
    check('chip · Cachoeiras na fazenda → Viver a Canastra', /Viver a Canastra/i);
    check('chip · Day Use → Day Use (acesso às cachoeiras)', /Acesso às 04 cachoeiras/i);
    check('chip · Fogão a lenha → Sabores da fazenda', /Sabores da fazenda/i);
    check('chip · tropeiros + 2009 → Nossa história', /Nossa história/i);
    check('chip · Como chegar → Onde estamos', /Onde estamos/i);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  // reel.json: as imagens capturadas viram assets pré-carregados pelo player (chave = nome do arquivo)
  const cfgPath = path.join(ROOT, 'reel.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const rel = (f) => path.relative(path.resolve(ROOT, '..', '..'), path.join(OUT, f)).split(path.sep).join('/');
  const files = [];
  for (const d of [manifest.mobile, manifest.desktop]) { files.push(...d.chunks.map((c) => c.file)); if (d.map) files.push(d.map.file); if (d.dayuse) files.push(d.dayuse.file); }
  files.push(...manifest.mobile.modal.files);
  cfg.assets = Object.fromEntries(files.map((f) => [f.replace(/\.jpg$/, ''), rel(f)]));
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
  const lines = facts.map((f) => `${f.found ? 'OK   ' : 'FALTA'}  ${f.item}${f.found ? `\n       “…${f.found}…”` : ''}`);
  lines.push('', `depoimentos removidos: celular ${manifest.mobile.testimonialsRemoved ? 'sim' : 'NÃO'}, desktop ${manifest.desktop.testimonialsRemoved ? 'sim' : 'NÃO'}`);
  const fh = (d) => (d.failedHosts.length ? ` (falharam: ${d.failedHosts.join(', ')})` : '');
  lines.push(`mapa do Google carregado: celular ${manifest.mobile.mapLoaded ? 'sim' : 'NÃO'}${fh(manifest.mobile)}, desktop ${manifest.desktop.mapLoaded ? 'sim' : 'NÃO'}${fh(manifest.desktop)}`);
  fs.writeFileSync(path.join(OUT, 'checagem.txt'), `CHECAGEM — ${URL0} (${manifest.capturedAt})\n\n${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
  if (facts.some((f) => !f.found)) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
