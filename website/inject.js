const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const { spawn } = require('child_process')
const readline = require('readline')
const YAML = require('js-yaml')
const { promisify } = require('util')
const gzipSize = require('gzip-size')
const prettierBytes = require('@transloadit/prettier-bytes')
const browserify = require('browserify')
const touch = require('touch')
const glob = require('glob')
const { minify } = require('terser')

const webRoot = __dirname
const uppyRoot = path.join(__dirname, '../packages/uppy')
const robodogRoot = path.join(__dirname, '../packages/@uppy/robodog')
const localesRoot = path.join(__dirname, '../packages/@uppy/locales')

const configPath = path.join(webRoot, '/themes/uppy/_config.yml')
const { version } = require(path.join(uppyRoot, '/package.json'))

const regionalDisplayNames = new Intl.DisplayNames('en-US', { type: 'region' })
const languageDisplayNames = new Intl.DisplayNames('en-US', { type: 'language' })

const defaultConfig = {
  comment: 'Auto updated by inject.js',
  uppy_version_anchor: '001',
  uppy_version: '0.0.1',
  uppy_bundle_kb_sizes: {},
  config: {},
}

// Keeping a whitelist so utils etc are excluded
// It may be easier to maintain a blacklist instead
const packages = [
  // Bundles
  'uppy',
  '@uppy/robodog',
  // Integrations
  '@uppy/react',
  // Core
  '@uppy/core',
  // Plugins -- please keep these sorted alphabetically
  '@uppy/aws-s3',
  '@uppy/aws-s3-multipart',
  '@uppy/dashboard',
  '@uppy/drag-drop',
  '@uppy/dropbox',
  '@uppy/file-input',
  '@uppy/form',
  '@uppy/golden-retriever',
  '@uppy/google-drive',
  '@uppy/informer',
  '@uppy/instagram',
  '@uppy/image-editor',
  '@uppy/progress-bar',
  '@uppy/screen-capture',
  '@uppy/status-bar',
  '@uppy/thumbnail-generator',
  '@uppy/transloadit',
  '@uppy/tus',
  '@uppy/url',
  '@uppy/webcam',
  '@uppy/xhr-upload',
  '@uppy/drop-target',
  // Stores
  '@uppy/store-default',
  '@uppy/store-redux',
]

const excludes = {
  '@uppy/react': ['react'],
}

inject().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function getMinifiedSize (pkg, name) {
  const b = browserify(pkg)

  const packageJSON = fs.readFileSync(path.join(pkg, 'package.json'))
  const { version } = JSON.parse(packageJSON)

  if (name !== '@uppy/core' && name !== 'uppy') {
    b.exclude('@uppy/core')
    // Already unconditionally included through @uppy/core
    b.exclude('preact')
  }
  if (excludes[name]) {
    b.exclude(excludes[name])
  }

  const { code:bundle } = await promisify(b.bundle).call(b).then(buf => minify(buf.toString(), { toplevel: true }))
  const gzipped = await gzipSize(bundle)

  return {
    minified: bundle.length,
    gzipped,
    version,
  }
}

async function injectSizes (config) {
  console.info(chalk.grey('Generating bundle sizes…'))
  const padTarget = Math.max(...packages.map((cur) => cur.length)) + 2

  const sizesPromise = Promise.all(
    packages.map(async (pkg) => {
      const result = await getMinifiedSize(path.join(__dirname, '../packages', pkg), pkg)
      console.info(chalk.green(
        // ✓ @uppy/pkgname:     10.0 kB min  / 2.0 kB gz
        `  ✓ ${pkg}: ${' '.repeat(padTarget - pkg.length)}${
          `${prettierBytes(result.minified)} min`.padEnd(10)
        } / ${prettierBytes(result.gzipped)} gz`
      ))
      return [pkg, {
        ...result,
        prettyMinified: prettierBytes(result.minified),
        prettyGzipped: prettierBytes(result.gzipped),
      }]
    })
  ).then(Object.fromEntries)

  config.uppy_bundle_kb_sizes = await sizesPromise
}

const sourceUppy = path.join(webRoot, '/themes/uppy/source/uppy/')
const sourceUppyLocales = path.join(sourceUppy, 'locales')
async function injectBundles () {
  await Promise.all([
    fs.promises.mkdir(sourceUppy, { recursive:true }),
    fs.promises.mkdir(sourceUppyLocales, { recursive:true }),
  ])
  const cmds = [
    `cp -vfR ${path.join(uppyRoot, '/dist/*')} ${sourceUppy}`,
    `cp -vfR ${path.join(robodogRoot, '/dist/*')} ${sourceUppy}`,
    `cp -vfR ${path.join(localesRoot, '/dist/*')} ${sourceUppyLocales}`,
  ].join(' && ')

  const cp = spawn(cmds, { stdio:['ignore', 'pipe', 'inherit'], shell: true })
  await Promise.race([
    new Promise((resolve, reject) => cp.on('error', reject)),
    (async () => {
      const stdout = readline.createInterface({
        input: cp.stdout,
      })

      for await (const line of stdout) {
        console.info(chalk.green('✓ injected: '), chalk.grey(line))
      }
    })(),
  ])
}

// re-enable after rate limiter issue is fixed
//
async function injectGhStars () {
  const opts = {}
  if ('GITHUB_TOKEN' in process.env) {
    opts.auth = process.env.GITHUB_TOKEN
  }

  const { Octokit } = require('@octokit/rest')
  const octokit = new Octokit(opts)

  const { headers, data } = await octokit.repos.get({
    owner: 'transloadit',
    repo: 'uppy',
  })

  console.log(`${headers['x-ratelimit-remaining']} requests remaining until we hit GitHub ratelimiter`)

  const dstpath = path.join(webRoot, 'themes', 'uppy', 'layout', 'partials', 'generated_stargazers.ejs')
  fs.writeFileSync(dstpath, String(data.stargazers_count), 'utf-8')

  console.log(`${data.stargazers_count} stargazers written to '${dstpath}'`)
}

async function injectMarkdown () {
  const sources = {
    '.github/ISSUE_TEMPLATE/integration_help.md': 'src/_template/integration_help.md',
    '.github/CONTRIBUTING.md': 'src/_template/contributing.md',
  }

  for (const src of Object.keys(sources)) {
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
    '| --------------- | ------------------ | ------------------- | ---------------- |',
  ]
  const mdRows = []
  const localeList = {}

  const localePackagePath = path.join(localesRoot, 'src', '*.js')
  const localePackageVersion = require(path.join(localesRoot, 'package.json')).version

  glob.sync(localePackagePath).forEach((localePath) => {
    const localeName = path.basename(localePath, '.js')
    const [languageCode, regionCode, variant] = localeName.split(/[-_]/)

    const languageName = languageDisplayNames.of(languageCode)
    const regionName = regionalDisplayNames.of(regionCode)
    const npmPath = `<code class="raw"><a href="https://www.npmjs.com/package/@uppy/locales">@uppy/locales</a>/lib/${localeName}</code>`
    const cdnPath = `[\`${localeName}.min.js\`](https://releases.transloadit.com/uppy/locales/v${localePackageVersion}/${localeName}.min.js)`
    const githubSource = `[\`${localeName}.js\`](https://github.com/transloadit/uppy/blob/master/packages/%40uppy/locales/src/${localeName}.js)`
    const mdTableRow = `| ${languageName}<br/> <small>${regionName}</small>${variant ? `<br /><small>(${variant})</small>` : ''} | ${npmPath} | ${cdnPath} | ✏️ ${githubSource} |`
    mdRows.push(mdTableRow)

    localeList[localeName] = `${languageName} (${regionName}${variant ? `, ${variant}` : ''})`
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
    const buf = await fs.promises.readFile(configPath, 'utf8')
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

  const saveConfig = { ...defaultConfig, ...config }
  await fs.promises.writeFile(configPath, YAML.safeDump(saveConfig), 'utf-8')
  console.info(chalk.green('✓ rewritten: '), chalk.grey(configPath))

  try {
    await injectBundles()
  } catch (error) {
    console.error(
      chalk.red('x failed to inject: '),
      chalk.grey(`uppy bundle into site, because: ${error}`)
    )
    process.exit(1)
  }
}
