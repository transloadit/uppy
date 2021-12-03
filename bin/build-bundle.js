const fs = require('fs')
const chalk = require('chalk')
const esbuild = require('esbuild')
const path = require('path')
const glob = require('glob')
const { minify } = require('terser')
const { transformFileAsync } = require('@babel/core')

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

// eslint-disable-next-line no-shadow
function buildBundle (srcFile, bundleFile, { minify = false, standalone = '' } = {}) {
  return esbuild.build({
    bundle: true,
    sourcemap: true,
    entryPoints: [srcFile],
    outfile: bundleFile,
    minify,
  }).then(() => {
    if (minify) {
      console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    } else {
      console.info(chalk.green(`✓ Built Bundle [${standalone}]:`), chalk.magenta(bundleFile))
    }
    return [bundleFile, standalone]
  }).catch(handleErr)
}
async function minifyBundle ([bundleFile, standalone]) {
  const minifiedFilePath = bundleFile.replace(/\.js$/, '.min.js')
  const sourceMapPath = `${minifiedFilePath}.map`
  const js = await fs.promises.readFile(bundleFile, 'utf-8')
  const { code, map } = await minify(js, {
    sourceMap: {
      content: fs.readFileSync(`${bundleFile}.map`, 'utf-8'),
      url:sourceMapPath,
    },
    toplevel: true,
  })
  return Promise.all([
    fs.promises.writeFile(minifiedFilePath, code),
    fs.promises.writeFile(sourceMapPath, map),
  ])
    .then(() => console.info(chalk.green(`✓ Built Minified Bundle [${standalone}]:`), chalk.magenta(minifiedFilePath)))
}
async function transpileDownForIE ([bundleFile, standalone]) {
  const minifiedFilePath = bundleFile.replace(/\.js$/, '.min.js')
  const sourceMapPath = `${minifiedFilePath}.map`
  const { code: js, map: inputMap } = await transformFileAsync(bundleFile, {
    compact: false,
    highlightCode: false,
    inputSourceMap: true,

    browserslistEnv: 'legacy',
    presets: [['@babel/preset-env',  {
      loose: false,
      targets: { ie:11 },
      useBuiltIns: 'entry',
      corejs: { version: '3.19', proposals: true },
    }]],
  })
  const { code, map } = await minify(js, {
    sourceMap: {
      content: inputMap,
      url: sourceMapPath,
    },
    toplevel: true,
  })
  return Promise.all([
    fs.promises.writeFile(bundleFile, js),
    fs.promises.writeFile(`${bundleFile}.map`, JSON.stringify(inputMap)),
    fs.promises.writeFile(minifiedFilePath, code),
    fs.promises.writeFile(sourceMapPath, map),
  ]).then(() => {
    console.info(chalk.green(`✓ Built Bundle [${standalone} (ES5)]:`), chalk.magenta(bundleFile))
    console.info(chalk.green(`✓ Built Minified Bundle [${standalone} (ES5)]:`), chalk.magenta(minifiedFilePath))
  })
}

fs.mkdirSync('./packages/uppy/dist', { recursive: true })
fs.mkdirSync('./packages/@uppy/robodog/dist', { recursive: true })
fs.mkdirSync('./packages/@uppy/locales/dist', { recursive: true })

const methods = [
  buildBundle(
    './packages/uppy/index.js',
    './packages/uppy/dist/uppy.js',
    { standalone: 'Uppy' },
  ).then(minifyBundle),
  buildBundle(
    './packages/uppy/bundle.js',
    './packages/uppy/dist/uppy.legacy.js',
    { standalone: 'Uppy (with polyfills)' },
  ).then(transpileDownForIE),
  buildBundle(
    './packages/@uppy/robodog/bundle.js',
    './packages/@uppy/robodog/dist/robodog.js',
    { standalone: 'Robodog' },
  ).then(minifyBundle),
]

// Build minified versions of all the locales
const localePackagePath = path.join(__dirname, '..', 'packages', '@uppy', 'locales', 'src', '*.js')
glob.sync(localePackagePath).forEach((localePath) => {
  const localeName = path.basename(localePath, '.js')
  methods.push(
    buildBundle(
      `./packages/@uppy/locales/src/${localeName}.js`,
      `./packages/@uppy/locales/dist/${localeName}.min.js`,
      { minify: true },
    ),
  )
})

// Add BUNDLE-README.MD
methods.push(
  fs.promises.copyFile(
    `${__dirname}/../BUNDLE-README.md`,
    `./packages/uppy/dist/README.md`,
  ),
)

Promise.all(methods).then(() => {
  console.info(chalk.yellow('✓ JS bundles 🎉'))
})
