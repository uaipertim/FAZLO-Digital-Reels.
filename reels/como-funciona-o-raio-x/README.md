# FAZLO Digital — "Como funciona o raio-x"

**Status: em produção.** Roteiro técnico e timeline aprovados (cerca de 36,6 s). As capturas reais e a checagem dos dados estão feitas; a animação e a trilha vêm em seguida.

**Telas reais** de https://pousadavaledoscanteiros.com.br (uso autorizado pelo cliente), capturadas por [`scripts/capture.cjs`](scripts/capture.cjs) em [`src/assets/site/`](src/assets/site):

- **Celular:** 390 pt em 2x, página inteira em faixas.
- **Desktop:** 1440 px, página inteira em faixas.
- **Telas abertas:** o modal "Ver detalhes" do 1º chalé e o modal do Day Use.
- **`manifest.json`:** guarda a posição de cada seção, usada para rolar a tela e acender a seção certa.
- **Depoimentos:** a seção "Quem passou por aqui conta melhor" é **removida da página antes de capturar**. Ela não aparece em nenhuma imagem.
- **Dados:** cada dado do roteiro foi conferido no site ao vivo, com o trecho onde aparece, em [`checagem.txt`](src/assets/site/checagem.txt).
- **Mapa de "Onde estamos" (Google Maps):** a captura de página inteira não desenha iframes de outro domínio, então o mapa é capturado à parte, na área visível (`m-map.jpg`, `d-map.jpg`). O Reel o sobrepõe na posição do iframe.
- **Visão geral:** [`output/revisao/capturas.jpg`](output/revisao/capturas.jpg).

**Formato:** 9:16 (1080×1920), 60 fps, H.264 + AAC 48 kHz, áudio em −14 LUFS · capa 1080×1920.

| Entrega | Arquivo |
|---|---|
| Vídeo | `output/fazlo-digital-como-funciona-o-raio-x.mp4` |
| Capa | `output/capa.png` |
| Storyboard | `output/storyboard.jpg` |
| Revisão | `output/revisao/` |

## Arquivos

```
reels/como-funciona-o-raio-x/
  reel.json            # metadados, saídas, fontes/assets a carregar, parâmetros de QA e storyboard
  src/anim.js          # animação (FZD.define): frame, capa, cues de som
  src/assets/site/     # capturas reais do site, manifest.json (seções) e checagem.txt
  scripts/capture.cjs  # captura do site ao vivo + checagem dos dados
  scripts/audio.py     # trilha + efeitos a partir de audio/cues.json
  audio/               # cues.json + trilha.wav (gerados)
  output/              # vídeo, capa, storyboard, revisão (gerados)
```

## Comandos (na raiz do repositório)

```bash
node reels/como-funciona-o-raio-x/scripts/capture.cjs   # recaptura o site e refaz a checagem
python3 reels/como-funciona-o-raio-x/scripts/capturas_folha.py   # folha de revisão das capturas
npm run dev                          # preview: http://127.0.0.1:5173/core/player.html?reel=como-funciona-o-raio-x
npm run build -- como-funciona-o-raio-x              # cues -> áudio -> vídeo -> capa -> storyboard -> QA
npm run preview -- como-funciona-o-raio-x            # MP4 rápido (30 fps) para revisão
npm run stills -- como-funciona-o-raio-x 1.5,8.0     # quadros avulsos em PNG
```
