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

var sizes = {
  min: '../dist/uppy.min.js',
  // gz : '../dist/uppy.min.js.gz',
  // dev: '../dist/uppy.js'
}

for (var file in sizes) {
  var filesize = fs.statSync(sizes[file], 'utf-8').size
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
