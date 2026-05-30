#!/usr/bin/env bash
# bat-mode.sh — turn the gochi into a Bat-signal.
#
# Idle: bat silhouette on the OLED.
# Shake: firmware flips to angry/sad → we scroll "GOTHAM NEEDS YOU".
# Idle ticker: every ~25s, a random Gotham PD alert scrolls across.
set -euo pipefail

BAT_IMG="$(cd "$(dirname "$0")" && pwd)/assets/bat.png"

ALERTS=(
  "RIDDLER SPOTTED IN NARROWS"
  "PENGUIN AT IRON HEIGHTS"
  "JOKER ESCAPED ARKHAM"
  "TWO-FACE ROBBING GOTHAM BANK"
  "BANE NEAR ACE CHEMICAL"
  "CATWOMAN AT THE MUSEUM"
  "POISON IVY IN ROBINSON PARK"
  "SCARECROW SIGHTED DOCKSIDE"
)

ALERT_HOLD_S=4
SHAKE_HOLD_S=5
TICKER_INTERVAL_S=25
POLL_S=0.25

show_bat() { gochi image "$BAT_IMG" >/dev/null; }
get_expr() { gochi get state 2>/dev/null | sed -n 's/.*"expr":"\([^"]*\)".*/\1/p'; }

trap 'echo "exiting bat-mode"; exit 0' INT TERM

show_bat
last_alert=$(date +%s)
last_expr="neutral"

while true; do
  expr=$(get_expr || echo "")
  if [[ -n "$expr" && "$expr" != "$last_expr" ]]; then
    if [[ "$expr" == "angry" || "$expr" == "sad" ]]; then
      echo "[bat-signal] $(date +%H:%M:%S) shake detected (expr=$expr)"
      gochi text "GOTHAM NEEDS YOU" >/dev/null
      sleep "$SHAKE_HOLD_S"
      show_bat
      last_alert=$(date +%s)
    fi
    last_expr="$expr"
  fi

  now=$(date +%s)
  if (( now - last_alert >= TICKER_INTERVAL_S )); then
    msg="${ALERTS[RANDOM % ${#ALERTS[@]}]}"
    echo "[batcomputer] $(date +%H:%M:%S) $msg"
    gochi text "$msg" >/dev/null
    sleep "$ALERT_HOLD_S"
    show_bat
    last_alert=$(date +%s)
    last_expr="text"
  fi

  sleep "$POLL_S"
done
