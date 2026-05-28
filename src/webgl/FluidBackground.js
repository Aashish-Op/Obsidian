import * as THREE from 'three';
import causticsVert from './shaders/caustics.vert';
import causticsFrag from './shaders/caustics.frag';

/**
 * FluidBackground — Fullscreen caustics/liquid metal shader plane
 * Reacts to mouse position and scroll progress
 */
export class FluidBackground {
  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uScrollProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    // Extremely large plane to ensure it covers even ultrawide monitors
    const geometry = new THREE.PlaneGeometry(30, 20, 128, 128);
    const material = new THREE.ShaderMaterial({
      vertexShader: causticsVert,
      fragmentShader: causticsFrag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = -3;
    this.mesh.renderOrder = -1; // Render behind everything
  }

  onResize(w, h) {
    this.uniforms.uResolution.value.set(w, h);
  }

  update(elapsed, mouse, scrollProgress) {
    this.uniforms.uTime.value = elapsed;
    // Map mouse from [-1,1] to [0,1] for shader UV space
    this.uniforms.uMouse.value.set(
      mouse.x * 0.5 + 0.5,
      mouse.y * 0.5 + 0.5
    );
    this.uniforms.uScrollProgress.value = scrollProgress;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
