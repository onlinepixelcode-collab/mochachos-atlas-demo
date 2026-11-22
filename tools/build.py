#!/usr/bin/env python3
"""Build the Mochachos Atlas Road site.

Pages live in src/pages/<name>.html. The first line of each is a meta comment:
  <!--meta {"title": "...", "desc": "...", "nav": "menu", "scripts": ["main", ...], "jsonld": true} -->
followed by the page's <main> content. Shared pieces live in src/partials/.
Run:  python3 tools/build.py   (writes <name>.html in the project root)
"""
import json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
P = lambda n: (SRC / "partials" / n).read_text()

NAV = [("index", "Home"), ("menu", "Menu"), ("dishes", "Dishes"), ("order", "Order"), ("visit", "Visit &amp; 3D"), ("arcade", "Arcade"), ("about", "About")]
SCRIPT = {
    "pageflip": '  <script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js" defer></script>',
    "store3d": None,
}

def nav(current, sep):
    out = []
    for key, label in NAV:
        cur = ' aria-current="page"' if key == current else ""
        out.append(f'<a href="{key}.html"{cur}>{label}</a>')
    return sep.join(out)

def scripts(names):
    names = list(names)
    if "icons" not in names:
        names.insert(0, "icons")  # drawn UI icons (the site uses no emojis)
    if "menu" in names and "art" not in names:
        names.insert(names.index("menu"), "art")  # item illustrations, needed by the menu helpers
    if "dashboard" not in names:
        for extra in ("orders", "order-flow", "fx"):  # ordering + live-order banner + fire effects on every public page
            if extra not in names:
                names.append(extra)
    out = []
    for n in names:
        if n == "store3d":
            out.append(P("importmap.html").rstrip("\n"))
            out.append('  <script type="module" src="assets/js/store3d.js"></script>')
        elif n in SCRIPT:
            out.append(SCRIPT[n])
        else:
            out.append(f'  <script src="assets/js/{n}.js" defer></script>')
    return "\n".join(out)

def build():
    head, top, footer, overlays, jsonld = P("head.html"), P("top.html"), P("footer.html"), P("overlays.html"), P("jsonld.html")
    built = []
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text()
        m = re.match(r"<!--meta (\{.*?\}) -->\n", raw, re.S)
        if not m:
            raise SystemExit(f"{page.name}: missing meta line")
        meta = json.loads(m.group(1))
        body = raw[m.end():]
        h = (head.replace("{{title}}", meta["title"]).replace("{{desc}}", meta["desc"])
                 .replace("{{robots}}", f'  <meta name="robots" content="{meta["robots"]}">\n' if meta.get("robots") else "")
                 .replace("{{og_title}}", meta["title"].split(" | ")[0])
                 .replace("{{jsonld}}", jsonld if meta.get("jsonld") else ""))
        t = top.replace("{{nav}}", nav(meta.get("nav"), "\n        ")).replace("{{mobile_nav}}", nav(meta.get("nav"), "\n      "))
        if meta.get("bare"):
            html = (h + f'<body data-page="{page.stem}" class="bare">\n  <main id="main">\n' + body + "  </main>\n"
                    + scripts(meta.get("scripts", [])) + "\n</body>\n</html>\n")
        else:
            html = (h + f'<body data-page="{page.stem}">\n' + t + '  <main id="main">\n' + body + "  </main>\n\n"
                    + footer + overlays + scripts(meta.get("scripts", [])) + "\n</body>\n</html>\n")
        (ROOT / page.name).write_text(html)
        built.append(page.name)
    print("built:", ", ".join(built))

if __name__ == "__main__":
    build()
