#!/usr/bin/env python3
"""
Teste A/B de narração (fora da produção: não mexe em vídeos nem nos scripts de series/ e reels/).

    python3 testes/voz-ab/voz_ab.py   ->  testes/voz-ab/voz-A.mp3, voz-B.mp3, voz-C.mp3 + teste.json

Capítulo 0 do episódio mais recente da Série Explica (series/explica/episodios/case-guardiao-da-serra.json), o único
com pergunta, com o texto exatamente como está no JSON. As três versões usam a voz Raquel (GDzHdQOi6jjf8zaXhCYD), o
mesmo texto, o mesmo contexto (previous_text: nenhum, por ser o 1º capítulo; next_text: o capítulo 1), a mesma seed
(17026, a da tomada aprovada) e a troca FAZLO/Fazlo → Fázlo:
  A  eleven_multilingual_v2 · stability 0,40 · similarity 0,80 · style 0,35 · speaker boost · speed 1,0 (o atual)
  B  igual ao A, com style 0
  C  eleven_v4 · stability 0,50 · similarity 0,75 · style padrão (como no Reel "Site não é luxo"); se a API recusar o
     contexto, gera sem e registra em teste.json
A chave NÃO passa por aqui: na nuvem o proxy injeta o xi-api-key; fora dela, ELEVENLABS_API_KEY (nunca impressa).
"""
import json
import os
import re

import requests

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
VOZ = 'GDzHdQOi6jjf8zaXhCYD'
SEED = 17026
EP = json.load(open(os.path.join(REPO, 'series', 'explica', 'episodios', 'case-guardiao-da-serra.json')))
texto_cap = lambda c: ' '.join(f['texto'] for f in c['fala'])
TEXTO = texto_cap(EP['capitulos'][0])
PREV, NEXT = None, texto_cap(EP['capitulos'][1])
api = lambda s: s and re.sub(r'\bFAZLO\b', 'Fázlo', s, flags=re.I)
VERSOES = {
    'A': ('eleven_multilingual_v2', {'stability': 0.40, 'similarity_boost': 0.80, 'style': 0.35, 'use_speaker_boost': True, 'speed': 1.0}),
    'B': ('eleven_multilingual_v2', {'stability': 0.40, 'similarity_boost': 0.80, 'style': 0.0, 'use_speaker_boost': True, 'speed': 1.0}),
    'C': ('eleven_v4', {'stability': 0.50, 'similarity_boost': 0.75}),
}
head = {'Content-Type': 'application/json'}
if os.environ.get('ELEVENLABS_API_KEY'):
    head['xi-api-key'] = os.environ['ELEVENLABS_API_KEY']
url = f'https://api.elevenlabs.io/v1/text-to-speech/{VOZ}?output_format=mp3_44100_128'
rel = {'capitulo': 0, 'episodio': EP['id'], 'texto': TEXTO, 'texto_enviado': api(TEXTO), 'previous_text': api(PREV),
       'next_text': api(NEXT), 'seed': SEED, 'voice_id': VOZ, 'versoes': {}}
for k, (modelo, ajustes) in VERSOES.items():
    body = {'text': api(TEXTO), 'model_id': modelo, 'language_code': 'pt', 'voice_settings': ajustes, 'seed': SEED,
            'previous_text': api(PREV), 'next_text': api(NEXT)}
    body = {a: b for a, b in body.items() if b is not None}
    r = requests.post(url, json=body, headers=head, timeout=240)
    contexto = True
    if r.status_code != 200 and k == 'C':
        print(f'  C: HTTP {r.status_code} com contexto ({r.text[:200]}); tentando sem previous_text/next_text')
        body.pop('previous_text', None); body.pop('next_text', None)
        r = requests.post(url, json=body, headers=head, timeout=240)
        contexto = False
    if r.status_code != 200:
        raise SystemExit(f'{k}: HTTP {r.status_code} {r.text[:300]}')
    open(os.path.join(AQUI, f'voz-{k}.mp3'), 'wb').write(r.content)
    rel['versoes'][k] = {'model_id': modelo, 'voice_settings': ajustes, 'com_contexto': contexto, 'arquivo': f'voz-{k}.mp3'}
    print(f'  voz-{k}.mp3 · {modelo} · {json.dumps(ajustes)} · contexto: {"sim" if contexto else "NÃO (recusado pelo modelo)"}')
json.dump(rel, open(os.path.join(AQUI, 'teste.json'), 'w'), ensure_ascii=False, indent=1)
