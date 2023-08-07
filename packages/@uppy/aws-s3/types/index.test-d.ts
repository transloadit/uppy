import { Uppy, UppyFile } from '@uppy/core'
import { expectType, expectError } from 'tsd'
import AwsS3 from '..'

{
  const uppy = new Uppy()
  uppy.use(AwsS3, {
    getUploadParameters (file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '' }
    },
  })
  expectError(uppy.use(AwsS3, {
    shouldUseMultipart: false,
    getUploadParameters (file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '' }
    },
  }))
  uppy.use(AwsS3, {
    shouldUseMultipart: false,
    getUploadParameters (file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '', fields: {} }
    },
  })
}
