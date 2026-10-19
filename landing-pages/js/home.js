/* =========================================================
   Employment Agency Singapore — homepage scripts (index.html only)
   1. Links: where they live
   2. Interactions: header, menu, reviews, services, testimonials, FAQ
   ========================================================= */

/* ---------- 1. Links ----------
   The WhatsApp links (number +65 8956 5188 and the pre-filled employer / job seeker messages) are written
   straight into index.html, so they work even when this script doesn't load. To change the number or a
   message, edit every wa.me link in index.html (search "wa.me"). Request a Quote, Contact Us and the
   service and country cards link to #request-workers. */

/* ---------- 2. Interactions ---------- */

/* =========================================================
   [Brand] homepage interactions
   ========================================================= */


const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Header: shadow on scroll + mobile menu ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('main-nav');
const backdrop = document.querySelector('.nav-backdrop');
// While the menu is open, everything outside it is inert: keyboard focus stays in the menu
const outsideMenu = [document.getElementById('main'), document.querySelector('.site-footer'), document.querySelector('.logo'),
  document.querySelector('.skip-link'), document.querySelector('.wa-float'), document.querySelector('.mobile-cta')].filter(Boolean);
const setMenu = (open, { fromKeyboard = false } = {}) => {
  const wasOpen = nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  // menu-open: locks the page behind the menu, shows the backdrop, hides the floating WhatsApp button and the bottom bar
  document.documentElement.classList.toggle('menu-open', open);
  outsideMenu.forEach((el) => el.toggleAttribute('inert', open));
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  if (open && fromKeyboard) nav.querySelector('a').focus();
  if (!open && wasOpen && nav.contains(document.activeElement)) toggle.focus();
};
// detail === 0: the button was pressed with the keyboard, so focus moves into the menu
toggle.addEventListener('click', (e) => setMenu(!nav.classList.contains('is-open'), { fromKeyboard: e.detail === 0 }));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
backdrop.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });
// Older iPhones ignore overflow: hidden, so touches outside the menu can't scroll the page either
document.addEventListener('touchmove', (e) => {
  if (nav.classList.contains('is-open') && !nav.contains(e.target)) e.preventDefault();
}, { passive: false });

/* Highlight the nav link of the section in view */
const navLinks = [...document.querySelectorAll('.main-nav > a[href^="#"]')];
const hero = document.querySelector('.hero');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    // back at the top: no section is highlighted
    navLinks.forEach((a) => a.classList.toggle('is-active', entry.target !== hero && a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
spy.observe(hero);

/* ---------- Google reviews: arrow scrolling ---------- */
const reviewTrack = document.getElementById('review-track');
const reviewBtns = document.querySelectorAll('[data-scroll]');
const updateReviewBtns = () => {
  const max = reviewTrack.scrollWidth - reviewTrack.clientWidth - 2;
  reviewBtns[0].disabled = reviewTrack.scrollLeft <= 2;
  reviewBtns[1].disabled = reviewTrack.scrollLeft >= max;
};
reviewBtns.forEach((btn) => btn.addEventListener('click', () => {
  const card = reviewTrack.querySelector('.review-card');
  reviewTrack.scrollBy({ left: Number(btn.dataset.scroll) * (card.offsetWidth + 24), behavior: reduceMotion ? 'auto' : 'smooth' });
}));
reviewTrack.addEventListener('scroll', updateReviewBtns, { passive: true });
window.addEventListener('resize', updateReviewBtns);
updateReviewBtns();

/* ---------- Services accordion: opens and closes only when clicked ---------- */
const svcItems = [...document.querySelectorAll('.svc-item')];
const svcMedia = [...document.querySelectorAll('.svc-media .media-ph:not(.media-default)')];
const svcDefault = document.querySelector('.svc-media .media-default');
const svcBodies = svcItems.map((item) => item.querySelector('.svc-body'));
let svcIndex = svcItems.findIndex((item) => item.classList.contains('is-open'));

// i = -1 closes everything
const openService = (i) => {
  svcIndex = i;
  svcItems.forEach((item, n) => {
    const open = n === i;
    item.classList.toggle('is-open', open);
    item.querySelector('.svc-head').setAttribute('aria-expanded', String(open));
    svcBodies[n].toggleAttribute('inert', !open); // closed panels: no hidden keyboard stops
  });
  // keep the last picture showing when everything is closed
  svcMedia.forEach((m, n) => m.classList.toggle('is-active', n === i));
  if (svcDefault) svcDefault.classList.toggle('is-active', i < 0);
};

/* Opening a service while one ABOVE it is open would pull the tapped heading up out of view.
   So that upper panel closes at once (no animation) and the page shifts by the same amount
   in the same moment: the heading stays exactly where it was tapped. One correction, no loop,
   so it can't fight the browser's own scrolling (Safari, phones, the preview frame). */
const scrollInstant = (y) => {
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  root.style.scrollBehavior = '';
};

svcItems.forEach((item, i) => {
  // clicking an open service closes it; clicking a closed one opens it
  const head = item.querySelector('.svc-head');
  head.addEventListener('click', () => {
    const next = svcIndex === i ? -1 : i;
    const above = svcIndex >= 0 && svcIndex < i ? svcBodies[svcIndex] : null;
    const before = head.getBoundingClientRect().top;
    if (above) above.style.transition = 'none';
    openService(next);
    if (above) {
      const delta = head.getBoundingClientRect().top - before;   // reading it applies the instant close
      if (Math.abs(delta) > 0.5) scrollInstant(window.scrollY + delta);
      requestAnimationFrame(() => requestAnimationFrame(() => { above.style.transition = ''; }));
    }
    // never leave the heading under the sticky header
    const under = header.offsetHeight + 8 - head.getBoundingClientRect().top;
    if (under > 0) scrollInstant(window.scrollY - under);
  });
});
openService(svcIndex); // marks the closed panels inert on load

/* ---------- Testimonials carousel (Omnipresent style) ---------- */
const testiTrack = document.getElementById('testi-track');
const testiCards = [...testiTrack.children];
const dotsWrap = document.getElementById('testi-dots');
let testiIndex = 0;

testiCards.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.setAttribute('role', 'tab');
  dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
  dot.addEventListener('click', () => goTesti(i));
  dotsWrap.appendChild(dot);
});

function goTesti(i) {
  testiIndex = (i + testiCards.length) % testiCards.length;
  const card = testiCards[testiIndex];
  const viewport = testiTrack.parentElement.offsetWidth;
  const offset = card.offsetLeft - (viewport - card.offsetWidth) / 2;
  testiTrack.style.transform = `translateX(${-offset}px)`;
  testiCards.forEach((c, n) => { c.classList.toggle('is-active', n === testiIndex); c.setAttribute('aria-hidden', String(n !== testiIndex)); });
  [...dotsWrap.children].forEach((d, n) => d.setAttribute('aria-selected', String(n === testiIndex)));
  scheduleTesti();
}
testiCards.forEach((c, i) => c.addEventListener('click', () => { if (i !== testiIndex) goTesti(i); }));
document.getElementById('testi-prev').addEventListener('click', () => goTesti(testiIndex - 1));
document.getElementById('testi-next').addEventListener('click', () => goTesti(testiIndex + 1));
window.addEventListener('resize', () => goTesti(testiIndex));

// Swipe on touch screens
let touchX = null;
testiTrack.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
testiTrack.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) goTesti(testiIndex + (dx < 0 ? 1 : -1));
  touchX = null;
});

/* Auto-play: moves every 6 seconds while the section is on screen.
   Pauses on hover/keyboard focus, when the tab is hidden, or with the pause button.
   Clicking arrows, dots or cards still works and restarts the timer. */
const TESTI_DELAY = 6000;
const testiSection = document.querySelector('.testimonials');
const pauseBtn = document.getElementById('testi-pause');
let testiTimer = null;
let testiInView = false;
let testiHover = false;
let testiUserPaused = reduceMotion; // no auto-play for people who reduce motion

function scheduleTesti() {
  clearTimeout(testiTimer);
  if (testiUserPaused || testiHover || !testiInView || document.hidden) return;
  testiTimer = setTimeout(() => goTesti(testiIndex + 1), TESTI_DELAY);
}
const setPaused = (paused) => {
  testiUserPaused = paused;
  pauseBtn.setAttribute('aria-label', paused ? 'Play testimonials' : 'Pause testimonials');
  pauseBtn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
  scheduleTesti();
};
pauseBtn.addEventListener('click', () => setPaused(!testiUserPaused));
testiTrack.addEventListener('mouseenter', () => { testiHover = true; scheduleTesti(); });
testiTrack.addEventListener('mouseleave', () => { testiHover = false; scheduleTesti(); });
testiTrack.addEventListener('focusin', () => { testiHover = true; scheduleTesti(); });
testiTrack.addEventListener('focusout', () => { testiHover = false; scheduleTesti(); });
document.addEventListener('visibilitychange', scheduleTesti);
new IntersectionObserver((entries) => { testiInView = entries[0].isIntersecting; scheduleTesti(); }, { threshold: 0.4 }).observe(testiSection);

setPaused(testiUserPaused);
goTesti(1); // start on the middle card so both sides show

/* ---------- FAQ: one open at a time (fallback for browsers without <details name>) ---------- */
const faqs = [...document.querySelectorAll('.faq-list details')];
faqs.forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) faqs.forEach((o) => { if (o !== d) o.open = false; });
}));

/* ---------- Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Phone: "See all" buttons and the bottom action bar ---------- */
document.querySelectorAll('[data-expand]').forEach((btn) => {
  const section = document.getElementById(btn.dataset.expand);
  btn.addEventListener('click', () => {
    const open = section.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? btn.dataset.less : btn.dataset.more;
  });
});

// The bar shows once the hero buttons have scrolled away, and hides while the form is on screen.
// On tablets and short screens the floating WhatsApp button also waits until the hero is passed
// (html.on-hero), so it never sits over the hero portraits.
const mobileCta = document.querySelector('.mobile-cta');
const heroButtons = document.querySelector('.hero .btn-row');
const formSection = document.getElementById('request-workers');
if (mobileCta && heroButtons && formSection) {
  let pastHero = false;
  let formInView = false;
  document.documentElement.classList.add('on-hero');
  const updateBar = () => {
    mobileCta.classList.toggle('is-hidden', !pastHero || formInView);
    document.documentElement.classList.toggle('on-hero', !pastHero);
  };
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; updateBar(); }).observe(heroButtons);
  new IntersectionObserver(([e]) => { formInView = e.isIntersecting; updateBar(); }).observe(formSection);
}

/* ---------- Industries row on phones: one dot per card, tap a dot to go to its card ---------- */
const countryGrid = document.querySelector('.country-grid');
const countryDots = document.querySelector('.country-dots');
if (countryGrid && countryDots) {
  const cards = [...countryGrid.querySelectorAll('.country-card')];
  const dots = cards.map((card, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `${card.querySelector('h3').textContent} (${i + 1} of ${cards.length})`);
    dot.addEventListener('click', () => countryGrid.scrollTo({ left: card.offsetLeft - countryGrid.offsetLeft - parseFloat(getComputedStyle(countryGrid).scrollPaddingLeft || 0), behavior: reduceMotion ? 'auto' : 'smooth' }));
    countryDots.appendChild(dot);
    return dot;
  });
  const setDot = (i) => dots.forEach((d, n) => d.setAttribute('aria-current', String(n === i)));
  setDot(0);
  const seen = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setDot(cards.indexOf(e.target)); });
  }, { root: countryGrid, threshold: 0.6 });
  cards.forEach((c) => seen.observe(c));
}

/* ---------- Quote form: light placeholder until HubSpot's form has loaded ---------- */
const formWrap = document.querySelector('.form-frame-wrap');
const formFrame = formWrap && formWrap.querySelector('.hs-form-frame');
if (formFrame) {
  formWrap.classList.add('is-loading');
  const done = () => formWrap.classList.remove('is-loading');
  const watch = (iframe) => iframe.addEventListener('load', done, { once: true });
  const existing = formFrame.querySelector('iframe');
  if (existing) watch(existing);
  else new MutationObserver((list, obs) => {
    const iframe = formFrame.querySelector('iframe');
    if (iframe) { watch(iframe); obs.disconnect(); }
  }).observe(formFrame, { childList: true, subtree: true });
}
