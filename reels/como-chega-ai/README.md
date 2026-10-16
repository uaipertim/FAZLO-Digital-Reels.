# FAZLO Digital — "Como chega aí" · série "Pelos olhos do hóspede"

**Status: versão com voz · em avaliação. Previsto para 18/10, às 9h30.****

2º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), agora **com voz**. Esta pasta é gerada por `npm run episodio -- como-chega-ai` a partir do roteiro [`episodios/como-chega-ai.json`](../../series/pelos-olhos-do-hospede/episodios/como-chega-ai.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo. Só as falas que mudaram são geradas outra vez.

Texto na tela (igual ao da versão curta):
- **Título-dor:** "Como chega aí? / Ele perguntou de novo."
- **Cards:** "No direct · Como chega aí? A estrada é boa?" → "Mandaram o pin. Sem o caminho." → "E a cachoeira? Fica longe?"
- **Carimbo:** "Ainda sem resposta"
- **Virada:** "Mapa e distância dos passeios *no site, antes da pergunta.*"
- **Fecho:** "Manda pra quem explica o caminho toda vez pelo direct." + logo FAZLO DIGITAL

## Voz (25,0 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 16,54 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Como chega aí? Ele perguntou de novo." | 0,00 s | 1,63 s |
| card1 | "No direct: como chega aí? A estrada é boa?" | 2,68 s | 2,11 s |
| card2 | "Mandaram o pin… sem o caminho." | 5,92 s | 2,23 s |
| card3 | "E a cachoeira? Fica longe?" | 9,27 s | 1,18 s |
| carimbo | "E a pergunta continua sem resposta." | 11,68 s | 2,11 s |
| virada | "Mapa, caminho e a distância dos passeios: no site, antes da pergunta." | 15,37 s | 4,80 s |
| fecho | "Manda pra quem explica o caminho toda vez pelo direct." | 21,25 s | 2,50 s |

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
| **Vídeo com voz** (25,0 s,0 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-como-chega-ai.mp4`](output/fazlo-digital-como-chega-ai.mp4) |
| Versão curta sem voz (a anterior, só efeitos em −16 LUFS) | [`output/fazlo-digital-como-chega-ai-curto.mp4`](output/fazlo-digital-como-chega-ai-curto.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **25,0 s**, H.264 + AAC 48 kHz;
- **−14,0 LUFS** e pico real **−3,3 dBTP**;
- sem trechos pretos nem imagem congelada;
- os 4 efeitos-chave no instante do evento, com desvio máximo de 4,8 ms;
- áreas seguras aprovadas elemento a elemento;
- a logo FAZLO DIGITAL se monta durante "Manda pra quem…" e fica **2,2 s** pronta na tela antes do fade (mínimo pedido: 1,2 s);
- a batida lima do título cai em 0,65 s, no "Ele" da fala.
