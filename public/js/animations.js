/* ── GSAP Animations ─────────────────────────────────────────── */
/* Runs after DOM is ready and GSAP + ScrollTrigger are loaded   */

const initAnimations = () => {
  if (typeof gsap === 'undefined') return;

  // Register ScrollTrigger if available
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* Navbar slide down */
  gsap.to('.navbar', {
    y: 0, duration: 0.6, ease: 'power3.out', delay: 0.1
  });

  /* Hero stagger */
  const heroEls = ['.hero-eyebrow', '.hero-title', '.hero-sub', '.hero-ctas', '.hero-stats'];
  heroEls.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (el) {
      gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.8,
        delay: 0.3 + i * 0.12,
        ease: 'power3.out'
      });
    }
  });

  /* Section headers on scroll */
  const scrollFade = (selector, stagger = 0.1) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (typeof ScrollTrigger === 'undefined') {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.6 });
        return;
      }
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        }
      });
    });
  };

  scrollFade('.section-tag');
  scrollFade('.section-title');
  scrollFade('.section-subtitle');
  scrollFade('.page-header h1');
  scrollFade('.page-header p');

  /* Product cards stagger reveal */
  const revealCards = (containerSel) => {
    const container = document.querySelector(containerSel);
    if (!container || typeof ScrollTrigger === 'undefined') {
      document.querySelectorAll(`${containerSel} .product-card`).forEach(c =>
        gsap.to(c, { opacity: 1, y: 0, duration: 0.5 })
      );
      return;
    }

    // Re-run whenever new cards are added
    const observer = new MutationObserver(() => {
      const cards = container.querySelectorAll('.product-card:not(.gsap-done)');
      if (!cards.length) return;
      cards.forEach(c => c.classList.add('gsap-done'));
      gsap.to([...cards], {
        opacity: 1, y: 0,
        duration: 0.55, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 90%',
          once: true,
        }
      });
    });
    observer.observe(container, { childList: true, subtree: false });
  };

  revealCards('.products-grid');
  revealCards('.flash-grid');

  /* Category cards */
  if (typeof ScrollTrigger !== 'undefined') {
    const cats = document.querySelectorAll('.category-card');
    if (cats.length) {
      gsap.to([...cats], {
        opacity: 1, y: 0,
        duration: 0.55, stagger: 0.07, ease: 'power2.out',
        scrollTrigger: {
          trigger: '.categories-grid',
          start: 'top 85%',
          once: true,
        }
      });
    }
  }

  /* Stat cards */
  if (typeof ScrollTrigger !== 'undefined') {
    document.querySelectorAll('.stat-card').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.5, delay: i * 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
  } else {
    document.querySelectorAll('.stat-card').forEach(el =>
      gsap.to(el, { opacity: 1, y: 0, duration: 0.5 })
    );
  }
};

/* Wait for GSAP to be ready (it's loaded via CDN) */
if (typeof gsap !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  window.addEventListener('load', () => {
    if (typeof gsap !== 'undefined') initAnimations();
    else {
      // Fallback: remove opacity:0 from all animated elements
      const sels = ['.navbar', '.hero-eyebrow', '.hero-title', '.hero-sub',
        '.hero-ctas', '.hero-stats', '.product-card', '.category-card',
        '.section-tag', '.section-title', '.section-subtitle',
        '.page-header h1', '.page-header p', '.stat-card'];
      sels.forEach(s => document.querySelectorAll(s).forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }));
    }
  });
}
