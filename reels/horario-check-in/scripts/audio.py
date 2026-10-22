#!/usr/bin/env python3
"""Efeitos do episódio "Que horas é o check-in? Ele chegou e esperou!": o som é o da série (series/pelos-olhos-do-hospede/audio.py)."""
import os
import runpy
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.argv = [sys.argv[0], ROOT]
runpy.run_path(os.path.join(ROOT, '..', '..', 'series', 'pelos-olhos-do-hospede', 'audio.py'), run_name='__main__')
