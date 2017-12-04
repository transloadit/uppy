const uppy = require('uppy-server')
const app = require('express')()

app.use(require('cors')())
app.use(require('body-parser').json())

app.use(uppy.app({
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
}))

app.listen(3020, () => {
  console.log('listening on port 3020')
})
