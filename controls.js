// Only existing navigation/form safeguards. No new content animations or app logic.
(() => {
  const header = document.querySelector('.site-header');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 64);
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  updateHeader();
  const form = document.querySelector('#signup-form');
  form.addEventListener('submit', event => event.preventDefault());
  form.querySelector('button[type="submit"]').disabled = true;
  document.querySelectorAll('[data-mood-button]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.moodButton;
      document.querySelectorAll('[data-mood-button]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('[data-image]').forEach(item => item.classList.toggle('is-active', item.dataset.image === selected));
      document.querySelector('#mood-caption').textContent = { fairway:'01 — FAIRWAY', dusk:'02 — ABENDLICHT', mist:'03 — MORGENNEBEL' }[selected];
    });
  });
})();
