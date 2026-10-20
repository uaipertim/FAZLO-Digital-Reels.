# FAZLO Digital — carrosséis

Peças estáticas do feed da @fazlodigital. Cada carrossel vive numa pasta independente, nomeada pelo título. Usa a mesma identidade, os mesmos utilitários de desenho (`core/engine.js`, `FZD.U`) e a mesma marca (`brand/`) dos Reels.

| Carrossel | Conceito | Slides | Status | Pasta |
|---|---|---|---|---|
| **"O que o hóspede procura antes de reservar"** | As 7 informações que o hóspede procura antes de reservar, cada uma numa mini tela de site no celular. A capa traz a página inteira numerada, e o fechamento um checklist para o dono revisar a própria pousada | 9 × 1080×1350 | concluído · aprovado | [`o-que-o-hospede-procura/`](o-que-o-hospede-procura) |
| **"Por que a consulta de datas vem primeiro"** | O que a FAZLO decide antes de desenhar: a consulta de datas logo abaixo do topo. Slides 04–07 com **capturas reais** do site da Pousada Vale dos Canteiros (calendário do site, a mensagem que chega organizada, os chalés) | 8 × 1080×1350 | concluído · aprovado | [`consulta-de-datas-primeiro/`](consulta-de-datas-primeiro) |
| **"Seu cliente não acha seu horário"** | Para negócios em geral: as 6 informações que todo negócio deixa difíceis de achar, cada uma na mini tela de um negócio diferente (padaria, loja de roupas, clínica, restaurante, pousada, pet shop); valores como barras, e checklist no fechamento | 8 × 1080×1350 | concluído · aprovado | [`seu-cliente-nao-acha-seu-horario/`](seu-cliente-nao-acha-seu-horario) |
| **"Antes de fazer um site: o que separar"** | O que a FAZLO pede ao dono da pousada antes de desenhar qualquer tela: logo, fotos de cada quarto, o que está incluso, regras, como chegar e o WhatsApp que atende; fecha com "o site começa pelo raio-x" | 8 × 1080×1350 | concluído · aprovado | [`antes-de-fazer-um-site/`](antes-de-fazer-um-site) |
| **"O que colocar no link da bio da sua pousada"** | Por que uma lista de 9 botões não resolve e os 4 itens que o link da bio deve ter: consulta de datas, quartos com valor de referência, como chegar e WhatsApp com mensagem pronta; fecha com "um link só: o site da pousada" | 8 × 1080×1350 | concluído · em avaliação | [`link-da-bio/`](link-da-bio) |

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
