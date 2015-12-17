var exec             = require('child_process').exec;
var path             = require('path');
var webRoot          = path.dirname(path.dirname(__dirname));
var browserifyScript = webRoot + '/build-examples.js'

hexo.extend.renderer.register('es6', 'es6', function(data, options, callback) {
  if (!data || !data.path) {
    return callback(null);
  }

  console.dir({
    data:data,
    options:options
  });

  if (!data.path.match(/\/examples\//)) {
    callback(null, data.text);
  }

  var cmd = 'node ' + browserifyScript + data.path;
  hexo.log.i('uppyexamplebuilder: change detected in examples. running: ' + cmd);
  exec(cmd , function(err, stdout, stderr) {
    if (err) {
      return callback(err);
    }

    hexo.log.i('uppyexamplebuilder: ' + stdout);
    callback(null, data.text);
  });
});
