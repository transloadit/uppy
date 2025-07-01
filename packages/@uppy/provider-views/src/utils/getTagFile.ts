import type { UnknownPlugin } from '@uppy/core'
import type {
  CompanionClientProvider,
  CompanionClientSearchProvider,
} from '@uppy/utils/lib/CompanionClientProvider'
import type { CompanionFile } from '@uppy/utils/lib/CompanionFile'
import type { Body, Meta, TagFile } from '@uppy/utils/lib/UppyFile'

// TODO: document what is a "tagFile" or get rid of this concept
const getTagFile = <M extends Meta, B extends Body>(
  file: CompanionFile,
  plugin: UnknownPlugin<M, B>,
  provider: CompanionClientProvider | CompanionClientSearchProvider,
): TagFile<M> => {
  const tagFile: TagFile<any> = {
    id: file.id,
    source: plugin.id,
    name: file.name || file.id,
    type: file.mimeType,
    isRemote: true,
    data: file,
    preview: file.thumbnail || undefined,
    meta: {
      authorName: file.author?.name,
      authorUrl: file.author?.url,
      // We need to do this `|| null` check, because null value
      // for .relDirPath is `undefined` and for .relativePath is `null`.
      // I do think we should just use `null` everywhere.
      relativePath: file.relDirPath || null,
      absolutePath: file.absDirPath,
    },
    body: {
      fileId: file.id,
    },
    remote: {
      companionUrl: plugin.opts.companionUrl,
      url: `${provider.fileUrl(file.requestPath)}`,
      body: {
        fileId: file.id,
      },
      providerName: provider.name,
      provider: provider.provider,
      requestClientId: provider.provider,
    },
  }

  return tagFile
}

export default getTagFile
