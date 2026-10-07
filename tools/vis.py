# Verification helper: the page the patient actually reads.
#
# Two reasons this exists. The framework ships its hydration payload inside a
# <script> tag that repeats the page's own data, so counting a word in the raw
# HTML would count it twice (and keep counting it after the visible copy is gone).
# And the whole SSR document arrives as a single long line, so a line-based filter
# cannot separate the two.
#
#   vis.py <body.html>            -> the document with script blocks removed
#   vis.py <body.html> <date>     -> one timeline day's row as plain text
#
# Throwaway scaffolding, like the rest of tools/. Reads only.
import re
import sys

path = sys.argv[1]
html = open(path, encoding="utf-8", errors="replace").read()
html = re.sub(r"<script.*?</script>", "", html, flags=re.S)

wanted = sys.argv[2] if len(sys.argv) > 2 else None
if wanted is not None:
    marker = html.find('data-day="%s"' % wanted)
    if marker < 0:
        print("(no row for %s)" % wanted)
        sys.exit(0)
    # Walk back to the row's own opening tag, then forward to its OWN closing
    # </li> — not the first one after the marker. A day that crossed a saved limit
    # carries its flags in a nested <ul><li>, and stopping at that inner tag would
    # cut the row off before its checklist line.
    start = html.rfind("<li", 0, marker)
    if start < 0:
        start = marker
    depth = 0
    end = len(html)
    for tag in re.finditer(r"<li\b|</li>", html[start:]):
        if tag.group(0) == "</li>":
            depth -= 1
            if depth <= 0:
                end = start + tag.start()
                break
        else:
            depth += 1
    html = html[start:end]

html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
if wanted is not None:
    html = re.sub(r"<[^>]*>", " ", html)
    html = re.sub(r"\s+", " ", html)
sys.stdout.write(html)
