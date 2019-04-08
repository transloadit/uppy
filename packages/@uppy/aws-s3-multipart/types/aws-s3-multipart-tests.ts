import Uppy = require('@uppy/core');
import AwsS3Multipart = require('../');

{
  const uppy = Uppy();
  uppy.use(AwsS3Multipart, {
    createMultipartUpload(file) {
      file // $ExpectType Uppy.UppyFile
    },
    listParts(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
    },
    prepareUploadPart(file, part) {
      file // $ExpectType Uppy.UppyFile
      part.uploadId // $ExpectType string
      part.key // $ExpectType string
      part.body // $ExpectType Blob
      part.number // $ExpectType number
    },
    abortMultipartUpload(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
    },
    completeMultipartUpload(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
      opts.parts[0] // $ExpectType AwsS3Multipart.AwsS3Part
    },
  });
}
