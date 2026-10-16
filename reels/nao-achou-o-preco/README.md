# FAZLO Digital — "Não achou o preço" · série "Pelos olhos do hóspede"

**Status: versão com voz · aguardando aprovação (16/10). Postar em 17/10, às 17h. (A versão curta sem voz foi aprovada em 16/10.)**

1º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), agora **com voz**. Esta pasta é gerada por `npm run episodio -- nao-achou-o-preco` a partir do roteiro [`episodios/nao-achou-o-preco.json`](../../series/pelos-olhos-do-hospede/episodios/nao-achou-o-preco.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo. Só as falas que mudaram são geradas outra vez.

Texto na tela (igual ao da versão curta):
- **Título-dor:** "Ele achou sua pousada. / Não achou o preço."
- **Cards:** "No perfil · Fotos da piscina, do café e da vista." → "E a diária? Nenhum valor à vista." → "Perguntar no direct… e esperar."
- **Carimbo:** "Foi ver outra"
- **Virada:** "Um valor de referência *responde antes da pergunta.*"
- **Fecho:** "Manda pra quem só passa o preço no direct." + logo FAZLO DIGITAL

## Voz (25,2 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 18,20 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Ele achou sua pousada… mas não achou o preço." | 0,00 s | 2,81 s |
| card1 | "Viu as fotos da piscina, do café, da vista." | 3,86 s | 2,46 s |
| card2 | "E a diária? Nenhum valor à vista." | 7,11 s | 2,09 s |
| card3 | "Aí ele pergunta no direct… e espera." | 10,00 s | 1,93 s |
| carimbo | "Enquanto isso, foi ver outra." | 12,84 s | 1,84 s |
| virada | "Um valor de referência, um simples 'a partir de', responde antes da pergunta." | 15,92 s | 5,23 s |
| fecho | "Manda pra quem só passa o preço no direct." | 21,90 s | 1,85 s |

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
| **Vídeo com voz** (25,2 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-nao-achou-o-preco.mp4`](output/fazlo-digital-nao-achou-o-preco.mp4) |
| Versão curta sem voz (a anterior, só efeitos em −16 LUFS) | [`output/fazlo-digital-nao-achou-o-preco-curto.mp4`](output/fazlo-digital-nao-achou-o-preco-curto.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **25,2 s**, H.264 + AAC 48 kHz;
- **−14,0 LUFS** e pico real **−1,8 dBTP**;
- sem trechos pretos nem imagem congelada;
- os 4 efeitos-chave (toques dos cards e carimbo) no instante do evento, com desvio máximo de 7,8 ms;
- áreas seguras aprovadas elemento a elemento;
- a batida lima do título cai em 1,92 s, no "não" da fala.
