/* Progressive enhancement. The complete content remains visible without JS. */
(() => {
  'use strict';
  const form = document.querySelector('#signup-form');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    document.querySelector('#form-note').textContent = 'Danke für dein Interesse. Dies ist eine Designvorschau — du bist noch nicht vorgemerkt. Es wurden keine Daten übertragen oder gespeichert.';
  });
  form.querySelector('button[type="submit"]').disabled = false;
  document.querySelectorAll('[data-mood-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.dataset.moodButton;
      document.querySelectorAll('[data-mood-button]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('[data-image]').forEach((item) => item.classList.toggle('is-active', item.dataset.image === selected));
      document.querySelector('#mood-caption').textContent = { fairway: '01 — FAIRWAY', dusk: '02 — ABENDLICHT', mist: '03 — MORGENNEBEL' }[selected];
    });
  });

  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pinLayout = window.matchMedia('(min-width: 901px) and (min-height: 760px)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const connection = navigator.connection;
  const saveData = () => Boolean(connection && connection.saveData);
  const control = document.querySelector('#motion-control');
  const header = document.querySelector('.site-header');
  const assembly = document.querySelector('.assembly');
  const assemblyCopy = document.querySelector('.assembly-copy');
  const assemblyVisual = document.querySelector('.assembly-visual');
  const device = document.querySelector('.app-device');
  const screen = document.querySelector('.device-screen');
  const grid = document.querySelector('.app-grid');
  const introScene = document.querySelector('[data-video-scene]');
  const features = document.querySelector('.features');
  const mood = document.querySelector('.mood');
  const signup = document.querySelector('.signup');
  const reading = document.querySelector('.reading-reveal');
  const manifesto = document.querySelector('.manifesto');
  const cards = [...document.querySelectorAll('.feature-card')];
  const tiles = [...document.querySelectorAll('.app-tile')];
  const steps = [...document.querySelectorAll('[data-step]')];
  const spatial = globalThis.KaveoSpatial;
  const pointers = [...document.querySelectorAll('[data-glare]')].map((element) => ({
    element, boundsElement: element.closest('.feature-art') || element.closest('.mood') || element,
    active: false, x: 0, y: 0,
  }));
  let paused = false;
  let frame = 0;
  let previousTime = 0;
  let smoothY = window.scrollY;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const easeRange = (start, end, value) => { const t = clamp((value - start) / (end - start)); return t * t * (3 - 2 * t); };
  const systemOff = () => reducedMotion.matches || saveData();
  const motionOff = () => systemOff() || paused;

  const words = reading.textContent.trim().split(/\s+/).map((text) => {
    const word = document.createElement('span');
    word.className = 'word';
    word.textContent = text;
    return word;
  });
  reading.replaceChildren();
  words.forEach((word, index) => { reading.append(word); if (index < words.length - 1) reading.append(' '); });

  document.querySelectorAll('.feature-copy').forEach((copy) => {
    [...copy.querySelectorAll('h3, p, .feature-tags')].forEach((element, index) => {
      element.classList.add('reveal');
      element.style.setProperty('--reveal-delay', `${index * 100}ms`);
    });
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  }

  function render(time) {
    frame = 0;
    if (document.hidden) return;
    const actualY = window.scrollY;
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    const off = motionOff();
    smoothY = off ? actualY : smoothY + (actualY - smoothY) * (1 - Math.exp(-elapsed / 150));
    if (Math.abs(actualY - smoothY) < 0.2) smoothY = actualY;
    const viewportHeight = window.innerHeight;
    const correction = actualY - smoothY;
    // Read layout together; write transforms only after the measurements.
    const assemblyRect = assembly.getBoundingClientRect();
    const copyHeight = assemblyCopy.offsetHeight;
    const deviceWidth = device.offsetWidth;
    const deviceHeight = device.offsetHeight;
    const visualWidth = assemblyVisual.offsetWidth;
    const tileLayouts = tiles.map((tile) => ({ width: tile.offsetWidth,
      slotX: screen.offsetLeft + grid.offsetLeft + tile.offsetLeft + tile.offsetWidth / 2 - deviceWidth / 2 }));
    const manifestoRect = manifesto.getBoundingClientRect();
    const featuresRect = features.getBoundingClientRect();
    const introRect = introScene.getBoundingClientRect();
    const moodRect = mood.getBoundingClientRect();
    const signupRect = signup.getBoundingClientRect();
    const cardRects = cards.map((card) => card.getBoundingClientRect());
    const cardHeights = cards.map((card) => card.offsetHeight);
    const pointerRects = pointers.map((item) => item.active ? item.boundsElement.getBoundingClientRect() : null);
    const eligible = pinLayout.matches && finePointer.matches && !systemOff();
    // Side-entry cards need real horizontal clearance from both the copy and viewport.
    const pinned = eligible && window.innerWidth >= 1200 && visualWidth >= 560 && copyHeight <= viewportHeight - 192;
    const stacked = eligible && cardHeights.every((height) => height <= viewportHeight - 192);
    // Geometry switches happen before the next measurement frame, never mid-pose.
    const layoutChanged = body.classList.contains('spatial-enabled') !== pinned || body.classList.contains('stack-enabled') !== stacked;
    body.classList.toggle('spatial-enabled', pinned);
    body.classList.toggle('stack-enabled', stacked);
    if (layoutChanged) { schedule(); return; }
    const depthEnabled = pinned && !off;
    const assemblyProgress = off ? 1 : pinned
      ? clamp(-(assemblyRect.top + correction) / Math.max(1, assemblyRect.height - viewportHeight))
      : easeRange(viewportHeight * 0.92, viewportHeight * 0.26, assemblyRect.top + correction);
    const assemblyPose = spatial.assembly(assemblyProgress, 0, window.innerWidth, depthEnabled);
    const spread = assemblyPose.stage;

    header.classList.toggle('is-scrolled', actualY > 64);
    // The Fairway frame stays locked: the ambient video provides its own movement.
    const introPose = spatial.intro(manifestoRect.top + correction, assemblyRect.top + correction,
      featuresRect.top + correction, introRect.top + introRect.height + correction, viewportHeight);
    introScene.style.setProperty('--intro-dim', String(introPose.dim));
    introScene.style.setProperty('--intro-exit', String(introPose.exit));
    assembly.style.setProperty('--assembly-progress', String(assemblyProgress));
    assembly.style.setProperty('--stage-spread', String(spread));
    device.style.setProperty('--device-scale', String(pinned
      ? spatial.deviceScale(viewportHeight, deviceHeight, deviceWidth, Math.max(...tileLayouts.map(tile => tile.width)), visualWidth) : 1));
    device.style.setProperty('--frame-alpha', '0.25');
    device.style.setProperty('--stage-spread', String(spread));
    device.style.setProperty('--material-light', String(.45 + spread * .35));
    device.style.setProperty('--device-rx', `${spread * 4}deg`);
    device.style.setProperty('--device-ry', `${spread * -6}deg`);
    device.style.setProperty('--device-rz', `${spread * -1}deg`);
    tiles.forEach((tile, index) => {
      const pose = spatial.assembly(assemblyProgress, index, window.innerWidth, depthEnabled);
      const { x, y } = spatial.tileOffset(pose.spread, Math.sign(Number(tile.dataset.x)),
        deviceWidth, tileLayouts[index].width, tileLayouts[index].slotX, Number(tile.dataset.y));
      const rotation = Number(tile.dataset.rotation) * pose.spread * .6;
      tile.style.setProperty('--tile-icon-z', `${pose.iconZ}px`);
      tile.style.transform = `translate3d(${x}px,${y}px,${pose.z}px) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${rotation}deg)`;
    });
    steps.forEach((element, index) => element.classList.toggle('is-active', index === assemblyPose.step));
    const readingProgress = off ? 1 : clamp((viewportHeight * 0.92 - manifestoRect.top - correction) / (manifestoRect.height + viewportHeight * 0.1));
    words.forEach((word, index) => {
      const lit = easeRange(index / words.length - 0.07, (index + 1) / words.length, readingProgress);
      word.style.setProperty('--word-opacity', String(0.23 + lit * 0.77));
    });
    mood.style.setProperty('--mood-shift', `${off ? 0 : clamp((viewportHeight / 2 - moodRect.top - correction - moodRect.height / 2) * 0.055, -36, 36)}px`);
    const moodPose = spatial.windowPose(moodRect.top + correction, viewportHeight, depthEnabled);
    mood.style.setProperty('--window-inset', `${moodPose.inset}px`);
    mood.style.setProperty('--window-radius', `${moodPose.radius}px`);
    mood.style.setProperty('--panel-y', `${moodPose.panelY}px`);
    mood.style.setProperty('--panel-rx', `${moodPose.panelRX}deg`);
    mood.style.setProperty('--panel-scale', String(moodPose.panelScale));
    signup.style.setProperty('--signup-shift', `${off ? 0 : clamp((viewportHeight / 2 - signupRect.top - correction - signupRect.height / 2) * 0.04, -28, 28)}px`);
    cards.forEach((card, index) => {
      const next = cardRects[index + 1];
      const coverage = stacked && next && !off ? clamp((viewportHeight * 0.72 - next.top) / (viewportHeight * 0.72 - 144)) : 0;
      card.style.setProperty('--card-scale', String(1 - coverage * 0.035));
      card.style.setProperty('--card-shade', String(coverage * 0.18));
      const pose = spatial.feature(cardRects[index].top + correction, cardHeights[index], viewportHeight, depthEnabled);
      card.style.setProperty('--art-y', `${pose.y}px`);
      card.style.setProperty('--art-z', `${pose.z}px`);
      card.style.setProperty('--art-rx', `${pose.rx}deg`);
      card.style.setProperty('--art-photo-y', `${pose.photoY}px`);
      card.style.setProperty('--art-icon-z', `${pose.iconZ}px`);
      card.style.setProperty('--community-depth', String(pose.community));
    });
    pointers.forEach((item, index) => {
      const enabled = item.active && !off && finePointer.matches;
      const pose = spatial.pointer(item.x, item.y, pointerRects[index] || {}, enabled);
      item.element.style.setProperty('--pointer-x', `${pose.x}%`);
      item.element.style.setProperty('--pointer-y', `${pose.y}%`);
      item.element.style.setProperty('--glare-opacity', String(pose.glare));
      const tilt = depthEnabled && item.element.hasAttribute('data-tilt');
      item.element.style.setProperty('--tilt-x', `${tilt ? pose.rx : 0}deg`);
      item.element.style.setProperty('--tilt-y', `${tilt ? pose.ry : 0}deg`);
    });
    if (!off && smoothY !== actualY) schedule();
  }

  function schedule() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(render);
  }

  function syncPreferences() {
    body.classList.toggle('has-motion', !systemOff());
    body.classList.toggle('motion-paused', motionOff());
    control.hidden = systemOff();
    control.setAttribute('aria-pressed', String(paused));
    control.setAttribute('aria-label', paused ? 'Animationen fortsetzen' : 'Animationen pausieren');
    control.querySelector('span').textContent = paused ? 'Bewegung fortsetzen' : 'Bewegung pausieren';
    control.querySelector('use').setAttribute('href', paused ? '#play' : '#pause');
    if (motionOff()) resetPointers();
    document.dispatchEvent(new CustomEvent('kaveo:motion', { detail: { disabled: motionOff() } }));
    schedule();
  }
  control.addEventListener('click', () => { paused = !paused; syncPreferences(); });
  reducedMotion.addEventListener('change', syncPreferences);
  if (connection && connection.addEventListener) connection.addEventListener('change', syncPreferences);
  pinLayout.addEventListener('change', schedule);
  finePointer.addEventListener('change', () => { resetPointers(); schedule(); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.addEventListener('load', schedule, { once: true });
  document.fonts.ready.then(schedule);
  document.addEventListener('visibilitychange', () => {
    body.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) {
      resetPointers();
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
    }
    else { previousTime = 0; schedule(); }
  });
  function resetPointers() {
    pointers.forEach((item) => {
      item.active = false;
      item.element.style.setProperty('--glare-opacity', '0');
      item.element.style.setProperty('--tilt-x', '0deg');
      item.element.style.setProperty('--tilt-y', '0deg');
    });
  }
  pointers.forEach((item) => {
    item.element.addEventListener('pointermove', (event) => {
      if (motionOff() || document.hidden || !finePointer.matches) return;
      item.active = true;
      item.x = event.clientX;
      item.y = event.clientY;
      schedule();
    }, { passive: true });
    const leave = () => { item.active = false; schedule(); };
    item.element.addEventListener('pointerleave', leave);
    item.element.addEventListener('pointercancel', leave);
  });
  syncPreferences();
})();
