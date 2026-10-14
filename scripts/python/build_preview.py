"""
Builds a shareable preview of the one-page site into a folder, ready to publish as an Artifact.
The page gets its CSS and JS inlined so nothing can go missing when hosted.
Images stay as separate files (images/...) and are copied next to the page.
The HubSpot form can't load inside the claude.ai preview (its script host is blocked there),
so the preview shows a labelled placeholder in its place. The real page is unchanged.

Usage: python scripts/python/build_preview.py <output-folder>
Outputs:
  page.html     main page (no <html>/<head>/<body>: the host adds them)
  index.html    full homepage document
  images/...    every image the page uses (publish these with the page)
"""
import re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "landing-pages"   # the deployed folder
out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
PREVIEW_TITLE = "EA Website Homepage"
HS_PLACEHOLDER = ('<div style="border:2px dashed var(--frost-line);border-radius:12px;padding:28px 20px;text-align:center;'
                  'color:var(--marine);font-size:14px;line-height:1.5"><strong style="color:var(--depth)">HubSpot form</strong><br>'
                  'Shows here on the live site (it can\'t load inside this preview).</div>')

def inline(html):
    def css(m): return "<style>\n" + (ROOT / m.group(1)).read_text(encoding="utf-8") + "\n</style>"
    def js(m): return "<script>\n" + (ROOT / m.group(1)).read_text(encoding="utf-8") + "\n</script>"
    html = re.sub(r'<link rel="stylesheet" href="(css/[\w.-]+\.css)(?:\?v=\d+)?">', css, html)
    html = re.sub(r'<script src="(js/[\w.-]+\.js)(?:\?v=\d+)?"></script>', js, html)
    leftover = re.findall(r'(?:href|src)="((?:css|js)/[^"]+)"', html)
    assert not leftover, leftover
    # HubSpot embed -> placeholder for the preview only
    html = re.sub(r'\s*<script src="https://js-na2\.hsforms\.net/[^"]+" defer></script>', '', html)
    html = re.sub(r'<div class="hs-form-frame"[^>]*></div>', HS_PLACEHOLDER, html)
    return html

home = inline((ROOT / "index.html").read_text(encoding="utf-8"))
(out / "index.html").write_text(home, encoding="utf-8")

# Copy every image the page refers to
images = sorted(set(re.findall(r'(?:href|src)="(images/[^"]+)"', home)))
for rel in images:
    dst = out / rel; dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / rel, dst)

# Main page body: drop the document wrapper, keep title, fonts, styles and content
page = re.sub(r"<title>.*?</title>", f"<title>{PREVIEW_TITLE}</title>", home, count=1, flags=re.S)
for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*",
            r"<body>\s*", r"</body>\s*", r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
    page = re.sub(pat, "", page, flags=re.I)
assert page.lstrip().startswith("<title>")
(out / "page.html").write_text(page, encoding="utf-8")
print("built", [f"{p.name} {p.stat().st_size // 1024}KB" for p in sorted(out.glob("*.html"))], f"+ {len(images)} images")
