"""Localiza um Reel (00, reel-00, _calibracao) e lê o seu reel.json — usado pelas ferramentas Python."""
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resolve(arg=None):
    arg = arg or (sys.argv[1] if len(sys.argv) > 1 else None)
    if not arg:
        raise SystemExit('informe o Reel: ex. 00, reel-01 ou _calibracao')
    rid = os.path.basename(arg.rstrip('/'))
    if re.fullmatch(r'\d+', rid):
        rid = f'reel-{int(rid):02d}'
    root = os.path.join(REPO, 'reels', rid)
    cfg_path = os.path.join(root, 'reel.json')
    if not os.path.exists(cfg_path):
        raise SystemExit(f'Reel não encontrado: {os.path.relpath(cfg_path, REPO)}')
    cfg = json.load(open(cfg_path))
    out = cfg.get('output', {})
    return {
        'id': rid, 'root': root, 'cfg': cfg,
        'video': os.path.join(root, out.get('video', f'output/fazlo-digital-{rid}.mp4')),
        'cover': os.path.join(root, out.get('cover', 'output/capa.png')),
        'track': os.path.join(root, 'audio', 'trilha.wav'),
        'cues': os.path.join(root, 'audio', 'cues.json'),
    }


def safe_zones():
    return json.load(open(os.path.join(REPO, 'core', 'safe-zones.json')))


def font(size):
    """Fonte para as folhas de revisão (a da marca, se houver; senão a do sistema)."""
    from PIL import ImageFont
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/Library/Fonts/Menlo.ttc', 'C:/Windows/Fonts/consolab.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size=size)
