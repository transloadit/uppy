import { expectError, expectType } from 'tsd'
import Uppy from '@uppy/core'
import type { UppyFile } from '@uppy/core'
import AwsS3Multipart from '../'

{
  const uppy = new Uppy()
  uppy.use(AwsS3Multipart, {
    createMultipartUpload (file) {
      expectType<UppyFile>(file)
      return { uploadId: '', key: '' }
    },
    listParts (file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      return []
    },
    prepareUploadPart (file, part) {
      expectType<UppyFile>(file)
      expectType<string>(part.uploadId)
      expectType<string>(part.key)
      expectType<Blob>(part.body)
      expectType<number>(part.number)
      return { url: '' }
    },
    abortMultipartUpload (file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
    },
    completeMultipartUpload (file, opts) {
      expectType<UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      expectType<AwsS3Multipart.AwsS3Part>(opts.parts[0])
      return {}
    }
  })
}

{
  const uppy = new Uppy()
  expectError(uppy.use(AwsS3Multipart, { getChunkSize: 100 }))
  expectError(uppy.use(AwsS3Multipart, { getChunkSize: () => 'not a number' }))
  uppy.use(AwsS3Multipart, { getChunkSize: () => 100 })
  uppy.use(AwsS3Multipart, { getChunkSize: (file) => file.size })
}
