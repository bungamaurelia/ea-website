"""
Full-page screenshot of a URL at a given width, cut into side-by-side strips for quick review.
Usage: python scripts/python/strips.py <url> <width> <out.png> [--strip-height 900] [--cols 6] [--mobile]
"""
import argparse, io
from playwright.sync_api import sync_playwright
import pymupdf as fitz

ap = argparse.ArgumentParser()
ap.add_argument('url'); ap.add_argument('width', type=int); ap.add_argument('out')
ap.add_argument('--strip-height', type=int, default=900); ap.add_argument('--cols', type=int, default=6)
ap.add_argument('--mobile', action='store_true')
a = ap.parse_args()
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': a.width, 'height': a.strip_height}, is_mobile=a.mobile, has_touch=a.mobile)
    pg.goto(a.url, wait_until='networkidle'); pg.wait_for_timeout(500)
    pg.add_style_tag(content='html{scroll-behavior:auto!important}.site-header,.wa-float{position:static!important}')
    png = pg.screenshot(full_page=True); total = pg.evaluate('document.documentElement.scrollHeight'); b.close()
src = fitz.Pixmap(png)
n = -(-src.height // a.strip_height); rows = -(-n // a.cols)
doc = fitz.open(); page = doc.new_page(width=a.cols * (a.width + 12), height=rows * (a.strip_height + 12))
srcdoc = fitz.open(); sp = srcdoc.new_page(width=src.width, height=src.height); sp.insert_image(sp.rect, pixmap=src)
for i in range(n):
    clip = fitz.Rect(0, i * a.strip_height, a.width, min((i + 1) * a.strip_height, src.height))
    x, y = (i % a.cols) * (a.width + 12), (i // a.cols) * (a.strip_height + 12)
    page.show_pdf_page(fitz.Rect(x, y, x + a.width, y + clip.height), srcdoc, 0, clip=clip)
page.get_pixmap(dpi=40 if a.width > 600 else 48).save(a.out)
print(f'{a.out}: page height {total}px, {n} strips')
