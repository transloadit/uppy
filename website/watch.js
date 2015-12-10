var createStream = require('fs').createWriteStream;
var glob = require('multi-glob').glob;
var chalk = require('chalk');
var notifier = require('node-notifier');
var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');

var src = 'src/js/app.js';
var dest = 'static/js/app.js';

var pattern = 'src/examples/**/' + src;

glob([pattern, 'website/' + pattern], function(err, files) {
  if (err) throw new Error(err);

  console.log('--> Watching examples..');
  console.log('--> Pre-building ' + files.length + ' files..')

  var muted = [];

  files.forEach(function(file) {
    var watcher = browserify(file, {
      cache: {},
      packageCache: {},
      plugin: [watchify]
    })
      .require('../src/index.js', { expose: 'uppy' })
      .require('../src/core/index.js', { expose: 'uppy/core' })
      .require('../src/plugins/index.js', { expose: 'uppy/plugins' })
      .transform(babelify);

    watcher
      .on('update', bundle)
      .on('error', onError)
      .on('log', function(msg) {
        console.info(chalk.green('✓ done:'), chalk.green(file), chalk.gray.dim('(' + msg + ')'));
      })
      .on('file', function(file, id, parent) {
        muted = muted.filter(function(mutedId) {
          return id !== mutedId;
        });
      });

    bundle();

    function bundle(ids) {
      ids = ids || [];
      ids.forEach(function(id) {
        if (!isMuted(id, muted)) {
          console.info(chalk.cyan('change:'), id);
          muted.push(id);
        }
      });

      var output = file.replace(src, dest);
      var bundle = watcher.bundle()
      .on('error', onError)
      bundle.pipe(createStream(output));
      bundle.pipe(createStream(output.replace('src', 'public')));
    }
  });
});

function onError(err) {
  console.error(chalk.red('✗ error:'), chalk.red(err.message));
  notifier.notify({
    'title': 'Build failed:',
    'message': err.message
  })
  this.emit('end');
}

function isMuted(id, list) {
  return list.reduce(function(prev, curr) {
    return prev || (curr === id);
  }, false);
}
