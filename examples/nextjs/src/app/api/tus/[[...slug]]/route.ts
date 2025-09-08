import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { FileStore } from '@tus/file-store'
import { Server } from '@tus/server'
import type { NextRequest } from 'next/server'

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'files')
await mkdir(uploadDir, { recursive: true }).catch(() => {
  // Directory might already exist, ignore the error
})

const server = new Server({
  // `path` needs to match the route declared by the next file router
  // ie /api/tus
  path: '/api/tus',
  datastore: new FileStore({ directory: uploadDir }),
  respectForwardedHeaders: true,
})

// For Next.js App Router, we use the handleWeb method which properly handles Web API Request/Response
export const GET = async (req: NextRequest) => server.handleWeb(req)
export const POST = async (req: NextRequest) => server.handleWeb(req)
export const PATCH = async (req: NextRequest) => server.handleWeb(req)
export const DELETE = async (req: NextRequest) => server.handleWeb(req)
export const OPTIONS = async (req: NextRequest) => server.handleWeb(req)
export const HEAD = async (req: NextRequest) => server.handleWeb(req)
