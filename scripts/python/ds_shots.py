"""
Captures every homepage section at desktop 1440, tablet 768 and mobile 390
as WebP images for the design system page (all images in the repo are WebP).
Usage: python scripts/python/ds_shots.py [out-folder]   (default: process/design-system-img)
"""
import io, sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "process" / "design-system-img"); OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8000/landing-pages/"
SECTIONS = [
    ("header", ".site-header"), ("hero", ".hero"), ("reviews", ".reviews"), ("services", "#services"),
    ("industries", "#industries"), ("why", "#why-us"), ("how", "#how-to-hire"), ("process", "#process"),
    ("fees", "#fees"), ("testimonials", ".testimonials"), ("faq", "#faq"), ("form", "#request-workers"),
    ("footer", ".site-footer"),
]
WIDTHS = [("desktop", 1440, False), ("tablet", 768, False), ("mobile", 390, True)]
# Fixed parts (header, floating button, phone bottom bar) would cover the sections, so they are taken out of the shots
CLEAN = "html{scroll-behavior:auto!important}.site-header{position:static!important;transform:none!important}.wa-float,.mobile-cta{display:none!important}*{animation:none!important;transition:none!important}"

with sync_playwright() as p:
    b = p.chromium.launch()
    for vname, w, mob in WIDTHS:
        # reduced motion: cards that rise in on scroll are shown straight away
        ctx = b.new_context(viewport={"width": w, "height": 900}, is_mobile=mob, has_touch=mob, device_scale_factor=1 if w > 800 else 2, reduced_motion="reduce")
        pg = ctx.new_page(); pg.goto(BASE, wait_until="domcontentloaded"); pg.wait_for_timeout(2500)
        pg.add_style_tag(content=CLEAN)
        pg.click("#svc-tab-0"); pg.wait_for_timeout(300)                      # show one service open
        pg.evaluate("document.querySelector('.faq-list summary').click()"); pg.wait_for_timeout(200)   # first answer open
        pg.evaluate("document.getElementById('testi-pause') && document.getElementById('testi-pause').click()")
        for name, sel in SECTIONS:
            el = pg.locator(sel).first
            if not el.is_visible():                      # e.g. sections hidden on phones
                (OUT / f"{name}-{vname}.webp").unlink(missing_ok=True); continue
            el.scroll_into_view_if_needed(); pg.wait_for_timeout(150)
            Image.open(io.BytesIO(el.screenshot(type="png"))).convert("RGB").save(OUT / f"{name}-{vname}.webp", "WEBP", quality=75, method=6)
        ctx.close()
    b.close()
print("saved", len(list(OUT.glob("*.webp"))), "images,", round(sum(f.stat().st_size for f in OUT.glob("*.webp")) / 1e6, 1), "MB")
