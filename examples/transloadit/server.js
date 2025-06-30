#!/usr/bin/env node


import http from 'node:http'
import qs from 'node:querystring'
import he from 'he'

const e = he.encode

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
  function Field ([name, value]) {
    if (name === 'transloadit') return ''
    let isValueJSON = false
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        // eslint-disable-next-line no-param-reassign
        value = JSON.stringify(
          JSON.parse(value),
          null,
          2,
        )
        isValueJSON = true
      } catch {
        // Nothing
      }
    }

    const prettyValue = isValueJSON ? `
        <details open>
          <code>
            <pre style="max-width: 100%; max-height: 400px; white-space: pre-wrap; overflow: auto;">${e(value)}</pre>
          </code>
        </details>
      ` : e(value)

    return `
      <dt>${e(name)}</dt>
      <dd>
        ${prettyValue}
      </dd>
    `
  }

  return `
  <h1>Form Fields</h1>
  <dl>
    ${Object.entries(fields).map(Field).join('\n')}
  </dl>
`
}

function UploadsList (uploads) {
  function Upload (upload) {
    return `<li>${e(upload.name)}</li>`
  }

  return `
    <ul>
      ${uploads.map(Upload).join('\n')}
    </ul>
  `
}

function ResultsList (results) {
  function Result (result) {
    return `<li>${e(result.name)} <a href="${result.ssl_url}" target="_blank">View</a></li>`
  }

  function ResultsSection (stepName) {
    return `
    <h2>${e(stepName)}</h2>
    <ul>
    ${results[stepName].map(Result).join('\n')}
    </ul>
    `
  }

  return Object.keys(results)
    .map(ResultsSection)
    .join('\n')
}

function AssemblyResult (assembly) {
  return `
    <h1>${e(assembly.assembly_id)} (${e(assembly.ok)})</h1>
    ${UploadsList(assembly.uploads)}
    ${ResultsList(assembly.results)}
  `
}

function onrequest (req, res) {
  if (req.url !== '/test') {
    res.writeHead(404, { 'content-type': 'text/html' })
    res.end('404')
    return
  }

  function onbody (body) {
    const fields = qs.parse(body)
    const result = JSON.parse(fields.uppyResult)
    const assemblies = result[0].transloadit

    res.setHeader('content-type', 'text/html')
    res.write(Header())
    res.write(FormFields(fields))
    assemblies.forEach((assembly) => {
      res.write(AssemblyResult(assembly))
    })
    res.end(Footer())
  }

  {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      onbody(body)
    })
  }
}

/**
 * A very haxxor server that outputs some of the data it receives in a POST form parameter.
 */

const server = http.createServer(onrequest)
server.listen(9967)
