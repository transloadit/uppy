import getFileType from './getFileType.js'
import type { MinimalRequiredUppyFile, UppyFile } from './UppyFile.js'

function encodeCharacter(character: string): string {
  return character.charCodeAt(0).toString(32)
}

function encodeFilename(name: string): string {
  let suffix = ''
  return (
    name.replace(/[^A-Z0-9]/gi, (character) => {
      suffix += `-${encodeCharacter(character)}`
      return '/'
    }) + suffix
  )
}

/**
 * Takes a file object and turns it into fileID, by converting file.name to lowercase,
 * removing extra characters and adding type, size and lastModified
 */
export default function generateFileID(
  file: Omit<MinimalRequiredUppyFile<any, any>, 'name'> &
    Pick<UppyFile<any, any>, 'name'>,
  instanceId: string,
): string {
  // It's tempting to do `[items].filter(Boolean).join('-')` here, but that
  // is slower! simple string concatenation is fast

  let id = instanceId || 'uppy'
  if (typeof file.name === 'string') {
    id += `-${encodeFilename(file.name.toLowerCase())}`
  }

  if (file.type !== undefined) {
    id += `-${file.type}`
  }

  if (file.meta && typeof file.meta.relativePath === 'string') {
    id += `-${encodeFilename(file.meta.relativePath.toLowerCase())}`
  }

  if (file.data.size !== undefined) {
    id += `-${file.data.size}`
  }
  if ((file.data as File).lastModified !== undefined) {
    id += `-${(file.data as File).lastModified}`
  }

  return id
}

// If the provider has a stable, unique ID, then we can use that to identify the file.
// Then we don't have to generate our own ID, and we can add the same file many times if needed (different path)
function hasFileStableId(
  file: Omit<MinimalRequiredUppyFile<any, any>, 'name'> &
    Pick<UppyFile<any, any>, 'name'>,
): boolean {
  if (!file.isRemote || !file.remote) return false
  // These are the providers that it seems like have stable IDs for their files. The other's I haven't checked yet.
  const stableIdProviders = new Set([
    'box',
    'dropbox',
    'drive',
    'facebook',
    'unsplash',
  ])
  return stableIdProviders.has(file.remote.provider as any)
}

export function getSafeFileId(
  file: Omit<MinimalRequiredUppyFile<any, any>, 'name'> &
    Pick<UppyFile<any, any>, 'name'>,
  instanceId: string,
): string {
  if (hasFileStableId(file)) return file.id!

  const fileType = getFileType(file)

  return generateFileID(
    {
      ...file,
      type: fileType,
    },
    instanceId,
  )
}
