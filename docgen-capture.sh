#!/bin/bash
REPO="/Users/eliranshlomov/Desktop/חיתוםֿ/policy-underwriting-wireframes"
SCRATCH="/private/tmp/claude-501/-Applications/c9df270c-8cd3-444f-a33e-ec62a8672153/scratchpad"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$SCRATCH/shots"
# ensure server up
if ! curl -s -o /dev/null "http://localhost:8777/docgen.html"; then
  (cd "$REPO" && python3 -m http.server 8777 >/tmp/apexsrv.log 2>&1 &) ; sleep 1
fi
i=0
while IFS= read -r st; do
  [ -z "$st" ] && continue
  i=$((i+1))
  PROF="$SCRATCH/cprof-$st"
  rm -rf "$PROF"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-extensions \
    --user-data-dir="$PROF" --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 \
    --virtual-time-budget=2000 --timeout=8000 \
    --screenshot="$SCRATCH/shots/$st.png" "http://localhost:8777/docgen.html?state=$st" >/dev/null 2>&1 &
  pid=$!
  ( sleep 14; kill -9 $pid >/dev/null 2>&1 ) & wd=$!
  wait $pid 2>/dev/null
  kill $wd >/dev/null 2>&1
  rm -rf "$PROF"
  sz=$(stat -f%z "$SCRATCH/shots/$st.png" 2>/dev/null || echo 0)
  echo "[$i] $st -> $((sz/1000))k"
done < "$SCRATCH/states.txt"
echo "ALL-DONE"
