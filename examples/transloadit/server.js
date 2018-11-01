const http = require('http')
const qs = require('querystring')

http.createServer((req, res) => {
  if (req.url !== '/test') {
    res.writeHead(404, {'content-type': 'text/html'})
    res.end('404')
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    res.setHeader('content-type', 'text/html')
    const fields = qs.parse(body)
    JSON.parse(fields.transloadit).forEach((assembly) => {
      res.write(`
        <h1>${assembly.assembly_id} (${assembly.ok})</h1>
        <ul>
        ${assembly.uploads.map((upload) => {
          return `<li>${upload.name}</li>`
        }).join('\n')}
        </ul>
        ${Object.keys(assembly.results).map((stepName) => {
          return `
            <h2>${stepName}</h2>
            <ul>
            ${assembly.results[stepName].map((result) => {
              return `<li>${result.name} <a href="${result.ssl_url}" target="_blank">View</a></li>`
            }).join('\n')}
            </ul>
          `
        }).join('\n')}
      `)
    })
    res.end()
  })
}).listen(9967)
