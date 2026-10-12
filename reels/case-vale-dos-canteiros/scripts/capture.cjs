#!/usr/bin/env node
/*
 * Capturas COMPLEMENTARES do site da Pousada Vale dos Canteiros (uso autorizado pelo cliente)
 * para o Reel "Conheça o site da Pousada Vale dos Canteiros", e checagem dos dados novos.
 *
 *   node reels/case-vale-dos-canteiros/scripts/capture.cjs
 *
 * Reaproveita as capturas do Reel "Como funciona o raio-x" (página inteira no celular, m-00..m-10,
 * e o mapa m-map) e a checagem de dados dele; aqui entram só os passos da navegação do hóspede.
 * Antes de capturar, confere que a página medida agora tem as mesmas seções e a mesma altura das
 * capturas reaproveitadas (as coordenadas valem para as duas).
 *
 * Gera em src/assets/site/ (celular 390x844 pt, 2x; telas = área visível do celular):
 *   hero-1..5.jpg        topo do site com cada foto do carrossel (sem o cabeçalho)
 *   header-top.png       cabeçalho no topo (transparente, texto claro) — PNG com transparência
 *   header-scrolled.png  cabeçalho depois de rolar (fundo claro 92%) — PNG com transparência
 *   form-0..3.jpg        "Consulte sua estadia": inicial · com as datas · + 1 criança · completo
 *   cal-oct/-nov/-d5.jpg calendário real do site (outubro, novembro, dia 5 marcado); cal-scrim.jpg = o fundo
 *   list.jpg             lista "Acomodação de interesse" aberta; list-scrim.jpg = o fundo
 *   m6-0.jpg             modal "Ver detalhes" do Chalé de Pedra 6 (tela inteira); m6-scrim.jpg = o fundo
 *   m6-s0/-s1.jpg        conteúdo rolável do modal (topo e fim, sem o botão fixo; o botão sai de m6-0)
 *   menu.jpg             MENU aberto
 *   dayuse.jpg           modal do Day Use aberto pelo menu; dayuse-scrim.jpg = o fundo
 *   t-11.jpg             faixa final da página (até o rodapé), continuação de m-10
 *   footer-4x.jpg        rodapé em 4x (para a aproximação em "Site por")
 *   manifest.json        rolagens, caixas de cada toque (px CSS) e arquivos
 *   mensagem.txt         a mensagem que o site monta no clique em "Enviar consulta pelo WhatsApp"
 *                        (o wa.me é interceptado: nada é aberto nem enviado; o número não é guardado)
 *   checagem.txt         cada dado novo do roteiro com o trecho do site onde ele aparece
 *
 * - A seção de depoimentos ("Quem passou por aqui conta melhor") é REMOVIDA da página antes de
 *   qualquer captura.
 * - Movimento reduzido ligado: o carrossel do topo não troca sozinho (cada foto é escolhida pelo
 *   seu botão "Foto n de 5").
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadPlaywright, chromiumPath } = require('../../../tools/lib.cjs');

const URL0 = 'https://pousadavaledoscanteiros.com.br/';
const ROOT = path.resolve(__dirname, '..');
const REPO = path.resolve(ROOT, '..', '..');
const OUT = path.join(ROOT, 'src', 'assets', 'site');
const RAIOX = path.join(REPO, 'reels', 'como-funciona-o-raio-x', 'src', 'assets', 'site');
const VW = 390, VH = 844;
const M2 = { viewport: { width: VW, height: VH }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' };

// dados escolhidos para a consulta (aprovados): 05/11 a 08/11/2026, 2 adultos, 1 criança, Chalé de Pedra 6
const STAY = { inLabel: 'qui, 5 de nov.', outLabel: 'dom, 8 de nov.', chalet: 'Chalé de Pedra 6' };

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

let LOCAL;
async function openPage(browser, device = M2) {
  const ctx = await browser.newContext(device);
  await ctx.route('https://unpkg.com/**', async (r) => {
    const f = LOCAL[r.request().url()];
    if (!f) return r.continue();
    return r.fulfill({ path: f, contentType: 'text/javascript' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[site]', e.message));
  await page.goto(URL0, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1500);
  // o clique em "Enviar consulta" chama window.open('https://wa.me/...'): aqui ele só é registrado
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
  await prepare(page);
  return { page, ctx };
}

// remove os depoimentos, desliga transições, carrega todas as imagens e volta ao topo
async function prepare(page) {
  const removed = await page.evaluate(() => {
    const h = [...document.querySelectorAll('h2')].find((e) => /Quem passou por aqui/i.test(e.innerText));
    const sec = h && h.closest('section');
    if (sec) sec.remove();
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    return !!sec;
  });
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;scroll-behavior:auto!important}' });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 400) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(60); }
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  page.__removed = removed && !(await page.evaluate(() => /Quem passou por aqui/i.test(document.body.innerText)));
}

// espera as imagens visíveis terminarem de carregar
async function imagesReady(page) {
  await page.waitForFunction(() => [...document.images].filter((i) => {
    const r = i.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(i).visibility !== 'hidden';
  }).every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 }).catch(() => console.warn('  (imagens: tempo esgotado)'));
  await page.waitForTimeout(250);
}

const shot = async (page, file, clip) => {
  await imagesReady(page);
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 90, ...(clip ? { clip } : {}) });
  return file;
};
// caixa (px CSS da área visível; page=true -> da página) do 1º elemento visível que casa com o seletor/texto
function rectOf(page, sel, re = null, pageCoords = false) {
  return page.evaluate(({ sel, src, flags, pageCoords }) => {
    const re = src ? new RegExp(src, flags) : null;
    const el = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!re || re.test(e.innerText || e.getAttribute('aria-label') || '')); })
      .sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)[0];
    if (!el) return null;
    const r = el.getBoundingClientRect(), oy = pageCoords ? scrollY : 0;
    return { x: Math.round(r.left), y: Math.round(r.top + oy), w: Math.round(r.width), h: Math.round(r.height) };
  }, { sel, src: re && re.source, flags: re && re.flags, pageCoords });
}
const hideStyle = async (page, css) => page.addStyleTag({ content: css }).then((h) => h);
const unhide = (page, h) => page.evaluate((el) => el.remove(), h);

// ---------------------------------------------------------------- medidas da página (px CSS da página)
function measure(page) {
  return page.evaluate(() => {
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
    const sections = {};
    const hero = document.querySelector('section.vc-hero'); if (hero) sections.hero = box(hero);
    for (const id of ['disponibilidade', 'pousada', 'acomodacoes', 'experiencias', 'mesa', 'historia', 'serra', 'contato']) {
      const e = document.getElementById(id); if (e) sections[id] = box(e);
    }
    const leaf = (root, re) => [...root.querySelectorAll('*')].filter((x) => x.children.length === 0 && re.test((x.innerText || '').trim()) && x.getBoundingClientRect().width > 0);
    // chalés: o cartão do Chalé de Pedra 6 (foto + texto) e o seu "Ver detalhes"
    const h6 = [...document.querySelectorAll('#acomodacoes h3')].find((x) => /Chalé de Pedra 6/.test(x.innerText));
    const card = h6 && h6.closest('article');                 // foto (div.vc-cover) + texto
    const ver6 = card && [...card.querySelectorAll('button,a')].find((x) => /Ver detalhes/i.test(x.innerText));
    const cards = [...document.querySelectorAll('#acomodacoes h3')].filter((x) => x.getBoundingClientRect().width > 0).map((x) => ({ name: x.innerText.trim(), ...box(x) }));
    // Viver a Canastra: título de cada passeio e as etiquetas de distância
    const exp = document.getElementById('experiencias');
    const passeios = [...exp.querySelectorAll('h3')].filter((x) => x.getBoundingClientRect().width > 0).map((h) => {
      let c = h; while (c.parentElement && c.parentElement !== exp && c.getBoundingClientRect().height < 300) c = c.parentElement;
      const tags = [...c.querySelectorAll('*')].filter((x) => x.children.length === 0 && x.getBoundingClientRect().height > 0 && x.getBoundingClientRect().height < 40 && x.getBoundingClientRect().top > h.getBoundingClientRect().bottom - 2 && x.getBoundingClientRect().top < h.getBoundingClientRect().bottom + 60)
        .map((x) => ({ text: x.innerText.trim(), ...box(x) })).filter((t) => t.text);
      return { title: h.innerText.replace(/\s+/g, ' ').trim(), ...box(h), tags, card: box(c) };
    });
    const ct = document.getElementById('contato');
    const km = leaf(ct, /^22 km/)[0];
    const kmLabel = km && km.parentElement;
    const footer = document.querySelector('footer');
    const fz = footer && footer.querySelector('a[href*="fazlodigital"]');
    const head = (re) => { const e = [...document.querySelectorAll('h1,h2,h3,p,span,div')].find((x) => x.children.length === 0 && re.test(x.innerText || '')); return e ? box(e) : null; };
    return {
      H: document.documentElement.scrollHeight, W: document.documentElement.clientWidth, sections,
      anchors: { consulte: head(/^Consulte sua estadia$/i), chales: (() => { const e = [...document.querySelectorAll('h2')].find((x) => /^Nossos chalés/i.test(x.innerText)); return e ? box(e) : null; })(), viver: head(/Viver a Canastra/i), onde: head(/^Onde estamos$/i) },
      chales: { cards, card6: card ? box(card) : null, name6: h6 ? box(h6) : null, ver6: ver6 ? box(ver6) : null },
      passeios,
      onde: { km: kmLabel ? { text: kmLabel.innerText.replace(/\s+/g, ' ').trim(), ...box(kmLabel) } : null },
      footer: footer ? { ...box(footer), text: footer.innerText.replace(/\s+/g, ' ').trim(), link: fz ? { ...box(fz), href: fz.getAttribute('href'), alt: (fz.querySelector('img') || {}).alt || '' } : null, logo: fz && fz.querySelector('img') ? box(fz.querySelector('img')) : null } : null,
      heroTabs: [...document.querySelectorAll('button[aria-label^="Foto "]')].map((e) => ({ label: e.getAttribute('aria-label'), ...box(e) })),
      header: (() => { const h = document.querySelector('header'); return h ? box(h) : null; })(),
    };
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  LOCAL = vendorFiles();
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const RX = JSON.parse(fs.readFileSync(path.join(RAIOX, 'manifest.json'), 'utf8'));
  const man = { url: URL0, capturedAt: new Date().toISOString(), removed: 'seção de depoimentos ("Quem passou por aqui conta melhor")', viewport: { w: VW, h: VH, dpr: 2 } };
  const texts = [];             // trechos do site para a checagem
  const removedAll = [];
  try {
    // ================================================================ 1. página, topo e cabeçalho
    let { page, ctx } = await openPage(browser);
    removedAll.push(page.__removed);
    const mm = await measure(page);
    man.page = mm;
    // as capturas reaproveitadas do raio-x valem só se a página tiver a mesma geometria
    const rxm = RX.mobile, diffs = [];
    if (Math.abs(rxm.H - mm.H) > 2) diffs.push(`altura ${rxm.H} -> ${mm.H}`);
    for (const [k, b] of Object.entries(rxm.sections)) { const n = mm.sections[k]; if (!n || Math.abs(n.y - b.y) > 2 || Math.abs(n.h - b.h) > 2) diffs.push(`${k} ${b.y}/${b.h} -> ${n ? `${n.y}/${n.h}` : 'sumiu'}`); }
    man.reuse = { from: 'reels/como-funciona-o-raio-x/src/assets/site', chunks: rxm.chunks, map: rxm.map, sameGeometry: diffs.length === 0, diffs };
    if (diffs.length) console.warn('ATENÇÃO: a página mudou desde as capturas do raio-x:', diffs.join('; '));
    texts.push(await page.evaluate(() => `${document.body.innerText}\n${[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' | ')}`));

    // fotos do carrossel do topo (cabeçalho escondido: ele entra por cima, separado)
    const hero = mm.sections.hero;
    const hh = await hideStyle(page, 'header{visibility:hidden!important}');
    man.hero = { rect: hero, slides: [] };
    for (let i = 1; i <= 5; i++) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.locator(`button[aria-label="Foto ${i} de 5"]`).tap();
      await page.waitForTimeout(900);
      const file = await shot(page, `hero-${i}.jpg`, { x: 0, y: 0, width: VW, height: hero.h });
      const t = await page.evaluate(() => { const h = document.querySelector('section.vc-hero h1'); const ey = h && h.previousElementSibling; return { title: h ? h.innerText.replace(/\s+/g, ' ').trim() : '', eyebrow: ey ? ey.innerText.replace(/\s+/g, ' ').trim() : '' }; });
      const h1 = await rectOf(page, 'section.vc-hero h1');
      man.hero.slides.push({ file, ...t, h1 });
      texts.push(`${t.eyebrow} ${t.title}`);
    }
    await unhide(page, hh);
    await page.locator('button[aria-label="Foto 1 de 5"]').tap();
    // cabeçalho, nos dois estados, com fundo transparente (só ele visível)
    const solo = 'html,body{background:transparent!important} *{visibility:hidden!important} header,header *{visibility:visible!important}';
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(700);
    let st = await hideStyle(page, solo);
    await page.locator('header').screenshot({ path: path.join(OUT, 'header-top.png'), omitBackground: true });
    await unhide(page, st);
    await page.evaluate(() => window.scrollTo(0, 3000)); await page.waitForTimeout(700);
    man.header = { rect: await rectOf(page, 'header'), scrolledAfter: null, menu: await rectOf(page, 'header button', /menu/i) };
    st = await hideStyle(page, solo);
    await page.locator('header').screenshot({ path: path.join(OUT, 'header-scrolled.png'), omitBackground: true });
    await unhide(page, st);
    // a partir de quantos px de rolagem o cabeçalho fica claro
    for (const y of [0, 10, 20, 40, 60, 80, 120, 200]) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(150);
      if (await page.evaluate(() => document.querySelector('header').getAttribute('data-scrolled') === 'true')) { man.header.scrolledAfter = y; break; }
    }
    // faixa final da página (continua as faixas m-00..m-10 do raio-x)
    const last = rxm.chunks[rxm.chunks.length - 1], ty = last.y + last.h;
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
    if (ty < mm.H) {
      await page.screenshot({ path: path.join(OUT, 't-11.jpg'), clip: { x: 0, y: ty, width: VW, height: mm.H - ty }, fullPage: true, type: 'jpeg', quality: 88 });
      man.tail = [{ file: 't-11.jpg', y: ty, h: mm.H - ty }];
    } else man.tail = [];

    // ================================================================ 2. a consulta (formulário real)
    await page.evaluate(() => document.getElementById('disponibilidade').scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(600);
    const F = { scroll: await page.evaluate(() => scrollY), files: {}, taps: {} };
    F.taps.entrada = await rectOf(page, '#disponibilidade button', /^\s*Entrada/i);
    F.taps.saida = await rectOf(page, '#disponibilidade button', /^\s*Sa[ií]da/i);
    F.taps.maisCriancas = await rectOf(page, 'button[aria-label="Mais crianças"]');
    F.taps.acomodacao = await rectOf(page, '#f-acomodacao');
    F.taps.enviar = await rectOf(page, '#disponibilidade button', /Enviar consulta pelo WhatsApp/i);
    F.card = await page.evaluate(() => { const f = document.querySelector('#disponibilidade form'); let c = f; while (c.parentElement && !/Consulte sua estadia/i.test(c.innerText)) c = c.parentElement; const r = c.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
    F.files.form0 = await shot(page, 'form-0.jpg');
    // Entrada -> calendário do site
    await page.locator('#disponibilidade button:visible').filter({ hasText: /Entrada/i }).first().tap();
    await page.waitForTimeout(600);
    F.cal = { sheet: await rectOf(page, '.vc-cal-pop') };
    F.files.calOct = await shot(page, 'cal-oct.jpg');
    F.cal.monthOct = await page.evaluate(() => document.querySelector('.vc-cal-months p').innerText.trim());
    let hs = await hideStyle(page, '.vc-cal-pop{visibility:hidden!important}');
    F.files.calScrim = await shot(page, 'cal-scrim.jpg');
    await unhide(page, hs);
    F.cal.eyebrowOct = await page.evaluate(() => document.querySelector('.vc-cal-pop .vc-eyebrow').innerText.trim());
    F.taps.proximo = await rectOf(page, '.vc-cal-pop button[aria-label="Próximo mês"]');
    await page.locator('.vc-cal-pop button[aria-label="Próximo mês"]').tap(); await page.waitForTimeout(500);
    F.files.calNov = await shot(page, 'cal-nov.jpg');
    F.cal.monthNov = await page.evaluate(() => document.querySelector('.vc-cal-months p').innerText.trim());
    F.taps.dia5 = await rectOf(page, `.vc-cal-pop button[aria-label="${STAY.inLabel}"]`);
    F.taps.dia8 = await rectOf(page, `.vc-cal-pop button[aria-label="${STAY.outLabel}"]`);
    await page.locator(`.vc-cal-pop button[aria-label="${STAY.inLabel}"]`).first().tap(); await page.waitForTimeout(500);
    F.files.calD5 = await shot(page, 'cal-d5.jpg');
    F.cal.eyebrowD5 = await page.evaluate(() => document.querySelector('.vc-cal-pop .vc-eyebrow').innerText.trim());
    await page.locator(`.vc-cal-pop button[aria-label="${STAY.outLabel}"]`).first().tap(); await page.waitForTimeout(700);
    F.cal.closesOnCheckout = !(await page.locator('.vc-cal-pop').isVisible().catch(() => false));
    F.files.form1 = await shot(page, 'form-1.jpg');
    F.values1 = await page.evaluate(() => [...document.querySelectorAll('#disponibilidade .vc-field')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
    // + 1 criança
    await page.locator('button[aria-label="Mais crianças"]').tap(); await page.waitForTimeout(500);
    F.files.form2 = await shot(page, 'form-2.jpg');
    // Acomodação de interesse -> lista -> Chalé de Pedra 6
    await page.locator('#f-acomodacao').tap(); await page.waitForTimeout(700);
    F.list = { sheet: await rectOf(page, '[role="listbox"]') };
    F.taps.chale6 = await rectOf(page, '[role="option"]', /Chalé de Pedra 6/);
    F.files.list = await shot(page, 'list.jpg');
    F.list.options = await page.evaluate(() => [...document.querySelectorAll('[role="option"]')].map((o) => o.innerText.replace(/\s+/g, ' ').replace(' ✓', '').trim()));
    hs = await hideStyle(page, '[role="listbox"]{visibility:hidden!important}');
    F.files.listScrim = await shot(page, 'list-scrim.jpg');
    await unhide(page, hs);
    await page.locator('[role="option"]').filter({ hasText: /Chalé de Pedra 6/ }).first().tap(); await page.waitForTimeout(600);
    F.files.form3 = await shot(page, 'form-3.jpg');
    F.values3 = await page.evaluate(() => document.querySelector('#disponibilidade form').innerText.replace(/\s+/g, ' ').trim());
    F.scrollEnd = await page.evaluate(() => scrollY);
    // Enviar: a mensagem que o site monta (wa.me interceptado)
    await page.locator('#disponibilidade button').filter({ hasText: /Enviar consulta pelo WhatsApp/i }).tap(); await page.waitForTimeout(600);
    const opened = await page.evaluate(() => window.__opened);
    const wa = opened.find((u) => /wa\.me/.test(u));
    const message = wa ? decodeURIComponent(wa.split('?text=')[1] || '') : '';
    F.message = { opened: !!wa, host: wa ? new URL(wa).host : null, text: message };   // o número não é guardado
    man.form = F;
    texts.push(F.values3, message, F.cal.eyebrowOct, F.cal.monthOct, F.cal.monthNov, F.cal.eyebrowD5, F.list.options.join(' | '));
    await ctx.close();

    // ================================================================ 3. Chalé de Pedra 6: "Ver detalhes"
    ({ page, ctx } = await openPage(browser));
    removedAll.push(page.__removed);
    const c6 = mm.chales;
    const photoTop = c6.card6.y;                                // o cartão começa na foto
    const S6 = Math.max(0, photoTop - 96);
    await page.evaluate((y) => window.scrollTo(0, y), S6); await page.waitForTimeout(600);
    const M6 = { scroll: await page.evaluate(() => scrollY), taps: {}, files: {} };
    M6.taps.ver = await page.evaluate((y) => { const b = [...document.querySelectorAll('#acomodacoes button, #acomodacoes a')].filter((x) => /^\s*Ver detalhes\s*$/i.test(x.innerText)).find((x) => Math.abs(x.getBoundingClientRect().top + scrollY - y) < 3); const r = b.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; }, c6.ver6.y);
    M6.files.page = await shot(page, 'm6-page.jpg');
    await page.touchscreen.tap(M6.taps.ver.x + M6.taps.ver.w / 2, M6.taps.ver.y + M6.taps.ver.h / 2);
    await page.waitForTimeout(1200);
    const modalInfo = await page.evaluate(() => {
      const m = document.querySelector('.vc-modal'); if (!m) return null;
      const r = m.getBoundingClientRect(), cs = getComputedStyle(m);
      return { rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }, radius: parseFloat(cs.borderTopLeftRadius) || 0, scrollMax: m.scrollHeight - m.clientHeight, scrollH: m.scrollHeight, name: (m.querySelector('h2') || {}).innerText || '', text: m.innerText.replace(/\s+/g, ' ').trim() };
    });
    Object.assign(M6, modalInfo);
    M6.files.top = await shot(page, 'm6-0.jpg');
    M6.taps.close = await rectOf(page, '.vc-modal .vc-modal-x');
    M6.cta = await rectOf(page, '.vc-modal-cta');
    // blocos "Comodidades" e "Alimentação" em px CSS do conteúdo rolável (0 = topo do modal)
    M6.blocks = await page.evaluate(() => {
      const m = document.querySelector('.vc-modal'), top = m.getBoundingClientRect().top - m.scrollTop;
      const out = {};
      for (const [k, re] of [['comodidades', /comodidades/i], ['alimentacao', /alimenta/i], ['destaques', /destaques/i], ['valores', /valores da hospedagem/i]]) {
        const h = [...m.querySelectorAll('h3,h4,p')].find((e) => re.test(e.innerText) && e.getBoundingClientRect().width > 0 && e.innerText.length < 40);
        if (!h) continue;
        const parts = [h.getBoundingClientRect()]; if (h.nextElementSibling) parts.push(h.nextElementSibling.getBoundingClientRect());
        const x0 = Math.min(...parts.map((r) => r.left)), y0 = Math.min(...parts.map((r) => r.top)), x1 = Math.max(...parts.map((r) => r.right)), y1 = Math.max(...parts.map((r) => r.bottom));
        out[k] = { x: Math.round(x0), y: Math.round(y0 - top), w: Math.round(x1 - x0), h: Math.round(y1 - y0), text: `${h.innerText} ${h.nextElementSibling ? h.nextElementSibling.innerText : ''}`.replace(/\s+/g, ' ').trim() };
      }
      return out;
    });
    hs = await hideStyle(page, '.vc-modal{visibility:hidden!important}');
    M6.files.scrim = await shot(page, 'm6-scrim.jpg');
    await unhide(page, hs);
    // conteúdo rolável: topo e fim, sem o botão fixo (ele entra por cima, separado)
    const mr = M6.rect;
    const clip = { x: mr.x, y: mr.y, width: mr.w, height: mr.h };
    hs = await hideStyle(page, '.vc-modal-cta{visibility:hidden!important}');
    await page.evaluate(() => { document.querySelector('.vc-modal').scrollTop = 0; }); await page.waitForTimeout(300);
    M6.files.s0 = await shot(page, 'm6-s0.jpg', clip);
    await page.evaluate(() => { const m = document.querySelector('.vc-modal'); m.scrollTop = m.scrollHeight; }); await page.waitForTimeout(400);
    M6.files.s1 = await shot(page, 'm6-s1.jpg', clip);
    M6.s1Scroll = await page.evaluate(() => document.querySelector('.vc-modal').scrollTop);
    await unhide(page, hs);
    // fecha tocando fora do painel?
    await page.touchscreen.tap(VW / 2, Math.min(VH - 8, mr.y + mr.h + 24));
    await page.waitForTimeout(600);
    M6.closesOnBackdrop = !(await page.locator('.vc-modal').isVisible().catch(() => false));
    man.chalet6 = M6;
    texts.push(M6.text || '');
    await ctx.close();

    // ================================================================ 4. MENU -> "Reservar Day Use" (rolagem: fim de "Viver a Canastra")
    ({ page, ctx } = await openPage(browser));
    removedAll.push(page.__removed);
    const p3 = mm.passeios[2] || mm.passeios[mm.passeios.length - 1];
    const SD = Math.max(0, p3.card.y + p3.card.h - VH + 40);       // 3º passeio inteiro na tela
    await page.evaluate((y) => window.scrollTo(0, y), SD); await page.waitForTimeout(700);
    const DU = { scroll: await page.evaluate(() => scrollY), taps: {}, files: {} };
    DU.files.page = await shot(page, 'du-page.jpg');
    DU.taps.menu = await rectOf(page, 'header button', /menu/i);
    await page.locator('header button:visible').filter({ hasText: /menu/i }).first().tap(); await page.waitForTimeout(800);
    DU.files.menu = await shot(page, 'menu.jpg');
    DU.taps.reservar = await rectOf(page, 'button, a', /^\s*Reservar Day Use\s*$/i);
    DU.menuText = await page.evaluate(() => { const b = [...document.querySelectorAll('button,a')].find((x) => /^\s*Reservar Day Use\s*$/i.test(x.innerText) && x.getBoundingClientRect().width > 0); let p = b; while (p && p.parentElement && p.getBoundingClientRect().height < innerHeight * 0.9) p = p.parentElement; return p ? p.innerText.replace(/\s+/g, ' ').trim() : ''; });
    await page.locator('button:visible, a:visible').filter({ hasText: /^\s*Reservar Day Use\s*$/i }).first().tap(); await page.waitForTimeout(1200);
    DU.files.modal = await shot(page, 'dayuse.jpg');
    DU.scrollAfter = await page.evaluate(() => scrollY);
    DU.panel = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')].find((e) => /dia inteiro na serra/i.test(e.innerText) && e.getBoundingClientRect().width > 0);
      let el = h; while (el.parentElement && el.parentElement.getBoundingClientRect().width < innerWidth - 4) el = el.parentElement;   // o cartão (foto + texto)
      const r = el.getBoundingClientRect();
      el.setAttribute('data-fzd-panel', '');
      return { cls: el.className, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), scrollMax: el.scrollHeight - el.clientHeight, text: el.innerText.replace(/\s+/g, ' ').trim() };
    });
    DU.bullets = {};
    for (const [k, re] of [['horario', /Das 10h às 17h/], ['cachoeiras', /Acesso às 04 cachoeiras da pousada/], ['almoco', /Almoço mineiro incluído/]]) DU.bullets[k] = await rectOf(page, 'li, p, span, div', re);
    DU.title = await rectOf(page, 'h2', /dia inteiro na serra/i);
    DU.taps.close = await rectOf(page, '.vc-modal-x, button[aria-label*="echar"]');
    hs = await hideStyle(page, '[data-fzd-panel]{visibility:hidden!important}');
    DU.files.scrim = await shot(page, 'dayuse-scrim.jpg');
    await unhide(page, hs);
    man.dayuse = DU;
    texts.push(DU.panel.text, DU.menuText);
    await ctx.close();

    // ================================================================ 5. rodapé em 4x ("Site por" + logo FAZLO)
    ({ page, ctx } = await openPage(browser, { ...M2, deviceScaleFactor: 4 }));
    removedAll.push(page.__removed);
    const fm = await measure(page);
    const fr = fm.footer;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'footer-4x.jpg'), clip: { x: 0, y: fr.y, width: VW, height: fr.h }, fullPage: true, type: 'jpeg', quality: 92 });
    man.footer = { file: 'footer-4x.jpg', dpr: 4, ...fr };
    texts.push(fr.text, `${fr.link && fr.link.href} alt="${fr.link && fr.link.alt}"`);
    await ctx.close();
  } finally {
    await browser.close();
  }
  man.testimonialsRemoved = removedAll.every(Boolean);
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(man, null, 1) + '\n');
  fs.writeFileSync(path.join(OUT, 'mensagem.txt'), `${man.form.message.text}\n`);

  // ---------------------------------------------------------------- checagem dos dados novos
  const all = texts.join('\n');
  const facts = [];
  const find = (re) => { const m = all.match(re); return m ? all.slice(Math.max(0, m.index - 40), m.index + m[0].length + 60).replace(/\s+/g, ' ').trim() : null; };
  const check = (item, re) => facts.push({ item, found: find(re) });
  const expected = ['Olá! Vim pelo site da Pousada Vale dos Canteiros e gostaria de consultar uma estadia.', '',
    'Entrada: 05/11/2026', 'Saída: 08/11/2026', 'Adultos: 2', 'Crianças: 1', 'Acomodação de interesse: Chalé de Pedra 6', '',
    'Poderiam confirmar a disponibilidade e os valores?'].join('\n');
  check('gancho · pousada de família (texto do topo)', /Uma pousada de família/);
  check('gancho · pousada de família (A pousada)', /pousada de ambiente familiar/i);
  check('gancho · Serra da Canastra', /Serra da Canastra/);
  check('gancho · carrossel: Onde a serra amanhece devagar.', /Onde a serra amanhece devagar\./);
  check('gancho · carrossel: Portas abertas, rede na varanda.', /Portas abertas, rede na varanda\./);
  check('consulta · Consulte sua estadia', /Consulte sua estadia/);
  check('consulta · calendário: Escolha a chegada', /Escolha a chegada/i);
  check('consulta · calendário: novembro de 2026', /novembro de 2026/i);
  check('consulta · calendário: Escolha a saída (depois do dia 5)', /Escolha a saída/i);
  check('consulta · datas: qui, 5 de nov. / dom, 8 de nov.', /qui, 5 de nov\.[\s\S]{0,40}dom, 8 de nov\./);
  check('consulta · 2 adultos · 1 criança', /2 adultos[\s\S]{0,40}1 criança/);
  check('consulta · Chalé de Pedra 6 na lista', /Chalé de Pedra 6 Até 4 hóspedes/);
  check('consulta · Enviar consulta pelo WhatsApp', /Enviar consulta pelo WhatsApp/i);
  facts.push({ item: 'consulta · mensagem montada pelo site = modelo do código (texto exato)', found: man.form.message.text === expected ? man.form.message.text.split('\n')[0] : null });
  check('chalés · Chalé de Pedra 6: Até 4 hóspedes', /Chalé de Pedra 6 Até 4 hóspedes · 1 cama de casal e 2 de solteiro/);
  check('chalés · Comodidades', /COMODIDADES · Ar-condicionado · Ventilador de teto · Frigobar · Rede na varanda · Banheiro privativo · Wi-Fi/i);
  check('chalés · Alimentação', /ALIMENTAÇÃO Café da manhã e jantar no fim de semana/i);
  check('passeios · Encontro das Águas · 300 m da pousada · a pé', /Encontro das Águas[\s\S]{0,40}300 m da pousada[\s\S]{0,10}a pé/);
  check('passeios · Árvore que Encanta · 4 km da pousada', /Árvore que Encanta[\s\S]{0,40}4 km da pousada/);
  check('passeios · Paraíso dos Pássaros · 4 km · 4x4 ou caminhada', /Paraíso dos Pássaros[\s\S]{0,60}4 km[\s\S]{0,10}4x4 ou caminhada/);
  check('day use · MENU → Reservar Day Use', /Reservar Day Use/);
  check('day use · Das 10h às 17h', /Das 10h às 17h/);
  check('day use · Acesso às 04 cachoeiras da pousada', /Acesso às 04 cachoeiras da pousada/);
  check('day use · Almoço mineiro incluído', /Almoço mineiro incluído/);
  check('como chegar · Onde estamos', /Onde estamos/i);
  check('como chegar · 22 km · estrada de terra', /22 km[\s\S]{0,6}estrada de terra/);
  check('assinatura · rodapé: Site por', /Site por/);
  check('assinatura · rodapé: logo alt "Fazlo Digital" → fazlodigital.com.br', /fazlodigital\.com\.br[^\n]*alt="Fazlo Digital"/);
  const lines = facts.map((f) => `${f.found ? 'OK   ' : 'FALTA'}  ${f.item}${f.found ? `\n       “…${f.found}…”` : ''}`);
  lines.push('',
    `geometria igual à das capturas reaproveitadas do raio-x: ${man.reuse.sameGeometry ? 'sim' : `NÃO (${man.reuse.diffs.join('; ')})`}`,
    `depoimentos removidos em todas as capturas: ${man.testimonialsRemoved ? 'sim' : 'NÃO'}`,
    `calendário fecha sozinho ao tocar a saída: ${man.form.cal.closesOnCheckout ? 'sim (não há toque em Aplicar)' : 'não'}`,
    `modal do chalé fecha com toque fora do painel: ${man.chalet6.closesOnBackdrop ? 'sim' : 'não'}`,
    `wa.me interceptado (nada aberto, número não guardado): ${man.form.message.opened ? `sim (${man.form.message.host})` : 'NÃO CHAMADO'}`,
    '', 'dados reaproveitados: reels/como-funciona-o-raio-x/src/assets/site/checagem.txt');
  fs.writeFileSync(path.join(OUT, 'checagem.txt'), `CHECAGEM (dados novos) — ${URL0} (${man.capturedAt})\n\n${lines.join('\n')}\n`);
  console.log(lines.join('\n'));

  // ---------------------------------------------------------------- reel.json: assets pré-carregados (chave = nome do arquivo)
  const cfgPath = path.join(ROOT, 'reel.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const rel = (dir, f) => path.relative(REPO, path.join(dir, f)).split(path.sep).join('/');
  const assets = {};
  for (const ch of man.reuse.chunks) assets[ch.file.replace(/\.jpg$/, '')] = rel(RAIOX, ch.file);
  if (man.reuse.map) assets['m-map'] = rel(RAIOX, man.reuse.map.file);
  const mine = fs.readdirSync(OUT).filter((f) => /\.(jpg|png)$/.test(f) && !/^(m6-page|du-page)\.jpg$/.test(f)).sort();
  for (const f of mine) assets[f.replace(/\.(jpg|png)$/, '')] = rel(OUT, f);
  cfg.assets = assets;
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
  if (facts.some((f) => !f.found) || !man.reuse.sameGeometry || !man.testimonialsRemoved) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
