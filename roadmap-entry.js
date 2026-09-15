// Run before the document's fragment target exists. The old preview fragment
// now means the beginning of the experience, not a jump past its introduction.
// Deliberate package bookmarks and back/forward restoration stay untouched.
(() => {
  const legacyEntry = window.location.hash === '#entwicklungsweg';
  const startEntry = ['', '#start'].includes(window.location.hash)
    && window.performance.getEntriesByType('navigation')[0]?.type !== 'back_forward';
  if (!legacyEntry && !startEntry) return;
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  if (legacyEntry) window.history.replaceState(window.history.state, '',
    window.location.pathname + window.location.search + '#start');
  const reset = () => window.scrollTo({top:0, left:0, behavior:'instant'});
  reset();
  // Some embedded browsers restore after parsing; settle once after pageshow,
  // not on later layout/scroll events or a bfcache return.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) window.requestAnimationFrame(reset);
  }, {once:true});
})();
