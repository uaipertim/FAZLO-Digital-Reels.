#!/usr/bin/env python3
"""
Revisão técnica e de sincronização do vídeo final (roda depois do render).

    python3 tools/qa.py <reel>   ->  reels/<id>/output/revisao/relatorio-tecnico.txt
                                     reels/<id>/output/revisao/sincronia.txt
                                     reels/<id>/output/revisao/zonas-seguras.jpg
                                     reels/<id>/output/revisao/capa-no-feed.jpg

    Outra versão do mesmo Reel (ex.: com narração), caminhos relativos à pasta do Reel:
    python3 tools/qa.py <reel> --video output/x.mp4 --track audio/x.wav --revisao revisao-x

Técnica: formato (1080x1920, 60 fps, H.264 yuv420p, AAC 48 kHz estéreo),
duração de vídeo e áudio, loudness (-14 LUFS ±1), pico real (≤ -1 dBTP),
quadros pretos e congelados, 1º quadro com imagem, capa 1080x1920.

Sincronização, em três camadas (configuradas em "qa" no reel.json):
  1. o áudio do MP4 é o mesmo da trilha, sem deslocamento (correlação cruzada);
  2. o ataque de cada efeito-chave ("syncCues"), medido no áudio final, cai no
     instante do evento visual que o gerou (audio/cues.json);
  3. a imagem muda de fato nos golpes principais ("visualCues").

Sai com código 1 se algum item falhar.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageStat
from scipy.io import wavfile
from scipy.signal import correlate

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import reelcfg  # noqa: E402

R = reelcfg.resolve()
CFG, QA = R['cfg'], R['cfg'].get('qa', {})
FMT = CFG.get('format', {'width': 1080, 'height': 1920, 'fps': 60})


def _opt(nome):
    return sys.argv[sys.argv.index(nome) + 1] if nome in sys.argv[:-1] else None


VIDEO = os.path.join(R['root'], _opt('--video')) if _opt('--video') else R['video']
TRACK = os.path.join(R['root'], _opt('--track')) if _opt('--track') else R['track']
COVER = R['cover']
OUT = os.path.join(R['root'], 'output', _opt('--revisao') or 'revisao')
ZONES = reelcfg.safe_zones()
os.makedirs(OUT, exist_ok=True)
if not os.path.exists(VIDEO):
    raise SystemExit(f'{VIDEO} não existe: renderize o vídeo antes')
CUES = json.load(open(R['cues'])) if os.path.exists(R['cues']) else {'cues': [], 'sections': {}}
DMIN, DMAX = QA.get('duration', [5, 90])
LUFS = QA.get('lufs', -14)

report, fails = [], []


def ok(cond, msg, rep=report):
    rep.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


# ---------------------------------------------------------------- formato
info = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO]).stdout)
v = next(s for s in info['streams'] if s['codec_type'] == 'video')
a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
num, den = map(int, v['r_frame_rate'].split('/'))
fps = num / den
vd = float(v['duration'])
size_mb = int(info['format']['size']) / 1e6
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p', f"vídeo {v['codec_name']} {v.get('profile', '')} {v['pix_fmt']}")
ok((int(v['width']), int(v['height'])) == (FMT['width'], FMT['height']), f"resolução {v['width']}x{v['height']} (9:16)")
ok(abs(fps - FMT['fps']) < 0.01, f'{fps:.0f} fps, {v.get("nb_frames", "?")} quadros')
ok(DMIN <= vd <= DMAX, f'duração do vídeo {vd:.3f} s (alvo {DMIN}–{DMAX} s)')
ok(size_mb < 100, f'arquivo {size_mb:.1f} MB, {int(info["format"]["bit_rate"]) / 1e6:.1f} Mb/s')
ok(a is not None, 'faixa de áudio presente')
if a is not None:
    ad = float(a['duration'])
    ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and int(a['channels']) == 2,
       f"áudio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canais, {int(a.get('bit_rate', 0)) // 1000} kb/s")
    ok(abs(vd - ad) < 0.05, f'vídeo e áudio com a mesma duração (Δ {abs(vd - ad) * 1000:.0f} ms)')
    e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
    summ = e[e.rindex('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
    LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
    ok(LUFS - 1 <= I <= LUFS + 1, f'loudness integrado {I:.1f} LUFS (alvo {LUFS})')
    ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (limite -1)')
    report.append(f'       faixa de loudness (LRA) {LRA:.1f} LU')

bd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'blackdetect=d=0.1:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)
ok(not blacks, 'sem trechos pretos ≥ 0,1 s' + ('' if not blacks else ': ' + ', '.join(f'{float(s):.2f}–{float(t):.2f}s' for s, t in blacks)))
fz = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'freezedetect=n=-60dB:d=0.75', '-an', '-f', 'null', '-']).stderr
freezes = re.findall(r'freeze_start: ([\d.]+)', fz)
ok(not freezes, 'sem imagem congelada ≥ 0,75 s' + ('' if not freezes else ': a partir de ' + ', '.join(f'{float(s):.2f}s' for s in freezes)))

# ---------------------------------------------------------------- sincronização
sync, sync_det = [], []
SR = 48000
if a is not None and os.path.exists(TRACK):
    with tempfile.TemporaryDirectory() as tmp:
        m = os.path.join(tmp, 'm.wav')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', VIDEO, '-vn', '-ac', '1', '-ar', str(SR), m])
        x = wavfile.read(m)[1].astype(float)
        y = wavfile.read(TRACK)[1].astype(float)
        y = y.mean(axis=1) if y.ndim == 2 else y

        # 1) o MP4 carrega a trilha sem deslocamento (janelas de 1 s em 3 pontos)
        anchors = sorted(t for t in set(CUES.get('sections', {}).values()) if t < vd - 1)[:3]
        anchors = anchors if len(anchors) == 3 else [0.0, vd * 0.5, max(0.0, vd - 2.5)]
        lags = []
        for t0 in anchors:
            i = int(t0 * SR)
            a_, b_ = x[max(0, i - 2400): i + SR], y[max(0, i - 2400): i + SR]
            if np.abs(b_).max() < 1:
                continue
            c = correlate(a_, b_, mode='full', method='fft')
            lags.append((c.argmax() - (len(b_) - 1)) / (SR / 1000))
        ok(bool(lags) and max(abs(l) for l in lags) <= 2,
           'áudio do MP4 = trilha, sem deslocamento (' + ', '.join(f'{l:+.1f}' for l in lags) + ' ms)', sync)

        # 2) ataque medido no áudio (fluxo espectral) x instante do evento visual
        keys = set(QA.get('syncCues', []))
        if keys:
            PAD, hop = 4800, 120                                   # 0,1 s de silêncio antes; passo de 2,5 ms
            frames = np.lib.stride_tricks.sliding_window_view(np.concatenate([np.zeros(PAD), x]), 1024)[::hop]
            spec = np.abs(np.fft.rfft(frames * np.hanning(1024), axis=1))
            flux = np.maximum(0, np.diff(np.log1p(spec), axis=0)).sum(axis=1)
            ft = ((np.arange(len(flux)) + 1) * hop - PAD) / SR + 1024 / SR / 2
            offs = []
            for cu in CUES['cues']:
                if cu['type'] not in keys:
                    continue
                w = (ft > cu['t'] - 0.05) & (ft < cu['t'] + 0.05)
                k = np.argmax(np.where(w, flux, -1))
                offs.append((cu['type'], cu['t'], (ft[k] - cu['t']) * 1000))
            if offs:
                worst = max(abs(o) for *_, o in offs)
                ok(worst <= 17, f'{len(offs)} efeitos-chave com ataque no instante do evento (desvio médio '
                   f'{np.mean([abs(o) for *_, o in offs]):.1f} ms, máximo {worst:.1f} ms; 1 quadro = 16,7 ms)', sync)
                sync_det += [f'         {t0:7.3f} s  {ty:10s}  áudio {o:+6.1f} ms' for ty, t0, o in offs]
            else:
                ok(False, 'nenhum cue de "syncCues" encontrado em audio/cues.json', sync)

        # 3) a imagem reage nos golpes principais: pico de diferença entre quadros
        vkeys = set(QA.get('visualCues', []))
        if vkeys:
            raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', VIDEO, '-vf', 'scale=135:240,format=gray', '-f', 'rawvideo', '-'],
                                 capture_output=True).stdout
            vf = np.frombuffer(raw, np.uint8).reshape(-1, 240, 135).astype(float)
            diff = np.abs(np.diff(vf, axis=0)).mean(axis=(1, 2))   # diff[i] = quadro i+1 - quadro i
            vis = []
            for cu in CUES['cues']:
                i0 = int(round(cu['t'] * fps))
                if cu['type'] not in vkeys or i0 < 20:            # sem "antes" para comparar no início
                    continue
                win = diff[max(0, i0 - 4): i0 + 8]
                base = np.median(diff[max(0, i0 - 60): max(1, i0 - 10)])
                vis.append((cu['type'], cu['t'], float(win.max()), float(base), int(np.argmax(win) + max(0, i0 - 4) + 1 - i0)))
            good = [r for r in vis if r[2] > 1.5 * r[3] + 0.5]
            ok(len(good) == len(vis), f'a imagem reage em {len(good)}/{len(vis)} golpes principais (pico de movimento a ≤ 8 quadros do som)', sync)
            sync_det += [f'         {t0:7.3f} s  {ty:10s}  imagem: movimento {pk:5.1f} (antes {b:4.1f}), pico a {df:+d} quadro(s)'
                         for ty, t0, pk, b, df in vis]
else:
    sync.append('—      sem trilha (audio/trilha.wav): sincronização não verificada')

# ---------------------------------------------------------------- zonas seguras + capa
font = reelcfg.font(26)


def grab(t, path):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', VIDEO, '-frames:v', '1', path], check=True)
    return Image.open(path).convert('RGB')


CHECK_T = QA.get('checkTimes') or [round(vd * (i + 0.5) / 12, 2) for i in range(12)]
with tempfile.TemporaryDirectory() as tmp:
    lum = ImageStat.Stat(grab(0, os.path.join(tmp, 'f0.png')).convert('L')).mean[0]
    ok(lum > 3, f'o 1º quadro já tem imagem (luminância média {lum:.1f}), sem abertura preta')
    TW, TH, COLS = 360, 640, 6
    rows = (len(CHECK_T) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * (TW + 10) + 10, rows * (TH + 44) + 10), (40, 40, 40))
    dr = ImageDraw.Draw(sheet)
    for i, t in enumerate(CHECK_T):
        im = grab(t, os.path.join(tmp, f'{i}.png')).convert('RGBA')
        ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        for z in ZONES['zones']:
            d.rectangle(z['rect'], fill=(255, 40, 80, 70), outline=(255, 40, 80, 255), width=4)
        im = Image.alpha_composite(im, ov).convert('RGB').resize((TW, TH), Image.LANCZOS)
        x0, y0 = 10 + (i % COLS) * (TW + 10), 10 + (i // COLS) * (TH + 44)
        sheet.paste(im, (x0, y0))
        dr.text((x0, y0 + TH + 8), f'{t:05.2f}s', font=font, fill=(235, 235, 235))
    sheet.save(os.path.join(OUT, 'zonas-seguras.jpg'), quality=88)

if os.path.exists(COVER):
    cv = Image.open(COVER).convert('RGB')
    ok(cv.size == (FMT['width'], FMT['height']), f'capa {cv.size[0]}x{cv.size[1]}')
    x0, y0, x1, y1 = ZONES['feedCrop3x4']
    prev = Image.new('RGB', (1080 + 40 + 810, 1920), (24, 24, 24))
    prev.paste(cv, (0, 0))
    prev.paste(cv.crop((x0, y0, x1, y1)).resize((810, 1080), Image.LANCZOS), (1120, 420))
    d = ImageDraw.Draw(prev)
    d.rectangle((x0, y0, x1 - 1, y1 - 1), outline=(235, 235, 235), width=5)
    d.text((1120, 360), 'RECORTE 3:4 NO PERFIL', font=font, fill=(235, 235, 235))
    # opcional (reel.json qa.coverClear): áreas da capa que devem ficar livres (ícone de play, rodapé do recorte)
    clear = QA.get('coverClear') or []
    if clear:
        L = cv.convert('L')
        busy = []
        for zx0, zy0, zx1, zy1 in clear:
            px = np.asarray(L.crop((zx0, zy0, zx1, zy1)), dtype=float)
            frac = float((px > 90).mean())               # texto, logo ou desenho claro (o fundo fica bem abaixo)
            if frac > 0.002:
                busy.append(f'{zx0},{zy0}-{zx1},{zy1} ({frac * 100:.1f}% ocupado)')
            d.rectangle((zx0, zy0, zx1 - 1, zy1 - 1), outline=(255, 40, 80), width=4)
        ok(not busy, 'capa: áreas livres respeitadas (' + '; '.join(f'{a},{b2}-{c},{e}' for a, b2, c, e in clear) + ')'
           if not busy else 'capa: há conteúdo nas áreas que devem ficar livres: ' + '; '.join(busy))
        # todo o conteúdo claro da capa dentro do recorte 3:4
        full = np.asarray(L, dtype=float)
        mask = full > 90
        outside = mask.copy(); outside[y0:y1, x0:x1] = False
        ok(outside.mean() < 0.0005, f'capa: conteúdo dentro do recorte 3:4 (y {y0}–{y1})')
    prev.save(os.path.join(OUT, 'capa-no-feed.jpg'), quality=90)
else:
    ok(False, 'capa (output/capa.png) não encontrada')

name = CFG.get('id', R['id']).upper()
res = 'RESULTADO: ' + ('aprovado' if not fails else f'{len(fails)} falha(s)')
txt = [f'{name} — revisão técnica', os.path.relpath(VIDEO, R['root']), ''] + report + ['', 'Sincronização (detalhes em sincronia.txt):'] + sync + ['', res]
open(os.path.join(OUT, 'relatorio-tecnico.txt'), 'w').write('\n'.join(txt) + '\n')
open(os.path.join(OUT, 'sincronia.txt'), 'w').write('\n'.join([f'{name} — sincronização som x imagem', ''] + sync
                                                              + ['', 'Evento a evento (instante do evento visual, desvio medido):'] + sync_det) + '\n')
print('\n'.join(txt))
sys.exit(1 if fails else 0)
