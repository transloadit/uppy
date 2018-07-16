import Uppy, { UppyFile } from '@uppy/core';
import AwsS3 from '../';

{
  const uppy = Uppy();
  uppy.use(AwsS3, {
    getUploadParameters(file) {
      file // $ExpectType UppyFile
    }
  });
}
