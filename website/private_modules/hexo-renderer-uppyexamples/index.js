// We listen for hexo changes on *.es6 extensions.
// We fire our own build-examples.js and tell it which example to build -
// that script then writes temporary js files
// which we return via the callback.
const { exec } = require('node:child_process')
const path = require('node:path')
const fs = require('node:fs')
const uuid = require('uuid')

const webRoot = path.dirname(path.dirname(__dirname))
const browserifyScript = `${webRoot}/build-examples.js`

function parseExamplesBrowserify (data, options, callback) {
  if (!data || !data.path) {
    callback(null)
    return
  }

  if (!data.path.match(/\/examples\//)) {
    callback(null, data.text)
  }

  // var slug    = data.path.replace(/[^a-zA-Z0-9\_\.]/g, '-')
  const slug = uuid.v4()
  const tmpFile = `/tmp/${slug}.js`
  const cmd = `node ${browserifyScript} ${data.path} ${tmpFile} --colors`
  // hexo.log.i('hexo-renderer-uppyexamples: change detected in examples. running: ' + cmd);
  exec(cmd, (err, stdout) => {
    if (err) {
      callback(err)
      return
    }

    hexo.log.i(`hexo-renderer-uppyexamples: ${stdout.trim()}`)

    // eslint-disable-next-line no-shadow
    fs.readFile(tmpFile, 'utf-8', (err, bundledJS) => {
      if (err) {
        callback(err)
        return
      }
      // hexo.log.i('hexo-renderer-uppyexamples: read: ' + tmpFile);

      // @TODO remove this hack
      // once this is resolved: https://github.com/hexojs/hexo/issues/1663
      // bundledJS = bundledJS.replace(/</g, ' < ');
      // eslint-disable-next-line no-param-reassign
      bundledJS = bundledJS.replace(/<(?!=)/g, ' < ')

      callback(null, bundledJS)
    })
  })
}

hexo.extend.renderer.register('es6', 'js', parseExamplesBrowserify)
