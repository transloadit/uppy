#!/usr/bin/env node
// Upload Uppy releases to Edgly.net CDN. Copyright (c) 2018, Transloadit Ltd.
//
// This file:
//
//  - Assumes EDGLY_KEY and EDGLY_SECRET are available (e.g. set via Travis secrets)
//  - Tries to load env.sh instead, if not
//  - Checks if a tag is being built (on Travis - otherwise opts to continue execution regardless)
//  - Assumed a fully built uppy is in root dir (unless a specific tag was specified, then it's fetched from npm)
//  - Runs npm pack, and stores files to e.g. https://transloadit.edgly.net/releases/uppy/v1.0.1/uppy.css
//  - Uses local package by default, if [version] argument was specified, takes package from npm
//
// Run as:
//
//  ./upload-to-cdn.sh [version]
//
// To upload all versions in one go (DANGER):
//
//  git tag |awk -Fv '{print "./bin/upload-to-cdn.sh "$2}' |bash
//
// Authors:
//
//  - Kevin van Zonneveld <kevin@transloadit.com>

const path = require('path')
const AWS = require('aws-sdk')
const packlist = require('npm-packlist')
const tar = require('tar')
const pacote = require('pacote')
const tempy = require('tempy')

async function loadRemoteDist (packageName, version) {
  const tarball = pacote.tarball.stream(`${packageName}@${version}`)
    .pipe(tar.Parse())
  tarball.on('entry', (readEntry) => {
  })
  await finished(tarball)
}

async function main (packageName, version) {
  if (!packageName) {
    console.error('usage: upload-to-cdn <packagename> [version]')
    console.error('Must provide a package name')
    process.exit(1)
  }

  const remote = !!version
  if (!remote) {
    version = require(`../packages/${packageName}/package.json`).version
  }

  const packagePath = remote
    ? `${packageName}@${version}`
    : path.join(__dirname, '..', 'packages', packageName)
  const temporaryPath = tempy.directory()

  const proc = spawn('npm', ['pack', packagePath], {
    cwd: temporaryPath,
    stdio: 'inherit'
  })

  const code = await once(proc, 'exit')
  if (code !== 0) {
    console.error('packing failed')
    process.exit(1)
  }
}

main(...process.argv.slice(2)).catch((err) => {
  console.error(err.stack)
  process.exit(1)
})
