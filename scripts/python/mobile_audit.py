"""
Mobile audit: checks a page at common phone widths.

Reports:
  - elements wider than the screen (cause sideways scrolling)
  - tap targets smaller than 44x44px (links/buttons that are hard to hit)
  - text smaller than 13px
  - form fields under 16px font (iPhone zooms in when you tap them)
  - page height per width

Usage:
  python scripts/python/mobile_audit.py http://localhost:8000/landing-pages/
  python scripts/python/mobile_audit.py http://localhost:8000/landing-pages/ --widths 360 390
"""
import argparse, json
from playwright.sync_api import sync_playwright

AUDIT_JS = r"""
() => {
  const vw = document.documentElement.clientWidth;
  const label = (el) => {
    const t = (el.innerText || el.getAttribute('aria-label') || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const c = (el.className && el.className.baseVal === undefined) ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : '';
    return `${el.tagName.toLowerCase()}${c} "${t}"`;
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const insideScroller = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };

  const overflow = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (!visible(el) || insideScroller(el)) return;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) overflow.push(`${label(el)} (${Math.round(r.left)}..${Math.round(r.right)})`);
  });

  const smallTargets = [];
  document.querySelectorAll('a, button, summary, input, select, textarea, [role="tab"]').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    const inline = getComputedStyle(el).display === 'inline' && el.closest('p');
    if (inline) return; // links inside a sentence are fine
    if (r.width < 44 || r.height < 44) smallTargets.push(`${label(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });

  const tinyText = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    if (!visible(el)) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (own && parseFloat(getComputedStyle(el).fontSize) < 13) tinyText.add(`${label(el)} ${getComputedStyle(el).fontSize}`);
  });

  const zoomFields = [];
  document.querySelectorAll('input, select, textarea').forEach((el) => {
    if (visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16) zoomFields.push(`${label(el)} ${getComputedStyle(el).fontSize}`);
  });

  return { viewport: vw, pageHeight: document.documentElement.scrollHeight,
           pageScrollsSideways: document.documentElement.scrollWidth > vw,
           overflow: overflow.slice(0, 30), smallTargets: smallTargets.slice(0, 60),
           tinyText: [...tinyText].slice(0, 40), zoomFields };
}
"""

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('url')
    ap.add_argument('--widths', type=int, nargs='+', default=[360, 390, 430])
    a = ap.parse_args()
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in a.widths:
            ctx = b.new_context(viewport={'width': w, 'height': 800}, is_mobile=True, has_touch=True, device_scale_factor=2)
            page = ctx.new_page()
            page.goto(a.url, wait_until='networkidle')
            page.wait_for_timeout(500)
            r = page.evaluate(AUDIT_JS)
            print(f"\n===== {w}px =====")
            print(json.dumps(r, indent=2, ensure_ascii=False))
            ctx.close()
        b.close()

if __name__ == '__main__':
    main()
