# FAZLO Digital — Reel collab "A pousada pediu. A gente fez."

**Collab @fazlodigital + @pousadaguardiaodaserra.** Posta **qui 29/10, às 17h**. **Status: concluído · revisão aprovada · em avaliação.**

Os 4 pedidos da Pousada Guardião da Serra e a tela **real** do site no ar (pousadaguardiaodaserra.com.br) resolvendo cada um. Feito com o motor da [Série Explica](../../series/explica) no modo collab (`"progresso": "pedidos"`), com a identidade da FAZLO Digital e todas as regras do formato.

| | |
|---|---|
| **Vídeo** | [`output/fazlo-digital-case-guardiao-da-serra.mp4`](output/fazlo-digital-case-guardiao-da-serra.mp4): 1080×1920, 60 fps, **54,9 s** |
| **Capa** | [`output/capa.png`](output/capa.png): o quadro 0, ilustrada (cachoeira em traço lima com o balão "O pedido ✓"), no recorte 3:4 |
| **Storyboard** | [`output/storyboard.jpg`](output/storyboard.jpg) + [`output/progresso.jpg`](output/progresso.jpg) (a lista dos pedidos funcionando) |
| **Revisão** | [`output/revisao/relatorio-tecnico.txt`](output/revisao/relatorio-tecnico.txt): **aprovado** · −14,1 LUFS · pico −1,8 dBTP |
| **Roteiro** | [`../../series/explica/episodios/case-guardiao-da-serra.json`](../../series/explica/episodios/case-guardiao-da-serra.json) |
| **Narração** | [`../../series/explica/audio/case-guardiao-da-serra/voz/`](../../series/explica/audio/case-guardiao-da-serra/voz) (uma geração inteira por capítulo, com o histórico em `falas.json`) |

![storyboard](output/storyboard.jpg)

## Capítulos

| Cap | Tempo | Tela | Fala |
|---|---|---|---|
| 0 · capa | 0,0–4,3 s | capa ilustrada + selo "A POUSADA PEDIU. A GENTE FEZ." + selo "COLLAB · GUARDIÃO DA SERRA"; a lista dos 4 pedidos aparece vazia e vai para o canto | "Três cachoeiras dentro da pousada. Como mostrar isso num site?" (a pergunta sobe +44% no final) |
| 01 | 4,3–11,4 s | "Quem chega precisa saber das cachoeiras." → o topo do site: "Pousada com cachoeiras na Serra da Canastra" e o slide "3 cachoeiras dentro da propriedade." | "O primeiro pedido: quem chega precisa saber das cachoeiras… Então elas abrem o site, logo no topo." |
| 02 | 11,4–21,5 s | "O pôr do sol com vinho e queijo canastra é uma experiência, não um item." → a seção do pôr do sol, com o chip "Incluso na hospedagem" realçado | "O segundo: o pôr do sol com vinho e queijo canastra é uma experiência, não um item de lista. Ganhou uma seção só dele, e está incluso." |
| 03 | 21,5–30,3 s | "As fotos precisam aparecer grandes." → a seção das cachoeiras rola, um toque na Cachoeira do Oratório e ela abre na tela inteira | "O terceiro: as fotos precisam aparecer grandes. Um toque, e a foto abre na tela inteira." |
| 04 | 30,3–44,3 s | "O hóspede escolhe o chalé e já fala com a gente." → datas → card da Vila Pequi em destaque → Pôr do Sol 03 escolhido → a mensagem que o site monta, num balão de conversa genérico | "E o quarto: o hóspede escolhe o chalé e já fala com a pousada. Escolhe as datas, os chalés da Vila Pequi, e a consulta chega pronta no WhatsApp." |
| fecho | 44,3–54,9 s | "A pousada pediu. / A gente fez.", a lista com os 4 ✓, "Site por Fazlo Digital" em lima, "pra Pousada Guardião da Serra" em branco e o site; nos últimos 3 s, só a logo | "A pousada pediu. A gente fez. Site por Fazlo Digital… pra Pousada Guardião da Serra." (respiro de 0,52 s antes de "pra"; ênfase: a voz fica 14% mais alta em "Site por Fazlo Digital") |

**Pontuação ajustada (as palavras são as do roteiro):** no pedido 1, "cachoeiras." virou "cachoeiras…". Em 12 sementes com o ponto, a voz emendava "cachoeiras. Então" (50 ms de silêncio); com as reticências, o respiro ficou em 0,34 s na primeira geração.

## As telas reais

`node reels/case-guardiao-da-serra/captura.cjs` abre o site no ar no Chromium (390 px de largura, 3×, com toque) e grava os quadros em [`telas/`](telas) ([prévia](telas/previa.jpg)), com as caixas do que o vídeo realça e a mensagem que o site monta em `telas.json`. Antes de capturar, ela confere que o site mostra 3 cachoeiras, nenhuma "Grinalda", nenhum "4 cachoeiras" e nenhum "[confirmar]", e que o chip "Incluso na hospedagem" está na seção do pôr do sol; se algo falhar, ela para.

- Todo número de telefone é desfocado. O campo "Telefone" da consulta fica vazio, e a mensagem sai com "Nome: -" e "Telefone: -".
- Os botões só com o ícone do WhatsApp ficam ocultos; nos botões com texto ("Enviar pelo WhatsApp"), só o ícone some. Nenhum logo de app no vídeo.
- O celular é genérico, sem marca. Nada fora do site real: as telas são quadros do site, sem retoque.

As amostras de voz aprovadas estão em [`amostras/`](amostras) (o fecho é a versão nova, com o respiro).

## Refazer

```bash
node reels/case-guardiao-da-serra/captura.cjs                 # as telas (só se o site mudar)
series/explica/scripts/episodio.sh case-guardiao-da-serra     # do roteiro ao vídeo revisado (a narração já está gerada)
```
