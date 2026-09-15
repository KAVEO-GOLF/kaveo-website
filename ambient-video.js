// Ambient playback only. Ball motion and loop-seam editing are deliberately deferred.
(() => {
  const world = document.querySelector('#story-world');
  const video = document.querySelector('#story-ambient-video');
  const toggle = document.querySelector('.story-video-toggle');
  if (!world || !video || !toggle) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const connection = navigator.connection;
  const bounds = world.getBoundingClientRect();
  let inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
  let userPaused = false;
  let blocked = false;
  let failed = false;
  let loaded = false;
  let pending = false;
  let resumeRequested = false;
  let detailPaused = false;

  const stillOnly = () => reducedMotion.matches || mobile.matches || Boolean(connection?.saveData);
  const canPlay = () => !stillOnly() && inView && !document.hidden && !userPaused && !blocked && !failed && !detailPaused;
  const updateToggle = () => {
    toggle.hidden = stillOnly() || failed;
    toggle.textContent = userPaused || blocked ? 'Hintergrund abspielen' : 'Hintergrund pausieren';
    toggle.setAttribute('aria-pressed', String(userPaused || blocked));
  };

  const sync = () => {
    updateToggle();
    if (!canPlay()) {
      video.pause();
      if (stillOnly() || failed) video.classList.remove('is-ready');
      return;
    }
    if (!loaded) {
      video.muted = true;
      video.defaultMuted = true;
      video.src = video.dataset.src;
      loaded = true;
    }
    if (!video.paused) return;
    if (pending) { resumeRequested = true; return; }
    pending = true;
    Promise.resolve(video.play()).catch(error => {
      if (error.name !== 'AbortError' && canPlay()) {
        blocked = true;
        video.classList.remove('is-ready');
        updateToggle();
      }
    }).finally(() => {
      pending = false;
      if (resumeRequested) { resumeRequested = false; sync(); }
    });
  };

  video.addEventListener('playing', () => {
    if (canPlay()) video.classList.add('is-ready');
    else video.pause();
  });
  video.addEventListener('error', () => {
    failed = true;
    sync();
  });
  toggle.addEventListener('click', () => {
    if (blocked || userPaused) { blocked = false; userPaused = false; }
    else userPaused = true;
    sync();
  });
  reducedMotion.addEventListener('change', sync);
  mobile.addEventListener('change', sync);
  connection?.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  // The inline network requests a temporary hold, never direct video playback.
  document.addEventListener('kaveo:network-detail', event => {
    detailPaused = Boolean(event.detail?.open);
    sync();
  });
  window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', () => video.pause());
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      sync();
    });
    observer.observe(world);
  } else {
    window.addEventListener('scroll', () => {
      const rect = world.getBoundingClientRect();
      inView = rect.bottom > 0 && rect.top < window.innerHeight;
      sync();
    }, { passive:true });
  }
  sync();
})();
