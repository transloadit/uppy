const path = require('path')
const fs = require('fs')
const http = require('http')
const ecstatic = require('ecstatic')
const createWriteStream = require('fs-write-stream-atomic')
const browserify = require('browserify')
const watchify = require('watchify')
const aliasify = require('aliasify')
const babelify = require('babelify')

const port = process.env.PORT || 8080

const b = browserify({
  cache: {},
  packageCache: {},
  debug: true,
  entries: path.join(__dirname, './main.js')
})

b.plugin(watchify)

b.transform(babelify)
b.transform(aliasify, {
  global: true,
  replacements: {
    '^uppy/lib/(.*?)$': path.join(__dirname, '../../src/$1'),
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom')
  }
})

function bundle () {
  return b.bundle()
    .pipe(createWriteStream(path.join(__dirname, './bundle.js')))
}

b.on('log', console.log)
b.on('update', bundle)
b.on('error', console.error)

bundle()

fs.createReadStream(path.join(__dirname, '../../dist/uppy.min.css'))
  .pipe(fs.createWriteStream(path.join(__dirname, './uppy.min.css')))

const server = http.createServer(ecstatic({ root: __dirname }))
server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
