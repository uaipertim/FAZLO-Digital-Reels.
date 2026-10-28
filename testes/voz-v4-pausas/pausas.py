#!/usr/bin/env python3
"""Teste (fora da produção): como pedir pausa ao eleven_v4. O fecho do case Guardião com 3 grafias da mesma fala:
reticências (a do roteiro), ponto + quebra de parágrafo e a marca <break time="0.6s"/> do ElevenLabs. Mede o silêncio
real (abaixo de −32 dB) antes de "pra" e se a marca vira palavra no alinhamento. Mesma voz, ajustes e semente da produção.
    python3 testes/voz-v4-pausas/pausas.py  ->  testes/voz-v4-pausas/<variante>.mp3 + resultado.json"""
import json, os, sys
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'series', 'explica', 'scripts'))
import voz  # noqa: E402
PREV = 'E o quarto: o hóspede escolhe o chalé e já fala com a pousada. Escolhe as datas, os chalés da Vila Pequi, e a consulta chega pronta no WhatsApp.'
VAR = {'reticencias': 'A pousada pediu. A gente fez. Site por FAZLO Digital… pra Pousada Guardião da Serra.',
       'paragrafo': 'A pousada pediu. A gente fez. Site por FAZLO Digital.\n\nPra Pousada Guardião da Serra.',
       'break': 'A pousada pediu. A gente fez. Site por FAZLO Digital <break time="0.6s" /> pra Pousada Guardião da Serra.'}
res = {}
for nome, texto in VAR.items():
    mp3, al = voz.tts(texto, PREV, 2111)
    open(os.path.join(AQUI, nome + '.mp3'), 'wb').write(mp3)
    x = voz.decodifica_bytes(mp3); e = voz.envelope(x); pk = e.max()
    ws = voz.palavras(al)
    a = next(w for w in ws if w['w'].lower().startswith('digital')); b = next(w for w in ws if w['w'].lower().startswith('pra'))
    sil = voz.silencio(e, pk, a['fim_letra'] - 0.02, b['t0'] + 0.15)
    res[nome] = {'texto': texto, 'silencio_antes_de_pra_s': round(sil, 3), 'palavras_no_alinhamento': [w['w'] for w in ws]}
    print(f'{nome:12s} silêncio antes de "pra": {sil:.2f} s · {len(ws)} palavras: {" ".join(w["w"] for w in ws)}')
json.dump(res, open(os.path.join(AQUI, 'resultado.json'), 'w'), ensure_ascii=False, indent=1)
