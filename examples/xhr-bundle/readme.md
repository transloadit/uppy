# XHR Bundle Upload

This example uses Uppy with XHRUpload plugin in `bundle` mode. Bundle mode uploads all files to the endpoint in a single request, instead of firing off a new request for each file. This makes uploading a bit slower, but it may be easier to handle on the server side, depending on your setup.

[serve.js](./serve.js) contains an example express.js server that receives a multipart form-data upload and responds with some information about the files that were received (name, size) as JSON. It uses [multer](https://npmjs.com/package/multer) to parse the upload stream.

## Run it

Move into this directory, then:

```bash
npm install
npm start
```
