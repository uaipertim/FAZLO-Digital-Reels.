/* Ícones das capas de destaques: traço linear (outline) de espessura uniforme, pontas e cantos
   arredondados, a mesma linguagem do icon() dos Reels.

   Grade de 100 unidades centrada em (0, 0). Todos os ícones usam a MESMA escala e o MESMO traço
   (destaques.json: icone.escala, icone.traco), então a espessura é igual nas 4 capas.
   Pontos (os três pontinhos, os botões da janela) são círculos cheios. */
const ICONES = {
  // janela de navegador: moldura, barra de cima (com os 3 botões) e um bloco de conteúdo
  navegador: `
    <rect x="-50" y="-40" width="100" height="80" rx="12"/>
    <line x1="-50" y1="-16" x2="50" y2="-16"/>
    <g class="cheio"><circle cx="-36" cy="-28" r="4.5"/><circle cx="-24" cy="-28" r="4.5"/><circle cx="-12" cy="-28" r="4.5"/></g>
    <rect x="-34" y="0" width="68" height="24" rx="6"/>`,

  // ficha atravessada por uma linha de scan horizontal (a linha passa das bordas)
  'ficha-scan': `
    <rect x="-36" y="-50" width="72" height="100" rx="10"/>
    <line x1="-20" y1="-32" x2="20" y2="-32"/>
    <line x1="-20" y1="-18" x2="6" y2="-18"/>
    <line x1="-20" y1="22" x2="20" y2="22"/>
    <line x1="-20" y1="36" x2="2" y2="36"/>
    <line x1="-52" y1="2" x2="52" y2="2"/>`,

  // calendário com um check (ícone FAZLO, não a logo do Hospeda)
  'calendario-check': `
    <rect x="-46" y="-38" width="92" height="84" rx="12"/>
    <line x1="-46" y1="-14" x2="46" y2="-14"/>
    <line x1="-22" y1="-50" x2="-22" y2="-28"/>
    <line x1="22" y1="-50" x2="22" y2="-28"/>
    <polyline points="-20,16 -6,30 22,2"/>`,

  // celular com um check na tela (os sites que a FAZLO fez); o mesmo traço das outras capas
  'celular-check': `
    <rect x="-30" y="-50" width="60" height="100" rx="12"/>
    <line x1="-10" y1="-40" x2="10" y2="-40"/>
    <polyline points="-14,4 -3,15 16,-6"/>`,

  // balão de conversa genérico (sem logo de app) com três pontinhos
  balao: `
    <path d="M -12 28 L 32 28 A 18 18 0 0 0 50 10 L 50 -22 A 18 18 0 0 0 32 -40 L -32 -40
             A 18 18 0 0 0 -50 -22 L -50 10 A 18 18 0 0 0 -32 28 L -36 46 Z"/>
    <g class="cheio"><circle cx="-22" cy="-6" r="6"/><circle cx="0" cy="-6" r="6"/><circle cx="22" cy="-6" r="6"/></g>`,
};

module.exports = { ICONES };
