/* Shared progressive enhancement. Static content and links work without JS. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const cursor = document.querySelector('.custom-cursor');
  let stopReveal = () => {};
  let cursorFrame = null;
  let mouseX = -100, mouseY = -100, cursorX = -100, cursorY = -100;

  document.querySelectorAll('.case-hero img, .hero-image img, .banner-graphic img, .case-context-image img, .process-right img, .solution-left img, .mp-right img, .context-image, .rule-visual img, .results-icon img, .mp-showcase img, .b3-preview img, .related-card__media img').forEach(img => {
    img.classList.add('motion-media');
    if (!img.closest('.case-image-link')) img.classList.add('motion-illustration');
  });

  function revealContent() {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return () => {};
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    const targets = document.querySelectorAll('.banner-meta, .contact-buttons, .case-row, .work-top, .work-card, .skillset-block, .experience-item, .case-context-left, .case-context-right, .plan-head, .plan-track, .process-left, .process-right, .solution-left, .solution-right, .prototype-container, .results-head, .results-pill, .results-item, .mp-left, .mp-right, .context-left, .context-right, .rule-left, .rule-right, .case-detail .case-hero, .case-detail .case-content, .contact-page, .footer-cta, .footer-contacts, .mp-overview-copy, .mp-meta-item, .mp-results, .mp-showcase, .b3-heading, .b3-preview, .related-cases__heading, .related-card');
    targets.forEach(el => { el.setAttribute('data-reveal', ''); observer.observe(el); });
    const titles = document.querySelectorAll('.hero-line, .mp-title, .case-detail h2, .contact-page h1, .b3-heading h1');
    titles.forEach(title => {
      if (!title.querySelector('.hero-word')) {
        // Preserve <br>, emphasis and accessible text; split only text nodes.
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        let wordIndex = 0;
        nodes.forEach(node => {
          const fragment = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(word => {
            if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
            const span = document.createElement('span');
            span.className = 'hero-word'; span.textContent = word;
            span.style.setProperty('--word-delay', `${Math.min(wordIndex++, 8) * 70}ms`);
            fragment.append(span);
          });
          node.replaceWith(fragment);
        });
      }
      observer.observe(title);
    });
    document.body.classList.add('motion-ready');
    return () => {
      observer.disconnect();
      document.body.classList.remove('motion-ready');
    };
  }

  function hideCursor() {
    cursor?.classList.remove('is-active', 'is-hovering');
    if (cursorFrame !== null) cancelAnimationFrame(cursorFrame);
    cursorFrame = null;
  }
  function updateCursor() {
    cursorX += (mouseX - cursorX) * .18;
    cursorY += (mouseY - cursorY) * .18;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    cursorFrame = Math.hypot(mouseX - cursorX, mouseY - cursorY) > .5 ? requestAnimationFrame(updateCursor) : null;
  }
  document.addEventListener('pointermove', event => {
    if (!cursor || event.pointerType !== 'mouse' || reducedMotion.matches || !finePointer.matches) return;
    mouseX = event.clientX; mouseY = event.clientY;
    cursor.classList.add('is-active');
    cursor.classList.toggle('is-hovering', !!event.target.closest('a, button, [role="button"]'));
    if (cursorFrame === null) cursorFrame = requestAnimationFrame(updateCursor);
  });
  document.addEventListener('pointerleave', hideCursor);
  window.addEventListener('blur', hideCursor);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hideCursor(); });
  function refreshMotion() {
    stopReveal(); hideCursor(); stopReveal = revealContent();
  }
  reducedMotion.addEventListener('change', refreshMotion);
  finePointer.addEventListener('change', hideCursor);
  refreshMotion();
})();
