import { expectError, expectType } from 'tsd'
import Uppy = require('@uppy/core')
import AwsS3Multipart = require('../')

{
  const uppy = Uppy<Uppy.StrictTypes>()
  uppy.use(AwsS3Multipart, {
    createMultipartUpload (file) {
      expectType<Uppy.UppyFile>(file)
      return { uploadId: '', key: '' }
    },
    listParts (file, opts) {
      expectType<Uppy.UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      return []
    },
    prepareUploadPart (file, part) {
      expectType<Uppy.UppyFile>(file)
      expectType<string>(part.uploadId)
      expectType<string>(part.key)
      expectType<Blob>(part.body)
      expectType<number>(part.number)
      return { url: '' }
    },
    abortMultipartUpload (file, opts) {
      expectType<Uppy.UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
    },
    completeMultipartUpload (file, opts) {
      expectType<Uppy.UppyFile>(file)
      expectType<string>(opts.uploadId)
      expectType<string>(opts.key)
      expectType<AwsS3Multipart.AwsS3Part>(opts.parts[0])
      return {}
    }
  })
}

{
  const uppy = Uppy<Uppy.StrictTypes>()
  expectError(uppy.use(AwsS3Multipart, { getChunkSize: 100 }))
  expectError(uppy.use(AwsS3Multipart, { getChunkSize: () => 'not a number' }))
  uppy.use(AwsS3Multipart, { getChunkSize: () => 100 })
  uppy.use(AwsS3Multipart, { getChunkSize: (file) => file.size })
}
