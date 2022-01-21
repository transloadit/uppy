#!/usr/bin/env bash

if [ ! -f ./env.sh ]; then
  # For local e2e development
  . ../../env.sh
  echo 'Loaded local env file'
else
  # In CI we inject the env variables without a script
  echo 'No local env file found'
fi

# relative from e2e/package.json
env \
  COMPANION_DATADIR="./servers/output" \
  COMPANION_DOMAIN="localhost:3020" \
  COMPANION_PROTOCOL="http" \
  COMPANION_PORT=3020 \
  COMPANION_CLIENT_ORIGINS="" \
  COMPANION_SECRET="end-to-end" \
node ../packages/@uppy/companion/src/standalone/start-server.js
