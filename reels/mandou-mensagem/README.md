# FAZLO Digital + FAZLO Hospeda (collab) — "Mandou mensagem e ninguém respondeu"

**Status: em produção.** Roteiro técnico aprovado (35,4 s). Cenas 1–5 montadas e em teste ([`output/revisao/teste-cenas-1-a-5.jpg`](output/revisao/teste-cenas-1-a-5.jpg)); faltam o print 06 (calendário depois) e a logo oficial do FAZLO Hospeda para fechar a cena 5, o CTA e a trilha.

> **Exceção da collab:** a FAZLO Digital tem identidade própria e não reutiliza nada do FAZLO Hospeda. Este Reel é a exceção combinada para a collab @fazlodigital + @fazlohospeda: mostra os prints reais do sistema Hospeda e a marca do Hospeda no CTA. Nada foi buscado no repositório do Hospeda.

**Prints do Hospeda:** só os recortes dos prints reais. Os arquivos recebidos não são versionados; [`scripts/prints.py`](scripts/prints.py) grava em `src/assets/hospeda/` só as versões tratadas (telefone do hóspede coberto por barra neutra nos prints 04 e 05; painel só com os cards do topo).

**Formato:** 9:16 (1080×1920), 60 fps, H.264 + AAC 48 kHz, áudio em −14 LUFS · capa 1080×1920.

| Entrega | Arquivo |
|---|---|
| Vídeo | `output/fazlo-digital-mandou-mensagem.mp4` |
| Capa | `output/capa.png` |
| Storyboard | `output/storyboard.jpg` |
| Revisão | `output/revisao/` |

## Arquivos

```
reels/mandou-mensagem/
  reel.json            # metadados, saídas, fontes/assets a carregar, parâmetros de QA e storyboard
  src/anim.js          # animação (FZD.define): frame, capa, cues de som
  src/assets/          # imagens específicas deste Reel
  scripts/audio.py     # trilha + efeitos a partir de audio/cues.json
  audio/               # cues.json + trilha.wav (gerados)
  output/              # vídeo, capa, storyboard, revisão (gerados)
```

## Comandos (na raiz do repositório)

```bash
npm run dev                          # preview: http://127.0.0.1:5173/core/player.html?reel=mandou-mensagem
npm run build -- mandou-mensagem              # cues -> áudio -> vídeo -> capa -> storyboard -> QA
npm run preview -- mandou-mensagem            # MP4 rápido (30 fps) para revisão
npm run stills -- mandou-mensagem 1.5,8.0     # quadros avulsos em PNG
```
