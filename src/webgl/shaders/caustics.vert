// Caustics vertex shader
uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  
  // Subtle vertex displacement for undulation
  vec3 pos = position;
  float wave = sin(pos.x * 3.0 + uTime * 0.5) * cos(pos.y * 2.0 + uTime * 0.3) * 0.05;
  pos.z += wave;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
