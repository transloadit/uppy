import { expectError, expectType } from 'tsd'
import Uppy from '@uppy/core'
import type { UppyFile } from '@uppy/core'
import AwsS3Multipart from '..'
// eslint-disable-next-line no-restricted-syntax
import type { AwsS3Part } from '..'

{
  const uppy = new Uppy()
  uppy.use(AwsS3Multipart, {
    shouldUseMultipart: true,
    createMultipartUpload(file) {
      expectType<UppyFile>(file)
      return { uploadId: '', key: '' }
    },
    listParts(file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      return []
    },
    signPart(file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      expectType<Blob>(opts.body)
      expectType<AbortSignal>(opts.signal)
      return { url: '' }
    },
    abortMultipartUpload(file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
    },
    completeMultipartUpload(file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      expectType<AwsS3Part>(opts.parts[0])
      return {}
    },
  })
}

{
  const uppy = new Uppy()
  expectError(uppy.use(AwsS3Multipart, { companionUrl: '', getChunkSize: 100 }))
  expectError(
    uppy.use(AwsS3Multipart, {
      companionUrl: '',
      getChunkSize: () => 'not a number',
    }),
  )
  uppy.use(AwsS3Multipart, { companionUrl: '', getChunkSize: () => 100 })
  uppy.use(AwsS3Multipart, {
    companionUrl: '',
    getChunkSize: (file) => file.size,
  })
}
