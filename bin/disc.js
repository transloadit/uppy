const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')
const browserify = require('browserify')
const babelify = require('babelify')
const minifyify = require('minifyify')
const disc = require('disc')

const outputPath = path.join(__dirname, '../website/src/disc.html')

const bundler = browserify(path.join(__dirname, '../src/index.js'), {
  fullPaths: true,
  standalone: 'Uppy'
})

bundler.plugin(minifyify, { map: false })
bundler.transform(babelify)

bundler.bundle()
  .pipe(disc())
  .pipe(prepend('---\nlayout: false\n---\n'))
  .pipe(fs.createWriteStream(outputPath))
  .on('error', (err) => {
    throw err
  })

function prepend (text) {
  const stream = new PassThrough()
  stream.write(text)
  return stream
}
