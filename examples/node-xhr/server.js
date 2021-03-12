var formidable = require('formidable')
var http = require('http')

http.createServer(function (req, res) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000 // 30 days
    /** add other headers as per requirement */
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers)
    res.end()
    return
  }
  if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm()
    form.uploadDir = './uploads'
    form.keepExtensions = true

    form.parse(req, function (err, fields, files) {
      if (err) {
        console.log('some error', err)
        res.writeHead(200, headers)
        res.write(JSON.stringify(err))
        return res.end()
      }
      var file = files['files[]']
      console.log('saved file to', file.path)
      console.log('original name', file.name)
      console.log('type', file.type)
      console.log('size', file.size)
      res.writeHead(200, headers)
      res.write(JSON.stringify({ fields, files }))
      return res.end()
    })
  }
}).listen(3020, () => {
  console.log('server started')
})
