import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createRequestHandler } from '@react-router/express'
import { FileStore } from '@tus/file-store'
import { Server as TusServer } from '@tus/server'
import express from 'express'

const app = express()

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads')
await mkdir(uploadDir, { recursive: true }).catch(() => {
  // Directory might already exist, ignore the error
})

// Create TUS server instance
const tusServer = new TusServer({
  path: '/api/upload',
  datastore: new FileStore({ directory: uploadDir }),
  respectForwardedHeaders: true,
})

// Handle TUS uploads before React Router
app.all('/api/upload/*', (req, res) => {
  return tusServer.handle(req, res)
})

// Serve static files (built React Router app)
app.use(express.static('build/client'))

// Handle all other routes with React Router
app.all(
  '*',
  createRequestHandler({
    // `react-router build` outputs files to a build directory
    build: async () => import('./build/server/index.js'),
    getLoadContext(req, res) {
      return {
        // You can pass any context here that you want available in your routes
      }
    },
  }),
)

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  console.log(`TUS endpoint available at http://localhost:${port}/api/upload`)
})
