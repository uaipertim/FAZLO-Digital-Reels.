# FAZLO Digital — "O café está incluso?" · série "Pelos olhos do hóspede"

**Status: com voz · aguardando aprovação. Posta qua 21/10, às 9h30.**

5º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), com voz. Pasta gerada por `npm run episodio -- cafe-incluso` a partir do roteiro [`episodios/cafe-incluso.json`](../../series/pelos-olhos-do-hospede/episodios/cafe-incluso.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo.

Texto na tela (acompanha a voz):
- **Título-dor:** "O café está incluso? / *Ele perguntou no direct.*" (duas chamadas)
- **Cards:** "No perfil · A foto da mesa de café, linda." → "Está na diária? Até que horas?" (voz: duas perguntas separadas) → "Resposta? Só quando alguém vir."
- **Carimbo:** "Ainda esperando"
- **Virada:** "O que a diária inclui / *fica escrito no site.*"
- **Fecho:** "Manda pra pousada que tem o café mais bonito da região." + logo FAZLO DIGITAL

## Voz (28,3 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 21,48 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "O café está incluso?" + "Ele perguntou no direct." | 0,00 s | 2,45 s |
| card1 | "No perfil, a foto da mesa de café. Linda." | 3,50 s | 2,28 s |
| card2 | "Mas está incluso na diária?" + "Até que horas é servido?" | 6,58 s | 3,30 s |
| card3 | "E a resposta só vem quando alguém vê a mensagem." | 10,68 s | 2,66 s |
| carimbo | "Enquanto isso, ele continua esperando." | 14,24 s | 1,80 s |
| virada | "No site, o que a diária inclui já fica escrito, com horário e tudo, antes da pergunta." | 17,28 s | 6,33 s |
| fecho | "Manda pra pousada que tem o café mais bonito da região." | 24,36 s | 2,66 s |

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
| **Vídeo com voz** (28,3 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-cafe-incluso.mp4`](output/fazlo-digital-cafe-incluso.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **28,3 s**, H.264 + AAC 48 kHz;
- **−14,0 LUFS** e pico real **−3,3 dBTP**;
- sem trechos pretos nem imagem congelada; os 4 efeitos-chave no instante do evento (máximo 4,3 ms);
- áreas seguras e recorte 3:4 da capa aprovados;
- perguntas sobem na tônica final: título +61%, "Mas está incluso na diária?" +26%, "Até que horas é servido?" +73%;
- a logo fica **2,4 s** pronta na tela antes do fade (mínimo: 1,2 s);
- ponto de atenção: em ~6,8 s a cauda do toque do card 2 fica 1,9 dB acima da voz por ~0,3 s.
