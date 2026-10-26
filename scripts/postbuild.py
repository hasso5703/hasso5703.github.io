#!/usr/bin/env python3
"""After `astro build`: the full text of every page in Markdown (dist/llms-full.txt), the date each page last
changed in the sitemap, and the pages that changed since the published site, for IndexNow (postbuild-out/).

A page changed when its Markdown differs from the one the published llms-full.txt carries. The published file is
the record of what each page said and since when, so nothing else has to be kept from one build to the next. If it
cannot be read (the first build, or no network), every page counts as changed today.

Usage: python3 scripts/postbuild.py [dist]. LIVE_BASE overrides the published site it compares with.
"""
import datetime
import hashlib
import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

DIST = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist')
OUT = Path('postbuild-out')
SITE = 'https://hasso5703.github.io'
HOST = 'hasso5703.github.io'
LIVE = os.environ.get('LIVE_BASE', SITE).rstrip('/')
TODAY = datetime.datetime.now(datetime.timezone.utc).date().isoformat()
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'

# What a reader of the text does not need: scripts, icons, buttons, the video, the breadcrumb, the interactive lane
# pool (the lanes table below it says the same) and anything hidden from assistive technology.
SKIP_TAGS = {'script', 'style', 'svg', 'button', 'figure', 'img', 'video', 'source', 'noscript', 'template', 'picture'}
SKIP_CLASSES = {'crumbs', 'pool-ui', 'hero-actions', 'dot'}
INLINE = {'a', 'span', 'strong', 'b', 'em', 'i', 'code', 'small', 'sup', 'sub', 'br', 'abbr', 'time', 'kbd', 'mark', 'q', 'u', 'label'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


class Node:
    __slots__ = ('tag', 'attrs', 'children', 'parent')

    def __init__(self, tag, attrs, parent):
        self.tag, self.attrs, self.children, self.parent = tag, attrs, [], parent

    def classes(self):
        return set((self.attrs.get('class') or '').split())

    def elements(self, *tags):
        return [c for c in self.children if isinstance(c, Node) and (not tags or c.tag in tags)]


class Tree(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root', {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, dict(attrs), self.cur))

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def find(node, tag):
    for c in node.elements():
        if c.tag == tag:
            return c
        hit = find(c, tag)
        if hit is not None:
            return hit
    return None


def skipped(node):
    return node.tag in SKIP_TAGS or bool(node.classes() & SKIP_CLASSES) or node.attrs.get('aria-hidden') == 'true'


def clean(text):
    return re.sub(r'\s+', ' ', text).strip()


def absolute(href):
    return SITE + href if href.startswith('/') else href


def inline_seq(children):
    """Inline text of a run of children; two elements side by side get a space, so 71.4 and tok/s do not touch."""
    parts, prev_element = [], False
    for c in children:
        text = inline(c)
        if not text:
            continue
        element = isinstance(c, Node)
        if parts and element and prev_element and not parts[-1][-1:].isspace() and not text[:1].isspace():
            parts.append(' ')
        parts.append(text)
        prev_element = element
    return ''.join(parts)


def inline(node):
    if isinstance(node, str):
        return node
    if skipped(node):
        return ''
    if node.tag == 'br':
        return ' '
    if 'tags' in node.classes():
        return ', '.join(t for t in (clean(inline(c)) for c in node.elements()) if t)
    text = inline_seq(node.children)
    if node.tag in ('strong', 'b'):
        return f'**{clean(text)}**' if clean(text) else ''
    if node.tag in ('em', 'i'):
        return f'*{clean(text)}*' if clean(text) else ''
    if node.tag == 'code':
        return f'`{clean(text)}`' if clean(text) else ''
    if node.tag == 'a':
        href, text = node.attrs.get('href', ''), clean(text)
        if not text:
            return ''
        return f'[{text}]({absolute(href)})' if href and not href.startswith('#') else text
    if node.tag not in INLINE:
        return f' {text} '
    return text


def raw_text(node):
    return ''.join(c if isinstance(c, str) else ('' if skipped(c) else raw_text(c)) for c in node.children)


def fields_link(a):
    """A card link (machines, other lanes, guides): [its name](url): the other fields."""
    fields = []
    for c in a.elements():
        text = clean(inline(c))
        if text:
            fields.append((c.classes(), text))
    if not fields:
        return None
    name_at = next((i for i, (cls, _) in enumerate(fields) if cls & {'m-name', 'g-title'}), 0)
    rest = [t for i, (_, t) in enumerate(fields) if i != name_at]
    link = f'[{fields[name_at][1]}]({absolute(a.attrs.get("href", ""))})'
    return link + (': ' + ', '.join(rest) if rest else '')


def list_lines(lst, depth=0):
    lines, n = [], 0
    for li in lst.elements('li'):
        n += 1
        bullet = f'{n}.' if lst.tag == 'ol' else '-'
        anchors = li.elements('a')
        if len(anchors) == 1 and not clean(''.join(c for c in li.children if isinstance(c, str))) and anchors[0].elements('span', 'div'):
            own = fields_link(anchors[0]) or ''
        else:
            own = clean(inline_seq([c for c in li.children if not (isinstance(c, Node) and c.tag in ('ul', 'ol'))]))
        if own:
            lines.append('  ' * depth + f'{bullet} {own}')
        for sub in li.elements('ul', 'ol'):
            lines += list_lines(sub, depth + 1)
    return lines


def cell_text(cell):
    """A table cell: inline runs as one text, each block inside it (a muted line) after a comma."""
    parts, run = [], []
    for c in cell.children:
        if isinstance(c, Node) and c.tag not in INLINE and not skipped(c):
            parts.append(clean(inline_seq(run)))
            run = []
            parts.append(clean(inline(c)))
        else:
            run.append(c)
    parts.append(clean(inline_seq(run)))
    return ', '.join(p for p in parts if p).replace('|', '\\|')


def table_md(table):
    rows = []
    for tr in [n for n in walk(table) if n.tag == 'tr']:
        cells = [cell_text(c) for c in tr.elements('th', 'td')]
        rows.append((cells, tr.parent is not None and tr.parent.tag == 'thead'))
    if not rows:
        return []
    head = next((r for r, h in rows if h), rows[0][0])
    body = [r for r, h in rows if not h] if any(h for _, h in rows) else [r for r, _ in rows[1:]]
    width = max(len(head), *(len(r) for r in body)) if body else len(head)
    pad = lambda r: r + [''] * (width - len(r))
    lines = ['| ' + ' | '.join(pad(head)) + ' |', '|' + '---|' * width]
    lines += ['| ' + ' | '.join(pad(r)) + ' |' for r in body]
    return ['\n'.join(lines)]


def walk(node):
    for c in node.elements():
        yield c
        yield from walk(c)


def blocks(node):
    if isinstance(node, str):
        text = clean(node)
        return [text] if text else []
    if skipped(node):
        return []
    tag = node.tag
    if tag in ('h1', 'h2', 'h3', 'h4'):
        text = clean(inline_seq(node.children))
        return [('#' * int(tag[1])) + ' ' + text] if text else []
    if tag == 'p':
        text = clean(inline_seq(node.children))
        return [text] if text else []
    if tag == 'pre':
        code = raw_text(node).strip('\n')
        lang = next((m.group(1) for c in node.elements('code') for m in [re.search(r'language-(\w+)', c.attrs.get('class', ''))] if m), '')
        return [f'```{lang}\n{code}\n```']
    if tag in ('ul', 'ol'):
        lines = list_lines(node)
        return ['\n'.join(lines)] if lines else []
    if tag == 'table':
        return table_md(node)
    if tag == 'dl':
        lines, key = [], None
        for c in node.elements('dt', 'dd'):
            if c.tag == 'dt':
                key = clean(inline(c))
            else:
                value = clean(inline(c))
                lines.append(f'- {key}: {value}' if key else f'- {value}')
        return ['\n'.join(lines)] if lines else []
    if tag == 'details':
        out = []
        for c in node.children:
            if isinstance(c, Node) and c.tag == 'summary':
                question = clean(inline_seq(c.children))
                if question:
                    out.append(f'**{question}**')
            else:
                out += blocks(c)
        return out
    return container(node)


def container(node):
    out, run = [], []

    def flush():
        text = clean(inline_seq(run))
        if text:
            out.append(text)
        run.clear()

    for c in node.children:
        if isinstance(c, str) or (c.tag in INLINE and not skipped(c)):
            run.append(c)
        else:
            flush()
            out += blocks(c)
    flush()
    return out


def page(path):
    source = path.read_text(encoding='utf-8')
    title = html.unescape(re.search(r'<title>(.*?)</title>', source, re.S).group(1)).strip()
    url = re.search(r'<link rel="canonical" href="([^"]+)"', source).group(1)
    tree = Tree()
    tree.feed(source)
    main = find(tree.root, 'main')
    if main is None:
        sys.exit(f'postbuild: {path} has no <main>')
    body = '\n\n'.join(b for b in container(main) if b)
    links = [absolute(n.attrs['href']) for n in walk(main) if n.tag == 'a' and n.attrs.get('href', '').startswith('/')]
    return url, title, body.strip(), links


def fetch(url):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'dgx-spark-qwen38 site build'})
        with urllib.request.urlopen(request, timeout=20) as r:
            return r.read().decode('utf-8')
    except Exception as e:  # noqa: BLE001: no published file is a normal first build
        print(f'postbuild: {url} not read ({e.__class__.__name__}): every page counts as changed today', file=sys.stderr)
        return None


def digest(text):
    return hashlib.sha256(text.strip().encode('utf-8')).hexdigest()


def main():
    found = {}
    for f in sorted(DIST.rglob('index.html')):
        if 'og' in f.relative_to(DIST).parts:
            continue
        url, title, body, links = page(f)
        found[url] = (title, body, links)

    # Order: home, then each section page followed by its pages in the order the section lists them.
    order = [SITE + '/']
    for section in ('/models/', '/dgx-spark-64gb/', '/machines/', '/guides/'):
        top = SITE + section
        if top in found and top not in order:
            order.append(top)
            for link in found[top][2]:
                if link.startswith(top) and link != top and link in found and link not in order:
                    order.append(link)
    order += sorted(u for u in found if u not in order)

    previous = {}
    published = fetch(LIVE + '/llms-full.txt')
    if published:
        pattern = r'^URL: (\S+)\nUpdated: (\d{4}-\d{2}-\d{2})\n\n(.*?)(?=\n\n---\n\nURL: |\Z)'
        for m in re.finditer(pattern, published, re.S | re.M):
            previous[m.group(1)] = (m.group(2), digest(m.group(3)))

    updated, changed = {}, []
    for url in order:
        before = previous.get(url)
        if before and before[1] == digest(found[url][1]):
            updated[url] = before[0]
        else:
            updated[url] = TODAY
            changed.append(url)

    sentence = next((l[2:] for l in (DIST / 'llms.txt').read_text(encoding='utf-8').splitlines() if l.startswith('> ')), '')
    head = [
        '# dgx-spark-qwen38: every page in full',
        '',
        f'> {sentence}',
        '',
        f'The text of every page of {SITE}/ in Markdown, in one file for AI agents and answer engines, with the date '
        f'each page last changed. One line per page: {SITE}/llms.txt. The source of every number about the project: '
        'https://github.com/hasso5703/dgx-spark-qwen38.',
    ]
    sections = [f'URL: {u}\nUpdated: {updated[u]}\n\n{found[u][1]}' for u in order]
    (DIST / 'llms-full.txt').write_text('\n'.join(head) + '\n\n---\n\n' + '\n\n---\n\n'.join(sections) + '\n', encoding='utf-8')

    # The sitemap: each page's date, and the index dated by its newest page. Its URLs and the pages must be the same set.
    ET.register_namespace('', NS[1:-1])
    in_sitemap = set()
    for f in sorted(DIST.glob('sitemap-*.xml')):
        tree = ET.parse(f)
        root = tree.getroot()
        if root.tag == NS + 'urlset':
            for u in root.findall(NS + 'url'):
                loc = u.find(NS + 'loc').text.strip()
                in_sitemap.add(loc)
                if loc not in updated:
                    sys.exit(f'postbuild: {loc} is in {f.name} but no page has that canonical URL')
                lastmod = u.find(NS + 'lastmod')
                if lastmod is None:
                    lastmod = ET.SubElement(u, NS + 'lastmod')
                lastmod.text = updated[loc]
        elif root.tag == NS + 'sitemapindex':
            for s in root.findall(NS + 'sitemap'):
                lastmod = s.find(NS + 'lastmod')
                if lastmod is None:
                    lastmod = ET.SubElement(s, NS + 'lastmod')
                lastmod.text = max(updated.values())
        tree.write(f, encoding='UTF-8', xml_declaration=True)
    missing = sorted(set(updated) - in_sitemap)
    if missing:
        sys.exit(f'postbuild: pages missing from the sitemap: {missing}')

    # IndexNow: the key is the one file at the root named by 32 hex digits and holding them.
    keys = [p for p in DIST.glob('*.txt') if re.fullmatch(r'[0-9a-f]{32}', p.stem)]
    if len(keys) != 1 or keys[0].read_text(encoding='utf-8').strip() != keys[0].stem:
        sys.exit(f'postbuild: expected one IndexNow key file at the root of {DIST}, found {[p.name for p in keys]}')
    key = keys[0].stem
    OUT.mkdir(exist_ok=True)
    (OUT / 'indexnow.json').write_text(json.dumps({'host': HOST, 'key': key, 'keyLocation': f'{SITE}/{key}.txt', 'urlList': changed}, indent=1), encoding='utf-8')
    print(f'postbuild: {len(order)} pages, {len(changed)} changed since {LIVE}, '
          f'llms-full.txt {(DIST / "llms-full.txt").stat().st_size} bytes, sitemap dated')


if __name__ == '__main__':
    main()
