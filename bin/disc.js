const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')
const replace = require('replacestream')
const browserify = require('browserify')
const babelify = require('babelify')
const minify = require('minify-stream')
const disc = require('disc')

const outputPath = path.join(__dirname, '../website/src/disc.html')

function minifyify (filename) {
  if (filename.endsWith('.js')) {
    return minify({
      sourceMap: false,
      toplevel: true,
      compress: { unsafe: true }
    })
  }
  return new PassThrough()
}

const bundler = browserify(path.join(__dirname, '../packages/uppy/index.js'), {
  fullPaths: true,
  standalone: 'Uppy'
})

bundler.transform(babelify)
bundler.transform(minifyify, { global: true })

bundler.bundle()
  .pipe(disc())
  .pipe(prepend('---\nlayout: false\n---\n'))
  .pipe(replace('http://', 'https://', { limit: 1 }))
  .pipe(fs.createWriteStream(outputPath))
  .on('error', (err) => {
    throw err
  })

function prepend (text) {
  const stream = new PassThrough()
  stream.write(text)
  return stream
}
