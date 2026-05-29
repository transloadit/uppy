import { FileStore } from '@tus/file-store'
import { Server } from '@tus/server'

const host = '127.0.0.1'
const port = 1080

// The Vite dev client (start:client) runs on this origin. The tus server only
// sets CORS headers for origins listed here.
const clientOrigin = 'http://localhost:5173'

const server = new Server({
  path: '/files',
  datastore: new FileStore({ directory: './uploads' }),
  allowedOrigins: [clientOrigin],

  // Reproduce issue #6287: reject some uploads with a non-2xx + JSON body,
  // exactly like the server in the bug report ("BIN content type is disallowed").
  //
  // Any file whose name ends in `.bin` is rejected at creation, so you can test
  // BOTH paths against the same running server:
  //   - a normal file  -> success path
  //   - a `*.bin` file  -> error path (HTTP 403 with a JSON body)
  async onUploadCreate(req, upload) {
    const filename = upload.metadata?.filename ?? ''
    if (filename.toLowerCase().endsWith('.bin')) {
      throw {
        status_code: 403,
        body: JSON.stringify({
          message:
            'File cannot be uploaded as the BIN content type is disallowed!',
          status_code: 403,
        }),
      }
    }
    // Accept the upload unchanged. (The hook must resolve to an object.)
    return { metadata: upload.metadata }
  },
})

server.listen({ host, port }, () => {
  console.log(`tus server listening on http://${host}:${port}/files`)
  console.log(`CORS allowed for: ${clientOrigin}`)
})
