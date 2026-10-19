/* =========================================================
   Employment Agency Singapore — homepage scripts (index.html only)
   1. Links: WhatsApp number, pre-filled messages, button destinations
   2. Interactions: header, menu, reviews, services, testimonials, FAQ
   ========================================================= */

/* ---------- 1. Links ---------- */
const WHATSAPP_NUMBER = '6589565188'; // +65 8956 5188: country code + number, no "+" or spaces

const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Pre-filled WhatsApp messages. The blank lines after each label are for the person to fill in.
const MSG_EMPLOYER = [
  'Hi Employment Agency Singapore! I would like to enquire about hiring foreign workers.',
  '',
  'Company name: ',
  'Number of workers: ',
  'Cleaning or construction: ',
].join('\n');

const MSG_JOB_SEEKER = [
  'Hi Employment Agency Singapore! I am looking for a job in Singapore.',
  '',
  'Name: ',
  'Nationality: ',
  'Cleaning or construction: ',
  'Years of experience: ',
  'Worked in Singapore before (yes/no): ',
].join('\n');

// One page only: Request a Quote and the service/country cards go to the HubSpot form below.
// Contact scrolls to the form section; Find a Job and the WhatsApp buttons open WhatsApp in a new tab.
const LINKS = {
  requestWorkers: '#request-workers',
  contact: '#request-workers',
  findJob: waLink(MSG_JOB_SEEKER),
  whatsapp: waLink(MSG_EMPLOYER),
};

document.querySelectorAll('[data-link]').forEach((el) => {
  // Service and country cards scroll to the form (the HubSpot form can't be pre-filled from here)
  if (el.dataset.link === 'hireForm') { el.setAttribute('href', '#request-workers'); return; }
  const url = LINKS[el.dataset.link];
  if (url) el.setAttribute('href', url);
});

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
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open); // hides the floating WhatsApp button and the bottom bar
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
};
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* Highlight the nav link of the section in view */
const navLinks = [...document.querySelectorAll('.main-nav > a[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

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

// The bar shows once the hero buttons have scrolled away, and hides while the form is on screen
const mobileCta = document.querySelector('.mobile-cta');
const heroButtons = document.querySelector('.hero .btn-row');
const formSection = document.getElementById('request-workers');
if (mobileCta && heroButtons && formSection) {
  let pastHero = false;
  let formInView = false;
  const updateBar = () => mobileCta.classList.toggle('is-hidden', !pastHero || formInView);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; updateBar(); }).observe(heroButtons);
  new IntersectionObserver(([e]) => { formInView = e.isIntersecting; updateBar(); }).observe(formSection);
}
