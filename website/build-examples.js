/**
 * build-examples.js
 * --------
 * Searches for each example's `js/app.es6` file.
 * Creates a new watchify instance for each `app.es6`.
 * Changes to Uppy's source will trigger rebundling.
 *
 * Run as:
 *
 * build-examples.js               # to build all examples one-off
 * build-examples.js watch         # to keep rebuilding examples with an internal watchify
 * build-examples.js <path>        # to build just one example app.es6
 * build-examples.js <path> <path> # to build just one example app.es6 to a specific location
 *
 * Note:
 * Since each example is dependent on Uppy's source,
 * changing one source file causes the 'file changed'
 * notification to fire multiple times. To stop this,
 * files are added to a 'muted' Set that is checked
 * before announcing a changed file.  It's removed from
 * the Set when it has been bundled.
 */

const { glob } = require('multi-glob')
const chalk = require('chalk')
const path = require('path')
const notifier = require('node-notifier')

const esbuild = require('esbuild')
const alias = require('esbuild-plugin-alias')

const babelImport = import('esbuild-plugin-babel')

const webRoot = __dirname

let srcPattern = `${webRoot}/src/examples/**/app.es6`
let dstPattern = `${webRoot}/public/examples/**/app.js`

const watchifyEnabled = process.argv[2] === 'watch'

// Instead of 'watch', build-examples.js can also take a path as cli argument.
// In this case we'll only bundle the specified path/pattern
if (!watchifyEnabled && process.argv.length > 2) {
  [, , srcPattern, dstPattern] = process.argv
}

// Find each app.es6 file with glob.
glob(srcPattern, (err, files) => {
  if (err) throw new Error(err)

  if (watchifyEnabled) {
    console.log('--> Watching examples..')
  }

  // Create a new watchify instance for each file.
  files.forEach((file) => {
    const exampleName = path.basename(path.dirname(file))
    const outfile = dstPattern.replace('**', exampleName)

    babelImport.then(({ default: babel }) => esbuild.build({
      bundle: true,
      sourcemap: true,
      watch: watchifyEnabled,
      entryPoints: [file],
      outfile,
      banner: {
        js: '"use strict";',
      },
      loader: {
        '.es6': 'js',
      },
      plugins: [
        alias({
          '@uppy': path.resolve(__dirname, `../packages/@uppy`),
        }),
        babel({
          filter: /\.js$/,
          config: { root: path.join(__dirname, '..') },
        }),
      ],
    })).catch(onError)
  })
})

/**
 * Logs to console and shows desktop notification on error.
 * Calls `this.emit(end)` to stop bundling.
 *
 * @param  {object} err Error object
 */
function onError (err) {
  console.error(chalk.red('✗ error:'), chalk.red(err.message))
  notifier.notify({
    title: 'Build failed:',
    message: err.message,
  })
  this.emit('end')

  // When running without watch, process.exit(1) on error
  if (!watchifyEnabled) {
    process.exit(1)
  }
}
