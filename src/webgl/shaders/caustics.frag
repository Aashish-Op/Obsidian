// Caustics / Liquid Metal fragment shader
// Inspired by dark water caustics & obsidian reflections

uniform float uTime;
uniform vec2 uMouse;
uniform float uScrollProgress;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vPosition;

// Simplex-style noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Caustic pattern using layered sin waves
float caustic(vec2 uv, float time) {
  float c = 0.0;
  
  // Layer 1 — primary caustic
  vec2 p1 = uv * 5.0 + vec2(time * 0.15, time * 0.1);
  c += sin(p1.x + sin(p1.y * 1.3 + time * 0.2)) * 0.5 + 0.5;
  
  // Layer 2 — secondary caustic (offset)
  vec2 p2 = uv * 7.0 + vec2(-time * 0.12, time * 0.08);
  c += sin(p2.y + cos(p2.x * 1.5 - time * 0.15)) * 0.5 + 0.5;
  
  // Layer 3 — fine detail
  vec2 p3 = uv * 12.0 + vec2(time * 0.08, -time * 0.06);
  c += sin(p3.x * 1.2 + sin(p3.y * 0.8 + time * 0.1)) * 0.3 + 0.3;
  
  return c / 3.0;
}

// Voronoi-like cell noise for liquid metal
float voronoi(vec2 uv) {
  vec2 i = floor(uv);
  vec2 f = fract(uv);
  
  float minDist = 1.0;
  
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = vec2(
        sin(dot(i + neighbor, vec2(127.1, 311.7))) * 43758.5453,
        sin(dot(i + neighbor, vec2(269.5, 183.3))) * 43758.5453
      );
      point = 0.5 + 0.5 * sin(uTime * 0.3 + 6.2831 * fract(point));
      
      vec2 diff = neighbor + point - f;
      float dist = length(diff);
      minDist = min(minDist, dist);
    }
  }
  
  return minDist;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uvAspect = (uv - 0.5) * aspect + 0.5;
  
  // Mouse influence — distort UV toward cursor
  vec2 mouseInfluence = (uMouse - uv) * 0.08;
  float mouseDist = length(uMouse - uv);
  float mouseEffect = smoothstep(0.5, 0.0, mouseDist);
  uv += mouseInfluence * mouseEffect;
  
  float time = uTime * 0.4;
  
  // ── Base caustic layer ──────────────────────────────────
  float c1 = caustic(uv, time);
  float c2 = caustic(uv * 1.5 + 0.5, time * 0.8);
  float causticVal = c1 * 0.6 + c2 * 0.4;
  
  // ── Voronoi liquid metal cells ──────────────────────────
  float v = voronoi(uv * 4.0 + vec2(time * 0.1));
  float metallic = smoothstep(0.0, 0.4, v) * smoothstep(1.0, 0.3, v);
  
  // ── Noise layers ────────────────────────────────────────
  float n1 = snoise(vec3(uv * 3.0, time * 0.2)) * 0.5 + 0.5;
  float n2 = snoise(vec3(uv * 6.0 + 10.0, time * 0.15)) * 0.5 + 0.5;
  
  // ── Combine into liquid metal caustics ──────────────────
  float pattern = causticVal * 0.5 + metallic * 0.3 + n1 * 0.15 + n2 * 0.05;
  
  // Boost based on scroll progress (deeper = more intense)
  float scrollBoost = 1.0 + uScrollProgress * 0.5;
  pattern *= scrollBoost;
  
  // ── Color mapping ───────────────────────────────────────
  // Deep obsidian base → silver highlights → subtle blue undertone
  vec3 deepBlack = vec3(0.06, 0.06, 0.07);
  vec3 midTone = vec3(0.14, 0.14, 0.18);
  vec3 highlight = vec3(0.35, 0.34, 0.40);
  vec3 peak = vec3(0.60, 0.58, 0.68);
  
  vec3 color = deepBlack;
  color = mix(color, midTone, smoothstep(0.1, 0.35, pattern));
  color = mix(color, highlight, smoothstep(0.35, 0.6, pattern));
  color = mix(color, peak, smoothstep(0.6, 0.85, pattern) * 0.6);
  
  // Mouse glow — silver bloom near cursor
  float mouseGlow = smoothstep(0.4, 0.0, mouseDist) * 0.25;
  color += vec3(mouseGlow * 0.9, mouseGlow * 0.85, mouseGlow);
  
  // Vignette — very subtle
  float vignette = 1.0 - smoothstep(0.6, 1.8, length((vUv - 0.5) * 1.4));
  color *= mix(0.7, 1.0, vignette);
  
  gl_FragColor = vec4(color, 1.0);
}
