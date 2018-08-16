const fs = require('fs')
const path = require('path')
const rimraf = require('rimraf')
const uppy = require('uppy-server')
const app = require('express')()

const DATA_DIR = path.join(__dirname, 'tmp')

app.use(require('cors')({
  origin: true,
  credentials: true
}))
app.use(require('cookie-parser')())
app.use(require('body-parser').json())
app.use(require('express-session')({
  secret: 'hello planet'
}))

const options = {
  providerOptions: {
    google: {
      key: process.env.UPPYSERVER_GOOGLE_KEY,
      secret: process.env.UPPYSERVER_GOOGLE_SECRET
    },
    s3: {
      getKey: (req, filename) =>
        `whatever/${Math.random().toString(32).slice(2)}/${filename}`,
      key: process.env.UPPYSERVER_AWS_KEY,
      secret: process.env.UPPYSERVER_AWS_SECRET,
      bucket: process.env.UPPYSERVER_AWS_BUCKET,
      region: process.env.UPPYSERVER_AWS_REGION
    }
  },
  server: { host: 'localhost:3020' },
  filePath: DATA_DIR,
  secret: 'blah blah',
  debug: true
}

// Create the data directory here for the sake of the example.
try {
  fs.accessSync(DATA_DIR)
} catch (err) {
  fs.mkdirSync(DATA_DIR)
}
process.on('exit', function () {
  rimraf.sync(DATA_DIR)
})

app.use(uppy.app(options))

const server = app.listen(3020, () => {
  console.log('listening on port 3020')
})

uppy.socket(server, options)
