/* Same-page image viewer, enhanced from ordinary links for no-JS fallback. */
(() => {
  const viewer = document.querySelector('#case-image-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;
  const image = viewer.querySelector('.image-viewer-image');
  const caption = viewer.querySelector('.image-viewer-caption');
  const stage = viewer.querySelector('.image-viewer-stage');
  const zoom = viewer.querySelector('.image-viewer-zoom');
  const labels = {
    'en-US': { fit: 'Fit to screen', zoom: 'Zoom in' },
    'es-419': { fit: 'Ajustar a la pantalla', zoom: 'Ampliar' },
    'pt-BR': { fit: 'Ajustar à tela', zoom: 'Ampliar' }
  }[document.documentElement.lang] || { fit: 'Ajustar à tela', zoom: 'Ampliar' };
  let trigger = null;
  let savedScroll = null;

  function setZoom(zoomed) {
    viewer.classList.toggle('is-zoomed', zoomed);
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.textContent = zoomed ? labels.fit : labels.zoom;
    if (zoomed) requestAnimationFrame(() => {
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
    });
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('.case-media-link');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    trigger = link;
    savedScroll = { left: window.scrollX, top: window.scrollY };
    const source = link.querySelector('img');
    image.src = source.currentSrc || link.href;
    image.alt = source.alt;
    caption.textContent = source.alt;
    setZoom(false);
    const scrollbarWidth = Math.max(0, innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--image-viewer-scrollbar', `${scrollbarWidth}px`);
    document.documentElement.classList.add('case-image-open');
    viewer.showModal();
  });
  viewer.querySelector('.image-viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target === stage || event.target === viewer.querySelector('.image-viewer-figure')) viewer.close();
  });
  zoom.addEventListener('click', () => setZoom(!viewer.classList.contains('is-zoomed')));
  image.addEventListener('click', () => setZoom(!viewer.classList.contains('is-zoomed')));
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('case-image-open');
    document.documentElement.style.removeProperty('--image-viewer-scrollbar');
    setZoom(false);
    image.removeAttribute('src');
    image.alt = '';
    caption.textContent = '';
    trigger?.focus({ preventScroll: true });
    if (savedScroll) window.scrollTo(savedScroll);
  });
})();
