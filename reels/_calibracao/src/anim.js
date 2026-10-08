/* =====================================================================
   FAZLO Digital — calibração técnica do pipeline (não é um Reel)

   Cartela neutra para validar render, motion blur, áudio, sincronia e QA
   de ponta a ponta: contador de quadros e timecode, rampa de cinza
   (banding), barras de cor (conversão bt709), barra varrendo a tela (motion
   blur) e um flash a cada tempo com bipe na trilha (sincronia).
   120 BPM, 8 s = 4 compassos. Visual propositalmente sem identidade.
   ===================================================================== */
(function () {
  'use strict';
  const { W, H, U } = FZD;
  const { text, kick, rr, fill, circle, clamp } = U;

  const BPM = 120, DURATION = 8;
  const { BT, bar } = U.tempo(BPM);
  const T = { a: bar(1), b: bar(2), c: bar(3) };
  const BEATS = Array.from({ length: DURATION / BT }, (_, i) => i * BT);
  const MONO = 'ui-monospace, "DejaVu Sans Mono", monospace';
  const BARS = ['#BFBFBF', '#BFBF00', '#00BFBF', '#00BF00', '#BF00BF', '#BF0000', '#0000BF'];

  FZD.define({
    id: '_calibracao',
    duration: DURATION,
    bpm: BPM,
    sections: T,
    blur: { default: [8, 1 / 120] },

    frame(ctx, t) {
      ctx.fillStyle = '#2B2B2B'; ctx.fillRect(0, 0, W, H);
      // barras de cor
      BARS.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * W / 7, 260, Math.ceil(W / 7), 220); });
      // rampa de cinza
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#000'); g.addColorStop(1, '#FFF');
      ctx.fillStyle = g; ctx.fillRect(0, 500, W, 120);
      // barra varrendo a tela (1 ida e volta por compasso): teste de motion blur
      const ph = (t / bar(2)) % 1, x = (ph < 0.5 ? ph * 2 : 2 - ph * 2) * (W - 60);
      ctx.fillStyle = '#F2F2F2'; ctx.fillRect(x, 660, 60, 220);
      // flash por tempo: disco (bipe) e tela inteira no 1º tempo do compasso (golpe)
      let k = 0, kd = 0;
      for (const b of BEATS) { k = Math.max(k, kick(t, b, 0.18)); if (Math.round(b / BT) % 4 === 0) kd = Math.max(kd, kick(t, b, 0.22)); }
      circle(ctx, W / 2, 1180, 120 + 40 * k); fill(ctx, `rgba(242,242,242,${0.15 + 0.85 * k})`);
      if (kd > 0.01) { ctx.fillStyle = `rgba(255,255,255,${0.75 * kd})`; ctx.fillRect(0, 0, W, H); }
      // contadores (quantizados ao quadro, para o motion blur não misturar os dígitos)
      const f = Math.round(t * 60), tf = f / 60;
      const beat = Math.floor(tf / BT + 1e-6);
      text(ctx, `${tf.toFixed(3)} s`, W / 2, 1480, { fam: MONO, size: 84, weight: 700, color: '#F2F2F2', align: 'center' });
      text(ctx, `quadro ${String(f).padStart(3, '0')} · compasso ${Math.floor(beat / 4) + 1} · tempo ${(beat % 4) + 1}`, W / 2, 1545,
        { fam: MONO, size: 30, weight: 500, color: '#A0A0A0', align: 'center' });
      // progresso
      rr(ctx, 90, 1420 - 380, 900, 10, 5); fill(ctx, '#444');
      rr(ctx, 90, 1420 - 380, 900 * clamp(t / DURATION), 10, 5); fill(ctx, '#F2F2F2');
      text(ctx, 'CALIBRAÇÃO · 1080×1920 · 60 FPS', W / 2, 960, { fam: MONO, size: 30, weight: 700, color: '#A0A0A0', align: 'center', ls: 3 });
    },

    cover(ctx) {
      this.frame(ctx, 0.9);
      text(ctx, 'CAPA DE TESTE', W / 2, 1720, { fam: MONO, size: 48, weight: 700, color: '#F2F2F2', align: 'center', ls: 4 });
    },

    cues(api) {
      BEATS.forEach((b, i) => api.cue(b, i % 4 === 0 ? 'hit' : 'beep', { i }));
    },
  });
})();
