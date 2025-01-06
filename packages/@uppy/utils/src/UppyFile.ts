import type { FileProgress } from './FileProgress.js'

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
  name?: string
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
    body?: B
    status: number
    bytesUploaded?: number
    uploadURL?: string
  }
}

/*
 * The user facing type for UppyFile used in uppy.addFile() and uppy.setOptions()
 */
export type MinimalRequiredUppyFile<M extends Meta, B extends Body> = Required<
  Pick<UppyFile<M, B>, 'name'>
> &
  Partial<
    Omit<UppyFile<M, B>, 'name' | 'data' | 'meta'>
    // We want to omit the 'meta' from UppyFile because of internal metadata
    // (see InternalMetadata in `UppyFile.js`), as when adding a new file
    // that is not required.
  > & { meta?: M; data: { size: number | null } }

/*
 * We are not entirely sure what a "tag file" is.
 * It is used as an intermidiate type between `CompanionFile` and `UppyFile`
 * in `@uppy/provider-views` and `@uppy/url`.
 * TODO: remove this in favor of UppyFile
 */
export type TagFile<M extends Meta> = {
  id?: string
  source: string
  name: string
  type: string
  isRemote: boolean
  preview?: string
  data: {
    size: number | null
  }
  body?: {
    url?: string
    fileId?: string
  }
  meta?: {
    authorName?: string
    authorUrl?: string
    relativePath?: string | null
    absolutePath?: string
  } & M
  remote: {
    companionUrl: string
    url: string
    body: {
      fileId: string
      url?: string
    }
    providerName?: string
    provider?: string
    requestClientId: string
  }
}
