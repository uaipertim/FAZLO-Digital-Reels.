#!/usr/bin/env python3
"""
Série Explica (FAZLO Digital) — revisão técnica de um episódio (roda depois do render, da capa e de `render.cjs info`).

    python3 series/explica/scripts/qa.py explica-01  ->  output/explica-01/revisao/relatorio-tecnico.txt
                                                         output/explica-01/revisao/areas-seguras.jpg
                                                         output/explica-01/revisao/capa-no-feed.jpg

Confere:
  formato     1080×1920, 60 fps, H.264 yuv420p, AAC 48 kHz estéreo; 60–90 s; vídeo e áudio com a mesma duração;
  som         −14 LUFS integrados (±0,5) e pico real ≤ −1 dBTP medidos NO MP4 (depois do AAC);
  voz         cada capítulo é UMA geração inteira, colocada sem cortes: o trecho na narração montada é idêntico ao
              arquivo da geração (fora os fades de 8 ms / 60 ms nas pontas) e o arquivo é o registrado (sha1);
  o corte     a varredura de "o corte" soa em cada troca de capítulo, quando a barra cruza o centro (2–13 kHz);
  leitura     cada linha de apoio fica ≥ 1,5 s inteira na tela e nunca há duas ao mesmo tempo;
  áreas       (caixas do motor, a cada 0,25 s, fora das passagens) todo conteúdo entre y 265 e 1456 e fora da coluna
              de botões (x ≥ 950, y 1060–1560); (pixels, 4 quadros/s) nada aceso na coluna de botões;
  imagem      sem trechos pretos; sem imagem congelada por 1,5 s ou mais antes da logo final;
  capa        é o quadro 0; o conteúdo cabe no recorte 3:4 da grade (y 240–1680) com folga de 40 px;
  fecho       ≥ 8,5 s; os últimos 3 s são só a logo oficial, centralizada e parada.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SERIE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(SERIE))
EP = sys.argv[1] if len(sys.argv) > 1 else 'explica-01'
VIDEO = os.path.join(SERIE, 'output', EP, f'fazlo-digital-{EP}.mp4')
AUD = os.path.join(SERIE, 'audio', EP)
OUT = os.path.join(SERIE, 'output', EP, 'revisao')
LN = json.load(open(os.path.join(AUD, 'linha.json')))
MOT = json.load(open(os.path.join(OUT, 'motor.json')))
CX = json.load(open(os.path.join(OUT, 'caixas.json')))
FALAS = json.load(open(os.path.join(AUD, 'voz', 'falas.json')))['capitulos']
ZONAS = json.load(open(os.path.join(REPO, 'core', 'safe-zones.json')))
FONT = os.path.join(REPO, 'brand', 'fonts', 'sora-latin-600-normal.woff2')
SR = 48000
DUR = LN['duracao']
report, fails = [], []


def ok(cond, msg):
    report.append(('OK   ' if cond else 'FALHA') + '  ' + msg)
    if not cond:
        fails.append(msg)


def info(msg):
    report.append('       ' + msg)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def fonte(n):
    try:
        return ImageFont.truetype(FONT, n)
    except Exception:
        return ImageFont.load_default()


def quadro(t):
    with tempfile.TemporaryDirectory() as tmp:
        pth = os.path.join(tmp, 'f.png')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', VIDEO, '-frames:v', '1', pth], check=True)
        return Image.open(pth).convert('RGB')


# ---------------------------------------------------------------- formato
report.append('FORMATO')
inf = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', VIDEO]).stdout)
v = next(s for s in inf['streams'] if s['codec_type'] == 'video')
a = next(s for s in inf['streams'] if s['codec_type'] == 'audio')
fps = eval(v['r_frame_rate'])
vd, ad = float(v['duration']), float(a['duration'])
ok(v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p', f"vídeo {v['codec_name']} {v.get('profile', '')} {v['pix_fmt']}")
ok((int(v['width']), int(v['height'])) == (1080, 1920), f"resolução {v['width']}×{v['height']} (9:16)")
ok(abs(fps - 60) < 0.01, f'{fps:.0f} fps, {v.get("nb_frames", "?")} quadros')
ok(60 <= vd <= 90, f'duração {vd:.2f} s (alvo 60–90 s)')
ok(a['codec_name'] == 'aac' and int(a['sample_rate']) == 48000 and int(a['channels']) == 2, f"áudio {a['codec_name']} {a['sample_rate']} Hz, {a['channels']} canais, {int(a.get('bit_rate', 0)) // 1000} kb/s")
ok(abs(vd - ad) < 0.05, f'vídeo e áudio com a mesma duração (Δ {abs(vd - ad) * 1000:.0f} ms)')
info(f'arquivo {int(inf["format"]["size"]) / 1e6:.1f} MB, {int(inf["format"]["bit_rate"]) / 1e6:.1f} Mb/s')
caps = LN['capitulos']
durs = [(c['n'], c['rotulo'], c['t1'] - (c['corte'][0] if c['corte'] else 0)) for c in caps]
info('capítulos (do início do corte de entrada ao início do corte seguinte): ' + ' · '.join(f'{n:02d} {d:.1f} s' for n, _, d in durs))

# ---------------------------------------------------------------- som
report += ['', 'SOM (medido no MP4, depois do AAC)']
e = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
summ = e[e.rindex('Summary:'):]
I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
ok(-14.5 <= I <= -13.5, f'loudness integrado {I:.1f} LUFS (alvo −14)')
ok(TP <= -1.0, f'pico real {TP:.1f} dBTP (limite −1)')
for nome, rot in (('voz-tratada', 'a voz sozinha'), ('trilha', 'a trilha sozinha (com ducking)'), ('efeitos', 'os efeitos sozinhos')):
    f = os.path.join(AUD, nome + '.wav')
    if os.path.exists(f):
        ev = run(['ffmpeg', '-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-']).stderr
        info(f'{rot}, na escala da mixagem: {float(re.search(r"I:\s+(-?[\d.]+) LUFS", ev[ev.rindex("Summary:"):]).group(1)):.1f} LUFS')

# ---------------------------------------------------------------- voz
report += ['', 'VOZ (uma geração inteira por capítulo, nada emendado)']
voz = wavfile.read(os.path.join(AUD, 'voz.wav'))[1].astype(np.float64)


def decodifica(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


for c in LN['colocacao']:
    key = f'{c["cap"]:02d}'
    arq = os.path.join(AUD, c['arquivo'])
    sha_ok = hashlib.sha1(open(arq, 'rb').read()).hexdigest() == FALAS[key]['sha1_audio']
    y = decodifica(arq)
    seg = y[int(round(c['de_s'] * SR)):int(round(c['ate_s'] * SR))]
    i = int(round(c['no_video_s'] * SR))
    k0, k1 = int(0.008 * SR), int(0.06 * SR)
    got, ref = voz[i + k0:i + len(seg) - k1], seg[k0:len(seg) - k1]
    dif = float(np.abs(got - ref).max()) if len(got) == len(ref) else 9.0
    F = FALAS[key]
    h = F['historico'][-1] if F['historico'] else {}
    ok(sha_ok and dif < 1e-4 and F.get('aprovada', True),
       f'capítulo {key}: {c["ate_s"] - c["de_s"]:.2f} s contínuos da geração com semente {F["semente"]} '
       f'({F["geracoes"]} geração(ões) inteira(s); arquivo íntegro: {"sim" if sha_ok else "NÃO"}; diferença máx. {dif:.1e})')
    info(f'  ritmo {h.get("ritmo_letras_s")} letras/s · respiros entre frases {h.get("respiros_s")} s · maior pausa {h.get("maior_pausa_s")} s · '
         f'fim: queda {h.get("queda_final_ms")} ms, altura final {h.get("altura_final")}'
         + (f' · perguntas sobem {h.get("perguntas_sobem")}' if h.get('perguntas_sobem') else '')
         + (f' · transcrição {h["transcricao"]["palavras_batem"]:.0%}' if h.get('transcricao') else ''))

# ---------------------------------------------------------------- "o corte" em cada troca
report += ['', 'SINCRONIA']
fx_path = os.path.join(AUD, 'efeitos.wav')
if os.path.exists(fx_path):
    fx = wavfile.read(fx_path)[1].astype(np.float64).mean(axis=1)
    bp = sosfilt(butter(4, [2000, 13000], 'band', fs=SR, output='sos'), fx)
    env = np.sqrt(np.convolve(bp ** 2, np.ones(240) / 240, mode='same'))
    atrasos = []
    for x in MOT['trocas']:
        meio = (x['t0'] + x['t1']) / 2
        a0, a1 = int((meio - 0.35) * SR), int((meio + 0.35) * SR)
        w = env[a0:a1]
        atrasos.append(round((a0 + int(np.argmax(w))) / SR - meio, 3))
    ok(all(abs(d) <= 0.15 for d in atrasos), f'"o corte" soa quando a barra cruza o centro da tela, nas {len(atrasos)} trocas (desvio máx. {max(abs(d) for d in atrasos) * 1000:.0f} ms)')

# ---------------------------------------------------------------- leitura
report += ['', 'LEITURA (linhas de apoio)']
curtas, sobrepostas = [], []
aps = sorted(MOT['apoios'], key=lambda x: x['t'])
for i, ap in enumerate(aps):
    tempo = ap['ate'] - ap['inteira_de']
    if tempo < 1.5 - 1e-3:
        curtas.append(ap)
    if i + 1 < len(aps) and aps[i + 1]['cap'] == ap['cap'] and aps[i + 1]['t'] < ap['ate'] + 0.2 - 1e-3:
        sobrepostas.append(ap)
    info(f'cap {ap["cap"]:02d} · apoio {ap["i"] + 1}: {tempo:4.2f} s inteira · "{ap["texto"]}"')
ok(not curtas, f'{len(aps)} linhas de apoio; a mais curta fica {min(ap["ate"] - ap["inteira_de"] for ap in aps):.2f} s inteira na tela (mínimo 1,5 s)')
ok(not sobrepostas, 'nunca duas linhas de apoio ao mesmo tempo (a anterior sai antes de a próxima entrar)')

# ---------------------------------------------------------------- áreas seguras
report += ['', 'ÁREAS SEGURAS']
passagens = [(x['t0'] - 0.05, x['t1'] + 0.05) for x in MOT['trocas']] + [(m['voo'][0] - 0.05, m['voo'][1] + 0.05) for m in MOT['montagens'] if m['voo']]
f_ = MOT['fecho']
passagens.append((f_['corte_logo'][0] - 0.05, f_['corte_logo'][1] + 0.05))
em_passagem = lambda t: any(a <= t <= b for a, b in passagens)
fora, botao, n_cx, n_t = [], [], 0, 0
for s in CX:
    if em_passagem(s['t']):
        continue
    n_t += 1
    for b in s['caixas']:
        n_cx += 1
        if b['y0'] < 265 - 0.5 or b['y1'] > 1456 + 0.5:
            fora.append((s['t'], b))
        if b['x1'] > 950 and b['y1'] > 1060 and b['y0'] < 1560:
            botao.append((s['t'], b))
ok(not fora, f'conteúdo importante entre y 265 e 1456: {n_cx} caixas em {n_t} quadros' + ('' if not fora else ' · fora: ' + '; '.join(f'{t:.2f}s {b["nome"]} y {b["y0"]:.0f}–{b["y1"]:.0f}' for t, b in fora[:6])))
ok(not botao, 'nenhuma caixa na coluna de botões (x ≥ 950, y 1060–1560)' + ('' if not botao else ': ' + '; '.join(f'{t:.2f}s {b["nome"]}' for t, b in botao[:6])))
ys = [b['y0'] for s in CX if not em_passagem(s['t']) for b in s['caixas']] + [b['y1'] for s in CX if not em_passagem(s['t']) for b in s['caixas']]
xs = [b['x1'] for s in CX if not em_passagem(s['t']) for b in s['caixas']]
info(f'faixa usada pelo conteúdo: y {min(ys):.0f}–{max(ys):.0f}, x até {max(xs):.0f}')
proc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', VIDEO, '-vf', 'fps=4,format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
n_fr, n_but, f0 = 0, 0, None
while True:
    buf = proc.stdout.read(1920 * 1080)
    if len(buf) < 1920 * 1080:
        break
    f = np.frombuffer(buf, np.uint8).reshape(1920, 1080)
    if f0 is None:
        f0 = f.copy()
    tq = n_fr / 4
    if not em_passagem(tq):
        n_but += int((f[1060:1560, 950:1080] > 90).sum())
    n_fr += 1
proc.wait()
ok(n_but == 0, f'coluna de botões: {n_but} pixel aceso em {n_fr} quadros amostrados (fora das passagens da barra)')

# ---------------------------------------------------------------- imagem
report += ['', 'IMAGEM']
bd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'blackdetect=d=0.1:pix_th=0.04', '-an', '-f', 'null', '-']).stderr
ok(not re.findall(r'black_start', bd), 'sem trechos pretos')
fz = run(['ffmpeg', '-hide_banner', '-nostats', '-i', VIDEO, '-vf', 'freezedetect=n=-60dB:d=1.5', '-an', '-f', 'null', '-']).stderr
congel = [float(x) for x in re.findall(r'freeze_start: ([\d.]+)', fz)]
antes_logo = [x for x in congel if x < f_['corte_logo'][0]]       # do corte da logo em diante a imagem para de propósito
ok(not antes_logo, 'sem imagem congelada por 1,5 s ou mais antes da logo final (o fundo e o cursor seguem vivos)' + ('' if not antes_logo else ': ' + ', '.join(f'{x:.2f} s' for x in antes_logo)))

# ---------------------------------------------------------------- capa
report += ['', 'CAPA']
capa = Image.open(os.path.join(SERIE, 'output', EP, 'capa.png')).convert('RGB')
mse = float(np.mean((np.asarray(capa.convert('L')).astype(float) - f0.astype(float)) ** 2))
psnr = 99.0 if mse == 0 else 10 * np.log10(255 ** 2 / mse)
ok(psnr > 34, f'a capa é o quadro 0 do vídeo (PSNR {psnr:.1f} dB entre capa.png e o 1º quadro)')
cb = json.load(open(os.path.join(OUT, 'capa-caixas.json')))
x0c, y0c, x1c, y1c = ZONAS['feedCrop3x4']
blk = [b for b in cb if b['nome'] != 'marca' and b['y1'] > 0]
topo, base = min(b['y0'] for b in blk), max(b['y1'] for b in blk)
ok(topo >= y0c + 40 and base <= y1c - 40, f'conteúdo da capa em y {topo:.0f}–{base:.0f}, dentro do recorte 3:4 (y {y0c}–{y1c}) com folga ≥ 40 px')
info(f'centro do bloco da capa em y {(topo + base) / 2:.0f} (centro do recorte: {(y0c + y1c) / 2:.0f}); marca em y {min(b["y0"] for b in cb if b["nome"] == "marca"):.0f}')
# folha da capa no feed: o quadro inteiro com o recorte 3:4 marcado + o recorte como aparece na grade (3 colunas)
im = capa.copy().convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
d.rectangle((0, 0, 1079, y0c - 1), fill=(255, 40, 80, 70)); d.rectangle((0, y1c, 1079, 1919), fill=(255, 40, 80, 70))
d.rectangle((x0c, y0c, x1c - 1, y1c - 1), outline=(198, 250, 65, 255), width=6)
full = Image.alpha_composite(im, ov).convert('RGB').resize((405, 720), Image.LANCZOS)
crop = capa.crop((x0c, y0c, x1c, y1c)).resize((360, 480), Image.LANCZOS)
sheet = Image.new('RGB', (405 + 40 + 3 * 362, 760), (24, 24, 24))
sheet.paste(full, (10, 30))
for k in range(3):
    tile = crop if k == 1 else Image.new('RGB', (360, 480), (44, 44, 44))
    sheet.paste(tile, (405 + 30 + k * 362, 150))
dr = ImageDraw.Draw(sheet)
dr.text((10, 4), 'capa inteira (fora do recorte 3:4 em vermelho)', font=fonte(18), fill=(220, 220, 220))
dr.text((445, 120), 'como aparece na grade do perfil (3:4)', font=fonte(18), fill=(220, 220, 220))
sheet.save(os.path.join(OUT, 'capa-no-feed.jpg'), quality=90)

# ---------------------------------------------------------------- fecho
report += ['', 'FECHO']
fecho = caps[-1]
dur_fecho = DUR - fecho['corte'][0]
ok(dur_fecho >= 8.5, f'fecho de {dur_fecho:.2f} s, do corte de entrada ao fim (mínimo 8,5 s): título + chamado + logo')
lp = f_['logo_parada']
ok(abs((DUR - lp[0]) - 3.0) < 0.02, f'a logo fica sozinha e parada nos últimos {DUR - lp[0]:.2f} s (de {lp[0]:.2f} s ao fim)')
t_fim = min(DUR, vd) - 0.1                       # o último quadro que o ffmpeg acha com folga (busca perto do fim falha)
fa, fb = np.asarray(quadro(lp[0] + 0.05)).astype(float), np.asarray(quadro(t_fim)).astype(float)
ok(np.abs(fa - fb).mean() < 0.5, f'a logo não se mexe entre {lp[0] + 0.05:.2f} s e {t_fim:.2f} s (diferença média {np.abs(fa - fb).mean():.2f} de 255)')
lb = next(b for b in CX[-1]['caixas'] if b['nome'] == 'logo final')
cx_, cy_ = (lb['x0'] + lb['x1']) / 2, (lb['y0'] + lb['y1']) / 2
fora_logo = fb.mean(axis=2).copy()
fora_logo[int(lb['y0']) - 6:int(lb['y1']) + 6, int(lb['x0']) - 6:int(lb['x1']) + 6] = 0
ok(abs(cx_ - 540) < 1 and fora_logo.max() < 40, f'só a logo oficial na tela, centralizada (centro em x {cx_:.0f}, y {cy_:.0f}); nada aceso fora dela (máx. {fora_logo.max():.0f})')

# ---------------------------------------------------------------- folha das áreas seguras
mont = MOT['montagens']
CHECK_T = [0.0] + [round(m['voo'][0] - 0.3, 2) for m in mont if m['voo']] + [round(f_['corte_logo'][0] - 0.3, 2), round(min(DUR, vd) - 0.15, 2)]
TW, TH, COLS = 300, 533, 6
rows = (len(CHECK_T) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * (TW + 10) + 10, rows * (TH + 44) + 10), (40, 40, 40))
dr = ImageDraw.Draw(sheet)
for i, t in enumerate(CHECK_T):
    im = quadro(t).convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.rectangle((950, 1060, 1079, 1559), fill=(255, 40, 80, 70), outline=(255, 40, 80, 255), width=4)
    d.rectangle((0, 0, 1079, 264), fill=(255, 40, 80, 50)); d.rectangle((0, 1457, 1079, 1919), fill=(255, 40, 80, 40))
    im = Image.alpha_composite(im, ov).convert('RGB').resize((TW, TH), Image.LANCZOS)
    x0, y0 = 10 + (i % COLS) * (TW + 10), 10 + (i // COLS) * (TH + 44)
    sheet.paste(im, (x0, y0)); dr.text((x0, y0 + TH + 8), f'{t:05.2f} s', font=fonte(24), fill=(198, 250, 65))
sheet.save(os.path.join(OUT, 'areas-seguras.jpg'), quality=88)

res = 'RESULTADO: ' + ('aprovado' if not fails else f'{len(fails)} falha(s)')
txt = [f'SÉRIE EXPLICA · {EP} — revisão técnica', os.path.relpath(VIDEO, REPO), ''] + report + ['', res]
open(os.path.join(OUT, 'relatorio-tecnico.txt'), 'w').write('\n'.join(txt) + '\n')
print('\n'.join(txt))
sys.exit(1 if fails else 0)
