/* RouterOS owns authentication; local previews never send credentials. */
(() => {
  'use strict';
  const form = document.querySelector('#login-form');
  if (!form) return;
  const username = form.elements.username;
  const password = form.elements.password;
  const toggle = document.querySelector('.password-toggle');
  const message = document.querySelector('#form-message');
  const button = document.querySelector('#login-button');
  const trial = document.querySelector('#trial-access');
  const preview = form.getAttribute('action').includes('$(');
  let submitting = false;

  // Unexpanded templates are previews; router errors remain text, never injected HTML.
  if (preview) {
    username.value = '';
    message.textContent = '';
  }
  message.hidden = !message.textContent.trim();
  trial.hidden = preview || trial.dataset.available !== 'yes' || !message.hidden;

  function showMessage(text, info = false) {
    message.textContent = text;
    message.classList.toggle('is-info', info);
    message.hidden = false;
  }

  function resetSubmission() {
    submitting = false;
    button.disabled = false;
    button.querySelector('span').textContent = 'Log in & connect';
    form.removeAttribute('aria-busy');
    const chapForm = document.querySelector('#chap-form');
    if (chapForm) chapForm.reset();
  }

  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(show));
    toggle.querySelector('use').setAttribute('href', show ? '#eye-off' : '#eye');
  });

  // Validate locally, then hand the original form or its CHAP response to RouterOS.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!username.value.trim()) {
      showMessage('Enter your username to continue.');
      username.focus();
      return;
    }
    if (!form.reportValidity()) return;
    if (preview) {
      showMessage('This is a design preview. No login details have been sent.', true);
      return;
    }

    let submittedForm = form;
    if (form.dataset.chap === 'yes') {
      // A missing challenge script must never fall back to sending the clear password.
      submittedForm = document.querySelector('#chap-form');
      if (!submittedForm || typeof window.hotspotChapResponse !== 'function' || typeof window.hexMD5 !== 'function') {
        showMessage('The login page could not load completely. Reload the page and try again.');
        return;
      }
      submittedForm.elements.username.value = username.value;
      submittedForm.elements.password.value = window.hotspotChapResponse(password.value);
    }

    submitting = true;
    message.hidden = true;
    button.disabled = true;
    button.querySelector('span').textContent = 'Connecting…';
    form.setAttribute('aria-busy', 'true');
    try {
      HTMLFormElement.prototype.submit.call(submittedForm);
    } catch {
      resetSubmission();
      showMessage('We couldn’t connect. Please reload the page and try again.');
    }
  });
  form.addEventListener('input', () => { message.hidden = true; });
  // Back navigation restores a usable form instead of a permanently disabled button.
  window.addEventListener('pageshow', resetSubmission);
  document.querySelector('#script-note').hidden = true;
  resetSubmission();
})();

/* One slide per company, shared by desktop and mobile. No playback controls. */
(() => {
  'use strict';
  const carousel = document.querySelector('.brand-carousel');
  if (!carousel) return;
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
  let suppressClick = false;

  // Hidden bookend copies make the last-to-first transition move in one direction.
  function clone(card) {
    const copy = card.cloneNode(true);
    copy.dataset.clone = 'true';
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelector('.company-link').tabIndex = -1;
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
    // Only the visible original link belongs in the keyboard and screen-reader order.
    cards.forEach((card, slot) => {
      const current = slot === index;
      const accessible = current && !card.dataset.clone;
      card.classList.toggle('is-current', current);
      card.setAttribute('aria-hidden', String(!accessible));
      card.querySelector('.company-link').tabIndex = accessible ? 0 : -1;
    });
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
  carousel.addEventListener('focusin', () => { focused = true; schedule(); });
  carousel.addEventListener('focusout', (event) => { focused = carousel.contains(event.relatedTarget); schedule(); });
  carousel.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    // Return focus to the carousel before the old slide leaves the accessible view.
    carousel.focus({ preventScroll: true });
    move(event.key === 'ArrowRight' ? 1 : -1);
    schedule();
  });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick = false;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    schedule();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - pointer.x);
    const dy = Math.abs(event.clientY - pointer.y);
    // Ordinary taps keep native link behavior; only an intentional horizontal drag is captured.
    if (dx > 8 && dx > dy && !viewport.hasPointerCapture(event.pointerId)) viewport.setPointerCapture(event.pointerId);
  });
  window.addEventListener('pointerup', (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressClick = true;
      // A swipe can start on a focused link; keep focus on the carousel as it changes.
      if (carousel.contains(document.activeElement)) carousel.focus({ preventScroll: true });
      move(dx < 0 ? 1 : -1);
    }
    schedule();
  });
  viewport.addEventListener('click', (event) => {
    // The click generated at the end of a swipe must not launch the company website.
    if (suppressClick && event.detail !== 0) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  }, true);
  viewport.addEventListener('pointercancel', () => { pointer = null; suppressClick = false; schedule(); });
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
