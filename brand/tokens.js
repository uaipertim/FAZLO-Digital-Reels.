/* =====================================================================
   FAZLO Digital — tokens de marca

   Paleta amostrada da logo oficial (brand/logo/fazlo-digital-logo.webp):
   o verde-lima da barra do Z, o branco das letras e um preto profundo
   como palco. Tipografia em brand/fonts/fonts.css.
   ===================================================================== */
window.FZD_BRAND = {
  status: 'oficial',
  color: {
    bg: '#050506',            // palco: preto profundo, levemente frio
    surface: '#0E0F12',       // planos e painéis
    line: '#2A2C31',          // fios e guias
    ink: '#FFFFFF',           // branco das letras da logo
    muted: '#8B8F98',         // apoio
    accent: '#C5FA40',        // verde-lima da barra da logo (amostrado)
    accentHi: '#E4FF9A',      // brilho do lima
    accentLo: '#7FA82A',      // lima na sombra
    // tema claro (folha de marca: logo escura sobre painel claro)
    paper: '#F3F3F3',         // painel claro da folha de marca
    inkDark: '#181918',       // tinta das letras na versão escura da logo
  },
  font: {
    display: "'FZD Display', system-ui, sans-serif",   // Unbounded
    text: "'FZD Text', system-ui, sans-serif",         // Sora
    mono: "ui-monospace, 'DejaVu Sans Mono', monospace",
  },
  logo: 'brand/logo/fazlo-digital-logo.webp',              // mestre: letras brancas (fundos escuros)
  logoDark: 'brand/logo/fazlo-digital-logo-escura.png',    // versão escura (fundos claros), gerada do mestre por tools/logo_variant.py
  // geometria da barra lima do "Z", medida no arquivo oficial (px da imagem 2000x621):
  // lados horizontais em y=92 e y=397; lados inclinados com dx/dy = -0,966 (≈ 46°)
  slash: { top: 92, bottom: 397, tl: 998.6, tr: 1130.7, bl: 702.4, br: 837.7, imgW: 2000, imgH: 621 },
};
