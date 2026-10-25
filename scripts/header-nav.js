/* Progressive enhancement: one underline follows hover/focus, then returns to the current page. */
(() => {
 const nav = document.querySelector('.header-nav');
 const indicator = nav?.querySelector('.nav-indicator');
 if (!indicator) return;
 const links = [...nav.querySelectorAll('a')];
 const active = nav.querySelector('a[aria-current="page"]');
 let hovered = null;
 function update() {
  const focused = links.includes(document.activeElement) ? document.activeElement : null;
  const target = hovered || focused || active;
  indicator.hidden = !target;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const parent = nav.getBoundingClientRect();
  nav.style.setProperty('--nav-indicator-left', `${rect.left - parent.left + nav.scrollLeft}px`);
  nav.style.setProperty('--nav-indicator-width', `${rect.width}px`);
 }
 links.forEach(link => link.addEventListener('pointerenter', () => { hovered = link; update(); }));
 nav.addEventListener('pointerleave', () => { hovered = null; update(); });
 nav.addEventListener('focusin', update);
 nav.addEventListener('focusout', () => requestAnimationFrame(update));
 window.addEventListener('resize', update);
 if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(update);
  observer.observe(nav);
  links.forEach(link => observer.observe(link));
 }
 document.fonts?.ready.then(update);
 update();
 nav.classList.add('has-indicator');
})();
