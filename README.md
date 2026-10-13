# FAZLO Digital — Motion Graphics

Produção dos Reels do Instagram da **FAZLO Digital**: motion graphics 9:16 animados em código, renderizados quadro a quadro e com trilha e efeitos sintetizados e sincronizados à imagem. Também os **carrosséis** estáticos do feed, desenhados com o mesmo código e a mesma identidade ([`carrosseis/`](carrosseis)).

> **Status:** **Reel 00 · "Da ideia ao digital."**, **Reel 001 · "Seu negócio já é bom. Seu digital precisa parecer isso."**, **Reel 002 · "Muito além de um site."**, **Reel 003 · "Ideias que ganham forma."**, **"Instagram não é site."**, **"Como funciona o raio-x."**, **"Conheça o site da Pousada Vale dos Canteiros."**, **"Site não é luxo."** e a collab com o FAZLO Hospeda **"Mandou mensagem e ninguém respondeu."** concluídos e em avaliação ([`reels/`](reels)). Carrossel **"O que o hóspede procura antes de reservar"** concluído e aprovado ([`carrosseis/`](carrosseis)). Capas dos **destaques do perfil** (Sites, Raio-x, Hospeda, Contato) concluídas e aprovadas ([`destaques/`](destaques)). **Fundos de Stories** para enquete e caixinha concluídos e em avaliação ([`stories/fundos/`](stories/fundos)). Identidade audiovisual em [`brand/`](brand): kit oficial de logos em SVG (com o símbolo FZ corrigido), verde-limão `#C6FA41`, fontes Unbounded + Sora e assinatura sonora.

## Padrão de entrega

| Item | Especificação |
|---|---|
| Vídeo | MP4, H.264 High (yuv420p, bt709), **1080×1920 (9:16), 60 fps**, `+faststart` |
| Áudio | AAC 256 kb/s, 48 kHz estéreo, **−14 LUFS** integrado, pico real **≤ −1 dBTP** |
| Capa | PNG 1080×1920, conferida também no recorte 3:4 do perfil |
| Revisão | relatório técnico, sincronia som × imagem, zonas seguras da interface do Reels, storyboard |
| Carrossel | PNG **1080×1350 (4:5)** por slide, opaco; topo abaixo do contador nativo do Instagram; capa conferida no recorte 3:4 da grade do perfil; prévia e folha em tamanho real |
| Capa de destaque | PNG **1080×1920**, fundo liso, ícone no círculo seguro (centro 540, 960; Ø 720 px); prévia do perfil em tema escuro e claro ([`destaques/`](destaques)) |
| Fundo de Stories | PNG **1080×1920**, logo abaixo da faixa do app (y 0–250), centro (y 700–1300) e rodapé (y 1650–1920) livres para texto e figurinhas ([`stories/`](stories)) |

## Requisitos

- Node 18+
- ffmpeg/ffprobe com libx264 e AAC
- Python 3.10+ com numpy, scipy e Pillow
- Chromium via Playwright

```bash
npm install                          # Playwright
npx playwright install chromium      # se ainda não houver Chromium (ou defina CHROMIUM_PATH)
python3 -m pip install -r requirements.txt
npm run doctor                       # confere o ambiente
npm test                             # calibração de ponta a ponta: deve terminar em "RESULTADO: aprovado"
```

## Comandos

`<reel>` aceita `00`, `reel-00`, o nome da pasta (`instagram-nao-e-site`) ou `_calibracao`.

| Comando | O que faz |
|---|---|
| `npm run dev` | preview interativo em http://127.0.0.1:5173 (play/scrub com áudio, quadro a quadro, zonas seguras, capa) |
| `npm run new-reel -- titulo-do-reel "Título"` | cria `reels/titulo-do-reel/` a partir de `templates/reel/` (com número, `04` → `reels/reel-04/`) |
| `npm run build -- <reel>` | pipeline completo: cues → áudio → vídeo → capa → storyboard → QA |
| `npm run build -- <reel> --steps audio,video` | só alguns passos (`--skip qa` também funciona) |
| `npm run cues -- <reel>` | exporta os eventos de som da animação para `audio/cues.json` |
| `npm run audio -- <reel>` | sintetiza `audio/trilha.wav` a partir dos cues (master −14 LUFS) |
| `npm run video -- <reel>` | MP4 final 60 fps (`--workers 4`, `--from 3 --to 8` para um trecho, `--noblur`) |
| `npm run preview -- <reel>` | MP4 rápido em 30 fps para revisão (`output/preview.mp4`, não versionado) |
| `npm run cover -- <reel>` | capa `output/capa.png` |
| `npm run stills -- <reel> 1.5,8.2` | quadros avulsos em PNG (`--noblur` para ver sem motion blur) |
| `npm run storyboard -- <reel>` | `output/storyboard.jpg` |
| `npm run qa -- <reel>` | revisão técnica e de sincronização em `output/revisao/` (sai com erro se algo falhar) |
| `npm run carousel -- <pasta>` | carrossel: `carrosseis/<pasta>/output/NN.png` + prévia e revisão (`--slides 2,9` para só alguns) |

Atalhos do preview: `espaço` play/pausa · `←/→` 1 quadro · `shift+←/→` 1 s · `Z` zonas seguras · `B` motion blur · `C` capa. Parâmetros de URL: `?reel=reel-00&t=12.5`, `&cover`, `&zones`.

## Estrutura

```
core/
  engine.js          # motor Canvas 2D determinístico: FZD.define, renderAt (motion blur + pós), capa, cues, utilitários
  player.html        # preview interativo e página usada pelo render (?render)
  carousel.js        # carrosséis estáticos: FZC.define (slides desenhados com os utilitários do motor)
  carousel.html      # preview dos slides (guias: tecla G) e página usada pelo render de PNG (?render)
  safe-zones.json    # áreas cobertas pela interface do Reels + recorte 3:4 do perfil
brand/
  tokens.js          # paleta, tipografia, logo e geometria da barra do Z
  fonts/             # Unbounded + Sora (OFL) e fonts.css
  logo/              # logo oficial (mestre intacto + versão escura), kit oficial em SVG (logo/kit/) e folhas de referência
  audio/             # referências da assinatura sonora
tools/
  render.cjs         # cues | video | preview | stills | cover  (Chromium headless -> ffmpeg)
  build.cjs          # pipeline completo de um Reel
  serve.cjs          # servidor de desenvolvimento
  new-reel.cjs       # novo Reel a partir do modelo
  doctor.cjs         # verificação do ambiente
  qa.py              # revisão técnica + sincronização + zonas seguras + capa no feed
  carousel.cjs       # carrossel: slides em PNG (Chromium headless) e revisão
  carousel_qa.py     # carrossel: tamanho, bordas, contador nativo, recorte 3:4, prévia e tamanho real
  storyboard.py      # folha de quadros-chave
  logo_alpha.py      # fundo da logo transparente, sem alterar a arte
  logo_variant.py    # variante de cor da logo (ex.: versão escura) trocando só a cor das letras
  audio/fzaudio.py   # síntese (osciladores, bateria, efeitos), mixagem em barramentos e master
  audio/fzbrand.py   # assinatura sonora da marca ("o corte")
templates/reel/      # modelo de pasta de Reel
reels/
  reel-00/ … reel-03/          # um Reel por pasta (ver reels/README.md)
  instagram-nao-e-site/        # a partir daqui, pastas com o nome do título
  como-funciona-o-raio-x/      # telas reais de cliente (scripts/capture.cjs)
  case-vale-dos-canteiros/     # navegação no site real do cliente (reaproveita as capturas do raio-x)
  site-nao-e-luxo/             # o LUXO racha e vira os blocos de um site simples (interfaces genéricas)
  mandou-mensagem/             # collab com o FAZLO Hospeda: o fio da consulta até a reserva (prints reais)
  _calibracao/                 # cartela técnica que valida o pipeline
carrosseis/
  o-que-o-hospede-procura/     # um carrossel por pasta (ver carrosseis/README.md)
destaques/                     # capas dos destaques do perfil (ver destaques/README.md)
stories/
  fundos/                      # fundos para enquete e caixinha (ver stories/fundos/README.md)
```

Cada Reel:

```
reels/<pasta>/
  reel.json          # título, status, saídas, fontes/assets a pré-carregar, scripts auxiliares (opcional), parâmetros de QA, storyboard
  src/anim.js        # a animação: FZD.define({ id, duration, bpm, sections, blur, setup, frame, cover, cues })
  src/assets/        # imagens específicas do Reel
  scripts/audio.py   # trilha + efeitos (usa tools/audio/fzaudio.py)
  audio/             # cues.json + trilha.wav
  output/            # vídeo, capa, storyboard e revisão/
```

## Como funciona

1. **Animação determinística.** `frame(ctx, t, api)` desenha o quadro exato do instante `t`, sem estado entre quadros. O mesmo código serve o preview, o render e a lista de cues.
2. **Motion blur real.** `renderAt` faz a média de vários subquadros dentro da abertura do obturador; o padrão é 4 amostras em 1/120 s e cada Reel define faixas com mais amostras nas passagens rápidas (`blur.ranges`). Um passo opcional `post(ctx, t)` roda sobre o quadro final (bloom, vinheta, grão).
3. **Render.** `tools/render.cjs` sobe um servidor local, abre `core/player.html?reel=<id>&render` em várias abas do Chromium headless, captura cada quadro do canvas e envia em ordem ao ffmpeg (x264 CRF 15, preset slow); depois multiplexa a trilha em AAC.
4. **Som sincronizado.** A animação registra eventos (`api.cue(t, 'tipo', {...})`); `npm run cues` exporta `audio/cues.json` e o `audio.py` do Reel coloca cada som exatamente nesses instantes. Mudou um tempo na animação → `npm run build -- <reel> --steps cues,audio,video` e tudo ressincroniza.
5. **Master.** `fzaudio.master` satura de leve, normaliza em duas passagens (loudnorm linear), aplica limitador de pico real sobreamostrado 4× e corrige o ganho até ±0,2 LU de −14 LUFS, com folga para o AAC ficar abaixo de −1 dBTP.
6. **QA.** `tools/qa.py` confere formato, duração, loudness, pico real, quadros pretos/congelados, 1º quadro, capa (e, se o `reel.json` definir `qa.coverClear`, as áreas da capa que devem ficar livres e o conteúdo dentro do recorte 3:4); mede a sincronia em três camadas (trilha sem deslocamento no MP4, ataque dos efeitos-chave em relação ao evento visual, reação da imagem nos golpes) e gera as folhas de zonas seguras e da capa no feed.

## Regras do projeto

- A FAZLO Digital tem **identidade, direção de arte e assinatura sonora próprias**. Nenhuma paleta, fonte, logo, roteiro, animação ou som do FAZLO Hospeda é reutilizado (exceção combinada: a collab "Mandou mensagem e ninguém respondeu", que mostra prints reais do sistema e a marca do Hospeda); deste projeto veio apenas a experiência técnica (motor, render, síntese e QA), reescrita e generalizada aqui.
- O repositório do FAZLO Hospeda não é modificado.
- Logo: sempre o arquivo oficial, sem redesenho (ver [`brand/README.md`](brand/README.md)).
- Textos e elementos importantes fora das zonas cobertas pela interface do Reels (`core/safe-zones.json`).
