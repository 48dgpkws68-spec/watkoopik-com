# -*- coding: utf-8 -*-
"""watkoopik.com stuurt elke pagina door naar dezelfde pagina op watkoopik.nl (canonical + meta refresh + JS).
Gebruik: python3 redirect_build.py   (leest de paden uit ../watkoopik)"""
import os, glob
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(os.path.dirname(HERE), "watkoopik")
T = '''<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>watkoopik.nl</title>
<link rel="canonical" href="https://watkoopik.nl/{p}"><meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0;url=https://watkoopik.nl/{p}">
<script>location.replace("https://watkoopik.nl/{p}"+location.search+location.hash)</script></head>
<body><a href="https://watkoopik.nl/{p}">Ga naar watkoopik.nl</a></body></html>'''
pages = [os.path.relpath(f, SRC) for f in glob.glob(os.path.join(SRC, "**", "*.html"), recursive=True)
         if not os.path.relpath(f, SRC).startswith(("_src", "brand", "node_modules")) and "google" not in f]
for p in pages:
    out = os.path.join(HERE, p); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(T.replace("{p}", "" if p == "index.html" else p))
# onbekende paden: 404 stuurt door met hetzelfde pad
open(os.path.join(HERE, "404.html"), "w").write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><script>location.replace("https://watkoopik.nl"+location.pathname+location.search+location.hash)</script></head><body><a href="https://watkoopik.nl/">watkoopik.nl</a></body></html>')
open(os.path.join(HERE, "CNAME"), "w").write("watkoopik.com\n")
open(os.path.join(HERE, "robots.txt"), "w").write("User-agent: *\nAllow: /\n")
print("doorverwijzingen:", len(pages))
