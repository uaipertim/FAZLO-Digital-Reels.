/*
 * Case Guardião da Serra — as telas REAIS do site no ar (pousadaguardiaodaserra.com.br), no celular.
 *
 *   node reels/case-guardiao-da-serra/captura.cjs   -> reels/case-guardiao-da-serra/telas/*.png + telas.json
 *
 * 390 px de largura (CSS), 3x (1170 px), Chromium com toque. Nada é montado nem retocado: são quadros do site real.
 * Só duas coisas mudam no quadro, por regra do vídeo:
 *   - todo número de telefone é desfocado (blur no texto que tem o número; o campo "Telefone" fica vazio);
 *   - os botões só com o ícone do WhatsApp (o redondo do topo e o flutuante) ficam ocultos, e nos botões com texto
 *     ("Enviar pelo WhatsApp") só o ícone some: nenhum logo de app no vídeo.
 * telas.json guarda, para cada quadro, as caixas (em px do PNG) do que o vídeo realça: título, foto tocada, chalé etc.
 * A mensagem que o site monta para o WhatsApp é lida do próprio link (texto real, sem nome e sem telefone).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(process.cwd(), 'node_modules/playwright'));
const OUT = path.join(__dirname, 'telas');
const URL = 'https://pousadaguardiaodaserra.com.br/';
const K = 3, VW = 390, VH = 844;

const LIMPA = `
  (() => {
    const tel = /(\\(?\\d{2}\\)?\\s?9?\\d{4}-?\\d{4})/;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const alvo = [];
    while (w.nextNode()) if (tel.test(w.currentNode.nodeValue)) alvo.push(w.currentNode.parentElement);
    alvo.forEach((e) => { e.style.filter = 'blur(7px)'; e.dataset.desfocado = '1'; });
    document.querySelectorAll('a[href*="wa.me"]').forEach((a) => {
      const r = a.getBoundingClientRect(), st = getComputedStyle(a);
      const redondo = Math.abs(r.width - r.height) < 6 && r.width < 80;
      if (redondo || st.position === 'fixed') a.style.visibility = 'hidden';
      a.querySelectorAll('svg, img').forEach((i) => { i.style.visibility = 'hidden'; });
    });
    document.querySelectorAll('*').forEach((e) => { if (getComputedStyle(e).position === 'fixed' && e.querySelector && e.querySelector('a[href*="wa.me"]')) e.style.visibility = 'hidden'; });
    return alvo.length;
  })()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: K, isMobile: true, hasTouch: true });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600);
  const texto = await p.evaluate(() => document.body.innerText + ' ' + (document.querySelector('meta[name=description]') || {}).content);
  const conferencia = { tres: (texto.match(/3 cachoeiras|Três cachoeiras/gi) || []).length, grinalda: /grinalda/i.test(texto), quatro: /4 cachoeiras|quatro cachoeiras/i.test(texto) };
  if (conferencia.grinalda || conferencia.quatro || !conferencia.tres) throw new Error('o site ainda fala em 4 cachoeiras/Grinalda: ' + JSON.stringify(conferencia));
  const meta = { url: URL, capturado_em: new Date().toISOString(), largura_css: VW, escala: K, conferencia, telas: {} };
  const caixa = async (loc) => { const r = await loc.boundingBox(); return r && [r.x, r.y, r.x + r.width, r.y + r.height].map((v) => Math.round(v * K)); };
  const foto = async (nome, caixas = {}) => {
    const n = await p.evaluate(LIMPA);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, nome + '.png') });
    const cx = {};
    for (const [k, loc] of Object.entries(caixas)) cx[k] = await caixa(loc);
    meta.telas[nome] = { caixas: cx, telefones_desfocados: n };
    console.log(nome, JSON.stringify(cx));
  };
  const rolaAte = async (loc, topo = 0) => { await p.evaluate(({ y }) => window.scrollTo(0, y), { y: (await loc.evaluate((e) => e.getBoundingClientRect().top + scrollY)) - topo }); await p.waitForTimeout(700); };
  const M = p.locator('#inicio-m');

  // 1) o topo: "Pousada com cachoeiras na Serra da Canastra" + o slide "3 cachoeiras dentro da propriedade."
  await p.locator('#inicio-m button[aria-label="Ver foto 1: Cachoeira da Capivara"]').click(); await p.waitForTimeout(900);
  await foto('01-topo', { h1: M.locator('h1'), titulo: M.getByText('3 cachoeiras dentro da propriedade.'), foto: M.locator('button[aria-label^="Ampliar foto"]').first() });

  // 2) a seção do pôr do sol
  const ps = p.locator('#por-do-sol-m');
  await rolaAte(ps, 64);
  await foto('02-por-do-sol', { secao: ps, titulo: ps.locator('h2'), foto: ps.locator('img').first(), chips: ps.getByText('Queijo Canastra').first() });

  // 3) as fotos grandes: a seção das cachoeiras, o toque numa foto e ela em tela cheia
  const ca = p.locator('#cachoeiras-m');
  await rolaAte(ca, 64);
  const alvoFoto = ca.locator('button[aria-label^="Ampliar"]').nth(2);
  await foto('03a-fotos', { titulo: ca.locator('h2'), toque: alvoFoto });
  meta.telas['03a-fotos'].rotulo_toque = await alvoFoto.getAttribute('aria-label');
  await alvoFoto.tap(); await p.waitForTimeout(900);
  await foto('03b-foto-tela-cheia', {});

  // 4) a consulta: datas -> chalé -> a mensagem pronta
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const fechar = p.locator('button[aria-label*="Fechar" i]');
  if (await fechar.count() && await fechar.first().isVisible()) { await fechar.first().click(); await p.waitForTimeout(500); }
  const vp = p.getByText('Uma vilinha de chalés coloridos.').last();
  await rolaAte(vp, 420);
  await foto('04a-vila-pequi', { titulo: vp, card: vp.locator('xpath=ancestor::*[.//img][1]') });
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  await M.getByText('Chegada').click(); await p.waitForTimeout(500);
  const cal = M.locator('button').filter({ hasText: /^\d{1,2}$/ });
  const livres = [];
  for (const el of await cal.all()) if (await el.isEnabled()) livres.push(el);
  await livres[0].click(); await p.waitForTimeout(250); await livres[3].click(); await p.waitForTimeout(400);
  await rolaAte(M.getByText('Quando você vem pra serra?'), 70);
  await foto('04b-datas', { cartao: M.getByText('Quando você vem pra serra?') });
  await M.getByText('Consultar', { exact: true }).click(); await p.waitForTimeout(600);
  await M.getByText('Consultar disponibilidade').click(); await p.waitForTimeout(900);
  const quase = M.getByText('Quase lá');
  const chale = M.getByText('Pôr do Sol 03', { exact: true }).last();
  await chale.click(); await p.waitForTimeout(500);
  await rolaAte(quase, 120);
  await foto('04c-chale', { quase, chale, enviar: M.getByText('Enviar pelo WhatsApp') });
  meta.mensagem = await p.evaluate(() => { const a = [...document.querySelectorAll('#inicio-m a[href*="wa.me"]')].find((x) => x.href.includes('text=')); return a ? decodeURIComponent(a.href.split('text=')[1]) : null; });
  meta.mensagem = meta.mensagem && meta.mensagem.replace(/wa\.me\/\d+/g, '');

  // 5) o rodapé: "Site feito por Fazlo Digital" (o telefone de contato desfocado)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(800);
  await foto('05-rodape', { credito: p.getByText('Site feito por').last() });

  fs.writeFileSync(path.join(OUT, 'telas.json'), JSON.stringify(meta, null, 1));
  console.log('mensagem:', meta.mensagem);
  await b.close();
})();
