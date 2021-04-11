import * as Uppy from '../';

(() => {
  const uppy = Uppy.Core({ autoProceed: false });
  uppy.use(Uppy.Dashboard, { trigger: '#up_load_file_01' });
  uppy.use(Uppy.DragDrop, { target: '#ttt' });
  uppy.use(Uppy.XHRUpload, {
    bundle: true,
    endpoint: 'xxx',
    fieldName: 'up_load_file'
  });
  uppy.on('upload-success', (fileCount, body, uploadurl) => {
    console.log(fileCount, body, uploadurl, ` files uploaded`);
  });
})();

(() => {
  const uppy = Uppy.Core({ autoProceed: false })
    .use(Uppy.Dashboard, { trigger: '#select-files' })
    .use(Uppy.GoogleDrive, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
    .use(Uppy.Instagram, { target: Uppy.Dashboard, companionUrl: 'https://companion.uppy.io' })
    .use(Uppy.Webcam, { target: Uppy.Dashboard })
    .use(Uppy.ScreenCapture, { target: Uppy.Dashboard })
    .use(Uppy.Zoom, { target: Uppy.Dashboard })
    .use(Uppy.Tus, { endpoint: 'https://tusd.tusdemo.net/files/' })
    .on('complete', (result) => {
      console.log('Upload result:', result);
    });
})();

(() => {
  const uppy = Uppy.Core();
  uppy.use(Uppy.DragDrop, { target: '.UppyDragDrop' });
  uppy.use(Uppy.Tus, { endpoint: '//tusd.tusdemo.net/files/' });
})();
