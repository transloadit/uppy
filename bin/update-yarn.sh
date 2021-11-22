#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset

CURRENT_VERSION=$(corepack yarn --version)
LAST_VERSION=$(curl \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/yarnpkg/berry/releases?per_page=1 | \
  awk '{ if ($1 == "\"tag_name\":") print $2 }' | \
  sed 's#^"@yarnpkg/cli/##;s#",$##')

[ "$CURRENT_VERSION" = "$LAST_VERSION" ] && \
	echo "Already using latest version." && \
	exit 0

echo "Upgrading to Yarn $LAST_VERSION (from Yarn $CURRENT_VERSION)..."

PLUGINS=$(awk '{ if ($1 == "spec:") print $2 }' .yarnrc.yml)

echo "$PLUGINS" | xargs -n1 -t corepack yarn plugin remove

cp package.json .yarn/cache/tmp.package.json
sed "s#\"yarn\": \"$CURRENT_VERSION\"#\"yarn\": \"$LAST_VERSION\"#;s#\"yarn@$CURRENT_VERSION\"#\"yarn@$LAST_VERSION\"#" .yarn/cache/tmp.package.json > package.json
cp packages/@uppy/companion/package.json .yarn/cache/tmp.package.json
sed "s#\"yarn\": \"$CURRENT_VERSION\"#\"yarn\": \"$LAST_VERSION\"#;s#\"yarn@$CURRENT_VERSION\"#\"yarn@$LAST_VERSION\"#" .yarn/cache/tmp.package.json > packages/@uppy/companion/package.json
rm .yarn/cache/tmp.package.json

echo "$PLUGINS" | xargs -n1 -t corepack yarn plugin import
corepack yarn

git add package.json yarn.lock
git add .yarn/plugins
