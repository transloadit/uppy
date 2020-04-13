import { expectType } from 'tsd'
import Uppy = require('@uppy/core')
import AwsS3 = require('../')

{
  const uppy = Uppy<Uppy.StrictTypes>()
  uppy.use(AwsS3, {
    getUploadParameters (file) {
      expectType<Uppy.UppyFile>(file)
      return { url: '' }
    }
  })
}
