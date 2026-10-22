#!/usr/bin/env python3
"""
Amostras de voz para o Willian escolher (série "Pelos olhos do hóspede", 23/10).

    python3 reels/_amostras/amostras.py      -> reels/_amostras/*.mp3 + amostras.json (medidas de cada uma)

Todas geradas sem o next_text e conferidas como as falas da série (voz.py): o arquivo da API termina em silêncio
(abaixo de -50 dB), o final não tem corte (regra calibrada: vogal >= 55 ms, consoante >= 35 ms de -15 dB ao silêncio)
e a pergunta sobe no F0. Cada MP3 leva só a fala (com a cauda natural até -60 dB), com 0,3 s de silêncio antes e depois.

  card2-A / card2-B   "Manda direct, chama no WhatsApp… ou liga?" numa geração só (uma pergunta única, enumerada),
                      duas sementes; a subida é medida no "ou liga?"
  card2-C             "Manda direct?" / "Chama no WhatsApp?" / "Ou liga?" em três partes, 0,55 s entre elas; cada parte
                      é a primeira tomada com subida moderada (15–40%)
  titulo-1..3         "Que horas é o check-in?" (ou "…, hein?") com ajustes mais expressivos (estabilidade 0,30 / estilo 0,50,
                      0,20 / 0,70 e 0,15 / 0,85): as 3 tomadas que mais sobem no final ("-in" ou "hein"); as que não
                      chegam a 30% vão com "_nao-atinge-30" no nome

A chave da ElevenLabs não passa por aqui (voz.py: Segredos de rede / ELEVENLABS_API_KEY).
"""
import json
import os
import subprocess
import sys
import hashlib

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
sys.path.insert(0, os.path.join(REPO, 'series', 'pelos-olhos-do-hospede'))
import voz  # noqa: E402

SR = voz.SR
TMP = os.path.join(AQUI, '.tomadas')                # cache das gerações (fora do git): rodar de novo não chama a API
os.makedirs(TMP, exist_ok=True)
SEMENTES = [2026, 7, 11, 23, 42, 77, 101, 202, 303, 404, 505, 606, 707, 808, 909, 1111]
MAIS = [1212, 1313, 1414, 1515, 1616, 1717, 1818, 1919, 2121, 2323, 2525, 2727, 2929, 3131, 3333, 3535]
CARD1 = 'No perfil, fotos lindas. E nenhum caminho pra reservar.'
REL = {}


def toma(texto, prev, sem, ajustes=None):
    """Uma geração (sem next_text) e as medidas dela."""
    padrao = voz.AJUSTES
    if ajustes:
        voz.AJUSTES = ajustes
    try:
        d = os.path.join(TMP, hashlib.sha1(json.dumps([texto, prev, sem, ajustes], sort_keys=True).encode()).hexdigest()[:16])
        voz.gerar(texto, prev, None, d, sem)
    finally:
        voz.AJUSTES = padrao
    m = json.load(open(d + '.json'))
    x = voz.decodifica(d + '.mp3')
    ok, fim = voz.fim_ok(x, texto, 'corte', m)
    return {'texto': texto, 'semente': sem, 'x': x, 'm': m, 'sobe': voz.perguntas(texto, m, x), 'ok_fim': ok, 'fim': fim,
            'ajustes': ajustes or padrao}


def recorta(x):
    """A fala com a cauda natural: de 30 ms antes do começo até a voz cair abaixo de -60 dB."""
    e = voz.envelope(x)
    pk = e.max()
    ini, fim = voz.fronteiras(x)
    i = int(fim * SR)
    while i < len(x) - 1 and e[i] > pk * 10 ** (-60 / 20):
        i += 1
    return x[max(0, int((ini - 0.03) * SR)):i + int(0.01 * SR)]


def salva(sinal, nome, dados):
    y = np.concatenate([np.zeros(int(0.3 * SR)), sinal, np.zeros(int(0.3 * SR))])
    y = y / max(1e-9, np.abs(y).max()) * 0.89 if np.abs(y).max() > 0.89 else y
    out = os.path.join(AQUI, nome + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '192k', out], input=y.astype(np.float32).tobytes(), check=True)
    REL[nome + '.mp3'] = {**dados, 'duracao_s': round(len(y) / SR, 2)}
    print(f'  {nome}.mp3  {dados}')


def resumo(t):
    return {'texto': t['texto'], 'semente': t['semente'], 'sobe': t['sobe'], 'fim_do_arquivo_db': t['fim']['fim_do_arquivo_db'],
            'queda_ms': t['fim']['queda_de_-15_ao_silencio_ms'], 'ajustes': t['ajustes']}


def sobe_no_in(t):
    """Subida da altura da voz no "-in" final (ou no "hein"): o pico do trecho contra a mediana do começo da pergunta."""
    al = t['m']['alinhamento']
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    s = ''.join(ch)
    k = s.rfind('hein') if 'hein' in s else s.rfind('-in') + 1
    a, b = st[k], en[k + (3 if 'hein' in s else 1)] + 0.04
    fz = voz.f0(t['x'])
    alvo = fz[int(a / 0.01):int(b / 0.01)]
    letras = [i for i, c in enumerate(ch) if c.isalnum()]
    corpo = fz[int(st[letras[0]] / 0.01):int(st[s.find('check')] / 0.01)]
    alvo, corpo = alvo[~np.isnan(alvo)], corpo[~np.isnan(corpo)]
    if len(alvo) < 2 or len(corpo) < 3:
        return None
    return round(float(np.percentile(alvo, 90) / np.median(corpo) - 1), 3)


# ---------------------------------------------------------------- card 2, A e B: uma pergunta só, enumerada
print('card 2, A e B (uma geração só):')
achadas = []
for sem in SEMENTES + MAIS:
    t = toma('Manda direct, chama no WhatsApp… ou liga?', CARD1, sem)
    print(f'    semente {sem}: sobe {t["sobe"]}, fim {t["fim"]["fim_do_arquivo_db"]} dB, queda {t["fim"]["queda_de_-15_ao_silencio_ms"]} ms, {"ok" if t["ok_fim"] else "corte"}')
    if t['ok_fim'] and t['sobe'] and all(v is not None and v >= voz.SOBE_MIN for v in t['sobe']):
        achadas.append(t)
    if len(achadas) == 2:
        break
for letra, t in zip('AB', achadas):
    salva(recorta(t['x']), f'como-eu-reservo_card2-{letra}_uma-geracao', resumo(t))

# ---------------------------------------------------------------- card 2, C: três partes conferidas, 0,55 s entre elas
print('card 2, C (três partes):')
partes, prev = [], CARD1
for texto in ['Manda direct?', 'Chama no WhatsApp?', 'Ou liga?']:
    for sem in SEMENTES:
        t = toma(texto, prev, sem)
        sb = t['sobe'][0] if t['sobe'] else None
        print(f'    {texto} semente {sem}: sobe {sb}, fim {t["fim"]["fim_do_arquivo_db"]} dB, queda {t["fim"]["queda_de_-15_ao_silencio_ms"]} ms')
        if t['ok_fim'] and sb is not None and 0.15 <= sb <= 0.40:
            partes.append(t)
            break
    else:
        raise SystemExit(f'nenhuma tomada de "{texto}" com subida de 15–40% e final sem corte')
    prev = texto
sil = np.zeros(int(0.55 * SR))
y = np.concatenate([np.concatenate([recorta(t['x']), sil]) for t in partes])[:-len(sil)]
salva(y, 'como-eu-reservo_card2-C_tres-partes', {'partes': [resumo(t) for t in partes], 'pausa_entre_partes_s': 0.55})

# ---------------------------------------------------------------- título do check-in: dúvida nítida
# A voz faz a pergunta brasileira: sobe até a tônica ("CHE-ck") e cai no "-in" — o Willian ouve como exclamação.
# Busca a subida NO FINAL ("-in" ou "hein") com ajustes cada vez mais expressivos; ficam as 3 que mais sobem
# (as que não chegam a 30% vão marcadas no nome do arquivo).
print('título do check-in (ajustes expressivos):')
cands = []
for est, estilo in [(0.30, 0.50), (0.20, 0.70), (0.15, 0.85)]:
    A = {**voz.AJUSTES, 'stability': est, 'style': estilo}
    for texto, sems in [('Que horas é o check-in?', SEMENTES[:12] if est == 0.30 else SEMENTES[:6]),
                        ('Que horas é o check-in, hein?', SEMENTES[:4] if est == 0.30 else SEMENTES[:3])]:
        for sem in sems:
            t = toma(texto, None, sem, A)
            t['sobe_in'] = sobe_no_in(t)
            print(f'    est {est} estilo {estilo} "{texto}" semente {sem}: sobe no final {t["sobe_in"]}, fim {t["fim"]["fim_do_arquivo_db"]} dB, {"ok" if t["ok_fim"] else "corte"}')
            if t['ok_fim'] and t['sobe_in'] is not None:
                cands.append(t)
escolha = sorted(cands, key=lambda t: -t['sobe_in'])[:3]
for i, t in enumerate(escolha, 1):
    nome = f'horario-check-in_titulo-{i}' + ('_hein' if 'hein' in t['texto'] else '') + ('' if t['sobe_in'] >= 0.30 else '_nao-atinge-30')
    salva(recorta(t['x']), nome, {**resumo(t), 'sobe_no_final': t['sobe_in']})
print(f'  {sum(t["sobe_in"] >= 0.30 for t in escolha)} de 3 sobem >= 30% no final')

json.dump(REL, open(os.path.join(AQUI, 'amostras.json'), 'w'), ensure_ascii=False, indent=1)
print('ok ->', os.path.relpath(AQUI, REPO))
