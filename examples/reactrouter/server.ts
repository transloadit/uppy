import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createRequestHandler } from '@react-router/express'
import { FileStore } from '@tus/file-store'
import { Server as TusServer } from '@tus/server'
import express from 'express'
import type { ViteDevServer } from 'vite'

async function startServer() {
  try {
    // Setup upload directory
    const uploadDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadDir, { recursive: true }).catch(() => {})

    // Create TUS server for resumable uploads
    const tusServer = new TusServer({
      path: '/api/upload/tus',
      datastore: new FileStore({ directory: uploadDir }),
    })

    // Setup Vite dev server
    const viteDevServer: ViteDevServer = await import('vite').then((vite) =>
      vite.createServer({
        server: { middlewareMode: true },
        logLevel: 'info',
      }),
    )

    // React Router request handler
    const reactRouterHandler = createRequestHandler({
      build: () =>
        viteDevServer.ssrLoadModule(
          'virtual:react-router/server-build',
        ) as Promise<any>,
    })

    const app = express()

    // Use Vite dev middleware
    app.use(viteDevServer.middlewares)

    // TUS upload endpoints (before React Router)
    app.all('/api/upload/tus', (req, res) => tusServer.handle(req, res))
    app.all('/api/upload/tus/*', (req, res) => tusServer.handle(req, res))

    // Handle Chrome DevTools requests silently
    app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
      res.status(404).end()
    })

    // React Router handles all other routes
    app.all('*', reactRouterHandler)

    const port = process.env.PORT || 3000
    const server = app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`)
      console.log(`📁 TUS uploads: /api/upload/tus`)
      console.log(`📁 XHR uploads: /api/upload/xhr`)
      console.log(`Press Ctrl+C to stop the server`)
    })

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`)

      server.close(async (err) => {
        if (err) {
          console.error('Error during server close:', err)
          process.exit(1)
        }

        try {
          await viteDevServer.close()
          console.log('✅ Server closed successfully')
          process.exit(0)
        } catch (closeErr) {
          console.error('Error closing Vite dev server:', closeErr)
          process.exit(1)
        }
      })

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('❌ Forceful shutdown after timeout')
        process.exit(1)
      }, 10000)
    }

    // Handle various shutdown signals
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGHUP', () => shutdown('SIGHUP'))

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err)
      shutdown('UNCAUGHT_EXCEPTION')
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason)
      shutdown('UNHANDLED_REJECTION')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
