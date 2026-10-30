/* Keep reconnect useful both in RouterOS popup windows and as an ordinary page. */
(() => {
  'use strict';
  const reconnect = document.querySelector('#reconnect-link');
  if (!reconnect) return;
  const preview = reconnect.getAttribute('href').includes('$(');

  // Local file previews show empty values instead of unexpanded router variables.
  if (preview) {
    reconnect.setAttribute('href', 'login.html');
    document.querySelector('.session-remaining')?.setAttribute('hidden', '');
    for (const value of document.querySelectorAll('[data-router-value]')) value.textContent = '—';
  }

  reconnect.addEventListener('click', (event) => {
    if (window.name !== 'hotspot_logout' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    // Only close this popup after its replacement exists; blocked popups use the link normally.
    const login = window.open(reconnect.href, '_blank');
    if (login) {
      event.preventDefault();
      window.close();
    }
  });

  if (window.Motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const element of document.querySelectorAll('.story-heading, .connection-emblem, .session-content')) {
      window.Motion.animate(element, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        { duration: .8, ease: [.22, 1, .36, 1], fill: 'none' });
    }
  }
})();
