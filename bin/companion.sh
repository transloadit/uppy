#!/usr/bin/env bash

# Load local env vars. In CI, these are injected.
if [ -f .env ]; then
  # https://gist.github.com/mihow/9c7f559807069a03e302605691f85572?permalink_comment_id=3625310#gistcomment-3625310
  set -a
  source <(cat .env | sed -e '/^#/d;/^\s*$/d' -e "s/'/'\\\''/g" -e "s/=\(.*\)/='\1'/g")
  set +a
else
  env \
  COMPANION_DATADIR="./output" \
  COMPANION_DOMAIN="localhost:3020" \
  COMPANION_PROTOCOL="http" \
  COMPANION_PORT=3020 \
  COMPANION_CLIENT_ORIGINS="" \
  COMPANION_SECRET="development"
fi

nodemon --watch packages/@uppy/companion/src --exec node ./packages/@uppy/companion/src/standalone/start-server.js
