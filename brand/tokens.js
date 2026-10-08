/* =====================================================================
   FAZLO Digital — tokens de marca (PROVISÓRIOS)

   Valores neutros só para o motor e os testes técnicos funcionarem.
   Serão substituídos pela identidade oficial da FAZLO Digital (logo,
   paleta, tipografia) quando a direção de arte for definida.
   Nada aqui vem da identidade do FAZLO Hospeda.
   ===================================================================== */
window.FZD_BRAND = {
  status: 'provisorio',
  color: {
    bg: '#101010',
    surface: '#1C1C1C',
    ink: '#F4F4F4',
    muted: '#8A8A8A',
    accent: '#FFFFFF',        // a definir com a direção de arte
  },
  font: {
    // famílias declaradas em brand/fonts/fonts.css; enquanto não houver
    // fontes oficiais, o navegador usa as genéricas do sistema
    display: "'FZD Display', system-ui, sans-serif",
    text: "'FZD Text', system-ui, sans-serif",
    mono: "'FZD Mono', ui-monospace, monospace",
  },
  logo: null,                 // ex.: 'brand/logo/fazlo-digital-logo-alpha.png'
};
