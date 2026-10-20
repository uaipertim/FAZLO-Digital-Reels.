# FAZLO Digital — "Aceita pet?" · série "Pelos olhos do hóspede"

**Status: com voz · aguardando aprovação. Posta qui 22/10, às 9h30.**

6º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), com voz. Pasta gerada por `npm run episodio -- aceita-pet` a partir do roteiro [`episodios/aceita-pet.json`](../../series/pelos-olhos-do-hospede/episodios/aceita-pet.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo.

Texto na tela (acompanha a voz):
- **Título-dor:** "Aceita pet? / *Ele não quis arriscar.*" (duas chamadas)
- **Cards:** "Na viagem · O casal, as malas e o cachorro." → "Aceita pet? Tem taxa? Qual porte?" (voz: três perguntas separadas) → "No perfil, nenhuma palavra sobre isso."
- **Carimbo:** "Foi pra outra"
- **Virada:** "Regras de pet no site / *e ele já chega decidido.*"
- **Fecho:** "Manda pra pousada que aceita pet e ninguém sabe." + logo FAZLO DIGITAL

## Voz (25 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 17,73 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Aceita pet?" + "Ele não quis arriscar." | 0,00 s | 1,96 s |
| card1 | "Na viagem vão o casal, as malas… e o cachorro." | 3,01 s | 3,03 s |
| card2 | "Aceita pet?" + "Tem taxa?" + "Qual porte?" | 6,93 s | 2,37 s |
| card3 | "No perfil, nenhuma palavra sobre isso." | 10,20 s | 1,68 s |
| carimbo | "Na dúvida, ele foi para outra pousada." | 12,87 s | 2,01 s |
| virada | "No site, as regras de pet ficam claras, e quem viaja com ele já chega decidido." | 16,22 s | 4,60 s |
| fecho | "Manda pra pousada que aceita pet e ninguém sabe." | 21,66 s | 2,09 s |

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
| **Vídeo com voz** (25 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-aceita-pet.mp4`](output/fazlo-digital-aceita-pet.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **25,0 s**, H.264 + AAC 48 kHz;
- **−14,1 LUFS** e pico real **−3,2 dBTP**;
- sem trechos pretos nem imagem congelada; os 4 efeitos-chave no instante do evento (máximo 4,6 ms);
- áreas seguras e recorte 3:4 da capa aprovados;
- perguntas sobem na tônica final: título +14%, "Aceita pet?" +83%, "Tem taxa?" +21%, "Qual porte?" +20%;
- a logo fica **1,8 s** pronta na tela antes do fade (mínimo: 1,2 s);
- ponto de atenção: em ~6,9 s a cauda do toque do card 2 passa a voz por ~0,1 s (−7,8 dB numa janela de 50 ms).
