'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const session = require('express-session')
const compression = require('compression')
const awsServerlessExpress = require('aws-serverless-express')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const companion = require('@uppy/companion')

const app = express()

app.use(compression())
app.use(cors())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(awsServerlessExpressMiddleware.eventContext())

const host = process.env.DOMAIN.split('://')[1]
const protocol = process.env.DOMAIN.split('://')[0]

const options = {
  providerOptions: {
    s3: {
      getKey: (req, filename) => filename,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION
    },
    instagram: {
      key: process.env.INSTAGRAM_KEY,
      secret: process.env.INSTAGRAM_SECRET
    },
    google: {
      key: process.env.GOOGLE_KEY,
      secret: process.env.GOOGLE_SECRET
    },
    dropbox: {
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET
    }
  },
  server: {
    host: host,
    protocol: protocol
  },
  filePath: '/tmp',
  secret: process.env.UPPY_SECRET
}

app.use(companion.app(options))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send("Hello there, here's a response from companion")
})

const server = awsServerlessExpress.createServer(app)

exports.companion = (event, context) =>
  awsServerlessExpress.proxy(server, event, context)
