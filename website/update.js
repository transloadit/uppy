var fs = require('fs')
var path = require('path')
var chalk = require('chalk')
var exec = require('child_process').exec
var YAML = require('js-yaml')

var webRoot = __dirname
var uppyRoot = path.dirname(__dirname)

var configPath = webRoot + '/themes/uppy/_config.yml'
var version = require(uppyRoot + '/package.json').version

var defaultConfig = {
  comment: 'Auto updated by update.js',
  uppy_version_anchor: '001',
  uppy_version: '0.0.1',
  uppy_dev_size: '0.0',
  uppy_min_size: '0.0',
  config: {}
}

var loadedConfig
var buf
try {
  buf = fs.readFileSync(configPath, 'utf-8')
  loadedConfig = YAML.safeLoad(buf)
} catch (e) {

}

// Inject current Uppy version and sizes in website's _config.yml
// @todo: Refer to actual minified builds in dist:
var locations = {
  min: uppyRoot + '/dist/uppy.js',
  gz: uppyRoot + '/dist/uppy.js',
  dev: uppyRoot + '/dist/uppy.js',
  css: uppyRoot + '/dist/uppy.css'
}

var scanConfig = {}

for (var type in locations) {
  var filepath = locations[type]
  var filesize = fs.statSync(filepath, 'utf-8').size
  scanConfig['uppy_' + type + '_size'] = (filesize / 1024).toFixed(2)
}

scanConfig['uppy_version'] = version
scanConfig['uppy_version_anchor'] = version.replace(/[^\d]+/g, '')

var saveConfig = Object.assign({}, defaultConfig, loadedConfig, scanConfig)
fs.writeFileSync(configPath, YAML.safeDump(saveConfig), 'utf-8')
console.info(chalk.green('✓ rewritten: '), chalk.dim(configPath))

exec('cp -vfR ' + uppyRoot + '/dist/ ' + webRoot + '/themes/uppy/source/uppy', function (error, stdout, stderr) {
  if (error) {
    console.error(
      chalk.red('x failed to inject: '),
      chalk.dim('uppy bundle into site, because: ' + error)
    )
    return
  }
  stdout.trim().split('\n').forEach(function (line) {
    console.info(chalk.green('✓ injected: '), chalk.dim(line))
  })
})
