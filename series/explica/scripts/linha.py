#!/usr/bin/env python3
"""
Série Explica (FAZLO Digital) — a linha do tempo de um episódio: junta o roteiro (episodios/<id>.json) e a narração
(audio/<id>/voz/, uma geração inteira por capítulo).

    python3 series/explica/scripts/linha.py explica-01               -> audio/explica-01/linha.json + voz.wav
    python3 series/explica/scripts/linha.py explica-01 --estimativa  -> só estima as durações pelo texto (sem voz, sem API),
                                                                        para planejar um roteiro; marca a linha como provisória

Tempo de um capítulo (n ≥ 1), em segundos:
  corte       a troca de capítulo: o corte diagonal na inclinação da barra do Z (TR = 0,8 s). O capítulo novo "começa"
              (t0) no meio do corte, quando a barra passa pelo centro da tela;
  voz         entra `inicio` s depois de t0 (padrão 0,30 s: logo depois de o corte terminar; capítulo 0: 0,10 s, a capa
              é o quadro 0);
  voo         0,12 s depois da última palavra, a parte construída encolhe e voa até o bloco dela no celular do canto
              (0,62 s); o bloco acende e o cursor vai para o próximo bloco vazio;
  fim (t1)    0,14 s depois do encaixe começa o corte para o próximo capítulo. Nunca antes de a última linha de apoio
              ter ficado 1,5 s inteira na tela, nem antes de `min` s.
  fecho       sem voo: 0,45 s depois da fala, um corte de 0,5 s deixa só a logo, que fica parada os últimos 3 s.

Legenda palavra por palavra ("legenda": true no roteiro; tools/legenda-palavras/): sem linhas de apoio.

Linhas de apoio: uma por frase (o "apoio" de cada frase; null = nenhuma; igual à anterior = continua). Cada uma entra
em 0,34 s, fica ao menos 1,5 s inteira e sai em 0,2 s ANTES de a próxima entrar: nunca duas ao mesmo tempo.

Respiro inserido ("respiro_inserido" no capítulo; regra de 28/10): o silêncio entra só no meio de um trecho da própria
tomada que já está abaixo de −60 dB entre duas frases (voz.insere_respiros); o vídeo usa voz/cap-NN-respiro.wav, a
tomada original com esses zeros, e as palavras depois do ponto se deslocam junto. A tomada da API fica intacta.

Voz: o áudio de cada capítulo entra INTEIRO e contínuo (só se tira o silêncio antes da 1ª letra e depois da última,
com fades de 8 ms / 60 ms nas pontas). Nada é cortado ou emendado dentro de um capítulo; a colocação de cada um fica
registrada em linha.json ("colocacao") para a revisão conferir.
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np
from scipy.io import wavfile

SERIE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
TR = 0.80                     # o corte diagonal entre capítulos
VOO = 0.62                    # a parte encolhe e voa até o bloco
ANTES_VOO = 0.12              # da última palavra ao voo
DEPOIS_VOO = 0.14             # do encaixe ao corte
CORTE_LOGO = 0.50             # o corte que deixa só a logo
LOGO = 3.0                    # a logo parada no fim
AP_ENTRA, AP_SAI, AP_LEITURA = 0.34, 0.20, 1.5
AP_PASSO = AP_ENTRA + AP_LEITURA + AP_SAI + 0.02
PRE, POS = 0.04, 0.30         # o que fica do áudio antes da 1ª letra e depois da última
TONS = ['palco', 'ardosia', 'musgo', 'carvao', 'abismo', 'oliva', 'noite', 'grafite']


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def decodifica(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def estima(texto):
    """Alinhamento estimado (16 letras/s, pausas na pontuação), no formato da API, para planejar sem voz."""
    ch, st, en, t = [], [], [], 0.25
    for c in texto:
        d = 1 / 16 if c.isalnum() else 0.0
        if c in ',:':
            t += 0.12
        elif c in '.?!':
            t += 0.30
        ch.append(c); st.append(round(t, 3)); t += d; en.append(round(t, 3))
    return {'characters': ch, 'character_start_times_seconds': st, 'character_end_times_seconds': en}


def palavras(al, desloc):
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    out, cur = [], None
    for i, (c, a, b) in enumerate(zip(ch, st, en)):
        if c.isspace():
            if cur:
                out.append(cur)
                cur = None
            continue
        if cur is None:
            cur = {'w': '', 'i0': i, 't0': a, 't1': b}
        cur['w'] += c
        if c.isalnum():
            cur['t1'] = b
    if cur:
        out.append(cur)
    out = [w for w in out if norm(w['w'])]
    for w in out:
        w['n'] = norm(w['w'])
        w['t0'] = round(w['t0'] + desloc, 4)
        w['t1'] = round(w['t1'] + desloc, 4)
    return out


def main(ep_id, estimativa=False):
    aud = os.path.join(SERIE, 'audio', ep_id)
    roteiro = json.load(open(os.path.join(SERIE, 'episodios', ep_id + '.json')))
    FJ = None if estimativa else json.load(open(os.path.join(aud, 'voz', 'falas.json')))
    falas = FJ and FJ['capitulos']
    # o alinhamento é do texto ENVIADO à API (dicionário de pronúncia: FAZLO → Fázlo, WhatsApp → Uátsap); a tela usa o roteiro
    dic = (FJ or {}).get('pronuncia') or ({'FAZLO': 'Fázlo'} if FJ else {})
    def api(s):
        for de, para in dic.items():
            s = re.sub(rf'\b{re.escape(de)}\b', para, s, flags=re.I)
        return s
    caps_in = roteiro['capitulos']
    legenda = bool(roteiro.get('legenda', False))
    caps, pistas, t1_ant = [], [], None
    for n, c in enumerate(caps_in):
        ultimo = n == len(caps_in) - 1
        texto = ' '.join(f['texto'] for f in c['fala'])
        if estimativa:
            al = estima(texto)
            ini, fim = al['character_start_times_seconds'][0], al['character_end_times_seconds'][-1]
        else:
            F = falas[f'{n:02d}']
            assert F['texto'] == texto, f'capítulo {n:02d}: o texto mudou desde a narração; rode scripts/voz.py {ep_id}'
            al, ini, fim = F['alinhamento'], F['inicio_da_fala'], F['fim_da_fala']
        arquivo, ins = f'voz/cap-{n:02d}.mp3', []
        if c.get('respiro_inserido') and not estimativa:
            # respiro inserido (regra de 28/10): silêncio digital no meio do trecho da tomada que já está abaixo de −60 dB
            # entre as duas frases; nada falado é cortado. A tomada da API fica intacta; o vídeo usa a derivada.
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            import voz as V
            V.PRONUNCIA = dic
            y_, al, ins = V.insere_respiros(decodifica(os.path.join(aud, arquivo)), al, c)
            fim = round(fim + sum(i_['silencio_s'] for i_ in ins if i_['t'] < fim), 4)
            arquivo = f'voz/cap-{n:02d}-respiro.wav'
            wavfile.write(os.path.join(aud, arquivo), SR, y_.astype(np.float32))
        corte = None if n == 0 else [round(t1_ant, 4), round(t1_ant + TR, 4)]
        t0 = 0.0 if n == 0 else t1_ant + TR / 2
        v0 = t0 + c.get('inicio', 0.10 if n == 0 else 0.30)
        desloc = v0 - ini
        v1 = fim + desloc
        ws = palavras(al, desloc)
        # as palavras com a grafia do roteiro (a do áudio é a fonética), casadas uma a uma; se o número divergir, para
        tk = [w for w in texto.split() if norm(w)]
        if len(tk) != len(ws):
            raise SystemExit(f'capítulo {n:02d}: o áudio tem {len(ws)} palavras e o roteiro {len(tk)} — '
                             f'áudio: "{" ".join(w["w"] for w in ws)}" · roteiro: "{" ".join(tk)}"')
        for w, t in zip(ws, tk):
            w['api'], w['w'], w['n'] = w['w'], t, norm(t)
        frases, pos = [], 0
        for f in c['fala']:
            a, b = pos, pos + len(api(f['texto']) if not estimativa else f['texto'])
            alfa = [k for k in range(a, b) if al['characters'][k].isalnum()]
            frases.append({'texto': f['texto'], 'apoio': f.get('apoio'),
                           't0': round(al['character_start_times_seconds'][alfa[0]] + desloc, 4),
                           't1': round(al['character_end_times_seconds'][alfa[-1]] + desloc, 4)})
            pos = b + 1
        apoios = []
        for f in frases:
            if legenda:                              # com a legenda palavra por palavra ligada, não há linha de apoio
                break
            if not f['apoio'] or (apoios and apoios[-1]['texto'] == f['apoio']):
                continue
            ta = max(f['t0'] - 0.12, t0 + 0.45, (apoios[-1]['t'] + AP_PASSO) if apoios else -9)
            apoios.append({'t': round(ta, 4), 'texto': f['apoio']})
        ap_min = (apoios[-1]['t'] + AP_ENTRA + AP_LEITURA + 0.02) if apoios else 0
        item = {'n': n, 'rotulo': c.get('rotulo'), 'tom': c.get('tom', TONS[n % len(TONS)]), 'titulo': c['titulo'],
                'diagrama': c['diagrama'], 't0': round(t0, 4), 'corte': corte, 'voz_t0': round(v0, 4), 'voz_t1': round(v1, 4),
                'palavras': ws, 'frases': frases, 'apoios': apoios}
        if not ultimo:
            voo0 = v1 + ANTES_VOO
            t1 = max(voo0 + VOO + DEPOIS_VOO, t0 + c.get('min', 0), ap_min)
            voo0 = t1 - DEPOIS_VOO - VOO
            item.update({'voo': [round(voo0, 4), round(voo0 + VOO, 4)], 'cursor': [round(voo0 + VOO + 0.06, 4), round(voo0 + VOO + 0.36, 4)],
                         't1': round(t1, 4)})
        else:
            lc0 = max(v1 + 0.45, ap_min, t0 + c.get('min', 0) - LOGO - CORTE_LOGO)
            fim_ep = lc0 + CORTE_LOGO + LOGO
            item.update({'corte_logo': [round(lc0, 4), round(lc0 + CORTE_LOGO, 4)], 'logo_parada': [round(lc0 + CORTE_LOGO, 4), round(fim_ep, 4)],
                         't1': round(fim_ep, 4)})
        for i, a in enumerate(apoios):
            if i + 1 < len(apoios):
                a['ate'] = apoios[i + 1]['t']
                a['sai'] = True
            else:
                a['ate'] = round(item['corte_logo'][0] if ultimo else item['t1'], 4)       # o corte leva a última
                a['sai'] = False
        caps.append(item)
        if ins:
            item['respiro_inserido'] = ins
        pistas.append((n, ini, fim, desloc, arquivo, ins))
        t1_ant = item['t1']
    dur = caps[-1]['t1']
    coloc = []
    if not estimativa:
        x = np.zeros(int(round(dur * SR)) + SR)
        for n, ini, fim, desloc, arquivo, ins in pistas:
            y = decodifica(os.path.join(aud, arquivo))
            a, b = max(0.0, ini - PRE), min(len(y) / SR, fim + POS)
            seg = y[int(round(a * SR)):int(round(b * SR))].copy()
            k0, k1 = int(0.008 * SR), int(0.06 * SR)
            seg[:k0] *= np.linspace(0, 1, k0)
            seg[-k1:] *= np.linspace(1, 0, k1)
            i = int(round((a + desloc) * SR))
            x[i:i + len(seg)] += seg
            coloc.append({'cap': n, 'arquivo': arquivo, 'de_s': round(a, 4), 'ate_s': round(b, 4),
                          'no_video_s': round(i / SR, 5), 'amostras': len(seg), 'fade_ms': [8, 60]})
            if ins:                                     # a tomada original e onde entrou o silêncio (tempo do original)
                coloc[-1].update({'origem': f'voz/cap-{n:02d}.mp3', 'respiro_inserido': ins})
        x = x[: int(round(dur * SR))]
        wavfile.write(os.path.join(aud, 'voz.wav'), SR, x.astype(np.float32))
    os.makedirs(aud, exist_ok=True)
    out = {'episodio': ep_id, 'titulo': roteiro['titulo'], 'marca': roteiro.get('marca', '@fazlodigital'), 'duracao': round(dur, 4),
           'provisorio': estimativa, 'tr': TR, 'voo': VOO, 'logo': LOGO,
           'saida': roteiro.get('saida'), 'progresso': roteiro.get('progresso', 'pagina'), 'telas': roteiro.get('telas'),
           'duracao_alvo': roteiro.get('duracao_alvo', [60, 90]),
           'legenda': legenda,
           'apoio': {'entra': AP_ENTRA, 'sai': AP_SAI, 'leitura': AP_LEITURA}, 'capitulos': caps, 'colocacao': coloc}
    json.dump(out, open(os.path.join(aud, 'linha.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'{ep_id}: {len(caps)} capítulos, {dur:.2f} s' + ('  (ESTIMATIVA pelo texto, sem voz)' if estimativa else ''))
    for i, c in enumerate(caps):
        ini = 0.0 if i == 0 else c['corte'][0]
        fim = c['t1']
        print(f'  {c["n"]:02d} {str(c["rotulo"]):22s} {ini:6.2f}–{fim:6.2f} s ({fim - ini:5.2f} s) · voz {c["voz_t1"] - c["voz_t0"]:5.2f} s · {len(c["apoios"])} apoio(s)')
    return dur


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    main(sys.argv[1], '--estimativa' in sys.argv)
