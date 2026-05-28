/**
 * main.js — Terminal Luxury Orchestrator
 * Initializes everything in the correct order:
 * 1. Lenis smooth scroll
 * 2. Preloader → on complete:
 * 3. WebGL Canvas + children
 * 4. Scroll Animations
 * 5. Hover Distortion
 */

import Lenis from 'lenis';
import { Preloader } from './preloader/Preloader.js';
import { WebGLCanvas } from './webgl/WebGLCanvas.js';
import { FluidBackground } from './webgl/FluidBackground.js';
import { FaucetFixture } from './webgl/FaucetFixture.js';
import { ScrollAnimations } from './scroll/ScrollAnimations.js';
import { HoverDistortion } from './scroll/HoverDistortion.js';

class App {
  constructor() {
    this.lenis = null;
    this.webgl = null;
    this.scrollAnimations = null;
    this.hoverDistortion = null;
    this.faucetFixture = null;
    this.isRunning = false;

    this._initLenis();
    this._initPreloader();
  }

  /**
   * Initialize Lenis smooth scrolling
   */
  _initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // Sync with GSAP
    ScrollAnimations.syncLenis(this.lenis);
  }

  /**
   * Initialize the preloader (blocks everything until done)
   */
  _initPreloader() {
    new Preloader(() => {
      this._onPreloaderComplete();
    });
  }

  /**
   * Called when preloader finishes — boot the experience
   */
  _onPreloaderComplete() {
    // Initialize WebGL
    this.webgl = new WebGLCanvas();

    // Add fluid background
    const fluidBg = new FluidBackground();
    this.webgl.addChild(fluidBg);

    // Add 3D faucet fixture
    this.faucetFixture = new FaucetFixture();
    this.webgl.addChild(this.faucetFixture);

    // Initialize scroll animations
    this.scrollAnimations = new ScrollAnimations(this.webgl, this.faucetFixture);
    this.scrollAnimations.init();

    // Initialize hover distortion on gallery images
    this.hoverDistortion = new HoverDistortion();

    // Start the render loop
    this.isRunning = true;
    this._tick();
  }

  /**
   * Main render loop
   */
  _tick() {
    if (!this.isRunning) return;
    
    // Update WebGL
    if (this.webgl) {
      this.webgl.update();
    }

    requestAnimationFrame(() => this._tick());
  }
}

// ── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
