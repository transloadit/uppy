import Uppy = require('@uppy/core');
import AwsS3 = require('../');

{
  const uppy = Uppy();
  uppy.use(AwsS3, {
    getUploadParameters(file) {
      file // $ExpectType Uppy.UppyFile
    }
  });
}
