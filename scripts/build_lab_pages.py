#!/usr/bin/env python3
"""Render the lab READMEs as styled pages for GitHub Pages.

For every labs/src/ie/atu/<slug>/README.md this emits
OUTPUT_DIR/labs/<slug>/index.html in the site's visual identity, plus a
labs index page at OUTPUT_DIR/labs/index.html. Pages are READ-ONLY
previews — each carries a banner telling students to make their own
copy of the repo from the template and work in a Codespace.

Mermaid fences render client-side (pinned mermaid, same version as the
repo's Moodle assets), and ```java fences get client-side highlight.js
colouring — pinned to the same highlight.js version marp-core bundles,
with the token palette copied from themes/ooc.css, so lab code looks
exactly like deck code. ```text fences (Expected output) stay flat.
Requires the `markdown` package (pip install markdown).

Usage:
    python scripts/build_lab_pages.py [OUTPUT_DIR]     # default: build
"""
import html
import re
import sys
from pathlib import Path

import markdown

LABS = Path("labs/src/ie/atu")
REPO_URL = "https://github.com/danielcregg/object-oriented-computing"

# Both scripts are third-party code executed on the module's public site, so
# each carries a Subresource Integrity hash: the browser refuses to run the
# file unless it hashes to exactly this, which makes a pinned version
# genuinely immutable rather than merely named. `crossorigin="anonymous"` is
# required for SRI to be enforced on a cross-origin request -- without it the
# response is opaque and the integrity attribute is silently ignored.
# Regenerate a hash after any version bump:
#   curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
MERMAID_JS = "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js"
MERMAID_SRI = "sha384-zkWMJO4sgpPUzyuOgDx8HB/K55glbAwajEpk1Go2NWRuPkPA/wIhoEJTuSkmOYrV"
# Same major.minor.patch as marp-core's bundled highlight.js — keeps lab
# token classes identical to the rendered decks'.
HLJS_JS = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js"
HLJS_SRI = "sha384-RH2xi4eIQ/gjtbs9fUXM68sLSi99C7ZWBRX1vDrVv6GQXRibxXLbwO2NGZB74MbU"

FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' "
           "viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' "
           "fill='%23FBFAF7'/%3E%3Ctext x='16' y='25' font-family='Consolas,monospace' "
           "font-size='26' font-weight='700' fill='%23E76F00' "
           "text-anchor='middle'%3E;%3C/text%3E%3C/svg%3E")

STYLE = """<style>
  :root {
    --paper:#FBFAF7; --ink:#1E2833; --blue:#33698C; --orange:#E76F00;
    --slate:#46536B; --rule:#DED8C9; --muted:#8B8471; --codebg:#16222E;
    --mono:'Cascadia Code','SF Mono',Menlo,Consolas,'Courier New',monospace;
    --sans:'Segoe UI','Helvetica Neue',Arial,sans-serif;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: var(--sans); color: var(--ink); line-height: 1.6;
    background: linear-gradient(to right,
      var(--paper) 0, var(--paper) 56px, var(--rule) 56px, var(--rule) 58px,
      var(--paper) 58px, var(--paper) 100%);
  }
  .wrap { max-width: 880px; padding: 40px 32px 80px 88px; }
  .kicker { font-family: var(--mono); font-size: 14px; color: var(--muted); }
  .kicker::before { content: '// '; color: var(--orange); }
  .kicker a { color: var(--muted); }
  h1, h2, h3 { font-family: var(--mono); letter-spacing: -0.01em; line-height: 1.25; }
  h1 { font-size: clamp(26px, 4.5vw, 38px); margin: 10px 0 6px; }
  h1::after, h2::after { content: ';'; color: var(--orange); }
  h2 { font-size: 25px; margin: 40px 0 12px; border-top: 1px solid var(--rule); padding-top: 26px; }
  h3 { font-size: 20px; margin: 28px 0 10px; color: var(--slate); }
  a { color: var(--blue); text-decoration-color: var(--orange); }
  .copy-banner {
    border-left: 4px solid var(--orange); background: #FDEFD9;
    padding: 12px 18px; margin: 20px 0 8px; font-size: 15.5px; color: #7A4A12;
    border-radius: 0 8px 8px 0;
  }
  .copy-banner a { color: #B94E00; font-weight: 600; }
  code {
    font-family: var(--mono); background: #EFECE3; color: #B94E00;
    padding: 0.08em 0.35em; border-radius: 5px; font-size: 0.9em;
  }
  pre {
    background: var(--codebg); border-radius: 10px; padding: 16px 20px;
    overflow-x: auto; line-height: 1.5;
  }
  pre code { background: transparent; color: #E8ECF1; padding: 0; font-size: 14.5px; }
  /* java token colours — same palette as section pre code in themes/ooc.css */
  pre code .hljs-string { color: #F0B26B; }
  pre code .hljs-keyword { color: #7FB4D8; }
  pre code .hljs-title, pre code .hljs-built_in { color: #A8D3EE; }
  pre code .hljs-comment { color: #7C8B99; }
  pre.mermaid { background: #FFFFFF; border: 1px solid var(--rule); text-align: center; }
  table { border-collapse: collapse; margin: 14px 0; font-size: 15.5px; }
  th { font-family: var(--mono); text-align: left; color: var(--slate);
       border-bottom: 2px solid var(--ink); padding: 7px 22px 7px 6px; }
  td { border-bottom: 1px solid var(--rule); padding: 8px 22px 8px 6px; vertical-align: top; }
  blockquote { border-left: 4px solid var(--orange); background: #F4F0E6;
               margin: 14px 0; padding: 10px 18px; color: var(--slate); }
  blockquote p { margin: 4px 0; }
  details { border: 1.5px solid var(--blue); border-radius: 9px;
            padding: 10px 16px; margin: 12px 0; background: #FFFFFF; }
  details summary { font-family: var(--mono); font-weight: 600; color: var(--blue); cursor: pointer; }
  img { max-width: 100%; }
  .row-list { list-style: none; padding: 0; }
  .row-list li { border-bottom: 1px solid var(--rule); padding: 14px 4px; display: flex;
                 justify-content: space-between; align-items: baseline; gap: 16px; }
  .row-list li:first-child { border-top: 1px solid var(--rule); }
  .row-list .t { font-family: var(--mono); font-weight: 600; font-size: 19px; }
  .row-list .t a { color: var(--ink); text-decoration: none; }
  .row-list .t a:hover { color: var(--blue); }
  .open { font-family: var(--mono); font-size: 14px; color: var(--blue);
          border: 1.5px solid var(--blue); border-radius: 7px; padding: 5px 14px;
          text-decoration: none; white-space: nowrap; }
  .open:hover { background: var(--blue); color: var(--paper); }
  @media (max-width: 700px) {
    body { background: var(--paper); }
    .wrap { padding: 28px 18px 60px; }
    .open { padding: 10px 20px; font-size: 15px; }
  }
</style>"""


def gh_slugify(text: str) -> str:
    text = re.sub(r"[`*_]", "", text).strip().lower()
    text = re.sub(r"[^\w\- ]", "", text, flags=re.UNICODE)
    return text.replace(" ", "-")


def preprocess(md_text: str) -> str:
    """Turn mermaid fences into pass-through <pre class="mermaid"> blocks,
    let markdown render inside <details>, and add the blank line GitHub
    tolerates omitting before a list (python-markdown does not)."""
    def mermaid_repl(m):
        return '<pre class="mermaid">\n' + html.escape(m.group(1)) + "\n</pre>"
    md_text = re.sub(r"```mermaid\n(.*?)\n```", mermaid_repl, md_text, flags=re.DOTALL)
    md_text = md_text.replace("<details>", '<details markdown="1">')

    out, in_fence, prev = [], False, ""
    item = re.compile(r"^\s*(?:[-*+] |\d+\. )")
    for line in md_text.split("\n"):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        elif (not in_fence and item.match(line) and prev.strip()
              and not item.match(prev) and not prev.lstrip().startswith(("#", ">", "<"))):
            out.append("")
        out.append(line)
        prev = line
    return "\n".join(out)


def page(title: str, kicker_html: str, body_html: str, needs_mermaid: bool,
         banner_html: str = "", needs_hljs: bool = False) -> str:
    mermaid = (f'<script src="{MERMAID_JS}" integrity="{MERMAID_SRI}"'
               ' crossorigin="anonymous"></script>'
               '<script>mermaid.initialize({startOnLoad:true,theme:"neutral"});</script>'
               if needs_mermaid else "")
    # `typeof hljs` guard: if SRI rejects the file the script never defines
    # hljs, and an unguarded call would throw and abort the rest of the page.
    # Uncoloured code is a fine degradation; a broken page is not.
    hljs = (f'<script src="{HLJS_JS}" integrity="{HLJS_SRI}"'
            ' crossorigin="anonymous"></script>'
            "<script>if(typeof hljs!=='undefined'){"
            "document.querySelectorAll('pre code.language-java')"
            ".forEach(function(el){hljs.highlightElement(el);});}</script>"
            if needs_hljs else "")
    return (f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{title}</title>\n<link rel="icon" href="{FAVICON}">\n{STYLE}\n'
            f"</head>\n<body>\n<div class=\"wrap\">\n"
            f'<p class="kicker">{kicker_html}</p>\n{banner_html}{body_html}\n'
            f"</div>\n{hljs}{mermaid}</body>\n</html>\n")


def main() -> None:
    out_root = Path(sys.argv[1] if len(sys.argv) > 1 else "build") / "labs"
    out_root.mkdir(parents=True, exist_ok=True)

    labs = []
    for readme in sorted(LABS.glob("*/README.md")):
        slug = readme.parent.name
        text = readme.read_text(encoding="utf-8")
        heading = re.match(r"#\s+(.+)", text)
        if heading is None:
            # Every lab README opens with `# Java <Topic> Lab` -- that line is
            # the page title and the labs-index entry. Without the guard this
            # was an AttributeError on None, which says nothing about which
            # file is wrong or why.
            raise SystemExit(
                f"build_lab_pages: {readme} does not start with a `# ` "
                f"heading, so it has no title. Every lab README must open "
                f"with `# Java <Topic> Lab` on its first line.")
        title = heading.group(1).strip()
        labs.append((slug, title))

        md = markdown.Markdown(
            extensions=["fenced_code", "tables", "md_in_html", "toc"],
            extension_configs={"toc": {"slugify": lambda v, s: gh_slugify(v)}})
        body = md.convert(preprocess(text))

        banner = (f'<div class="copy-banner">Read-only preview. To <strong>do</strong> '
                  f'this lab: <a href="{REPO_URL}/generate">make your own copy of the '
                  f'repo</a> ("Use this template"), open a Codespace on it, and work '
                  f'in <code>labs/src/ie/atu/{slug}/</code>.</div>')
        kicker = '<a href="./..">labs</a> · object-oriented computing'
        dest = out_root / slug
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "index.html").write_text(
            page(html.escape(title), kicker, body, "```mermaid" in text or
                 'class="mermaid"' in body, banner,
                 needs_hljs='language-java' in body),
            encoding="utf-8", newline="\n")

    rows = "".join(
        f'<li><span class="t"><a href="{slug}/">{html.escape(title)}</a></span>'
        f'<a class="open" href="{slug}/">open</a></li>\n'
        for slug, title in labs)
    index_body = (f"<h1>Labs</h1>\n"
                  f"<p>The module's lab exercises, one page per lab — read-only "
                  f"previews of the instructions, always the current version. To "
                  f"complete a lab you work in your own copy of the repo: "
                  f'<a href="{REPO_URL}/generate">Use this template</a>, then open '
                  f"a Codespace on it.</p>\n<ul class=\"row-list\">\n{rows}</ul>\n"
                  f'<p class="kicker"><a href="../">back to the lecture decks</a></p>')
    (out_root / "index.html").write_text(
        page("OOC Labs", "object-oriented computing", index_body, False),
        encoding="utf-8", newline="\n")
    print(f"wrote {len(labs)} lab pages + labs index under {out_root}")


if __name__ == "__main__":
    main()
