# FAZLO Digital — "Ele viu a piscina" · série "Pelos olhos do hóspede"

**Status: com voz · aguardando aprovação. Posta ter 20/10, às 9h30.**

4º episódio da série [`Pelos olhos do hóspede`](../../series/pelos-olhos-do-hospede), com voz. Pasta gerada por `npm run episodio -- viu-a-piscina` a partir do roteiro [`episodios/viu-a-piscina.json`](../../series/pelos-olhos-do-hospede/episodios/viu-a-piscina.json). Para mudar o texto da tela ou uma fala, edite o roteiro e rode o comando de novo.

Texto na tela (acompanha a voz):
- **Título-dor:** "Ele viu a piscina. / *Mas não viu o quarto.*"
- **Cards:** "No perfil · Piscina, café e pôr do sol." (voz: "No perfil: piscina, café e pôr do sol.") → "E a cama? E o banheiro?" → "Foto do quarto? Só pedindo no direct."
- **Carimbo:** "Ficou na dúvida" (voz: "E na dúvida… ele não reservou.")
- **Virada:** "Fotos de cada quarto / *mostram onde ele vai dormir.*" (voz: "No site, fotos de cada quarto mostram onde ele vai dormir, antes da pergunta.")
- **Fecho:** "Manda pra pousada que só posta a piscina." + logo FAZLO DIGITAL

## Voz (25 s)

A voz manda no tempo: cada cena dura a sua fala mais um respiro, e a fala do título começa no quadro 0. As falas somam 16,14 s.

| Cena | Fala | Entra em | Dura |
|---|---|---|---|
| titulo | "Ele viu a piscina." + "Mas não viu o quarto." | 0,00 s | 2,17 s |
| card1 | "No perfil: piscina, café e pôr do sol." | 3,22 s | 2,16 s |
| card2 | "E a cama?" + "E o banheiro?" | 6,59 s | 1,56 s |
| card3 | "Foto do quarto?" + "Só pedindo no direct." | 9,36 s | 2,15 s |
| carimbo | "E na dúvida… ele não reservou." | 12,83 s | 2,19 s |
| virada | "No site, fotos de cada quarto mostram onde ele vai dormir, antes da pergunta." | 16,68 s | 4,12 s |
| fecho | "Manda pra pousada que só posta a piscina." | 21,96 s | 1,79 s |

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
| **Vídeo com voz** (25 s, 60 fps, −14 LUFS) | [`output/fazlo-digital-viu-a-piscina.mp4`](output/fazlo-digital-viu-a-piscina.mp4) |
| Capa | [`output/capa.png`](output/capa.png) |
| Storyboard | [`output/storyboard.jpg`](output/storyboard.jpg) |
| Revisão técnica e de sincronia | [`output/revisao/`](output/revisao) |
| Áreas seguras, elemento a elemento | [`output/revisao/areas-seguras.txt`](output/revisao/areas-seguras.txt) |
| Falas (MP3 + alinhamento) e durações | [`audio/voz/`](audio/voz) |

## Revisão (aprovada)

- 1080×1920, 60 fps, **25,0 s**, H.264 + AAC 48 kHz;
- **−14,0 LUFS** e pico real **−3,3 dBTP**. Na 1ª versão o pico do MP4 era −1,3 dBTP: a batida do título tinha um estalo agudo que passava 3 dB no AAC. Na versão com voz, essa batida ficou mais suave;
- sem trechos pretos nem imagem congelada;
- os 4 efeitos-chave no instante do evento, com desvio máximo de 5,3 ms;
- áreas seguras aprovadas elemento a elemento;
- as perguntas dos cards sobem na tônica final: "E a cama?" +56%, "E o banheiro?" +46%, "Foto do quarto?" +29% (cada pergunta numa chamada);
- a logo se monta durante o fecho e fica **1,5 s** pronta na tela antes do fade (mínimo: 1,2 s).
