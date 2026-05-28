import * as THREE from 'three';

/**
 * FaucetFixture — Procedural 3D matte-black plumbing fixture
 * Composed from basic Three.js geometries
 * Reacts to mouse (rotation) and scroll (scale for "descent" effect)
 */
export class FaucetFixture {
  constructor() {
    this.group = new THREE.Group();
    this.targetRotation = new THREE.Vector2(0, 0);
    this.initialScale = 1;

    this._build();
  }

  _build() {
    // Generate a simple procedural environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    
    // Shared material — matte black metallic
    const material = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.95,
      roughness: 0.12,
      envMapIntensity: 0.6,
    });

    // Alternative material for accent parts
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      metalness: 0.9,
      roughness: 0.15,
      envMapIntensity: 0.4,
    });

    // ── BASE PLATE ──────────────────────────────
    const baseGeom = new THREE.CylinderGeometry(0.6, 0.65, 0.08, 64);
    const base = new THREE.Mesh(baseGeom, material);
    base.position.y = -1.2;
    this.group.add(base);

    // Base ring detail
    const ringGeom = new THREE.TorusGeometry(0.62, 0.015, 16, 64);
    const ring = new THREE.Mesh(ringGeom, accentMaterial);
    ring.position.y = -1.16;
    ring.rotation.x = Math.PI / 2;
    this.group.add(ring);

    // ── BODY (vertical column) ──────────────────
    const bodyGeom = new THREE.CylinderGeometry(0.12, 0.15, 1.8, 32);
    const body = new THREE.Mesh(bodyGeom, material);
    body.position.y = -0.2;
    this.group.add(body);

    // Body top cap
    const topCapGeom = new THREE.SphereGeometry(0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topCap = new THREE.Mesh(topCapGeom, material);
    topCap.position.y = 0.7;
    this.group.add(topCap);

    // ── SPOUT (curved arm) ──────────────────────
    // Using a torus segment for the curve
    const spoutCurveGeom = new THREE.TorusGeometry(0.5, 0.06, 16, 32, Math.PI * 0.55);
    const spoutCurve = new THREE.Mesh(spoutCurveGeom, material);
    spoutCurve.position.set(0.35, 0.65, 0);
    spoutCurve.rotation.z = Math.PI * 0.55;
    this.group.add(spoutCurve);

    // Spout tip (straight section)
    const spoutTipGeom = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 16);
    const spoutTip = new THREE.Mesh(spoutTipGeom, material);
    spoutTip.position.set(0.75, 0.35, 0);
    this.group.add(spoutTip);

    // Spout nozzle
    const nozzleGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.06, 16);
    const nozzle = new THREE.Mesh(nozzleGeom, accentMaterial);
    nozzle.position.set(0.75, 0.18, 0);
    this.group.add(nozzle);

    // ── HANDLE (lever) ──────────────────────────
    const handleBarGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 16);
    const handleBar = new THREE.Mesh(handleBarGeom, accentMaterial);
    handleBar.position.set(-0.25, 0.5, 0);
    handleBar.rotation.z = Math.PI / 4;
    this.group.add(handleBar);

    // Handle grip (end)
    const gripGeom = new THREE.SphereGeometry(0.04, 16, 16);
    const grip = new THREE.Mesh(gripGeom, material);
    grip.position.set(-0.41, 0.66, 0);
    this.group.add(grip);

    // ── WATER DROP (decorative) ─────────────────
    const dropGeom = new THREE.SphereGeometry(0.025, 16, 16);
    const dropMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const drop = new THREE.Mesh(dropGeom, dropMaterial);
    drop.position.set(0.75, 0.12, 0);
    this.group.add(drop);
    this.drop = drop;

    // Position the entire group
    this.group.position.y = 0.2;
    this.group.scale.setScalar(this.initialScale);
  }

  update(elapsed, mouse, scrollProgress) {
    // Mouse-driven rotation (parallax)
    this.targetRotation.x = mouse.y * 0.15;
    this.targetRotation.y = mouse.x * 0.25;

    this.group.rotation.x += (this.targetRotation.x - this.group.rotation.x) * 0.03;
    this.group.rotation.y += (this.targetRotation.y - this.group.rotation.y) * 0.03;

    // Gentle idle float
    this.group.position.y = 0.2 + Math.sin(elapsed * 0.5) * 0.03;

    // Water drop animation
    if (this.drop) {
      this.drop.position.y = 0.12 - ((elapsed * 0.3) % 0.5) * 0.2;
      this.drop.material.opacity = 0.6 - ((elapsed * 0.3) % 0.5) * 1.0;
      this.drop.scale.setScalar(1 - ((elapsed * 0.3) % 0.5) * 0.3);
    }
  }

  /**
   * Set scale directly (used by GSAP ScrollTrigger)
   */
  setScale(s) {
    this.group.scale.setScalar(s);
  }

  /**
   * Set opacity of all children (used for transition wipe)
   */
  setOpacity(opacity) {
    this.group.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = opacity;
      }
    });
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}
