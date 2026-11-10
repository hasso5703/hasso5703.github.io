#!/usr/bin/env python3
"""After postbuild: the French version is whole and says the same numbers as the English one (I18N.md).

For every page of dist (the 404 and the share cards under og/ aside):
- the English page /<path>/ has its French page /fr/<path>/, and the reverse;
- <html lang> is en on the English page and fr on the French one, and each page's canonical URL is itself;
- both pages name each other with hreflang (en, fr) and name the English URL as x-default;
- the links of <main> stay in the page's language (a French page links to French pages);
- the numbers of <main> are the same multiset once French formatting is undone (decimal comma, U+00A0 or U+202F
  between thousands). Dates (2026-11-05) and versions (v1.45.3) count as one token each. Code is compared as written.
And every URL of the sitemap that has a page in both languages lists both.

Exits 1 with every failure listed. Python 3 standard library only.

Usage: python3 scripts/check-i18n.py [dist]
"""
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist')
SITE = 'https://alzeo.ai'
SITEMAP = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
XHTML = '{http://www.w3.org/1999/xhtml}'
SPACES = '\u00a0\u202f\u2009'   # what French puts between thousands: no-break, narrow no-break, thin

DATE = r'\d{4}-\d{2}-\d{2}'
VERSION = r'(?<![A-Za-z])v\d+(?:\.\d+)+'
NUMBER = r'\d+(?:\.\d+)*'
TOKEN = re.compile(f'{DATE}|{VERSION}|{NUMBER}')


class Page(HTMLParser):
    """What the checks read from one page: its language, canonical URL, hreflang links, and in <main> its prose,
    its code and its internal links."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang, self.canonical, self.alternates = None, None, []
        self.prose, self.code, self.links = [], [], []
        self.main = self.hidden = self.in_code = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.lang = a.get('lang')
        elif tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        elif tag == 'link' and a.get('rel') == 'alternate' and a.get('hreflang'):
            self.alternates.append((a['hreflang'], a.get('href')))
        elif tag == 'main':
            self.main += 1
        elif self.main:
            if tag in ('script', 'style'):
                self.hidden += 1
            elif tag in ('code', 'pre'):
                self.in_code += 1
            elif tag == 'a' and a.get('href', '').startswith('/') and not a['href'].startswith('//'):
                self.links.append(a['href'])
        # A tag between two runs of text never joins two numbers into one.
        self.prose.append(' ')
        self.code.append(' ')

    def handle_endtag(self, tag):
        if tag == 'main':
            self.main = max(0, self.main - 1)
        elif self.main:
            if tag in ('script', 'style'):
                self.hidden = max(0, self.hidden - 1)
            elif tag in ('code', 'pre'):
                self.in_code = max(0, self.in_code - 1)
        self.prose.append(' ')
        self.code.append(' ')

    def handle_data(self, data):
        if self.main and not self.hidden:
            (self.code if self.in_code else self.prose).append(data)


def read(path):
    p = Page()
    p.feed(path.read_text(encoding='utf-8'))
    p.close()
    return p


def english_numbers(text):
    """1,048,576 is one number."""
    return re.sub(r'(?<=\d),(?=\d{3}(?!\d))', '', text)


def french_numbers(text):
    """1 048 576 (U+00A0) is one number, and 65,2 is 65.2."""
    text = re.sub(f'(?<=\\d)[{SPACES}](?=\\d{{3}}(?!\\d))', '', text)
    return re.sub(r'(?<=\d),(?=\d)', '.', text)


def numbers(page, lang):
    prose = ''.join(page.prose)
    prose = french_numbers(prose) if lang == 'fr' else english_numbers(prose)
    # Code, commands and their comments are copied as written in both languages.
    code = english_numbers(''.join(page.code))
    return Counter(TOKEN.findall(prose)) + Counter(TOKEN.findall(code))


def pages():
    """Each language's pages by their English path: /models/ for dist/models/ and for dist/fr/models/."""
    en, fr = {}, {}
    for f in sorted(DIST.rglob('index.html')):
        parts = f.parent.relative_to(DIST).parts
        side = fr if parts[:1] == ('fr',) else en
        parts = parts[1:] if side is fr else parts
        if parts[:1] == ('og',):
            continue
        side['/' + ''.join(p + '/' for p in parts)] = f
    return en, fr


def url(path, lang):
    return SITE + ('/fr' if lang == 'fr' else '') + path


def page_link(href):
    """The page an internal link opens (/fr/models/ for /fr/models/#x), or None for a file (/llms.txt)."""
    path = re.split(r'[?#]', href, maxsplit=1)[0]
    return path if path.endswith('/') else None


def main():
    if not DIST.is_dir():
        sys.exit(f'check-i18n: {DIST} is not a directory')
    fails = []
    en, fr = pages()
    for path in sorted(set(en) - set(fr)):
        fails.append(f'{url(path, "en")} has no French page at {url(path, "fr")}')
    for path in sorted(set(fr) - set(en)):
        fails.append(f'{url(path, "fr")} has no English page at {url(path, "en")}')

    pairs = sorted(set(en) & set(fr))
    for path in pairs:
        both = {'en': read(en[path]), 'fr': read(fr[path])}
        want = {'en': url(path, 'en'), 'fr': url(path, 'fr'), 'x-default': url(path, 'en')}
        for lang, p in both.items():
            here = url(path, lang)
            if p.lang != lang:
                fails.append(f'{here}: <html lang="{p.lang}">, expected "{lang}"')
            if p.canonical != here:
                fails.append(f'{here}: canonical {p.canonical}, expected itself')
            got = dict(p.alternates)
            if len(got) != len(p.alternates):
                fails.append(f'{here}: an hreflang appears twice: {p.alternates}')
            if got != want:
                fails.append(f'{here}: hreflang {got}, expected {want}')
            for href in p.links:
                target = page_link(href)
                if target and (target == '/fr/' or target.startswith('/fr/')) != (lang == 'fr'):
                    fails.append(f'{here}: <main> links to {href}, a page in the other language')
        a, b = numbers(both['en'], 'en'), numbers(both['fr'], 'fr')
        if a != b:
            only_en = ', '.join(f'{n} x{c}' if c > 1 else n for n, c in sorted((a - b).items())) or 'none'
            only_fr = ', '.join(f'{n} x{c}' if c > 1 else n for n, c in sorted((b - a).items())) or 'none'
            fails.append(f'{url(path, "fr")}: numbers differ from {url(path, "en")}\n'
                         f'    only in English: {only_en}\n    only in French:  {only_fr}')

    # The sitemap: a URL whose page exists in both languages lists both (xhtml:link, from astro.config.mjs).
    listed = 0
    for f in sorted(DIST.glob('sitemap-*.xml')):
        root = ET.parse(f).getroot()
        if root.tag != SITEMAP + 'urlset':
            continue
        for u in root.findall(SITEMAP + 'url'):
            loc = u.find(SITEMAP + 'loc').text.strip()
            links = {l.get('hreflang'): l.get('href') for l in u.findall(XHTML + 'link')}
            path = loc[len(SITE):]
            path = path[3:] if path.startswith('/fr/') else path
            if path in pairs:
                listed += 1
                if links != {'en': url(path, 'en'), 'fr': url(path, 'fr')}:
                    fails.append(f'{f.name}: {loc} lists {links}, expected its English and French URLs')
    if listed != 2 * len(pairs):
        fails.append(f'sitemap: {listed} URLs of pages in both languages, expected {2 * len(pairs)}')

    if fails:
        print(f'check-i18n: {len(fails)} failure(s) on {len(pairs)} pairs of pages:', file=sys.stderr)
        for line in fails:
            print('  - ' + line, file=sys.stderr)
        sys.exit(1)
    print(f'check-i18n: {len(pairs)} pages in English and in French, hreflang both ways with x-default, '
          f'the same numbers on every pair, the sitemap lists both languages')


if __name__ == '__main__':
    main()
