const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { exec } = require('child_process')
const YAML = require('js-yaml')
const { promisify } = require('util')
const gzipSize = require('gzip-size')
const bytes = require('pretty-bytes')
const browserify = require('browserify')
const touch = require('touch')
const glob = require('glob')
const LocaleCode = require('locale-code')

const webRoot = __dirname
const uppyRoot = path.join(__dirname, '../packages/uppy')
const robodogRoot = path.join(__dirname, '../packages/@uppy/robodog')
const localesRoot = path.join(__dirname, '../packages/@uppy/locales')

const configPath = path.join(webRoot, '/themes/uppy/_config.yml')
const { version } = require(path.join(uppyRoot, '/package.json'))

const defaultConfig = {
  comment: 'Auto updated by inject.js',
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
  '@uppy/thumbnail-generator',
  '@uppy/store-default',
  '@uppy/store-redux'
]

const excludes = {
  '@uppy/react': ['react']
}

inject().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function getMinifiedSize (pkg, name) {
  const b = browserify(pkg)

  const packageJSON = fs.readFileSync(path.join(pkg, 'package.json'))
  const version = JSON.parse(packageJSON).version

  if (name !== '@uppy/core' && name !== 'uppy') {
    b.exclude('@uppy/core')
    // Already unconditionally included through @uppy/core
    b.exclude('preact')
  }
  if (excludes[name]) {
    b.exclude(excludes[name])
  }
  b.plugin('tinyify')

  const bundle = await promisify(b.bundle).call(b)
  const gzipped = await gzipSize(bundle)

  return {
    minified: bundle.length,
    gzipped,
    version
  }
}

async function injectSizes (config) {
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

async function injectBundles () {
  const cmds = [
    `mkdir -p ${path.join(webRoot, '/themes/uppy/source/uppy')}`,
    `mkdir -p ${path.join(webRoot, '/themes/uppy/source/uppy/locales')}`,
    `cp -vfR ${path.join(uppyRoot, '/dist/*')} ${path.join(webRoot, '/themes/uppy/source/uppy/')}`,
    `cp -vfR ${path.join(robodogRoot, '/dist/*')} ${path.join(webRoot, '/themes/uppy/source/uppy/')}`,
    `cp -vfR ${path.join(localesRoot, '/dist/*')} ${path.join(webRoot, '/themes/uppy/source/uppy/locales')}`
  ].join(' && ')

  const { stdout } = await promisify(exec)(cmds)
  stdout.trim().split('\n').forEach(function (line) {
    console.info(chalk.green('✓ injected: '), chalk.grey(line))
  })
}

// re-enable after rate limiter issue is fixed
//
async function injectGhStars () {
  const opts = {}
  if ('GITHUB_TOKEN' in process.env) {
    opts.auth = process.env.GITHUB_TOKEN
  }

  const Octokit = require('@octokit/rest')
  const octokit = new Octokit(opts)

  const { headers, data } = await octokit.repos.get({
    owner: 'transloadit',
    repo: 'uppy'
  })

  console.log(`${headers['x-ratelimit-remaining']} requests remaining until we hit GitHub ratelimiter`)

  const dstpath = path.join(webRoot, 'themes', 'uppy', 'layout', 'partials', 'generated_stargazers.ejs')
  fs.writeFileSync(dstpath, data.stargazers_count, 'utf-8')

  console.log(`${data.stargazers_count} stargazers written to '${dstpath}'`)
}

async function injectMarkdown () {
  const sources = {
    '.github/ISSUE_TEMPLATE/integration_help.md': 'src/_template/integration_help.md',
    '.github/CONTRIBUTING.md': 'src/_template/contributing.md'
  }

  for (const src in sources) {
    const dst = sources[src]
    // strip yaml frontmatter:
    const srcpath = path.join(uppyRoot, `/../../${src}`)
    const dstpath = path.join(webRoot, dst)
    const parts = fs.readFileSync(srcpath, 'utf-8').split(/---\s*\n/)
    if (parts.length >= 3) {
      parts.shift()
      parts.shift()
    }
    let content = `<!-- WARNING! This file was injected. Please edit in "${src}" instead and run "${path.basename(__filename)}" -->\n\n`
    content += parts.join('---\n')
    fs.writeFileSync(dstpath, content, 'utf-8')
    console.info(chalk.green('✓ injected: '), chalk.grey(srcpath))
  }
  touch(path.join(webRoot, '/src/support.md'))
}

function injectLocaleList () {
  const mdTable = [
    `<!-- WARNING! This file was automatically injected. Please run "${path.basename(__filename)}" to re-generate -->\n\n`,
    '| %count% Locales | NPM                | CDN                 | Source on GitHub |',
    '| --------------- | ------------------ | ------------------- | ---------------- |'
  ]
  const mdRows = []
  const localeList = {}

  const localePackagePath = path.join(localesRoot, 'src', '*.js')
  const localePackageVersion = require(path.join(localesRoot, 'package.json')).version

  glob.sync(localePackagePath).forEach((localePath) => {
    const localeName = path.basename(localePath, '.js')
    // we renamed the es_GL → gl_ES locale, and kept the old name
    // for backwards-compat, see https://github.com/transloadit/uppy/pull/1929
    if (localeName === 'es_GL') return
    let localeNameWithDash = localeName.replace(/_/g, '-')

    const parts = localeNameWithDash.split('-')
    let variant = ''
    if (parts.length > 2) {
      const lang = parts.shift()
      const country = parts.shift()
      variant = parts.join(', ')
      localeNameWithDash = `${lang}-${country}`
    }

    const languageName = LocaleCode.getLanguageName(localeNameWithDash)
    const countryName = LocaleCode.getCountryName(localeNameWithDash)
    const npmPath = `<code class="raw"><a href="https://www.npmjs.com/package/@uppy/locales">@uppy/locales</a>/lib/${localeName}</code>`
    const cdnPath = `[\`${localeName}.min.js\`](https://transloadit.edgly.net/releases/uppy/locales/v${localePackageVersion}/${localeName}.min.js)`
    const githubSource = `[\`${localeName}.js\`](https://github.com/transloadit/uppy/blob/master/packages/%40uppy/locales/src/${localeName}.js)`
    const mdTableRow = `| ${languageName}<br/> <small>${countryName}</small>${variant ? `<br /><small>(${variant})</small>` : ''} | ${npmPath} | ${cdnPath} | ✏️ ${githubSource} |`
    mdRows.push(mdTableRow)

    localeList[localeName] = `${languageName} (${countryName}${variant ? ` ${variant}` : ''})`
  })

  const resultingMdTable = mdTable.concat(mdRows.sort()).join('\n').replace('%count%', mdRows.length)

  const dstpath = path.join(webRoot, 'src', '_template', 'list_of_locale_packs.md')
  const localeListDstPath = path.join(webRoot, 'src', 'examples', 'locale_list.json')
  fs.writeFileSync(dstpath, resultingMdTable, 'utf-8')
  console.info(chalk.green('✓ injected: '), chalk.grey(dstpath))
  fs.writeFileSync(localeListDstPath, JSON.stringify(localeList), 'utf-8')
  console.info(chalk.green('✓ injected: '), chalk.grey(localeListDstPath))
}

async function readConfig () {
  try {
    const buf = await promisify(fs.readFile)(configPath, 'utf8')
    return YAML.safeLoad(buf)
  } catch (err) {
    return {}
  }
}

async function inject () {
  const config = await readConfig()

  await injectGhStars()

  await injectMarkdown()

  injectLocaleList()

  config.uppy_version = version
  config.uppy_version_anchor = version.replace(/[^\d]+/g, '')
  await injectSizes(config)

  const saveConfig = Object.assign({}, defaultConfig, config)
  await promisify(fs.writeFile)(configPath, YAML.safeDump(saveConfig), 'utf-8')
  console.info(chalk.green('✓ rewritten: '), chalk.grey(configPath))

  try {
    await injectBundles()
  } catch (error) {
    console.error(
      chalk.red('x failed to inject: '),
      chalk.grey('uppy bundle into site, because: ' + error)
    )
    process.exit(1)
  }
}
