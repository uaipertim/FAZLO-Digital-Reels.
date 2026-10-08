# FAZLO Digital — reel-01 · A definir

**Status: aguardando briefing.** Conceito, roteiro, direção de arte e trilha ainda não definidos.

**Formato:** 9:16 (1080×1920), 60 fps, H.264 + AAC 48 kHz, áudio em −14 LUFS · capa 1080×1920.

| Entrega | Arquivo |
|---|---|
| Vídeo | `output/fazlo-digital-reel-01.mp4` |
| Capa | `output/capa.png` |
| Storyboard | `output/storyboard.jpg` |
| Revisão | `output/revisao/` |

## Arquivos

```
reels/reel-01/
  reel.json            # metadados, saídas, fontes/assets a carregar, parâmetros de QA e storyboard
  src/anim.js          # animação (FZD.define): frame, capa, cues de som
  src/assets/          # imagens específicas deste Reel
  scripts/audio.py     # trilha + efeitos a partir de audio/cues.json
  audio/               # cues.json + trilha.wav (gerados)
  output/              # vídeo, capa, storyboard, revisão (gerados)
```

## Comandos (na raiz do repositório)

```bash
npm run dev                          # preview: http://127.0.0.1:5173/core/player.html?reel=reel-01
npm run build -- reel-01              # cues -> áudio -> vídeo -> capa -> storyboard -> QA
npm run preview -- reel-01            # MP4 rápido (30 fps) para revisão
npm run stills -- reel-01 1.5,8.0     # quadros avulsos em PNG
```
