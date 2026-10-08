# Calibração técnica do pipeline

**Não é um Reel.** Cartela neutra (8 s, 120 BPM) que exercita todo o pipeline (render quadro a quadro com motion blur, trilha sintetizada a partir dos cues, multiplexação, capa, storyboard e QA) para confirmar que o ambiente produz Reels dentro do padrão antes de qualquer produção.

```bash
npm test              # = node tools/build.cjs _calibracao
```

Esperado: `RESULTADO: aprovado` em `output/revisao/relatorio-tecnico.txt`. As saídas desta pasta não são versionadas.
