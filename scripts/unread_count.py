#!/usr/bin/env python3
"""まだ読んでいない passage の本数を数えて表示する（passages/ にあって read.json にない日付の数）。
ワークフローが「未読がたまっていたら新しく作らない」の判定に使う。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
try:
    read = json.loads((ROOT / "read.json").read_text()).get("read", {})
except (OSError, ValueError):
    read = {}
dates = [p.name for p in (ROOT / "passages").iterdir() if re.fullmatch(r"\d{4}-\d{2}-\d{2}", p.name) and (p / f"{p.name}.md").exists()]
print(sum(1 for d in dates if d not in read))
