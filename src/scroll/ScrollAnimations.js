import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollAnimations — All GSAP ScrollTrigger logic for the scroll journey
 * Controls: Hero entrance, Descent section, Horizontal pinned scroll, Gallery skew
 */
export class ScrollAnimations {
  constructor(webglCanvas, faucetFixture) {
    this.webgl = webglCanvas;
    this.fixture = faucetFixture;
    this.velocity = 0;
    this.scrollY = 0;
  }

  init() {
    this._heroEntrance();
    this._descentSection();
    this._horizontalScroll();
    this._gallerySection();
    this._footerSection();
    this._globalScrollProgress();
    this._velocityTracking();

    // Refresh ScrollTrigger after everything is set up
    // Pinned sections can offset trigger positions — this recalculates
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }

  /**
   * Hero section entrance animations (triggered after preloader)
   */
  _heroEntrance() {
    const tl = gsap.timeline({ delay: 0.2 });

    // Title slides up
    tl.to('.hero__title-line', {
      y: 0,
      duration: 1.4,
      ease: 'power4.out',
    });

    // Subtitle fades in
    tl.to(
      '.hero__subtitle',
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power3.out',
      },
      '-=0.8'
    );

    // Tagline
    tl.to(
      '.hero__tagline',
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
      },
      '-=0.5'
    );

    // Scroll indicator
    tl.to(
      '.hero__scroll-indicator',
      {
        opacity: 1,
        duration: 1.0,
        ease: 'power2.out',
      },
      '-=0.3'
    );

    // Hero elements fade on scroll
    gsap.to('.hero__content', {
      opacity: 0,
      y: -100,
      scrollTrigger: {
        trigger: '#section-hero',
        start: 'top top',
        end: '80% top',
        scrub: 1,
      },
    });
  }

  /**
   * Section 1: The Descent
   * 3D fixture scales up massively, breaking camera boundary
   */
  _descentSection() {
    // Descent text entrance
    const descentTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#section-descent',
        start: 'top 80%',
        end: 'top 30%',
        scrub: 1,
      },
    });

    descentTl
      .to('.descent__label', { opacity: 1, y: 0, duration: 0.3 })
      .to('.descent__heading', { opacity: 1, y: 0, duration: 0.5 }, '<0.1')
      .to('.descent__body', { opacity: 1, y: 0, duration: 0.4 }, '<0.2');

    // 3D fixture scales up massively during descent
    const fixtureProxy = { scale: 1, opacity: 1 };
    
    gsap.to(fixtureProxy, {
      scale: 8,
      opacity: 0,
      scrollTrigger: {
        trigger: '#section-descent',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: () => {
          if (this.fixture) {
            this.fixture.setScale(fixtureProxy.scale);
            this.fixture.setOpacity(fixtureProxy.opacity);
          }
        },
      },
    });

    // Descent text fades out
    gsap.to('.descent__text', {
      opacity: 0,
      y: -80,
      scrollTrigger: {
        trigger: '#section-descent',
        start: '40% top',
        end: '80% top',
        scrub: 1,
      },
    });

    // Camera push forward
    const cameraProxy = { z: 5 };
    gsap.to(cameraProxy, {
      z: 3,
      scrollTrigger: {
        trigger: '#section-descent',
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: () => {
          if (this.webgl && this.webgl.camera) {
            this.webgl.camera.position.z = cameraProxy.z;
          }
        },
      },
    });
  }

  /**
   * Section 2: Horizontal Pinned Scroll
   * Hijacks vertical scroll, forces horizontal panel movement
   */
  _horizontalScroll() {
    const track = document.getElementById('horizontal-track');
    const panels = track.querySelectorAll('.horizontal__panel');
    const panelCount = panels.length;

    // Calculate total horizontal distance
    const totalScroll = (panelCount - 1) * window.innerWidth;

    // Pin the section and move track horizontally
    gsap.to(track, {
      x: -totalScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: '#section-horizontal',
        start: 'top top',
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    // Background text parallax (moves slower)
    gsap.to('.horizontal__bg-text', {
      x: -totalScroll * 0.3,
      ease: 'none',
      scrollTrigger: {
        trigger: '#section-horizontal',
        start: 'top top',
        end: () => `+=${totalScroll}`,
        scrub: 1,
      },
    });

    // Animate spec values as they come into view
    panels.forEach((panel, i) => {
      const specs = panel.querySelectorAll('[data-anim="spec"]');
      
      gsap.fromTo(
        specs,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'left 80%',
            end: 'left 40%',
            scrub: 1,
            containerAnimation: gsap.getById && undefined, // Part of horizontal scroll
            horizontal: true,
          },
        }
      );
    });
  }

  /**
   * Section 3: Distortion Gallery
   * Images skew based on scroll velocity, with scroll-triggered entrances
   */
  _gallerySection() {
    const items = document.querySelectorAll('.gallery__item');

    // Gallery header — subtle entrance (never fully hidden)
    gsap.from('.gallery__header', {
      y: 40,
      opacity: 0.3,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#section-gallery',
        start: 'top 95%',
        toggleActions: 'play none none none',
      },
    });

    // Each gallery item entrance + velocity skew
    items.forEach((item, i) => {
      // Entrance animation — only translate, never fully hide
      gsap.from(item, {
        y: 60,
        opacity: 0.2,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 98%',
          toggleActions: 'play none none none',
        },
      });

      // Velocity-based skew
      ScrollTrigger.create({
        trigger: item,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const skew = Math.max(-8, Math.min(8, velocity / 300));
          gsap.to(item, {
            skewY: skew,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: true,
          });
        },
      });
    });

    // Reset skew when scrolling stops
    ScrollTrigger.addEventListener('scrollEnd', () => {
      gsap.to('.gallery__item', {
        skewY: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)',
        overwrite: true,
      });
    });
  }

  /**
   * Footer entrance
   */
  _footerSection() {
    gsap.fromTo(
      '.footer__content',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#section-footer',
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1,
        },
      }
    );
  }

  /**
   * Global scroll progress tracker for WebGL uniforms
   */
  _globalScrollProgress() {
    ScrollTrigger.create({
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        if (this.webgl) {
          this.webgl.setScrollProgress(self.progress);
        }
      },
    });
  }

  /**
   * Track scroll velocity for effects
   */
  _velocityTracking() {
    // This is handled per-element in _gallerySection
  }

  /**
   * Update Lenis-ScrollTrigger sync
   */
  static syncLenis(lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  dispose() {
    ScrollTrigger.getAll().forEach((st) => st.kill());
  }
}
