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
  const uppy = Uppy();
  uppy.addFile({
    name: 'empty.json',
    data: new Blob(['null'], { type: 'application/json' }),
    meta: { path: 'path/to/file' }
  });
}
