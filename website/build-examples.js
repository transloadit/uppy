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

const { createWriteStream, mkdirSync } = require('fs')
const { glob } = require('multi-glob')
const chalk = require('chalk')
const path = require('path')
const notifier = require('node-notifier')
const babelify = require('babelify')
const aliasify = require('aliasify')
const browserify = require('browserify')
const watchify = require('watchify')

const bresolve = require('browser-resolve')

function useSourcePackages (b) {
  // eslint-disable-next-line no-underscore-dangle
  b._bresolve = (id, opts, cb) => {
    bresolve(id, opts, (err, result, pkg) => {
      if (err) return cb(err)
      if (/packages\/@uppy\/[^/]+?\/lib\//.test(result)) {
        result = result.replace(/packages\/@uppy\/([^/]+?)\/lib\//, 'packages/@uppy/$1/src/')
      }
      cb(err, result, pkg)
    })
  }
}

const webRoot = __dirname

let srcPattern = `${webRoot}/src/examples/**/app.es6`
let dstPattern = `${webRoot}/public/examples/**/app.js`

const watchifyEnabled = process.argv[2] === 'watch'

const browserifyPlugins = [useSourcePackages]
if (watchifyEnabled) {
  browserifyPlugins.push(watchify)
}

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

  const muted = new Set()

  // Create a new watchify instance for each file.
  files.forEach((file) => {
    const b = browserify(file, {
      cache: {},
      packageCache: {},
      debug: true,
      plugin: browserifyPlugins,
    })

    // Aliasing for using `require('uppy')`, etc.
    b
      .transform(babelify, {
        root: path.join(__dirname, '..'),
      })
      .transform(aliasify, {
        aliases: {
          '@uppy': `./${path.relative(process.cwd(), path.join(__dirname, '../packages/@uppy'))}`,
        },
      })

    // Listeners for changes, errors, and completion.
    b
      .on('update', bundle)
      .on('error', onError)
      .on('file', (file) => {
        // When file completes, unmute it.
        muted.delete(file)
      })

    // Call bundle() manually to start watch processes.
    bundle()

    /**
     * Creates bundle and writes it to static and public folders.
     * Changes to
     *
     * @param  {string[]} ids
     */
    function bundle (ids = []) {
      ids.forEach((id) => {
        if (!muted.has(id)) {
          console.info(chalk.cyan('change:'), path.relative(process.cwd(), id))
          muted.add(id)
        }
      })

      const exampleName = path.basename(path.dirname(file))
      const output = dstPattern.replace('**', exampleName)
      const parentDir = path.dirname(output)

      mkdirSync(parentDir, { recursive: true })

      console.info(chalk.grey(`⏳ building: ${path.relative(process.cwd(), file)}`))

      b
        .bundle()
        .on('error', onError)
        .pipe(createWriteStream(output))
        .on('finish', () => {
          console.info(chalk.green(`✓ built: ${path.relative(process.cwd(), file)}`))
        })
    }
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
