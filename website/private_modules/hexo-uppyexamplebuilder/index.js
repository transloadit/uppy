// We listen for hexo changes on *.es6 extensions.
// We tell it to just copy the original to public/**/*.es6
// We fire our own build-examples.js and tell it which example to build -
// that script then writes the public/**/*.js files.
var exec             = require('child_process').exec;
var path             = require('path');
var webRoot          = path.dirname(path.dirname(__dirname));
var uppyRoot         = path.dirname(webRoot);
var browserifyScript = webRoot + '/build-examples.js'

hexo.extend.renderer.register('es6', 'es6', function(data, options, callback) {
  if (!data || !data.path) {
    return callback(null);
  }

  if (!data.path.match(/\/examples\//)) {
    callback(null, data.text);
  }

  var cmd = 'node ' + browserifyScript + ' ' + data.path + ' --colors';
  // hexo.log.i('hexo-uppyexamplebuilder: change detected in examples. running: ' + cmd);
  exec(cmd, function(err, stdout, stderr) {
    if (err) {
      return callback(err);
    }

    hexo.log.i('hexo-uppyexamplebuilder: ' + stdout.trim());
    callback(null, data.text);
  });
});
