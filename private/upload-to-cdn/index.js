#!/usr/bin/env node
// Upload Uppy releases to tlcdn.com (CDN). Copyright (c) 2018, Transloadit Ltd.
//
// This file:
//
//  - Assumes EDGLY_KEY and EDGLY_SECRET are available (e.g. set via Travis secrets)
//  - Assumes a fully built uppy is in root dir (unless a specific tag was specified, then it's fetched from npm)
//  - Collects dist/ files that would be in an npm package release, and uploads to
//    eg. https://releases.transloadit.com/uppy/v1.0.1/uppy.css
//  - Uses local package by default, if [version] argument was specified, takes package from npm
//
// Run as:
//
//  yarn uploadcdn <package-name> [version]
//
// To override an existing release (DANGER!)
//
//  yarn uploadcdn <package-name> [version] -- --force
//
// Authors:
//
//  - Kevin van Zonneveld <kevin@transloadit.com>

const path = require('node:path')
const { pipeline, finished } = require('node:stream/promises')
const { readFile } = require('node:fs/promises')
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

const packlist = require('npm-packlist')
const tar = require('tar')
const pacote = require('pacote')
const concat = require('concat-stream')
const mime = require('mime-types')
const AdmZip = require('adm-zip')

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const AWS_REGION = 'us-east-1'
const AWS_BUCKET = 'releases.transloadit.com'

/**
 * Get remote dist/ files by fetching the tarball for the given version
from npm and filtering it down to package/dist/ files.
 *
 * @param {string} packageName eg. @uppy/robodog
 * @param {string} version eg. 1.8.0
 * @returns a Map<string, Buffer>, filename → content
 */
async function getRemoteDistFiles (packageName, version) {
  const package = `${packageName}@${version}`
  console.log('Using npm package', package)
  const files = new Map()
  const tarball = await pacote.tarball.stream(package, stream => pipeline(stream, new tar.Parse()))

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
 * @param {string} packageName Name of package, eg. @uppy/locales
 * @returns a Map<string, Buffer>, filename → content
 */
async function getLocalDistFiles (packageName) {
  // Base file path of the package, eg. ./packages/@uppy/locales
  const packagePath = path.join(__dirname, '..', '..', 'packages', packageName)

  console.log('Making local package from', packagePath)

  const prefix = 'dist'

  const files = (await packlist({ path: packagePath }))
    .flatMap((f) => {
      const prefixSlash = `${prefix}/`

      if (f.startsWith(prefixSlash)) {
        const name = f.split(prefixSlash)[1]
        if (name.length > 0) {
          return [name]
        }
      }
      return []
    })

  const entries = await Promise.all(
    files.map(async (f) => [
      f,
      await readFile(path.join(packagePath, prefix, f)),
    ]),
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
  if (version?.startsWith('-')) version = undefined // eslint-disable-line no-param-reassign

  const s3Client = new S3Client({
    credentials: {
      accessKeyId: process.env.EDGLY_KEY,
      secretAccessKey: process.env.EDGLY_SECRET,
    },
    region: AWS_REGION,
  })

  const remote = !!version

  console.log('Using', remote ? 'Remote' : 'Local', 'build')
  if (!remote) {
    // eslint-disable-next-line import/no-dynamic-require, global-require, no-param-reassign
    version = require(`../../packages/${packageName}/package.json`).version
  }

  // Warn if uploading a local build not from CI:
  // - If we're on CI, this should be a release commit.
  // - If we're local, normally we should upload a released version, not a local build.
  if (!remote && !process.env.CI) {
    console.log('Warning, writing a local build to the CDN, this is usually not what you want. Sleeping 3s. Press CTRL+C!')
    await delay(3000)
  }

  // uppy → releases/uppy/
  // @uppy/robodog → releases/uppy/robodog/
  // @uppy/locales → releases/uppy/locales/
  const dirName = packageName.startsWith('@uppy/')
    ? packageName.replace(/^@/, '')
    : 'uppy'

  const s3Dir = path.posix.join(dirName, `v${version}`)

  const { Contents: existing } = await s3Client.send(new ListObjectsV2Command({
    Bucket: AWS_BUCKET,
    Prefix: s3Dir,
  }))

  if (existing?.length > 0) {
    if (process.argv.includes('--force')) {
      console.warn(`WARN Release files for ${dirName} v${version} already exist, overwriting...`)
    } else {
      console.error(`Release files for ${dirName} v${version} already exist, exiting...`)
      process.exit(1)
    }
  }

  const files = remote
    ? await getRemoteDistFiles(packageName, version)
    : await getLocalDistFiles(packageName)

  if (packageName === 'uppy') {
    console.log('Creating downloadable zip archive')

    const zip = new AdmZip()
    for (const [filename, buffer] of files.entries()) {
      zip.addFile(filename, buffer)
    }

    files.set(`uppy-v${version}.zip`, zip.toBuffer())
  }

  if (files.size === 0) console.warn('No files to upload')

  for (const [filename, buffer] of files.entries()) {
    const key = path.posix.join(s3Dir, filename)
    console.log(`pushing s3://${AWS_BUCKET}/${key}`)
    await s3Client.send(new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
      ContentType: mime.lookup(filename),
      Body: buffer,
    }))
  }
}

main(...process.argv.slice(2)).catch((err) => {
  console.error(err)
  process.exit(1)
})
