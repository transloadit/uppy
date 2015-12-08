var fs            = require('fs')
var version       = require('../package.json').version
var themeconfPath = 'themes/uppy/_config.yml'
var configPath    = '_config.yml'
var themeconfig   = fs.readFileSync(themeconfPath, 'utf-8')
var config        = fs.readFileSync(configPath, 'utf-8')

fs.writeFileSync(
  themeconfPath,
  themeconfig.replace(/uppy_version: .*/, 'uppy_version: ' + version)
)

// Inject current Uppy version and sizes in website's _config.yml
var sizes = {};
var locations = {
  min: '../dist/uppy.js',
  gz : '../dist/uppy.js',
  dev: '../dist/uppy.js'
}
// @todo: ^-- Refer to actual minified builds in dist:

for (var file in locations) {
  var filesize = fs.statSync(locations[file], 'utf-8').size
  sizes[file] = (filesize / 1024).toFixed(2)
}

fs.writeFileSync(
  configPath,
  config
    .replace(/uppy_version: .*/, 'uppy_version: ' + version)
    .replace(/uppy_(\w+)_size:.*/g, function (m, p1) {
      return 'uppy_' + p1 + '_size: "' + (sizes[p1] || 99999 ) + '"'
    })
)


// Copy latest uppy version into website so examples can use it
fs.writeFileSync(
  './src/examples/uppy.js',
  fs.readFileSync(locations.dev, 'utf-8')
);
