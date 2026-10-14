# Employment Agency Singapore — website

One-page site for employmentagencysingapore.com (part of SuperClean SG). Plain HTML, CSS and JavaScript, no build step.

## Deploy

**Only `landing-pages/` is deployed.** It is self-contained:

```
landing-pages/
├── index.html              homepage, shown at yoursite.com/
├── css/
│   ├── design-system.css   brand tokens: colours, fonts, spacing, buttons
│   └── home.css            homepage-only styles
├── js/
│   └── home.js             homepage-only scripts
└── images/
    ├── ea-logo.svg         logo mark (also the favicon)
    └── home/               homepage-only images (WebP)
```

Every other page would go in `landing-pages/<page-slug>/index.html` and be shown at `yoursite.com/<page-slug>/`.

## Not deployed

| Folder | What it is |
|---|---|
| `process/` | `design-system.html`: the internal design system with screenshots at desktop, tablet and mobile |
| `scripts/python/` | Local helper scripts: screenshots, mobile checks, preview builder |
| `output/` | Local backups and screenshots (ignored by git) |

## Things to know

- **Form:** the Request a Quote form is a HubSpot embed (portal `242253439`, region `na2`). Edit its fields, consent text and thank-you message in HubSpot.
- **WhatsApp:** Contact, Find a Job and all WhatsApp buttons go to +65 8956 5188 with a pre-filled message. The number and messages are at the top of `js/home.js`.
- **Hidden sections:** Our Clients and Further Resources (blog) are in `index.html` with the `hidden` attribute. Remove it to show them once real logos and articles exist.
- **Cache busting:** CSS and JS links end in `?v=<number>`. Raise it after editing those files.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000/landing-pages/
