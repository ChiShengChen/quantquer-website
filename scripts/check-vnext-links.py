"""Check all indexable local links, assets, and fragments in the generated sitemap."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://quantquer.com"


class Document(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.urls, self.title = set(), set(), ""
        self.in_title = False
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.in_title |= tag == "title"
        if "id" in attrs:
            self.ids.add(attrs["id"])
        for key in ("href", "src", "poster", "data-en-href", "data-zh-href", "data-en-src"):
            if attrs.get(key):
                self.urls.add(attrs[key])
        for item in (attrs.get("srcset") or "").split(","):
            if item.strip():
                self.urls.add(item.strip().split()[0])
        if attrs.get("property") == "og:image":
            self.urls.add(attrs["content"])

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def source(path):
    candidate = ROOT / unquote(path).lstrip("/")
    return candidate / "index.html" if candidate.is_dir() else candidate


sitemap = ET.parse(ROOT / "sitemap.xml")
routes = [item.text for item in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
docs = {}
errors = set()
external = set()
checks = 0
titles = Counter()
for url in routes:
    path = source(urlsplit(url).path)
    document = docs.setdefault(path, Document(path))
    titles[document.title.strip()] += 1
    for link in document.urls:
        absolute = urlsplit(urljoin(url, link))
        if absolute.scheme not in {"https", "http"}:
            continue
        if absolute.netloc != "quantquer.com":
            external.add(absolute.geturl())
            continue
        checks += 1
        target = source(absolute.path)
        if not target.is_file():
            errors.add((url, link, "missing file"))
            continue
        if target.suffix == ".html" and absolute.fragment:
            if target not in docs:
                docs[target] = Document(target)
            if unquote(absolute.fragment) not in docs[target].ids:
                errors.add((url, link, "missing fragment"))
for name, count in titles.items():
    if count != 1 or not name:
        errors.add(("title", name, f"found {count} times"))
for error in sorted(errors):
    print(" | ".join(error))
if errors:
    raise SystemExit(f"{len(errors)} link or metadata errors")
print(f"Verified {checks} local references and unique titles across {len(routes)} URLs. Found {len(external)} external URLs.")
