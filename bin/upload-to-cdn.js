#!/usr/bin/env node
// Upload Uppy releases to Edgly.net CDN. Copyright (c) 2018, Transloadit Ltd.
//
// This file:
//
//  - Assumes EDGLY_KEY and EDGLY_SECRET are available (e.g. set via Travis secrets)
//  - Assumes a fully built uppy is in root dir (unless a specific tag was specified, then it's fetched from npm)
//  - Collects dist/ files that would be in an npm package release, and uploads to eg. https://transloadit.edgly.net/releases/uppy/v1.0.1/uppy.css
//  - Uses local package by default, if [version] argument was specified, takes package from npm
//
// Run as:
//
//  npm run uploadcdn <package-name> [version]
//
// To override an existing release (DANGER!)
//
//  npm run uploadcdn <package-name> [version] -- --force
//
// Authors:
//
//  - Kevin van Zonneveld <kevin@transloadit.com>

const path = require('path')
const AWS = require('aws-sdk')
const packlist = require('npm-packlist')
const tar = require('tar')
const pacote = require('pacote')
const concat = require('concat-stream')
const mime = require('mime-types')
const { promisify } = require('util')
const readFile = promisify(require('fs').readFile)
const finished = promisify(require('stream').finished)
const AdmZip = require('adm-zip')

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const AWS_REGION = 'us-east-1'
const AWS_BUCKET = 'crates.edgly.net'
const AWS_DIRECTORY = '756b8efaed084669b02cb99d4540d81f/default'

/**
 * Get remote dist/ files by fetching the tarball for the given version
from npm and filtering it down to package/dist/ files.
 *
 * @param {string} packageName eg. @uppy/robodog
 * @param {string} version eg. 1.8.0
 * @returns a Map<string, Buffer>, filename → content
 */
async function getRemoteDistFiles (packageName, version) {
  const files = new Map()
  const tarball = pacote.tarball.stream(`${packageName}@${version}`)
    .pipe(new tar.Parse())

  tarball.on('entry', (readEntry) => {
    if (readEntry.path.startsWith('package/dist/')) {
      readEntry
        .pipe(concat((buf) => {
          files.set(readEntry.path.replace(/^package\/dist\//, ''), buf)
        }))
        .on('error', (err) => {
          tarball.emit('error', err)
        })
    } else {
      readEntry.resume()
    }
  })

  await finished(tarball)
  return files
}

/**
 * Get local dist/ files by asking npm-packlist what files would be added
 * to an npm package during publish, and filtering those down to just dist/ files.
 *
 * @param {string} packagePath Base file path of the package, eg. ./packages/@uppy/locales
 * @returns a Map<string, Buffer>, filename → content
 */
async function getLocalDistFiles (packagePath) {
  const files = (await packlist({ path: packagePath }))
    .filter(f => f.startsWith('dist/'))
    .map(f => f.replace(/^dist\//, ''))

  const entries = await Promise.all(
    files.map(async (f) => [
      f,
      await readFile(path.join(packagePath, 'dist', f))
    ])
  )

  return new Map(entries)
}

async function main (packageName, version) {
  if (!packageName) {
    console.error('usage: upload-to-cdn <packagename> [version]')
    console.error('Must provide a package name')
    process.exit(1)
  }

  if (!process.env.EDGLY_KEY || !process.env.EDGLY_SECRET) {
    console.error('Missing EDGLY_KEY or EDGLY_SECRET env variables, bailing')
    process.exit(1)
  }

  // version should only be a positional arg and semver string
  // this deals with usage like `npm run uploadcdn uppy -- --force`
  // where we force push a local build
  if (version && version.startsWith('-')) version = undefined

  const s3 = new AWS.S3({
    credentials: new AWS.Credentials({
      accessKeyId: process.env.EDGLY_KEY,
      secretAccessKey: process.env.EDGLY_SECRET
    }),
    region: AWS_REGION
  })

  const remote = !!version
  if (!remote) {
    version = require(`../packages/${packageName}/package.json`).version
  }

  // Warn if uploading a local build not from CI:
  // - If we're on CI, this should be a release commit.
  // - If we're local, normally we should upload a released version, not a local build.
  if (!remote && !process.env.CI) {
    console.log('Warning, writing a local build to the CDN, this is usually not what you want. Sleeping 3s. Press CTRL+C!')
    await delay(3000)
  }

  const packagePath = remote
    ? `${packageName}@${version}`
    : path.join(__dirname, '..', 'packages', packageName)

  // uppy → releases/uppy/
  // @uppy/robodog → releases/uppy/robodog/
  // @uppy/locales → releases/uppy/locales/
  const dirName = packageName.startsWith('@uppy/')
    ? packageName.replace(/^@/, '')
    : 'uppy'

  const outputPath = path.posix.join('releases', dirName, `v${version}`)

  const { Contents: existing } = await s3.listObjects({
    Bucket: AWS_BUCKET,
    Prefix: `${AWS_DIRECTORY}/${outputPath}/`
  }).promise()
  if (existing.length > 0) {
    if (process.argv.includes('--force')) {
      console.warn(`WARN Release files for ${dirName} v${version} already exist, overwriting...`)
    } else {
      console.error(`Release files for ${dirName} v${version} already exist, exiting...`)
      process.exit(1)
    }
  }

  const files = remote
    ? await getRemoteDistFiles(packageName, version)
    : await getLocalDistFiles(packagePath)

  if (packageName === 'uppy') {
    // Create downloadable zip archive
    const zip = new AdmZip()
    for (const [filename, buffer] of files.entries()) {
      zip.addFile(filename, buffer)
    }

    files.set(`uppy-v${version}.zip`, zip.toBuffer())
  }

  for (const [filename, buffer] of files.entries()) {
    const key = path.posix.join(AWS_DIRECTORY, outputPath, filename)
    console.log(`pushing s3://${AWS_BUCKET}/${key}`)
    await s3.putObject({
      Bucket: AWS_BUCKET,
      Key: key,
      ContentType: mime.lookup(filename),
      Body: buffer
    }).promise()
  }
}

main(...process.argv.slice(2)).catch((err) => {
  console.error(err.stack)
  process.exit(1)
})
