var fs = require('fs');
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

  var mute = false;

  files.forEach(function(file) {
    var watcher = browserify(file, {
      cache: {},
      packageCache: {},
      plugin: [watchify]
    }).transform(babelify);

    watcher
      .on('update', bundle)
      .on('error', handleError)
      .on('log', function(msg) {
        console.log(chalk.green('✓ done:'), chalk.bold(file), chalk.gray.dim(msg));
        mute = false;
      });

    bundle();

    function bundle(id) {
      if (id && !mute) {
        console.log(chalk.cyan('change:'), chalk.bold(id[0]));
        mute = true;
      }
      var bundle = watcher.bundle();
      bundle.pipe(createStream(file.replace(src, dest)));
      bundle.pipe(createStream('public' + file.slice(3)));
    }
  });
});

function createStream(filepath) {
  return fs.createWriteStream(filepath);
}

function handleError(err) {
  console.log(chalk.red('✗ error:'), err.message);
  notifier.notify({
    'title': 'Build failed:',
    'message': err.message
  })
  this.emit('end');
}
