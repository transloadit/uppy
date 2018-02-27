const uppy = require('uppy-server')
const app = require('express')()

app.use(require('cors')())
app.use(require('body-parser').json())

const options = {
  providerOptions: {
    s3: {
      getKey: (req, filename) =>
        `whatever/${Math.random().toString(32).slice(2)}/${filename}`,
      key: process.env.UPPYSERVER_AWS_KEY,
      secret: process.env.UPPYSERVER_AWS_SECRET,
      bucket: process.env.UPPYSERVER_AWS_BUCKET,
      region: process.env.UPPYSERVER_AWS_REGION
    }
  },
  server: { host: 'localhost:3020' }
}

app.use(uppy.app(options))

const server = app.listen(3020, () => {
  console.log('listening on port 3020')
})

uppy.socket(server, options)
