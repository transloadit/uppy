import { Uppy, type UppyFile } from '@uppy/core'
import { expectType, expectError } from 'tsd'
import type { AwsS3Part } from '@uppy/aws-s3-multipart'
import AwsS3 from '..'

{
  const uppy = new Uppy()
  uppy.use(AwsS3, {
    getUploadParameters(file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '' }
    },
  })
  expectError(
    uppy.use(AwsS3, {
      shouldUseMultipart: false,
      getUploadParameters(file) {
        expectType<UppyFile>(file)
        return { method: 'POST', url: '' }
      },
    }),
  )
  uppy.use(AwsS3, {
    shouldUseMultipart: false,
    getUploadParameters(file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '', fields: {} }
    },
  })
  expectError(
    uppy.use(AwsS3, {
      shouldUseMultipart: true,
      getUploadParameters(file) {
        expectType<UppyFile>(file)
        return { method: 'PUT', url: '' }
      },
    }),
  )
  uppy.use(AwsS3, {
    shouldUseMultipart: () => Math.random() > 0.5,
    getUploadParameters(file) {
      expectType<UppyFile>(file)
      return { method: 'PUT', url: '' }
    },
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
