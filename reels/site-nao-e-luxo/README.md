# FAZLO Digital — site-nao-e-luxo · Site não é luxo

**Status: em produção.** Roteiro técnico aprovado; cenas 1–3 (mecânica do LUXO) em teste — `output/revisao/teste-mecanica-luxo.jpg`. Cenas 4–6, capa e trilha a seguir.

**Formato:** 9:16 (1080×1920), 60 fps, H.264 + AAC 48 kHz, áudio em −14 LUFS · capa 1080×1920.

| Entrega | Arquivo |
|---|---|
| Vídeo | `output/fazlo-digital-site-nao-e-luxo.mp4` |
| Capa | `output/capa.png` |
| Storyboard | `output/storyboard.jpg` |
| Revisão | `output/revisao/` |

## Arquivos

```
reels/site-nao-e-luxo/
  reel.json            # metadados, saídas, fontes/assets a carregar, parâmetros de QA e storyboard
  src/anim.js          # animação (FZD.define): frame, capa, cues de som
  src/assets/          # imagens específicas deste Reel
  scripts/audio.py     # trilha + efeitos a partir de audio/cues.json
  audio/               # cues.json + trilha.wav (gerados)
  output/              # vídeo, capa, storyboard, revisão (gerados)
```

## Comandos (na raiz do repositório)

```bash
npm run dev                          # preview: http://127.0.0.1:5173/core/player.html?reel=site-nao-e-luxo
npm run build -- site-nao-e-luxo              # cues -> áudio -> vídeo -> capa -> storyboard -> QA
npm run preview -- site-nao-e-luxo            # MP4 rápido (30 fps) para revisão
npm run stills -- site-nao-e-luxo 1.5,8.0     # quadros avulsos em PNG
```
