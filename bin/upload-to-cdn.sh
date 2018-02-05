#!/usr/bin/env bash
# Upload Uppy releases to Edgly.net CDN. Copyright (c) 2018, Transloadit Ltd.
#
# This file:
#
#  - Assumes EDGLY_KEY and EDGLY_SECRET are available (e.g. set via Travis secrets)
#  - Tries to load env.sh instead, if not
#  - Checks if a tag is being built (on Travis - otherwise opts to continue execution regardless)
#  - Installs AWS CLI if needed
#  - Assumed a fully built uppy is in root dir (unless a specific tag was specified, then it's fetched from npm)
#  - Runs npm pack, and stores files to e.g. https://transloadit.edgly.net/releases/uppy/v0.22.2/dist/uppy.css
#  - Uses local package by default, if [version] argument was specified, takes package from npm
#
# Run as:
#
#  ./upload-to-cdn.sh [version]
#
# To upload all versions in one go (DANGER):
#
#  git tag |awk -Fv '{print "./bin/upload-to-cdn.sh "$2}' |bash
#
# Authors:
#
#  - Kevin van Zonneveld <kevin@transloadit.com>
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname "${__dir}")" && pwd)"

function fatal () {
  echo "❌ ${*}";
  exit 1
}

pushd "${__root}" > /dev/null 2>&1
  if [ "${TRAVIS:-}" = "true" ]; then
    if [ "${TRAVIS_PULL_REQUEST:-}" != "false" ]; then
      echo "On Travis (TRAVIS is '${TRAVIS}'), I'm not pushing releases to the CDN for pull requests (TRAVIS_PULL_REQUEST is '${TRAVIS_PULL_REQUEST}')"
      exit 0
    fi
    if [ -z "${TRAVIS_TAG:-}" ]; then
      echo "On Travis (TRAVIS is '${TRAVIS}'), I'm only pushing releases to the CDN when a tag is being built (TRAVIS_TAG is '${TRAVIS_TAG}')"
      exit 0
    fi
  fi

  if [ -z "${EDGLY_KEY:-}" ] && [ -f ./env.sh ]; then
    source ./env.sh
  fi
  [ -z "${EDGLY_KEY:-}" ] && fatal "Unable to find or source EDGLY_KEY env var"

  type aws || pip install --user awscli

  remoteVersion="${1:-}"
  version="${remoteVersion}"
  if [ -z "${remoteVersion}" ]; then
    localVersion=$(node -pe "require('./package.json').version")
    echo "${localVersion}"
    version="${localVersion}"
  fi

  echo -n "--> Check if not overwriting an existing tag ... "
  env \
    AWS_ACCESS_KEY_ID="${EDGLY_KEY}" \
    AWS_SECRET_ACCESS_KEY="${EDGLY_SECRET}" \
  aws s3 ls \
    --region="us-east-1" \
  "s3://crates.edgly.net/756b8efaed084669b02cb99d4540d81f/default/releases/uppy/v${version}/package.json" > /dev/null 2>&1 && fatal "Tag ${version} already exists"
  echo "✅"

  echo "--> Obtain relevant npm files for uppy ${version} ... "
  if [ -z "${remoteVersion}" ]; then
    npm pack || fatal "Unable to fetch "
  else
    npm pack "uppy@${remoteVersion}"
  fi
  echo "✅"
  rm -rf /tmp/uppy-to-edgly
  mkdir -p /tmp/uppy-to-edgly
  cp -af "uppy-${version}.tgz" /tmp/uppy-to-edgly/
  tar zxvf "uppy-${version}.tgz" -C /tmp/uppy-to-edgly/

  echo "--> Upload to edgly.net CDN"
  pushd /tmp/uppy-to-edgly/package
    # --delete \
    env \
      AWS_ACCESS_KEY_ID="${EDGLY_KEY}" \
      AWS_SECRET_ACCESS_KEY="${EDGLY_SECRET}" \
    aws s3 sync \
      --region="us-east-1" \
      --exclude 'website/*' \
      --exclude 'node_modules/*' \
      --exclude 'examples/*/node_modules/*' \
    ./ "s3://crates.edgly.net/756b8efaed084669b02cb99d4540d81f/default/releases/uppy/v${version}"
  popd > /dev/null 2>&1
  rm -rf /tmp/uppy-to-edgly
popd > /dev/null 2>&1
