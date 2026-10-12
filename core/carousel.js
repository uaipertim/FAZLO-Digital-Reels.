/* =====================================================================
   FAZLO Digital — carrosséis estáticos (Canvas 2D)

   Peças estáticas do feed (ex.: 9 slides 1080x1350, 4:5). Cada carrossel
   registra os seus slides com FZC.define({...}) e usa os mesmos utilitários
   do motor dos Reels (FZD.U) e os tokens da marca (FZD_BRAND):

     FZC.define({
       id: 'o-que-o-hospede-procura',
       width: 1080, height: 1350,
       setup(api) { ... },                       // uma vez, com fontes e assets prontos
       slides: [ (ctx, api) => { ... }, ... ],   // um desenho por slide
     });

   O mesmo código serve o preview (core/carousel.html) e o render em PNG
   (tools/carousel.cjs).
   ===================================================================== */
(function () {
  'use strict';

  const ALL = {};
  let current = null;

  function define(spec) {
    if (!spec.id || !Array.isArray(spec.slides) || !spec.slides.length) throw new Error('FZC.define: id e slides são obrigatórios');
    const W = spec.width || 1080, H = spec.height || 1350;
    const api = { W, H, count: spec.slides.length, assets: {}, brand: window.FZD_BRAND || {}, U: window.FZD && window.FZD.U };
    let ready = false;

    function init(assets = {}) {
      api.assets = assets;
      if (spec.setup) spec.setup(api);
      ready = true;
    }

    // desenha o slide i (0..count-1) no contexto, do zero
    function render(ctx, i) {
      if (!ready) throw new Error(`${spec.id}: init() ainda não foi chamado`);
      if (i < 0 || i >= spec.slides.length) throw new Error(`${spec.id}: slide ${i + 1} não existe`);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
      ctx.clearRect(0, 0, W, H);
      spec.slides[i](ctx, { ...api, index: i, n: i + 1 });
      ctx.restore();
    }

    const car = { id: spec.id, W, H, count: spec.slides.length, api, init, render };
    ALL[spec.id] = car; current = car;
    return car;
  }

  window.FZC = { define, get: (id) => ALL[id], current: () => current };
})();
