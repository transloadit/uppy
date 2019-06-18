import Uppy = require('../');
import DefaultStore = require('@uppy/store-default');

{
  const uppy = Uppy();
  uppy.addFile({
    data: new Blob([new ArrayBuffer(1024)], { type: 'application/octet-stream' })
  });

  uppy.upload().then((result) => {
    result.successful[0]; // $ExpectType UppyFile
    result.failed[0]; // $ExpectType UppyFile
  });
}

{
  const store = DefaultStore();
  const uppy = Uppy({ store });
}

{
  const uppy = Uppy()
  // this doesn't exist but type checking works anyway :)
  const f = uppy.getFile('virtual')
  if (f && f.progress && f.progress.uploadStarted === null) {
    f.progress.uploadStarted = Date.now()
  }
}
