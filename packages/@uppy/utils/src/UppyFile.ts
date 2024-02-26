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
    host?: string
    provider?: string
    providerName?: string
    requestClientId: string
    url: string
  }
  serverToken?: string | null
  size: number | null
  source?: string
  type: string
  uploadURL?: string
  response?: {
    body: B
    status: number
    bytesUploaded?: number
    uploadURL?: string
  }
}

// The user facing type for UppyFile used in uppy.addFile() and uppy.setOptions()
export type MinimalRequiredUppyFile<M extends Meta, B extends Body> = Required<
  Pick<UppyFile<M, B>, 'name' | 'data'>
> &
  Partial<
    Omit<UppyFile<M, B>, 'name' | 'data' | 'meta'>
    // We want to omit the 'meta' from UppyFile because of internal metadata
    // (see InternalMetadata in `UppyFile.ts`), as when adding a new file
    // that is not required.
  > & { meta?: M }
