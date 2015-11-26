var fs = require('fs')
var version = require('../uppy/package.json').version
var themeconfPath = 'themes/uppy/_config.yml'
var installPath = 'src/guide/installation.md'
var themeconfig = fs.readFileSync(themeconfPath, 'utf-8')
var installation = fs.readFileSync(installPath, 'utf-8')

fs.writeFileSync(
  themeconfPath,
  themeconfig.replace(/vue_version: .*/, 'vue_version: ' + version)
)

var sizes = {
  dev: 'Uppy.js',
  min: 'uppy.min.js',
  gz: 'uppy.min.js.gz'
}

for (var file in sizes) {
  var filesize = fs.statSync('../uppy/dist/' + sizes[file], 'utf-8').size
  sizes[file] = (filesize / 1024).toFixed(2)
}

fs.writeFileSync(
  installPath,
  installation
    .replace(/vue_version: .*/, 'vue_version: ' + version)
    .replace(/(\w+)_size:.*/g, function (m, p1) {
      return p1 + '_size: "' + sizes[p1] + '"'
    })
)
