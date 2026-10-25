/* Native scroll/snap works without JS; controls enhance overflow when needed. */
(() => {
  document.querySelectorAll('.related-cases').forEach(section => {
    const track = section.querySelector('.related-cases__track');
    const controls = section.querySelector('.related-cases__controls');
    const previous = controls.querySelector('[data-related-previous]');
    const next = controls.querySelector('[data-related-next]');
    function update() {
      const max = track.scrollWidth - track.clientWidth;
      controls.hidden = max <= 1;
      previous.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    }
    function move(direction) {
      const card = track.querySelector('.related-card');
      const amount = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
      track.scrollBy({left: direction * amount, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, {passive: true});
    track.addEventListener('keydown', event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    window.addEventListener('resize', update);
    document.fonts?.ready.then(update);
    update();
  });
})();
