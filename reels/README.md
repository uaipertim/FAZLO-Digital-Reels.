# FAZLO Digital — série de Reels

Cada Reel vive numa pasta independente (`reel-NN/` ou, a partir de "Instagram não é site", com o nome do título), com conceito, animação, trilha, entregas e revisão próprios. O motor, o render, a síntese de áudio e o QA são compartilhados (`core/` e `tools/`).

| Reel | Conceito | Duração | Status | Pasta |
|---|---|---|---|---|
| **00** | **"Da ideia ao digital."** Apresentação oficial: a barra lima da logo corta, organiza e transforma (ideia → forma → código → sites e experiências digitais) e volta ao seu lugar na logo | 26,8 s | concluído · em avaliação | [`reel-00/`](reel-00) |
| **001** | **"Seu negócio já é bom. Seu digital precisa parecer isso."** A barra vira a fronteira de resolução: o negócio nítido x o digital pixelado; a virada para um estúdio em alta definição (mais forte, profissional, confiável, marcante) e "à altura" | 26,6 s | concluído · em avaliação | [`reel-01/`](reel-01) |
| **002** | **"Muito além de um site."** Zoom infinito sem cortes: a página vira ladrilho, nó, tela e cartão de mundos cada vez maiores (identidade, informações, apresentação, conexão) até a rede inteira caber na barra da logo | 23,0 s | concluído · em avaliação | [`reel-02/`](reel-02) |
| **003** | **"Ideias que ganham forma."** A matéria das ideias: uma substância lima com três estados (líquido, projeto, sólido) que vira IDEIA, estoura, ganha forma em REAL., constrói SITES, flui em EXPERIÊNCIAS, encaixa SOLUÇÕES e vira a logo; renderizada com luz num plano em 3D (WebGL) | 25,7 s | concluído · em avaliação | [`reel-03/`](reel-03) |
| — | **"Instagram não é site."** O hóspede acha a pousada no Instagram e as perguntas ficam paradas no direct. A barra lima vira o celular em site (+ navegador) e cada pergunta encaixa na seção que a responde: período → consultar → reserva. Fecha com "O Instagram atrai. O site responde." Primeiro Reel com o kit oficial (SVG), o lima `#C6FA41` e telas de site como assinatura | 33,6 s | concluído · em avaliação | [`instagram-nao-e-site/`](instagram-nao-e-site) |

Novos Reels: `npm run new-reel -- titulo-do-reel "Título"` (pasta pelo título) ou `npm run new-reel -- 04 "Título"` (pasta `reel-04/`).

[`_calibracao/`](_calibracao) não é um Reel: é a cartela técnica que valida o pipeline (`npm test`).
