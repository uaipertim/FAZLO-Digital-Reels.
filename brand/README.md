# FAZLO Digital — marca

Identidade própria da FAZLO Digital, **independente do FAZLO Hospeda** (nenhuma cor, fonte, logo, roteiro, animação ou som do Hospeda é reutilizado).

**Status:** kit oficial de logos recebido (SVG, com o símbolo FZ corrigido). O verde-limão oficial é `#C6FA41`, e Unbounded + Sora são as fontes oficiais. A assinatura sonora foi definida no Reel 00.

| Pasta / arquivo | Conteúdo | Status |
|---|---|---|
| `logo/kit/` | **kit oficial de logos (2026-10)**, em SVG vetorial sem fonte externa (ver `LEIA-ME.txt`):<br>• `FAZLO-DIGITAL-branca-transparente.svg` / `-preta-` — assinatura com DIGITAL;<br>• `FAZLO-logo-branca-transparente.svg` / `-preta-` — FAZLO sem subtítulo;<br>• `FAZLO-simbolo-branco-verde.svg` / `-preto-verde` — monograma FZ, **versão corrigida** (base do Z branca no fundo escuro, faixa verde sem serrilhado);<br>• `FAZLO-avatar-perfil-1080.png` — avatar do Instagram | **oficial · usar nos Reels novos** |
| `logo/fazlo-digital-logo.webp` | arquivo-mestre oficial, intacto (2000×621, fundo transparente: "FAZLO" branco, barra do Z em lima, "DIGITAL") — para fundos escuros | oficial |
| `logo/fazlo-digital-logo-escura.png` | versão escura oficial (letras `#181918`, barra lima), como na folha de marca, gerada do mestre trocando só a cor das letras (`tools/logo_variant.py`) — para fundos claros | oficial (derivada) |
| `logo/referencias/` | folhas de marca recebidas (versão clara com ®, monograma "F/", versão escura sobre `#F3F3F3`) | referência |
| `tokens.js` | paleta, famílias tipográficas, caminhos da logo e do kit (`kit`), geometria medida da barra do Z, lidos por todos os Reels (`api.brand`) | oficial |
| `fonts/` | Unbounded (títulos) e Sora (textos e telas), OFL, + `fonts.css` | **oficial** |
| `audio/` | referências da assinatura sonora (a síntese fica em cada Reel e em `tools/audio/`) | — |

## Identidade audiovisual

- **Cores:**
  - verde-limão oficial **`#C6FA41`** (do kit), branco `#FFFFFF`;
  - fundo escuro **`#000000`** ou **`#050606`**;
  - no tema claro, painel `#F3F3F3` e tinta `#181918` (medidos na folha de marca);
  - os Reels 00–003 usam `#C5FA40` (amostrado do arquivo-mestre, `accent` em `tokens.js`) e não precisam mudar. Os Reels novos usam `lime` (`#C6FA41`).
- **Tipografia (fontes oficiais da FAZLO Digital):**
  - **Unbounded** (larga, pesada, de cantos arredondados, em diálogo com o desenho da logo) nos títulos. Quando um roteiro pedir Archivo Expanded Black, usar Unbounded 800/900;
  - **Sora** nos textos, nas telas de interface e no endereço. Quando um roteiro pedir Inter, usar Sora;
  - não adicionar outras famílias.
- **Gesto da marca:** a barra lima do "Z".
  - **Inclinação:** dx/dy = −0,966, ≈ 46°. Tudo que corta ou se move na diagonal segue essa inclinação: fatias de texto, cortinas, feixes de luz.
  - **Proporção:** largura = 0,438 × altura.
  - **Texto fatiado:** as palavras entram em fatias diagonais que deslizam pelos próprios trilhos.
- **Assinatura sonora, "o corte":**
  1. uma varredura metálica que atravessa o estéreo da esquerda para a direita (como a barra);
  2. o intervalo Lá bemol 5 → Mi bemol 6 (quinta justa) em sino FM.
  - Módulo compartilhado: `tools/audio/fzbrand.py` (`sig_cut`, `sig_motif`), usado a partir do Reel 001.

## Regras da logo

- Usar sempre o arquivo oficial, sem redesenhar, recolorir ou distorcer. Nos Reels novos, usar preferencialmente os SVGs de `logo/kit/`. Animar as formas desses arquivos (letras, barra, DIGITAL) é permitido, desde que o desenho final seja o oficial.
- Símbolo FZ: usar só `FAZLO-simbolo-*` do kit, já corrigido. Não corrigir de novo.
- O arquivo oficial já tem fundo transparente. Para versões futuras com fundo, `tools/logo_alpha.py` torna transparente apenas o fundo conectado às bordas da imagem, sem alterar a arte:

```bash
python3 tools/logo_alpha.py brand/logo/fazlo-digital-logo.png brand/logo/fazlo-digital-logo-alpha.png
```

## Pendências da marca

- **Monograma FZ:** recebido isolado no kit, já corrigido (resolvido).
- **®:** o kit omite o ® porque o status do registro não foi confirmado. Se o registro já tiver sido concedido, ele pode voltar.
- **Barra do Z na assinatura com DIGITAL:** no SVG, a borda da barra lima tem um leve degrau que só aparece em zoom de 4× ou mais. É invisível no vídeo e foi usada como está.
