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
    start = html.find('data-day="%s"' % wanted)
    if start < 0:
        print("(no row for %s)" % wanted)
        sys.exit(0)
    end = html.find("</li>", start)
    html = html[start : end if end > 0 else len(html)]

html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
if wanted is not None:
    html = re.sub(r"<[^>]*>", " ", html)
    html = re.sub(r"\s+", " ", html)
sys.stdout.write(html)
