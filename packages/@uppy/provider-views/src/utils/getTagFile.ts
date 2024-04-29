import type { CompanionClientProvider, CompanionClientSearchProvider } from "@uppy/utils/lib/CompanionClientProvider"
import type { CompanionFile } from "@uppy/utils/lib/CompanionFile"
import type { Meta, TagFile } from "@uppy/utils/lib/UppyFile"
import getFileType from "@uppy/utils/lib/getFileType"
import isPreviewSupported from "@uppy/utils/lib/isPreviewSupported"

// TODO: document what is a "tagFile" or get rid of this concept
const getTagFile = <M extends Meta>(file: CompanionFile, pluginId: string, provider: CompanionClientProvider | CompanionClientSearchProvider, companionUrl: string) : TagFile<M> => {
  const tagFile: TagFile<any> = {
    id: file.id,
    source: pluginId,
    name: file.name || file.id,
    type: file.mimeType,
    isRemote: true,
    data: file,
    meta: {},
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

  const fileType = getFileType(tagFile)

  // TODO Should we just always use the thumbnail URL if it exists?
  if (fileType && isPreviewSupported(fileType)) {
    tagFile.preview = file.thumbnail
  }

  if (file.author) {
    if (file.author.name != null)
      tagFile.meta.authorName = String(file.author.name)
    if (file.author.url) tagFile.meta.authorUrl = file.author.url
  }

  // We need to do this `|| null`
  // because .relDirPath is `undefined` and .relativePath is `null`.
  // I do think we should just use `null` everywhere.
  tagFile.meta.relativePath = file.relDirPath || null
  tagFile.meta.absolutePath = file.absDirPath
  return tagFile
}

export default getTagFile
