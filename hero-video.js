/* Local, decorative Fairway playback. The photograph remains the no-JS fallback. */
(() => {
  'use strict';
  // Observe the entire chapter, including feature cards: never reload between stages.
  const hero = document.querySelector('[data-video-scene]') || document.querySelector('.hero');
  const video = document.querySelector('#hero-video');
  if (!hero || !video) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const connection = navigator.connection;
  let motionDisabled = document.body.classList.contains('motion-paused');
  let inView = false;
  let currentSource = '';
  let failedSource = '';
  let autoplayBlocked = false;
  let requestId = 0;
  const systemOff = () => reducedMotion.matches || Boolean(connection && connection.saveData);
  const desiredSource = () => mobile.matches ? video.dataset.mobileSrc : video.dataset.src;
  const canPlay = () => inView && !document.hidden && !motionDisabled && !systemOff();

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  function sync() {
    const source = desiredSource();
    // A resized or reduced-motion page must never show a mismatched video crop.
    if (source !== currentSource || systemOff()) hero.classList.remove('video-ready');
    if (!canPlay()) {
      requestId++;
      video.pause();
      return;
    }
    if (!source || failedSource === source || autoplayBlocked) return;
    if (source !== currentSource) {
      requestId++;
      video.pause();
      currentSource = source;
      video.poster = mobile.matches ? video.dataset.mobilePoster : video.dataset.poster;
      video.src = source;
      video.load();
    }
    if (!video.paused) return;
    const attempt = ++requestId;
    const playback = video.play();
    if (playback && typeof playback.catch === 'function') {
      playback.catch((error) => {
        if (attempt !== requestId || error.name === 'AbortError') return;
        hero.classList.remove('video-ready');
        if (error.name === 'NotAllowedError') autoplayBlocked = true;
        else failedSource = currentSource;
      });
    }
  }

  video.addEventListener('playing', () => {
    const attempt = requestId;
    const revealFrame = () => {
      if (attempt === requestId && canPlay() && !video.paused && video.readyState >= 2) {
        hero.classList.add('video-ready');
      }
    };
    if (typeof video.requestVideoFrameCallback === 'function') video.requestVideoFrameCallback(revealFrame);
    else revealFrame();
  });
  video.addEventListener('error', () => {
    failedSource = currentSource;
    hero.classList.remove('video-ready');
    video.pause();
  });
  document.addEventListener('kaveo:motion', (event) => {
    motionDisabled = Boolean(event.detail.disabled);
    // A deliberate resume is also a safe retry after an autoplay restriction.
    if (!motionDisabled) autoplayBlocked = false;
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  mobile.addEventListener('change', sync);
  if (connection && connection.addEventListener) connection.addEventListener('change', sync);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting);
      sync();
    }, { threshold: 0 });
    observer.observe(hero);
  } else {
    const updateVisibility = () => {
      const bounds = hero.getBoundingClientRect();
      inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
      sync();
    };
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility, { passive: true });
    updateVisibility();
  }
})();
