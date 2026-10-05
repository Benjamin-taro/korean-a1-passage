#!/usr/bin/env python3
"""全ページ（index.html・today.html・passages/**/*.html）に、既読ボタンのスクリプト read.js を読み込ませる。
冪等：既に入っているページは触らない。passage を作るたびにワークフローが実行する。"""
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPO = ROOT.name
try:
    url = subprocess.run(["git", "-C", str(ROOT), "remote", "get-url", "origin"], capture_output=True, text=True).stdout.strip()
    if url:
        REPO = url.rstrip("/").removesuffix(".git").split("/")[-1].split(":")[-1]
except OSError:
    pass
TAG = f'<script src="/{REPO}/read.js" defer></script>'

changed = 0
for path in [ROOT / "index.html", ROOT / "today.html", *sorted((ROOT / "passages").glob("*/*.html"))]:
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    if "read.js" in text or "</body>" not in text:
        continue
    i = text.rindex("</body>")
    path.write_text(text[:i] + TAG + "\n" + text[i:], encoding="utf-8")
    changed += 1
print(f"read.js を追加：{changed} ページ（{TAG}）")
