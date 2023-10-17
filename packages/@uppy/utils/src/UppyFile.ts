import type { FileProgress } from './FileProgress'

interface IndexedObject<T> {
  [key: string]: T
  [key: number]: T
}

export type InternalMetadata = { name: string; type?: string }

export interface UppyFile<
  TMeta = IndexedObject<any>,
  TBody = IndexedObject<any>,
> {
  data: Blob | File
  error?: Error
  extension: string
  id: string
  isPaused?: boolean
  isRestored?: boolean
  isRemote: boolean
  meta: InternalMetadata & TMeta
  name: string
  preview?: string
  progress?: FileProgress
  remote?: {
    host: string
    url: string
    body?: Record<string, unknown>
    provider?: string
    companionUrl: string
  }
  serverToken: string
  size: number
  source?: string
  type?: string
  response?: {
    body: TBody
    status: number
    uploadURL: string | undefined
  }
}
