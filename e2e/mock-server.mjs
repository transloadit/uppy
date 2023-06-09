import http from 'node:http'

const requestListener = (req, res) => {
  const endpoint = req.url

  switch (endpoint) {
    case '/file-with-content-disposition': {
      const fileName = `DALL·E IMG_9078 - 学中文 🤑`
      res.setHeader('Content-Disposition', `attachment; filename="ASCII-name.zip"; filename*=UTF-8''${encodeURIComponent(fileName)}`)
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Content-Length', '86500')
      break
    }
    case '/file-no-headers':
      break
    default:
      res.writeHead(404).end('Unhandled request')
  }

  res.end()
}

export default function startMockServer (host, port) {
  const server = http.createServer(requestListener)
  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
  })
}

// startMockServer('localhost', 4678)
