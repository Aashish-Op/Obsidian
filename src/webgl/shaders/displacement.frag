// Displacement / Ripple fragment shader for gallery hover
uniform sampler2D uTexture;
uniform float uHover;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;

varying vec2 vUv;

// Simple hash-based noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = vUv;
  
  // Distance from mouse position
  float dist = length(uv - uMouse);
  
  // Ripple wave emanating from mouse
  float ripple = sin(dist * 30.0 - uTime * 3.0) * 0.5 + 0.5;
  ripple *= smoothstep(0.6, 0.0, dist); // Fade with distance
  ripple *= uHover; // Only active on hover
  
  // Displacement amount
  float displaceStrength = ripple * 0.04;
  
  // Noise-based distortion
  float n = noise(uv * 8.0 + uTime * 0.5);
  
  // Calculate displaced UVs
  vec2 displaceDir = normalize(uv - uMouse + 0.001);
  vec2 displacedUv = uv + displaceDir * displaceStrength;
  displacedUv += (n - 0.5) * 0.01 * uHover;
  
  // Chromatic aberration on hover
  float aberration = displaceStrength * 1.5;
  vec4 colorR = texture2D(uTexture, displacedUv + vec2(aberration, 0.0));
  vec4 colorG = texture2D(uTexture, displacedUv);
  vec4 colorB = texture2D(uTexture, displacedUv - vec2(aberration, 0.0));
  
  vec4 color = vec4(colorR.r, colorG.g, colorB.b, 1.0);
  
  // Slight brightness boost on hover
  color.rgb += ripple * 0.08;
  
  gl_FragColor = color;
}
