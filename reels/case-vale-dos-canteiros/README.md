# FAZLO Digital — "Conheça o site da Pousada Vale dos Canteiros"

Reel da @fazlodigital (pasta `case-vale-dos-canteiros`). Mesma identidade, motor e trilha dos Reels anteriores. As telas são **capturas reais** do site da Pousada Vale dos Canteiros, com uso autorizado pelo cliente.

**Status: em produção.** Roteiro técnico aprovado (com ajustes). Capturas complementares e checagem dos dados prontas; animação e trilha em andamento.

**Gesto central:** o toque do hóspede. Um círculo lima rola, toca e abre as telas reais do site.

## Capturas e checagem

- **Reaproveitadas** do Reel "Como funciona o raio-x":
  - página inteira no celular (`m-00`..`m-10`) e o mapa (`m-map`);
  - a checagem de dados dele.
  - O script confere que a página atual tem a mesma geometria dessas faixas.
- **Complementares:** `scripts/capture.cjs` → `src/assets/site/`, com celular 390×844 pt em 2x:
  - as 5 fotos do topo;
  - o cabeçalho nos dois estados;
  - cada passo da consulta, com o calendário real do site e a lista de acomodações;
  - o modal do Chalé de Pedra 6;
  - o MENU e o Day Use;
  - a faixa final da página;
  - o rodapé em 4x.
- **Coordenadas:** o `manifest.json` guarda a rolagem de cada tela e a caixa de cada toque.
- **Mensagem:** é a que o site monta no clique em "Enviar consulta pelo WhatsApp" (`mensagem.txt`). O `wa.me` é interceptado: nada é aberto nem enviado, e o número não é guardado.
- **Depoimentos:** a seção "Quem passou por aqui conta melhor" é removida antes de qualquer captura.
- **Checagem:** `src/assets/site/checagem.txt`, com 28 itens OK. Folha de revisão: `output/revisao/capturas.jpg` (`scripts/capturas_folha.py`).

**Formato:** 9:16 (1080×1920), 60 fps, H.264 + AAC 48 kHz, áudio em −14 LUFS · capa 1080×1920.

| Entrega | Arquivo |
|---|---|
| Vídeo | `output/fazlo-digital-case-vale-dos-canteiros.mp4` |
| Capa | `output/capa.png` |
| Storyboard | `output/storyboard.jpg` |
| Revisão | `output/revisao/` |

## Arquivos

```
reels/case-vale-dos-canteiros/
  reel.json            # metadados, saídas, fontes/assets a carregar, parâmetros de QA e storyboard
  src/anim.js          # animação (FZD.define): frame, capa, cues de som
  src/assets/          # imagens específicas deste Reel
  scripts/audio.py     # trilha + efeitos a partir de audio/cues.json
  audio/               # cues.json + trilha.wav (gerados)
  output/              # vídeo, capa, storyboard, revisão (gerados)
```

## Comandos (na raiz do repositório)

```bash
npm run dev                          # preview: http://127.0.0.1:5173/core/player.html?reel=case-vale-dos-canteiros
npm run build -- case-vale-dos-canteiros              # cues -> áudio -> vídeo -> capa -> storyboard -> QA
npm run preview -- case-vale-dos-canteiros            # MP4 rápido (30 fps) para revisão
npm run stills -- case-vale-dos-canteiros 1.5,8.0     # quadros avulsos em PNG
```
