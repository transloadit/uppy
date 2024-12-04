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
    
    case '/unknown-size': {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      const chunkSize = 1e5;
      if (req.method === 'GET') {
        let i = 0;
        const interval = setInterval(() => {
          if (i >= 10) { // 1MB
            clearInterval(interval);
            res.end();
            return;
          }
          res.write(Buffer.from(Array.from({ length: chunkSize }, () => '1').join('')));
          res.write('\n');
          i++;
        }, 10);
      } else if (req.method === 'HEAD') {
        res.end();
      } else {
        throw new Error('Unhandled method')
      }
    }
    break;
    
    default:
      res.writeHead(404).end('Unhandled request')
  }

  res.end()
}

export default function startMockServer (host, port) {
  const server = http.createServer(requestListener)
  server.listen(port, host, () => {
    console.log(`Mock server is running on http://${host}:${port}`)
  })
}

// startMockServer('localhost', 4678)
