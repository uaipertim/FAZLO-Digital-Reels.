# FAZLO Digital — marca

Identidade própria da FAZLO Digital, **independente do FAZLO Hospeda** (nenhuma cor, fonte, logo, roteiro, animação ou som do Hospeda é reutilizado).

**Status:** logo oficial recebida; paleta, tipografia e assinatura sonora definidas no Reel 00.

| Pasta / arquivo | Conteúdo | Status |
|---|---|---|
| `logo/fazlo-digital-logo.webp` | arquivo oficial da logo, intacto (2000×621, fundo transparente: "FAZLO" branco, barra do Z em lima, "DIGITAL") | oficial |
| `tokens.js` | paleta, famílias tipográficas, caminho da logo e geometria medida da barra do Z, lidos por todos os Reels (`api.brand`) | oficial |
| `fonts/` | Unbounded (títulos) e Sora (apoios), OFL, + `fonts.css` | definido |
| `audio/` | referências da assinatura sonora (a síntese fica em cada Reel e em `tools/audio/`) | — |

## Identidade audiovisual

- **Cores:** verde-lima `#C5FA40` (amostrado da barra da logo), branco `#FFFFFF`, palco preto profundo `#050506`.
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
  - Implementação de referência em `reels/reel-00/scripts/audio.py` (`sig_cut`, `sig_motif`).

## Regras da logo

- Usar sempre o arquivo oficial, sem redesenhar, recolorir ou distorcer.
- O arquivo oficial já tem fundo transparente. Para versões futuras com fundo, `tools/logo_alpha.py` torna transparente apenas o fundo conectado às bordas da imagem, sem alterar a arte:

```bash
python3 tools/logo_alpha.py brand/logo/fazlo-digital-logo.png brand/logo/fazlo-digital-logo-alpha.png
```
