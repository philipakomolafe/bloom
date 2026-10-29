/* Standalone frontend. The team can replace the preview submit handler below
   with its existing authentication flow; this page makes no login requests. */
(() => {
  'use strict';
  const form = document.querySelector('#login-form');
  const password = form.elements.password;
  const toggle = document.querySelector('.password-toggle');
  const message = document.querySelector('#form-message');

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(show));
    toggle.querySelector('use').setAttribute('href', show ? '#eye-off' : '#eye');
  });

  // INTEGRATION: replace this preview handler with the team's existing sign-in.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const validUsername = Boolean(form.elements.username.value.trim());
    message.textContent = validUsername
      ? 'This is a design preview. No login details have been sent.'
      : 'Enter your username to continue.';
    message.classList.toggle('is-info', validUsername);
    message.hidden = false;
    if (!validUsername) form.elements.username.focus();
  });
  form.addEventListener('input', () => { message.hidden = true; });
  document.querySelector('#script-note').hidden = true;
  document.querySelector('#login-button').disabled = false;
})();

/* One slide per company, shared by desktop and mobile. No playback controls. */
(() => {
  'use strict';
  const carousel = document.querySelector('.brand-carousel');
  const viewport = carousel.querySelector('.carousel-window');
  const track = carousel.querySelector('.carousel-track');
  const originals = [...track.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 1;
  let timer;
  let settleTimer;
  let moving = false;
  let hovered = false;
  let focused = false;
  let visible = true;
  let pointer = null;

  // Hidden bookend copies make the last-to-first transition move in one direction.
  function clone(card) {
    const copy = card.cloneNode(true);
    copy.dataset.clone = 'true';
    copy.setAttribute('aria-hidden', 'true');
    return copy;
  }
  track.prepend(clone(originals.at(-1)));
  track.append(clone(originals[0]));
  const cards = [...track.children];

  function align(animate = true) {
    const gap = parseFloat(getComputedStyle(track).columnGap);
    // Computed width preserves fractional pixels and ignores the side-card scale.
    const layoutWidth = parseFloat(getComputedStyle(cards[index]).width);
    const left = (viewport.clientWidth - layoutWidth) / 2 - index * (layoutWidth + gap);
    if (!animate) track.style.transition = 'none';
    track.style.transform = `translateX(${left}px)`;
    cards.forEach((card, slot) => card.classList.toggle('is-current', slot === index));
    if (!animate) {
      void track.offsetWidth;
      track.style.transition = '';
    }
  }
  function finish() {
    clearTimeout(settleTimer);
    moving = false;
    if (index === 0) { index = originals.length; align(false); }
    else if (index === originals.length + 1) { index = 1; align(false); }
  }
  function schedule() {
    clearTimeout(timer);
    if (!reduced.matches && !hovered && !focused && !pointer && !document.hidden && visible) {
      timer = setTimeout(() => { move(1); schedule(); }, 4200);
    }
  }
  function move(direction) {
    if (moving) return;
    index += direction;
    moving = !reduced.matches;
    align(!reduced.matches);
    if (reduced.matches) finish();
    else settleTimer = setTimeout(finish, 950);
  }
  track.addEventListener('transitionend', (event) => {
    if (event.target === track && event.propertyName === 'transform') finish();
  });
  carousel.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') { hovered = true; schedule(); }
  });
  carousel.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  carousel.addEventListener('focusin', () => { focused = carousel.matches(':focus-visible'); schedule(); });
  carousel.addEventListener('focusout', () => { focused = false; schedule(); });
  carousel.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
    schedule();
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    viewport.setPointerCapture(event.pointerId);
    schedule();
  });
  viewport.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1);
    schedule();
  });
  viewport.addEventListener('pointercancel', () => { pointer = null; schedule(); });
  reduced.addEventListener('change', () => { finish(); align(false); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  new ResizeObserver(() => { finish(); align(false); }).observe(viewport);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting; schedule();
  }).observe(carousel);
  window.addEventListener('pagehide', () => { clearTimeout(timer); clearTimeout(settleTimer); });
  window.addEventListener('pageshow', schedule);
  align(false);
  schedule();

  // The optional local Motion library handles the restrained page entrance.
  if (window.Motion && !reduced.matches) {
    for (const element of document.querySelectorAll('.story-heading, .login-content')) {
      window.Motion.animate(element, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        { duration: .8, ease: [.22, 1, .36, 1], fill: 'none' });
    }
  }
})();
