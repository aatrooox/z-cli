#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CFG_DIR="$ROOT_DIR/.tmp-smoke-config"
HOME_DIR="$CFG_DIR/home"
API_DIR="$HOME_DIR/Library/Application Support/zzclub-z-cli/api"

rm -rf "$CFG_DIR"
mkdir -p "$API_DIR"

cat >"$API_DIR/echo.json" <<'EOF'
{
  "name": "echo",
  "method": "POST",
  "url": "https://httpbin.org/post",
  "headers": {
    "X-Test": "{{env.TEST_HEADER}}"
  },
  "body": {
    "content": "{{content}}",
    "photos": "{{photos}}"
  }
}
EOF

export HOME="$HOME_DIR"

bun run type-check
bun run build

node "$ROOT_DIR/dist/index.js" api echo \
  --content "hello" \
  --photos '{"a":1}' \
  --env TEST_HEADER=ok \
  --dry-run \
  --verbose

echo "smoke-api ok"
