# FAZLO Digital — carrosséis

Peças estáticas do feed da @fazlodigital. Cada carrossel vive numa pasta independente, nomeada pelo título. Usa a mesma identidade, os mesmos utilitários de desenho (`core/engine.js`, `FZD.U`) e a mesma marca (`brand/`) dos Reels.

| Carrossel | Conceito | Slides | Status | Pasta |
|---|---|---|---|---|
| **"O que o hóspede procura antes de reservar"** | As 7 informações que o hóspede procura antes de reservar, cada uma numa mini tela de site no celular. A capa traz a página inteira numerada, e o fechamento um checklist para o dono revisar a própria pousada | 9 × 1080×1350 | prévia · aguardando aprovação | [`o-que-o-hospede-procura/`](o-que-o-hospede-procura) |

## Como funciona

- `carrossel.json`: título, status, formato (`width`/`height`), número de slides, fontes a pré-carregar e parâmetros de QA:
  - `qa.margin`: faixa das bordas que deve ficar livre;
  - `qa.bleedBottom`: permite sangrar pelo pé.
- `src/slides.js`: `FZC.define({ id, width, height, setup, slides: [ (ctx, api) => { … }, … ] })` (motor em `core/carousel.js`).
- `npm run carousel -- <pasta>`: renderiza cada slide no Chromium headless (`core/carousel.html?c=<pasta>&render`) em `output/NN.png`, e depois roda `tools/carousel_qa.py`. O QA gera:
  - `output/previa.jpg`;
  - `output/revisao/relatorio.txt`;
  - `output/revisao/tamanho-real.jpg` (largura de celular);
  - `output/revisao/capa-no-perfil.jpg` (recorte 3:4 da grade).

  Ele confere tamanho, opacidade, bordas livres, o canto do contador nativo do Instagram e o recorte 3:4 da capa.
- `npm run dev`: preview interativo em `/core/carousel.html?c=<pasta>`. A tecla `G` mostra as guias: margem, contador nativo e recorte 3:4.
