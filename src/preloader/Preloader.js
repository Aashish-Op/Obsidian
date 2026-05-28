import gsap from 'gsap';

/**
 * Preloader — Custom unskippable preloader
 * Wireframe faucet fills with liquid, then bursts to reveal the WebGL scene
 */
export class Preloader {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.el = document.getElementById('preloader');
    this.counterEl = document.getElementById('preloader-counter');
    this.liquidRect = document.getElementById('liquid-rect');
    this.progress = 0;
    this.targetProgress = 0;
    this.isComplete = false;

    this._simulate();
  }

  _simulate() {
    // Simulate loading in stages with varying speed
    const stages = [
      { target: 25, duration: 800 },
      { target: 45, duration: 600 },
      { target: 65, duration: 900 },
      { target: 80, duration: 500 },
      { target: 95, duration: 700 },
      { target: 100, duration: 400 },
    ];

    let delay = 200;
    stages.forEach((stage) => {
      setTimeout(() => {
        this.targetProgress = stage.target;
      }, delay);
      delay += stage.duration;
    });

    // Start the update loop
    this._update();
  }

  _update() {
    if (this.isComplete) return;

    // Ease toward target
    this.progress += (this.targetProgress - this.progress) * 0.08;

    // Update counter text
    const displayVal = Math.round(this.progress);
    this.counterEl.textContent = displayVal;

    // Update SVG liquid fill (clip-path rect moves upward)
    // y goes from 500 (empty) to 0 (full)
    const fillY = 500 - (this.progress / 100) * 500;
    this.liquidRect.setAttribute('y', fillY);

    if (this.progress >= 99.5 && this.targetProgress >= 100) {
      this.progress = 100;
      this.counterEl.textContent = '100';
      this.liquidRect.setAttribute('y', '0');
      this._exit();
      return;
    }

    requestAnimationFrame(() => this._update());
  }

  _exit() {
    this.isComplete = true;

    const tl = gsap.timeline({
      onComplete: () => {
        // Remove preloader from DOM
        this.el.remove();
        if (this.onComplete) this.onComplete();
      },
    });

    // Phase 1: Scale up the faucet SVG (burst feeling)
    tl.to('.preloader__faucet', {
      scale: 1.8,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.in',
    });

    // Phase 2: Counter explodes outward
    tl.to(
      '.preloader__counter',
      {
        scale: 3,
        opacity: 0,
        duration: 0.6,
        ease: 'power4.in',
      },
      '<0.1'
    );

    // Phase 3: Brand fades
    tl.to(
      '.preloader__brand',
      {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: 'power2.in',
      },
      '<0.1'
    );

    // Phase 4: Preloader background dissolves with clip-path
    tl.to(this.el, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 1.0,
      ease: 'power3.inOut',
    });
  }
}
