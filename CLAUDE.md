# Employment Agency Singapore — Website (employmentagencysingapore.com)

One-page employment agency website (no other pages; Contact and Find a Job open WhatsApp), for employers hiring foreign cleaning and construction workers. Run by the SuperClean SG team, but the site stands on its own: no SuperClean SG or NEA references anywhere, code comments included (Alex Leong's review, 19 Oct 2026). Built as plain HTML, CSS and JavaScript; shared for review through a claude.ai preview link. Folder layout follows Crystal's one-page structure: only `landing-pages/` is deployed.

## Folder
```
CLAUDE.md · README.md · .gitignore     (root)
.claude/launch.json   local server "site": serves this folder on port 8000
landing-pages/        THE ONLY FOLDER THAT GETS DEPLOYED
  index.html            homepage, shown at employmentagencysingapore.com/
  css/design-system.css brand tokens (colours, fonts, spacing, radii, shadows), base, type, buttons
  css/home.css          homepage sections only
  js/home.js            homepage scripts: WhatsApp links + interactions
  images/ea-logo.svg    logo mark (also the browser-tab icon)
  images/home/*.webp    homepage photos
  sitemap.xml · robots.txt  search engines (update lastmod in sitemap.xml when the page changes)
process/              design-system.html (internal only, never deployed) + design-system-img/ + snippets/
scripts/python/       capture.py · mobile_audit.py · ds_shots.py · build_preview.py · strips.py
output/               backups/v1 … v51 and screenshots: local only, ignored by git
```
A new page would go in `landing-pages/<page-slug>/index.html`. Nothing else belongs at the root.

## Links
- Local site: http://localhost:8000/landing-pages/ · design system: http://localhost:8000/process/design-system.html
- Shared preview: https://claude.ai/artifact/GY7wXEgzMvN6w4cxhLLhYt (rebuild and republish after every change)
- Launch checklist doc: https://claude.ai/artifact/N3JWAQxnjZfqNzBKUiaG1b (placeholders and launch tasks)

## Rules
- Design only from `process/design-system.html`. A design change updates the site, then the design system (`ds_shots.py` refreshes its screenshots).
- Before a change, copy `landing-pages/` into `output/backups/v<next>`.
- After any CSS or JS change, raise the `?v=` number on every CSS and JS link in `index.html`.
- Shared look (tokens, type, buttons) goes in `design-system.css`; anything for one section goes in `home.css`.
- Colours from the `:root` tokens only. Only Request a Quote is orange (#c2410c since Alex's review: white text needs 4.5:1). WhatsApp buttons are WhatsApp green with dark (`--depth`) text and icon. In two-colour H2s the highlight sits on the second line. H2s are centred, except the recruitment process and the Request Workers form (left on desktop and tablet).
- Source countries (decided with Crystal): Myanmar and Malaysia are cleaning only, and their cards match (Sector: Cleaning, same roles); Bangladesh and India are construction only, and their cards match; PRC is cleaning and construction. No other countries ("North Asia" was removed). Cards show no week ranges: one line under the cards and the FAQ say "Lead time depends on the source country and the Work Permit approval process." Keep the hero, country cards, Services, Fees and FAQ in step when this changes.
- Licence: "MOM-licensed employment agency · EA licence no. [licence number]" in the hero label and the footer, and the number in the first FAQ answer. No replacement guarantee anywhere (terms under review).
- Text and taps (Alex's review): font sizes in rem (never px), nothing under 13px anywhere, body text 16px on phones (buttons 15px). Anything tappable at least 44 by 44px, arrows and dots included; links inside a sentence get a taller tap area with padding/negative margin. No sideways scrolling from 280px up. Check 280, 320, 360, 390, 768, 844 and 915 with `mobile_audit.py`.
- Fonts: Poppins from Google Fonts with a size-matched Arial fallback ("Poppins Fallback" in `design-system.css`), so nothing jumps when Poppins arrives. Keep it first after Poppins in `--font`.
- How to Hire: "Apply for a Job" sits on its own line under the job seeker sentence (Crystal).
- Hero: Request a Quote is the one button; Find a Job is a smaller text link beside it. On short screens (laptops 720px tall, phones held sideways) the heading shrinks so both show on the first screen. Portraits float once, then stop. The floating WhatsApp button waits until the hero is passed on tablets and short screens.
- Menu: the menu button shows up to 1024px wide (the full menu shows from 1025px). The open menu is never taller than the screen and scrolls on its own. While open (`html.menu-open`, set in `js/home.js`): the page behind is locked and dimmed (tap the dim to close), the rest of the page is inert so keyboard focus stays in the menu, Escape closes it, and the floating WhatsApp button and phone bottom bar hide. Lock only `html`, never `body` (that unsticks the header). No menu item is highlighted while the hero is in view.
- Services: closed panels are `inert` and hidden, so the keyboard never lands on their buttons; `js/home.js` keeps the tapped heading where it was while the panel above closes.
- Animations (Alex's review, section 6; one block at the end of `home.css`): move only transform and opacity, 150-300ms for taps and hovers, 400-600ms for things appearing, ease-out in; no parallax or scroll hijacking. The reduced-motion rule switches them all off. Anything that starts hidden needs `html.js-anim` (set by `home.js` only when motion is allowed), so without JavaScript or with reduced motion everything shows. Services and FAQ open with the grid-row height method (300ms); an open panel above the tapped one closes at once with the page shifting to match. Cards with `data-reveal` rise in once; the recruitment process line follows the scroll (driven in `home.js`); the desktop header slides up 12px after 80px and the phone header hides on scroll down. Check every new animation in Chrome, Safari and Firefox before it goes live.
- Phones (max 600px) only: the Recruitment Process section is hidden (How to Hire covers it); Fees show 3 rows and FAQ 5 questions, the rest behind "See all fees" (the fee table's own last row, not a separate button) / "More questions"; a bottom bar like SuperClean's (price "Worker placement from S$1,200/worker" on the left, Request a Quote on the right; keep the price in step with the fee table) shows after the hero buttons and hides at the form, with the round WhatsApp button floating just above it (Crystal, 19 Oct 2026). Tablet and desktop show everything.
- Links: Request a Quote, Contact Us (same label in menu and footer) and the service and country cards scroll to the homepage form section. Find a Job / Apply for a Job and the WhatsApp buttons open WhatsApp +65 8956 5188 with a pre-filled message (employer or job seeker). These wa.me links are written straight into `index.html` so they work without JavaScript: to change the number or a message, edit every wa.me link there. Email: hello@employmentagencysingapore.com (form section and footer); the phone number in the form section and the footer is still a placeholder ("+65 [phone number]").
- The form is the HubSpot embed (portal 242253439). Its fields, consent text and thank-you message are edited in HubSpot. Never submit test entries without asking: they create real leads. It loads in its own iframe, so its font, fields and button style are set in HubSpot, not in our CSS. While it loads, a light placeholder shows ("Loading the enquiry form…"); under it, a fallback line offers email and WhatsApp. It can't load in the claude.ai preview, which shows a placeholder instead.
- Structured data (JSON-LD in `index.html`): EmploymentAgency details and the FAQ. Keep the FAQ part in step with the FAQ section; add address, telephone and the licence number once confirmed.
- Industries row on phones: dots under the cards (built in `js/home.js`), one per country card.
- Images: WebP only (logo SVG), in `images/home/` named `hero-…`, `service-…`, `country-…`. `service-default.webp` (cleaner vacuuming a sofa in an office lounge, 19 Oct 2026: Alex asked for a cleaner at work instead of the disinfection photo; cropped from the top on tablet and phone) is the services photo shown while no service is open (desktop side panel); on tablet and phone it sits above the list. Every `<img>` needs `alt`, `title`, `width` and `height`; below-the-fold photos use `loading="lazy"`. Country cards use worker photos, no flags.
- Hidden with the `hidden` attribute until real content exists: the blog section, Our Clients, the Google reviews (with the "Trusted on Google 5.0" rating), the testimonials and the job seeker quote in the "Looking for work" banner. The reviews and quotes in the code are samples: the agency has no Google Business Profile yet (Crystal, 19 Oct 2026). Show them only with real reviews, never SuperClean SG's.
- Git: commit and push only when asked. `output/` stays out of the repo.

## Commands
- `python scripts/python/capture.py <url> [--mobile]` — screenshots, text and fonts/colours of any page
- `python scripts/python/mobile_audit.py http://localhost:8000/landing-pages/ --widths 360 390 768` — mobile checks
- `python scripts/python/ds_shots.py` — recapture every section for the design system (server must be running)
- `python scripts/python/build_preview.py <folder>` — preview copy (CSS/JS inlined, HubSpot placeholder) plus its images; publish page.html with the files under images/
