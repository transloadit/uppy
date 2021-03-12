var app = require('express')()
var cors = require('cors')
var multer = require('multer')

var upload = multer({
  storage: multer.memoryStorage()
})

app.use(cors())
app.post('/upload', upload.array('files'), uploadRoute)

app.listen(9967)

function uploadRoute (req, res) {
  res.json({
    files: req.files.map(function (file) {
      delete file.buffer
      return file
    })
  })
}
