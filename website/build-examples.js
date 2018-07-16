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
 * files are added to a 'muted' array that is checked
 * before announcing a changed file.  It's removed from
 * the array when it has been bundled.
 */
var createStream = require('fs').createWriteStream
var glob = require('multi-glob').glob
var chalk = require('chalk')
var path = require('path')
var mkdirp = require('mkdirp')
var notifier = require('node-notifier')
var babelify = require('babelify')
var aliasify = require('aliasify')
var browserify = require('browserify')
var watchify = require('watchify')

var webRoot = __dirname
// var uppyRoot = path.dirname(webRoot)

var srcPattern = webRoot + '/src/examples/**/app.es6'
var dstPattern = webRoot + '/public/examples/**/app.js'

var watchifyEnabled = process.argv[2] === 'watch'

var browserifyPlugins = []
if (watchifyEnabled) {
  browserifyPlugins.push(watchify)
}

// Instead of 'watch', build-examples.js can also take a path as cli argument.
// In this case we'll only bundle the specified path/pattern
if (!watchifyEnabled && process.argv[2]) {
  srcPattern = process.argv[2]
  if (process.argv[3]) {
    dstPattern = process.argv[3]
  }
}

// Find each app.es6 file with glob.
glob(srcPattern, function (err, files) {
  if (err) throw new Error(err)

  if (watchifyEnabled) {
    console.log('--> Watching examples..')
  }

  var muted = []

  // Create a new watchify instance for each file.
  files.forEach(function (file) {
    var browseFy = browserify(file, {
      cache: {},
      packageCache: {},
      debug: true,
      plugin: browserifyPlugins
    })

    // Aliasing for using `require('uppy')`, etc.
    browseFy
      .transform(babelify)
      .transform(aliasify, {
        aliases: {
          '@uppy': path.relative(process.cwd(), path.join(__dirname, '../packages/@uppy'))
        }
      })

    // Listeners for changes, errors, and completion.
    browseFy
      .on('update', bundle)
      .on('error', onError)
      .on('file', function (file, id, parent) {
        // When file completes, unmute it.
        muted = muted.filter(function (mutedId) {
          return id !== mutedId
        })
      })

    // Call bundle() manually to start watch processes.
    bundle()

    /**
     * Creates bundle and writes it to static and public folders.
     * Changes to
     * @param  {[type]} ids [description]
     * @return {[type]}     [description]
     */
    function bundle (ids) {
      ids = ids || []
      ids.forEach(function (id) {
        if (!isMuted(id, muted)) {
          console.info(chalk.cyan('change:'), id)
          muted.push(id)
        }
      })

      var exampleName = path.basename(path.dirname(file))
      var output = dstPattern.replace('**', exampleName)
      var parentDir = path.dirname(output)

      mkdirp.sync(parentDir)

      console.info(chalk.green('✓ building:'), chalk.green(path.relative(process.cwd(), file)))

      browseFy
        .bundle()
        .on('error', onError)
        .pipe(createStream(output))
    }
  })
})

/**
 * Logs to console and shows desktop notification on error.
 * Calls `this.emit(end)` to stop bundling.
 * @param  {object} err Error object
 */
function onError (err) {
  console.error(chalk.red('✗ error:'), chalk.red(err.message))
  notifier.notify({
    'title': 'Build failed:',
    'message': err.message
  })
  this.emit('end')

  // When running without watch, process.exit(1) on error
  if (!watchifyEnabled) {
    process.exit(1)
  }
}

/**
 * Checks if a file has been added to muted list.
 * This stops single changes from logging multiple times.
 * @param  {string}  id   Name of changed file
 * @param  {Array<string>}  list Muted files array
 * @return {Boolean}      True if file is muted
 */
function isMuted (id, list) {
  return list.reduce(function (prev, curr) {
    return prev || (curr === id)
  }, false)
}
