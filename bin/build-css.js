const sass = require('node-sass')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const safeImportant = require('postcss-safe-important')
const chalk = require('chalk')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const resolve = require('resolve')
const mkdirp = promisify(require('mkdirp'))
const glob = promisify(require('glob'))

const renderScss = promisify(sass.render)
const writeFile = promisify(fs.writeFile)

const cwd = process.cwd()

function handleErr (err) {
  console.error(chalk.red('✗ Error:'), chalk.red(err.message))
}

async function compileCSS () {
  const files = await glob('packages/{,@uppy/}*/src/style.scss')
  for (const file of files) {
    const scssResult = await renderScss({
      file,
      importedFiles: new Set(),
      importer (url, from, done) {
        resolve(url, {
          basedir: path.dirname(from),
          filename: from,
          extensions: ['.scss']
        }, (err, res) => {
          if (err) return done(err)

          res = fs.realpathSync(res)

          if (this.options.importedFiles.has(res)) return done({ contents: '' })
          this.options.importedFiles.add(res)

          done({ file: res })
        })
      }
    })

    const postcssResult = await postcss([ autoprefixer, safeImportant ])
      .process(scssResult.css, { from: file })
    postcssResult.warnings().forEach(function (warn) {
      console.warn(warn.toString())
    })

    const outdir = path.join(path.dirname(file), '../dist')
    const outfile = path.join(outdir, 'style.css')
    await mkdirp(outdir)
    await writeFile(outfile, postcssResult.css)
    console.info(
      chalk.green('✓ Built Uppy CSS:'),
      chalk.magenta(path.relative(cwd, outfile))
    )

    const minifiedResult = await postcss([ cssnano ])
        .process(postcssResult.css, { from: outfile })
    minifiedResult.warnings().forEach(function (warn) {
      console.warn(warn.toString())
    })
    await writeFile(outfile.replace(/\.css$/, '.min.css'), minifiedResult.css)
    console.info(
      chalk.green('✓ Minified Bundle CSS:'),
      chalk.magenta(path.relative(cwd, outfile).replace(/\.css$/, '.min.css'))
    )
  }
}

compileCSS().then(() => {
  console.info(chalk.yellow('✓ CSS Bundles 🎉'))
}, handleErr)
