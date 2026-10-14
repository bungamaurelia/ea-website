"""
Website capture tool.

Takes a full scroll-through of a page and saves:
  - viewport-sized screenshots in order (shot_01.png, shot_02.png, ...)
  - one full-page screenshot (full.png)
  - the visible text (text.txt)
  - a design summary (design.json): fonts, font sizes, colours, headings, sections

Usage:
  python scripts/python/capture.py <url> [--out output/screenshots/name] [--mobile] [--width 1440] [--height 900] [--no-full]

Examples:
  python scripts/python/capture.py https://superclean.sg/
  python scripts/python/capture.py https://example.com --mobile --out output/screenshots/example-mobile
  python scripts/python/capture.py http://localhost:8000/landing-pages/ --out output/screenshots/our-site
"""
import argparse, json, re, sys, time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

DESIGN_JS = r"""
() => {
  const count = (m, k) => { m[k] = (m[k] || 0) + 1; };
  const fonts = {}, sizes = {}, colors = {}, bgs = {};
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 6000);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    const hasText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      count(fonts, s.fontFamily.split(',')[0].replace(/["']/g, '').trim() + ' ' + s.fontWeight);
      count(sizes, s.fontSize);
      count(colors, s.color);
    }
    if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') count(bgs, s.backgroundColor);
  }
  const top = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
  const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map(h => {
    const s = getComputedStyle(h);
    return { tag: h.tagName, text: h.innerText.trim().slice(0, 120), font: s.fontFamily.split(',')[0],
             size: s.fontSize, weight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, color: s.color };
  }).filter(h => h.text);
  const sections = Array.from(document.querySelectorAll('section, header, footer, [class*="section"]'))
    .filter(e => e.getBoundingClientRect().height > 80)
    .map(e => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 80),
                 top: Math.round(e.getBoundingClientRect().top + scrollY), height: Math.round(e.getBoundingClientRect().height),
                 bg: getComputedStyle(e).backgroundColor }));
  const loadedFonts = Array.from(document.fonts || []).map(f => f.family + ' ' + f.weight + ' ' + f.status);
  return { title: document.title, pageHeight: document.documentElement.scrollHeight,
           fonts: top(fonts, 12), fontSizes: top(sizes, 15), textColors: top(colors, 12), backgrounds: top(bgs, 12),
           headings, sections: sections.slice(0, 60), loadedFonts: Array.from(new Set(loadedFonts)).slice(0, 30) };
}
"""

# Makes scroll-triggered animations (Webflow IX2, AOS, etc.) show their final state.
REVEAL_CSS = """
[data-w-id], [data-aos], .w-animate, [style*="opacity: 0"], [style*="opacity:0"] { opacity: 1 !important; transform: none !important; }
*, *::before, *::after { animation-delay: 0s !important; transition-duration: 0s !important; }
"""

# Removes cookie / consent banners (we never click accept on them).
HIDE_COOKIES_JS = r"""
() => {
  const rx = /cookie|consent|gdpr|onetrust|cky-|cc-window|termly/i;
  document.querySelectorAll('body *').forEach(el => {
    const id = (el.id || '') + ' ' + (el.className || '').toString();
    const s = getComputedStyle(el);
    if ((s.position === 'fixed' || s.position === 'sticky') && (rx.test(id) || /we use cookies/i.test(el.innerText || ''))) el.remove();
  });
}
"""

# After the first shot, hide sticky headers and floating widgets so they don't cover content.
HIDE_FIXED_JS = r"""
() => document.querySelectorAll('body *').forEach(el => {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const isBar = r.height < 220;            // headers, banners, chat bubbles, not sticky content columns
  if ((s.position === 'fixed' || s.position === 'sticky') && isBar) el.style.setProperty('visibility', 'hidden', 'important');
})
"""

def slug(url):
    p = urlparse(url)
    return re.sub(r'[^a-z0-9]+', '-', (p.netloc + p.path).lower()).strip('-')[:60] or 'page'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url')
    ap.add_argument('--out')
    ap.add_argument('--mobile', action='store_true')
    ap.add_argument('--width', type=int, default=1440)
    ap.add_argument('--height', type=int, default=900)
    ap.add_argument('--no-full', action='store_true', help='skip the single full-page image')
    ap.add_argument('--no-reveal', action='store_true', help='do not force-show scroll animations')
    ap.add_argument('--wait', type=float, default=2.5, help='seconds to wait after load')
    ap.add_argument('--keep-fixed', action='store_true', help='keep sticky headers/banners on every shot')
    a = ap.parse_args()

    root = Path(__file__).resolve().parents[2]   # project folder
    out = Path(a.out) if a.out else root / 'output' / 'screenshots' / (slug(a.url) + ('-mobile' if a.mobile else ''))
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob('shot_*.png'): f.unlink()

    w, h = (390, 844) if a.mobile else (a.width, a.height)
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1,
                            is_mobile=a.mobile, has_touch=a.mobile,
                            user_agent=None if not a.mobile else
                            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
        page = ctx.new_page()
        try:
            page.goto(a.url, wait_until='networkidle', timeout=60000)
        except Exception:
            page.goto(a.url, wait_until='load', timeout=60000)
        time.sleep(a.wait)

        # Scroll slowly to trigger lazy images and scroll animations.
        total = page.evaluate('document.documentElement.scrollHeight')
        y = 0
        while y < total:
            page.evaluate(f'window.scrollTo(0, {y})'); time.sleep(0.25)
            y += h // 2
            total = page.evaluate('document.documentElement.scrollHeight')
        page.evaluate('window.scrollTo(0, 0)'); time.sleep(0.8)
        if not a.no_reveal:
            page.add_style_tag(content=REVEAL_CSS); time.sleep(0.4)

        page.evaluate(HIDE_COOKIES_JS)
        design = page.evaluate(DESIGN_JS)
        (out / 'design.json').write_text(json.dumps(design, indent=2), encoding='utf-8')
        (out / 'text.txt').write_text(page.evaluate('document.body.innerText'), encoding='utf-8')

        total = page.evaluate('document.documentElement.scrollHeight')
        n, y = 0, 0
        while y < total:
            page.evaluate(f'window.scrollTo(0, {y})'); time.sleep(0.5)
            n += 1
            page.screenshot(path=str(out / f'shot_{n:02d}.png'))
            if n == 1 and not a.keep_fixed:
                page.evaluate(HIDE_FIXED_JS)
            y += h
        if not a.no_full:
            page.evaluate('window.scrollTo(0, 0)'); time.sleep(0.4)
            page.screenshot(path=str(out / 'full.png'), full_page=True)
        b.close()
    print(f'Saved {n} screenshots, text and design summary to {out}  (page height {total}px)')

if __name__ == '__main__':
    main()
