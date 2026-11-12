import cors from 'cors'
import type { Request, Response } from 'express'
import express from 'express'
import multer from 'multer'

const app = express()

const upload = multer({
  storage: multer.memoryStorage(),
})

function uploadRoute(req: Request, res: Response) {
  res.json({
    files: Array.isArray(req.files)
      ? req.files.map(({ buffer, ...file }) => file)
      : [],
  })
}

app.use(cors())
app.post('/upload', upload.array('files'), uploadRoute)

app.listen(9967)
