import Uppy, { UppyFile } from '@uppy/core';
import AwsS3Multipart, { AwsS3Part } from '../';

{
  const uppy = Uppy();
  uppy.use(AwsS3Multipart, {
    createMultipartUpload(file) {
      file // $ExpectType UppyFile
    },
    listParts(file, opts) {
      file // $ExpectType UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
    },
    prepareUploadPart(file, part) {
      file // $ExpectType UppyFile
      part.uploadId // $ExpectType string
      part.key // $ExpectType string
      part.body // $ExpectType Blob
      part.number // $ExpectType number
    },
    abortMultipartUpload(file, opts) {
      file // $ExpectType UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
    },
    completeMultipartUpload(file, opts) {
      file // $ExpectType UppyFile
      opts.uploadId // $ExpectType string
      opts.key // $ExpectType string
      opts.parts[0] // $ExpectType AwsS3Part
    },
  });
}
