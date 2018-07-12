const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { exec } = require('child_process')
const YAML = require('js-yaml')
const { promisify } = require('util')
const gzipSize = require('gzip-size')
const bytes = require('pretty-bytes')
const browserify = require('browserify')

const webRoot = __dirname
const uppyRoot = path.join(__dirname, '../packages/uppy')

const configPath = path.join(webRoot, '/themes/uppy/_config.yml')
const { version } = require(path.join(uppyRoot, '/package.json'))

const defaultConfig = {
  comment: 'Auto updated by update.js',
  uppy_version_anchor: '001',
  uppy_version: '0.0.1',
  uppy_bundle_kb_sizes: {},
  config: {}
}

// Keeping a whitelist so utils etc are excluded
// It may be easier to maintain a blacklist instead
const packages = [
  'uppy',
  '@uppy/core',
  '@uppy/dashboard',
  '@uppy/drag-drop',
  '@uppy/file-input',
  '@uppy/webcam',
  '@uppy/dropbox',
  '@uppy/google-drive',
  '@uppy/instagram',
  '@uppy/url',
  '@uppy/tus',
  '@uppy/xhr-upload',
  '@uppy/aws-s3',
  '@uppy/aws-s3-multipart',
  '@uppy/status-bar',
  '@uppy/progress-bar',
  '@uppy/informer',
  '@uppy/transloadit',
  '@uppy/form',
  '@uppy/golden-retriever',
  '@uppy/react',
  '@uppy/store-default',
  '@uppy/store-redux'
]

const excludes = {
  '@uppy/react': ['react']
}

update().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function getMinifiedSize (pkg, name) {
  const b = browserify(pkg)
  if (name !== '@uppy/core' && name !== 'uppy') {
    b.exclude('@uppy/core')
  }
  if (excludes[name]) {
    b.exclude(excludes[name])
  }
  b.plugin('tinyify')

  const bundle = await promisify(b.bundle).call(b)
  const gzipped = await gzipSize(bundle)

  return {
    minified: bundle.length,
    gzipped
  }
}

async function updateSizes (config) {
  console.info(chalk.grey('Generating bundle sizes…'))
  const padTarget = packages.reduce((max, cur) => Math.max(max, cur.length), 0) + 2

  const sizesPromise = Promise.all(
    packages.map(async (pkg) => {
      const result = await getMinifiedSize(path.join(__dirname, '../packages', pkg), pkg)
      console.info(chalk.green(
        // ✓ @uppy/pkgname:     10.0 kB min  / 2.0 kB gz
        `  ✓ ${pkg}: ${' '.repeat(padTarget - pkg.length)}` +
        `${bytes(result.minified)} min`.padEnd(10) +
        ` / ${bytes(result.gzipped)} gz`
      ))
      return Object.assign(result, {
        prettyMinified: bytes(result.minified),
        prettyGzipped: bytes(result.gzipped)
      })
    })
  ).then((list) => {
    const map = {}
    list.forEach((size, i) => {
      map[packages[i]] = size
    })
    return map
  })

  config.uppy_bundle_kb_sizes = await sizesPromise
}

async function injectBuiltFiles () {
  const cmds = [
    `mkdir -p ${path.join(webRoot, '/themes/uppy/source/uppy')}`,
    `cp -vfR ${path.join(uppyRoot, '/dist/*')} ${path.join(webRoot, '/themes/uppy/source/uppy/')}`
  ].join(' && ')

  const { stdout } = await promisify(exec)(cmds)
  stdout.trim().split('\n').forEach(function (line) {
    console.info(chalk.green('✓ injected: '), chalk.grey(line))
  })
}

async function update () {
  const buf = await promisify(fs.readFile)(configPath, 'utf8')
  const config = YAML.safeLoad(buf)

  config.uppy_version = version
  config.uppy_version_anchor = version.replace(/[^\d]+/g, '')
  await updateSizes(config)

  const saveConfig = Object.assign({}, defaultConfig, config)
  await promisify(fs.writeFile)(configPath, YAML.safeDump(saveConfig), 'utf-8')
  console.info(chalk.green('✓ rewritten: '), chalk.grey(configPath))

  try {
    await injectBuiltFiles()
  } catch (error) {
    console.error(
      chalk.red('x failed to inject: '),
      chalk.grey('uppy bundle into site, because: ' + error)
    )
    process.exit(1)
  }
}
