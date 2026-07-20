#!/usr/bin/env python3
"""
Build script for pdyocsophv.html

Assembles the modular source files (src/) into the single-file outputTemplate
and encodes it into the Perchance generator HTML.

Usage:
    python build.py              # Build and write to pdyocsophv.html
    python build.py --extract    # Extract pdyocsophv.html -> src/ files
    python build.py --verify     # Verify src/ files round-trip correctly
"""

import sys
import os
import json
import re
from urllib.parse import quote, unquote

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
MAIN_FILE = os.path.join(ROOT, 'pdyocsophv.html')
EXTRACTED = os.path.join(ROOT, '_extracted_outputTemplate.html')

SAFE_CHARS = '/?:@!$&\'()*+,;=-._~#'

# ── Assembly / Disassembly ──────────────────────────────────────────

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

MANIFEST = 'js_manifest.txt'

def read_manifest():
    """Read the JS manifest file and return the list of filenames (in order)."""
    path = os.path.join(SRC, MANIFEST)
    if not os.path.exists(path):
        raise FileNotFoundError(f"JS manifest not found: {path}")
    text = read_file(path)
    return [line.strip() for line in text.splitlines() if line.strip() and not line.strip().startswith('#')]

def read_js_files():
    """Read all JS files listed in the manifest, return list of (filename, content) pairs."""
    manifest = read_manifest()
    result = []
    for fn in manifest:
        content = read_file(os.path.join(SRC, fn)).rstrip('\n')
        result.append((fn, content))
    return result


def extract_body(html_text):
    """Extract body content from a standalone HTML file.

    Returns the text between <body> and the trailing <script src=...> tags,
    which are replaced by inline <script> blocks in the outputTemplate.
    """
    body_open = html_text.find('<body>')
    if body_open == -1:
        raise ValueError("Could not find <body> tag in template.html")
    body_start = html_text.find('\n', body_open) + 1

    script_src_marker = '<script src='
    script_src_pos = html_text.find(script_src_marker)
    if script_src_pos == -1:
        raise ValueError("Could not find <script src= tag in template.html")

    body = html_text[body_start:script_src_pos].rstrip('\n')
    return body


def make_standalone_html(css_link, body, js_files):
    """Wrap body content and inline scripts into a standalone HTML file.

    js_files is a list of (filename, content_or_none) pairs.
    """
    script_tags = '\n'.join(f'<script src="{fn}"></script>' for fn, _ in js_files)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Studio — Development</title>
  <link rel="stylesheet" href="style.css">
  <script>
    // Stub Perchance root API so app.js doesn't crash on load
    window.root = window.root || {{}};
    root.generateImage = root.generateImage || (() => Promise.resolve({{ dataUrl: '' }}));
    root.generateText  = root.generateText  || (() => Promise.resolve(''));
  </script>
</head>
<body>

{body}

{script_tags}
</body>
</html>'''


def assemble():
    """Read src/ files and assemble into a single outputTemplate string."""
    css = read_file(os.path.join(SRC, 'style.css')).rstrip('\n')
    html = read_file(os.path.join(SRC, 'template.html'))
    js_files = read_js_files()

    body = extract_body(html)

    # Build JS block: concatenate all files with marker comments
    js_parts = []
    for fn, content in js_files:
        js_parts.append(f'// === {fn} ===\n{content}')
    js_combined = '\n\n'.join(js_parts)

    template = (
        f"<style>\n{css}\n</style>\n"
        f"{body}\n\n"
        f"<script>\n{js_combined}\n</script>\n"
    )
    return template

def disassemble(template):
    """Split an outputTemplate string into src/ files."""
    # Style
    style_start = template.find('<style>\n') + len('<style>\n')
    style_end = template.find('\n</style>')
    css = template[style_start:style_end]

    # Body HTML (between </style> and first <script>)
    html_start = style_end + len('\n</style>\n')
    html_end = template.find('\n<script>\n', style_end)
    body = template[html_start:html_end]

    # All inline JS (single <script> block)
    s_open = template.find('<script>\n', html_end) + len('<script>\n')
    s_close = template.rfind('\n</script>\n')
    all_js = template[s_open:s_close]

    # Split by file markers
    marker_pattern = re.compile(r'^// === (.+?) ===\n', re.MULTILINE)
    parts = marker_pattern.split(all_js)
    # parts[0] is empty (before first marker), then alternating [filename, content, filename, content, ...]
    js_files = []
    for i in range(1, len(parts), 2):
        fn = parts[i].strip()
        content = parts[i+1].rstrip('\n') if i+1 < len(parts) else ''
        js_files.append((fn, content))

    return css, body, js_files

# ── JSON manipulation in pdyocsophv.html ────────────────────────────

def find_notjs_script(text):
    """Find the <script type="notjs"> content boundaries."""
    marker = 'type="notjs">'
    start = text.find(marker)
    if start == -1:
        raise ValueError("Could not find type=\"notjs\" script tag")
    content_start = start + len(marker)
    content_end = text.find('</script>', content_start)
    return content_start, content_end

def decode_json_from_html(text):
    """Extract and decode the URL-encoded JSON from pdyocsophv.html."""
    content_start, content_end = find_notjs_script(text)
    encoded_json = text[content_start:content_end].strip()
    decoded_json = unquote(encoded_json)
    return json.loads(decoded_json), content_start, content_end

def encode_json_to_html(text, data, content_start, content_end):
    """Replace the notjs script content with re-encoded JSON."""
    new_json = json.dumps(data, ensure_ascii=False)
    new_encoded = quote(new_json, safe=SAFE_CHARS)
    return text[:content_start] + new_encoded + text[content_end:]

# ── Commands ────────────────────────────────────────────────────────

def cmd_build():
    """Assemble src/ -> encode into pdyocsophv.html"""
    print("Building pdyocsophv.html from src/ ...")

    # Assemble
    template = assemble()
    print(f"  Assembled outputTemplate: {len(template)} chars")

    # Read main file
    main_text = read_file(MAIN_FILE)
    data, cs, ce = decode_json_from_html(main_text)

    old_template_len = len(data.get('outputTemplate', ''))
    print(f"  Old outputTemplate: {old_template_len} chars")

    # Replace
    data['outputTemplate'] = template
    new_main = encode_json_to_html(main_text, data, cs, ce)

    # Write
    write_file(MAIN_FILE, new_main)
    print(f"  Wrote {MAIN_FILE} ({len(new_main)} chars)")

    # Verify round-trip
    verify_text = read_file(MAIN_FILE)
    vdata, vcs, vce = decode_json_from_html(verify_text)
    if vdata['outputTemplate'] == template:
        print("  Round-trip verification: PASSED")
    else:
        print("  Round-trip verification: FAILED!")
        sys.exit(1)

    # Also write the extracted file for convenience
    write_file(EXTRACTED, template)
    print(f"  Wrote {EXTRACTED}")

def cmd_extract():
    """Extract pdyocsophv.html -> src/ files"""
    print("Extracting src/ from pdyocsophv.html ...")

    main_text = read_file(MAIN_FILE)
    data, _, _ = decode_json_from_html(main_text)
    template = data['outputTemplate']
    print(f"  outputTemplate: {len(template)} chars")

    css, body, js_files = disassemble(template)

    # Build the standalone HTML wrapper for template.html
    manifest = read_manifest()
    standalone = make_standalone_html('style.css', body, [(fn, None) for fn in manifest])

    write_file(os.path.join(SRC, 'style.css'), css + '\n')

    # Write template.html
    write_file(os.path.join(SRC, 'template.html'), standalone)

    # Write JS files from manifest
    written_js = {fn: content for fn, content in js_files}
    for fn in manifest:
        content = written_js.get(fn, '')
        write_file(os.path.join(SRC, fn), content + '\n')
        print(f"  {fn:<25} {len(content)} chars")

    print(f"  style.css:      {len(css)} chars")
    print(f"  template.html:  {len(standalone)} chars")
    print("  Done.")

def cmd_verify():
    """Verify that src/ reassembles to match the current pdyocsophv.html"""
    print("Verifying src/ matches pdyocsophv.html ...")

    main_text = read_file(MAIN_FILE)
    data, _, _ = decode_json_from_html(main_text)
    original_template = data['outputTemplate']

    assembled = assemble()

    if original_template == assembled:
        print("  Verification: PASSED — src/ is in sync with pdyocsophv.html")
    else:
        print(f"  Verification: FAILED — templates differ")
        print(f"    Original: {len(original_template)} chars")
        print(f"    Assembled: {len(assembled)} chars")
        for i in range(min(len(original_template), len(assembled))):
            if original_template[i] != assembled[i]:
                print(f"    First diff at char {i}:")
                print(f"      Original:   {repr(original_template[max(0,i-40):i+40])}")
                print(f"      Assembled:  {repr(assembled[max(0,i-40):i+40])}")
                break
        sys.exit(1)

# ── Main ────────────────────────────────────────────────────────────

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--extract' in args:
        cmd_extract()
    elif '--verify' in args:
        cmd_verify()
    else:
        cmd_build()
