var fs = require('fs')
var path = require('path')
var chalk = require('chalk')
var exec = require('child_process').exec
var YAML = require('js-yaml')

var webRoot = __dirname
var uppyRoot = path.join(__dirname, '../packages/uppy')

var configPath = webRoot + '/themes/uppy/_config.yml'
var version = require(uppyRoot + '/package.json').version

var defaultConfig = {
  comment: 'Auto updated by update.js',
  uppy_version_anchor: '001',
  uppy_version: '0.0.1',
  uppy_bundle_kb_sizes: {
    'uppy.js': 'N/A'
  },
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
  'uppy.js': uppyRoot + '/dist/uppy.js',
  'uppy.js.gz': uppyRoot + '/dist/uppy.js.gz',
  'uppy.min.js': uppyRoot + '/dist/uppy.min.js',
  'uppy.min.js.gz': uppyRoot + '/dist/uppy.min.js.gz',
  'uppy.css': uppyRoot + '/dist/uppy.css',
  'uppy.css.gz': uppyRoot + '/dist/uppy.css.gz',
  'uppy.min.css': uppyRoot + '/dist/uppy.min.css',
  'uppy.min.css.gz': uppyRoot + '/dist/uppy.min.css.gz'
}

var scanConfig = {}
for (var type in locations) {
  var filepath = locations[type]
  var filesize = 0
  try {
    filesize = fs.statSync(filepath, 'utf-8').size
    filesize = (filesize / 1024).toFixed(2)
  } catch (e) {
    filesize = 'N/A'
  }
  if (!scanConfig.uppy_bundle_kb_sizes) {
    scanConfig.uppy_bundle_kb_sizes = {}
  }
  scanConfig.uppy_bundle_kb_sizes[type] = filesize
}

scanConfig['uppy_version'] = version
scanConfig['uppy_version_anchor'] = version.replace(/[^\d]+/g, '')

var saveConfig = Object.assign({}, defaultConfig, loadedConfig, scanConfig)
fs.writeFileSync(configPath, YAML.safeDump(saveConfig), 'utf-8')
console.info(chalk.green('✓ rewritten: '), chalk.dim(configPath))

var cmds = [
  'mkdir -p ' + webRoot + '/themes/uppy/source/uppy',
  'cp -vfR ' + uppyRoot + '/dist/* ' + webRoot + '/themes/uppy/source/uppy/'
].join(' && ')

exec(cmds, function (error, stdout, stderr) {
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
