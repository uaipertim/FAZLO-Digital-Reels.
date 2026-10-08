/* =====================================================================
   FAZLO Digital — reel-02 · A definir — 9:16 (1080x1920, 60 fps)

   ESQUELETO: produção ainda não iniciada. Conceito, roteiro, direção de
   arte e trilha serão definidos a partir do briefing deste Reel.

   frame(ctx, t, api) desenha o quadro exato do instante t (determinístico).
   cues(api) registra os eventos de som (api.cue(t, 'tipo', {...})) que a
   trilha usa para cair no quadro certo. Ver core/engine.js.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { text } = U;

  const DURATION = 20;                          // provisório
  const BPM = 120;                              // provisório
  const { bar } = U.tempo(BPM);
  const T = { open: 0 };                        // seções (instantes em s), exportadas em cues.json

  FZD.define({
    id: 'reel-02',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: { default: [4, 1 / 120], ranges: [] }, // [[t0, t1, amostras, abertura_s]]

    setup(api) {
      // layout que depende das fontes/assets carregados (api.assets, api.brand)
    },

    frame(ctx, t, api) {
      const B = api.brand;
      ctx.fillStyle = B.color.bg; ctx.fillRect(0, 0, W, H);
      text(ctx, 'FAZLO DIGITAL', W / 2, 900, { fam: B.font.mono, size: 34, weight: 700, color: B.color.muted, align: 'center', ls: 8 });
      text(ctx, 'reel-02'.toUpperCase(), W / 2, 1010, { fam: B.font.display, size: 110, weight: 800, color: B.color.ink, align: 'center' });
      text(ctx, 'aguardando briefing', W / 2, 1080, { fam: B.font.mono, size: 30, weight: 500, color: B.color.muted, align: 'center' });
      text(ctx, `${t.toFixed(2)} s`, W / 2, 1180, { fam: B.font.mono, size: 26, weight: 500, color: B.color.muted, align: 'center' });
    },

    cover(ctx, api) {
      this.frame(ctx, 0, api);
    },

    cues(api) {
      // api.cue(bar(1), 'hit', { v: 1 });
    },
  });
})();
