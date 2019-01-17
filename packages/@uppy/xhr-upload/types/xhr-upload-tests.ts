import Uppy = require('@uppy/core');
import XHRUpload = require('../');

{
  Uppy().use(XHRUpload, {
    bundle: false,
    endpoint: 'xyz'
  } as XHRUpload.XHRUploadOptions);
}
