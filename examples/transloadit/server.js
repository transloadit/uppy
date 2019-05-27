/* eslint-disable compat/compat */
const http = require('http')
const qs = require('querystring')
const e = require('he').encode

/**
 * A very haxxor server that outputs some of the data it receives in a POST form parameter.
 */

const server = http.createServer(onrequest)
server.listen(9967)

function onrequest (req, res) {
  if (req.url !== '/test') {
    res.writeHead(404, { 'content-type': 'text/html' })
    res.end('404')
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', () => {
    onbody(body)
  })

  function onbody (body) {
    const fields = qs.parse(body)
    const assemblies = JSON.parse(fields.transloadit)

    res.setHeader('content-type', 'text/html')
    res.write(Header())
    res.write(FormFields(fields))
    assemblies.forEach((assembly) => {
      res.write(AssemblyResult(assembly))
    })
    res.end(Footer())
  }
}

function Header () {
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
      body { background: #f1f1f1; }
      main {
        padding: 20px;
        font: 12pt sans-serif;
        background: white;
        width: 800px;
        margin: auto;
      }
    </style>
    </head>
    <body>
    <main>
  `
}

function Footer () {
  return `
    </main>
    </body>
    </html>
  `
}

function FormFields (fields) {
  return `
    <h1>Form Fields</h1>
    <dl>
      ${Object.entries(fields).map(Field).join('\n')}
    </dl>
  `

  function Field ([name, value]) {
    if (name === 'transloadit') return ''
    return `
      <dt>${e(name)}</dt>
      <dd>${e(value)}</dd>
    `
  }
}

function AssemblyResult (assembly) {
  return `
    <h1>${e(assembly.assembly_id)} (${e(assembly.ok)})</h1>
    ${UploadsList(assembly.uploads)}
    ${ResultsList(assembly.results)}
  `
}

function UploadsList (uploads) {
  return `
    <ul>
      ${uploads.map(Upload).join('\n')}
    </ul>
  `

  function Upload (upload) {
    return `<li>${e(upload.name)}</li>`
  }
}

function ResultsList (results) {
  return Object.keys(results)
    .map(ResultsSection)
    .join('\n')

  function ResultsSection (stepName) {
    return `
      <h2>${e(stepName)}</h2>
      <ul>
        ${results[stepName].map(Result).join('\n')}
      </ul>
    `
  }

  function Result (result) {
    return `<li>${e(result.name)} <a href="${result.ssl_url}" target="_blank">View</a></li>`
  }
}
