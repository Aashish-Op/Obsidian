import * as THREE from 'three';
import displacementVert from '../webgl/shaders/displacement.vert';
import displacementFrag from '../webgl/shaders/displacement.frag';
import gsap from 'gsap';

/**
 * HoverDistortion — WebGL displacement effect on gallery images
 * Each gallery image gets a hover-activated ripple displacement shader
 */
export class HoverDistortion {
  constructor() {
    this.items = [];
    this.clock = new THREE.Clock();
    this._init();
    this._animate();
  }

  _init() {
    const galleryItems = document.querySelectorAll('[data-hover-distortion]');

    galleryItems.forEach((item) => {
      const canvas = item.querySelector('.gallery__distortion-canvas');
      const img = item.querySelector('.gallery__image');

      if (!canvas || !img) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
      });

      const rect = item.querySelector('.gallery__image-wrapper').getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10);
      camera.position.z = 1;

      // Load the image as a texture
      const texture = new THREE.TextureLoader().load(img.src, () => {
        // Re-render once loaded
      });
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const uniforms = {
        uTexture: { value: texture },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(rect.width, rect.height) },
      };

      const geometry = new THREE.PlaneGeometry(1, 1);
      const material = new THREE.ShaderMaterial({
        vertexShader: displacementVert,
        fragmentShader: displacementFrag,
        uniforms,
        transparent: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const entry = {
        renderer,
        scene,
        camera,
        uniforms,
        canvas,
        item,
        active: false,
      };

      this.items.push(entry);

      // Mouse events
      item.addEventListener('mouseenter', () => {
        entry.active = true;
        gsap.to(canvas, { opacity: 1, duration: 0.3 });
        gsap.to(uniforms.uHover, { value: 1, duration: 0.6, ease: 'power2.out' });
      });

      item.addEventListener('mouseleave', () => {
        gsap.to(uniforms.uHover, {
          value: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            entry.active = false;
            gsap.to(canvas, { opacity: 0, duration: 0.2 });
          },
        });
      });

      item.addEventListener('mousemove', (e) => {
        const bounds = item.querySelector('.gallery__image-wrapper').getBoundingClientRect();
        uniforms.uMouse.value.x = (e.clientX - bounds.left) / bounds.width;
        uniforms.uMouse.value.y = 1.0 - (e.clientY - bounds.top) / bounds.height;
      });
    });

    // Handle resize
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.items.forEach((entry) => {
      const rect = entry.item.querySelector('.gallery__image-wrapper').getBoundingClientRect();
      entry.renderer.setSize(rect.width, rect.height);
      entry.uniforms.uResolution.value.set(rect.width, rect.height);
    });
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    const elapsed = this.clock.getElapsedTime();

    this.items.forEach((entry) => {
      if (entry.active || entry.uniforms.uHover.value > 0.01) {
        entry.uniforms.uTime.value = elapsed;
        entry.renderer.render(entry.scene, entry.camera);
      }
    });
  }

  dispose() {
    this.items.forEach((entry) => {
      entry.renderer.dispose();
    });
  }
}
