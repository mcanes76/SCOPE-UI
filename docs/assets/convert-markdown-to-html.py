"""Convert docs Markdown to self-contained HTML using local Pandoc (build time only).

The two current Mermaid diagrams have explicit SVG layouts; unsupported diagram
syntax/nodes fail visibly rather than silently losing documentation content.
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
import re
import subprocess
import textwrap
from urllib.parse import unquote, urlsplit, urlunsplit

DOCS = Path(__file__).resolve().parents[1]
CSS = """
:root{color-scheme:light;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#172536;background:#edf1f6}
*{box-sizing:border-box}body{max-width:1200px;margin:24px auto;padding:0 24px 40px;font-size:16px;line-height:1.65}
main{background:#fff;border:1px solid #ccd5e0;border-radius:10px;padding:32px 40px}h1{font-size:30px;line-height:1.25;margin-top:0}h2{font-size:23px;margin-top:36px;line-height:1.35}h3{font-size:19px}a{color:#174e96;text-underline-offset:3px}a:focus-visible,button:focus-visible{outline:3px solid #1551b0;outline-offset:3px}
.document-tools,.document-links{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:12px 0}.document-links a{padding:5px 9px;background:#fff;border:1px solid #ccd5e0;border-radius:5px;font-size:13px}.document-links [aria-current]{font-weight:700;border-color:#174e96}.document-tools button{font:inherit;padding:8px 13px;border:1px solid #61748b;border-radius:5px;background:#fff;cursor:pointer}.source-note,footer{font-size:13px;color:#405164}.toc{border:1px solid #ccd5e0;background:#f5f8fc;padding:14px 20px;margin:24px 0}.toc ul{margin:8px 0;padding-left:22px}
p,li{overflow-wrap:anywhere}code{font:0.88em ui-monospace,Consolas,monospace;background:#edf2f7;border-radius:4px;padding:2px 5px}pre{background:#edf2f7;border:1px solid #ccd5e0;border-radius:7px;padding:16px;overflow:auto;line-height:1.5}pre code{background:none;padding:0;font-size:13px;white-space:pre}blockquote{border-left:4px solid #61748b;margin:20px 0;padding:4px 20px;background:#f5f8fc}.table-scroll{overflow-x:auto;margin:20px 0}table{width:100%;border-collapse:collapse;font-size:14px}th,td{border:1px solid #ccd5e0;padding:10px 12px;text-align:left;vertical-align:top;min-width:130px}th{background:#e8eef6}tbody tr:nth-child(even){background:#f8fafc}ul,ol{padding-left:26px}.task-list-item{list-style:none;margin-left:-20px}.task-list-item input{margin-right:8px;accent-color:#174e96}
.diagram{margin:24px 0;border:1px solid #ccd5e0;border-radius:7px;padding:16px;background:#f8fafc}.diagram svg{display:block;width:100%;height:auto;min-width:0}.diagram figcaption{font-weight:600;margin:10px 0}.diagram details{margin-top:12px}.transition-list{font-size:13px;columns:2;column-gap:28px}.transition-list li{break-inside:avoid;margin-bottom:7px}footer{margin-top:20px}
@media(max-width:700px){body{margin:8px auto;padding:0 10px 24px}main{padding:20px 16px}h1{font-size:25px}.transition-list{columns:1}}
@media print{@page{margin:16mm}body{max-width:none;margin:0;padding:0;background:#fff;color:#172536;font-size:10pt}main{border:0;padding:0}.document-tools,.document-links,footer,.diagram details{display:none}.toc{background:white}h1,h2,h3{break-after:avoid}pre{white-space:pre-wrap;overflow-wrap:anywhere}pre code{white-space:pre-wrap;font-size:8pt}.table-scroll{overflow:visible}table{font-size:8pt}th,td{min-width:0;padding:6px}thead{display:table-header-group}tr,.diagram{break-inside:avoid}a{color:#172536}}
"""


def pandoc(args: list[str], data: str | None = None) -> str:
    result = subprocess.run(["pandoc", *args], input=data, capture_output=True,
                            encoding="utf-8", check=True)
    return result.stdout


def plain(inlines: list[dict]) -> str:
    parts = []
    for node in inlines:
        kind, value = node["t"], node.get("c")
        if kind == "Str":
            parts.append(value)
        elif kind in {"Space", "SoftBreak", "LineBreak"}:
            parts.append(" ")
        elif kind == "Code":
            parts.append(value[1])
        elif kind in {"Emph", "Strong", "Strikeout"}:
            parts.append(plain(value))
        elif kind == "Link":
            parts.append(plain(value[1]))
    return "".join(parts)


def diagram(source: str) -> str:
    lines = [line.strip() for line in source.strip().splitlines() if line.strip()]
    state = lines[0] == "stateDiagram-v2"
    if not state and lines[0] != "flowchart LR":
        raise ValueError("Unsupported Mermaid diagram type")
    labels, edges = {}, []
    endpoint = re.compile(r"^(\[\*\]|\w+)(?:\[(.*)\])?$")
    for line in lines[1:]:
        relationship, _, caption = line.partition(":") if state else (line, "", "")
        left, right = relationship.split("-->")
        ids = []
        for value in (left.strip(), right.strip()):
            match = endpoint.fullmatch(value)
            if not match:
                raise ValueError("Unsupported diagram endpoint: " + value)
            key, label = match.groups()
            labels[key] = label or labels.get(key, "Start" if key == "[*]" else key)
            ids.append(key)
        edges.append((*ids, caption.strip()))
    if state:
        positions = {"[*]": (15, 70), "registered": (90, 70), "initializing": (320, 70),
                     "mounting": (550, 70), "inactive": (780, 70), "active": (1010, 70),
                     "disposing": (1010, 300), "disposed": (780, 300),
                     "failed": (550, 530), "quarantined": (1010, 530)}
        width, height, boxw, boxh = 1210, 650, 140, 64
    else:
        positions = {"Operator": (20, 180), "Shell": (230, 180), "Host": (440, 180),
                     "Adapter": (650, 180), "UI": (860, 180), "Backend": (1070, 180),
                     "Workspace": (440, 25), "Broker": (650, 335)}
        width, height, boxw, boxh = 1270, 455, 180, 90
    if set(labels) != set(positions):
        raise ValueError("Diagram changed; review its SVG layout: " + str(set(labels) ^ set(positions)))
    title = "Application adapter lifecycle" if state else "Shell and application ownership boundaries"
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{title}">',
           f'<title>{title}</title>',
           '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#405b7a"/></marker></defs>']
    for index, (left, right, caption) in enumerate(edges, 1):
        x1, y1 = positions[left]
        x2, y2 = positions[right]
        if left == "[*]":
            x1, y1, x2, y2 = x1 + 20, y1 + boxh / 2, x2 - 3, y2 + boxh / 2
            path = f"M{x1},{y1} L{x2},{y2}"
        elif y1 == y2 and x2 > x1:
            x1, y1, x2, y2 = x1 + boxw, y1 + boxh / 2, x2 - 3, y2 + boxh / 2
            path = f"M{x1},{y1} L{x2},{y2}"
        elif y1 == y2:
            x1, y1, x2, y2 = x1 + boxw / 2, y1, x2 + boxw / 2, y2 - 3
            path = f"M{x1},{y1} C{x1},{y1-65} {x2},{y2-65} {x2},{y2}"
        elif y2 > y1:
            x1, y1, x2, y2 = x1 + boxw / 2, y1 + boxh, x2 + boxw / 2, y2 - 3
            middle = (y1 + y2) / 2
            path = f"M{x1},{y1} C{x1},{middle} {x2},{middle} {x2},{y2}"
        else:
            x1, y1, x2, y2 = x1, y1 + boxh / 2, x2 + boxw / 2, y2 + boxh + 3
            path = f"M{x1},{y1} C{x1-65},{y1} {x2},{y1} {x2},{y2}"
        svg.append(f'<path d="{path}" fill="none" stroke="#405b7a" stroke-width="2" marker-end="url(#arrow)"><title>{html.escape(caption or left+" to "+right)}</title></path>')
        if state:
            bx, by = (x1 + x2) / 2, (y1 + y2) / 2
            if positions[left][1] == positions[right][1] and positions[left][0] > positions[right][0]:
                by -= 49
            svg.append(f'<circle cx="{bx}" cy="{by}" r="12" fill="white" stroke="#61748b"/><text x="{bx}" y="{by+4}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#172536">{index}</text>')
    for key, (x, y) in positions.items():
        if key == "[*]":
            svg.append(f'<circle cx="{x+10}" cy="{y+boxh/2}" r="10" fill="#405b7a"/>')
            continue
        fill = "#fff0ed" if key in {"failed", "quarantined"} else "#e8f0fa"
        svg.append(f'<rect x="{x}" y="{y}" width="{boxw}" height="{boxh}" rx="8" fill="{fill}" stroke="#61748b"/>')
        wrapped = textwrap.wrap(labels[key], 24 if not state else 18)
        first = y + boxh / 2 - (len(wrapped) - 1) * 10 + 6
        for number, line in enumerate(wrapped):
            svg.append(f'<text x="{x+boxw/2}" y="{first+number*20}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#172536">{html.escape(line)}</text>')
    svg.append("</svg>")
    legend = ""
    if state:
        legend = '<ol class="transition-list">' + "".join(
            f'<li><strong>{html.escape(labels[a])} → {html.escape(labels[b])}</strong>: {html.escape(caption)}</li>'
            for a, b, caption in edges) + "</ol>"
    return '<figure class="diagram">' + "".join(svg) + f'<figcaption>{title}'+(' — numbered transitions below' if state else '')+'</figcaption>'+legend+'<details><summary>Original Mermaid source</summary><pre><code>'+html.escape(source)+'</code></pre></details></figure>'


def convert(source: Path, sources: set[Path]) -> str:
    ast = json.loads(pandoc([str(source), "--from=gfm", "--to=json"]))
    headings = []

    def transform(value):
        if isinstance(value, list):
            return [transform(item) for item in value]
        if not isinstance(value, dict):
            return value
        kind, content = value.get("t"), value.get("c")
        if kind == "Link":
            link = urlsplit(content[2][0])
            if not link.scheme and not link.netloc and link.path:
                target = (source.parent / unquote(link.path)).resolve()
                if target in sources:
                    content[2][0] = urlunsplit(("", "", str(Path(link.path).with_suffix(".html")).replace("\\", "/"), link.query, link.fragment))
        if kind == "Header":
            headings.append((content[0], content[1][0], plain(content[2])))
        if kind == "CodeBlock" and "mermaid" in content[0][1]:
            return {"t": "RawBlock", "c": ["html", diagram(content[1])]}
        return {key: transform(item) for key, item in value.items()}

    ast = transform(ast)
    title = next((text for level, _, text in headings if level == 1), source.stem)
    body = pandoc(["--from=json", "--to=html5", "--wrap=none"], json.dumps(ast))
    body = re.sub(r"<table(?:\s[^>]*)?>", lambda m: '<div class="table-scroll" role="region" aria-label="Scrollable documentation table" tabindex="0">'+m[0], body)
    body = body.replace("</table>", "</table></div>")
    toc_items = [f'<li><a href="#{html.escape(anchor)}">{html.escape(text)}</a></li>' for level, anchor, text in headings if level == 2]
    toc = '<nav class="toc" aria-label="On this page"><strong>On this page</strong><ul>'+"".join(toc_items)+'</ul></nav>' if toc_items else ""
    navigation = []
    for page in sorted(sources):
        label = page.stem.replace("SCOPE-Application-Integration-", "").replace("SCOPE-Application-", "").replace("SCOPE-", "").replace("-", " ")
        relative = Path(__import__('os').path.relpath(page.with_suffix('.html'), source.parent)).as_posix()
        current = ' aria-current="page"' if page == source else ''
        navigation.append(f'<a href="{html.escape(relative)}"{current}>{html.escape(label)}</a>')
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="SCOPE Markdown to HTML (Pandoc)"><title>'+html.escape(title)+'</title><style>'+CSS+'</style></head><body>\n<nav class="document-links" aria-label="Documentation pages">'+"".join(navigation)+'</nav>\n<div class="document-tools"><button type="button" onclick="window.print()">Print / Save PDF</button><a href="'+html.escape(source.name)+'">Markdown source</a></div>\n<main>'+toc+body+'</main><footer>Generated from '+html.escape(source.name)+'. All styling and diagrams are embedded; no server or external runtime is required.</footer>\n</body></html>\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify current HTML without writing files")
    args = parser.parse_args()
    sources = {p.resolve() for p in DOCS.rglob("*") if p.suffix.lower() in {".md", ".markdown"}}
    if not sources:
        raise SystemExit("No Markdown documents found")
    for source in sorted(sources):
        target, result = source.with_suffix(".html"), convert(source, sources)
        if args.check:
            if not target.exists() or target.read_text(encoding="utf-8") != result:
                raise SystemExit("HTML is missing or stale: " + str(target))
        else:
            # Existing HTML documentation is not replaced unless it was generated here.
            if target.exists() and 'name="generator" content="SCOPE Markdown to HTML (Pandoc)"' not in target.read_text(encoding="utf-8"):
                raise SystemExit("Refusing to overwrite independently authored HTML: " + str(target))
            target.write_text(result, encoding="utf-8", newline="\n")
        print(("Verified " if args.check else "Created ") + str(target.relative_to(DOCS)))


if __name__ == "__main__":
    main()
