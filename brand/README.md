# FAZLO Digital — marca

Identidade própria da FAZLO Digital, **independente do FAZLO Hospeda** (nenhuma cor, fonte, logo, roteiro, animação ou som do Hospeda é reutilizado).

**Status: aguardando a logo oficial e as orientações criativas.**

| Pasta / arquivo | Conteúdo | Status |
|---|---|---|
| `logo/` | arquivo oficial da logo (original intacto) + versão com fundo transparente gerada por `tools/logo_alpha.py` | aguardando |
| `tokens.js` | paleta, famílias tipográficas e caminho da logo, lidos por todos os Reels (`api.brand`) | provisório (neutro) |
| `fonts/` | arquivos de fonte + `fonts.css` com as `@font-face` | aguardando |
| `audio/` | referências da assinatura sonora da FAZLO Digital (a síntese fica em `tools/audio/`) | aguardando |

## Regras da logo

- Usar sempre o arquivo oficial, sem redesenhar, recolorir ou distorcer.
- Para usar sobre fundos, `tools/logo_alpha.py` torna transparente apenas o fundo conectado às bordas da imagem; a arte não é alterada:

```bash
python3 tools/logo_alpha.py brand/logo/fazlo-digital-logo.png brand/logo/fazlo-digital-logo-alpha.png
```
