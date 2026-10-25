#!/usr/bin/env bash
# Série Explica (FAZLO Digital): um episódio inteiro, do roteiro ao vídeo revisado, num comando só.
#
#   series/explica/scripts/episodio.sh explica-01              gera na API só a narração que falta, e faz o resto
#   series/explica/scripts/episodio.sh explica-01 --refaz 3,5  gera de novo, INTEIROS, os capítulos 3 e 5 (outra semente)
#   series/explica/scripts/episodio.sh explica-01 --forcar     renderiza mesmo fora de 60–90 s
#
# Lê series/explica/episodios/<id>.json e entrega em series/explica/output/<id>/: o MP4, a capa, o storyboard,
# a folha do recurso de progresso e a revisão técnica (ou na pasta do campo "saida" do roteiro). Para antes do render
# se a duração sair de 60–90 s (ou do "duracao_alvo" do roteiro)
# (mostra as durações por capítulo): a voz nunca é acelerada.
# A chave do ElevenLabs NUNCA fica no repositório: nesta nuvem a rede a injeta (Segredos de rede);
# fora dela, exporte ELEVENLABS_API_KEY no terminal.
set -euo pipefail
cd "$(dirname "$0")/../../.."
EP="${1:?uso: series/explica/scripts/episodio.sh <id, ex. explica-01> [--refaz 3,5] [--forcar]}"
shift
REFAZ=(); FORCAR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --refaz) REFAZ=(--refaz "$2"); shift 2 ;;
    --forcar) FORCAR=1; shift ;;
    *) echo "opção desconhecida: $1"; exit 1 ;;
  esac
done
S=series/explica/scripts
test -f "series/explica/episodios/$EP.json" || { echo "series/explica/episodios/$EP.json não existe"; exit 1; }
python3 $S/voz.py "$EP" "${REFAZ[@]}"                  # 1. uma geração inteira por capítulo, conferida (só o que falta)
python3 $S/linha.py "$EP"                               # 2. linha do tempo por palavra + a narração montada (voz.wav)
python3 tools/legenda-palavras/legenda.py explica "$EP"  # 2b. legenda palavra por palavra (para se ligada e com falha)
DUR=$(python3 -c "import json;print(json.load(open('series/explica/audio/$EP/linha.json'))['duracao'])")
ALVO=$(python3 -c "import json;a=json.load(open('series/explica/audio/$EP/linha.json')).get('duracao_alvo',[60,90]);print(a[0],a[1])")
if [ "$FORCAR" = 0 ] && ! python3 -c "import sys;d=float('$DUR');a,b=map(float,'$ALVO'.split());sys.exit(0 if a<=d<=b else 1)"; then
  echo "PAROU: o episódio tem $DUR s (fora de ${ALVO/ /–} s). Ajuste o texto do roteiro (a voz não é acelerada) ou use --forcar."
  exit 2
fi
node $S/render.cjs cues --ep "$EP"                      # 3. os sons tirados da animação
python3 $S/audio.py "$EP"                               # 4. voz + trilha contínua com ducking + efeitos (−14 LUFS)
node $S/render.cjs video --ep "$EP"                     # 5. o vídeo quadro a quadro + o áudio em AAC
node $S/render.cjs capa --ep "$EP"                      # 6. a capa (quadro 0)
node $S/render.cjs info --ep "$EP"                      # 7. dados da revisão (apoios, trocas, caixas)
python3 $S/storyboard.py "$EP"                          # 8. storyboard + folha do recurso de progresso
python3 $S/qa.py "$EP"                                  # 9. revisão técnica (sai com erro se algo falhar)
