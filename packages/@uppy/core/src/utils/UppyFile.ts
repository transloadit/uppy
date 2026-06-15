import type { FileProgress } from './FileProgress.js'

export type Meta = Record<string, unknown>

export type Body = Record<string, unknown>

export interface InternalMetadata {
  name: string
  type?: string
  relativePath?: string
}

// for better readability instead of using Record<string, something>
export type UppyFileId = string

interface UppyFileBase<M extends Meta, B extends Body> {
  error?: string | null
  extension: string
  id: UppyFileId
  isPaused?: boolean
  isRestored?: boolean
  isGhost: boolean
  meta: InternalMetadata & M
  name: string
  preview?: string
  progress: FileProgress
  missingRequiredMetaFields?: string[]
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

export interface LocalUppyFile<M extends Meta, B extends Body>
  extends UppyFileBase<M, B> {
  isRemote: false
  data: Blob | File | undefined
}

export interface LocalUppyFileNonGhost<M extends Meta, B extends Body>
  extends UppyFileBase<M, B> {
  isRemote: false
  isGhost: false
  data: Blob | File
}

export interface RemoteUppyFile<M extends Meta, B extends Body>
  extends UppyFileBase<M, B> {
  data: { size: number | null }
  isRemote: true
  remote: {
    body?: Record<string, unknown>
    companionUrl: string
    host?: string
    provider?: string
    providerName?: string
    requestClientId: string
    url: string
  }
}

export type UppyFile<M extends Meta, B extends Body> =
  | LocalUppyFile<M, B>
  | RemoteUppyFile<M, B>

// TODO use this type in more places, so we don't have to check for data not being null/undefined everywhere
/**
 * For when you know the file is not a ghost, and data is definitely present.
 */
export type UppyFileNonGhost<M extends Meta, B extends Body> =
  | LocalUppyFileNonGhost<M, B>
  | RemoteUppyFile<M, B>

/*
 * The user facing type for UppyFile used in uppy.addFile() and uppy.setOptions()
 */
export type MinimalRequiredUppyFile<M extends Meta, B extends Body> = Required<
  Pick<UppyFile<M, B>, 'name'>
> & { data: NonNullable<UppyFile<M, B>['data']> } & Partial<
    Omit<UppyFile<M, B>, 'name' | 'meta' | 'data'>
    // We want to omit the 'meta' from UppyFile because of internal metadata
    // (see InternalMetadata in `UppyFile.js`), as when adding a new file
    // that is not required.
  > & { meta?: M }
