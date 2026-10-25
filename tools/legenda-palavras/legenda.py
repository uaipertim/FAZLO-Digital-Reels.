#!/usr/bin/env python3
"""
Legenda palavra por palavra (FAZLO Digital) — as palavras da narração, com a grafia do ROTEIRO e o tempo do vídeo.

    python3 tools/legenda-palavras/legenda.py explica <id>   -> series/explica/audio/<id>/legenda.json (+ legenda.txt)
    python3 tools/legenda-palavras/legenda.py pelos <id>     -> reels/<id>/audio/voz/legenda.json (+ legenda.txt)

Só lê o que já está salvo (o alinhamento por caractere que a API devolveu junto com cada fala, o roteiro e o áudio
montado); nunca chama a API. Independente de motor: entrega cenas > frases > palavras {w, t0, t1, chave}, e o
legenda.js (mesma pasta) faz as páginas e desenha. Depois de escrever o JSON, roda o confere.cjs (as páginas, no
Chromium, com a fonte de verdade) e confere tudo:

  grafia      o texto na tela é o do roteiro (FAZLO, WhatsApp), casado palavra a palavra com o alinhamento (que tem a
              grafia enviada à API: Fázlo, Uátsap). Se o número de palavras divergir, ou um par não bater nem pelo
              dicionário de pronúncia, PARA com erro (nunca adivinha);
  destaque    só o campo "destaque" da frase (1 trecho, até 2 palavras, que precisa estar na frase); sem ele, tudo branco;
  sincronia   os tempos vêm do alinhamento, levados ao áudio final (o deslocamento de cada fala; os aparos só tiram
              silêncio). O início de cada palavra que vem depois de uma pausa (≥ 0,12 s) é medido na voz montada do
              vídeo, como na série FALA (o fim do último silêncio de ≥ 30 ms antes dela, 26 dB abaixo do nível da
              voz), e a conferência usa outro critério (a subida da voz: ≥ 20 ms acima de −20 dB do nível dela).
              Meta: média < 40 ms, máximo < 80 ms;
  páginas     ≥ 1,5 s cada, nada fora de x 130–950 nem abaixo de y 1536, a última página de uma cena nunca com 1 palavra.

Sai com código 1 se algo falhar e a legenda estiver ligada no roteiro ("legenda": true); desligada, só avisa.
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(AQUI))
SR = 48000
PRONUNCIA = {'FAZLO': 'Fázlo', 'WhatsApp': 'Uátsap'}     # roteiro -> texto enviado à API (sem diferenciar maiúsculas)
MAX_DESTAQUE = 2                                          # palavras por trecho de destaque
PAUSA = 0.12                                              # pausa antes da palavra a partir da qual o início é medido
META_MEDIA, META_MAX = 0.040, 0.080
SUBIDA_LIM = None


class ErroLegenda(Exception):
    pass


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))


def tokens(texto):
    """as palavras de um texto: separadas por espaço; pedaços sem letra nem número (—, …) não contam"""
    return [w for w in texto.split() if norm(w)]


def tokens_alinhamento(al):
    """as palavras do alinhamento da API: {w, t0 (1ª letra/número), t1 (fim do último)} no tempo do arquivo"""
    out, cur = [], None
    for c, a, b in zip(al['characters'] + [' '], al['character_start_times_seconds'] + [0], al['character_end_times_seconds'] + [0]):
        if c.isspace():
            if cur and norm(cur['w']):
                out.append(cur)
            cur = None
            continue
        if cur is None:
            cur = {'w': '', 't0': None, 't1': None}
        cur['w'] += c
        if c.isalnum():
            if cur['t0'] is None:
                cur['t0'] = a
            cur['t1'] = b
    return out


def pronuncia_de(w, dicionario):
    for k, v in dicionario.items():
        if norm(k) == norm(w):
            return v
    return None


def casa(frases, al, tempo, onde, dicionario=PRONUNCIA, fim=None):
    """frases do roteiro [{texto, destaque?}] + alinhamento da fala inteira -> [{texto, palavras: [{w, t0, t1, chave}]}].
    tempo(t_arquivo) leva ao tempo do vídeo (ou da âncora); fim (tempo do arquivo): nenhuma palavra passa dele."""
    rot = [(i, w) for i, f in enumerate(frases) for w in tokens(f['texto'])]
    api = tokens_alinhamento(al)
    if len(rot) != len(api):
        k = next((j for j in range(min(len(rot), len(api))) if not bate(rot[j][1], api[j]['w'], dicionario)), min(len(rot), len(api)))
        raise ErroLegenda(f'{onde}: o roteiro tem {len(rot)} palavras e o alinhamento da voz tem {len(api)}; '
                          f'a primeira diferença é na palavra {k + 1} (roteiro "{rot[k][1] if k < len(rot) else "—"}", '
                          f'voz "{api[k]["w"] if k < len(api) else "—"}"). Confira o texto do roteiro contra o da narração.')
    for j, ((_, w), a) in enumerate(zip(rot, api)):
        if not bate(w, a['w'], dicionario):
            raise ErroLegenda(f'{onde}: a palavra {j + 1} do roteiro é "{w}" e a da voz é "{a["w"]}" '
                              '(nem igual nem pelo dicionário de pronúncia). Confira o texto do roteiro contra o da narração.')
    out = [{'texto': f['texto'], 'palavras': []} for f in frases]
    for (i, w), a in zip(rot, api):
        t1 = a['t1'] if fim is None else min(a['t1'], fim)
        out[i]['palavras'].append({'w': w, 't0': round(tempo(a['t0']), 4), 't1': round(tempo(max(t1, a['t0'])), 4), 'chave': False})
    for f, src in zip(out, frases):
        marca_destaque(f, src.get('destaque'), onde)
    return out


def bate(w_rot, w_api, dicionario):
    if norm(w_rot) == norm(w_api):
        return True
    p = pronuncia_de(w_rot, dicionario)
    return p is not None and norm(p) == norm(w_api)


def marca_destaque(f, destaque, onde):
    if not destaque:
        return
    if not isinstance(destaque, str):
        raise ErroLegenda(f'{onde}: "destaque" é um trecho só (texto), não {type(destaque).__name__}')
    alvo = [norm(w) for w in tokens(destaque)]
    if not alvo or len(alvo) > MAX_DESTAQUE:
        raise ErroLegenda(f'{onde}: o destaque "{destaque}" tem {len(alvo)} palavras (de 1 a {MAX_DESTAQUE})')
    ws = [norm(w['w']) for w in f['palavras']]
    for i in range(len(ws) - len(alvo) + 1):
        if ws[i:i + len(alvo)] == alvo:
            for k in range(i, i + len(alvo)):
                f['palavras'][k]['chave'] = True
            return
    raise ErroLegenda(f'{onde}: o destaque "{destaque}" não está na frase "{f["texto"]}"')


# ------------------------------------------------------------------ sincronia: o início medido na voz montada
def envelope_db(y):
    from scipy.ndimage import uniform_filter1d
    return 20 * np.log10(np.sqrt(uniform_filter1d(y.astype(np.float64) ** 2, int(0.01 * SR)) + 1e-12))


def inicio_medido(env, lim, t_ant0, t0, t1):
    """o fim do último silêncio (≥ 30 ms, abaixo de lim) antes da palavra, procurado de t0 − 0,40 s a t0 + 0,20 s"""
    q30 = int(0.03 * SR)
    a0 = max(int((t_ant0 + 0.05) * SR), int((t0 - 0.40) * SR))
    a1 = min(len(env), int((t0 + 0.20) * SR))
    q = env[a0:a1] <= lim
    j = len(q) - 1 - int(0.10 * SR)
    while j >= q30:
        if q[j - q30:j + 1].all():
            while j + 1 < len(q) and q[j + 1]:
                j += 1
            t_on = (a0 + j + 1) / SR
            return t_on if t_ant0 + 0.05 < t_on < t1 - 0.03 else None
        j -= 1
    return None


def refina(cenas, y):
    """o início de cada palavra que vem depois de uma pausa passa a ser o medido na voz montada (o padrão da FALA: a
    marcação da API chega a errar ~0,1 s nessas palavras); devolve [(cena, palavra, marcação, medido)]"""
    env = envelope_db(y)
    lim = np.percentile(env[env > -80], 95) - 26
    out = []
    for c in cenas:
        ws = [w for f in c['frases'] for w in f['palavras']]
        for i in range(1, len(ws)):
            w, ant = ws[i], ws[i - 1]
            if w['abs0'] - ant['abs1'] < PAUSA:
                continue
            t = inicio_medido(env, lim, ant['abs0'], w['abs0'], w['abs1'])
            if t is not None:
                out.append((c['id'], w['w'], w['abs0'], t))
                d = t - w['abs0']
                w['abs0'], w['t0'] = round(t, 4), round(w['t0'] + d, 4)
    return out


def subida(y, t_ant1, t0):
    """conferência independente do refina(): onde a voz (RMS em 5 ms) passa a ficar ≥ 20 ms acima de 20 dB abaixo do
    nível dela, procurando de max(fim da palavra anterior, t0 − 0,15 s) a t0 + 0,15 s"""
    from scipy.ndimage import uniform_filter1d
    a0, a1 = int(max(t_ant1, t0 - 0.15) * SR), min(len(y), int((t0 + 0.15) * SR))
    if a1 - a0 < int(0.05 * SR):
        return None
    e = 20 * np.log10(np.sqrt(uniform_filter1d(y[a0:a1] ** 2, int(0.005 * SR)) + 1e-12))
    acima = e > SUBIDA_LIM
    q = int(0.02 * SR)
    for j in np.where(acima[1:] & ~acima[:-1])[0] + 1:
        if acima[j:j + q].all():
            return (a0 + j) / SR
    return None


def sincronia(cenas, y):
    """[(cena, palavra, t_legenda, t_audio)] das palavras depois de uma pausa, pela subida da voz"""
    global SUBIDA_LIM
    env = envelope_db(y)
    SUBIDA_LIM = np.percentile(env[env > -80], 95) - 20
    out = []
    for c in cenas:
        ws = [w for f in c['frases'] for w in f['palavras']]
        for i in range(1, len(ws)):
            w, ant = ws[i], ws[i - 1]
            if w['abs0'] - ant['abs1'] < PAUSA:
                continue
            t = subida(y, ant['abs1'], w['abs0'])
            if t is not None:
                out.append((c['id'], w['w'], w['abs0'], t))
    return out


def decodifica(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


# ------------------------------------------------------------------ Série Explica
def explica(ep):
    serie = os.path.join(REPO, 'series', 'explica')
    aud = os.path.join(serie, 'audio', ep)
    rot = json.load(open(os.path.join(serie, 'episodios', ep + '.json')))
    falas = json.load(open(os.path.join(aud, 'voz', 'falas.json')))['capitulos']
    linha = json.load(open(os.path.join(aud, 'linha.json')))
    if linha.get('provisorio'):
        raise ErroLegenda(f'{ep}: a linha do tempo é provisória (sem voz); a legenda só sai com a narração')
    cenas = []
    for n, c in enumerate(rot['capitulos']):
        F, cap = falas[f'{n:02d}'], linha['capitulos'][n]
        desloc = cap['voz_t0'] - F['inicio_da_fala']               # a fala entra inteira, deslocada (linha.py)
        frases = casa(c['fala'], F['alinhamento'], lambda t, d=desloc: t + d, f'capítulo {n:02d}', fim=F['fim_da_fala'])
        cenas.append({'id': f'{n:02d}', 'ancora': None, 'frases': frases})
    for c in cenas:
        for f in c['frases']:
            for w in f['palavras']:
                w['abs0'], w['abs1'] = w['t0'], w['t1']
    fim = linha['capitulos'][-1].get('corte_logo', [linha['duracao']] * 2)[1]   # a legenda sai com o corte da logo final
    # a voz montada do vídeo, refeita como o linha.py a monta (a "colocacao" de cada capítulo: trecho, posição, fades)
    y = np.zeros(int(round(linha['duracao'] * SR)) + SR)
    for k in linha['colocacao']:
        x = decodifica(os.path.join(aud, k['arquivo']))
        seg = x[int(round(k['de_s'] * SR)):int(round(k['ate_s'] * SR))].copy()
        k0, k1 = (int(f / 1000 * SR) for f in k['fade_ms'])
        seg[:k0] *= np.linspace(0, 1, k0)
        seg[-k1:] *= np.linspace(1, 0, k1)
        i = int(round(k['no_video_s'] * SR))
        y[i:i + len(seg)] += seg
    return {'serie': 'explica', 'episodio': ep, 'ligada': bool(rot.get('legenda', False)), 'tempo': 'video', 'fim': round(fim, 4),
            'cenas': cenas}, y, os.path.join(aud, 'legenda.json'), 'voz montada pela "colocacao" do linha.json'


# ------------------------------------------------------------------ Série "Pelos olhos do hóspede"
def acha(y, seg, desde):
    """onde o trecho seg (amostras exatas) começa em y, a partir de `desde` (até 4 s depois)"""
    n = min(len(seg), 2048)
    fim = min(len(y) - len(seg), desde + 4 * SR)
    if fim < desde:
        return None
    from numpy.lib.stride_tricks import sliding_window_view
    jan = sliding_window_view(y[desde:fim + n], n)
    cand = np.where((jan == seg[:n]).all(1))[0]
    for c in cand:
        if np.array_equal(y[desde + c:desde + c + len(seg)], seg):
            return desde + int(c)
    return None


def pelos(ep):
    serie = os.path.join(REPO, 'series', 'pelos-olhos-do-hospede')
    sys.path.insert(0, serie)
    import voz as V                                                     # só as funções de áudio (nada de API)
    rot = json.load(open(os.path.join(serie, 'episodios', ep + '.json')))
    d = os.path.join(REPO, 'reels', ep, 'audio', 'voz')
    man = {c['cena']: c for c in json.load(open(os.path.join(d, 'voz.json')))['cenas']}
    vz = json.load(open(os.path.join(d, 'voz.json')))
    V.PRONUNCIA = vz.get('pronuncia', getattr(V, 'PRONUNCIA_ANTIGA', PRONUNCIA))   # o dicionário com que o episódio foi narrado
    dic = {**PRONUNCIA, **V.PRONUNCIA}
    dest = rot.get('destaques', {})
    cenas = []
    for cena, fala in V.cenas(rot):
        partes = [fala] if isinstance(fala, str) else fala
        m = man[cena]
        dd = dest.get(cena)
        dd = [dd] if isinstance(dd, str) or dd is None else dd
        if len(dd) == 1 and len(partes) > 1:
            dd = dd + [None] * (len(partes) - 1)
        if len(dd) != len(partes):
            raise ErroLegenda(f'{ep} · {cena}: "destaques" tem {len(dd)} itens e a fala tem {len(partes)} partes')
        y_cena = None
        if len(partes) > 1:                                             # a fala emendada pelo voz.py (<cena>.wav, 16 bits)
            from scipy.io import wavfile
            y_cena = wavfile.read(os.path.join(d, m['arquivo']))[1].astype(np.int64)
        frases, pos = [], 0
        for k, texto in enumerate(partes):
            base = os.path.join(d, cena if len(partes) == 1 else f'{cena}-{k + 1}')
            meta = json.load(open(base + '.json'))
            if norm(meta.get('texto_api', '')) != norm(V.api_texto(texto)):
                raise ErroLegenda(f'{ep} · {cena}: o texto do roteiro mudou desde a narração ("{texto}"); rode o voz.py')
            fim_p = None
            if len(partes) == 1:                                        # o arquivo inteiro: t_ancora = t − ini da cena
                tempo = lambda t, i0=m['ini']: t - i0
            else:                                                       # a parte, aparada como no voz.py, achada no .wav da cena
                x = V.decodifica(base + '.mp3')
                ini, fim = V.fronteiras(x)
                a, b = max(0, int((ini - 0.03) * V.SR)), int((fim + 0.06) * V.SR)
                seg = np.round(np.clip(x[a:b], -1, 1) * 32767).astype(np.int64)
                p0 = acha(y_cena, seg, pos)
                if p0 is None:
                    raise ErroLegenda(f'{ep} · {cena}: a parte {k + 1} não foi achada em {m["arquivo"]} (o áudio mudou? rode o voz.py)')
                pos = p0 + len(seg)
                tempo = lambda t, o=(p0 - a) / V.SR, i0=m['ini']: t + o - i0
                fim_p = b / V.SR
            frases += casa([{'texto': texto, 'destaque': dd[k]}], meta['alinhamento'], tempo, f'{ep} · {cena}', dicionario=dic, fim=fim_p)
        cenas.append({'id': cena, 'ancora': f'voz:{cena}', 'frases': frases})
    # o tempo do vídeo vem dos cues (o motor põe a fala de cada cena em T.voz[cena]); a voz montada como no audio.py
    cues = json.load(open(os.path.join(REPO, 'reels', ep, 'audio', 'cues.json')))
    tv = {c['cena']: c['t'] for c in cues['cues'] if c['type'] == 'voz'}
    n = int(round(cues['duration'] * SR)) + SR
    y = np.zeros(n)
    for cena, t in tv.items():
        x = V.decodifica(os.path.join(d, man[cena]['arquivo']))
        i = int(round((t - man[cena]['ini']) * SR))
        a, b = max(0, i), min(n, i + len(x))
        y[a:b] += x[a - i:b - i]
    for c in cenas:
        for f in c['frases']:
            for w in f['palavras']:
                w['abs0'], w['abs1'] = round(tv[c['id']] + w['t0'], 4), round(tv[c['id']] + w['t1'], 4)
    # a última página: até o fim do vídeo; na leitura longa (eps. 7+), até o texto sair (T.sai do motor: fim da fala do
    # fecho + 1,0 s parado), porque depois fica só a logo
    fim = cues['duration'] if rot.get('leitura') == 'curta' else tv['fecho'] + man['fecho']['dur'] + 1.0
    return {'serie': 'pelos-olhos-do-hospede', 'episodio': ep, 'ligada': bool(rot.get('legenda', False)), 'tempo': 'ancora',
            'fim': None, 'duracao': round(fim, 4), 'cenas': cenas}, y, os.path.join(d, 'legenda.json'), 'voz das cenas posta nos cues "voz"'


# ------------------------------------------------------------------ páginas (confere.cjs) e relatório
def paginas(caminho, fim):
    r = subprocess.run(['node', os.path.join(AQUI, 'confere.cjs'), caminho, '--fim', str(fim)], capture_output=True, text=True)
    if r.returncode:
        raise ErroLegenda('confere.cjs: ' + (r.stderr or r.stdout).strip())
    return json.loads(r.stdout)


def main(serie, ep):
    leg, y, destino, origem_voz = {'explica': explica, 'pelos': pelos}[serie](ep)
    fim = leg['fim'] if leg['fim'] is not None else leg['duracao']
    ref = refina(leg['cenas'], y)
    publico = {k: v for k, v in leg.items()}
    publico['cenas'] = [{**c, 'frases': [{**f, 'palavras': [{k: v for k, v in w.items() if k not in ('abs0', 'abs1')} for w in f['palavras']]}
                                         for f in c['frases']]} for c in leg['cenas']]
    json.dump(publico, open(destino, 'w'), ensure_ascii=False, indent=1)
    # as páginas usam o tempo do vídeo: uma cópia com os tempos absolutos só para conferir
    tmp = destino.replace('.json', '.abs.json')
    absol = {**publico, 'tempo': 'video', 'cenas': [{**c, 'frases': [{**f, 'palavras': [{**{k: v for k, v in w.items() if k not in ('abs0', 'abs1')},
             't0': w['abs0'], 't1': w['abs1']} for w in f['palavras']]} for f in c['frases']]} for c in leg['cenas']]}
    json.dump(absol, open(tmp, 'w'), ensure_ascii=False)
    try:
        P = paginas(tmp, fim)
    finally:
        os.remove(tmp)
    linhas, falhas = [], []

    def ok(cond, msg):
        linhas.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
        if not cond:
            falhas.append(msg)

    nw = sum(len(f['palavras']) for c in leg['cenas'] for f in c['frases'])
    nf = sum(len(c['frases']) for c in leg['cenas'])
    linhas.append(f'{leg["serie"]} · {ep} · legenda {"LIGADA" if leg["ligada"] else "desligada"} no roteiro')
    linhas.append(f'{len(leg["cenas"])} cenas · {nf} frases · {nw} palavras · {len(P["paginas"])} páginas')
    fon = [w['w'] for c in leg['cenas'] for f in c['frases'] for w in f['palavras']
           if any(norm(v) != norm(k) and norm(w['w']) == norm(v) for k, v in PRONUNCIA.items())]
    ok(not fon, 'grafia do roteiro na tela (nenhuma grafia fonética: ' + ', '.join(sorted(set(PRONUNCIA.values()))) + ')'
       + ('' if not fon else ' · achadas: ' + ', '.join(fon)))
    marcas = [w['w'] for c in leg['cenas'] for f in c['frases'] for w in f['palavras'] if w['chave']]
    linhas.append(f'       destaque em limão: {", ".join(marcas) if marcas else "nenhum (o roteiro não tem o campo destaque)"}')
    # sincronia
    if ref:
        e0 = np.array([abs(a - b) for _, _, a, b in ref])
        linhas.append(f'       início medido na voz em {len(ref)} palavras depois de pausa (a marcação da API errava em média '
                      f'{e0.mean() * 1000:.0f} ms, no máximo {e0.max() * 1000:.0f} ms)')
    s = sincronia(leg['cenas'], y)
    if s:
        e = np.array([abs(a - b) for _, _, a, b in s])
        pior = max(s, key=lambda q: abs(q[2] - q[3]))
        ok(e.mean() < META_MEDIA and e.max() < META_MAX,
           f'sincronia com a voz montada ({origem_voz}), conferida pela subida da voz: {len(s)} palavras depois de pausa, média {e.mean() * 1000:.0f} ms, '
           f'máximo {e.max() * 1000:.0f} ms (meta < 40 / < 80) · pior: cena {pior[0]} "{pior[1]}" {(pior[2] - pior[3]) * 1000:+.0f} ms')
    else:
        linhas.append('       sincronia: nenhuma palavra depois de pausa para medir')
    # páginas
    pg = P['paginas']
    curtas = [q for q in pg if q['t1'] - q['t0'] < 1.5 - 1e-6]
    ok(not curtas, f'cada página ≥ 1,5 s na tela (a mais curta: {min(q["t1"] - q["t0"] for q in pg):.2f} s)'
       + ('' if not curtas else ' · curtas: ' + '; '.join(f'{q["cena"]} "{q["texto"]}" {q["t1"] - q["t0"]:.2f} s' for q in curtas[:5])))
    linhas.append(f'       páginas juntadas (frase curta + a seguinte, para durar ≥ 1,5 s): {P["juntadas"]}')
    sobre = [(a['t0'], b['t0']) for a, b in zip(pg, pg[1:]) if a['t1'] > b['t0'] + 1e-6]
    ok(not sobre, 'páginas nunca sobrepostas (a próxima entra em corte seco)')

    um = [q for q in P['ultimas'] if q['n'] == 1]
    ok(not um, 'a última página de cada cena tem mais de 1 palavra' + ('' if not um else ' · ' + ', '.join(q['cena'] for q in um)))
    bx = [b for q in pg for b in q['caixas']]
    x0, x1 = min(b['x0'] for b in bx), max(b['x1'] for b in bx)
    y0, y1 = min(b['y0'] for b in bx), max(b['y1'] for b in bx)
    ok(x0 >= 130 and x1 < 950, f'dentro de x 130–950 (usa x {x0:.0f}–{x1:.0f})')
    ok(y1 <= 1536, f'nunca abaixo de y 1536 (usa y {y0:.0f}–{y1:.0f}; faixa {P["faixa"][0]}–{P["faixa"][1]})')
    linhas.append('\nPÁGINAS')
    for q in pg:
        linhas.append(f'  {q["t0"]:6.2f}–{q["t1"]:6.2f} s  cena {q["cena"]:8s} {len(q["linhas"])} linha(s){" · juntada" if q["juntada"] else ""}  '
                      + ' / '.join(' '.join(('*' + w['w'] + '*') if w['chave'] else w['w'] for w in r) for r in q['linhas']))
    if s:
        linhas.append('\nSINCRONIA (palavras depois de pausa: legenda − subida da voz)')
        for cena, w, a, b in s:
            linhas.append(f'  cena {cena:8s} {a:7.3f} s  {(a - b) * 1000:+4.0f} ms  "{w}"')
    res = 'aprovado' if not falhas else f'{len(falhas)} falha(s)'
    txt = f'LEGENDA PALAVRA POR PALAVRA — {ep}\n' + '\n'.join(linhas) + f'\n\nRESULTADO: {res}\n'
    open(destino.replace('.json', '.txt'), 'w').write(txt)
    print(txt)
    print('->', os.path.relpath(destino, REPO))
    return 1 if falhas and leg['ligada'] else 0


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] not in ('explica', 'pelos'):
        raise SystemExit(__doc__)
    try:
        sys.exit(main(sys.argv[1], sys.argv[2]))
    except ErroLegenda as e:
        print('ERRO NA LEGENDA:', e, file=sys.stderr)
        sys.exit(1)
