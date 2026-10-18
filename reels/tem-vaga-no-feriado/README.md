# FAZLO Digital — "Tem vaga no feriado?" · série "Pelos olhos do hóspede"

**Status: com voz · aguardando aprovação. Posta seg 19/10, às 9h30.**

3º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), com voz. Pasta gerada por `npm run episodio -- tem-vaga-no-feriado` a partir do roteiro [`episodios/tem-vaga-no-feriado.json`](../../series/pelos-olhos-do-hospede/episodios/tem-vaga-no-feriado.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo.

Texto na tela (acompanha a voz):
- **Título-dor:** "Tem vaga no feriado? / *Ele perguntou em três lugares.*" (a pergunta e a frase em chamadas separadas)
- **Cards:** "No direct · Tem vaga de sexta a domingo?" (voz: "No direct: tem vaga de sexta a domingo?") → "No WhatsApp, a mesma pergunta." → "E nos comentários do post."
- **Carimbo:** "Reservou na outra" (voz: "Quem respondeu primeiro… levou a reserva.")
- **Virada:** "Consulta de datas no site: / *ele escolhe as datas* / *e a pergunta chega pronta.*" (voz: "Com a consulta de datas no site, ele escolhe entrada e saída, e a pergunta chega pronta no seu WhatsApp.")
- **Fecho:** "Manda pra pousada que perde reserva no feriado." + logo FAZLO DIGITAL

## Voz (26,6 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 19,83 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Tem vaga no feriado?" + "Ele perguntou em três lugares." | 0,00 s | 2,64 s |
| card1 | "No direct: tem vaga de sexta a domingo?" | 3,69 s | 2,15 s |
| card2 | "No WhatsApp, a mesma pergunta." | 6,64 s | 1,50 s |
| card3 | "E nos comentários do post." | 8,94 s | 1,41 s |
| carimbo | "Quem respondeu primeiro… levou a reserva." | 11,25 s | 2,89 s |
| virada | "Com a consulta de datas no site, ele escolhe entrada e saída, e a pergunta chega pronta no seu WhatsApp." | 15,39 s | 6,95 s |
| fecho | "Manda pra pousada que perde reserva no feriado." | 23,09 s | 2,29 s |

| | |
|---|---|
| **Voz** | Raquel - For Conversational (`GDzHdQOi6jjf8zaXhCYD`), a voz oficial da FAZLO |
| **Modelo** | `eleven_multilingual_v2`, `language_code: pt` |
| **Ajustes** | estabilidade 0,40 · semelhança 0,80 · estilo 0,35 · speaker boost · velocidade 1,0 (nada acelerado) · semente 2026 (outras só para a pergunta subir) |
| **Contexto** | uma chamada por cena (ou por parte, nas perguntas), com as falas vizinhas como contexto (`previous_text` / `next_text`) |
| **Formato** | MP3 44,1 kHz 128 kbps (plano Starter) + alinhamento por caractere |
| **Chave** | não está no repositório: no ambiente de nuvem fica nos Segredos de rede (o proxy injeta `xi-api-key`); fora dele, `ELEVENLABS_API_KEY` |

## Entregas

| Entrega | Arquivo |
|---|---|
| **Vídeo com voz** (26,6 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-tem-vaga-no-feriado.mp4`](output/fazlo-digital-tem-vaga-no-feriado.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **26,6 s**, H.264 + AAC 48 kHz;
- **−14,0 LUFS** e pico real **−3,2 dBTP**;
- sem trechos pretos nem imagem congelada;
- os 4 efeitos-chave no instante do evento, com desvio máximo de 5,8 ms;
- áreas seguras aprovadas elemento a elemento;
- as perguntas sobem na tônica final, medido no áudio: "Tem vaga no feriado?" +36% e "No direct: tem vaga de sexta a domingo?" +102%;
- a logo se monta durante o fecho e fica **2,0 s** pronta na tela antes do fade (mínimo: 1,2 s).
