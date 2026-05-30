#!/usr/bin/env bash
# pet-feeder.sh — long-poll the cloud feeder URL; on each "fed" event,
# make the gochi react: happy face (auto-plays happy jingle) + scrolling
# "FED BY <name>".
#
# Usage:  ./pet-feeder.sh https://<eigencloud-app-url>
set -euo pipefail

URL="${1:-${FEEDER_URL:-}}"
if [[ -z "$URL" ]]; then
  echo "usage: $0 https://<eigencloud-app-url>" >&2
  exit 2
fi
URL="${URL%/}"  # trim trailing slash
HOLD_MIN_S="${HOLD_MIN_S:-8}"   # floor, even for short names
HOLD_PER_CHAR_MS="${HOLD_PER_CHAR_MS:-350}"  # extra ms per character of the message
POLL_S="${POLL_S:-2}"

trap 'echo "pet-feeder: bye"; exit 0' INT TERM
echo "pet-feeder: polling $URL/feed/poll"

while true; do
  # 25s long-poll on the server. On hit, react. On miss, loop.
  resp=$(curl -fsS --max-time 30 "$URL/feed/poll" 2>/dev/null || echo '{}')
  fed=$(echo "$resp" | sed -n 's/.*"fed":\([a-z]*\).*/\1/p')
  if [[ "$fed" == "true" ]]; then
    name=$(echo "$resp" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')
    : "${name:=stranger}"
    name_upper=$(echo "$name" | tr '[:lower:]' '[:upper:]')
    msg="FED BY $name_upper"
    # hold long enough for the scroll to finish: floor + per-char budget
    hold_ms=$(( HOLD_MIN_S * 1000 + ${#msg} * HOLD_PER_CHAR_MS ))
    echo "[fed] $(date +%H:%M:%S) by $name (hold ${hold_ms}ms)"
    gochi face happy >/dev/null
    gochi text "$msg" >/dev/null
    sleep "$(awk -v ms="$hold_ms" 'BEGIN{printf "%.2f", ms/1000}')"
    gochi face neutral >/dev/null
  else
    sleep "$POLL_S"
  fi
done
