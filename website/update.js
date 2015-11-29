var fs            = require('fs')
var version       = require('../package.json').version
var themeconfPath = 'themes/uppy/_config.yml'
var installPath   = 'src/guide/installation.md'
var themeconfig   = fs.readFileSync(themeconfPath, 'utf-8')
var installation  = fs.readFileSync(installPath, 'utf-8')

// fs.writeFileSync('themes/uppy/layout/partials/DESIGNGOALS.md', fs.readFileSync('../DESIGNGOALS.md', 'utf-8'));

fs.writeFileSync(
  themeconfPath,
  themeconfig.replace(/uppy_version: .*/, 'uppy_version: ' + version)
)

var sizes = {
  // min: 'uppy.min.js',
  // gz: 'uppy.min.js.gz',
  dev: './uppy.js'
}

for (var file in sizes) {
  var filesize = fs.statSync('../dist/' + sizes[file], 'utf-8').size
  sizes[file] = (filesize / 1024).toFixed(2)
}

fs.writeFileSync(
  installPath,
  installation
    .replace(/uppy_version: .*/, 'uppy_version: ' + version)
    .replace(/(\w+)_size:.*/g, function (m, p1) {
      return p1 + '_size: "' + sizes[p1] + '"'
    })
)
