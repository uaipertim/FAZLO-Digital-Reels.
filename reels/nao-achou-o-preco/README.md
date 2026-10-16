# FAZLO Digital — "Não achou o preço" · série "Pelos olhos do hóspede"

**Status: versão com voz · aguardando aprovação (16/10). Postar em 17/10, às 17h. (A versão curta sem voz foi aprovada em 16/10.)**

1º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), agora **com voz**. Esta pasta é gerada por `npm run episodio -- nao-achou-o-preco` a partir do roteiro [`episodios/nao-achou-o-preco.json`](../../series/pelos-olhos-do-hospede/episodios/nao-achou-o-preco.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo. Só as falas que mudaram são geradas outra vez.

Texto na tela (acompanha a voz; correções de 16/10):
- **Título-dor:** "Ele achou sua pousada. / *Mas não achou o preço.*" (tela e voz)
- **Cards:** "No perfil · Fotos da piscina, do café e da vista." → "E a diária? Nenhum valor à vista." → "Perguntar no direct… e esperar."
- **Carimbo:** "Foi ver outra"
- **Virada:** "Um valor de referência, / um simples *“a partir de”* / *responde antes da pergunta.*". As palavras lima entram quando a voz as diz: "“A PARTIR DE”" em 18,2 s, junto com a fala "a partir de".
- **Fecho:** "Manda pra aquela pousada que só passa o preço pelo direct." (tela e voz) + logo FAZLO DIGITAL
- **"direct":** fica com a grafia "direct", a escolhida entre as amostras de 16/10 ("dairécti", "dairéct", "dirécti" e "direct").

## Voz (25,8 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 18,98 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Ele achou sua pousada. Mas não achou o preço." | 0,00 s | 2,45 s |
| card1 | "Viu as fotos da piscina, do café, da vista." | 3,50 s | 2,64 s |
| card2 | "E a diária?" + "Nenhum valor à vista." (partes geradas separadas, para a pergunta subir) | 6,93 s | 2,15 s |
| card3 | "Aí ele pergunta no direct… e espera." | 9,89 s | 1,93 s |
| carimbo | "Enquanto isso, foi ver outra." | 12,72 s | 1,84 s |
| virada | "Um valor de referência, um simples 'a partir de', responde antes da pergunta." | 15,81 s | 5,29 s |
| fecho | "Manda pra aquela pousada que só passa o preço pelo direct." | 21,85 s | 2,67 s |

| | |
|---|---|
| **Voz** | Raquel - For Conversational (`GDzHdQOi6jjf8zaXhCYD`), a voz oficial da FAZLO |
| **Modelo** | `eleven_multilingual_v2`, `language_code: pt` |
| **Ajustes** | estabilidade 0,40 · semelhança 0,80 · estilo 0,35 · speaker boost · velocidade 1,0 (nada acelerado) · semente 2026 |
| **Contexto** | uma chamada por cena, com as falas vizinhas como contexto (`previous_text` / `next_text`) |
| **Formato** | MP3 44,1 kHz 128 kbps (plano Starter) + alinhamento por caractere |
| **Chave** | não está no repositório: no ambiente de nuvem fica nos Segredos de rede (o proxy injeta `xi-api-key`); fora dele, `ELEVENLABS_API_KEY` |

## Entregas

| Entrega | Arquivo |
|---|---|
| **Vídeo com voz** (25,8 s,0 s,2 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-nao-achou-o-preco.mp4`](output/fazlo-digital-nao-achou-o-preco.mp4) |
| Versão curta sem voz (a anterior, só efeitos em −16 LUFS) | [`output/fazlo-digital-nao-achou-o-preco-curto.mp4`](output/fazlo-digital-nao-achou-o-preco-curto.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **25,8 s**, H.264 + AAC 48 kHz;
- **−13,9 LUFS** e pico real **−3,1 dBTP**;
- sem trechos pretos nem imagem congelada;
- os 4 efeitos-chave (toques dos cards e carimbo) no instante do evento, com desvio máximo de 5,8 ms;
- áreas seguras aprovadas elemento a elemento;
- a batida lima do título cai em 1,40 s, no "Mas" da fala;
- a pergunta "E a diária?" sobe 18% na tônica final;
- a logo FAZLO DIGITAL se monta durante "Manda pra aquela pousada…" (a partir de 22,25 s) e fica **2,4 s** pronta na tela antes do fade (mínimo pedido: 1,2 s).
