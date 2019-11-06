import Uppy = require('@uppy/core');
import BackblazeB2 = require('../');

{
  const uppy = Uppy();
  uppy.use(BackblazeB2, {
    createMultipartUpload(file) {
      file // $ExpectType Uppy.UppyFile
    },
    listParts(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.fileId // $ExpectType string
    },
    getEndpoint(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.fileId // $ExpectType string
    },
    abortMultipartUpload(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.fileId // $ExpectType string
    },
    completeMultipartUpload(file, opts) {
      file // $ExpectType Uppy.UppyFile
      opts.fileId // $ExpectType string
      opts.parts[0] // $ExpectType BackblazeB2Multipart.BackblazeB2Part
    },
  });
}
