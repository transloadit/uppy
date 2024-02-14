import type { FileProgress } from './FileProgress'

export type Meta = Record<string, unknown>

export type Body = Record<string, unknown>

export type InternalMetadata = { name: string; type?: string }

export interface UppyFile<M extends Meta, B extends Body> {
  data: Blob | File
  error?: string | null
  extension: string
  id: string
  isPaused?: boolean
  isRestored?: boolean
  isRemote: boolean
  isGhost: boolean
  meta: InternalMetadata & M
  name: string
  preview?: string
  progress: FileProgress
  missingRequiredMetaFields?: string[]
  remote?: {
    body?: Record<string, unknown>
    companionUrl: string
    host: string
    provider?: string
    requestClientId: string
    url: string
  }
  serverToken?: string | null
  size: number | null
  source?: string
  type?: string
  uploadURL?: string
  response?: {
    body: B
    status: number
    bytesUploaded?: number
    uploadURL?: string
  }
}
