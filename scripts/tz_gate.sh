#!/bin/bash
# GitHub Actions の cron（UTC）が、TZ で指定した現地時間の目的の時刻にあたるかを判定する。
# 使い方：scripts/tz_gate.sh "<cron 式>" <現地時間の時>
# 結果を $GITHUB_OUTPUT に run=true|false で書く。cron 式が空（手動実行）なら常に true。
set -euo pipefail
sched="${1:-}"; target="$2"
out="${GITHUB_OUTPUT:-/dev/stdout}"
if [ -z "$sched" ]; then echo "run=true" >> "$out"; exit 0; fi
utc_hour=$(echo "$sched" | awk '{print $2}')
offset=$(date +%z)                       # 例：+0100（BST）、+0000（GMT）
off_h=$((10#${offset:1:2})); [ "${offset:0:1}" = "-" ] && off_h=$((-off_h))
local_hour=$(( (utc_hour + off_h + 24) % 24 ))
if [ "$local_hour" -eq "$target" ]; then echo "run=true" >> "$out"; else echo "run=false" >> "$out"; fi
echo "cron UTC ${utc_hour}時 → 現地 ${local_hour}時（目標 ${target}時）" >&2
