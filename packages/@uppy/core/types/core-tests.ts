import Uppy, { UppyFile } from '../';

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
