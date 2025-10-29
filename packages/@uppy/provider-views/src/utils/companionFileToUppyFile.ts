import type { UnknownPlugin } from '@uppy/core'
import type {
  Body,
  CompanionClientProvider,
  CompanionClientSearchProvider,
  CompanionFile,
  Meta,
  RemoteUppyFile,
} from '@uppy/utils'

const companionFileToUppyFile = <M extends Meta, B extends Body>(
  file: CompanionFile,
  plugin: UnknownPlugin<M, B>,
  provider: CompanionClientProvider | CompanionClientSearchProvider,
): RemoteUppyFile<M, B> => {
  const name = file.name || file.id

  return {
    id: file.id,
    source: plugin.id,
    name,
    type: file.mimeType,
    isRemote: true,
    data: file,
    preview: file.thumbnail || undefined,
    // @ts-expect-error TODO: fixme
    meta: {
      // name, // todo shouldn't this be here?
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
}

export default companionFileToUppyFile
