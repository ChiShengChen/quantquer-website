"""Check all indexable local links, assets, and fragments in the generated sitemap."""
from collections import Counter
from html.parser import HTMLParser
import json
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
        self.schema_block = None
        self.schemas, self.meta, self.alternates, self.canonicals = [], {}, {}, []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.in_title |= tag == "title"
        if tag == "link":
            if attrs.get("rel") == "canonical":
                self.canonicals.append(attrs.get("href"))
            if attrs.get("rel") == "alternate" and "hreflang" in attrs:
                self.alternates[attrs["hreflang"]] = attrs.get("href")
        if tag == "meta":
            key = attrs.get("property", attrs.get("name"))
            if key:
                self.meta[key] = attrs.get("content", "")
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.schema_block = ""
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
        if attrs.get("name") == "twitter:image":
            self.urls.add(attrs["content"])

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.schema_block is not None:
            self.schemas.append(self.schema_block)
            self.schema_block = None

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self.schema_block is not None:
            self.schema_block += data


def source(path):
    candidate = ROOT / unquote(path).lstrip("/")
    return candidate / "index.html" if candidate.is_dir() else candidate


sitemap = ET.parse(ROOT / "sitemap.xml")
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
routes = {
    entry.findtext("sm:loc", namespaces=SITEMAP_NS): {
        link.attrib["hreflang"]: link.attrib["href"] for link in entry.findall("x:link", SITEMAP_NS)
    }
    for entry in sitemap.findall("sm:url", SITEMAP_NS)
}
docs = {}
errors = set()
external = set()
checks = 0
titles = Counter()
descriptions = Counter()
for url, alternates in routes.items():
    path = source(urlsplit(url).path)
    if path not in docs:
        docs[path] = Document(path)
    document = docs[path]
    titles[document.title.strip()] += 1
    descriptions[document.meta.get("description", "").strip()] += 1
    if document.canonicals != [url]:
        errors.add((url, "canonical", "expected one self-canonical"))
    if alternates and document.alternates != alternates:
        errors.add((url, "hreflang", "HTML and sitemap alternates disagree"))
    for locale, target in alternates.items():
        if routes.get(target) != alternates:
            errors.add((url, locale, "alternate is missing a reciprocal sitemap entry"))
    for key in ("og:title", "og:description", "og:url", "og:image", "twitter:card", "twitter:image"):
        if not document.meta.get(key):
            errors.add((url, key, "missing sharing metadata"))
    if document.meta.get("og:url") != url:
        errors.add((url, "og:url", "does not match canonical"))
    for schema in document.schemas:
        try:
            json.loads(schema)
        except ValueError:
            errors.add((url, "JSON-LD", "invalid JSON"))
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
for description, count in descriptions.items():
    if count != 1 or not description:
        errors.add(("description", description, f"found {count} times"))
for error in sorted(errors):
    print(" | ".join(error))
if errors:
    raise SystemExit(f"{len(errors)} link or metadata errors")
print(f"Verified {checks} local references and unique titles, descriptions, social metadata and sitemap alternates across {len(routes)} URLs. Found {len(external)} external URLs.")
