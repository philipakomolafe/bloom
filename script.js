/* Bloom — plain browser JavaScript. No imports, packages, build step, or server.
   CONTENT: edit the company articles and dialog copy in index.html.
   TIMING: change SPOTLIGHT_INTERVAL below; visual effects live in styles.css. */
(() => {
  'use strict';

  const SPOTLIGHT_INTERVAL = 7500;
  const TRANSITION_DURATION = 1050;
  const EASING = 'cubic-bezier(.22, 1, .36, 1)';
  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const find = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const network = find('#network');
  const directory = find('#directory');
  const spotlight = find('#spotlight');
  const search = find('#company-search');
  const sectorFilter = find('#sector-filter');
  const mobileNavigation = find('#mobile-navigation');
  const mobileMenuButton = find('.mobile-menu-button');
  const introDialog = find('#connect-dialog');
  const introForm = find('#introduction-form');
  const introStage = find('#intro-stage');
  const introSteps = all('[data-step]');

  // Read the HTML once so every view uses the same editable company information.
  const companies = all('[data-company]').map((card) => ({
    card,
    id: card.dataset.company,
    name: find('.company-card-name', card).textContent.trim(),
    sector: find('.sector-label', card).textContent.trim(),
    description: find('.company-card-description', card).textContent.trim(),
    headline: find('.company-headline', card).textContent.trim(),
    detail: find('.company-detail', card).textContent.trim(),
    logo: find('img', card).getAttribute('src'),
    url: find('.company-source', card).href,
  }));
  const sectors = [...new Set(companies.map((company) => company.sector))];
  const state = {
    view: 'network', filtered: companies, activeIndex: 0,
    inView: false, keyboardFocus: false, dialog: null, dialogTrigger: null,
    timer: null, startedAt: 0, remaining: SPOTLIGHT_INTERVAL,
    introStep: 0, introBusy: false, introTransition: 0,
  };

  function animate(element, frames, duration = 400, delay = 0) {
    if (reducedMotion.matches) return Promise.resolve();
    return element.animate(frames, { duration, delay, easing: EASING }).finished.catch(() => {});
  }

  // NETWORK: positions match the SVG paths; the mobile arrangement is in CSS.
  const positions = [
    { x: 42, y: 18, scale: 0.76 }, { x: 70, y: 14, scale: 0.65 },
    { x: 87, y: 43, scale: 0.85 }, { x: 82, y: 82, scale: 0.69 },
    { x: 36, y: 82, scale: 0.64 },
  ];
  const satellites = positions.map((position, slot) => {
    const node = find('#satellite-template').content.firstElementChild.cloneNode(true);
    node.classList.add(`satellite-${slot}`);
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
    node.style.setProperty('--node-scale', position.scale);
    find('button', node).addEventListener('click', () => selectCompany(Number(node.dataset.index)));
    find('#satellites').append(node);
    return node;
  });

  function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NAMESPACE, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function addConnection(group, path, index, desktop) {
    group.append(svgElement('path', {
      d: path, fill: 'none', stroke: desktop ? 'url(#connection-gradient)' : '#a9cb82',
      'stroke-width': index === 0 ? 1.4 : 0.7, 'stroke-opacity': desktop ? 1 : 0.3,
    }));
    const particle = svgElement('circle', { r: index === 0 ? 2.4 : 1.6, fill: '#d6edb8', class: 'connection-particle' });
    particle.append(svgElement('animateMotion', {
      path, dur: `${4.5 + index * 0.6}s`, begin: `${index * 0.8}s`,
      repeatCount: 'indefinite', calcMode: 'spline', keyTimes: '0;1', keySplines: '.32 .1 .65 1',
    }));
    particle.append(svgElement('animate', {
      attributeName: 'opacity', values: '0;.9;.9;0', keyTimes: '0;.12;.8;1',
      dur: `${4.5 + index * 0.6}s`, begin: `${index * 0.8}s`, repeatCount: 'indefinite',
    }));
    group.append(particle);
  }

  function drawConnections() {
    const desktop = find('.desktop-lines .network-paths');
    const mobile = find('.mobile-lines .network-paths');
    desktop.replaceChildren();
    mobile.replaceChildren();
    const endpoints = [{ x: 59, y: 42 }, ...positions];
    endpoints.slice(0, state.filtered.length).forEach(({ x, y }, index) => {
      addConnection(desktop, `M185 225 C330 225 ${x * 10 - 150} ${y * 4.6} ${x * 10} ${y * 4.6}`, index, true);
    });
    const mobilePaths = [
      'M250 147 C420 147 500 165 690 165', 'M250 147 C150 230 140 425 240 425',
      'M250 147 C490 147 370 437 540 437', 'M250 147 C700 147 650 432 820 432',
    ];
    mobilePaths.slice(0, state.filtered.length).forEach((path, index) => addConnection(mobile, path, index, false));
    find('.perimeter-path').style.display = state.filtered.length > 5 ? '' : 'none';
  }

  function selectCompany(index) {
    if (!state.filtered.length) return;
    clearTimeout(state.timer);
    state.timer = null;
    state.remaining = SPOTLIGHT_INTERVAL;
    state.activeIndex = index % state.filtered.length;
    const company = state.filtered[state.activeIndex];

    // Overlap the incoming and outgoing cards without leaving duplicate focus targets.
    all('.is-leaving', spotlight).forEach((element) => element.remove());
    const previous = spotlight.firstElementChild;
    if (previous) {
      previous.classList.add('is-leaving');
      previous.inert = true;
      previous.setAttribute('aria-hidden', 'true');
      animate(previous, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.05) translateY(-10px)' }], TRANSITION_DURATION).then(() => previous.remove());
    }
    const next = find('#spotlight-template').content.firstElementChild.cloneNode(true);
    find('img', next).src = company.logo;
    find('img', next).alt = company.name;
    find('button', next).setAttribute('aria-label', `Discover ${company.name}`);
    find('button', next).addEventListener('click', () => openCompany(company));
    find('.sector-label', next).textContent = company.sector;
    find('h3', next).textContent = company.name;
    find('p', next).textContent = company.description;
    spotlight.append(next);
    animate(next, [{ opacity: 0, transform: 'scale(.88) translateY(15px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }], TRANSITION_DURATION);

    satellites.forEach((node, slot) => {
      node.hidden = slot >= state.filtered.length - 1;
      if (node.hidden) return;
      const companyIndex = (state.activeIndex + slot + 1) % state.filtered.length;
      const satellite = state.filtered[companyIndex];
      node.dataset.index = companyIndex;
      find('img', node).src = satellite.logo;
      find('.satellite-name', node).textContent = satellite.name;
      find('button', node).setAttribute('aria-label', `Spotlight ${satellite.name}`);
      animate(find('.satellite-logo', node), [{ opacity: 0, transform: 'translateY(12px) scale(.9)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], TRANSITION_DURATION, slot * 45);
    });
    updatePlayback();
  }

  function updatePlayback() {
    const moving = !reducedMotion.matches && state.view === 'network' && state.inView &&
      !document.hidden && !state.keyboardFocus && !state.dialog && mobileNavigation.hidden;
    network.classList.toggle('is-paused', !moving);
    all('.connection-lines').forEach((svg) => moving ? svg.unpauseAnimations() : svg.pauseAnimations());
    if ((!moving || state.filtered.length < 2) && state.timer !== null) {
      state.remaining = Math.max(0, state.remaining - (performance.now() - state.startedAt));
      clearTimeout(state.timer);
      state.timer = null;
    } else if (moving && state.filtered.length > 1 && state.timer === null) {
      state.startedAt = performance.now();
      state.timer = setTimeout(() => selectCompany(state.activeIndex + 1), state.remaining);
    }
  }

  // FILTERS: hide existing articles, preserving readable HTML and stable focus.
  function renderView() {
    const hasResults = state.filtered.length > 0;
    network.hidden = state.view !== 'network' || !hasResults;
    directory.hidden = state.view !== 'directory' || !hasResults;
    find('#empty-results').hidden = hasResults;
    find('.experience-frame').classList.toggle('directory-frame', state.view === 'directory');
    find('#directory-caption').hidden = state.view !== 'directory';
    const count = state.filtered.length;
    find('#result-count').textContent = `${count} ${count === 1 ? 'business' : 'businesses'}. Each with something remarkable to share.`;
    companies.forEach((company) => { company.card.hidden = !state.filtered.includes(company); });
    all('[data-view]').forEach((control) => {
      const selected = control.dataset.view === state.view;
      control.classList.toggle(control.tagName === 'BUTTON' ? 'selected' : 'active', selected);
      if (control.tagName === 'BUTTON') control.setAttribute('aria-pressed', selected);
    });
    if (state.view === 'directory') state.filtered.forEach(({ card }, index) => {
      animate(card, [{ opacity: 0, transform: 'translateY(15px)' }, { opacity: 1, transform: 'translateY(0)' }], 550, Math.min(index * 35, 245));
    });
    updatePlayback();
  }

  function applyFilters() {
    const query = search.value.trim().toLocaleLowerCase();
    state.filtered = companies.filter((company) =>
      (sectorFilter.value === 'All sectors' || company.sector === sectorFilter.value) &&
      `${company.name} ${company.sector} ${company.description}`.toLocaleLowerCase().includes(query));
    find('#clear-search').hidden = !search.value;
    renderView();
    drawConnections();
    selectCompany(0);
  }

  function toggleSearch(open) {
    search.hidden = !open;
    find('.search-box').classList.toggle('is-open', open);
    find('#search-toggle').setAttribute('aria-expanded', open);
    (open ? search : find('#search-toggle')).focus();
  }

  function setMobileMenu(open) {
    mobileNavigation.hidden = !open;
    mobileMenuButton.classList.toggle('is-open', open);
    mobileMenuButton.setAttribute('aria-expanded', open);
    mobileMenuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open) animate(mobileNavigation, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }]);
    updatePlayback();
  }

  // DIALOGS: use the browser's modal behavior, with a short entrance and exit.
  function openDialog(dialog) {
    state.dialogTrigger = document.activeElement;
    state.dialog = dialog;
    if (dialog === introDialog) {
      state.introTransition++;
      state.introBusy = false;
      introForm.reset();
      find('#intro-error').hidden = true;
      renderIntroStep(0);
    }
    if (dialog.id === 'share-dialog') prepareShare();
    dialog.showModal();
    document.body.style.setProperty('--scrollbar-space', `${window.innerWidth - document.documentElement.clientWidth}px`);
    document.body.classList.add('modal-open');
    (dialog === introDialog ? find('#intro-name') : find('.dialog-title', dialog)).focus({ preventScroll: true });
    animate(dialog, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 380);
    updatePlayback();
  }

  async function closeDialog(dialog) {
    if (!dialog.open || dialog.dataset.closing) return;
    dialog.dataset.closing = 'true';
    await animate(dialog, [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(10px) scale(.98)' }], 180);
    dialog.close();
    delete dialog.dataset.closing;
  }

  function openCompany(company) {
    find('#company-logo').src = company.logo;
    find('#company-title').textContent = company.name;
    find('#company-sector').textContent = company.sector;
    find('#company-headline').textContent = company.headline;
    find('#company-detail').textContent = company.detail;
    find('#company-link').href = company.url;
    find('#company-source-link').href = company.url;
    openDialog(find('#company-dialog'));
  }

  function renderIntroStep(step) {
    state.introStep = step;
    const name = find('#intro-name').value.trim();
    const firstName = name.split(/\s+/)[0];
    introSteps.forEach((panel, index) => { panel.hidden = index !== step; });
    find('#intro-title').textContent = introSteps[step].dataset.title.replace('{name}', firstName);
    find('#intro-description').textContent = introSteps[step].dataset.description;
    find('#intro-back').hidden = step === 0;
    find('.step-indicators').setAttribute('aria-label', `Step ${step + 1} of 3`);
    all('.step-indicators > span').forEach((indicator, index) => {
      indicator.classList.toggle('complete', index <= step);
      indicator.firstElementChild.textContent = index < step ? '✓' : index + 1;
    });
    if (step === 2) {
      // Encode a reviewable draft; no form information is stored or sent by the site.
      const business = find('#intro-business').value.trim();
      const goal = find('input[name="goal"]:checked');
      const recipient = goal.dataset.recipient;
      const body = `Hello MetroReach,\n\nI'm ${name} from ${business}. I discovered your company through Bloom and would like to ${goal.value.toLowerCase()}.\n\nPlease share the next steps.\n\nThank you,\n${name}`;
      find('[data-first-name]').textContent = firstName;
      find('#intro-from').textContent = `${name} · ${business}`;
      find('#intro-goal').textContent = goal.value;
      find('#intro-recipient').textContent = recipient;
      find('#email-draft').href = `mailto:${recipient}?subject=${encodeURIComponent(`Bloom introduction: ${goal.value}`)}&body=${encodeURIComponent(body)}`;
    }
  }

  async function changeIntroStep(next) {
    if (state.introBusy) return;
    state.introBusy = true;
    const token = ++state.introTransition;
    const direction = next > state.introStep ? 1 : -1;
    await animate(introStage, [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-direction * 18}px)` }], 130);
    if (token !== state.introTransition || !introDialog.open) return;
    renderIntroStep(next);
    await animate(introStage, [{ opacity: 0, transform: `translateX(${direction * 22}px)` }, { opacity: 1, transform: 'translateX(0)' }], 280);
    if (token !== state.introTransition || !introDialog.open) return;
    state.introBusy = false;
    find('#intro-title').focus({ preventScroll: true });
  }

  function prepareShare() {
    const local = window.location.protocol === 'file:';
    find('#share-local').hidden = !local;
    find('#share-web').hidden = local;
    find('#copy-status').textContent = '';
    find('#copy-link > span').textContent = 'Copy link';
    // A local filesystem path is not a shareable address; local visitors share the folder.
    find('#share-url').value = local ? '' : `${window.location.origin}${window.location.pathname}#ecosystem`;
  }

  // EVENTS: every content field above remains ordinary editable HTML.
  all('[data-view]').forEach((control) => control.addEventListener('click', (event) => {
    event.preventDefault();
    state.view = control.dataset.view;
    setMobileMenu(false);
    renderView();
    if (control.tagName === 'A') find('#ecosystem').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }));
  companies.forEach((company) => {
    const button = find('button', company.card);
    button.setAttribute('aria-label', `Read about ${company.name}`);
    button.addEventListener('click', () => openCompany(company));
  });
  sectorFilter.addEventListener('change', applyFilters);
  search.addEventListener('input', () => { state.view = 'directory'; applyFilters(); });
  find('#search-toggle').addEventListener('click', () => toggleSearch(search.hidden));
  find('#clear-search').addEventListener('click', () => { search.value = ''; applyFilters(); search.focus(); });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); search.value = ''; applyFilters(); toggleSearch(false); }
  });
  find('#reset-filters').addEventListener('click', () => {
    search.value = '';
    sectorFilter.value = 'All sectors';
    applyFilters();
    find(`.view-switch [data-view="${state.view}"]`).focus();
  });
  mobileMenuButton.addEventListener('click', () => setMobileMenu(mobileNavigation.hidden));
  all('a', mobileNavigation).forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNavigation.hidden) { setMobileMenu(false); mobileMenuButton.focus(); }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!mobileNavigation.hidden && !mobileNavigation.contains(event.target) && !mobileMenuButton.contains(event.target)) setMobileMenu(false);
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => { if (event.matches) setMobileMenu(false); });

  all('[data-open]').forEach((button) => button.addEventListener('click', () => openDialog(find(`#${button.dataset.open}`))));
  all('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  all('dialog').forEach((dialog) => {
    const outside = (event) => {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    let backdropStart = false;
    dialog.addEventListener('pointerdown', (event) => { backdropStart = event.target === dialog && outside(event); });
    dialog.addEventListener('click', (event) => { if (backdropStart && event.target === dialog && outside(event)) closeDialog(dialog); });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('close', () => {
      state.introTransition++;
      state.introBusy = false;
      state.dialog = null;
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('--scrollbar-space');
      state.dialogTrigger?.focus({ preventScroll: true });
      updatePlayback();
    });
  });
  introForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // Native required/maxlength checks run first; trim whitespace before proceeding.
    if (state.introStep === 0 && (!find('#intro-name').value.trim() || !find('#intro-business').value.trim())) {
      find('#intro-error').hidden = false;
      return;
    }
    find('#intro-error').hidden = true;
    if (state.introStep < 2) changeIntroStep(state.introStep + 1);
  });
  find('#intro-back').addEventListener('click', () => changeIntroStep(state.introStep - 1));
  find('#share-url').addEventListener('focus', (event) => event.target.select());
  find('#copy-link').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(find('#share-url').value);
      find('#copy-link > span').textContent = 'Copied to clipboard';
      find('#copy-status').textContent = 'Link copied. Ready to share.';
    } catch {
      find('#share-url').focus();
      find('#share-url').select();
      find('#copy-status').textContent = 'Copy the selected link to share this ecosystem.';
    }
  });

  function updateKeyboardFocus() {
    state.keyboardFocus = network.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    updatePlayback();
  }
  network.addEventListener('focusin', updateKeyboardFocus);
  network.addEventListener('focusout', () => queueMicrotask(updateKeyboardFocus));
  network.addEventListener('keydown', () => { state.keyboardFocus = true; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) document.getAnimations().forEach((animation) => animation.cancel());
    updatePlayback();
  });
  new IntersectionObserver(([entry]) => {
    state.inView = entry.isIntersecting;
    updatePlayback();
  }, { threshold: 0.15 }).observe(network);

  // Reveal content only when it enters view; it is never hidden waiting for JavaScript.
  const reveals = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    animate(entry.target, [{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], 850);
    reveals.unobserve(entry.target);
  }), { threshold: 0.08 });
  all('[data-reveal]').forEach((element) => reveals.observe(element));

  sectors.forEach((sector) => sectorFilter.add(new Option(sector, sector)));
  all('[data-company-count]').forEach((element) => { element.textContent = String(companies.length).padStart(2, '0'); });
  all('[data-sector-count]').forEach((element) => { element.textContent = String(sectors.length).padStart(2, '0'); });
  find('#year').textContent = new Date().getFullYear();
  all('svg.icon').forEach((element) => element.setAttribute('aria-hidden', 'true'));
  for (let index = 0; index < 35; index++) find('.network-stars').append(svgElement('circle', {
    cx: 75 + (index * 137) % 860, cy: 30 + (index * 89) % 395,
    r: index % 4 === 0 ? 1.5 : 0.8, fill: '#cce8b5', opacity: index % 4 === 0 ? 0.4 : 0.13,
  }));
  document.documentElement.classList.add('enhanced');
  find('.ecosystem-toolbar').hidden = false;
  drawConnections();
  selectCompany(0);
  renderView();
})();
