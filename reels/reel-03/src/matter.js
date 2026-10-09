/* =====================================================================
   FAZLO Digital — Reel 003 · MATÉRIA

   Renderizador da "matéria" do Reel 003, em WebGL2 (fragment shaders),
   desenhado num canvas próprio e copiado para o quadro 2D do motor.

   A matéria é um CAMPO DE DISTÂNCIA (SDF) num plano no espaço 3D:
     - palavras (glifos rasterizados -> distância euclidiana, num atlas),
       com transição contínua entre duas palavras (morph do campo);
     - gotas (metabolas: união suave de círculos);
     - a barra da logo (paralelogramo analítico) e a logo inteira (atlas);
     - ruído que faz o líquido "ferver".

   Ela tem três estados, que se misturam por pixel (frentes que varrem a forma):
     LÍQUIDO   lima brilhante, relevo arredondado, ondula e se funde;
     PROJETO   só as curvas de nível do campo (linhas técnicas);
     SÓLIDO    relevo com chanfro nítido, faces planas, reflexo duro.

   Dois passes por subquadro:
     1. campo   (meia resolução)  d, ∂d/∂x, ∂d/∂y em RGBA16F;
     2. luz     (resolução cheia) cobertura com antisserrilhado exato, relevo,
                normais, reflexo de estúdio, fresnel, brilho interno, curvas
                de nível, sombra de contato e fundo.
   ===================================================================== */
(function () {
  'use strict';

  const VS = `#version 300 es
in vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

  // ------------------------------------------------------------------ comum aos dois passes
  const COMMON = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform vec2 uScreen;          // 1080x1920
uniform mat3 uHom;             // homografia tela (px, centrada, y para baixo) -> plano
uniform vec2 uPan;             // deslocamento no plano
uniform float uTime;
uniform vec3 uRU, uRV, uRN;    // eixos do plano no mundo (U = direita, V = para cima, N = normal)
uniform float uFocal;

// ponto do plano visto no pixel s; w = 0 se o raio não atinge o plano
vec3 planeAt(vec2 s) {
  vec3 hp = uHom * vec3(s, 1.0);
  if (hp.z <= 1e-7) return vec3(0.0);
  return vec3(hp.xy / hp.z + uPan, 1.0);
}
`;

  // ------------------------------------------------------------------ passe 1: campo
  const FS_FIELD = COMMON + `
uniform vec2 uRes;
uniform sampler2D uAtlas; uniform vec2 uAtlasSize;
uniform vec4 uSlotA, uSlotB;   // retângulo no atlas (texels): x, y, w, h
uniform vec4 uPlaceA, uPlaceB; // centro no plano (x, y), escala (px de plano por texel), ligado (0/1)
uniform float uMorph;          // 0 = A, 1 = B
uniform float uWordOn;         // 0..1: dissolve a palavra (empurra o campo para fora)
uniform float uErode;          // quanto a palavra encolhe quando uWordOn = 0 (px)
uniform vec4 uBlob[40]; uniform int uNB; uniform float uBK;
uniform float uWB;             // união suave palavra x gotas
uniform vec4 uSlash;           // cx, cy, altura, ligado (paralelogramo da barra)
uniform vec4 uSlash2;          // largura relativa, raio do canto, 0, 0
uniform sampler2D uNoise;
uniform vec4 uNoiseP;          // amplitude, escala, velocidade, 0
uniform vec4 uRing;            // anel de impacto: cx, cy, raio, espessura
uniform vec4 uFront;           // frente de solidificação: dir.x, dir.y, posição, largura
uniform float uSolid;          // nível global de solidez (0 líquido .. 1 sólido)
uniform float uCells;          // 0..1: a forma se parte em células (módulos)
uniform vec2 uCellOff;         // deslocamento das células (px): espalhamento, desnível
uniform float uCellT;          // 0..1: progresso do encaixe das peças
uniform float uUnion;          // 1 = as duas palavras juntas (em vez de transição)
uniform float uWordSolid;      // solidez extra só da palavra (gotas seguem líquidas)
out vec4 oF;

float smin(float a, float b, float k) {
  if (k <= 0.0) return min(a, b);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float wordD(vec2 p, vec4 slot, vec4 place) {
  vec2 q = (p - place.xy) / place.z;
  vec2 hs = slot.zw * 0.5;
  vec2 e = abs(q) - (hs - 1.5);
  float outside = length(max(e, 0.0));
  vec2 uv = (slot.xy + hs + clamp(q, -hs + 1.5, hs - 1.5)) / uAtlasSize;
  return (texture(uAtlas, uv).r + outside) * place.z;
}
float slashD(vec2 p) {
  const float SK = 0.966;
  vec2 q = p - uSlash.xy;
  float hh = uSlash.z * 0.5, hw = uSlash.z * uSlash2.x * 0.5;
  float u = q.x + SK * q.y;
  float dx = (abs(u) - hw) / sqrt(1.0 + SK * SK);
  float dy = abs(q.y) - hh;
  vec2 m = vec2(dx, dy) + uSlash2.y;
  return length(max(m, 0.0)) + min(max(m.x, m.y), 0.0) - uSlash2.y;
}
float solidAt(vec2 p) {
  float f = uSolid;
  if (uFront.w > 0.0) f = max(f, smoothstep(uFront.z + uFront.w, uFront.z - uFront.w, dot(p, uFront.xy)));
  return clamp(f, 0.0, 1.0);
}
float noiseAt(vec2 p) {
  vec2 a = p * uNoiseP.y;
  float t = uTime * uNoiseP.z;
  float n = texture(uNoise, a + vec2(t * 0.31, t * 0.17)).r + texture(uNoise, a * 1.7 - vec2(t * 0.23, -t * 0.29)).g * 0.5;
  return (n / 1.5 * 2.0 - 1.0) * 1.6;
}
float field(vec2 p, out float cellH, out float blobness) {
  cellH = 0.0;
  vec2 q = p;
  if (uCells > 0.0) {                                   // módulos: a forma é cortada numa grade e cada peça se desloca
    vec2 cid = floor(p / 64.0 + 0.5);
    vec2 h2 = fract(sin(vec2(dot(cid, vec2(127.1, 311.7)), dot(cid, vec2(269.5, 183.3)))) * 43758.5453) * 2.0 - 1.0;
    cellH = fract(h2.x * 7.31 + h2.y * 3.17);
    float lp = clamp((uCellT - cellH * 0.65) / 0.35, 0.0, 1.0);
    float k = 1.0 - lp; k = k * k * k;                                // cada peça chega na sua vez (saída cúbica)
    q = p - (h2 * uCellOff.x + vec2(0.0, uCellOff.y * (cellH - 0.5))) * k;
  }
  float d = 1e4;
  if (uPlaceA.w > 0.5) {
    float da = wordD(q, uSlotA, uPlaceA);
    d = da;
    if (uPlaceB.w > 0.5) { float dbw = wordD(q, uSlotB, uPlaceB); d = uUnion > 0.5 ? min(da, dbw) : mix(da, dbw, uMorph); }
    d += (1.0 - uWordOn) * uErode;
  }
  float db = 1e4;
  for (int i = 0; i < 40; i++) { if (i >= uNB) break; db = smin(db, length(q - uBlob[i].xy) - uBlob[i].z, uBK); }
  blobness = smoothstep(-24.0, 24.0, d - db);
  d = smin(d, db, uWB);
  if (uSlash.w > 0.0) d = smin(d, slashD(q) + (1.0 - uSlash.w) * 400.0, uSlash2.z);
  if (uRing.w > 0.0) d = min(d, abs(length(q - uRing.xy) - uRing.z) - uRing.w);
  if (uCells > 0.0) {
    vec2 f = p / 64.0 - floor(p / 64.0 + 0.5);
    float gap = (max(abs(f.x), abs(f.y)) - 0.5) * 64.0 + uCells * 5.0;
    d = max(d, gap);
  }
  float liq = (1.0 - solidAt(p)) * (1.0 - uWordSolid * (1.0 - blobness));
  if (uNoiseP.x > 0.0) d += noiseAt(p) * uNoiseP.x * liq;
  return d;
}
void main() {
  vec2 s = gl_FragCoord.xy / uRes * uScreen;
  s = vec2(s.x - uScreen.x * 0.5, uScreen.y * 0.5 - s.y);
  vec3 P = planeAt(s);
  if (P.z < 0.5) { oF = vec4(1e4, 0.0, 0.0, 0.0); return; }
  float ch, bn;
  float d = field(P.xy, ch, bn);
  float so = solidAt(P.xy);
  so = max(so, uWordSolid * (1.0 - bn));
  oF = vec4(d, so, ch, bn);
}
`;

// ------------------------------------------------------------------ passe 2: luz
  const FS_SHADE = COMMON + `
uniform sampler2D uField; uniform vec2 uFieldRes;
uniform vec4 uMat;      // liquid gloss, bevel líquido (px), chanfro sólido (px), exposição
uniform vec4 uProj;     // projeto: força das linhas, espaçamento, preenchimento (0..1), linhas fora
uniform vec4 uGlow;     // halo externo, brilho interno, sombra de contato, 0
uniform vec3 uBg0, uBg1;     // fundo: centro e borda
uniform vec4 uBgP;           // spot do fundo: x, y (px tela), raio, intensidade
uniform vec3 uLime;          // cor da matéria (linear)
uniform vec4 uLight;         // direção da luz principal (mundo) + intensidade
uniform vec4 uFloor;         // linhas do plano (fundo): força, espaçamento, 0, 0
uniform vec4 uSweep;         // brilho que varre a forma: dir.x, dir.y, posição, força
uniform vec4 uWave;          // ondas nas curvas de nível: raio 1, raio 2, largura, força
uniform vec4 uBuild;         // construção: dir.x, dir.y, posição, liga
uniform float uFar;          // além desta distância, só fundo
out vec4 oC;

vec3 envLight(vec3 r, float sharp) {
  // estúdio: softbox grande acima/frente, duas réguas laterais e um contra-luz baixo
  float k = mix(0.82, 0.93, sharp);
  float top = smoothstep(k, k + 0.035, dot(r, normalize(vec3(-0.35, 0.75, 0.6)))) * 1.9;
  float sL = smoothstep(k + 0.02, k + 0.045, dot(r, normalize(vec3(-0.9, 0.05, 0.45)))) * 1.3;
  float sR = smoothstep(k + 0.04, k + 0.06, dot(r, normalize(vec3(0.85, 0.25, 0.45)))) * 0.9;
  float low = smoothstep(0.6, 1.0, dot(r, normalize(vec3(0.2, -0.8, 0.5)))) * 0.25;
  float amb = 0.04 + 0.05 * clamp(r.y, 0.0, 1.0);
  return vec3(top + sL + sR + amb) + vec3(0.55, 0.95, 0.1) * low;
}

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 s = vec2(fc.x - uScreen.x * 0.5, uScreen.y * 0.5 - fc.y);
  // fundo: preto profundo com um foco de luz suave
  vec2 bq = (vec2(fc.x, uScreen.y - fc.y) - uBgP.xy) / vec2(uBgP.z, uBgP.z * 1.15);
  float rb2 = dot(bq, bq);
  vec3 bg = mix(uBg0, uBg1, clamp(rb2, 0.0, 1.0)) + uBg0 * uBgP.w * exp(-rb2 * 2.0);
  vec3 hp = uHom * vec3(s, 1.0);
  if (hp.z <= 1e-7) { oC = vec4(sqrt(bg), 1.0); return; }
  vec2 tuv = fc / uScreen;
  vec4 F = texture(uField, tuv);
  float d = F.r;
  if (d > uFar) { oC = vec4(sqrt(bg), 1.0); return; }        // longe da matéria: só o fundo
  vec2 p0 = hp.xy / hp.z, p = p0 + uPan;
  vec2 px1 = (uHom[0].xy - p0 * uHom[0].z) / hp.z, py1 = (uHom[1].xy - p0 * uHom[1].z) / hp.z;
  float aa = max(length(px1), length(py1));                  // px de plano por px de tela
  float sol = F.g;
  float liq = 1.0 - sol;

  // ---------------- fundo do plano: curvas de nível do campo (aura técnica), ondas, sombra e halo
  vec3 col = bg;
  float spacing = uProj.y;
  float iso = abs(fract(d / spacing + 0.5) - 0.5) * spacing;
  float isoL = 1.0 - smoothstep(aa * 0.45, aa * 1.35, iso);
  float dpos = max(d, 0.0), outside = step(0.0, d);
  float outsideFade = exp(-dpos / (spacing * 6.0));
  float wf = mix(uProj.z, 1.0, F.a);                                   // halo e sombra só onde a matéria está preenchida
  float wave = 0.0;
  if (uWave.w > 0.0) { float w1 = (d - uWave.x) / uWave.z, w2 = (d - uWave.y) / uWave.z; wave = uWave.w * (exp(-w1 * w1) + exp(-w2 * w2) * 0.6); }
  float floorLines = isoL * (outsideFade * uProj.w + wave) * outside;
  col += mix(vec3(0.12, 0.14, 0.16), uLime, clamp(wave, 0.0, 1.0)) * floorLines;
  col *= 1.0 - uGlow.z * exp(-dpos / 28.0) * outside * wf;                 // sombra de contato
  col += uLime * uGlow.x * exp(-dpos / 42.0) * liq * outside * 0.6 * wf;   // halo do líquido

  if (d < aa * 1.5) {
    // ---------------- relevo (só perto e dentro da matéria)
    vec2 tx = vec2(1.0 / uFieldRes.x, 0.0), ty = vec2(0.0, 1.0 / uFieldRes.y);
    float S = uScreen.x / uFieldRes.x;
    vec2 gs = vec2(texture(uField, tuv + tx).r - texture(uField, tuv - tx).r,
                   -(texture(uField, tuv + ty).r - texture(uField, tuv - ty).r)) / (2.0 * S);
    vec2 g = inverse(mat2(px1.x, py1.x, px1.y, py1.y)) * gs;
    float x = max(-d, 0.0);
    float Rl = mix(uMat.y, max(uMat.y, 80.0), F.a), C = uMat.z;      // gotas: cúpula (o reflexo vira um ponto de luz)
    float xl = clamp(x / Rl, 0.0, 1.0), ix = 1.0 - xl;
    float sLiq = ix * inversesqrt(max(1.0 - ix * ix, 0.033));
    float sSol = 1.15 * (1.0 - smoothstep(C - aa, C + aa, x));
    float slope = mix(sLiq, sSol, sol);
    vec3 nP = normalize(vec3(g * slope, 1.0));
    vec3 n = normalize(uRU * nP.x - uRV * nP.y + uRN * nP.z);
    vec3 rd = normalize(vec3(s.x, -s.y, -uFocal));
    vec3 r = reflect(rd, n);
    float ndv = clamp(-dot(n, rd), 0.0, 1.0);
    float f5 = 1.0 - ndv; f5 = f5 * f5; f5 = f5 * f5 * (1.0 - ndv);
    float fres = 0.04 + 0.96 * f5;
    float dif = clamp(dot(n, uLight.xyz), 0.0, 1.0);
    vec3 base = uLime;
    vec3 env = envLight(r, sol);
    float flatL = smoothstep(0.85, 1.0, xl);                         // topo plano do líquido: reflexo mais contido
    vec3 liqC = base * (0.16 + 0.55 * dif) + base * uGlow.y * (0.35 + 0.65 * exp(-x / 26.0))
              + env * (0.55 + 0.3 * fres) * uMat.x * mix(1.0, 0.45, flatL);
    float flat_ = smoothstep(C - aa, C + aa, x);                    // face plana do sólido: acetinada; o chanfro brilha
    vec3 solC = base * (0.22 + 0.78 * dif) * mix(1.0, 0.82, flat_)
              + env * (0.28 + 0.47 * fres) * mix(1.0, 0.42, flat_);
    float edgeHi = (1.0 - smoothstep(C - aa, C + aa, x)) * smoothstep(0.0, aa * 2.0, x) * sol;
    solC += vec3(1.0, 1.0, 0.9) * edgeHi * 0.35 * clamp(dot(n, vec3(-0.39, 0.78, 0.49)), 0.0, 1.0);
    vec3 matC = mix(liqC, solC, sol);
    if (uSweep.w > 0.0) {
      float sw = dot(p, uSweep.xy) - uSweep.z;
      matC += vec3(1.0, 1.0, 0.85) * uSweep.w * exp(-sw * sw / 1800.0) * (0.4 + 0.6 * clamp(x / 30.0, 0.0, 1.0));
    }
    float cov = 1.0 - smoothstep(-aa * 0.7, aa * 0.7, d);
    float fill = uProj.z;
    if (uBuild.w > 0.0) fill = max(fill, smoothstep(uBuild.z + aa, uBuild.z - aa, dot(p, uBuild.xy)) * uBuild.w);
    fill = mix(fill, 1.0, F.a);                                     // gotas sempre cheias
    col = mix(col, matC * uMat.w, cov * fill);
    // ---------------- PROJETO: curvas de nível dentro e o contorno
    float inside = 1.0 - smoothstep(-aa, aa, d);
    col = mix(col, vec3(0.62, 0.70, 0.62), isoL * inside * uProj.x * 0.75 * (1.0 - fill * 0.85) * (1.0 - F.a));
  }
  float zero = 1.0 - smoothstep(aa * 0.6, aa * 1.8, abs(d));
  col = mix(col, uLime * 1.15, zero * uProj.x * (1.0 - F.a * 0.7));
  vec3 hi = max(col - 0.8, 0.0);                                         // altas luzes comprimidas (sem estourar em branco)
  col = min(col, 0.8) + hi / (1.0 + hi * 2.2);
  oC = vec4(sqrt(max(col, 0.0)), 1.0);
}
`;

  // ------------------------------------------------------------------ distância euclidiana (TinySDF)
  const INF = 1e20;
  function edt1d(grid, offset, stride, length, f, v, z) {
    v[0] = 0; z[0] = -INF; z[1] = INF;
    f[0] = grid[offset];
    for (let q = 1, k = 0, s = 0; q < length; q++) {
      f[q] = grid[offset + q * stride];
      const q2 = q * q;
      do { const r = v[k]; s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2; } while (s <= z[k] && --k > -1);
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    for (let q = 0, k = 0; q < length; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k], qr = q - r;
      grid[offset + q * stride] = f[r] + qr * qr;
    }
  }
  function edt(data, w, h) {
    const n = Math.max(w, h), f = new Float64Array(n), v = new Uint16Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) edt1d(data, x, w, h, f, v, z);
    for (let y = 0; y < h; y++) edt1d(data, y * w, 1, w, f, v, z);
  }
  // máscara alfa (0..255) -> distância com sinal em texels (negativa dentro)
  function sdfFromAlpha(alpha, w, h) {
    const outer = new Float64Array(w * h), inner = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = alpha[i] / 255;
      if (a >= 0.999) { outer[i] = 0; inner[i] = INF; }
      else if (a <= 0.001) { outer[i] = INF; inner[i] = 0; }
      else { const dd = 0.5 - a; outer[i] = dd > 0 ? dd * dd : 0; inner[i] = dd < 0 ? dd * dd : 0; }
    }
    edt(outer, w, h); edt(inner, w, h);
    const out = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
    return out;
  }

  // ------------------------------------------------------------------ ruído (textura 256x256, repete)
  function noiseTexData(seed) {
    const N = 256, out = new Float32Array(N * N * 2);
    const lat = (s) => { const r = FZD.U.rng(s); const g = new Float32Array(16 * 16); for (let i = 0; i < 256; i++) g[i] = r(); return g; };
    const octaves = [[16, 1.0, lat(seed)], [32, 0.5, null], [64, 0.25, null]];
    const grids = [lat(seed), lat(seed + 7), lat(seed + 13), lat(seed + 21), lat(seed + 33), lat(seed + 47)];
    function vnoise(g, cells, x, y) {
      const fx = (x / N) * cells, fy = (y / N) * cells;
      const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const at = (i, j) => g[((j % cells + cells) % cells) % 16 * 16 + ((i % cells + cells) % cells) % 16] ;
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
    }
    void octaves;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      for (let ch = 0; ch < 2; ch++) {
        let v = 0, amp = 0;
        [[4, 1.0], [8, 0.4], [16, 0.12]].forEach(([cells, a], k) => { v += vnoise(grids[ch * 3 + k], cells, x, y) * a; amp += a; });
        out[(y * N + x) * 2 + ch] = v / amp;
      }
    }
    return out;
  }

  // ------------------------------------------------------------------ módulo
  function create(W, H, opt = {}) {
    const FS = opt.fieldScale || 0.5;
    const FW = Math.round(W * FS), FH = Math.round(H * FS);
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 indisponível');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float indisponível');

    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const program = (fs) => {
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      const U = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace(/\[0\]$/, ''); U[name] = gl.getUniformLocation(p, info.name); }
      return { p, U };
    };
    const PF = program(FS_FIELD), PS = program(FS_SHADE);

    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = (w, h, ifmt, fmt, type, data, filter, wrap) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      return t;
    };
    // atlas de palavras (distância em texels)
    const AW = opt.atlasW || 4096, AH = opt.atlasH || 2048;
    const atlas = tex(AW, AH, gl.R16F, gl.RED, gl.FLOAT, new Float32Array(AW * AH).fill(200), gl.LINEAR, gl.CLAMP_TO_EDGE);
    const noise = tex(256, 256, gl.RG16F, gl.RG, gl.FLOAT, noiseTexData(opt.seed || 3), gl.LINEAR, gl.REPEAT);
    const fieldT = tex(FW, FH, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null, gl.LINEAR, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fieldT, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incompleto');
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // ---------------- palavras no atlas (empacotamento em prateleiras)
    const slots = {};
    let shelfX = 0, shelfY = 0, shelfH = 0;
    function place(w, h) {
      if (shelfX + w > AW) { shelfX = 0; shelfY += shelfH + 2; shelfH = 0; }
      if (shelfY + h > AH) throw new Error('atlas cheio');
      const r = { x: shelfX, y: shelfY, w, h }; shelfX += w + 2; shelfH = Math.max(shelfH, h); return r;
    }
    // pontos de amostra dentro da forma (para gotas que saem ou entram nela), em texels a partir do centro
    function samplePts(sdf, w, h, n = 48, depth = 7, seed = 5) {
      const r = FZD.U.rng(seed), pts = [];
      for (let k = 0; k < 20000 && pts.length < n; k++) {
        const x = Math.floor(r() * w), y = Math.floor(r() * h), v = sdf[y * w + x];
        if (v < -depth && pts.every((q) => Math.hypot(q[0] - (x - w / 2), q[1] - (y - h / 2)) > 34)) pts.push([x - w / 2, y - h / 2, -v]);
      }
      return pts;
    }
    function upload(key, sdf, w, h, meta) {
      const r = place(w, h);
      meta.pts = samplePts(sdf, w, h);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, w, h, gl.RED, gl.FLOAT, sdf);
      slots[key] = { ...r, ...meta };
      return slots[key];
    }
    // palavra: linhas de texto -> SDF (1 texel = 1 px do plano na escala 1)
    function addText(key, lines, { font, size, lh = 1.0, ls = 0, pad = 150, scale = 1 } = {}) {
      const mc = document.createElement('canvas').getContext('2d');
      mc.font = `${font.weight} ${size * scale}px ${font.fam}`; mc.letterSpacing = `${ls * scale}px`;
      const widths = lines.map((l) => mc.measureText(l).width);
      const m = mc.measureText('ÉÇÃ');
      const asc = m.actualBoundingBoxAscent, desc = Math.max(mc.measureText('Ç').actualBoundingBoxDescent, 0);
      const lineH = size * scale * lh;
      const w = Math.ceil(Math.max(...widths) + pad * 2), h = Math.ceil(asc + desc + lineH * (lines.length - 1) + pad * 2);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.font = mc.font; x.letterSpacing = mc.letterSpacing; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      lines.forEach((l, i) => x.fillText(l, w / 2, pad + asc + i * lineH));
      const img = x.getImageData(0, 0, w, h).data; const a = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) a[i] = img[i * 4 + 3];
      const sdf = sdfFromAlpha(a, w, h);
      // centro da caixa de tinta (alinhamento ótico), em texels a partir do centro do slot
      return upload(key, sdf, w, h, { inkW: Math.max(...widths), inkH: asc + desc + lineH * (lines.length - 1), oy: 0 });
    }
    // imagem (canal alfa) -> SDF, com largura alvo em texels
    function addImage(key, img, { width, pad = 120, alphaFrom = 'a' } = {}) {
      const s = width / img.naturalWidth, iw = Math.round(img.naturalWidth * s), ih = Math.round(img.naturalHeight * s);
      const w = iw + pad * 2, h = ih + pad * 2;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, pad, pad, iw, ih);
      const data = x.getImageData(0, 0, w, h).data; const a = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) a[i] = data[i * 4 + 3];
      return upload(key, sdfFromAlpha(a, w, h), w, h, { inkW: iw, inkH: ih, pad });
    }

    // ---------------- render
    const BLOBS = new Float32Array(40 * 4);
    function setCam(P, U, c) {
      gl.uniform2f(U.uScreen, W, H);
      gl.uniformMatrix3fv(U.uHom, false, c.hom);
      gl.uniform2f(U.uPan, c.pan[0], c.pan[1]);
      gl.uniform1f(U.uTime, c.time);
      if (U.uRU) { gl.uniform3fv(U.uRU, c.U); gl.uniform3fv(U.uRV, c.V); gl.uniform3fv(U.uRN, c.N); gl.uniform1f(U.uFocal, c.focal); }
    }
    const slotVec = (k) => { const s = slots[k]; return s ? [s.x, s.y, s.w, s.h] : [0, 0, 1, 1]; };
    function render(st) {
      const cam = st.cam;
      // passe 1
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, FW, FH);
      gl.useProgram(PF.p); const U = PF.U;
      setCam(PF.p, U, cam);
      gl.uniform2f(U.uRes, FW, FH);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlas); gl.uniform1i(U.uAtlas, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, noise); gl.uniform1i(U.uNoise, 1);
      gl.uniform2f(U.uAtlasSize, AW, AH);
      const wa = st.wordA, wb = st.wordB;
      gl.uniform4fv(U.uSlotA, slotVec(wa && wa.key)); gl.uniform4fv(U.uSlotB, slotVec(wb && wb.key));
      gl.uniform4f(U.uPlaceA, wa ? wa.x : 0, wa ? wa.y : 0, wa ? wa.s : 1, wa ? 1 : 0);
      gl.uniform4f(U.uPlaceB, wb ? wb.x : 0, wb ? wb.y : 0, wb ? wb.s : 1, wb ? 1 : 0);
      gl.uniform1f(U.uMorph, st.morph || 0); gl.uniform1f(U.uWordOn, st.wordOn ?? 1); gl.uniform1f(U.uErode, st.erode ?? 300);
      const bl = st.blobs || [];
      BLOBS.fill(0); bl.slice(0, 40).forEach((b, i) => { BLOBS[i * 4] = b[0]; BLOBS[i * 4 + 1] = b[1]; BLOBS[i * 4 + 2] = b[2]; });
      gl.uniform4fv(U.uBlob, BLOBS); gl.uniform1i(U.uNB, Math.min(40, bl.length)); gl.uniform1f(U.uBK, st.blobK ?? 40);
      gl.uniform1f(U.uWB, st.wordBlobK ?? 40);
      const sl = st.slash; gl.uniform4f(U.uSlash, sl ? sl.x : 0, sl ? sl.y : 0, sl ? sl.h : 1, sl ? (sl.on ?? 1) : 0); gl.uniform4f(U.uSlash2, sl ? (sl.wr || 0.438) : 0.438, sl ? (sl.r || 0) : 0, sl ? (sl.k ?? 30) : 30, 0);
      const nz = st.noise || [0, 0.004, 0.2]; gl.uniform4f(U.uNoiseP, nz[0], nz[1], nz[2], 0);
      const rg = st.ring; gl.uniform4f(U.uRing, rg ? rg[0] : 0, rg ? rg[1] : 0, rg ? rg[2] : 0, rg ? rg[3] : 0);
      const fr = st.front; gl.uniform4f(U.uFront, fr ? fr[0] : 0, fr ? fr[1] : 0, fr ? fr[2] : 0, fr ? fr[3] : 0);
      gl.uniform1f(U.uSolid, st.solid || 0);
      gl.uniform1f(U.uCells, st.cells || 0);
      const co = st.cellOff || [0, 0]; gl.uniform2f(U.uCellOff, co[0], co[1]);
      gl.uniform1f(U.uCellT, st.cellT ?? 1); gl.uniform1f(U.uUnion, st.union ? 1 : 0); gl.uniform1f(U.uWordSolid, st.wordSolid || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (st.profile) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, new Float32Array(4)); st.profile.field = performance.now(); }
      // passe 2
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(PS.p); const V = PS.U;
      setCam(PS.p, V, cam);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fieldT); gl.uniform1i(V.uField, 0);
      gl.uniform2f(V.uFieldRes, FW, FH);
      const m = st.mat || {};
      gl.uniform4f(V.uMat, m.gloss ?? 1, m.bevel ?? 34, m.chamfer ?? 8, m.exposure ?? 1);
      const pr = st.proj || {};
      gl.uniform4f(V.uProj, pr.lines ?? 0, pr.spacing ?? 16, pr.fill ?? 1, pr.outside ?? 0.4);
      const g = st.glow || {};
      gl.uniform4f(V.uGlow, g.halo ?? 0.6, g.inner ?? 0.5, g.contact ?? 0.5, 0);
      const bg = st.bg || {};
      gl.uniform3fv(V.uBg0, bg.c0 || [0.0045, 0.005, 0.0062]); gl.uniform3fv(V.uBg1, bg.c1 || [0.0004, 0.0004, 0.0005]);
      gl.uniform4f(V.uBgP, ...(bg.spot || [W / 2, H * 0.45, 1100, 0.5]));
      gl.uniform3fv(V.uLime, st.lime || [0.597, 0.963, 0.063]);
      const Lr = st.light || [-0.45, 0.7, 0.55], Ln = Math.hypot(Lr[0], Lr[1], Lr[2]);
      gl.uniform4f(V.uLight, Lr[0] / Ln, Lr[1] / Ln, Lr[2] / Ln, 1);
      const sp = pr.spacing ?? 16, wvv = st.wave;
      let far = Math.max(g.halo ? 260 : 0, g.contact ? 140 : 0, (pr.outside ?? 0.4) > 0 ? sp * 16 : 0, 8);
      if (wvv && wvv[3] > 0) far = Math.max(far, Math.max(wvv[0], wvv[1]) + 3 * wvv[2]);
      gl.uniform1f(V.uFar, far);
      gl.uniform4f(V.uFloor, 0, 0, 0, 0);
      const sw = st.sweep, swn = sw ? Math.hypot(sw[0], sw[1]) || 1 : 1; gl.uniform4f(V.uSweep, sw ? sw[0] / swn : 1, sw ? sw[1] / swn : 0, sw ? sw[2] : 0, sw ? sw[3] : 0);
      const wv = st.wave; gl.uniform4f(V.uWave, wv ? wv[0] : 0, wv ? wv[1] : -1e4, wv ? wv[2] : 20, wv ? wv[3] : 0);
      const bd = st.build, bdn = bd ? Math.hypot(bd[0], bd[1]) || 1 : 1; gl.uniform4f(V.uBuild, bd ? bd[0] / bdn : 0, bd ? bd[1] / bdn : -1, bd ? bd[2] : 0, bd ? (bd[3] ?? 1) : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (st.profile) { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); st.profile.shade = performance.now(); }
      return canvas;
    }

    function inv3(m) {
      const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2];
      const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
      const det = a * A + b * B + c * C;
      return [
        [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
        [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
        [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
      ];
    }
    // câmera: plano girado (pitch em torno de x, yaw em torno de y, roll em torno de z)
    function camera({ pitch = 0, yaw = 0, roll = 0, zoom = 1, pan = [0, 0], focal = 1800, time = 0 } = {}) {
      const cx = Math.cos(pitch), sx = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw), cz = Math.cos(roll), sz = Math.sin(roll);
      const rot = (v) => {
        let [x, y, z] = v;
        [x, y] = [x * cz - y * sz, x * sz + y * cz];          // roll
        [y, z] = [y * cx - z * sx, y * sx + z * cx];          // pitch
        [x, z] = [x * cy + z * sy, -x * sy + z * cy];         // yaw
        return [x, y, z];
      };
      const Uv = rot([1, 0, 0]), Vv = rot([0, 1, 0]), Nv = rot([0, 0, 1]), dist = focal / zoom;
      // plano -> tela: H = diag(f, -f, -1) · [U | -V | P0]  (P0 = (0, 0, -dist));  tela -> plano = H^-1
      const Hm = [
        [focal * Uv[0], -focal * Vv[0], 0],
        [-focal * Uv[1], focal * Vv[1], 0],
        [-Uv[2], Vv[2], dist],
      ];
      const inv = inv3(Hm);
      // GLSL é coluna-major: coluna j = (inv[0][j], inv[1][j], inv[2][j])
      const hom = new Float32Array([inv[0][0], inv[1][0], inv[2][0], inv[0][1], inv[1][1], inv[2][1], inv[0][2], inv[1][2], inv[2][2]]);
      return { U: Uv, V: Vv, N: Nv, dist, focal, pan, time, hom };
    }

    return { canvas, gl, render, camera, addText, addImage, slots, FW, FH };
  }

  window.FZD_MATTER = { create };
})();
