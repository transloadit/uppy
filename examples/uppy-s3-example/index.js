require('dotenv').config()

const express = require('express')

const app = express()
const path = require('node:path')

const port = process.env.PORT
const bodyParser = require('body-parser')

const aws = require('aws-sdk')

app.use(bodyParser.json())

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html')
  res.sendFile(htmlPath)
})

app.get('/drag', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'drag.html')
  res.sendFile(htmlPath)
})

app.post('/sign-s3', (req, res) => {
  const s3 = new aws.S3()
  const fileName = req.body.filename
  const { contentType } = req.body
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: contentType,
    ACL: 'public-read',
  }

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      console.log(err)
      return res.end()
    }
    const returnData = {
      url: data,
      method: 'PUT',
    }
    res.write(JSON.stringify(returnData))
    res.end()
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
