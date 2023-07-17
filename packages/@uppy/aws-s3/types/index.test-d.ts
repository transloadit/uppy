import { Uppy, UppyFile } from '@uppy/core'
import { expectType } from 'tsd'
import AwsS3 from '..'

{
  const uppy = new Uppy()
  uppy.use(AwsS3, {
    getUploadParameters (file) {
      expectType<UppyFile>(file)
      return { method: 'POST', url: '', fields: {}, headers: {} }
    },
  })
}
