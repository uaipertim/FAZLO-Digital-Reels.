# FAZLO Digital — marca

Identidade própria da FAZLO Digital, **independente do FAZLO Hospeda** (nenhuma cor, fonte, logo, roteiro, animação ou som do Hospeda é reutilizado).

**Status:** logo oficial recebida; paleta, tipografia e assinatura sonora definidas no Reel 00.

| Pasta / arquivo | Conteúdo | Status |
|---|---|---|
| `logo/fazlo-digital-logo.webp` | arquivo-mestre oficial, intacto (2000×621, fundo transparente: "FAZLO" branco, barra do Z em lima, "DIGITAL") — para fundos escuros | oficial |
| `logo/fazlo-digital-logo-escura.png` | versão escura oficial (letras `#181918`, barra lima), como na folha de marca, gerada do mestre trocando só a cor das letras (`tools/logo_variant.py`) — para fundos claros | oficial (derivada) |
| `logo/referencias/` | folhas de marca recebidas (versão clara com ®, monograma "F/", versão escura sobre `#F3F3F3`) | referência |
| `tokens.js` | paleta, famílias tipográficas, caminho da logo e geometria medida da barra do Z, lidos por todos os Reels (`api.brand`) | oficial |
| `fonts/` | Unbounded (títulos) e Sora (apoios), OFL, + `fonts.css` | definido |
| `audio/` | referências da assinatura sonora (a síntese fica em cada Reel e em `tools/audio/`) | — |

## Identidade audiovisual

- **Cores:** verde-lima `#C5FA40` (amostrado da barra da logo), branco `#FFFFFF`, palco preto profundo `#050506`; no tema claro, painel `#F3F3F3` e tinta `#181918` (medidos na folha de marca).
- **Tipografia:**
  - **Unbounded** (larga, pesada, de cantos arredondados, em diálogo com o desenho da logo) nos títulos;
  - **Sora** nos apoios e no endereço.
- **Gesto da marca:** a barra lima do "Z".
  - **Inclinação:** dx/dy = −0,966, ≈ 46°. Tudo que corta ou se move na diagonal segue essa inclinação: fatias de texto, cortinas, feixes de luz.
  - **Proporção:** largura = 0,438 × altura.
  - **Texto fatiado:** as palavras entram em fatias diagonais que deslizam pelos próprios trilhos.
- **Assinatura sonora, "o corte":**
  1. uma varredura metálica que atravessa o estéreo da esquerda para a direita (como a barra);
  2. o intervalo Lá bemol 5 → Mi bemol 6 (quinta justa) em sino FM.
  - Módulo compartilhado: `tools/audio/fzbrand.py` (`sig_cut`, `sig_motif`), usado a partir do Reel 001.

## Regras da logo

- Usar sempre o arquivo oficial, sem redesenhar, recolorir ou distorcer.
- O arquivo oficial já tem fundo transparente. Para versões futuras com fundo, `tools/logo_alpha.py` torna transparente apenas o fundo conectado às bordas da imagem, sem alterar a arte:

```bash
python3 tools/logo_alpha.py brand/logo/fazlo-digital-logo.png brand/logo/fazlo-digital-logo-alpha.png
```

## Pendências da marca

- As folhas de marca mostram o **®** junto do "O" e um **monograma "F/"**. O arquivo-mestre recebido não tem o ®, e o monograma só veio dentro de uma composição (com sombra e fundo). Para usá-los nos vídeos, o ideal é receber os arquivos oficiais isolados, de preferência em SVG ou PNG transparente de alta resolução, nas versões clara e escura.
