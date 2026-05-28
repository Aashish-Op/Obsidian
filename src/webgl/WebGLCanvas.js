import * as THREE from 'three';

/**
 * WebGLCanvas — Core Three.js setup
 * Fixed, full-viewport canvas rendering the dual-layer background
 */
export class WebGLCanvas {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.mouse = new THREE.Vector2(0, 0);
    this.targetMouse = new THREE.Vector2(0, 0);
    this.scrollProgress = 0;
    this.clock = new THREE.Clock();
    this.children = []; // Objects that need updating

    this._init();
    this._bindEvents();
  }

  _init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x020202, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020202, 0.15);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);

    // Lighting for the 3D fixture
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xc0c0c0, 0.8);
    directionalLight.position.set(3, 5, 4);
    this.scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x4040ff, 0.3, 10);
    pointLight1.position.set(-3, 2, 3);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xc0c0c0, 0.4, 10);
    pointLight2.position.set(2, -1, 4);
    this.scene.add(pointLight2);
  }

  _bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    // Notify children
    this.children.forEach((child) => {
      if (child.onResize) child.onResize(w, h);
    });
  }

  addChild(child) {
    this.children.push(child);
    if (child.mesh) this.scene.add(child.mesh);
    if (child.group) this.scene.add(child.group);
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  update() {
    // Lerp mouse for smooth movement
    this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
    this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

    const elapsed = this.clock.getElapsedTime();

    // Update all children
    this.children.forEach((child) => {
      if (child.update) {
        child.update(elapsed, this.mouse, this.scrollProgress);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.children.forEach((child) => {
      if (child.dispose) child.dispose();
    });
  }
}
