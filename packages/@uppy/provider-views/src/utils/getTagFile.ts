import type { CompanionClientProvider, CompanionClientSearchProvider } from "@uppy/utils/lib/CompanionClientProvider"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"
import type { Meta, TagFile } from "@uppy/utils/lib/UppyFile"
import getFileType from "@uppy/utils/lib/getFileType"
import isPreviewSupported from "@uppy/utils/lib/isPreviewSupported"

// TODO: document what is a "tagFile" or get rid of this concept
const getTagFile = <M extends Meta>(file: CompanionFile, pluginId: string, provider: CompanionClientProvider | CompanionClientSearchProvider, companionUrl: string) : TagFile<M> => {
  const fileType = getFileType({ type: file.mimeType, name: file.name })
  
  const tagFile: TagFile<any> = {
    id: file.id,
    source: pluginId,
    name: file.name || file.id,
    type: file.mimeType,
    isRemote: true,
    data: file,
    // TODO Should we just always use the thumbnail URL if it exists?
    preview: isPreviewSupported(fileType) ? file.thumbnail : undefined,
    meta: {
      authorName: file.author?.name,
      authorUrl: file.author?.url,
      // We need to do this `|| null` check, because null value
      // for .relDirPath is `undefined` and for .relativePath is `null`.
      // I do think we should just use `null` everywhere.
      relativePath: file.relDirPath || null,
      absolutePath: file.absDirPath
    },
    body: {
      fileId: file.id,
    },
    remote: {
      companionUrl,
      // @ts-expect-error untyped for now
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
