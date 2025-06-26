const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const companion = require('@uppy/companion')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
const app = require('express')()

const DATA_DIR = path.join(__dirname, 'tmp')

app.use(
  require('cors')({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  }),
)
app.use(require('cookie-parser')())
app.use(require('body-parser').json())
app.use(
  require('express-session')({
    secret: 'hello planet',
    saveUninitialized: false,
    resave: false,
  }),
)

const options = {
  providerOptions: {
    drive: {
      key: process.env.COMPANION_GOOGLE_KEY,
      secret: process.env.COMPANION_GOOGLE_SECRET,
    },
  },
  s3: {
    getKey: ({ filename }) => `${crypto.randomUUID()}-${filename}`,
    key: process.env.COMPANION_AWS_KEY,
    secret: process.env.COMPANION_AWS_SECRET,
    bucket: process.env.COMPANION_AWS_BUCKET,
    region: process.env.COMPANION_AWS_REGION,
    endpoint: process.env.COMPANION_AWS_ENDPOINT,
    forcePathStyle: process.env.COMPANION_AWS_FORCE_PATH_STYLE === 'true',
  },
  server: { host: 'localhost:3020' },
  filePath: DATA_DIR,
  secret: 'blah blah',
  debug: true,
}

// Create the data directory here for the sake of the example.
try {
  fs.accessSync(DATA_DIR)
} catch (_err) {
  fs.mkdirSync(DATA_DIR)
}
process.on('exit', () => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true })
})

const { app: companionApp } = companion.app(options)

app.use(companionApp)

const server = app.listen(3020, () => {
  console.log('listening on port 3020')
})

companion.socket(server)
