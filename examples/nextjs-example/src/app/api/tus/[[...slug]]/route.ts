import { Server } from '@tus/server'
import { FileStore } from '@tus/file-store'
import { NextRequest } from 'next/server'

const server = new Server({
  // `path` needs to match the route declared by the next file router
  // ie /api/tus
  path: '/api/tus',
  datastore: new FileStore({ directory: './files' }),
})

export const GET = async (req: NextRequest) => server.handle(req)
export const PATCH = async (req: NextRequest) => server.handle(req)
export const POST = async (req: NextRequest) => server.handle(req)
export const DELETE = async (req: NextRequest) => server.handle(req)
export const OPTIONS = async (req: NextRequest) => server.handle(req)
export const HEAD = async (req: NextRequest) => server.handle(req)