#!/usr/bin/env bash
# bat-signal.sh — one-shot: trigger the Bat-signal scene on the gochi.
#
#   ./bat-signal.sh              # default: GOTHAM NEEDS YOU
#   ./bat-signal.sh "I AM BATMAN" # custom alert text
#
# Scene:
#   1. Face → angry  (firmware plays the 1966 Batman theme on the buzzer)
#   2. OLED scrolls the alert for HOLD_S seconds (the theme keeps playing)
#   3. OLED returns to the bat-symbol idle
set -euo pipefail

MSG="${1:-GOTHAM NEEDS YOU}"
HOLD_S="${HOLD_S:-5}"
BAT_IMG="$(cd "$(dirname "$0")" && pwd)/assets/bat.png"

if ! command -v gochi >/dev/null; then
  echo "gochi CLI not found" >&2; exit 1
fi
if [[ ! -f "$BAT_IMG" ]]; then
  echo "missing $BAT_IMG" >&2; exit 1
fi

# 1. Trigger the buzzer: any face change to ANGRY makes the firmware play
#    the (re-tuned) ANGRY jingle, which is now the Batman theme.
gochi face angry >/dev/null

# 2. Immediately scroll the alert. Pushing text replaces the angry-face
#    view so the OLED only flashes red for a frame.
gochi text "$MSG" >/dev/null

sleep "$HOLD_S"

# 3. Restore the idle bat-symbol.
gochi image "$BAT_IMG" >/dev/null

echo "bat-signal sent: $MSG"
